---
title: "esp_timer：用高精度软件定时器调度周期任务"
date: 2026-09-26
draft: true
toc: true
weight: 6
tags: ["ESP32-S3", "ESP-IDF", "FreeRTOS", "esp_timer", "定时器", "LED", "BSP"]
---

[第 05 课](./05-freertos-task-queue-notify.md)已经让普通任务通过通知协作。这一课跟学《DNESP32S3 使用指南（IDF 版）》第 14 章，使用 `esp_timer` 每隔 1 秒调度一次 LED 翻转。

教材和官方 `05_esptim` 工程直接在回调中执行 `LED_TOGGLE()`。这个实验可以运行，但默认 ESP Timer 回调共用一个高优先级任务，这一点在示例中不明显。本课保持相同的闪灯效果，将定时、通知和 LED 处理分开：

1. `esp_timer` 负责产生稳定的周期事件；
2. 回调只调用 `xTaskNotifyGive()`，不阻塞、不打印日志；
3. `led_task` 被通知唤醒后，再操作 GPIO、保存 LED 状态并打印实际间隔。

配套工程位于 [`examples/06-esp-timer-periodic-led/`](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/06-esp-timer-periodic-led/)。

> [!INFO] 验证范围
> 当前简化版已在默认配置的隔离副本中通过 ESP-IDF v5.5.5 编译，本次未重新烧录。此前版本曾通过 `/dev/cu.usbmodem31101` 烧录，Monitor 连续记录 9 次周期事件，第一次间隔为 `1000090 us`，之后为 `999984～1000000 us`，没有出现累计通知，GPIO1 每秒翻转且 LED 物理明灭已人工确认。后文保留这些旧版记录，新固件仍需重新验收。

## 一图看懂关键调用

实线表示同一执行路径上的顺序，虚线表示任务调度、回调触发或消息传递；它们不表示跨任务的直接函数调用。

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 20, "rankSpacing": 24, "padding": 10, "subGraphTitleMargin": {"top": 8, "bottom": 16}}}}%%
flowchart TB
    A["app_main()：led_init()<br/>xTaskCreate(led_task, &quot;led_task&quot;,<br/>3072, NULL, 5, &amp;handle)"]
    A --> B["esp_timer_create()<br/>callback = periodic_timer_callback<br/>arg = handle；ESP_TIMER_TASK<br/>esp_timer_start_periodic(timer, 1000000)"]
    A -. "调度器运行 LED 任务" .-> R
    B -. "每 1 秒，由公共定时器任务派发" .-> C
    C["periodic_timer_callback(arg)<br/>xTaskNotifyGive((TaskHandle_t)arg)"]
    C -. "累计通知次数" .-> R
    R["led_task：阻塞等通知<br/>n = ulTaskNotifyTake(pdTRUE,<br/>portMAX_DELAY)"]
    R --> L["按 n 次更新 led_on<br/>led_set(led_on)<br/>esp_timer_get_time() 计算处理间隔"]
    L --> R
```

`handle` 对应 `led_task_handle`。先创建任务，再把句柄放进定时器的 `arg`。默认回调在任务上下文运行，使用普通 `xTaskNotifyGive()`；LED 任务等待通知时不轮询 GPIO。`app_main()` 返回后，这个任务和周期定时器继续运行。

## 1. 硬件目标：仍然控制 GPIO1 红色 LED

ESP Timer 是 ESP32-S3 的片上资源，不需要外接信号线。本实验仍只通过 GPIO1 红色用户 LED 观察结果。

![DNESP32S3 板载红色 LED 与 GPIO1 的连接](./assets/02-led/led-circuit.png)

*图 1：红色用户 LED 连接 GPIO1，并且低电平点亮。图源：正点原子 DNESP32S3 V1.2 原理图。*

程序启动时 LED 熄灭，此后每隔 1 秒翻转一次：

| 时间 | GPIO1 逻辑状态 | LED |
| --- | --- | --- |
| 启动 | 高电平 | 熄灭 |
| 约 1 秒 | 低电平 | 点亮 |
| 约 2 秒 | 高电平 | 熄灭 |
| 约 3 秒 | 低电平 | 点亮 |

这里的“周期为 1 秒”指**每隔 1 秒改变一次状态**。一个完整的亮灭循环需要约 2 秒。

## 2. `vTaskDelay()` 和 `esp_timer` 有什么区别

第 02、03、05 课已经多次使用：

```c
vTaskDelay(pdMS_TO_TICKS(1000));
```

它让当前任务按 1000 ms 换算出的 tick 数阻塞，实际恢复时间还受 tick 粒度和调度影响。任务恢复执行后还要完成自己的工作，再次调用延时，因此循环周期会包含代码执行和调度等待时间。

`esp_timer_start_periodic()` 则创建一条独立的周期时间线。周期参数使用微秒：

```c
esp_timer_start_periodic(timer, 1000000ULL);  // 1 秒
```

![FreeRTOS 延时、ESP Timer 与硬件定时外设的适用范围](./assets/06-esp-timer/timer-choice.svg)

*图 2：时间单位只是选择依据之一，还要考虑回调延迟和业务需求。*

| 工具 | 时间基础 | 适合做什么 |
| --- | --- | --- |
| `vTaskDelay()` | FreeRTOS tick | 让当前任务延时、降低轮询频率 |
| `xTaskDelayUntil()` | FreeRTOS tick | tick 粒度的固定周期任务 |
| `esp_timer` | 微秒，分辨率 1 μs | 单次延时、周期采样、软件超时 |
| GPTimer / RMT / LEDC | 专用硬件外设 | 更严格的时序、捕获、波形与 PWM |

> [!IMPORTANT] 分辨率不等于回调延迟
> ESP Timer 的时间分辨率是 1 μs，API 也使用微秒，但默认回调仍要等 `esp_timer` 任务得到调度。系统负载、其他定时器回调和 Flash 操作都可能让实际派发稍晚。需要产生严格硬件波形时，应选择 GPTimer、RMT 或 LEDC 等专用外设。

## 3. 默认回调不是“定时器中断函数”

`esp_timer_create_args_t.dispatch_method` 决定回调从哪里执行：

| 派发方式 | 回调上下文 | 特点 |
| --- | --- | --- |
| `ESP_TIMER_TASK` | 高优先级 `esp_timer` 任务 | 默认方式，所有回调串行执行 |
| `ESP_TIMER_ISR` | 中断上下文 | 延迟更低，限制更多，需要配置支持 |

本课明确写出：

```c
.dispatch_method = ESP_TIMER_TASK,
```

因此 `periodic_timer_callback()` 是**任务上下文回调**，不是 ISR。它可以使用普通的 `xTaskNotifyGive()`；如果改成 `ESP_TIMER_ISR`，就必须重新检查全部 API，使用相应的 ISR 安全版本，不能只改一个枚举值。

![ESP Timer 默认任务派发方式的执行流程](./assets/06-esp-timer/dispatch-flow.svg)

*图 3：底层中断唤醒 ESP Timer 任务，ESP Timer 任务再串行调用各个回调。*

默认派发方式下，某个回调如果执行大量日志、文件操作或长时间计算，会推迟排在后面的其他回调。因此本课把回调限制为一次任务通知。

## 4. 工程结构与组件依赖

本课不再使用按键，只复用 LED BSP：

```text
06-esp-timer-periodic-led/
├── CMakeLists.txt
├── sdkconfig.defaults
├── main/
│   ├── CMakeLists.txt
│   └── main.c                 # 定时器、回调、任务通知和业务逻辑
└── components/
    └── BSP/
        ├── CMakeLists.txt
        └── LED/
            ├── led.c          # GPIO1、低电平点亮
            └── led.h
```

`main/CMakeLists.txt` 声明三个私有依赖：

```cmake
# main 使用 BSP、FreeRTOS 任务通知和 ESP Timer。
idf_component_register(SRCS "main.c"
                    INCLUDE_DIRS "."
                    PRIV_REQUIRES BSP freertos esp_timer)
```

- `BSP` 来自工程的 `components/BSP/`；
- `freertos` 提供任务和任务通知；
- `esp_timer` 提供高分辨率软件定时器。

## 5. 先写一个只发送通知的短回调

```c
static void periodic_timer_callback(void *arg)
{
    xTaskNotifyGive((TaskHandle_t)arg);
}
```

创建定时器时，`arg` 保存 LED 任务句柄。每次到期，ESP Timer 会把这个指针原样传给回调。回调因此不需要读取可变的全局任务句柄。

回调没有做这些事：

- 不调用 `vTaskDelay()` 或等待队列；
- 不直接翻转 GPIO；
- 不执行 `ESP_LOGI()`；
- 不进行文件、网络或复杂计算。

任务通知值相当于计数器。即使 LED 任务暂时来不及运行，多次 `xTaskNotifyGive()` 也能先累计；如果只用布尔标志，就无法区分一次和多次通知。

## 6. LED 任务处理真正的工作

```c
static void led_task(void *arg)
{
    (void)arg;
    bool led_on = false;
    uint32_t total_expirations = 0;
    int64_t previous_time_us = esp_timer_get_time();

    while (1) {
        /* pdTRUE：读取后清零通知计数，不占用 CPU 轮询。 */
        const uint32_t expirations = ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
        const int64_t now_us = esp_timer_get_time();
        const int64_t elapsed_us = now_us - previous_time_us;
        previous_time_us = now_us;

        /* 任务来不及运行时多次通知会合并成 >1 的计数，逐次翻转才能保住奇偶。 */
        for (uint32_t i = 0; i < expirations; ++i) {
            led_on = !led_on;
        }

        total_expirations += expirations;
        led_set(led_on);

        ESP_LOGI(TAG,
                 "handled=%" PRIu32 ", total=%" PRIu32
                 ", elapsed=%" PRId64 " us, LED %s",
                 expirations,
                 total_expirations,
                 elapsed_us,
                 led_on ? "on" : "off");
    }
}
```

`esp_timer_get_time()` 返回 ESP Timer 初始化以来经过的微秒数。它不是日期时间，也没有时区概念；这里用相邻两次读取的差值观察实际处理间隔。

正常情况下 `expirations` 为 `1`。如果它大于 `1`，说明 LED 任务开始处理前已经累计了多次到期。循环按次数翻转，保留累计翻转后的最终状态；日志中的计数也能显示任务是否处理落后。

## 7. 创建并启动周期定时器

关键初始化代码如下，`s_periodic_timer` 是文件内的静态定时器句柄：

```c
void app_main(void)
{
    TaskHandle_t led_task_handle = NULL;

    led_init();

    /* 必须先有任务，回调参数才能拿到有效句柄。 */
    xTaskCreate(led_task, "led_task", 3072, NULL, 5, &led_task_handle);

    const esp_timer_create_args_t timer_args = {
        .callback = periodic_timer_callback,
        .arg = led_task_handle,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "periodic_led",
    };

    esp_timer_create(&timer_args, &s_periodic_timer);
    esp_timer_start_periodic(s_periodic_timer, 1000000ULL); /* 微秒 */

    ESP_LOGI(TAG, "Started periodic timer: period=%" PRIu64 " us", 1000000ULL);

    /* app_main 返回后由 IDF 删除；esp_timer 和 led_task 继续运行。 */
}
```

顺序不能随意调换：

1. 初始化 LED；
2. 创建 LED 任务并取得句柄；
3. 创建 ESP Timer 实例；
4. 启动周期定时器。

如果先启动定时器，回调可能在任务句柄有效之前发生。先准备接收任务，再启动定时器，就能避免回调使用尚未准备好的句柄。

### 单次定时器和周期定时器

同一个定时器实例启动时可以选择一种模式：

```c
// 500 ms 后只回调一次，回调结束后停止。
esp_timer_start_once(timer, 500000);

// 每 500 ms 回调一次，直到显式停止。
esp_timer_start_periodic(timer, 500000);
```

已经运行的定时器不能再次调用普通 start API。要改变周期，可以：

```c
esp_timer_restart(timer, 250000);
```

不再使用时，按生命周期停止并删除：

```c
esp_timer_stop(timer);
esp_timer_delete(timer);
```

这些是生命周期扩展示例，不在当前 `main.c` 中执行。本实验需要一直闪烁，所以定时器在程序生命周期内保持运行。

## 用到的 ESP Timer 与 FreeRTOS 函数查询表

名称链接到 ESP-IDF v5.5.5 官方文档或该版本源码。表中的调用环境按本课用法标注；带 `FromISR` 的接口用于中断，普通任务接口不能直接搬进 ISR。

| 函数或宏 | 本课用途 | 调用环境 |
| --- | --- | --- |
| [`esp_timer_create()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1a74e9327734f0b5a209863df5a21d43a1) | 创建尚未启动的定时器 | 普通任务，不能在 ISR 中调用 |
| [`esp_timer_start_periodic()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1a9a7b439c818e9bda87b0101b92439686) | 启动周期定时器 | 普通任务，不能在 ISR 中调用 |
| [`esp_timer_get_time()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1ab38881d22858adab666843cee4ba6589) | 读取单调时间，单位微秒 | 本课在任务中读取；也可在 ISR 中读取 |
| [`xTaskCreate()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html#task_8h_1a5489235b8b4658d05fc45e3cccd41ba0) | 创建应用任务 | 普通任务，不能在 ISR 中调用 |
| [`xTaskNotifyGive()`](https://github.com/espressif/esp-idf/blob/v5.5.5/components/freertos/FreeRTOS-Kernel/include/freertos/task.h#L2348) | 将指定任务的通知计数加 1 | 普通任务，不能在 ISR 中调用 |
| [`ulTaskNotifyTake()`](https://github.com/espressif/esp-idf/blob/v5.5.5/components/freertos/FreeRTOS-Kernel/include/freertos/task.h#L2530) | 读取并处理当前任务的通知计数 | 普通任务，不能在 ISR 中调用 |
| [`esp_timer_start_once()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1a9b7c15d78638b13ad515d9471aa4c68f) | 扩展：启动一次性定时器 | 普通任务，不能在 ISR 中调用 |
| [`esp_timer_restart()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1a71fa2f051c37750636c7c7511072af2c) | 扩展：重启正在运行的定时器 | 普通任务，不能在 ISR 中调用 |
| [`esp_timer_stop()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1ac590077ed12c097ce62cd75dec10fa46) | 扩展：停止定时器 | 普通任务，不能在 ISR 中调用 |
| [`esp_timer_delete()`](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html#esp__timer_8h_1a2f8afce187cdaf5f91f1b713ec12617f) | 扩展：释放定时器 | 普通任务，不能在 ISR 中调用 |

### 创建、启动与时间单位

`esp_timer_create(&timer_args, &s_periodic_timer)` 接收配置结构体地址和句柄输出地址。配置中的 `callback` 是回调函数，`arg` 是传给回调的参数，`dispatch_method=ESP_TIMER_TASK` 表示在公共定时器任务中派发。创建成功返回 `ESP_OK`；内存不足可返回 `ESP_ERR_NO_MEM`。

`esp_timer_start_periodic(timer, period_us)` 的第二个参数是周期微秒数，本课的 `1000000ULL` 表示 1 秒。成功返回 `ESP_OK`，定时器已经运行时返回 `ESP_ERR_INVALID_STATE`。`esp_timer_get_time()` 无参数，返回 `int64_t` 微秒时间，用于相减求间隔，不是日历时间。

### 通知与任务句柄

`xTaskCreate(entry, name, stack_bytes, arg, priority, handle_out)` 的六个参数依次是任务入口、名称、栈字节数、入口参数、优先级和句柄输出地址。ESP-IDF 中 `3072` 是 **3072 字节**；优先级数值越大，优先级越高。最后一个参数传 `NULL` 表示不保存句柄，传句柄变量地址则由函数写回。成功返回 `pdPASS`，内存不足时返回 `errCOULD_NOT_ALLOCATE_REQUIRED_MEMORY`。

本课把任务句柄作为定时器的 `arg`。`xTaskNotifyGive(handle)` 使该任务的通知计数加 1，返回 `pdPASS`；`ulTaskNotifyTake(pdTRUE, portMAX_DELAY)` 阻塞等待，返回清零前累计计数。等待超时返回 `0`，但本课采用无限期等待的配置。默认定时器回调属于任务上下文，所以不使用 `FromISR` 接口。

### 仅在生命周期示例中出现的接口

`esp_timer_start_once(timer, timeout_us)` 在指定微秒数后触发一次；`esp_timer_restart(timer, timeout_us)` 要求定时器正在运行，周期模式下会从当前时刻按新周期重新计时。`esp_timer_stop(timer)` 停止正在运行的实例，`esp_timer_delete(timer)` 释放已停止的实例。它们成功均返回 `ESP_OK`；对运行状态使用不当会返回 `ESP_ERR_INVALID_STATE`。主工程保持周期定时器运行，未调用这些扩展接口。

正文比较用的 `vTaskDelay()`、`xTaskDelayUntil()` 不属于本课定时器启动链；前者按调用时刻相对延时，后者维护计划唤醒时间，参数单位都是 tick，不能直接套用 ESP Timer 的微秒数。

### 当前代码的接口与错误处理

| 本工程接口 | 用途与条件 | 返回类型 |
| --- | --- | --- |
| `led_init() / led_set(on)` | LED 初始化与逻辑亮灭控制；均不返回驱动状态 | `void` |

这些接口属于配套工程 BSP 或业务代码，不是同名的 ESP-IDF 底层 API。返回 `void` 的接口没有可检查的返回值，不能直接放进 `ESP_ERROR_CHECK()`。

当前教学版省略了多项初始化、资源创建和驱动调用的返回值检查。查询表保留底层 API 的成功与失败返回值，表示接口本身的约定；不代表当前源码已经检查。若要补齐，应在 BSP 内处理底层错误、按需返回 `esp_err_t`，并单独判断 FreeRTOS 创建结果。

## 8. 编译、烧录和观察实际间隔

```bash
# 每个新终端都先激活 ESP-IDF v5.5.5。
source "$HOME/.espressif/tools/activate_idf_v5.5.5.sh"

# 新工程首次设置目标，然后编译。
idf.py set-target esp32s3
idf.py build

# 查找开发板实际串口，再编译、烧录并打开 Monitor。
find /dev -maxdepth 1 -name 'cu.*' -print | sort
idf.py -p '/dev/cu.开发板实际端口' flash monitor
```

此前版本的实测启动日志（保留为观察参考，本次未重新烧录）：

```text
I (...) app_init: Project name:     06-esp-timer-periodic-led
I (...) app_init: ESP-IDF:          v5.5.5
I (259) esp_timer_demo: Started periodic timer: period=1000000 us
I (259) main_task: Returned from app_main()
```

当时随后连续得到：

```text
I (1259) esp_timer_demo: handled=1, total=1, elapsed=1000090 us, LED on
I (2259) esp_timer_demo: handled=1, total=2, elapsed=999984 us, LED off
I (3259) esp_timer_demo: handled=1, total=3, elapsed=1000000 us, LED on
I (4259) esp_timer_demo: handled=1, total=4, elapsed=1000000 us, LED off
I (5259) esp_timer_demo: handled=1, total=5, elapsed=1000000 us, LED on
```

日志说明：

- 周期事件持续发生，`app_main()` 返回没有停止定时器；
- 每次 `handled=1`，LED 任务没有积压多个通知；
- 相邻处理间隔接近 1,000,000 μs；
- LED 逻辑状态按 `on → off → on` 翻转。

实板验收清单：

1. 启动后红色 LED 初始熄灭；
2. 约 1 秒后点亮，再过约 1 秒熄灭；
3. 串口每秒输出一条日志，`total` 连续递增；
4. `handled` 持续为 `1`，没有周期事件积压；
5. `elapsed` 接近 `1000000 us`，并允许存在少量调度误差。

> [!INFO] 此前版本的实机记录
> `idf.py build` 已通过，固件大小为 `0x308a0` 字节，应用分区剩余 81%；烧录和 Flash 哈希校验通过。Monitor 已验证第 3～5 项，并连续观察到 9 次事件；红色 LED 每秒正常翻转也已人工确认。当时以上 5 项全部通过；这些数据属于此前固件，本次简化版仍需重新烧录确认。

## 9. 和教材官方工程对答案

| 项目 | 官方 `05_esptim` | 本课工程 | 原因 |
| --- | --- | --- | --- |
| 工程名 | `00_basic` | `06-esp-timer-periodic-led` | 日志能直接识别课程 |
| 周期 | 1,000,000 μs | 1,000,000 μs | 保留教材实验现象 |
| 派发方式 | 未写，默认 `ESP_TIMER_TASK` | 显式写 `ESP_TIMER_TASK` | 明确回调上下文 |
| 回调工作 | 直接 `LED_TOGGLE()` | 只发送任务通知 | 避免拖慢共享回调任务 |
| LED 状态 | 读取 GPIO 后取反 | 由 LED 任务保存逻辑状态 | 单一任务拥有状态，更容易推理 |
| 错误处理 | 未检查返回值 | 当前教学版也未检查 | 复用时需自行补充资源与状态检查 |
| 定时器句柄 | 初始化函数的局部变量 | 文件内静态句柄 | 后续可停止、重启或删除 |
| 运行观测 | 无串口周期数据 | 输出通知数和实际间隔 | 可以验证调度是否积压 |

教材把这个默认回调称为“中断回调函数”。按照 ESP-IDF v5.5.5 的实际机制，默认 `ESP_TIMER_TASK` 是底层 ISR 唤醒 ESP Timer 任务，再由该任务执行回调。只有显式使用 `ESP_TIMER_ISR` 时，用户回调才直接运行在中断上下文。

## 10. 常见问题

### LED 每秒改变一次，为什么完整闪烁周期是两秒

因为一次回调只改变一次状态：第 1 秒从灭到亮，第 2 秒从亮到灭。亮和灭构成一个完整周期。

### `elapsed` 为什么不是永远精确等于 1,000,000

到期时刻和 LED 任务真正开始运行之间存在回调派发、任务通知和调度延迟。微秒分辨率允许精细记录时间，不代表软件业务会零延迟执行。

### 为什么不在回调里打印日志

默认 ESP Timer 回调在同一个任务中串行执行。日志输出可能耗时，会推迟其他定时器回调。通知普通任务后再记录日志，可以把共享回调任务尽快释放。

### 为什么回调里用 `xTaskNotifyGive()`，不是 `xTaskNotifyGiveFromISR()`

因为本课明确选择 `ESP_TIMER_TASK`，回调运行在任务上下文。ISR 版本留给真正的中断上下文，不能根据函数名字里有“timer”就误判。

## 11. 小结

本课的周期调度流程可以在后续工程中复用：

```text
ESP Timer 每 1 秒到期
    ↓ 默认 ESP_TIMER_TASK 回调
短回调发送任务通知
    ↓ FreeRTOS 调度
led_task 翻转 GPIO1 并记录实际间隔
```

核心规则有三条：

1. `esp_timer` 的周期单位是微秒，但软件派发仍可能有延迟；
2. 默认回调运行在共享的 ESP Timer 任务中，应保持短小且不阻塞；
3. GPIO、日志和复杂业务交给普通任务，回调只负责发出事件。

下一课进入 GPTimer，比较专用硬件定时器与 ESP Timer 软件服务在配置方式、事件回调和实时性上的差异。

## 参考资料

- 《DNESP32S3 使用指南（IDF 版）》第 14 章 ESPTIMER 实验
- 正点原子官方 `05_esptim` 工程（本地课程资料）
- [ESP-IDF v5.5.5：ESP Timer 高分辨率定时器](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/esp_timer.html)
- [ESP-IDF v5.5.5：FreeRTOS（IDF）](https://docs.espressif.com/projects/esp-idf/en/v5.5.5/esp32s3/api-reference/system/freertos_idf.html)
