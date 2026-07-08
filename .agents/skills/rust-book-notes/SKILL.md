---
name: rust-book-notes
description: >
  为 Programming Rust (第2版, Rust 2021 Edition, Jim Blandy) 写学习笔记时使用。
  只要用户提到 RUST程序设计 读书笔记、写 rust 笔记、第X章笔记、这本书的相关任务都触发此 skill。
  也用于从 PDF 提取章节文本、按书中结构整理学习笔记。
---

# Rust 程序设计 学习笔记 Skill

为《Rust 程序设计（第2版）》(Programming Rust, Second Edition, Rust 2021 Edition, Jim Blandy) 编写学习笔记。

## 项目文件位置

- 书籍 PDF：`book_pdfs/Rust 程序设计(第2版).pdf`
- 笔记目录：`content/books/rust程序设计/`
- 章节文件：`content/books/rust程序设计/chapter_N.md`（N=1~23）
- 提取缓存：`content/books/rust程序设计/.extracted/` (gitignore)
- 提取脚本：`.agents/skills/rust-book-notes/scripts/extract_chapter.sh`

## 写笔记的标准流程

### 第 1 步：提取章节文本

先运行提取脚本获得该章的 PDF 文本：

```bash
bash .agents/skills/rust-book-notes/scripts/extract_chapter.sh <N>
```

输出文件在 `content/books/rust程序设计/.extracted/chapter_<N>.txt`。

### 第 2 步：读取并理解章节内容

读取提取的文本文件，同时读取对应的 `chapter_N.md`，理解该章：

- 核心概念和主线逻辑
- 关键代码示例
- 与其他章节的关联
- 书中强调的要点

### 第 3 步：编写笔记

在同目录下编辑 `chapter_N.md`。笔记末尾添加日期标记 `<!-- 笔记更新于 YYYY-MM-DD -->`。

## 笔记格式规范

### 结构

严格按书中**小节标题**的顺序组织。每一节使用 `## 小节标题` 作为二级标题。

```markdown
## 小节标题

简要说明这小节在讲什么，核心问题是什么。

### 关键概念

解释概念，首次出现用 "中文术语（English Term）" 格式。

### 代码示例

````rust
// 关键代码片段
````

> 对代码的解释
```

### 术语规范

- 所有权（ownership）、引用（reference）、借用（borrow）首次出现中英并用，之后可只用中文。
- 生命周期（lifetime）、特型（trait）、泛型（generic）、移动（move）、闭包（closure）、切片（slice）、枚举（enum）、结构体（struct）同理。
- 不可直接用英文缩写，除非是 Rust 关键字（如 `fn`, `let`, `mut`, `impl`, `pub`, `use`）。

### 代码规范

- 只摘录**关键代码片段**，不要大段复制原文。
- 每个代码块标注语言为 `rust`。
- 用自己的话写注释（`//` 在两行或行末），不依赖原书注释。
- 复杂逻辑用 Rust 注释在代码中逐步解释，不单独写大段文字。

### 写作风格

沿用 rainboy-hugo-blog-writing skill 的风格。中文技术笔记，直接、学习导向：

- 从核心问题开始，写推导、现象、结论。
- 保留 "显然想到""注意""这个问题的核心在于" 等表达。
- 不要写"本文将带你""作为一个 AI"等口吻。
- 不要写大量空泛背景。

### 可用的 Hugo 功能

- **数学公式**：`$a_i$` 行内，`$$...$$` 块级。
- **Admonition**：`> [!TIP] 提示`、`> [!IMPORTANT] 重要结论`、`> [!INFO] 信息`。
- **代码块**：fenced code block 标注语言 `rust`。

## 章节对照表

| 章节 | 中文标题 | 英文标题 | PDF 页码范围 |
|------|----------|----------|--------------|
| 第1章 | 系统程序员也能享受美好 | Why Rust? | 41–47 |
| 第2章 | Rust 导览 | A Tour of Rust | 48–103 |
| 第3章 | 基本数据类型 | Fundamental Types | 104–149 |
| 第4章 | 所有权与移动 | Ownership and Moves | 150–180 |
| 第5章 | 引用 | References | 181–222 |
| 第6章 | 表达式 | Expressions | 223–260 |
| 第7章 | 错误处理 | Error Handling | 261–283 |
| 第8章 | crate 与模块 | Crates and Modules | 284–335 |
| 第9章 | 结构体 | Structs | 336–369 |
| 第10章 | 枚举与模式 | Enums and Patterns | 370–402 |
| 第11章 | 特型与泛型 | Traits and Generics | 403–448 |
| 第12章 | 运算符重载 | Operator Overloading | 449–472 |
| 第13章 | 实用工具特型 | Utility Traits | 473–511 |
| 第14章 | 闭包 | Closures | 512–540 |
| 第15章 | 迭代器 | Iterators | 541–603 |
| 第16章 | 集合 | Collections | 604–657 |
| 第17章 | 字符串与文本 | Strings and Text | 658–721 |
| 第18章 | 输入与输出 | Input and Output | 722–758 |
| 第19章 | 并发 | Concurrency | 759–815 |
| 第20章 | 异步编程 | Asynchronous Programming | 816–892 |
| 第21章 | 宏 | Macros | 893–928 |
| 第22章 | 不安全代码 | Unsafe Code | 929–978 |
| 第23章 | 外部函数 | Foreign Functions | 979–1020 |

## 完成后验证

```bash
hugo
```

无错误则完成。
