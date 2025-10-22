---
title: "zellij使用入门"
date: 2025-10-09
draft: false
toc: true
tags: ["工具", "终端", "zellij"]
---

- [官网](https://zellij.dev/)

起因: 我不想再使用tmux ,因为它配置起来很麻烦, 而且快捷键也需要大量的定制才能用得顺手. 在寻找替代品的过程中, 我发现了 Zellij, 一个现代的终端多路复用器, 它开箱即用, 功能强大且易于上手.

## 什么是 Zellij?

Zellij 是一个为开发者、运维工程师和所有终端爱好者设计的终端工作区. 它内置了布局系统、标签页和强大的命令窗格, 让你可以在一个窗口中轻松管理多个终端会话. 与 `tmux` 类似, 即使你断开 SSH 连接, 你的终端会话也会保持运行.

## 安装

在 macOS 上, 你可以使用 Homebrew 轻松安装:

```bash
brew install zellij
```

对于其他操作系统, 请参考[官方安装文档](https://zellij.dev/documentation/installation.html).

## 快速入门

### 启动和退出

直接在终端中输入 `zellij` 即可启动一个新的会话:

```bash
zellij
```

你会看到 Zellij 的界面, 底部有一条状态栏, 显示了当前的模式和一些有用的提示.

要退出 Zellij, 你可以:
1.  在所有窗格中输入 `exit` 来关闭它们.
2.  使用快捷键 `Ctrl + q`, 然后按 `y` 确认.

### 分离 (Detach) 和恢复 (Attach) 会话

这是终端多路复用器的核心功能. 你可以在一个会话中工作, 然后安全地断开它, 让程序在后台继续运行.

- **分离会话**: 在会话中按下 `Ctrl + o`, 然后按 `d`.
- **列出所有会话**:
  ```bash
  zellij list-sessions
  ```
- **恢复会话**:
  ```bash
  zellij attach <SESSION_NAME>
  ```

## 基本操作

Zellij 的一大优点是其用户友好的快捷键. 当你按下 `Ctrl` 组合键时, 底部栏会提示你接下来可以按哪些键.

### 窗格 (Panes) 管理

- `Ctrl + p`: 进入窗格管理模式.
  - `n`: 创建一个新窗格 (默认在右侧).
  - `d`: 在下方创建一个新窗格.
  - `h` / `j` / `k` / `l` (或方向键): 在窗格之间移动.
  - `x`: 关闭当前窗格.
  - `f`: 全屏当前窗格.
  - `[` / `]`: 在上一个/下一个活动窗格之间切换.

### 标签页 (Tabs) 管理

- `Ctrl + t`: 进入标签页管理模式.
  - `n`: 创建一个新标签页.
  - `h` / `l` (或方向键): 在标签页之间切换.
  - `x`: 关闭当前标签页.

### 滚动和搜索

- `Ctrl + s`: 进入滚动模式.
  - 你可以使用 `k` / `j` 或 `PageUp` / `PageDown` 来上下滚动.
  - 在滚动模式下, 输入 `/` 可以进行搜索.


## 配置

Zellij 的配置非常灵活，使用 [KDL](https://kdl.dev/) 语言。你可以通过创建一个配置文件来自定义 Zellij 的几乎所有方面，从主题到快捷键和布局。

### 创建配置文件

要开始配置 Zellij，你需要创建一个配置文件。你可以让 Zellij 为你生成一个默认的配置文件：

```bash
zellij setup --dump-config > ~/.config/zellij/config.kdl
```

这会将默认配置写入 `~/.config/zellij/config.kdl` 文件中。现在你可以编辑这个文件来自定义你的 Zellij 体验。

### 常用配置示例

#### 1. 更改主题

Zellij 内置了多款主题。你可以在配置文件中设置 `theme` 选项来更改主题。例如，要使用 `gruvbox-dark` 主题：

```kdl
// In ~/.config/zellij/config.kdl
theme "gruvbox-dark"
```

你可以在[官方主题仓库](https://github.com/zellij-org/zellij-themes)找到更多主题。

#### 2. 自定义快捷键

你可以重新绑定快捷键以适应你的工作流程。例如, 如果你想将"锁定界面"的快捷键从 `Ctrl + g` 改为 `Ctrl + l`:

```kdl
// In ~/.config/zellij/config.kdl
keybinds {
    unbind "Ctrl g"
    locked {
        bind "Ctrl l" { Lock; }
    }
}
```

#### 3. 默认布局

你可以设置 Zellij 启动时加载的默认布局。首先，你需要创建一个布局文件（例如 `~/.config/zellij/layouts/my-layout.kdl`），然后在配置文件中指定它：

```kdl
// In ~/.config/zellij/config.kdl
default_layout "my-layout"
```

Zellij 的配置选项非常丰富，你可以查阅[官方文档](https://zellij.dev/documentation/configuration.html)了解所有可用的配置项。


## 布局

###  一个例子


```
// layout_file.kdl

layout {
    pane
    pane split_direction="vertical" {
        pane
        pane command="htop"
    }
}
```

### 导出一个默认布局

```
zellij setup --dump-layout default > /tmp/my-quickstart-layout-file.kdl
```

### 创建一个自己的布局`


### 修改默认的float panel 的大小

默认的float 布局,对我来说，太小了我希望把它改大一点



## 为什么选择 Zellij?

- **开箱即用**: 默认配置和快捷键非常直观, 无需像 `tmux` 那样进行大量配置.
- **用户友好**: 状态栏会根据你按下的键提供上下文提示, 极大地降低了学习成本.
- **内置布局**: Zellij 拥有强大的布局系统, 可以保存和加载复杂的窗格布局.
- **WebAssembly 插件**: 支持使用任何可以编译为 WASM 的语言编写插件, 扩展性强.
## 总结









Zellij 是一个出色的 `tmux` 替代品, 特别是对于那些厌倦了复杂配置并希望获得现代化终端体验的用户. 它让你能够更专注于工作本身, 而不是工具的配置. 如果你还在使用 `tmux` 或者正在寻找一个终端多路复用器, 我强烈建议你试试 Zellij.