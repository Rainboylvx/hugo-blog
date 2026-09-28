---
title: "VS Code ESP-IDF 插件：安装、配置、UART 烧录与监视"
date: 2026-09-26
draft: true
toc: true
weight: 90
tags: ["ESP32-S3", "ESP-IDF", "VS Code", "EIM", "UART", "烧录"]
---

[环境安装篇](./01-ubuntu-26-esp-idf-eim-vscode.md)已经用 EIM 安装了 ESP-IDF。本文只解决下一层问题：怎样让 VS Code 的 **ESP-IDF 插件**使用 EIM 中已有的环境，并完成“选择版本 → 选择芯片 → 选择串口 → UART 编译、烧录与监视”的日常流程。

本文使用 `02-01-main-led` 工程演示，目标开发板是正点原子 DNESP32S3，芯片目标为 `esp32s3`。同样的操作也适用于其他标准 ESP-IDF 工程，但目标芯片和串口必须按实际硬件选择。

> [!INFO] 验证范围
> 本文在 macOS、VS Code ESP-IDF 插件 2.3.0、EIM 安装的 ESP-IDF v5.5.5 下核对了插件配置。配图显示版本、UART、串口和 `esp32s3` 均已选定；状态栏正确只证明**配置已就绪**，真正完成还要以 Build 成功、Flash 显示 `Flash Done`、Monitor 收到开发板日志为准。

## 1. 先分清 EIM、插件和终端

三者使用同一套 ESP-IDF，但各自负责的事情不同：

| 工具 | 主要职责 | 怎样选择 ESP-IDF |
| --- | --- | --- |
| EIM | 安装和管理 ESP-IDF、Python 虚拟环境与工具链 | 在 EIM 中安装或切换版本 |
| VS Code ESP-IDF 插件 | 编辑、配置、编译、烧录、监视和调试 | `ESP-IDF: Select Current ESP-IDF Version` |
| 普通终端 | 手动执行 `idf.py` | `source ~/.espressif/tools/activate_idf_版本号.sh` |

这一区分很重要：在 `~/.zshrc` 中配置 `get_idf`，只能激活**当前终端**。从 Dock 或应用列表启动的 VS Code 插件不会因为之后在终端执行了 `get_idf`，就自动获得那次环境修改。插件应该通过 EIM 的安装记录选择版本。

EIM 默认把安装记录保存在：

```text
~/.espressif/tools/eim_idf.json
```

插件会读取这个文件发现已安装版本。乐鑫的[插件安装文档](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/installation.html)也把 **Select Current ESP-IDF Version** 作为 EIM 安装后的标准入口。

## 2. 安装 Espressif 官方插件

在 VS Code 打开扩展页面：

- macOS：`Shift+Command+X`
- Windows / Linux：`Ctrl+Shift+X`

搜索 **ESP-IDF**，确认发布者是 **Espressif Systems**，再安装插件。也可以在系统终端执行：

```bash
code --install-extension espressif.esp-idf-extension
```

安装后用 `File → Open Folder` 打开**工程根目录**。这个目录下应直接存在顶层 `CMakeLists.txt`，其中能看到 ESP-IDF 工程的典型结构：

```cmake
cmake_minimum_required(VERSION 3.16)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(02-01-main-led)
```

不要只打开 `main/` 子目录，也不要打开同时包含许多无关项目的上级目录，否则插件可能无法判断当前工程。

## 3. 选择 EIM 已安装的 ESP-IDF

按 `F1` 或打开命令面板，执行：

```text
ESP-IDF: Select Current ESP-IDF Version
```

本系列选择：

```text
Version: v5.5.5
IDF_PATH: /Users/<你的用户名>/.espressif/v5.5.5/esp-idf
IDF_TOOLS_PATH: /Users/<你的用户名>/.espressif/tools
```

选择成功后，状态栏不再显示 `ESP-IDF InvalidSetup`，而应显示 `ESP-IDF v5.5.5`。接着运行：

```text
ESP-IDF: Doctor Command
```

重点核对报告中的三项是否属于**同一个版本**：

```text
IDF_PATH=/Users/<你的用户名>/.espressif/v5.5.5/esp-idf
IDF_TOOLS_PATH=/Users/<你的用户名>/.espressif/tools
Python=/Users/<你的用户名>/.espressif/tools/python/v5.5.5/venv/bin/python
```

路径会随系统和安装位置变化，不能把上面的用户名原样复制到另一台电脑。若 EIM 安装在自定义位置，可在 VS Code 设置中让 `idf.eimIdfJsonPath` 指向真实的 `eim_idf.json`。

> [!WARNING] 不要重复安装一套 IDF
> 如果 EIM 已经安装成功，插件弹出 Installation Manager 时，先尝试 **Select Current ESP-IDF Version**，不要立即再装一份。也不要因为一次检测失败就运行全局 `pip install esptool`；先用 Doctor 检查插件选中了哪套 IDF 和 Python。

## 4. 看懂状态栏：四项核心配置

下面是本机已经选好配置后的 VS Code 底部状态栏。图片按原始高度显示；可以横向滚动，也可以点击查看 2480×62 原图。

<div style="max-width: 100%; overflow-x: auto; padding-bottom: 0.5rem;">
  <a href="./assets/90-vscode-idf/status-bar-uart.png">
    <img src="./assets/90-vscode-idf/status-bar-uart.png" alt="VS Code ESP-IDF 状态栏显示 v5.5.5、UART、串口和 esp32s3" width="2480" height="62" style="max-width: none; width: 2480px; height: 62px;">
  </a>
</div>

*图 1：本系列项目的正确核心状态为 `ESP-IDF v5.5.5`、`UART`、实际开发板串口和 `esp32s3`。右侧 `OpenOCD Server (Stopped)` 在 UART 烧录时是正常状态。*

从左到右，最先要确认的是：

| 状态栏内容 | 含义 | 本项目应看到 |
| --- | --- | --- |
| `ESP-IDF v5.5.5` | 当前工程使用的 IDF 环境 | v5.5.5 |
| `UART` | Flash Method，固件写入方式 | UART |
| `/dev/tty.usbmodem31101` | 当前串口 | 以拔插后新增端口为准 |
| `esp32s3` | `IDF_TARGET` | esp32s3 |

后面的常用图标依次提供 SDK Configuration、Full Clean、Build、Flash、Monitor、Debug、Build/Flash/Monitor、ESP-IDF Terminal 等功能。鼠标停在图标上可以看到完整命令名；不确定图标时，直接从 `F1` 命令面板搜索 `ESP-IDF` 更清楚。

## 5. 设置芯片、烧录方式和串口

### 5.1 目标芯片选 `esp32s3`

执行：

```text
ESP-IDF: Set Espressif Device Target
```

选择 `esp32s3`。这个命令会更新工程的目标配置；不要因为开发板名字中有 ESP32，就误选经典 `esp32`。

本项目还可以从 `sdkconfig` 交叉确认：

```text
CONFIG_IDF_TARGET="esp32s3"
CONFIG_IDF_TARGET_ESP32S3=y
```

### 5.2 Flash Method 选 `UART`

执行：

```text
ESP-IDF: Select Flash Method
```

插件会提供三种方式：

| 方式 | 适用场景 | 本系列是否使用 |
| --- | --- | --- |
| UART | 通过普通 USB 串口和 esptool 烧录，最常见 | **是** |
| JTAG | 通过 OpenOCD/JTAG 烧录或调试 | 否，除非已接好并配置 JTAG |
| DFU | 通过 USB DFU 烧录，只适用于部分目标 | 本系列暂不使用 |

DNESP32S3 的常规学习流程选择 **UART**。如果误选 JTAG，插件会要求启动或配置 OpenOCD；重新执行 Select Flash Method 并选择 UART 即可，不需要重装插件。

乐鑫的[烧录文档](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/flashdevice.html)说明，选择结果会保存在 `idf.flashType`，而 UART 是大多数 Espressif 设备最常用的方式。

### 5.3 用拔插确认串口

先拔下开发板，再列出端口；插上开发板后重新执行同一条命令，新增的端口才是候选项。

macOS：

```bash
find /dev -maxdepth 1 -name 'cu.*' -print | sort
find /dev -maxdepth 1 -name 'tty.*' -print | sort
```

Linux：

```bash
find /dev -maxdepth 1 \( -name 'ttyUSB*' -o -name 'ttyACM*' \) -print | sort
```

然后执行：

```text
ESP-IDF: Select Port to Use
```

选择刚才通过拔插确认的端口。截图中的 `/dev/tty.usbmodem31101` 只代表拍图时这台 Mac 的实际设备，不是所有电脑通用的固定名称。

### 5.4 Ubuntu：把用户加入 `dialout` 组

Ubuntu 上的 `/dev/ttyUSB*`、`/dev/ttyACM*` 串口通常属于 `dialout` 组。普通用户如果不在这个组里，执行 `idf.py flash` 或使用 VS Code 插件烧录时会遇到 `Permission denied`；这时不应该改用 `sudo idf.py`。

先把下面的端口换成拔插确认得到的实际端口，查看设备所属组：

```bash
ls -l /dev/ttyUSB0
stat -c 'device=%n group=%G mode=%A' /dev/ttyUSB0
```

如果输出中的 `group` 确实是 `dialout`，把当前用户**追加**到该组：

```bash
sudo usermod -aG dialout "$USER"
```

这里的 `-aG` 必须保留：`-a` 表示追加附加组，避免覆盖用户原有的其他附加组。组成员变更只对新的登录会话生效；退出登录再重新登录即可，直接重启 Ubuntu 最稳妥，也能让终端和 VS Code 都进入新会话：

```bash
sudo reboot
```

重启后先验证当前会话已经包含 `dialout`：

```bash
id -nG | tr ' ' '\n' | grep -x dialout
```

看到 `dialout` 后，重新插入开发板，再激活 EIM 安装的 ESP-IDF 并烧录。端口和激活脚本版本都要按本机实际结果替换：

```bash
source "$HOME/.espressif/tools/activate_idf_v5.5.5.sh"
idf.py -p /dev/ttyUSB0 flash
```

这条 `idf.py` 命令前面不需要、也不应该加 `sudo`。如果设备文件所属组不是 `dialout`，不要盲目添加组，应按 `stat` 显示的实际组和发行版规则处理。乐鑫的[Linux 串口权限说明](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/establish-serial-connection.html#adding-user-to-dialout-or-uucp-on-linux)同样要求把普通 Linux 用户加入 `dialout`（Arch Linux 通常是 `uucp`），并重新登录使权限生效。

> [!TIP] `Detect` 报 esptool 错误怎么办
> 如果插件仍显示 `ESP-IDF InvalidSetup`，点击串口的 `Detect` 可能出现 “Make sure you have the esptool.py installed...” 之类的误导性提示。先回到第 3 节选择当前 IDF 版本并运行 Doctor；只有 IDF 环境有效后，串口检测才有可靠前提。

## 6. 一次完整的日常工作流

四项核心配置正确后，按下面顺序操作。

### 6.1 编译

执行：

```text
ESP-IDF: Build your Project
```

终端最终应显示构建成功，而不是只有 C/C++ 语法检查没有红线。第一次构建较慢，后续通常是增量构建。

### 6.2 UART 烧录

执行：

```text
ESP-IDF: Flash your Project
```

确认任务使用 UART 和刚选定的串口。成功标志是插件显示 `Flash Done`，并且烧录终端没有以非零状态退出。也可以直接运行明确指定方式的命令：

```text
ESP-IDF: Flash (UART) your Project
```

后者不会因为项目设置曾误选 JTAG 而走 OpenOCD。

### 6.3 打开 Monitor

执行：

```text
ESP-IDF: Monitor your Device
```

开发板复位后应看到 ESP-IDF 启动日志和应用输出。Monitor 占用串口时，不要同时启动另一个串口工具；需要重新烧录时，先停止仍占用串口的 Monitor。

### 6.4 一键完成

配置稳定后可以执行：

```text
ESP-IDF: Build, Flash and Start a Monitor on Your Device
```

它把编译、烧录和监视串在一起，适合日常迭代。第一次配置环境时仍建议分三步执行，这样失败时能明确停在哪一层。插件的完整命令可以在[官方命令列表](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/commands.html)查询。

## 7. 插件把设置保存在哪里

当前工程选择版本、端口和烧录方式后，`.vscode/settings.json` 可能包含类似内容：

```json
{
  "idf.currentSetup": "/Users/<你的用户名>/.espressif/v5.5.5/esp-idf",
  "idf.port": "/dev/tty.usbmodem31101",
  "idf.flashType": "UART"
}
```

其中 IDF 绝对路径和串口名是**机器相关配置**。把项目复制到 Ubuntu、Windows 或另一台 Mac 后，应重新执行 Select Current ESP-IDF Version 和 Select Port to Use，不能假定这些值仍然有效。团队仓库是否提交这个文件，要根据是否存在可共享设置来决定；至少不要把个人绝对路径当成所有人的默认值。

如果误选了 JTAG，也可以在工作区设置中把：

```json
"idf.flashType": "JTAG"
```

改为：

```json
"idf.flashType": "UART"
```

不过优先使用 **ESP-IDF: Select Flash Method**，可以避免 JSON 逗号或作用域写错。`idf.currentSetup`、`idf.flashType` 等设置的作用域可参考[官方设置表](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/settings.html)。

## 8. 常见问题按层排查

### 状态栏显示 `ESP-IDF InvalidSetup`

1. 检查 `~/.espressif/tools/eim_idf.json` 是否存在。
2. 执行 Select Current ESP-IDF Version，选择目标版本。
3. 运行 Doctor，核对 IDF、工具目录和 Python 是否属于同一套安装。
4. 状态栏仍未更新时，执行 `Developer: Reload Window`。

### 误选 JTAG，插件要求 OpenOCD

执行 Select Flash Method，改选 UART。UART 烧录不要求 OpenOCD 运行；状态栏显示 `OpenOCD Server (Stopped)` 不妨碍 UART Build、Flash 和 Monitor。

### 串口列表里设备太多

不要按名字猜。拔下开发板记录一次，插上后再记录一次，只选择新增端口。还要确认 USB 线支持数据传输，而不是只能充电。

### Flash 报端口不存在或被占用

重新插拔开发板并再次 Select Port。关闭其他串口工具和仍在运行的 Monitor；Ubuntu 按第 5.4 节确认当前会话已经加入设备所属的 `dialout` 组，不要用 `sudo code` 或 `sudo idf.py` 掩盖权限问题。

### Build 成功但开发板没有变化

Build 只生成固件，不会自动写入开发板。继续执行 Flash，并以 `Flash Done` 为准；随后运行 Monitor 或观察硬件现象。对于点灯工程，还要确认程序控制的是 DNESP32S3 红色用户 LED 对应的 GPIO1，而不是常亮的电源灯。

## 9. 最终验收清单

- [ ] VS Code 打开的是包含顶层 `CMakeLists.txt` 的工程根目录。
- [ ] 状态栏显示预期 ESP-IDF 版本，而不是 `InvalidSetup`。
- [ ] Target 是开发板实际芯片；DNESP32S3 为 `esp32s3`。
- [ ] Flash Method 为 `UART`。
- [ ] 串口通过拔插确认，不是凭名称猜测。
- [ ] Build 成功。
- [ ] Flash 显示 `Flash Done`。
- [ ] Monitor 能看到本次固件的启动和应用日志。
- [ ] 最终硬件现象与工程预期一致。

完成这些检查后，就可以回到[点灯工程](./02-dnesp32s3-idf-create-project-led.md)，使用 VS Code 插件代替或配合 `idf.py` 完成后续实验。

## 参考资料

- [乐鑫：安装 ESP-IDF VS Code 插件并连接 EIM](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/installation.html)
- [乐鑫：VS Code 插件命令列表](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/commands.html)
- [乐鑫：选择串口与烧录方式](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/flashdevice.html)
- [乐鑫：ESP-IDF 插件设置项](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/settings.html)
- [乐鑫：插件故障排查](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/troubleshooting.html)
