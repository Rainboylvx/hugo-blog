---
title: "ACM 课程前期准备：C++ 环境与 AI 助教"
date: 2026-09-25
draft: true
toc: true
tags: ["ACM", "C++", "WSL", "VS Code"]
---

这份清单请在**开课前一天**完成。上课时间用来写题和讨论算法，不用来现场安装环境。完成标准是：能在 Ubuntu 终端编译、运行一个 C++ 程序，并能用 VS Code 打开同一个目录。AI 助教是选做项；没有账号、API Key 或付费额度，也可以完成基础准备。

## 先确认自己的系统

| 电脑 | 准备方式 |
| --- | --- |
| Windows 11 | 按下文安装 WSL 2、Ubuntu、VS Code，然后在 Ubuntu 内安装 C++ 工具 |
| 已安装 Ubuntu 的 Linux 电脑 | 跳过 WSL 安装，直接从「安装 C++ 工具」开始 |

本课程统一在 **Ubuntu 终端**里运行 `g++`、`gdb` 和 `git`。Windows 同学把代码放在 Ubuntu 的家目录，例如 `~/acm`，不要把课程工程放在 `/mnt/c/...`。微软的 [WSL 文件存放建议](https://learn.microsoft.com/en-us/windows/wsl/filesystems)也建议把 Linux 命令频繁访问的文件放在 Linux 文件系统中。

## 1. Windows：安装 WSL 2 和 Ubuntu

以管理员身份打开 **PowerShell**，运行：

```powershell
wsl --install
```

按提示重启电脑。首次启动 Ubuntu 时，设置一个 Linux 用户名和密码；输入密码时终端不会显示字符，这是正常的。回到 PowerShell，检查发行版和 WSL 版本：

```powershell
wsl --list --verbose
```

列表中应能看到 Ubuntu，`VERSION` 应为 `2`。然后从开始菜单打开 Ubuntu，以下标注为 `bash` 的命令都在 **Ubuntu 终端**运行。如果安装命令报错，先看[微软的 WSL 安装说明](https://learn.microsoft.com/en-us/windows/wsl/install)和错误提示，不要在 Windows PowerShell 里执行 `apt`。

已有 Ubuntu 实机的同学直接打开终端，继续下一步。

## 2. Ubuntu：安装 C++ 工具

```bash
sudo apt update
sudo apt install build-essential gdb git
g++ --version
gdb --version
git --version
```

`build-essential` 包含课程需要的 C++ 编译工具。最后三条命令都能显示版本号，才算安装成功。这里不要求先安装 CMake；第一周的单文件程序用一条 `g++` 命令即可编译。

## 3. 安装 VS Code，并连接 Ubuntu

Windows 同学在 Windows 中安装 [VS Code](https://code.visualstudio.com/)，在扩展市场安装微软的 **WSL** 扩展。打开 Ubuntu 终端，建立课程目录并在 VS Code 中打开：

```bash
mkdir -p ~/acm
cd ~/acm
code .
```

VS Code 打开后，确认左下角显示 WSL 连接状态；在扩展页面给 **WSL: Ubuntu** 安装微软的 **C/C++** 扩展。注意窗口和终端是否都在 Ubuntu 环境，避免在 Windows 与 Ubuntu 各建一份 `main.cpp`。具体界面可参考 [VS Code 的 WSL 指南](https://code.visualstudio.com/docs/remote/wsl)和 [WSL C++ 配置说明](https://code.visualstudio.com/docs/cpp/config-wsl)。

Ubuntu 实机的同学安装 VS Code 后，在普通终端运行相同的 `mkdir`、`cd`、`code .` 命令，并安装 C/C++ 扩展；界面不会显示 WSL 标识。

## 4. 编译并运行第一个程序

在 `~/acm` 中新建 `main.cpp`：

```cpp
#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "ACM Ready!" << endl;
    return 0;
}
```

打开 VS Code 的 Ubuntu 终端，确认当前目录是 `~/acm`，然后运行：

```bash
pwd
g++ main.cpp -std=c++20 -O2 -Wall -Wextra -o main
./main
```

最后应输出 `ACM Ready!`。`g++` 成功时通常不输出内容；`-std=c++20` 指定语言标准，`-O2` 开启常用优化，`-Wall -Wextra` 显示更多编译警告，`-o main` 指定可执行文件名。以后改完代码，要**重新编译再运行**，否则 `./main` 仍可能是旧程序。

> [!IMPORTANT] 课前基础验收
> 能展示 `g++ --version`、`gdb --version`、`git --version`，并在 VS Code 打开的 `~/acm` 目录运行出 `ACM Ready!`。AI 工具不属于基础验收。

## 5. 选做：在 VS Code 中使用 AI 助教

先学会自己读题、估计复杂度、写代码和造样例。AI 可以帮助检查思路、指出边界情况、解释报错；它的答案需要自己验证。不要直接让它代写题解或覆盖自己的代码。

草稿中使用的是 [DeepSeek V4 for Copilot Chat](https://marketplace.visualstudio.com/items?itemName=Vizards.deepseek-v4-for-copilot)，作者为 **Vizards**。它是可选插件，并非 VS Code 自带的免费 DeepSeek 服务。按该插件目前的 [项目说明](https://github.com/Vizards/deepseek-v4-for-copilot/blob/main/README.zh-cn.md)，使用它还需要兼容版本的 VS Code、可用的 GitHub Copilot 账号，以及单独申请的 DeepSeek API Key；API 调用可能产生费用。插件与 VS Code / Copilot Chat 更新后的兼容情况也可能变化，安装前以项目说明为准。

愿意使用此方案的同学按下面操作：

1. 在 VS Code 中登录 GitHub Copilot，并确认 Chat 可用。
2. 在扩展市场搜索 **DeepSeek V4 for Copilot Chat**，核对作者 **Vizards** 后安装。不要只凭名称安装其他同名插件。
3. 自行前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册，在 [API Keys 页面](https://platform.deepseek.com/api_keys)创建 Key；需要额度时按平台的实际提示处理。**不要把 Key 发给同学、教师或 AI，也不要写进 `main.cpp`、`AGENTS.md`、截图或 Git 仓库。**
4. 按 `Ctrl+Shift+P` 打开命令面板，输入 `DeepSeek`，选择 **DeepSeek: Set API Key**（中文界面可能显示「设置 API Key」），在输入框粘贴自己的 Key。
5. 打开 VS Code Chat，在模型选择器中选该插件提供的 DeepSeek 模型，再发送一条简短问题，确认能收到回复。

![在扩展市场核对插件名称和作者](./images/SCR-20260925-kfzv.png)

![在命令面板设置 API Key](./images/SCR-20260925-kmaj.png)

![在 Chat 中选择 DeepSeek 模型](./images/SCR-20260925-koef.png)

截图用于辨认入口；不同系统、主题和插件版本的按钮文字可能不同。**能在 VS Code Chat 中收到该模型的回复**，才算 AI 部分配置成功。只安装插件或只保存 Key 都不等于调用成功。若不想注册或付费，跳过整节即可。

## 6. 让 AI 像助教一样工作

对话前先写出自己的想法。以下提示词可以直接复制，并把题目描述和当前代码提供给 Agent：

```text
你是我的 ACM 助教。请阅读题目和我当前的 main.cpp。
不要直接给完整答案，也不要修改文件。

请依次帮助我：
1. 根据数据范围估计可接受的时间复杂度。
2. 判断我的思路是否正确；如果有问题，先只给一个提示。
3. 指出我可能遗漏的边界情况。
4. 等我自己修改后，再继续检查。
```

如果程序在 OJ 上得到 WA，可以这样问：

```text
我的程序在 OJ 上 WA。请阅读题目和 main.cpp，不要修改文件。
请构造一组尽量小的反例，写出正确输出和我的程序实际输出，
再解释两者为什么不同。请不要直接给我完整修改版代码。
```

拿到反例后，自己在终端运行它，检查 AI 给的“正确输出”是否符合题意。AI 可能误读题目或算错样例；没有亲自验证的反例不能当作结论。

### 可选：给练习目录放一份 `AGENTS.md`

如果所用 Agent 支持读取项目级指令，可在 `~/acm` 创建 `AGENTS.md`，写入自己的学习规则：

```markdown
# ACM 学习规则

你是一名 ACM 算法助教。目标是帮助我学会解题，而不是替我完成题目。

1. 先询问我当前的思路，不直接给完整代码。
2. 提示顺序：数据范围、时间复杂度、算法方向、关键性质、伪代码。
3. 我写出代码后，可以帮我 Debug；优先指出位置和原因。
4. AC 后帮我分析时间复杂度、空间复杂度、边界情况，并提醒我自己总结。
5. 未经我同意，不修改项目文件或执行可能改动文件的命令。
```

VS Code 支持将项目中的 `AGENTS.md` 作为 Agent 指令，但实际是否读取还取决于当前使用的 Agent 和配置。首次对话可以请它复述本目录的学习规则来检查；如果没有生效，就把规则粘贴到对话中。参见 [VS Code 项目指令文档](https://code.visualstudio.com/docs/agent-customization/custom-instructions)。

### 可选：让 Agent 检查整个练习目录

建立一个独立目录，例如 `~/acm/acm-test/`，把题目说明和 `main.cpp` 放进去，然后提出：

```text
阅读当前目录的题目说明和 main.cpp。先告诉我你准备执行哪些命令。
在我确认后，编译程序，生成一些小规模测试数据并运行。
只报告失败的输入、实际输出、你推导的正确输出和原因；不要修改文件。
```

这样 Agent 才能把读文件、编译、运行和分析串起来。执行前先看清它提出的终端命令；如果它需要文件编辑或终端执行许可，按实际操作决定是否批准。先在练习目录试用，不要把未检查的命令直接用于重要文件。

## 遇到问题先检查这些

| 现象 | 检查方法 |
| --- | --- |
| `g++: command not found` | 确认终端是 Ubuntu；重新运行 `sudo apt update` 和 `sudo apt install build-essential` |
| VS Code 打开了错误目录 | 在 Ubuntu 终端运行 `cd ~/acm && code .`，再检查窗口左下角是否为 WSL |
| 改完代码运行结果没变化 | 先重新执行 `g++ main.cpp -std=c++20 -O2 -Wall -Wextra -o main`，再运行 `./main` |
| 插件里找不到 DeepSeek 模型 | 确认装的是 Vizards 的插件、Copilot Chat 已登录、插件和 VS Code 版本符合项目说明 |
| AI 提示鉴权、余额或网络错误 | 核对 Key 是否配置成功、平台账号状态与余额；不要把完整 Key 或含 Key 的日志发到群里 |

课前只需提交或展示**基础验收的终端结果**。有余力再尝试 AI 助教，并在第一堂课带来一个自己遇到的编译错误或边界情况。
