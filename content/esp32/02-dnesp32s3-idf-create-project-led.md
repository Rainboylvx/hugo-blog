---
title: "从单文件点灯到 BSP：用 idf.py 创建 DNESP32S3 工程"
date: 2026-09-23
draft: true
toc: true
weight: 2
tags: ["ESP32-S3", "ESP-IDF", "GPIO", "LED", "BSP", "Ubuntu"]
---

[上一篇](./01-ubuntu-26-esp-idf-eim-vscode.md)介绍了 ESP-IDF、EIM 与 VS Code 的安装，以及用 `hello_world` 验证编译的方法。这一篇跟着《DNESP32S3 使用指南（IDF 版）》第 10 章，控制**正点原子 DNESP32S3 的红色用户 LED**。我们会做两遍同一件事：

- **2.1 单文件点灯**：除 ESP-IDF 必需的构建文件外，应用逻辑全写在 `main/main.c`，先弄明白 GPIO 怎样让灯亮灭。
- **2.2 BSP 分层点灯**：保持引脚、时序和实验现象不变，把板级细节从 `main.c` 移到 `components/BSP/LED/`，再比较这样做的收益与成本。

两节各有一个[可独立构建的示例工程](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples)；建议先完成 2.1，再读 2.2。

> [!INFO] 验证范围
> [2.1 单文件工程](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/02-01-main-led/)和[2.2 BSP 工程](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/02-02-bsp-led/)都已在 macOS 的 ESP-IDF v5.5.5 下执行 `idf.py set-target esp32s3`、`idf.py build`，编译成功。本机已经通过 USB 识别出 ESP32-S3，但尚未烧录；Ubuntu 26.04、实际闪灯和串口日志仍待验证。

## 先读原理图：GPIO1 控制哪盏灯

下面两幅是 `ATK_DNESP32S3_V1.2.pdf` 的局部图（图源：正点原子课程资料）。第一幅找芯片引脚，第二幅顺着同名网络找到 LED 电路。

![ESP32-S3-WROOM-1 模组物理 39 脚为 IO1，连接 LED 网络](./assets/02-led/esp32s3-io1-pin.png)

*图 1：模组的物理 39 脚标为 IO1，网络名为 `LED`。程序里用的是 GPIO1，不是 GPIO39。*

![3.3 V 经 R4 与红色 LED 接到 IO1；蓝色 PWR 灯直接接地](./assets/02-led/led-circuit.png)

*图 2：`VCC3.3 → R4（510 Ω）→ 红色 LED → LED/IO1`。下方蓝色 `PWR` 灯接电源与 GND，是电源指示灯，不由 GPIO1 控制。*

因此，GPIO1 输出**低电平**时，电流经 R4 和红色 LED 流向 GPIO1，红灯点亮；输出**高电平**时红灯熄灭。教材第 10 章和官方 `01_led` 工程也使用 GPIO1。

| 要核对的量 | 本篇取值 |
| --- | --- |
| 目标芯片 | ESP32-S3：`esp32s3` |
| 红色用户 LED | GPIO1（模组物理 39 脚） |
| 有效电平 | 低电平亮，高电平灭 |
| 预期现象 | 亮 500 毫秒、灭 500 毫秒，循环 |

## 2.1 一个 `main.c` 完成点灯

### 用 `idf.py` 创建空工程

先激活 ESP-IDF；**每开一个新终端都要重新激活**。下方的 v5.5.5 是本机 macOS 上已验证的 EIM 安装版本。Ubuntu 用户先按[上一篇的激活步骤](./01-ubuntu-26-esp-idf-eim-vscode.md)找到本机脚本，替换这一行的版本号。项目路径不要包含空格。

```bash
# 激活 EIM 安装的 ESP-IDF v5.5.5；每个新终端都要执行一次。
source "$HOME/.espressif/tools/activate_idf_v5.5.5.sh"

# 确认当前终端使用的 ESP-IDF 版本。
idf.py --version

# 新建并进入用于保存练习工程的目录。
mkdir -p "$HOME/esp"
cd "$HOME/esp"

# 让 idf.py 生成最小工程骨架。
idf.py create-project 02-01-main-led
cd 02-01-main-led

# 生成的源文件名带工程名；改为更常见的 main.c。
mv main/02-01-main-led.c main/main.c
```

`create-project` 生成根目录和 `main/` 的 CMake 文件，以及一个空的 `app_main()`。它没有自动选择 ESP32-S3。根目录 `CMakeLists.txt` 保持生成的 `project(02-01-main-led)`；我们只需要把 `main/CMakeLists.txt` 改成：

```cmake
# 将 main.c 注册为 main 组件的源文件。
# GPIO 驱动只在本组件内部使用，所以声明为私有依赖。
idf_component_register(SRCS "main.c"
                    INCLUDE_DIRS "."
                    PRIV_REQUIRES esp_driver_gpio)
```

这里显式写出 `main` 的 GPIO 驱动依赖；`driver/gpio.h` 只在 `main.c` 中使用，所以采用 `PRIV_REQUIRES`。再在根目录新建 `sdkconfig.defaults`，记录目标芯片和这块板的 16 MB Flash：

```text
# DNESP32S3 使用 ESP32-S3 芯片。
CONFIG_IDF_TARGET="esp32s3"
# 开发板搭载 16 MB Flash。
CONFIG_ESPTOOLPY_FLASHSIZE_16MB=y
```

此时还没有 BSP。`main.c` 是**唯一承载应用逻辑的 C 文件**；CMake 和 `sdkconfig.defaults` 是构建配置，不是另一套点灯代码。

### 在 `main.c` 直接控制 GPIO

把 `main/main.c` 完整替换为下面的代码：

```c
#include <stdbool.h>
#include "driver/gpio.h"
#include "esp_check.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

// DNESP32S3 V1.2 板载红色用户 LED 连接到 GPIO1。
#define LED_GPIO GPIO_NUM_1

// ESP_LOGI 会把这个字符串作为日志标签，便于区分日志来源。
static const char *TAG = "led_demo";

/**
 * @brief 设置板载红色 LED 的亮灭状态。
 *
 * 原理图中的连接方式是：3.3 V -> 限流电阻 -> LED -> GPIO1。
 * 因此 GPIO1 输出低电平时形成电流通路，LED 点亮；
 * 输出高电平时 LED 熄灭。这叫“低电平有效”。
 */
static esp_err_t led_set(bool on)
{
    // on 为 true 时写 0，on 为 false 时写 1。
    return gpio_set_level(LED_GPIO, on ? 0 : 1);
}

/**
 * @brief 把 LED 引脚初始化为普通 GPIO 输出，并让 LED 默认熄灭。
 */
static esp_err_t led_init(void)
{
    const gpio_config_t config = {
        // pin_bit_mask 的每一位对应一个 GPIO；左移 GPIO1 位就是选择 GPIO1。
        .pin_bit_mask = 1ULL << LED_GPIO,
        // LED 只需要输出高、低电平，不需要输入功能。
        .mode = GPIO_MODE_OUTPUT,
        // 板上已有完整的 LED 电路，不启用芯片内部上下拉电阻。
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        // 点灯不使用 GPIO 中断。
        .intr_type = GPIO_INTR_DISABLE,
    };

    // gpio_config() 返回 ESP_OK 表示配置成功，否则把错误交给调用者。
    esp_err_t err = gpio_config(&config);
    if (err != ESP_OK) {
        return err;
    }

    // 初始化结束后先灭灯，避免程序启动时 LED 状态不明确。
    return led_set(false);
}

void app_main(void)
{
    // 初始化失败时打印错误位置并终止程序，便于入门阶段排错。
    ESP_ERROR_CHECK(led_init());

    // app_main 运行在 FreeRTOS 任务中；这个循环让 LED 持续闪烁。
    while (1) {
        ESP_ERROR_CHECK(led_set(true));
        ESP_LOGI(TAG, "LED on");
        // 把 500 毫秒换算成当前 FreeRTOS 配置对应的 tick 数。
        vTaskDelay(pdMS_TO_TICKS(500));

        ESP_ERROR_CHECK(led_set(false));
        ESP_LOGI(TAG, "LED off");
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}
```

看这段程序时抓住三件事：`gpio_config()` 将 GPIO1 配成输出；`led_set(true)` 输出 **0** 才是点亮红灯；`pdMS_TO_TICKS(500)` 把 500 毫秒换成 FreeRTOS tick 数。`ESP_ERROR_CHECK` 会在 GPIO 调用失败时报告错误，日志则帮助我们把程序状态和肉眼看到的灯对起来。

#### `pdMS_TO_TICKS()` 做了什么

严格来说，`pdMS_TO_TICKS()` 是 FreeRTOS 提供的**宏**，不是普通 C 函数。`vTaskDelay()` 接收的单位是系统 tick，而我们更习惯用毫秒描述时间。这个宏负责完成两种单位之间的换算：

```text
tick 数 = 毫秒数 × configTICK_RATE_HZ ÷ 1000
```

`configTICK_RATE_HZ` 表示 FreeRTOS 每秒产生多少个 tick。例如：

| `configTICK_RATE_HZ` | 一个 tick 的时间 | `pdMS_TO_TICKS(500)` 的结果 |
| --- | --- | --- |
| 1000 Hz | 1 ms | 500 tick |
| 100 Hz | 10 ms | 50 tick |

本篇两个配套工程当前生成的 `sdkconfig` 都是 `CONFIG_FREERTOS_HZ=100`，所以 `pdMS_TO_TICKS(500)` 在本例中得到 50 tick。

因此，下面这行表达的是“让当前任务暂停大约 500 毫秒”：

```c
vTaskDelay(pdMS_TO_TICKS(500));
```

等待期间，当前任务进入阻塞状态，CPU 可以运行其他任务；它不是占着 CPU 空转 500 毫秒。直接写 `vTaskDelay(500)` 表达的是“等待 500 个 tick”，只有 tick 频率恰好为 1000 Hz 时才等于 500 毫秒。使用 `pdMS_TO_TICKS(500)` 能让代码在 tick 频率改变后仍然保持接近 500 毫秒的延时。可以用下面的命令查看当前工程的 tick 频率：

```bash
# 查看 sdkconfig 中的 FreeRTOS tick 频率配置。
grep '^CONFIG_FREERTOS_HZ=' sdkconfig
```

### 编译与实板验收

在 `02-01-main-led` 根目录运行。`set-target` 只需在新工程首次选择芯片时执行：

```bash
# 首次配置工程时，明确选择 ESP32-S3。
idf.py set-target esp32s3

# 只编译，不连接开发板也可以完成这一步。
idf.py build

# 核对生成配置中的芯片型号和 Flash 容量。
grep -E 'CONFIG_IDF_TARGET=|CONFIG_ESPTOOLPY_FLASHSIZE=' sdkconfig
```

配置应显示 `esp32s3`、`16MB`。`Project build complete` 且命令以 0 退出，表示固件编译成功；它还不能证明 LED 闪烁。以后只改普通 C 代码，直接重新 `idf.py build` 即可。

用支持数据传输的 USB 线连接开发板，插拔前后分别列出设备，找出**新出现的串口**。Ubuntu 常见 `/dev/ttyUSB*` 或 `/dev/ttyACM*`；macOS 用 `/dev/cu.*`。以下两条按操作系统选一条运行：

```bash
# Ubuntu：查找常见的 USB 转串口和 USB CDC 设备。
find /dev -maxdepth 1 \( -name 'ttyUSB*' -o -name 'ttyACM*' \) -print | sort

# macOS：烧录时通常选择 cu.*，插拔前后各运行一次更容易判断。
find /dev -maxdepth 1 -name 'cu.*' -print | sort
```

确认端口属于开发板后，将下面**引号内的示例路径**换成刚找到的实际路径：

```bash
# flash 会自动触发编译，monitor 会在烧录后打开串口日志。
idf.py -p '/dev/cu.替换为开发板端口' flash monitor
```

Ubuntu 用户把整段路径换成自己的 `/dev/ttyUSB*` 或 `/dev/ttyACM*` 端口。`flash monitor` 会先编译，再烧录并打开串口监视器，无需先单独运行 `build`。本机当前识别到的 ESP32-S3 端口是 `/dev/cu.usbmodem31101`；另一个 `/dev/cu.usbmodem301NTBKCY8612` 属于 LG 显示器控制接口，不是开发板。

验收要同时满足两项：Monitor 交替打印 `LED on`、`LED off`；板上的**红色用户 LED**亮约 0.5 秒、灭约 0.5 秒并循环。蓝色 `PWR` 灯持续亮属于正常供电现象。Monitor 用 `Ctrl+]` 退出；若 Linux 报串口权限不足，按[上一篇的串口权限步骤]({{< relref "01-ubuntu-26-esp-idf-eim-vscode.md#串口-permission-denied" >}})处理。

## 2.2 把同一程序整理成 BSP

### BSP 到底是什么

**BSP（Board Support Package，板级支持包）**是把“这块板子怎么接线、怎么初始化和控制外设”的代码集中起来的一种组织方式。这里 `components/BSP` 是我们给 ESP-IDF **组件**取的名字；ESP-IDF 负责按组件的 CMake 声明编译和链接，`BSP` 这个目录名并不会自动赋予特殊功能。

在 2.1，`main.c` 同时知道“每 500 毫秒亮灭一次”和“LED 接 GPIO1、低电平亮”。现在保留前者，把后者移到 BSP。为便于重做和对照，[2.2 工程](https://github.com/Rainboylvx/esp32-learning-code/tree/main/examples/02-02-bsp-led/)是独立快照；两个工程运行后的灯和日志应该完全一样。

### 从 2.1 工程开始重构

在 `~/esp` 创建第二个空工程，复制 2.1 的主程序和配置，再新建 BSP 目录：

```bash
# 回到保存练习工程的目录，创建第二个独立工程。
cd "$HOME/esp"
idf.py create-project 02-02-bsp-led
cd 02-02-bsp-led

# 统一主源文件名，并复制 2.1 的程序和板卡默认配置作为重构起点。
mv main/02-02-bsp-led.c main/main.c
cp ../02-01-main-led/main/main.c main/main.c
cp ../02-01-main-led/sdkconfig.defaults sdkconfig.defaults

# 创建 BSP 组件及其中的 LED 模块目录。
mkdir -p components/BSP/LED
```

在 `components/BSP/LED/led.h` 声明 BSP 对应用层提供的两个动作：

```c
#pragma once

#include <stdbool.h>
#include "esp_err.h"

/**
 * @brief 初始化 DNESP32S3 板载红色 LED。
 *
 * @return ESP_OK 表示成功，其他值表示 GPIO 配置失败。
 */
esp_err_t led_init(void);

/**
 * @brief 设置板载红色 LED 的状态。
 *
 * 调用者只表达“亮”或“灭”，无需知道 GPIO 编号和有效电平。
 *
 * @param on true 点亮，false 熄灭。
 * @return ESP_OK 表示成功，其他值表示设置失败。
 */
esp_err_t led_set(bool on);
```

在 `components/BSP/LED/led.c` 放入原来 `main.c` 里的 GPIO 细节。GPIO1 和低电平有效只在这里出现：

```c
#include "led.h"
#include "driver/gpio.h"

// GPIO 编号属于具体开发板的硬件知识，所以放在 BSP 实现中。
#define LED_GPIO GPIO_NUM_1

esp_err_t led_init(void)
{
    const gpio_config_t config = {
        // 位掩码的第 1 位对应 GPIO1。
        .pin_bit_mask = 1ULL << LED_GPIO,
        .mode = GPIO_MODE_OUTPUT,
        // 板上已有完整的 LED 外部电路，不启用内部上下拉电阻。
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };

    esp_err_t err = gpio_config(&config);
    if (err != ESP_OK) {
        return err;
    }

    // GPIO 配置成功后先熄灭 LED，让初始化结果确定、可预期。
    return led_set(false);
}

esp_err_t led_set(bool on)
{
    // 原理图为 3.3 V -> 电阻 -> LED -> GPIO1，因此低电平点亮。
    // BSP 在这里完成“逻辑状态”到“硬件电平”的转换。
    return gpio_set_level(LED_GPIO, on ? 0 : 1);
}
```

在 `components/BSP/CMakeLists.txt` 注册 BSP 组件：

```cmake
# LED/led.c 是 BSP 组件的实现文件。
# 公开 LED 目录后，应用层才能直接包含 led.h。
# GPIO 驱动只在 BSP 内部使用，所以声明为私有依赖。
idf_component_register(SRCS "LED/led.c"
                    INCLUDE_DIRS "LED"
                    PRIV_REQUIRES esp_driver_gpio)
```

这里的 `INCLUDE_DIRS "LED"` 表示：把 `LED` 目录登记为 BSP 组件的**公开头文件搜索目录**。这个路径相对于当前组件的 `CMakeLists.txt` 所在目录计算，因此它实际指向：

```text
components/BSP/LED/
```

构建系统会把这个目录加入编译器的头文件搜索路径。由于 `main` 组件通过 `PRIV_REQUIRES BSP` 依赖 BSP，它在编译时也能使用 BSP 公开的头文件，所以 `main.c` 可以直接写：

```c
#include "led.h"
```

`INCLUDE_DIRS` 填的是**目录**，不是具体的 `led.h` 文件。它还带有“向依赖者公开”的含义：BSP 自己能找到 `led.h`，依赖 BSP 的 `main` 也能找到。假如某个头文件只供 BSP 内部源文件使用、不希望其他组件包含，才应把所在目录写进 `PRIV_INCLUDE_DIRS`。

`main/CMakeLists.txt` 不再直接依赖 GPIO 驱动，改为依赖 BSP：

```cmake
# main 只调用 BSP 接口，不再直接依赖 GPIO 驱动。
idf_component_register(SRCS "main.c"
                    INCLUDE_DIRS "."
                    PRIV_REQUIRES BSP)
```

`PRIV_REQUIRES BSP` 中的 `BSP` 是**组件名**。运行 `idf.py build` 时，ESP-IDF 的 CMake 构建系统会先收集所有可用组件，再按名称解析依赖。默认的组件搜索位置包括：

```text
$IDF_PATH/components/       # ESP-IDF 自带组件
项目根目录/components/     # 当前项目自己的组件
EXTRA_COMPONENT_DIRS        # 工程额外指定的组件目录
```

在本工程中，构建系统扫描 `项目根目录/components/` 的直接子目录时，发现了：

```text
components/
└── BSP/
    └── CMakeLists.txt
```

一个被搜索到、并且含有 `CMakeLists.txt` 的目录会被识别为组件；默认情况下，目录名就是组件名。因此 `components/BSP/` 注册出的组件名是 `BSP`，`PRIV_REQUIRES BSP` 就能把 `main` 和这个组件关联起来。

这里不是从整个工程中递归搜索任意名为 `BSP` 的文件夹。`components/BSP/LED/` 只是 BSP 组件内部的子目录，由 BSP 自己的 `CMakeLists.txt` 通过 `SRCS "LED/led.c"` 和 `INCLUDE_DIRS "LED"` 管理。如果把 BSP 放到项目之外，就需要在工程根目录的 `CMakeLists.txt` 中通过 `EXTRA_COMPONENT_DIRS` 告诉 ESP-IDF 去哪里搜索。

建立依赖后，构建系统会先构建 BSP，并把 BSP 通过 `INCLUDE_DIRS` 公开的头文件目录提供给 `main`。`PRIV_REQUIRES` 中的“私有”表示这项依赖只用于编译和链接 `main`，不会继续传递给依赖 `main` 的其他组件。

最后，把 `main/main.c` 中的 `led_init()`、`led_set()` 实现移走，留下调用：

```c
#include "esp_check.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "led.h"

// 应用层只负责“何时亮、何时灭”，板卡接线细节由 BSP 负责。
static const char *TAG = "led_demo";

void app_main(void)
{
    // 通过 BSP 初始化 LED，无需在 main.c 中直接调用 gpio_config()。
    ESP_ERROR_CHECK(led_init());

    while (1) {
        // true 表示“点亮”，BSP 会把它转换成这块板需要的低电平。
        ESP_ERROR_CHECK(led_set(true));
        ESP_LOGI(TAG, "LED on");
        vTaskDelay(pdMS_TO_TICKS(500));

        // false 表示“熄灭”，应用层不需要记忆高低电平的对应关系。
        ESP_ERROR_CHECK(led_set(false));
        ESP_LOGI(TAG, "LED off");
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}
```

根目录 `CMakeLists.txt` 仍由 `create-project` 生成，项目名应为 `project(02-02-bsp-led)`。此时目录结构是：

```text
02-02-bsp-led/
├── CMakeLists.txt              # 工程入口
├── sdkconfig.defaults          # 芯片和 Flash 的默认配置
├── main/
│   ├── CMakeLists.txt          # 声明 main 对 BSP 的依赖
│   └── main.c                 # 应用逻辑：决定何时亮灭
└── components/
    └── BSP/
        ├── CMakeLists.txt      # 注册 BSP 组件
        └── LED/
            ├── led.h           # 对应用层公开的 LED 接口
            └── led.c           # GPIO1 和低电平有效等板级细节
```

在 `02-02-bsp-led` 根目录重新选择目标并编译：

```bash
# 第二个工程也要首次确认目标芯片，然后执行编译。
idf.py set-target esp32s3
idf.py build
```

接板后按 2.1 的方法确认串口，再运行 `idf.py -p '实际串口路径' flash monitor`。验收标准与 2.1 完全相同。还可以在两个工程里分别搜索 `GPIO_NUM_1`：2.1 只应在 `main/main.c` 找到，2.2 只应在 `components/BSP/LED/led.c` 找到。这是板级细节从应用层移出的直接证据。

### 这次分层到底得到了什么

| 比较 | 2.1 单文件 | 2.2 BSP |
| --- | --- | --- |
| `main.c` 管什么 | 闪烁时序、GPIO1、有效电平 | 闪烁时序与日志 |
| GPIO1 和低电平有效在哪 | `main/main.c` | `components/BSP/LED/led.c` |
| 依赖关系 | `main → esp_driver_gpio` | `main → BSP → esp_driver_gpio` |
| 改板卡接线时 | 修改应用文件 | 集中修改 BSP 实现 |
| 额外成本 | 文件少 | 多了头文件、实现文件和组件 CMake |

**BSP 的收益是隔离板级细节，不是让这一盏 LED 闪得更好。**如果程序只有一个灯，2.1 更直接；当按键、蜂鸣器等外设陆续加入时，统一的板级接口能防止应用流程里到处散落引脚和有效电平。`led_set(bool)` 也没有让程序自动兼容其他板子：换板仍要核对原理图并修改或替换 BSP 实现。这里两节都固定使用 GPIO1；引脚做成 `Kconfig.projbuild` 可配置项留待后续多板实践。

## 和教材官方工程对答案

教材第 10 章的官方 `01_led` 工程同样是 GPIO1 低电平点亮。本篇两种实现有意采用同一控制逻辑，方便只观察文件组织的变化；它们与官方实现的差异是：

| 项目 | 官方 `01_led` | 本篇两个工程 | 原因 |
| --- | --- | --- | --- |
| 引脚模式 | `GPIO_MODE_INPUT_OUTPUT`，使能上拉 | `GPIO_MODE_OUTPUT`，不使能内部上下拉 | 本篇不通过 `gpio_get_level()` 读回状态 |
| 切换方式 | `LED_TOGGLE()` 读回电平后翻转 | `led_set(true/false)` 显式设置 | 代码里直接看出亮灭顺序 |
| 延时 | `vTaskDelay(500)` | `vTaskDelay(pdMS_TO_TICKS(500))` | 明确表达 500 毫秒 |
| 错误处理 | GPIO 返回值未检查 | `ESP_ERROR_CHECK` 检查 | 调用失败时报告位置 |

官方工程的 `CONFIG_FREERTOS_HZ=1000`，因此它的 500 tick 在该工程里等于 500 毫秒；本篇工程默认 tick 配置可能不同，不能直接照抄数值。单纯 GPIO 点灯不需要 NVS 初始化，所以本篇没有加入教材其他片段里的 NVS 代码。

## 参考资料

- 《DNESP32S3 使用指南（IDF 版）》第 10 章、`ATK_DNESP32S3_V1.2.pdf` 原理图与官方 `01_led` 工程（本地课程资料）
- [乐鑫：ESP-IDF v5.5 的 `idf.py` 命令](https://docs.espressif.com/projects/esp-idf/en/v5.5/esp32s3/api-guides/tools/idf-py.html)
- [乐鑫：ESP-IDF 组件构建规则](https://docs.espressif.com/projects/esp-idf/en/v5.5/esp32s3/api-guides/build-system.html)
