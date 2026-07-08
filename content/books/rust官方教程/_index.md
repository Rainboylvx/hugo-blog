---
title: "Rust 官方教程"
date: 2026-07-08
noList: true
---

![Rust Logo](./images/cover.svg)

## 资源

- 官方英文版：[*The Rust Programming Language*](https://doc.rust-lang.org/book/)
- 官方中文翻译：[Rust 程序设计语言 - Rust 中文](https://rustwiki.org/zh-CN/book/)
- [Rust 标准库文档](https://doc.rust-lang.org/std/)
- [Rust by Example (中文)](https://rustwiki.org/zh-CN/rust-by-example/)
- [Rustlings — 练习](https://github.com/rust-lang/rustlings)

## 环境

### rustup (推荐)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装完成后：

```bash
rustup update
rustc --version
cargo --version
```

### Arch Linux

```bash
# 推荐通过 rustup
sudo pacman -S rustup
rustup default stable
```

### Ubuntu 24.04

```bash
# 推荐通过 rustup
sudo apt install curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 编辑器：rust-analyzer

Rust 的 LSP（语言服务器）是 **rust-analyzer**，功能类似 C/C++ 的 clangd。提供语法报错、类型提示、自动补全、跳转定义、重命名等。

### 安装

```bash
# 安装 rust-analyzer（推荐通过 rustup）
rustup component add rust-analyzer
```

VS Code 中搜索安装 **rust-analyzer** 扩展（`rust-lang.rust-analyzer`）。

> [!WARNING] 必须配合 Cargo 项目使用
> rust-analyzer 需要一个 `Cargo.toml` 来确定编译上下文。裸的 `.rs` 文件无法使用 LSP 功能。
> 解决办法：把代码放在 Cargo 项目的 `src/bin/` 下，每个文件是一个独立的 binary target。
>
> ```bash
> cargo new practice
> cd practice
> mkdir src/bin
> # 写 src/bin/foo.rs，保存即享受 LSP
> cargo run --bin foo
> ```

### 常用快捷键（VS Code）

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+P` → cargo check | 快速检查编译错误 |
| 鼠标悬停 | 查看类型 |
| `F12` | 跳转到定义 |
| `Ctrl+.` | 代码建议 / 自动修复 |

## 目录

- [第1章 入门指南 (Getting Started)](./chapter_1)
- [第2章 猜数字游戏 (Guessing Game)](./chapter_2)
- [第3章 通用编程概念 (Common Concepts)](./chapter_3)
- [第4章 认识所有权 (Understanding Ownership)](./chapter_4)
- [第5章 使用结构体组织相关数据 (Structs)](./chapter_5)
- [第6章 枚举和模式匹配 (Enums & Patterns)](./chapter_6)
- [第7章 使用包、Crate和模块 (Packages, Crates)](./chapter_7)
- [第8章 常见集合 (Common Collections)](./chapter_8)
- [第9章 错误处理 (Error Handling)](./chapter_9)
- [第10章 泛型、Trait和生命周期 (Generics & Lifetimes)](./chapter_10)
- [第11章 编写自动化测试 (Testing)](./chapter_11)
- [第12章 I/O项目：构建命令行程序 (minigrep)](./chapter_12)
- [第13章 函数式编程：迭代器与闭包 (Iterators & Closures)](./chapter_13)
- [第14章 更多关于Cargo和Crates.io](./chapter_14)
- [第15章 智能指针 (Smart Pointers)](./chapter_15)
- [第16章 无畏并发 (Fearless Concurrency)](./chapter_16)
- [第17章 Rust面向对象编程特性 (OOP)](./chapter_17)
- [第18章 模式和匹配 (Patterns & Matching)](./chapter_18)
- [第19章 高级特性 (Advanced Features)](./chapter_19)
- [第20章 最后的项目：多线程Web服务器](./chapter_20)
- [附录](./appendix)
