---
title: "把 Haskell 的思考方式带到 Python OJ：Pattern、Guard 与 Pipe"
date: 2026-07-17
draft: true
toc: true
tags: ["Python", "Haskell", "算法竞赛", "函数式编程"]
---

Haskell 代码经常很接近人脑对问题的描述：

- 当前数据是空、只有一个元素，还是由头部和尾部组成？
- 当前状态是否满足某个条件，应该进入哪个分支？
- 原始数据需要依次经过哪些变换，才能得到答案？

这三种思考动作可以分别叫作 **pattern**、**guard** 和 **pipe**：

```text
pattern：识别数据的形状
guard：  在当前形状中继续筛选条件
pipe：   把数据依次交给多个独立变换
```

Python 不能完整复制 Haskell 的类型系统、惰性求值和模式匹配，但可以保留这套拆题方式。关键不是把 Python 写得像 Haskell，而是先用 Haskell 式思维找到清楚的分类，再选择适合 Python OJ 的实现。

> [!IMPORTANT] 本文的两层代码
> **思维翻译版**尽量保留 pattern、guard、递归和管道，用于理解题意；**OJ 提交版**根据 Python 的特性改成索引、循环、生成器或显式状态，用于控制复杂度和递归深度。

本文的 `match/case` 需要 Python 3.10 或更高版本。旧版 Python 可以使用文中的 `if/elif` 写法。

## 一张总表

| 人脑动作 | Haskell | Python 中的主要表达 |
|---|---|---|
| 区分数据形状 | 函数参数模式、`case ... of` | `match/case`、解包、`if/elif` |
| 在形状内筛选 | guard | case guard、早返回、`if/elif` |
| 串联数据变换 | `.`、`$`、自定义 `|>` | 具名中间变量、生成器、`pipe()`、`compose()` |
| 定义局部知识 | `where` | 嵌套函数、局部变量 |
| 表达可能失败 | `Maybe` | `None`、哨兵对象、显式结果类型 |
| 产生合法候选 | 列表推导式、列表 Monad、`guard` | comprehension、生成器、回溯中的 `continue` |

迁移时可以按下面的顺序思考：

```text
题意
  -> 数据有哪些互斥形状？
  -> 每种形状有哪些 guard？
  -> 数据依次经过哪些变换？
  -> Python 中应该保留直译，还是改成循环和显式状态？
```

## Pattern：先识别数据形状

### Haskell 的列表模式

Haskell 处理列表时，常把所有情况直接写在函数定义上：

```haskell
describe :: [a] -> String
describe []       = "empty"
describe [_]      = "one"
describe (_:_:_)  = "many"
```

读代码时看到的不是“第一个 `if` 检查长度是否为 0”，而是三个互斥的数据形状：空、一个、多个。

### Python 的结构化模式匹配

Python 3.10+ 可以使用 `match/case`：

```python
def describe(xs):
    match xs:
        case []:
            return "empty"
        case [_]:
            return "one"
        case [_, _, *_]:
            return "many"


assert describe([]) == "empty"
assert describe([7]) == "one"
assert describe([7, 8]) == "many"
```

模式可以同时取出内容：

```python
def split_head(xs):
    match xs:
        case []:
            return None
        case [head, *tail]:
            return head, tail


assert split_head([]) is None
assert split_head([10, 20, 30]) == (10, [20, 30])
```

`[head, *tail]` 很像 Haskell 的 `head : tail`，但两者的运行成本不同。Python 会创建新的 `tail` 列表；Haskell 的链表模式只取得原链表尾部的引用。

### 固定结构也可以匹配

OJ 中常见的操作、事件和状态可以用带标签的元组表示：

```python
def explain_operation(operation):
    match operation:
        case ("add", value):
            return f"add {value}"
        case ("query", left, right) if left <= right:
            return f"query [{left}, {right})"
        case ("query", _, _):
            return "invalid query"
        case _:
            return "unknown operation"


assert explain_operation(("add", 5)) == "add 5"
assert explain_operation(("query", 2, 7)) == "query [2, 7)"
assert explain_operation(("query", 7, 2)) == "invalid query"
```

这里 pattern 先区分 `add` 和 `query`，guard `if left <= right` 再检查查询是否合法。代码顺序与人脑分类一致。

### 旧版 Python 的回退写法

没有 `match/case` 时，直接按形状写 `if/elif`：

```python
def describe_legacy(xs):
    if not xs:
        return "empty"
    if len(xs) == 1:
        return "one"
    return "many"
```

`match` 不是目标本身。如果 `if/elif` 更短、更快或更容易看懂，就使用 `if/elif`。

## Guard：在形状内部继续筛选

pattern 回答“它是什么形状”，guard 回答“这个形状是否满足当前分支的条件”。

Haskell 可以把 guard 直接放在模式之后：

```haskell
classify :: Int -> String
classify x
  | x < 0     = "negative"
  | x == 0    = "zero"
  | otherwise = "positive"
```

Python 普通函数通常使用早返回：

```python
def classify(x):
    if x < 0:
        return "negative"
    if x == 0:
        return "zero"
    return "positive"
```

早返回的价值不只是减少缩进。它可以让代码按照下面的证明顺序排列：

1. 非法状态；
2. 终止状态；
3. 能立即确定答案的特殊状态；
4. 剩下的一般状态。

在 `match` 中，guard 写在 `case` 后面：

```python
def relation(pair):
    match pair:
        case (x, y) if x < y:
            return "increasing"
        case (x, y) if x == y:
            return "equal"
        case (x, y):
            return "decreasing"
```

case guard 只有在 pattern 匹配成功后才执行，所以可以安全使用 pattern 中绑定的 `x`、`y`。

## Pipe：把变化过程写出来

### Haskell 的 `.` 与 `$`

Haskell 的函数组合 `.` 从右向左读：

```haskell
answer = sum . map square . filter positive
  where
    square x = x * x
    positive x = x > 0
```

它表示：先筛选正数，再平方，最后求和。

`$` 是低优先级的函数应用：

```haskell
answer xs = sum $ map square $ filter positive xs
```

它减少括号，但数据流仍然从最右边开始计算。

### 左到右 `|>` 思维

`|>` 不是标准 Haskell 运算符，但可以自己定义：

```haskell
(|>) :: a -> (a -> b) -> b
x |> f = f x
infixl 0 |>
```

于是数据流可以从左向右读：

```haskell
answer xs = xs |> filter positive |> map square |> sum
```

无论使用 `.` 还是 `|>`，真正有价值的思考是：把复杂过程拆成若干只做一件事的小变换。

### Python 的 `pipe()`

Python 没有内置 `|>`。教学或数据处理代码可以写一个简单函数：

```python
def pipe(value, *functions):
    for function in functions:
        value = function(value)
    return value
```

准备几个独立变换：

```python
def positive_values(values):
    return (x for x in values if x > 0)


def square_values(values):
    return (x * x for x in values)


answer = pipe(
    [-3, 1, 2, -5, 4],
    positive_values,
    square_values,
    sum,
)

assert answer == 21
```

阅读顺序就是数据变化顺序：原数组 → 正数 → 平方 → 求和。

### Python 的 `compose()`

若想先组合函数，再反复应用，可以写：

```python
def compose(*functions):
    def composed(value):
        for function in reversed(functions):
            value = function(value)
        return value

    return composed
```

它模仿 Haskell 的从右向左组合：

```python
sum_positive_squares = compose(
    sum,
    square_values,
    positive_values,
)

assert sum_positive_squares([-3, 1, 2, -5, 4]) == 21
```

### OJ 中优先使用具名中间变量

多数 OJ 提交不需要自定义管道。下面的写法更容易断点调试，也没有额外的 `pipe()` 调用：

```python
values = [-3, 1, 2, -5, 4]
positive = (x for x in values if x > 0)
squares = (x * x for x in positive)
answer = sum(squares)

assert answer == 21
```

这里仍然保留了 pipe 的思考方式，只是把每个阶段显式命名。算法竞赛中，这通常是表达力、性能和可调试性之间更好的平衡。

## `case`、`where`、`Maybe` 和列表推导式

### `case ... of` → `match/case`

Haskell `case` 对一个值做模式匹配：

```haskell
case result of
  Nothing -> fallback
  Just x  -> use x
```

Python 可以匹配自定义的带标签元组，也可以直接判断 `None`：

```python
result = None

if result is None:
    answer = "fallback"
else:
    answer = f"use {result}"
```

### `where` → 局部函数和具名状态

Haskell 用 `where` 把辅助知识放在主定义附近。Python 常用嵌套函数：

```python
def count_valid(values):
    def valid(x):
        return x > 0 and x % 2 == 0

    return sum(1 for x in values if valid(x))


assert count_valid([-2, 1, 2, 4, 5]) == 2
```

辅助函数只服务于外层算法时，嵌套定义可以减少全局名字，并让“判断规则”靠近主流程。

### `Maybe` → `None` 或哨兵

Haskell 的 `Maybe a` 强制调用者处理 `Nothing` 和 `Just a`。Python 常用 `None`：

```python
def first_even(values):
    return next((x for x in values if x % 2 == 0), None)


assert first_even([1, 3, 4, 6]) == 4
assert first_even([1, 3, 5]) is None
```

但如果 `None` 本身也可能是合法元素，就需要独立哨兵：

```python
MISSING = object()


def first_match(values, predicate):
    return next((x for x in values if predicate(x)), MISSING)
```

Python 不会像 Haskell 类型系统那样强制调用者检查结果，调用处必须主动使用 `is None` 或 `is MISSING`。

### 列表推导式中的条件

Haskell：

```haskell
squares = [x * x | x <- xs, x > 0, even x]
```

Python：

```python
xs = [-3, 1, 2, 4, 5]
squares = [x * x for x in xs if x > 0 and x % 2 == 0]

assert squares == [4, 16]
```

这里的 `if` 就像候选生成过程中的 guard：不满足条件的分支不会进入结果。

## 例一：P03 取第 k 个元素

完整 Haskell 笔记见[P03 - 取列表第 k 个元素](../haskell-99/p03.md)。题目使用 1-based 下标，非法或越界时返回失败。

### 先按人脑分类

不急着写语法，先列出互斥情况：

1. `k < 1`：非法下标；
2. 列表为空：越界；
3. `k == 1` 且列表非空：答案是头部；
4. 否则：丢掉头部，在尾部寻找第 `k - 1` 个。

这已经接近完整程序。

### Haskell：pattern + guard

```haskell
elementAt :: [a] -> Int -> Maybe a
elementAt []      _ = Nothing
elementAt _       k | k < 1 = Nothing
elementAt (x:_)   1 = Just x
elementAt (_:xs)  k = elementAt xs (k - 1)
```

### Python 思维翻译版

```python
def element_at_pattern(xs, k):
    if k < 1:
        return None

    match xs:
        case []:
            return None
        case [head, *_] if k == 1:
            return head
        case [_, *tail]:
            return element_at_pattern(tail, k - 1)
```

测试：

```python
assert element_at_pattern([10, 20, 30], 2) == 20
assert element_at_pattern([], 1) is None
assert element_at_pattern([10, 20], 3) is None
assert element_at_pattern([10, 20], 0) is None
```

这份代码很好地保留了 Haskell 的分类，却不适合处理长列表：每次 `[_, *tail]` 都复制尾部，总复制量可能达到 $O(n^2)$，递归深度也可能超过 Python 上限。

### Python OJ 提交版

Python 列表支持 $O(1)$ 随机访问，没有必要模仿链表递归：

```python
def element_at(xs, k):
    if not 1 <= k <= len(xs):
        return None
    return xs[k - 1]
```

```python
assert element_at([10, 20, 30], 2) == 20
assert element_at([], 1) is None
assert element_at([10, 20], 3) is None
assert element_at([10, 20], 0) is None
```

思维仍然来自 pattern + guard：先处理非法和越界，再返回一般情况。实现则利用了 Python 列表与 Haskell 链表的数据结构差异。

| 版本 | 时间 | 额外空间 | 适用场景 |
|---|---:|---:|---|
| pattern 递归翻译 | 最坏 $O(n^2)$ | 最坏 $O(n^2)$ 加递归栈 | 教学、小列表 |
| OJ 索引版 | $O(1)$ | $O(1)$ | Python 列表正式提交 |

## 例二：P08 连续元素去重

完整 Haskell 笔记见[P08 - 去除连续重复元素](../haskell-99/p08.md)。目标是每段连续相同元素只保留一个。

### 先按人脑分类

1. 空列表：结果为空；
2. 单元素：直接保留；
3. 前两个元素相等：丢掉其中一个，继续；
4. 前两个元素不同：保留第一个，继续处理剩余部分。

### Haskell：模式匹配与 guard

```haskell
compress :: Eq a => [a] -> [a]
compress []       = []
compress [x]      = [x]
compress (x:y:xs)
  | x == y    = compress (x:xs)
  | otherwise = x : compress (y:xs)
```

标准库还可以写成函数组合：

```haskell
compress = map head . group
```

### Python 思维翻译版

```python
def compress_pattern(xs):
    match xs:
        case []:
            return []
        case [x]:
            return [x]
        case [x, y, *tail] if x == y:
            return compress_pattern([x, *tail])
        case [x, y, *tail]:
            return [x, *compress_pattern([y, *tail])]
```

```python
assert compress_pattern([]) == []
assert compress_pattern([1]) == [1]
assert compress_pattern([1, 1, 2, 2, 3, 1, 1]) == [1, 2, 3, 1]
```

它几乎逐句复现 Haskell，但每层都在构造 `tail` 和新列表，最坏可达到 $O(n^2)$ 时间与空间，而且长输入会爆递归栈。

### Python 管道版

`itertools.groupby` 按连续相同元素分组。每组返回 `(key, group)`，其中 `key` 就是这一组要保留的元素：

```python
from itertools import groupby


def group_heads(values):
    return (key for key, _ in groupby(values))


def compress_pipe(values):
    return pipe(values, group_heads, list)


compress_composed = compose(list, group_heads)
```

```python
data = [1, 1, 2, 2, 3, 1, 1]

assert compress_pipe(data) == [1, 2, 3, 1]
assert compress_composed(data) == [1, 2, 3, 1]
```

`compose(list, group_heads)` 对应 Haskell 从右向左的 `map head . group` 思路；`pipe(values, group_heads, list)` 则把同一个过程改成从左向右阅读。

### Python OJ 提交版

正式提交时，一次循环最直接：

```python
def compress(values):
    answer = []

    for value in values:
        if not answer or value != answer[-1]:
            answer.append(value)

    return answer
```

```python
assert compress([]) == []
assert compress([1]) == [1]
assert compress([1, 1, 2, 2, 3, 1, 1]) == [1, 2, 3, 1]
```

guard 仍然存在，只是变成了循环里的条件：当答案为空，或者当前元素与上一段不同，才进入 `append` 分支。

| 版本 | 时间 | 额外空间 | 特点 |
|---|---:|---:|---|
| pattern 递归翻译 | 最坏 $O(n^2)$ | 最坏 $O(n^2)$ 加递归栈 | 最接近题意分类 |
| `groupby` 管道 | $O(n)$ | 除结果外 $O(1)$ | 声明式、适合已熟悉标准库时 |
| OJ 循环版 | $O(n)$ | 除结果外 $O(1)$ | 最容易调试和提交 |

## 例三：N 皇后

完整 Haskell 笔记见[P90 - N 皇后问题](../haskell-99/p90.md)。逐列放置皇后时，每一步先产生候选行，再用 guard 排除同行和对角线冲突。

### Haskell：候选 + guard + 递归

```haskell
place column reversedRows availableRows = do
  row <- availableRows
  guard (safe column row reversedRows)
  place (column + 1) (row : reversedRows)
    (filter (/= row) availableRows)
```

这里的 `guard` 不只是普通条件判断。列表 Monad 会自动丢弃非法分支，并把所有合法递归结果收集起来。

### Python 思维翻译版：生成器

Python 生成器可以表达“产生候选、过滤、继续递归、逐个产出答案”：

```python
def queens_generator(n):
    if n < 0:
        return

    def safe(column, row, reversed_rows):
        previous = zip(range(column - 1, 0, -1), reversed_rows)
        return all(
            abs(column - previous_column) != abs(row - previous_row)
            for previous_column, previous_row in previous
        )

    def place(column, reversed_rows, available_rows):
        if not available_rows:
            yield tuple(reversed(reversed_rows))
            return

        for index, row in enumerate(available_rows):
            if not safe(column, row, reversed_rows):
                continue

            remaining = available_rows[:index] + available_rows[index + 1:]
            yield from place(
                column + 1,
                (row, *reversed_rows),
                remaining,
            )

    yield from place(1, (), tuple(range(1, n + 1)))
```

```python
assert len(list(queens_generator(1))) == 1
assert len(list(queens_generator(4))) == 2
```

这个版本与 Haskell 的候选流很接近，但每次递归都复制 `available_rows` 和路径。生成器能避免一次保存全部答案，却不能消除状态复制。

### Python OJ 提交版：显式冲突集合

如果题目只要求方案数量，可以只维护已占用的行和两条对角线：

```python
def count_n_queens(n):
    if n < 0:
        return 0

    used_rows = set()
    used_down_diagonals = set()  # row - column
    used_up_diagonals = set()    # row + column

    def dfs(column):
        if column == n:
            return 1

        answer = 0

        for row in range(n):
            down = row - column
            up = row + column

            if (
                row in used_rows
                or down in used_down_diagonals
                or up in used_up_diagonals
            ):
                continue

            used_rows.add(row)
            used_down_diagonals.add(down)
            used_up_diagonals.add(up)

            answer += dfs(column + 1)

            used_rows.remove(row)
            used_down_diagonals.remove(down)
            used_up_diagonals.remove(up)

        return answer

    return dfs(0)
```

```python
assert count_n_queens(1) == 1
assert count_n_queens(4) == 2
assert count_n_queens(8) == 92
```

这份代码仍遵循 Haskell 的思路：枚举候选、guard 掉冲突、递归合法分支。区别是 Python 使用可变集合和成对的 `add/remove`，避免每层复制完整状态。

N 皇后最坏仍是指数级搜索，通常粗略记为 $O(n!)$。集合版的冲突判断平均为 $O(1)$，递归深度只有 $n$，适合这一类搜索深度较小的问题。

## 不要照搬 Haskell

### `match` 不检查模式是否穷尽

Haskell 编译器可以警告遗漏构造器。Python `match` 没有对应的静态保证：

```python
def incomplete(value):
    match value:
        case 0:
            return "zero"
```

输入 `1` 时函数静默返回 `None`。需要默认分支时主动写：

```python
        case _:
            raise ValueError(f"unexpected value: {value!r}")
```

### `[head, *tail]` 会复制尾部

Haskell 的 `x:xs` 是链表解构。Python 的 `[head, *tail]` 会创建 `tail`，递归处理长度为 $n$ 的列表时可能依次复制 $n-1,n-2,\ldots,1$ 个元素，总量为 $O(n^2)$。

大输入优先使用索引、迭代器或普通循环。

### Python 没有尾递归优化

即使递归调用位于函数最后，Python 也不会复用当前栈帧。线性递归处理几千个元素可能触发 `RecursionError`。

图遍历、链式 DP 和长列表扫描优先改成循环。N 皇后递归深度只有 `n`，递归仍然自然。

### 生成器不等同于 Haskell 惰性列表

Python 生成器只能向前消费一次：

```python
values = (x * x for x in range(4))

assert sum(values) == 14
assert sum(values) == 0
```

需要重复遍历时，重新创建生成器或保存为列表。更多细节见[Python 生成器表达式](./generator_expression.md)。

### `None` 不等同于 `Maybe`

`Maybe` 在类型层面提醒调用者处理失败。Python 函数返回 `None` 后，调用者可能忘记检查，而且 `None` 也可能是合法数据。

边界复杂时使用独立哨兵、异常，或者定义明确的结果对象；不要只依赖注释约定。

### 管道不是越长越好

一条很长的 `pipe()` 或多层 `compose()` 会增加函数调用，也让中间状态不容易观察。OJ 中出现以下情况时应拆成具名变量：

- 需要打印或断言某个中间结果；
- 某一步可能为空或失败；
- 某一步改变了复杂度；
- lambda 已经长到需要换行；
- 性能热点位于大量小函数调用中。

## 做题时的四步检查

### 第一步：数据有哪些形状

不要先写循环，先列出互斥状态。例如列表问题可能有：

```text
空列表 / 单元素 / 至少两个元素
```

搜索问题可能有：

```text
非法状态 / 已完成 / 可以继续扩展
```

### 第二步：每种形状有哪些 guard

把剪枝、边界和终止条件按优先级写出来：

```text
是否非法？
是否已经得到答案？
是否可以立即排除？
否则怎样进入更小的同类问题？
```

### 第三步：答案经过哪些变换

用箭头写出数据流：

```text
输入 -> 解析 -> 过滤候选 -> 转换状态 -> 聚合答案 -> 格式化输出
```

每个箭头如果能命名成一个短函数，说明问题边界已经比较清楚；如果某个函数需要读写大量外部状态，就不必强行管道化。

### 第四步：选择 Python 的提交形式

| 思考结果 | Python OJ 常用实现 |
|---|---|
| 少量固定形状 | `match/case` 或解包 |
| 非法和终止状态 | 早返回、`continue` |
| 线性扫描 | `for` 循环、迭代器 |
| 候选产生与过滤 | generator、comprehension |
| 深度较小的组合搜索 | 回溯递归 |
| 深链、图或大列表 | 显式栈、队列、索引 |
| 多步纯变换 | 具名中间变量，必要时 `pipe()` |

> [!IDEA] 最终原则
> 用 Haskell 的方式**发现分支和数据流**，再用 Python 的方式**控制状态和成本**。

## 总结

pattern、guard 和 pipe 不是三种炫技语法，而是三种稳定的拆题动作：

1. pattern 让你先问“当前数据是哪种形状”；
2. guard 让你继续问“这个形状满足哪个条件”；
3. pipe 让你看见“数据经过哪些阶段变成答案”。

Python 3.10+ 的 `match/case`、早返回、生成器表达式、局部函数和 comprehension 足以表达这些思路。但正式 OJ 代码还要尊重 Python 的列表、递归和函数调用成本。

最值得模仿的不是 `[head, *tail]` 或自定义 `pipe()` 本身，而是这条路径：

```text
先分类 -> 再加 guard -> 再串变换 -> 最后根据语言成本落地
```

更多高阶函数写法见[Python 函数式编程三剑客](./map_reduce_filter.md)，生成器的惰性和一次性消费见[Python 生成器表达式](./generator_expression.md)。

## 参考资料

- [Python 结构化模式匹配](https://docs.python.org/zh-cn/3/reference/compound_stmts.html#the-match-statement)
- [PEP 634 - Structural Pattern Matching](https://peps.python.org/pep-0634/)
- [Python `itertools.groupby`](https://docs.python.org/zh-cn/3/library/itertools.html#itertools.groupby)
- [Haskell 99 题学习路线](../haskell-99/)
