---
title: "第1章 入门指南 (Getting Started)"
date: 2026-07-08
draft: false
toc: true
tags: ["读书笔记"]
---

- [原文（英文）](https://doc.rust-lang.org/book/ch01-00-getting-started.html)
- [原文（中文）](https://rustwiki.org/zh-CN/book/ch01-00-getting-started.html)

本章内容：安装 Rust、编写第一个程序、使用 Cargo 管理项目。

## 1.1 安装

Rust 通过 `rustup` 安装，这是 Rust 版本管理和工具链管理器。

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装后验证：

```bash
rustc --version   # 输出类似 rustc x.y.z (abcabcabc yyyy-mm-dd)
cargo --version
```

**额外依赖**：Rust 需要一个 C 编译器来链接。Arch 用 `pacman -S base-devel`，Ubuntu 用 `apt install build-essential`，macOS 用 `xcode-select --install`。

常用管理命令：

```bash
rustup update          # 更新 Rust
rustup self uninstall  # 卸载
rustup doc             # 打开本地离线文档
```

> [!IMPORTANT] 稳定性保证
> Rust 编译器保证向后兼容。本书所有能编译的示例，在新版本中依然能通过编译。

## 1.2 Hello, World!

### 创建项目

```bash
mkdir ~/projects
cd ~/projects
mkdir hello_world
cd hello_world
```

### 编写代码

文件名：`main.rs`

```rust
fn main() {
    println!("Hello, world!");
}
```

### 编译与运行

```bash
rustc main.rs   # 编译：生成二进制文件 main（或 main.exe）
./main          # 运行：输出 Hello, world!
```

Rust 是**预编译语言**（ahead-of-time compiled），编译后的二进制可以独立发给没有安装 Rust 的人运行，跟 C/C++ 一样。

### 程序剖析

- `fn main() {}` — 声明 `main` 函数，每个可执行 Rust 程序的入口。
- `println!` — 这是一个**宏**（macro），`!` 是宏的标志。普通的函数调用没有 `!`。
- `"Hello, world!"` — 字符串字面量，传入 `println!` 后打印。
- `;` — 表示表达式结束。Rust 的大多数行以分号结尾。
- 缩进使用 4 个空格，不是 Tab。可以用 `rustfmt` 自动格式化。

> [!TIP] 装在不同平台
> `rustc` 编译后生成平台相关的二进制。在 Linux 上生成 `main`，Windows 上生成 `main.exe`。Cargo 统一了命令，后面不再区分平台。

## 1.3 Hello, Cargo!

Cargo 是 Rust 的**构建系统**和**包管理器**。绝大多数 Rust 项目都用 Cargo。

### 创建 Cargo 项目

```bash
cargo new hello_cargo
cd hello_cargo
```

生成的文件结构：

```
hello_cargo/
├── Cargo.toml       # 项目配置（包名、版本、依赖）
├── src/
│   └── main.rs      # 源代码
└── .gitignore       # Cargo 默认初始化 Git 仓库
```

`Cargo.toml` 内容：

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2021"        # Rust 大版本号

[dependencies]           # 依赖项写在这里
```

`edition` 表示 Rust 的**大版本**（2015 / 2018 / 2021）。同一 edition 下 Rust 保证向后兼容。本书使用 2021 edition。

### 常用 Cargo 命令

| 命令 | 作用 |
|------|------|
| `cargo build` | 编译（debug 模式），输出在 `target/debug/` |
| `cargo run` | 编译 + 运行 |
| `cargo check` | 仅检查能否编译，不生成二进制（比 `build` 快得多） |
| `cargo build --release` | 优化编译（release 模式），输出在 `target/release/` |

```bash
cargo build              # 首次 build，还会生成 Cargo.lock（记录实际依赖版本）
cargo build              # 再次 build，代码没改则直接跳过
cargo run                # 修改代码后，run 会自动重新编译再运行
cargo check              # 开发时建议多用 check，速度更快
cargo build --release    # 发布前用 release 模式，运行更快但编译更慢
```

> [!TIP] Cargo 对比 rustc
> 简单项目用 `rustc` 和 `cargo` 区别不大，但项目变复杂（多文件、多 crate、外部依赖）后，Cargo 的价值就体现出来了。从一开始就习惯用 Cargo。

## 总结

- Rust 通过 `rustup` 一站式安装管理。
- `rustc` 编译 `.rs` 源文件生成独立二进制，Rust 是预编译语言。
- `println!` 是宏，`!` 表示宏调用。
- Cargo 是 Rust 事实标准构建工具，`cargo new` 创建项目，`cargo build/run/check` 管理构建。
- `Cargo.toml` 是项目清单文件，`Cargo.lock` 锁定依赖版本。

<!-- 笔记更新于 2026-07-08 -->
