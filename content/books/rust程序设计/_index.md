---
title: "Rust程序设计 (第2版)"
date: 2026-07-08
noList: true
---

## 资源

- 英文原版: *Programming Rust, Second Edition (Rust 2021 Edition)* — Jim Blandy, Jason Orendorff, Leonora F.S. Tindall
- [The Rust Programming Language (官方书)](https://doc.rust-lang.org/book/)
- [Rust 标准库文档](https://doc.rust-lang.org/std/)
- [Rust by Example](https://doc.rust-lang.org/stable/rust-by-example/)
- [官方仓库 — ProgrammingRust](https://github.com/ProgrammingRust)

## 环境

### rustup (推荐，跨平台)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装完成后：

```bash
rustup update      # 更新
rustc --version    # 查看版本
cargo --version
```

### Arch Linux

```bash
# 方式一：通过 rustup (推荐)
sudo pacman -S rustup
rustup default stable

# 方式二：直接安装系统包
sudo pacman -S rust
```

### Ubuntu 24.04

```bash
# 方式一：通过 rustup (推荐)
sudo apt install curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 方式二：通过 apt
sudo apt install rustc cargo
```

## 目录

- [第1章 系统程序员也能享受美好 (Why Rust?)](./chapter_1)
- [第2章 Rust 导览 (A Tour of Rust)](./chapter_2)
- [第3章 基本数据类型 (Fundamental Types)](./chapter_3)
- [第4章 所有权与移动 (Ownership and Moves)](./chapter_4)
- [第5章 引用 (References)](./chapter_5)
- [第6章 表达式 (Expressions)](./chapter_6)
- [第7章 错误处理 (Error Handling)](./chapter_7)
- [第8章 crate 与模块 (Crates and Modules)](./chapter_8)
- [第9章 结构体 (Structs)](./chapter_9)
- [第10章 枚举与模式 (Enums and Patterns)](./chapter_10)
- [第11章 特型与泛型 (Traits and Generics)](./chapter_11)
- [第12章 运算符重载 (Operator Overloading)](./chapter_12)
- [第13章 实用工具特型 (Utility Traits)](./chapter_13)
- [第14章 闭包 (Closures)](./chapter_14)
- [第15章 迭代器 (Iterators)](./chapter_15)
- [第16章 集合 (Collections)](./chapter_16)
- [第17章 字符串与文本 (Strings and Text)](./chapter_17)
- [第18章 输入与输出 (Input and Output)](./chapter_18)
- [第19章 并发 (Concurrency)](./chapter_19)
- [第20章 异步编程 (Asynchronous Programming)](./chapter_20)
- [第21章 宏 (Macros)](./chapter_21)
- [第22章 不安全代码 (Unsafe Code)](./chapter_22)
- [第23章 外部函数 (Foreign Functions)](./chapter_23)
