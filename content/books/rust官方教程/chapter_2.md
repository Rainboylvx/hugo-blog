---
title: "第2章 猜数字游戏 (Guessing Game)"
date: 2026-07-08
draft: false
toc: true
tags: ["读书笔记"]
---

- [原文（英文）](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html)
- [原文（中文）](https://rustwiki.org/zh-CN/book/ch02-00-guessing-game-tutorial.html)

本章通过一个完整的猜数字游戏项目，一次性介绍 Rust 的核心工作机制：`let`、`match`、`use`、外部 crate、类型转换、循环、错误处理等。不深入原理，重在直觉建立。

最终完整代码：

```rust
use rand::Rng;
use std::cmp::Ordering;
use std::io;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..101);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {}", guess);

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

## 2.1 项目初始化

```bash
cargo new guessing_game
cd guessing_game
```

## 2.2 读取用户输入

### use 引入标准库

```rust
use std::io;
```

`std::io` 不在 Rust 的 prelude 中，需要显式 `use`。prelude 是 Rust 自动引入每个程序的一小部分标准库项。

### 可变变量

```rust
let mut guess = String::new();
```

- `let` — 创建变量，默认**不可变**（immutable）。
- `mut` — 标记为可变。
- `String::new()` — `new` 是 `String` 的**关联函数**（associated function），`::` 表示它是类型的函数而非实例的方法。返回一个空的 `String`。

### 读入一行

```rust
io::stdin()
    .read_line(&mut guess)
    .expect("Failed to read line");
```

- `stdin()` 返回 `Stdin` 句柄。
- `read_line` 追加用户输入到字符串，参数 `&mut guess` 是可变**引用**（reference）。`&` 表示引用，数据不被拷贝。引用默认也不可变，所以需 `&mut`。
- `read_line` 返回 `io::Result` 类型。

### Result 与 expect

`Result` 是枚举（enum），有两个**变体**（variant）：

- `Ok` — 成功，内部包含成功值
- `Err` — 失败，内部包含错误信息

`.expect(msg)` — 如果是 `Ok`，取出内部值；如果是 `Err`，程序崩溃并打印 `msg`。

> [!WARNING] 不处理 Result 会编译警告
> 如果 `Result` 未被使用，Rust 编译器给出 `unused Result that must be used` 警告。Rust 强制你显式处理错误。

### println! 占位符

```rust
println!("You guessed: {}", guess);
```

`{}` 是占位符，按顺序替换为后面的参数。等价于 `format!("You guessed: {}", guess)`。

## 2.3 生成随机数

### 添加外部 crate

编辑 `Cargo.toml`：

```toml
[dependencies]
rand = "0.8.3"
```

`0.8.3` 是语义化版本的简写，等价于 `^0.8.3`（`>=0.8.3, <0.9.0`）。

`cargo build` 时 Cargo 会：
1. 从 Crates.io 下载 `rand` 及其传递依赖
2. 编译所有依赖
3. 生成 `Cargo.lock`（锁定确切版本，保证可重现构建）

### Cargo.lock

第一次 build 时产生，锁定实际解析的依赖版本。之后所有 build 复用这个版本，除非手动 `cargo update` 或修改 `Cargo.toml` 版本号。

### 生成随机数

```rust
use rand::Rng;

let secret_number = rand::thread_rng().gen_range(1..101);
```

- `rand::thread_rng()` — 获取线程局部的随机数生成器，从 OS 获取 seed。
- `.gen_range(1..101)` — 生成 `[1, 101)` 内的随机数（包含 1，不包含 101）。
- `1..=100` 等价于 `1..101`，`..=` 包含终点。
- `use rand::Rng` 是为了把 `gen_range` 等方法引入作用域（方法属于 `Rng` trait，不引入就不能用）。

## 2.4 比较数字

### Ordering 枚举

```rust
use std::cmp::Ordering;

match guess.cmp(&secret_number) {
    Ordering::Less    => println!("Too small!"),
    Ordering::Greater => println!("Too big!"),
    Ordering::Equal   => println!("You win!"),
}
```

- `.cmp(&x)` — 比较两个值，返回 `Ordering::Less` / `Greater` / `Equal`。
- `match` — 逐个匹配分支的**模式**（pattern），匹配到第一个就执行对应的代码。必须**穷举**所有可能值（第 6 章详述）。

### 类型不匹配编译错误

第一次写出来会编译失败：

```
error[E0308]: mismatched types
expected reference `&String`
   found reference `&{integer}`
```

原因：`guess` 是 `String`，`secret_number` 是整数（默认 `i32`）。Rust 不会隐式转换，必须手动做。

### 类型转换与变量遮蔽

```rust
let guess: u32 = guess.trim().parse().expect("Please type a number!");
```

- **变量遮蔽（shadowing）** — 用 `let` 重用同一变量名，旧值被新值**遮蔽**。常用于类型转换后复用变量名。
- `.trim()` — 去除首尾空白（包括用户输入末尾的 `\n`）。
- `.parse()` — 解析字符串为数字。通过 `let guess: u32` 标注目标类型（冒号 `:` 后写类型名）。
- `.parse()` 也返回 `Result`，非数字输入会导致 `Err` 进而崩溃。类型标注还帮助 Rust 推断 `secret_number` 也是 `u32`。

`parse` 返回 `Result`，此时用 `expect` 处理——输入非数字就崩溃。后面会改进。

## 2.5 循环

### loop

```rust
loop {
    // ...
}
```

`loop` 创建**无限循环**，需要手动 `break` 或 ctrl-c。

### 猜中后退出

```rust
Ordering::Equal => {
    println!("You win!");
    break;  // 退出 loop
},
```

`break` 退出当前（最内层）循环。猜中后程序结束。

### 用 match 代替 expect 处理无效输入

```rust
let guess: u32 = match guess.trim().parse() {
    Ok(num) => num,
    Err(_) => continue,  // 忽略错误，回到 loop 顶部请求新输入
};
```

- 将 `expect` 替换为 `match`，不再崩溃。
- `Ok(num) => num` — 解析成功，把 `u32` 值绑定给 `guess`。
- `Err(_) => continue` — `_` 是**通配符**，匹配任意 `Err` 值（不管错误内容）。`continue` 跳到 `loop` 下一次迭代。

> [!TIP] match 穷举性
> `match` 必须覆盖所有可能的分支。`Result` 有 `Ok` 和 `Err` 两个变体，两个都要处理才不会编译报错。

## 总结：本章引入的 Rust 概念

| 概念 | 位置 | 说明 |
|------|------|------|
| `use` | `use std::io` | 将标准库/外部 crate 的项引入作用域 |
| `let mut` | `let mut guess` | 变量默认不可变，`mut` 使其可变 |
| `::` | `String::new()` | 关联函数（类型的函数），`::` 前缀 |
| `&` / `&mut` | `&mut guess` | 引用，`&mut` 是可变的引用（第4章详述） |
| `Result` | `read_line` 返回值 | `Ok`/`Err` 枚举，强制错误处理 |
| `expect` | `.expect("msg")` | `Ok` 时取值，`Err` 时崩溃 |
| `{}` | `println!("{}", x)` | `println!` 中字符串插值占位符 |
| 外部 crate | `rand = "0.8.3"` | `Cargo.toml` 的 `[dependencies]` 声明依赖 |
| `match` | `match guess.cmp(...)` | 模式匹配，按分支执行，覆盖必须穷举 |
| 类型标注 | `let guess: u32` | 冒号后写类型，也帮助类型推断 |
| shadowing | `let guess = ...` | 同名 `let` 遮蔽旧变量，用于类型转换 |
| `loop` / `break` / `continue` | 循环控制 | 无限循环和退出/跳过 |
| `_` 通配符 | `Err(_)` | 在 `match` 中匹配任意值 |

> [!IMPORTANT] 关键心态
> 这一章是快速概览，不是深入讲解。每章只引入了概念的表层，后面章节会逐步展开原理。如果某个概念（如引用 `&`、Result）让你困惑，很正常——继续学，第 4~10 章会一个个吃透。

<!-- 笔记更新于 2026-07-08 -->
