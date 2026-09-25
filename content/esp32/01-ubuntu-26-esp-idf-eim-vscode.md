---
title: "在 Ubuntu 26.04 安装 ESP-IDF、EIM 和 VS Code"
date: 2026-09-23
draft: true
toc: true
weight: 1
tags: ["ESP32", "ESP-IDF", "Ubuntu", "VS Code"]
---

这一篇先把 ESP32 开发环境装好：用 **EIM（ESP-IDF Installation Manager）** 安装 ESP-IDF 和工具链，再让 VS Code 的 ESP-IDF 插件识别它，最后创建一个项目并编译验证。这里的 Ubuntu 26 指 **Ubuntu 26.04 桌面版**；命令适用于常见的 `amd64` 和 `arm64` 架构。实际刷机还需要一块 ESP32 开发板和数据线。

> [!INFO] 版本说明
> 下文按 2026-09-23 查阅的乐鑫和 VS Code 官方文档编写。EIM 的界面和最新稳定版号会变化，所以安装时选择界面显示的稳定版，不把某个版本号写死。文章中的 Ubuntu 命令尚未在 Ubuntu 26.04 实机上逐条执行；每一步都给出可以在目标机器上核对的结果。

## 先弄清三个东西

| 名称 | 作用 |
| --- | --- |
| ESP-IDF | 乐鑫的开发框架，包含项目模板、组件、`idf.py` 等 |
| EIM | 安装和管理 ESP-IDF、Python 环境及交叉编译工具链 |
| VS Code + ESP-IDF 插件 | 编辑项目、选择芯片与串口、编译、烧录和查看日志 |

ESP-IDF 6.0 起，乐鑫的 Linux 入门文档把 EIM 列为默认安装方式。下面先用 EIM 安装一次，VS Code 只连接这套现有环境，避免重复下载工具链。参见[乐鑫 Linux 安装说明](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-setup.html)。

## 1. 确认 Ubuntu 和架构

打开终端：

```bash
cat /etc/os-release
dpkg --print-architecture
python3 --version
```

检查 `VERSION_ID` 是否为 `26.04`，架构是否为 `amd64` 或 `arm64`。如果机器还没有装 Git，可先运行 `sudo apt update && sudo apt install git`。使用下面的 EIM APT 包时，乐鑫文档说明可跳过手动准备 EIM 前置依赖；若安装器报告缺少组件，再按报错补装，不必先把整套 ESP-IDF 依赖装两遍。

## 2. 安装 EIM

乐鑫提供 Debian/Ubuntu 的 APT 仓库。下面安装带图形界面的 `eim`，它也包含 CLI：

```bash
echo "deb [trusted=yes] https://dl.espressif.com/dl/eim/apt/ stable main" | sudo tee /etc/apt/sources.list.d/espressif.list
sudo apt update
sudo apt install eim
eim --help
```

`eim --help` 能输出命令帮助，就说明可执行文件已经进入 `PATH`。只在纯命令行服务器上使用时，可以把 `sudo apt install eim` 换成 `sudo apt install eim-cli`。

> [!WARNING] APT 仓库信任方式
> 上面的仓库配置照录自[乐鑫官方安装文档](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-setup.html)。其中 `trusted=yes` 会让 APT 对**这个仓库**跳过通常的包签名校验；先确认域名确实是 `dl.espressif.com`，并只在接受此信任方式时使用。若不愿添加此仓库，可从[乐鑫 EIM 下载页](https://dl.espressif.com/dl/eim/)获取适合自己架构的安装包，按下载页说明安装。

## 3. 用 EIM 安装 ESP-IDF

### 图形界面

在终端运行 `eim`，或从应用菜单打开 ESP-IDF Installation Manager。依次选择 **New Installation → Start Installation → Easy Installation → Start Easy Installation**，使用当前稳定版和默认目录。通过前置检查后点击 **Start Installation**。等到 **Installation Complete**，再到安装管理页面确认版本已出现。若下载或安装失败，先打开界面底部的 **Logs** 看具体错误。

### 命令行

在有网络的终端运行：

```bash
eim install
```

这会按默认设置安装当前稳定版。希望交互选择版本、镜像、特性或安装位置时，改用：

```bash
eim wizard
```

例如项目确实需要某个特定版本，可先用 `eim --help` 核对本机参数，再运行 `eim install -i v5.4.2`。不要同时启动 GUI 和 CLI 对同一个安装目录进行安装。EIM 成功时会报告 `Successfully installed IDF`；还应检查生成的安装记录：

```bash
test -f "$HOME/.espressif/tools/eim_idf.json" && echo 'EIM 安装记录存在'
find "$HOME/.espressif/tools" -maxdepth 1 -name 'activate_idf_*.sh' -print
```

EIM 默认在 `~/.espressif/tools/eim_idf.json` 写入供 VS Code 识别的配置；使用自定义目录时，应以安装器显示的实际路径为准。上面的激活脚本按安装版本命名。它必须通过 `source` 加载到**当前**终端：

```bash
source "$HOME/.espressif/tools/activate_idf_版本号.sh"
idf.py --version
```

把 `版本号` 替换为刚才 `find` 输出的真实文件名，例如 `activate_idf_v6.0.sh`；不要直接执行脚本，也不要随意把某个版本的激活命令永久写进 `~/.bashrc`。每次新开终端需要使用 `idf.py` 时，重新 `source` 对应脚本。EIM 的[激活脚本说明](https://docs.espressif.com/projects/idf-im-ui/en/latest/after_installing.html)也说明它同时支持 Bash 和 Zsh。

## 4. 安装 VS Code

这里使用微软官方 `.deb` 包，避免 Snap 沙箱给 EIM 图形界面和串口访问带来额外问题。打开 [VS Code 下载页](https://code.visualstudio.com/Download)，选择与你的 `dpkg --print-architecture` 对应的 **Debian/Ubuntu `.deb`** 包，下载后在包所在目录执行：

```bash
sudo apt install ./code_*.deb
code --version
```

若当前目录中有多个 `code_*.deb`，请把通配符改成要安装的准确文件名。官方说明 `.deb` 安装过程会询问是否添加 VS Code 的 APT 软件源，选择添加后，以后可以通过系统更新获取新版。具体步骤见[VS Code Linux 安装文档](https://code.visualstudio.com/docs/setup/linux)。

## 5. 安装并配置 ESP-IDF 插件

打开 VS Code，按 `Ctrl+Shift+X` 进入扩展市场，搜索 **ESP-IDF**，确认发布者是 **Espressif Systems** 后安装。也可以在终端执行：

```bash
code --install-extension espressif.esp-idf-extension
```

安装完成后，按 `F1` 打开命令面板，运行 **ESP-IDF: Select Current ESP-IDF Version**，从列表选择刚才 EIM 安装的版本。再运行 **ESP-IDF: Doctor Command**，检查插件、Python 环境和工具链路径。插件会从 EIM 的 `eim_idf.json` 自动发现安装记录；如果列表为空，先确认文件存在，再在设置里指定 `idf.eimIdfJsonPath` 为真实的 `eim_idf.json` 绝对路径。参见[插件安装与配置文档](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/installation.html)。

> [!TIP] 不要重复安装
> 如果已经用 EIM 安装 ESP-IDF，插件提示打开 Installation Manager 时，无需再安装一遍。先执行 **Select Current ESP-IDF Version** 选中现有环境。VS Code 集成终端若要手动运行 `idf.py`，同样需要在该终端 `source` 对应的激活脚本。

## 6. 建立项目并验证

按 `F1` 运行 **ESP-IDF: New Project**，选择 EIM 安装的版本，再选择 `get-started/hello_world` 示例。填写项目名和保存位置，**Target** 要与开发板的实际芯片型号一致，例如经典 ESP32 选 `esp32`，ESP32-C3 选 `esp32c3`；不确定时看开发板或芯片丝印。点击 **Create Project**，随后打开新项目。

运行 **ESP-IDF: Build your Project**。编译完成并显示 `Building done`，才算软件环境的第一轮验证通过；安装器完成或 Doctor 无报错都不能代替一次真实编译。[新建项目](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/startproject.html)和[编译](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/buildproject.html)的界面步骤可对照官方文档。

有开发板时，用**支持数据传输**的 USB 线连接，运行 **ESP-IDF: Select Port to Use**，选择对应的 `/dev/ttyUSB*` 或 `/dev/ttyACM*`，再运行 **ESP-IDF: Flash your Project**，一般选 `UART`。烧录成功后用插件的 Monitor 查看启动输出。也可在已经激活 ESP-IDF 的终端、项目根目录执行：

```bash
idf.py -p /dev/ttyUSB0 flash monitor
```

`/dev/ttyUSB0` 仅为例子，应换成设备实际端口。`flash` 会自动编译；看到 `Hello world!` 之类的示例日志才说明编译、串口、烧录和程序运行都走通。相关命令见[乐鑫的第一个项目指南](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/start-project.html)。

上面这些界面操作的命令行对应版本，就是下一节。

## 7. 用 `idf.py` 从命令行开发

`idf.py` 是 ESP-IDF 的命令行前端：它在背后调用 CMake 生成构建文件、Ninja 编译、esptool 烧录。上一节用 VS Code 插件做的事都能在这里用命令完成，而且更适合远程登录（比如 SSH 到 Ubuntu 主机、没有图形界面）和写脚本。

两条前提：

1. 当前终端已经用 `source` 激活过 ESP-IDF（见第 3 节），因为 `idf.py` 和交叉编译器都在激活脚本设置的 `PATH` 里。
2. 命令在**工程根目录**执行，也就是含有顶层 `CMakeLists.txt` 的目录。只有 `Makefile` 的老式工程 `idf.py` 不支持。

```bash
source "$HOME/.espressif/tools/activate_idf_v版本号.sh"
cd "$HOME/esp/你的工程"
idf.py --version
idf.py --help
```

`idf.py --version` 输出当前激活的 ESP-IDF 版本；`idf.py --help` 列出全部子命令；`idf.py --list-targets` 列出这个版本支持的芯片目标。子命令自己的选项用 `idf.py monitor --help` 这种形式查。

> [!INFO] 本节命令的来源
> 本节按[乐鑫 `idf.py` 文档](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/tools/idf-py.html)整理，尚未在 Ubuntu 26.04 上逐条执行。每条命令都给出可以在目标机器上核对的结果；串口名和权限问题与第 6 节相同。

### 7.1 创建工程

```bash
mkdir -p "$HOME/esp"
cd "$HOME/esp"
idf.py create-project hello_cli
cd hello_cli
find . -maxdepth 2 -type f | sort
```

`create-project` 只搭骨架，不管芯片型号。关键是这三个文件：

```text
hello_cli/
├── CMakeLists.txt        # 顶层：cmake_minimum_required / include project.cmake / project(hello_cli)
└── main/
    ├── CMakeLists.txt    # 用 idf_component_register 注册 main 组件
    └── hello_cli.c       # 一个空的 app_main()，直接返回
```

`build/` 目录和 `sdkconfig` 要到第一次编译才生成。此时直接 `idf.py build` 就能编过，得到的是一个什么都不做就退出的固件；但这时目标芯片还是默认的 `esp32`，要用自己的芯片得先 `set-target`（见下一小节）。

创建工程相关的子命令：

| 命令 | 作用 |
| --- | --- |
| `idf.py create-project 名字` | 在当前目录创建新工程 |
| `idf.py create-project 名字 --path 目录` | 指定创建到哪个目录 |
| `idf.py create-project 名字 --cpp` | 生成 `.cpp`，并自动用 `extern "C"` 包住 `app_main` |
| `idf.py create-component 组件名` | 新建组件骨架，`-C 目录` 指定创建位置 |
| `idf.py create-project-from-example "命名空间/组件名=版本:示例名"` | 从 ESP Component Registry 的示例创建工程 |

`create-project-from-example` 的参数格式是 `namespace/name=1.0.0:example`，双引号不能省，否则 shell 会先把 `=` 和 `:` 解释掉；这个命令需要联网下载组件。

> [!TIP] 想看完整例子
> 从空工程一路改到能点亮 LED 的完整过程，包括改 `main/CMakeLists.txt`、写 `sdkconfig.defaults`、分层成 BSP，见[下一篇](./02-dnesp32s3-idf-create-project-led.md)。

### 7.2 选择目标芯片

```bash
idf.py set-target esp32s3
```

一条命令完成“清空 build → 备份 sdkconfig → 以新目标重新配置”。核对方式：命令结束后 `sdkconfig` 里出现 `CONFIG_IDF_TARGET="esp32s3"`。

> [!WARNING] `set-target` 会清掉已有配置
> 官方文档明确说明 `idf.py set-target` 等价于 `idf.py fullclean` + `mv sdkconfig sdkconfig.old` + 以新目标 `reconfigure`。也就是说 **build 目录被清空、`sdkconfig` 从零重建**，之前在 menuconfig 里改过的选项全部失效（旧文件备份成 `sdkconfig.old`）。所以先定芯片，再调配置。

如果希望工程 clone 下来就默认是正确的芯片，把目标写进工程的 `sdkconfig.defaults`：

```text
CONFIG_IDF_TARGET="esp32s3"
```

官方文档给出的关系是：只要用了 `idf.py set-target`、`-DIDF_TARGET=...`（CMake 变量）或环境变量 `IDF_TARGET`，就以它们为准；这三者都没有时，才用 `sdkconfig.defaults` 里的 `CONFIG_IDF_TARGET`；连它也没有，则默认编译 `esp32`。

### 7.3 配置工程：`menuconfig` 与 `sdkconfig`

```bash
idf.py menuconfig
```

菜单里的常用按键：方向键移动，`Enter` 或 `Space` 进入菜单/切换取值，`ESC` 返回上一级，`?` 查看当前选项的帮助，`/` 按名字搜索选项，`Q` 退出（会先问是否保存）。不同版本的菜单界面不完全一样，以界面底部的按键提示为准。

两个配置文件的分工：

| 文件 | 谁写 | 用途 |
| --- | --- | --- |
| `sdkconfig` | menuconfig 自动生成 | 本工程的实际配置，**不要手改** |
| `sdkconfig.defaults` | 你手写 | 工程基线，`sdkconfig` 重建时作为默认值 |

「不要手改 `sdkconfig`」的原因是选项之间有依赖关系，手工拼出来的组合可能自相矛盾；要改就通过 menuconfig。改完之后，如果想在工程里留一份可版本管理的最小配置，用：

```bash
idf.py save-defconfig
```

它把「与默认值不同的项」写进 `sdkconfig.defaults`，比手工抄一堆 `CONFIG_...` 可靠。删掉 `sdkconfig` 再 `idf.py build`，构建系统会先按 `sdkconfig.defaults` 生成新的 `sdkconfig`，这条路径正好可以用来验证默认值有没有写对。

### 7.4 编译

```bash
idf.py build
```

核对：结尾出现 `Project build complete`，命令返回 0，`build/` 下出现三类产物：

```bash
ls build/*.bin build/bootloader/*.bin build/partition_table/*.bin
```

- `build/hello_cli.bin`：应用固件，文件名来自顶层 `CMakeLists.txt` 里的 `project()`。
- `build/bootloader/bootloader.bin`：二级引导程序。
- `build/partition_table/partition-table.bin`：分区表。

编译是**增量**的：源码和配置都没变时什么都不会重做。几个常用开关：

| 命令 | 作用 |
| --- | --- |
| `idf.py app` / `bootloader` / `partition-table` | 只编译应用 / 引导程序 / 分区表 |
| `idf.py -j 6 build` | 限制并行编译任务数（等价于 `IDF_PY_BUILD_JOBS=6 idf.py build`） |
| `idf.py -v build` | 打印真正的编译命令行，排查编译错误时有用 |
| `idf.py --ccache build` | 启用 ccache 加速重复编译 |
| `idf.py build --no-hints` | 关掉出错时自动给出的修复提示 |

清理相关命令的区别值得记住：

| 命令 | 删掉什么 | 什么时候用 |
| --- | --- | --- |
| `idf.py clean` | build 里编译产物，保留 CMake 配置 | 怀疑增量编译结果不对 |
| `idf.py fullclean` | 整个 build 目录 | 换目标、换工具链、CMake 报奇怪的错 |
| `idf.py reconfigure` | 不删文件，强制重跑 CMake | 增删了源文件或组件、改了 CMake 变量 |

> [!WARNING] `fullclean` 会递归删除 build 目录里的所有东西
> 官方文档特别提醒这一点。它不碰 `sdkconfig`，但 build 目录里如果放了自己的东西，就一起没了。

固件占多大，用 size 系列命令看：

```bash
idf.py size
idf.py size-components
idf.py size-files
```

`size` 报告 RAM、Flash 占用和各段大小，用来判断固件塞不塞得进分区；换成 `size-components` / `size-files` 可以定位到具体组件或源文件。加 `--format csv|json2` 便于脚本处理。

### 7.5 烧录与串口监视

```bash
idf.py -p /dev/ttyUSB0 flash
idf.py -p /dev/ttyUSB0 monitor
```

`-p` 指定串口，`-b` 指定烧录波特率（例如 `-b 921600`）。不想每次都敲端口，可以用环境变量给默认值：

```bash
export ESPPORT=/dev/ttyUSB0
export ESPBAUD=921600
```

`flash` 会**先自动编译**，所以日常改完代码只需要一条命令。它默认是增量烧写：如果 `build/` 里留着上次烧录的 `*_flashed.bin`，就只写变化过的扇区，写完再校验 flash 内容与预期是否一致；没有这些记录时，则先比对设备 flash 里的内容，已经一致的文件跳过。换新板子或刚擦过 flash 时用 `idf.py flash -a`（或 `--all`）强制全量烧写。

`monitor` 是串口监视器，退出按 `Ctrl+]`。它还有一层以 `Ctrl+T` 开头的快捷键：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl+T` `Ctrl+H` | 列出全部快捷键 |
| `Ctrl+T` `Ctrl+F` | 不退出监视器，重新编译并烧录 |
| `Ctrl+T` `Ctrl+Y` | 暂停/恢复屏幕上的日志输出 |
| `Ctrl+T` `Ctrl+R` | 通过 RTS 复位开发板 |

日志太多时可以只打印关心的部分：

```bash
idf.py monitor --print-filter="wifi:I esp_image:E"
```

规则是 `标签:级别`，级别取 `N E W I D V *` 中的一个；不写级别等于 `*`（Verbose，即全部打印）。默认监视器在连接时会复位芯片，只想看已有输出、不希望复位时加 `--no-reset`。

把 flash 擦回空白状态：

```bash
idf.py -p /dev/ttyUSB0 erase-flash
```

它擦的是**整片 flash**，包括 NVS 里保存的数据，不只是应用分区。改分区表、做 OTA 实验、或者想从“出厂空白”状态重来时用。

### 7.6 组合命令与日常循环

多条子命令可以写在一次调用里，`idf.py` 会自动按正确顺序执行（该先编译的先编译，该先擦除的先擦除），顺序写反也没关系：

```bash
idf.py -p /dev/ttyUSB0 erase-flash flash monitor
```

日常改代码的循环通常就一条：

```bash
idf.py -p /dev/ttyUSB0 flash monitor
```

把这一节用到的命令汇总：

| 命令 | 作用 |
| --- | --- |
| `idf.py create-project 名字` | 新建工程 |
| `idf.py create-component 名字` | 新建组件 |
| `idf.py set-target 芯片` | 选择目标芯片（清空 build、重建 sdkconfig） |
| `idf.py menuconfig` | 图形化配置工程 |
| `idf.py save-defconfig` | 把改动导出成 `sdkconfig.defaults` |
| `idf.py build` | 编译 |
| `idf.py -p 串口 flash` | 编译并烧录 |
| `idf.py -p 串口 monitor` | 打开串口监视器（`Ctrl+]` 退出） |
| `idf.py -p 串口 erase-flash` | 擦除整片 flash |
| `idf.py size` | 查看固件占用 |
| `idf.py clean` / `fullclean` | 清理构建产物 / 清空 build 目录 |
| `idf.py reconfigure` | 强制重跑 CMake |
| `idf.py docs` | 用浏览器打开当前版本、当前芯片的文档 |

几个跨子命令的全局选项，写在 `idf.py` 和子命令之间：

| 选项 | 作用 |
| --- | --- |
| `-C 目录` | 操作指定工程，不必先 `cd` |
| `-B 目录` | 换 build 目录（默认 `build`） |
| `-p 串口` / `-b 波特率` | 串口与烧录波特率 |
| `-D 变量=值` | 传 CMake 变量，例如 `idf.py -DIDF_TARGET=esp32s3 reconfigure` |
| `-v` | 输出详细编译过程 |
| `--ccache` | 启用 ccache |
| `--no-hints` | 关掉错误修复提示 |

两点容易踩的坑：

- **连字符不是下划线。** 从 ESP-IDF v5.0 起子命令统一用连字符（`erase-flash`、`size-components`），旧的下划线写法（`erase_flash`）只会给一条弃用警告。看到教程里写下划线，说明那份教程比较老。
- **参数可以写进文件。** 形如 `idf.py @my_flash.txt monitor` 的写法会把文件内容当成命令行参数展开，文件里每行可以写一个参数加取值（例如 `flash --baud 115200`），适合固定一组常用参数。

## 常见问题

### VS Code 找不到已安装的 ESP-IDF

先检查 `~/.espressif/tools/eim_idf.json` 是否存在，再用 **ESP-IDF: Select Current ESP-IDF Version** 选择。自定义目录安装时，把 `idf.eimIdfJsonPath` 指向实际 JSON 文件。最后运行 **ESP-IDF: Doctor Command** 查看插件报告，不要凭猜测手写 `IDF_PATH`。

### `idf.py: command not found`

新终端尚未激活环境。用 `find "$HOME/.espressif/tools" -maxdepth 1 -name 'activate_idf_*.sh' -print` 找到脚本，`source` 正确版本后再试 `idf.py --version`。

### 串口 `Permission denied`

先用 `ls -l /dev/ttyUSB0`（或实际端口）查看设备所属组。Ubuntu 上常见为 `dialout`，若确实如此，运行：

```bash
sudo usermod -aG dialout "$USER"
```

随后**退出登录并重新登录**，用 `groups` 确认当前会话已包含 `dialout`，再重新插拔开发板并烧录。不要用 `sudo idf.py` 掩盖权限问题。如果设备组不是 `dialout`，按实际组处理。参见[乐鑫串口权限说明](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/start-project.html)。

### EIM 窗口在 VS Code 中打不开

先在系统终端直接运行 `eim`；如果通过 Snap 安装了 VS Code，留意沙箱限制。乐鑫的[插件排错文档](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/troubleshooting.html)建议改用官方 `.deb` 版本，并可通过 **ESP-IDF: Doctor Command** 定位 EIM 路径问题。

## 参考资料

- [乐鑫：Linux 上安装 ESP-IDF 与 EIM](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-setup.html)
- [乐鑫：`idf.py` 命令（IDF Frontend）](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/tools/idf-py.html)
- [乐鑫：构建系统与组件](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/build-system.html)
- [乐鑫：IDF Monitor 串口监视器](https://docs.espressif.com/projects/esp-idf/en/v5.5/esp32/api-guides/tools/idf-monitor.html)
- [乐鑫：工程配置与 sdkconfig](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-guides/kconfig/project-configuration-guide.html)
- [乐鑫：EIM 安装后的激活脚本](https://docs.espressif.com/projects/idf-im-ui/en/latest/after_installing.html)
- [乐鑫：VS Code ESP-IDF 插件安装](https://docs.espressif.com/projects/vscode-esp-idf-extension/en/latest/installation.html)
- [微软：在 Linux 安装 VS Code](https://code.visualstudio.com/docs/setup/linux)
