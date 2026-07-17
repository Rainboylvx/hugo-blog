# 把 Haskell 思考方式带到 Python OJ 文章设计

## 目标

在 Python 栏目新增一篇面向算法竞赛学习者的文章，解释如何用 Python 保留 Haskell 中接近人脑推理的表达方式。

文章迁移的是思考模型，而不是机械复制语法：

- pattern：当前数据属于哪种形状；
- guard：在这个形状下，哪些条件决定分支；
- pipe：数据依次经过哪些变换。

最终代码既要能展示 Haskell 风格如何帮助拆解题意，也要给出适合 Python OJ 提交的实现，避免为了函数式外观牺牲复杂度、栈深度和可调试性。

## 文件与栏目

- 新文章：`content/program_language/python/haskell_style_thinking_in_python.md`
- 标题：`把 Haskell 的思考方式带到 Python OJ：Pattern、Guard 与 Pipe`
- front matter：`date: 2026-07-17`、`draft: true`、`toc: true`
- 标签：`Python`、`Haskell`、`算法竞赛`、`函数式编程`
- 栏目导航：更新 `content/program_language/python/_index.md`
- Haskell 目录只作为例子来源并通过相对链接引用，不修改其文章

文章以 Python 3.10 及以上版本为主要环境，因为结构化模式匹配需要 `match/case`。涉及 `match/case` 的核心例子同时提供 `if/elif` 或循环回退思路，便于旧版 OJ 环境使用。

## 读者与核心观点

目标读者已经接触 Haskell，并准备使用 Python 写 OJ。文章不从零讲解 Haskell，也不扩展为完整的函数式编程教程。

核心观点是：

1. 先按数据形状分类；
2. 再写每种形状下的条件和终止状态；
3. 最后把若干独立变换串起来；
4. 根据 Python 的运行时特性，将直接翻译改写为适合提交的循环、索引、生成器或显式状态。

每个较完整的例子都区分两份 Python：

- **思维翻译版**：尽量保留模式匹配、guard、递归和管道结构；
- **OJ 提交版**：使用 Python 更稳妥的循环、早返回、索引和回溯状态。

## 文章结构

### 1. 为什么 Haskell 写法接近题意

用一组简短例子建立 pattern、guard、pipe 与人脑动作的对应关系：识别形状、筛选条件、串联步骤。

### 2. Pattern：先识别数据形状

对照 Haskell 的 `[]`、`[x]`、`x:xs` 与 Python 结构化模式匹配：

```python
match xs:
    case []:
        ...
    case [x]:
        ...
    case [head, *tail]:
        ...
```

同时覆盖固定长度序列、元组和带标签状态的匹配。明确 Python 不检查模式是否穷尽，而且 `[head, *tail]` 会创建新的 `tail` 列表。

### 3. Guard：在形状内部继续筛选

对照 Haskell guard、Python case guard、普通 `if/elif` 和早返回。推荐按照非法状态、终止状态、一般状态的顺序组织分支，使代码顺序接近证明或题意分类。

### 4. Pipe 与函数组合

同时解释两类概念：

- Haskell 的 `.` 和 `$` 所表达的函数组合与低优先级应用；
- 类似 F#/Elixir `value |> transform` 的左到右数据流。

文章提供简单、标准库实现的 `pipe()` 与 `compose()`，但只作为表达和教学工具。OJ 提交代码优先使用具名中间变量、生成器表达式和清晰的函数调用，不把辅助函数加入 Python 暴力大模板。

### 5. 相关思想映射

集中说明以下映射：

| Haskell | Python |
|---|---|
| `case ... of` | `match/case` |
| `where` | 局部辅助函数、具名中间变量 |
| `Maybe` | `None`、哨兵值或显式结果类型 |
| 列表推导式中的条件 | comprehension 的 `if` |
| point-free / 函数组合 | 中间变量、`compose()`、`pipe()` |

不展开 Monad、Functor、类型类和完整的惰性求值理论。

### 6. 三个递进例子

#### P03：取第 k 个元素

展示 pattern + guard 如何把空列表、非法下标、命中和递归缩小四种情况直接写成代码，再给出使用边界检查与索引的 Python OJ 版本。

#### P08：连续元素去重

展示列表模式匹配和 guard，以及 Haskell `map head . group` 对应的 Python 分组、函数组合和左到右管道。OJ 版本使用单次循环，避免递归尾部复制。

#### N 皇后

展示 Haskell 列表推导式、`guard` 和列表 Monad 的候选收集思路，映射到 Python 生成器与回溯剪枝。提交版使用集合或位状态维护冲突信息。

每个例子按以下顺序组织：

1. 简短 Haskell 原代码；
2. Python 思维翻译版；
3. Python OJ 提交版；
4. 两个 Python 版本的复杂度和适用边界。

### 7. 不要照搬 Haskell

独立列出以下限制：

- Python `match` 不做穷尽性检查；
- `[head, *tail]` 会复制列表尾部，递归处理长列表可能达到二次复杂度；
- Python 没有尾递归优化，深递归可能触发 `RecursionError`；
- 生成器是一次性迭代器，不等同于可复用的 Haskell 惰性列表；
- `None` 没有 `Maybe` 的静态类型约束；
- 自定义 `pipe()` 和多层函数组合增加调用成本，也可能让调试栈更难追踪。

### 8. 做题检查清单

文章结尾提供可反复使用的四步检查：

1. 输入或状态有哪些互斥的数据形状？
2. 每种形状下有哪些 guard、非法状态和终止状态？
3. 数据需要依次经过哪些独立变换？
4. 在 Python 中应保留直接翻译，还是改为循环、索引、生成器或显式回溯？

## 代码要求

- Haskell 片段保持简短，只用于建立对照。
- Python 示例使用标准库，能够独立运行。
- `pipe()`、`compose()` 只写入文章，不修改现有模板源码。
- 模式匹配示例标明 Python 3.10+ 要求。
- OJ 版本给出复杂度，并说明为什么比直接翻译更适合 Python。
- 代码命名表达题意，不追求 point-free 或一行式技巧。

## 验证标准

文章完成后执行：

1. P03 覆盖空列表、非法下标、越界和正常命中；
2. P08 覆盖空列表、单元素、连续重复，并使用固定种子随机序列对照普通循环实现；
3. N 皇后验证 `n = 1`、`n = 4`、`n = 8`，解数分别为 `1`、`2`、`92`；
4. 对 `pipe()`、`compose()` 运行顺序与结果断言；
5. 对文章 Python 代码运行语法和断言检查；
6. 检查 front matter、Markdown 代码围栏和相对链接；
7. 运行 `hugo -D`，确认草稿页面生成；
8. 使用 `python-oj-learn` 检索 `pattern guard pipe`，确认新文章可被发现；
9. 确认任务范围外文件未被修改。

## 非目标

- 不把 Python 改造成 Haskell 语法模拟器；
- 不实现新的中缀 `|>` 运算符；
- 不修改 Python 暴力大模板；
- 不系统讲解 Monad、Functor、类型类或惰性求值；
- 不声称 Python 的 `None`、生成器或模式匹配与 Haskell 对应功能完全等价。
