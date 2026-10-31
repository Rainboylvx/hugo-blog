---
title: "从轮询到中断：用 GPIO0 外部中断控制 DNESP32S3 LED"
date: 2026-10-02
draft: true
toc: true
weight: 4
tags: ["ESP32-S3", "ESP-IDF", "GPIO", "外部中断", "FreeRTOS", "BSP", "LED"]
---

[第 03 课](./03-dnesp32s3-boot-key-control-led.md)每 10 ms 轮询一次 BOOT 按键。这种写法容易理解，但即使一直不按键，任务也会定时醒来读取 GPIO。本课跟学《DNESP32S3 使用指南（IDF 版）》第 12 章，改用 **GPIO 外部中断**：GPIO0 出现下降沿时，ISR 投递事件，再由普通 FreeRTOS 任务消抖并控制 LED。

配套工程位于 [`examples/04-gpio-interrupt-led/`](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/04-gpio-interrupt-led/)。工程沿用前几课的 GPIO1 红色 LED 和 GPIO0 BOOT 按键，将中断响应与按键处理分开。

> [!INFO] 验证范围
> 工程已按 ESP-IDF v5.5.5 的 API 编写，包含 `idf.py set-target esp32s3`、构建和烧录所需文件。本文的验收范围限于源码和构建；按键消抖效果仍需接上目标开发板，通过连续短按、长按人工验证。

## 1. 先核对两个引脚

本课没有增加外部接线。正点原子 DNESP32S3 V1.2 的原理图给出：

| 资源 | GPIO | 有效状态 | 本课用途 |
| --- | --- | --- | --- |
| 红色用户 LED | GPIO1 | 低电平点亮 | 观察中断事件是否被接受 |
| BOOT 按键 | GPIO0 | 按下接地，低电平 | 下降沿触发 GPIO 中断 |

GPIO0 还是 ESP32-S3 的启动配置脚。开发板复位或上电时一直按住 BOOT，芯片可能进入下载模式。实验时先松开按键，让程序正常启动。

GPIO1 的 LED 电路仍然是 `3.3 V → 限流电阻 → LED → GPIO1`，所以应用层的 `led_set(true)` 最终写入低电平。判断 LED 极性时，要核对板卡原理图和 BSP 中的电平转换，不能只凭亮灭现象猜测。

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

中断并不能自动消除机械抖动。按下一次按键，可能在短时间内产生多个边沿，因此 ISR 只负责快速记录事件，不能把每个边沿都当作一次有效按下。

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

`EXIT` 是教材对外部中断驱动的命名。应用通过初始化参数把事件队列传给 BSP，不需要了解 GPIO 中断服务的内部细节。

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

这段 ISR 需要同时满足四个约束：

1. ISR 带有 `IRAM_ATTR`，并通过 `ESP_INTR_FLAG_IRAM` 安装 GPIO ISR 服务；
2. 使用 `xQueueSendFromISR()`，不能在中断上下文调用普通的 `xQueueSend()`；
3. 队列中的数据是一个简单的整数，避免在 ISR 中分配内存或访问复杂对象；
4. `higher_priority_task_woken` 为真时请求一次任务切换，让等待队列的任务尽快运行。

ISR 没有 `ESP_LOGI()`、`vTaskDelay()`、`gpio_set_level()` 或消抖循环。这些操作要么可能阻塞，要么工作量不可控，都不适合放在中断上下文。

### 队列保存的是数值副本，不是指针

本工程创建队列时写的是：

```c
QueueHandle_t event_queue = xQueueCreate(8, sizeof(uint32_t));
```

第二个参数规定了**每个队列元素的大小**，这里每个槽位保存一个 `uint32_t` 的值。发送和接收时，`&gpio_num` 告诉 FreeRTOS 从哪里读取数据，或把数据写到哪里：

```text
ISR 中的 gpio_num       --发送-->  队列内部的 4 字节副本
任务中的 gpio_num       <--接收--  队列内部的 4 字节副本
```

- `xQueueSendFromISR(..., &gpio_num, ...)`：从 ISR 局部变量的地址读取 4 字节，复制到队列；
- `xQueueReceive(..., &gpio_num, ...)`：把队列中的 4 字节复制到任务自己的局部变量；
- 两处的 `gpio_num` 是两个不同的变量，名字相同不代表它们共享地址。

`&gpio_num` 是地址，**队列保存的是它指向的数值副本，不是地址本身**。ISR 返回后，其中的局部变量就不再有效，但数值已经复制到队列中，任务仍然可以安全读取自己的副本。

要让队列保存指针值，需要把元素大小设为指针的大小。例如，大结构体不适合频繁整体复制时，可以这样设计：

```c
QueueHandle_t queue = xQueueCreate(8, sizeof(MyStruct *));
MyStruct *p = malloc(sizeof(*p));
xQueueSend(queue, &p, portMAX_DELAY);  // 拷贝的是地址值
```

这里的 `&p` 仍然是数据的来源地址，队列复制的是指针 `p` 的值。这种设计需要约定清楚内存所有权：接收端取出指针后负责使用并 `free()`，避免内存泄漏或重复释放。本课只传递一个 GPIO 编号，直接按值拷贝更简单，也不需要动态内存。

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

BOOT 松开时，内部上拉使 GPIO0 保持高电平；按下时，GPIO0 接地，电平由高变低，因此配置为下降沿触发，即 `GPIO_INTR_NEGEDGE`。

`gpio_install_isr_service()` 安装共享的 GPIO 中断服务，`gpio_isr_handler_add()` 为 GPIO0 注册回调函数。同一个应用只安装一次服务，不要在每次按键时重复安装。

## 6. 普通任务完成消抖和业务处理

任务从队列收到事件后，先延时 20 ms，再读取 GPIO0，确认按键仍处于低电平：

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

这样，一直按住 BOOT 也只会翻转一次 LED。等待松开期间，如果触点抖动再次产生下降沿，事件最多暂存在队列中；松开后的 20 ms 稳定期会把已经失效的边沿过滤掉。

这种消抖方式适合入门实验。用于产品时还需考虑具体场景：高频按键、旋转编码器或需要记录每个边沿的场景，应使用专门的状态机、硬件滤波或定时采样方案，并明确队列溢出时如何处理。

## 7. 按依赖顺序启动

`app_main()` 按 LED 初始化、创建队列、中断初始化、创建任务的顺序启动：

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

## 用到的 FreeRTOS 函数查询表

本课用到的接口集中列在下面。名称链接到 ESP-IDF v5.5.5 的官方文档；宏的定义链接到该版本的官方源码。

| 函数或宏 | 本课用途 | 调用环境 |
| --- | --- | --- |
| [`xTaskCreate()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#xTaskCreate__TaskFunction_t.cCPC.configSTACK_DEPTH_TYPEC.voidPC.UBaseType_t.TaskHandle_tPC) | 创建处理按键事件的任务 | 任务中，不能在 ISR 中调用 |
| [`xQueueCreate()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#c.xQueueCreate) | 创建保存 GPIO 编号的队列 | 任务中，不能在 ISR 中调用 |
| [`xQueueSendFromISR()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#c.xQueueSendFromISR) | 从 GPIO 中断向队列发送事件 | ISR 中，不等待空位 |
| [`xQueueReceive()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#xQueueReceive__QueueHandle_t.voidPC.TickType_t) | 从队列取出 GPIO 编号 | 任务中，不能在 ISR 中调用 |
| [`vTaskDelay()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#vTaskDelay__TickType_tC) | 消抖、等待按键松开时暂停当前任务 | 任务中，不能在 ISR 中调用 |
| [`pdMS_TO_TICKS()`](https://github.com/espressif/esp-idf/blob/v5.5.5/components/freertos/FreeRTOS-Kernel/include/freertos/projdefs.h) | 将毫秒换算为 tick 数 | 计算宏，任务和 ISR 中均可使用 |
| [`portYIELD_FROM_ISR()`](https://github.com/espressif/esp-idf/blob/v5.5.5/components/freertos/FreeRTOS-Kernel/portable/xtensa/include/freertos/portmacro.h) | 唤醒更高优先级任务后请求切换 | ISR 中 |

### 创建任务：`xTaskCreate()`

对照第 7 节的调用，六个参数依次是：

| 本文传入的值 | 含义 |
| --- | --- |
| `exit_task` | 任务入口函数，创建后由调度器安排运行 |
| `"exit_task"` | 任务名称，便于调试时辨认 |
| `3072` | 任务栈大小；**ESP-IDF 中的单位是字节**，这里是 3072 字节 |
| 第一个 `NULL` | 不向任务入口传递参数 |
| `5` | 任务优先级，数值越大，优先级越高 |
| 最后一个 `NULL` | 不接收新任务的句柄；若需要保存句柄，可传入句柄变量的地址 |

创建成功返回 `pdPASS`；内存不足时返回 `errCOULD_NOT_ALLOCATE_REQUIRED_MEMORY`。本文用 `== pdPASS` 检查是否成功。

### 创建队列：`xQueueCreate()`

`xQueueCreate(8, sizeof(uint32_t))` 的第一个参数是队列容量，即最多暂存 8 个元素；第二个参数是每个元素的字节数，即每次复制一个 GPIO 编号。

成功时返回 `QueueHandle_t` 类型的队列句柄，失败时返回 `NULL`。句柄用于后续发送和接收，不是队列中的某个元素。

### 中断发送：`xQueueSendFromISR()`

`xQueueSendFromISR(s_event_queue, &gpio_num, &higher_priority_task_woken)` 的三个参数依次是：

- `s_event_queue`：要写入的队列句柄。
- `&gpio_num`：待复制数据的来源地址，复制大小由创建队列时的元素大小决定。
- `&higher_priority_task_woken`：输出标志的地址。如果这次发送唤醒了更高优先级的任务，标志会被置为 `pdTRUE`。

发送成功返回 `pdTRUE`，队列已满则返回 `errQUEUE_FULL`。它没有等待时间参数，不能留在 ISR 中等队列腾出空位。本课 ISR 没有检查这个返回值，因此队列满时，该次事件不会入队。

`higher_priority_task_woken` 在调用前初始化为 `pdFALSE`，调用后若为 `pdTRUE`，再执行 `portYIELD_FROM_ISR()` 请求任务切换。这个标志表示是否需要切换任务，**不表示发送是否成功**；发送结果应看函数返回值。

### 任务接收：`xQueueReceive()`

`xQueueReceive(exit_event_queue(), &gpio_num, portMAX_DELAY)` 的三个参数依次是：

- `exit_event_queue()`：本工程 BSP 提供的函数，返回前面创建的队列句柄；它不是 FreeRTOS API。
- `&gpio_num`：接收缓冲区地址，队列中的数值会复制到这个变量中。
- `portMAX_DELAY`：等待时间参数。本课用它等待事件，队列为空时任务阻塞，不会反复读取 GPIO。

接收成功返回 `pdTRUE`，并从队列移除该元素；在等待期限内未收到元素则返回 `pdFALSE`。等待参数的单位是 tick，传 `0` 表示不等待、立即返回。`portMAX_DELAY` 在 `INCLUDE_vTaskSuspend` 为 `1` 时表示无限期等待。

### 延时与时间换算：`vTaskDelay()`、`pdMS_TO_TICKS()`

`vTaskDelay(pdMS_TO_TICKS(20))` 分两步理解：`pdMS_TO_TICKS(20)` 按 tick 频率把 20 ms 换算成 tick 数，`vTaskDelay()` 再让当前任务阻塞相应的 tick 数，期间其他就绪任务可以运行。`vTaskDelay()` 没有返回值。

不要直接写 `vTaskDelay(20)` 来表示 20 ms：这里的 `20` 是 tick 数。换算结果受 tick 频率和整数取整影响，任务何时继续运行还取决于调度，因此它不保证精确延时 20 ms。

### 常量和扩展示例中的接口

- `pdTRUE`、`pdFALSE`：分别表示真、假；本文用于判断收发结果和是否需要任务切换。
- `pdPASS`：成功状态，本文用于检查任务创建结果。它们的定义可查阅官方源码 [`projdefs.h`](https://github.com/espressif/esp-idf/blob/v5.5.5/components/freertos/FreeRTOS-Kernel/include/freertos/projdefs.h)。
- [`xQueueSend()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#c.xQueueSend)：只出现在第 4 节传递结构体指针的扩展示例中，配套工程没有调用。三个参数分别是队列句柄、数据来源地址和最长等待 tick 数；成功返回 `pdPASS`，队列满且等待后仍无法发送时返回 `errQUEUE_FULL`。它用于任务上下文，不能替换 ISR 中的 `xQueueSendFromISR()`。

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

教材配套的 `03_exit` 工程同样使用 GPIO0 下降沿、内部上拉、`gpio_install_isr_service()` 和 `gpio_isr_handler_add()`。本工程沿用这些引脚配置和 API，将按键处理移到任务中，具体差异如下：

| 位置 | 官方示例 | 本工程 |
| --- | --- | --- |
| ISR | 直接调用 `LED_TOGGLE()` | 用 `xQueueSendFromISR()` 投递 GPIO 编号 |
| 消抖 | 没有软件消抖 | 普通任务延时确认电平并等待松开 |
| LED 控制 | 中断里读写 GPIO | 任务里调用 `led_set()` |
| 错误处理 | 驱动函数多为 `void` | 初始化返回 `esp_err_t`，应用用 `ESP_ERROR_CHECK()` |
| 组件组织 | 官方 BSP 宏和课程注释 | `LED`、`EXIT` 分目录，应用只组合接口 |

官方实现演示了如何通过 GPIO 中断回调翻转 LED。本工程把事件送到任务，方便后续扩展：同一个队列可以交给处理按键、串口或传感器事件的任务，也可以在任务中加入日志、消抖和状态机，保持 ISR 简短。

## 10. 小结

- GPIO0 的下降沿触发外部中断，GPIO1 低电平点亮红色 LED。
- ISR 只做固定、快速、可在 IRAM 中执行的队列投递。
- FreeRTOS 任务负责 20 ms 消抖、确认按下、等待松开和 LED 控制。
- `gpio_install_isr_service()`、`gpio_isr_handler_add()` 和 `gpio_intr_enable()` 是注册 GPIO 中断的三个关键步骤。
- 中断能避免反复轮询，但不能替代消抖；GPIO 边沿和有效按下仍需分开处理。

下一步可以把本课的事件队列与[第 05 课的任务、队列和任务通知](./05-freertos-task-queue-notify.md)结合，比较“GPIO ISR → 队列 → LED 任务”和“任务通知”的适用边界。

## 参考资料

- 《DNESP32S3 使用指南（IDF 版）》第 12 章 EXIT 实验
- 正点原子课程源码 `03_exit`
- [ESP-IDF GPIO API 文档](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/peripherals/gpio.html)
- [配套示例工程](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/04-gpio-interrupt-led/)
