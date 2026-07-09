---
title: "第3章 通用编程概念 (Common Concepts)"
date: 2026-07-08
draft: false
toc: true
tags: ["读书笔记"]
---

本章涵盖 Rust 的基础语法：变量、类型、函数、注释、控制流。这些概念几乎所有语言都有，但 Rust 的实现有独特的规则。

## 3.1 变量与可变性

### 默认不可变

```rust
let x = 5;
x = 6;            // 编译错误：cannot assign twice to immutable variable
```

Rust 变量默认**不可变**（immutable）。设计理由：如果代码假设某个值不变却意外被修改，bug 很难追踪。编译器帮你杜绝这种情况。

### mut 关键字

```rust
let mut x = 5;     // mut 标记为可变
x = 6;             // OK
```

`mut` 也是一份文档信号——告诉读代码的人这个值会变。

### 常量 const

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

与 `let` 的区别：

| | `let` | `const` |
|---|---|---|
| 可变性 | 默认不可变，可加 `mut` | 始终不可变 |
| 类型标注 | 可推断 | **必须标注** |
| 作用域 | 任意作用域 | 任意作用域，包括全局 |
| 值 | 运行时计算 | 只能是编译期常量表达式 |
| 命名 | snake_case | SCREAMING_SNAKE_CASE |

### 遮蔽 shadowing

```rust
let x = 5;
let x = x + 1;          // x = 6，遮蔽前一个 x

{
    let x = x * 2;      // x = 12，内部遮蔽
    println!("{x}");    // 12
}
println!("{x}");        // 6 — 内部作用域结束，外层 x 恢复
```

关键点：重复 `let` 创建新变量并遮蔽同名旧变量。与 `mut` 的区别：

1. `let` 重新绑定不允许意外赋值（不用 `mut` 写 `x = 6` 会编译错误）。
2. **可以变类型**：

```rust
let spaces = "   ";       // &str
let spaces = spaces.len(); // usize — 类型变了，OK

let mut spaces = "   ";
spaces = spaces.len();    // 编译错误：不能改变 mut 变量的类型
```

## 3.2 数据类型

Rust 是**静态类型**语言，编译期必须知道所有变量的类型。编译器通常能推断，但多义时需要显式标注：

```rust
let guess: u32 = "42".parse().expect("Not a number");
//        ^^^^ 不写会编译错误：type annotations needed
```

### 标量类型 scalar

单个值。4 种基本标量：整型、浮点型、布尔型、字符。

#### 整数

| 长度 | 有符号 | 无符号 |
|------|--------|--------|
| 8    | `i8`   | `u8`   |
| 16   | `i16`  | `u16`  |
| 32   | `i32`  | `u32`  |
| 64   | `i64`  | `u64`  |
| 128  | `i128` | `u128` |
| arch | `isize`| `usize`|

- 默认整数类型：`i32`
- `isize`/`usize` 用于集合索引（64 位平台上即 64 位）

整数字面量：

| 进制 | 示例 |
|------|------|
| 十进制 | `98_222` |
| 十六进制 | `0xff` |
| 八进制 | `0o77` |
| 二进制 | `0b1111_0000` |
| 字节(u8) | `b'A'` |

> [!WARNING] 整型溢出
> debug 模式：溢出会 panic。release 模式：溢出会**回绕**（wrapping），`u8` 256→0，257→1。如需显式处理：`wrapping_add`、`checked_add`、`overflowing_add`、`saturating_add`。

#### 浮点数

```rust
let x = 2.0;      // f64，默认
let y: f32 = 3.0; // f32
```

IEEE-754 标准，`f32` 单精度，`f64` 双精度。默认 `f64`（速度相近但精度更高）。

#### 布尔

```rust
let t = true;
let f: bool = false;
```

> [!IMPORTANT] 条件必须是 bool
> `if number { ... }` 非法。Rust 不会隐式转换非布尔值为布尔（不像 C/JS）。

#### 字符 char

```rust
let c = 'z';
let z = 'ℤ';
let cat = '😻';
```

用单引号（`'` 而非 `"`），4 字节，存 Unicode 标量值（不只是 ASCII）。

### 复合类型 compound

#### 元组 tuple

```rust
let tup: (i32, f64, u8) = (500, 6.4, 1);
```

固定长度，元素类型可以不同。两种访问方式：

```rust
// 解构
let (x, y, z) = tup;

// 索引访问
let five_hundred = tup.0;  // 从 0 开始
let one = tup.2;
```

**单元类型** `()` — 空元组，零个元素。不返回值的表达式默认返回 `()`。

#### 数组 array

```rust
let a = [1, 2, 3, 4, 5];
let a: [i32; 5] = [1, 2, 3, 4, 5];  // 类型+长度
let a = [3; 5];                        // [3, 3, 3, 3, 3]
```

- 固定长度，元素**必须同类型**。
- 存在栈上。元素数确定时用数组，否则用 `Vec`（第 8 章）。

```rust
let first = a[0];  // 索引访问
```

> [!WARNING] 越界检查
> 运行时越界会立刻 panic（不是返回垃圾值）。Rust 不允许无保护内存访问。

## 3.3 函数

命名约定：`snake_case`（全小写+下划线）。定义顺序无关，`fn` 定义即可。

```rust
fn another_function(x: i32) {
    println!("The value of x is: {}", x);
}
```

- 每个参数**必须标注类型**（编译器借此推断，无需其他地方再写）。
- 无参数用空 `()`。

### 语句 vs 表达式

| 语句 statement | 表达式 expression |
|---|---|
| 执行操作，无返回值 | 计算值 |
| `let y = 6;` | `5 + 6` → 11 |
| `fn` 定义 | 函数调用 |
| 不能嵌套在赋值的右边 | 可以 |

```rust
let x = (let y = 6);  // 编译错误：let 是语句，不返回值
```

类似 C 中的 `x = y = 6` 在 Rust 不成立。

**代码块** `{}` 是表达式：

```rust
let y = {
    let x = 3;
    x + 1      // 注意：无分号！
};
// y = 4
```

结尾有分号 → 变成语句，返回 `()`。

### 返回值

```rust
fn five() -> i32 {
    5           // 无分号 = 表达式 = 返回值
}

fn plus_one(x: i32) -> i32 {
    x + 1       // 无分号 = 返回 x+1
}
```

- 用 `-> type` 声明返回类型。
- 隐式返回：函数体最后一个表达式的值。
- 显式返回：`return value;`（提前退出时使用）。

```rust
fn plus_one(x: i32) -> i32 {
    x + 1;      // 有分号！变成语句，返回 ()，与 -> i32 不匹配
}               // 编译错误：mismatched types
```

> [!IMPORTANT] 分号决定一切
> 最后一行有 `;` → 返回 `()`。没 `;` → 返回该表达式的值。这是初学者最容易搞混的地方。

## 3.4 注释

```rust
// 单行注释

// 多行注释
// 每行都要写 //

let x = 5; // 行尾注释也可以
```

文档注释 `///` 和 `//!` 见第 14 章。

## 3.5 控制流

### if 表达式

```rust
if number < 5 {
    println!("condition was true");
} else if number % 3 == 0 {
    println!("divisible by 3");
} else {
    println!("condition was false");
}
```

- 条件**必须**是 `bool`，不会隐式转换。
- **只执行第一个匹配分支**，不 fall-through。

`if` 是表达式，可在 `let` 右边使用：

```rust
let number = if condition { 5 } else { 6 };
```

所有分支返回类型**必须相同**：

```rust
let number = if condition { 5 } else { "six" };
// 编译错误：if and else have incompatible types
```

### 三种循环

| 循环 | 用途 |
|------|------|
| `loop` | 无限循环，手动 `break` |
| `while` | 条件满足时循环 |
| `for` | 遍历集合/区间（最常用） |

#### loop

```rust
loop {
    println!("again!");
    // break;  // 才能退出
}
```

**从 loop 返回值**：

```rust
let result = loop {
    counter += 1;
    if counter == 10 {
        break counter * 2;  // break 后跟值 = 返回给 result
    }
};
// result = 20
```

**循环标签**，用于嵌套循环：

```rust
'counting_up: loop {            // 标签
    loop {
        break;                  // 退出内层循环
        break 'counting_up;     // 退出外层循环
    }
}
```

#### while

```rust
let mut number = 3;
while number != 0 {
    println!("{}!", number);
    number -= 1;
}
```

条件为 `true` 时执行循环体。

#### for（最推荐）

```rust
let a = [10, 20, 30, 40, 50];

// 遍历数组
for element in a {
    println!("{element}");
}

// 遍历区间
for number in (1..4).rev() {  // 3, 2, 1
    println!("{number}");
}
```

> [!TIP] 优先用 for
> Ranges `1..4` — 含起点不含终点。`1..=4` — 含两端。
> `rev()` 反转区间。

`for` 是 Rust 中最常用的循环，没有索引边界错误，编译器也不需要插入运行时边界检查。用 `while` 遍历数组反而更危险且更慢。

## 练习

书中建议的 3 个练习（可以自己试试）：

1. 华氏度与摄氏度转换
2. 生成 n 阶斐波那契数列
3. 打印圣诞颂歌 "The Twelve Days of Christmas" 歌词

<!-- 笔记更新于 2026-07-08 -->
