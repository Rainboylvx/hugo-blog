---
title: "macM1配置haskell环境"
date: 2025-11-03
draft: false
toc: true
tags: ["AI"]
categories: [""]
---




在 M1 芯片的 Mac 上配置 Haskell + VS Code 环境现在已经非常顺畅。Apple Silicon (M1/M2/M3) 得到了很好的支持。

这篇指南会带你走过最佳实践的路径，使用 `GHCup` 来管理工具链，并使用 `Haskell Language Server (HLS)` 来驱动 VS Code 获得智能提示。

-----

### 🛠️ M1 Mac + VS Code + Haskell 环境配置指南

这是一个三步走的过程：

1.  **安装 GHCup**：这是目前推荐的 Haskell 工具链管理器（类似于 Rust 的 `rustup` 或 Node.js 的 `nvm`）。它会为你安装所有核心组件。
2.  **配置 VS Code**：安装官方的 Haskell 扩展。
3.  **验证与创建项目**：创建一个 "Hello, World" 项目来确保一切正常工作。

-----

### 步骤 1：安装 Haskell 工具链 (GHCup)

`GHCup` 是关键。它会为你管理和安装：

  * **GHC**：Haskell 的编译器。
  * **Cabal**：Haskell 的标准构建工具和包管理器。
  * **HLS** (Haskell Language Server)：VS Code 赖以实现智能提示、错误检查和代码跳转的“大脑”。
  * **Stack**（可选）：另一个流行的构建工具。

#### 1.1. 安装 GHCup

打开你的终端 (Terminal)，运行以下命令：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh
```

#### 1.2. 遵循 GHCup 提示

安装脚本会引导你完成几个设置：

  * 当它询问是否安装 `ghc`, `cabal`, `hls` 和 `stack` 时，\*\*全部选择 Yes (按回车键 'Enter' 默认) \*\*。
  * 它可能会询问是否将 `~/.ghcup/bin` 添加到你的 `PATH` 环境变量中。选择 Yes。
  * 它可能会询问是否安装 `stack`。建议选择 Yes，即使你刚开始主要用 Cabal。

#### 1.3. 重启终端或激活环境

安装完成后，**完全关闭并重新打开你的终端**，以确保新的 `PATH` 生效。

或者，你也可以运行 `source "$HOME/.ghcup/env"` 来立即激活。

#### 1.4. 验证安装

在新的终端窗口中，运行以下命令来检查版本。你应该能看到它们各自的版本号，而不是 "command not found"。

```bash
ghc --version
cabal --version
hls --version
```

> **注意**：`ghcup` 会自动为你安装 M1 芯片原生 (aarch64) 的版本，你不需要担心 Rosetta 2 的转译。

-----

### 步骤 2：配置 VS Code 扩展

这是最简单的一步。`GHCup` 已经把困难的部分 (HLS) 处理好了。

1.  打开 VS Code。
2.  转到 **Extensions** 视图 (快捷键 `⇧⌘X`)。
3.  搜索 "Haskell"。
4.  安装由 **Haskell** 团队发布的官方扩展（它就叫 "Haskell"）。

安装完成后，这个扩展会自动检测到你通过 `ghcup` 安装的 `hls`。

-----

### 步骤 3：验证与创建你的第一个项目 (使用 Cabal)

现在，我们来创建一个简单的项目，并在 VS Code 中打开它，以确保 HLS 正常启动。

#### 3.1. 创建项目

在你的终端里，运行：

```bash
# 1. 创建一个新目录并进入
mkdir hello-haskell
cd hello-haskell

# 2. 使用 cabal 初始化一个新项目
# -n (non-interactive) 选项会使用默认设置跳过所有问题
cabal init -n
```

这会创建几个文件，最重要的是：

  * `hello-haskell.cabal`：项目配置文件（类似 `package.json`）。
  * `app/Main.hs`：你的主程序入口。

#### 3.2. 在 VS Code 中打开

在 `hello-haskell` 目录中，运行：

```bash
code .
```

> `code .` 命令会使用 VS Code 打开当前目录。

#### 3.3. 观察 HLS 启动

当你打开项目（特别是 `app/Main.hs` 文件）时，请注意 VS Code 的底部状态栏。

你可能会看到 "HLS: Initializing..." 或 "HLS: Building..." 之类的消息。这表示 Haskell Language Server 正在分析你的项目依赖。第一次启动可能会花一两分钟。

**启动成功后**，你将获得：

  * 代码高亮
  * 将鼠标悬停在函数上时的类型提示
  * 实时错误检查（如果你故意写错代码）

#### 3.4. 运行你的项目

回到你的 VS Code **集成终端** (快捷键 `⌃` + `     ` \` )。

运行：

```bash
cabal run
```

Cabal 会编译你的项目并执行它。你应该会看到 `app/Main.hs` 文件中默认的 "Hello, world\!" 输出。

-----

### 💡 重点总结与建议

  * **GHCup 是核心**：如果你需要更新 GHC 或 HLS，请使用 `ghcup` (例如 `ghcup install hls 1.10.0.0` 或使用 `ghcup tui` 进入图形化管理界面)。
  * **HLS 是 VS Code 的大脑**：如果 VS Code 看起来“没有反应”（没有智能提示），通常意味着 HLS 遇到了问题。检查 VS Code 底部状态栏的 HLS 图标，或者在输出面板 (Output) 中查看 "Haskell Language Server" 的日志。
  * **Cabal vs. Stack**：`ghcup` 帮你同时安装了 `cabal` 和 `stack`。它们都是构建工具。对于初学者，`cabal` 已经足够优秀且是标准。你暂时不需要担心 `stack`。

你现在已经拥有一个功能完备的 Haskell 开发环境了！
