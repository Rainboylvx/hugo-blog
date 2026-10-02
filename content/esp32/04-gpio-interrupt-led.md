---
title: "从轮询到中断：用 GPIO0 外部中断控制 DNESP32S3 LED"
date: 2026-10-02
draft: true
toc: true
weight: 4
tags: ["ESP32-S3", "ESP-IDF", "GPIO", "外部中断", "FreeRTOS", "BSP", "LED"]
---

[第 03 课](./03-dnesp32s3-boot-key-control-led.md)每 10 ms 轮询一次 BOOT 按键。这种写法容易理解，但任务即使按键一年不按，也会一直醒来读取 GPIO。本课跟学《DNESP32S3 使用指南（IDF 版）》第 12 章，改用 **GPIO 外部中断**：GPIO0 出现下降沿时由 ISR 产生事件，普通 FreeRTOS 任务再完成消抖和 LED 控制。

配套工程位于 [`examples/04-gpio-interrupt-led/`](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/04-gpio-interrupt-led/)。工程沿用前几课的 GPIO1 红色 LED 和 GPIO0 BOOT 按键，但把中断与业务处理分成两层。

> [!INFO] 验证范围
> 工程已按 ESP-IDF v5.5.5 的 API 编写，包含 `idf.py set-target esp32s3`、构建和烧录所需文件。本文先以源码和构建验收为准；GPIO 按键的消抖效果仍需要在接上目标开发板后人工连续短按、长按验证。

## 1. 先核对两个引脚

本课没有增加外部接线。正点原子 DNESP32S3 V1.2 的原理图给出：

| 资源 | GPIO | 有效状态 | 本课用途 |
| --- | --- | --- | --- |
| 红色用户 LED | GPIO1 | 低电平点亮 | 观察中断事件是否被接受 |
| BOOT 按键 | GPIO0 | 按下接地，低电平 | 下降沿触发 GPIO 中断 |

GPIO0 还是 ESP32-S3 的启动配置脚。开发板复位或上电时一直按住 BOOT，芯片可能进入下载模式；运行程序时先松开按键，再进行实验。

GPIO1 的 LED 电路仍然是 `3.3 V → 限流电阻 → LED → GPIO1`，所以应用层的 `led_set(true)` 最终写入低电平。LED 的极性不应从“亮或灭的现象”猜，而应以板卡原理图和 BSP 中的转换为准。

## 2. 轮询和中断的职责差异

第 03 课的任务大致是：

```text
每 10 ms 读取 GPIO0
    ├─ 读到低电平：延时后再次读取，确认一次按下
    └─ 读到高电平：确认松开，允许下一次按下
```

中断版本把“什么时候发生了边沿”交给 GPIO 外设：

```text
GPIO0 下降沿
    -> GPIO ISR（只投递引脚号）
    -> FreeRTOS 队列
    -> 普通任务延时消抖、确认电平
    -> 翻转 GPIO1 LED，等待按键松开
```

中断并不自动解决机械抖动。一次真实按下可能产生多个快速边沿，因此 ISR 只负责低成本地记录事件，不能直接把每一个边沿都当作一次业务按键。

## 3. 工程结构

```text
04-gpio-interrupt-led/
├── CMakeLists.txt
├── sdkconfig.defaults
├── main/
│   ├── CMakeLists.txt
│   └── main.c                 # 队列、消抖任务和应用日志
└── components/
    └── BSP/
        ├── CMakeLists.txt
        ├── LED/
        │   ├── led.c          # GPIO1、低电平点亮
        │   └── led.h
        └── EXIT/
            ├── exit.c         # GPIO0 配置和 ISR
            └── exit.h
```

`EXIT` 是教材对外部中断驱动的命名。这里的 BSP 接口不暴露 GPIO 中断服务的内部细节，只把事件队列作为初始化参数传入。

`main` 与 BSP 的依赖在 `main/CMakeLists.txt` 中声明：

```cmake
idf_component_register(SRCS "main.c"
                    INCLUDE_DIRS "."
                    PRIV_REQUIRES BSP freertos esp_driver_gpio)
```

`esp_driver_gpio` 是 ESP-IDF v5.5 中 GPIO 驱动组件的依赖名；不要把旧版本示例中的组件名原样照抄到新工程。

## 4. ISR 只投递事件

`EXIT` 模块保存一个由应用创建的队列句柄。GPIO 服务调用 ISR 时，把 GPIO0 的编号复制到队列中：

```c
static QueueHandle_t s_event_queue;

static void IRAM_ATTR boot_gpio_isr(void *arg)
{
    const uint32_t gpio_num = (uint32_t)(uintptr_t)arg;
    BaseType_t higher_priority_task_woken = pdFALSE;

    xQueueSendFromISR(s_event_queue,
                      &gpio_num,
                      &higher_priority_task_woken);
    if (higher_priority_task_woken == pdTRUE) {
        portYIELD_FROM_ISR();
    }
}
```

这里有四个需要同时满足的约束：

1. ISR 带有 `IRAM_ATTR`，并通过 `ESP_INTR_FLAG_IRAM` 安装 GPIO ISR 服务；
2. 使用 `xQueueSendFromISR()`，不能在中断上下文调用普通的 `xQueueSend()`；
3. 队列中的数据是一个简单的整数，避免在 ISR 中分配内存或访问复杂对象；
4. `higher_priority_task_woken` 为真时请求一次任务切换，让等待队列的任务尽快运行。

ISR 没有 `ESP_LOGI()`、`vTaskDelay()`、`gpio_set_level()` 或消抖循环。这些操作要么可能阻塞，要么工作量不可控，都不适合放在中断上下文。

## 5. 配置下降沿和注册服务

`exit_init()` 先配置 GPIO0，再安装共享 ISR 服务和本引脚的处理函数：

```c
const gpio_config_t config = {
    .pin_bit_mask = 1ULL << BOOT_INT_GPIO_PIN,
    .mode = GPIO_MODE_INPUT,
    .pull_up_en = GPIO_PULLUP_ENABLE,
    .pull_down_en = GPIO_PULLDOWN_DISABLE,
    .intr_type = GPIO_INTR_NEGEDGE,
};

ESP_ERROR_CHECK(gpio_config(&config));
ESP_ERROR_CHECK(gpio_install_isr_service(ESP_INTR_FLAG_IRAM));
ESP_ERROR_CHECK(gpio_isr_handler_add(BOOT_INT_GPIO_PIN,
                                     boot_gpio_isr,
                                     (void *)(uintptr_t)BOOT_INT_GPIO_PIN));
ESP_ERROR_CHECK(gpio_intr_enable(BOOT_INT_GPIO_PIN));
```

BOOT 松开时内部上拉把 GPIO0 保持为高电平，按下时接地形成高到低的变化，所以使用 `GPIO_INTR_NEGEDGE` 表示下降沿。

`gpio_install_isr_service()` 负责安装一个共享的 GPIO 中断服务；`gpio_isr_handler_add()` 再把 GPIO0 映射到自己的回调。只在同一个应用里安装一次服务，不能每次按键时重复安装。

## 6. 普通任务完成消抖和业务处理

任务从队列收到事件后，先延时 20 ms，再读取 GPIO0 确认按键仍然为低：

```c
if (xQueueReceive(exit_event_queue(), &gpio_num, portMAX_DELAY) != pdTRUE) {
    continue;
}

vTaskDelay(pdMS_TO_TICKS(20));
if (gpio_get_level(BOOT_INT_GPIO_PIN) != 0) {
    continue;
}

led_on = !led_on;
ESP_ERROR_CHECK(led_set(led_on));
ESP_LOGI(TAG, "BOOT press accepted, LED %s",
         led_on ? "on" : "off");
```

确认一次有效按下后，任务继续等待 GPIO0 回到高电平：

```c
while (gpio_get_level(BOOT_INT_GPIO_PIN) == 0) {
    vTaskDelay(pdMS_TO_TICKS(10));
}
vTaskDelay(pdMS_TO_TICKS(20));
```

这一步使“一直按住 BOOT”只对应一次翻转。等待松开期间如果按键触点抖动再次产生下降沿，事件最多暂存在队列中；松开后的 20 ms 稳定期会把已经失效的边沿过滤掉。

这是一种适合入门实验的消抖策略，不是所有产品都应照搬。高频按键、旋转编码器或需要记录每个边沿的场景，应使用专门的状态机、硬件滤波或定时采样方案，并为队列溢出制定明确策略。

## 7. 按依赖顺序启动

`app_main()` 的顺序是“先准备消费者，再打开事件源”：

```c
ESP_ERROR_CHECK(led_init());

QueueHandle_t event_queue = xQueueCreate(8, sizeof(uint32_t));
ESP_ERROR_CHECK(event_queue != NULL ? ESP_OK : ESP_ERR_NO_MEM);

ESP_ERROR_CHECK(exit_init(event_queue));
ESP_ERROR_CHECK(xTaskCreate(exit_task,
                            "exit_task",
                            3072,
                            NULL,
                            5,
                            NULL) == pdPASS
                    ? ESP_OK
                    : ESP_ERR_NO_MEM);
```

先创建队列，再把队列交给 `exit_init()`，最后创建等待队列的任务。GPIO 中断在初始化后就可能发生，所以队列句柄必须在安装 ISR 之前有效。开发板启动时若 BOOT 仍被按住，初始化完成后可能立即产生一个下降沿；实验时应在复位完成前松开按键。

## 8. 编译、烧录与验收

在工程根目录执行：

```bash
source "$HOME/.espressif/tools/activate_idf_v5.5.5.sh"
idf.py --version
idf.py set-target esp32s3
idf.py build
```

确认 `build` 成功后，插拔开发板比较串口列表，再替换实际端口：

```bash
idf.py -p '/dev/cu.开发板实际端口' flash monitor
```

串口启动后应看到：

```text
Ready: press BOOT to toggle LED
```

每次短按 BOOT 应看到一条 `BOOT press accepted`，并观察红色 LED 改变一次状态。按住 BOOT 两秒，LED 不应连续快速翻转；松开后再次短按，才允许下一次翻转。

如果按键完全没有反应，先检查：

- 是否把串口线插在真正的 ESP32-S3 开发板上；
- 上电或复位时是否仍按住 GPIO0，导致芯片进入下载模式；
- 原理图和 `BOOT_INT_GPIO_PIN` 是否都为 GPIO0；
- GPIO0 是否被其他外设或调试配置占用。

## 9. 与官方 `03_exit` 对答案

教材配套的 `03_exit` 工程同样使用 GPIO0 下降沿、内部上拉、`gpio_install_isr_service()` 和 `gpio_isr_handler_add()`。本工程保留这些硬件和 API 关系，但有一处刻意的架构差异：

| 位置 | 官方示例 | 本工程 |
| --- | --- | --- |
| ISR | 直接调用 `LED_TOGGLE()` | 用 `xQueueSendFromISR()` 投递 GPIO 编号 |
| 消抖 | 没有软件消抖 | 普通任务延时确认电平并等待松开 |
| LED 控制 | 中断里读写 GPIO | 任务里调用 `led_set()` |
| 错误处理 | 驱动函数多为 `void` | 初始化返回 `esp_err_t`，应用用 `ESP_ERROR_CHECK()` |
| 组件组织 | 官方 BSP 宏和课程注释 | `LED`、`EXIT` 分目录，应用只组合接口 |

官方实现适合展示“GPIO 中断回调会被调用”。把事件送到任务则更容易扩展：后续可以把同一个队列交给按键、串口或传感器事件消费者，也能在任务中加入日志、消抖和状态机，而不用让 ISR 变复杂。

## 10. 小结

- GPIO0 的下降沿触发外部中断，GPIO1 低电平点亮红色 LED。
- ISR 只做固定、快速、可在 IRAM 中执行的队列投递。
- FreeRTOS 任务负责 20 ms 消抖、确认按下、等待松开和 LED 控制。
- `gpio_install_isr_service()`、`gpio_isr_handler_add()` 和 `gpio_intr_enable()` 是注册 GPIO 中断的三个关键步骤。
- 中断能避免无意义的轮询，但不能替代消抖；硬件事件和应用事件仍要分层处理。

下一步可以把本课的事件队列与[第 05 课的任务、队列和任务通知](./05-freertos-task-queue-notify.md)结合，比较“GPIO ISR → 队列 → LED 任务”和“任务通知”的适用边界。

## 参考资料

- 《DNESP32S3 使用指南（IDF 版）》第 12 章 EXIT 实验
- 正点原子课程源码 `03_exit`
- [ESP-IDF GPIO API 文档](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/peripherals/gpio.html)
- [配套示例工程](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/04-gpio-interrupt-led/)
