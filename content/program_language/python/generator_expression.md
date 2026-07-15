---
title: "Python 生成器表达式：惰性计算与短路判断"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "语法", "算法竞赛"]
---

生成器表达式（Generator Expression）适合表示“按需产生的一串数据”。它的写法和列表推导式很接近，但不会立即把全部结果存入列表。

在算法验证代码中，生成器经常和 `sum`、`min`、`max`、`any`、`all`、`next` 配合：候选只产生一次，找到答案时还可以提前停止。

## 从列表推导式开始

列表推导式使用方括号：

```python
squares = [x * x for x in range(5)]

assert squares == [0, 1, 4, 9, 16]
```

执行到这一行时，Python 已经计算并保存了全部五个结果。它相当于：

```python
squares = []
for x in range(5):
    squares.append(x * x)

assert squares == [0, 1, 4, 9, 16]
```

生成器表达式把方括号换成圆括号：

```python
squares = (x * x for x in range(5))

assert next(squares) == 0
assert next(squares) == 1
assert list(squares) == [4, 9, 16]
```

创建 `squares` 时并没有计算五个平方。每次调用 `next`，生成器才产生下一个值；最后的 `list` 消费剩余三个值。

## 惰性求值

生成器只保存“如何产生下一个值”以及当前执行位置，这叫惰性求值（Lazy Evaluation）。

```python
def produce():
    for x in range(3):
        yield x * x


values = produce()

assert next(values) == 0
assert next(values) == 1
assert next(values) == 4
assert next(values, None) is None
```

`yield` 编写的是生成器函数，生成器表达式则是常见场景下的简写。本文重点使用表达式；理解二者都按需产生值即可。

生成器的主要特点是：

- 不需要一次保存全部结果；
- 可以处理很长甚至无限的序列；
- 只能向前迭代，已经消费的值不会自动保留；
- 和短路函数组合时，可能不必遍历全部候选。

## 与 `any`、`all` 配合短路

`any` 判断是否至少有一个元素为真。它遇到第一个真值就返回：

```python
visited = []


def is_even(x):
    visited.append(x)
    return x % 2 == 0


answer = any(is_even(x) for x in range(1, 10_000_000))

assert answer
assert visited == [1, 2]
```

这个具体输入在检查 `1` 和 `2` 后就停止，因此实际只执行两次判断。但算法的最坏复杂度仍是 $O(n)$：如果直到最后一个元素才满足，或者没有元素满足，`any` 仍要遍历整个序列。

如果写成列表推导式，列表会先计算全部布尔值，之后 `any` 才能开始判断：

```python
values = [x % 2 == 0 for x in range(1, 6)]

assert values == [False, True, False, True, False]
assert any(values)
```

`all` 判断是否所有元素都为真，遇到第一个假值就停止：

```python
def is_strictly_increasing(a):
    return all(x < y for x, y in zip(a, a[1:]))


assert is_strictly_increasing([1, 3, 5, 9])
assert not is_strictly_increasing([1, 3, 3, 9])
```

> [!INFO] 空序列
> `any([])` 返回 `False`，`all([])` 返回 `True`。这分别对应“空集合中不存在满足条件的元素”和“空集合中没有元素违反条件”。

## 与聚合函数配合

只需要最终聚合结果时，不必创建中间列表：

```python
a = [3, -2, 5, -1]

positive_sum = sum(x for x in a if x > 0)
largest_square = max(x * x for x in a)

assert positive_sum == 8
assert largest_square == 25
```

生成器作为函数的唯一参数时，可以省略外层圆括号：

```python
a = [1, 2, 3, 4]

with_parentheses = sum((x * x for x in a))
without_parentheses = sum(x * x for x in a)

assert with_parentheses == without_parentheses == 30
```

如果候选可能为空，要处理 `min` 和 `max` 的默认值：

```python
a = [-3, -1, -7]

answer = max((x for x in a if x > 0), default=None)

assert answer is None
```

## 使用 `next` 找到具体方案

`any` 只能告诉我们是否存在，`next` 可以返回第一个满足条件的候选：

```python
def first_pair_with_sum(a, target):
    return next(
        (
            (a[i], a[j])
            for i in range(len(a))
            for j in range(i + 1, len(a))
            if a[i] + a[j] == target
        ),
        None,
    )


assert first_pair_with_sum([2, 7, 11, 15], 9) == (2, 7)
assert first_pair_with_sum([1, 2, 3], 10) is None
```

`next(generator, None)` 在生成器为空时返回 `None`。如果省略默认值，生成器为空会抛出 `StopIteration`。

## 生成器只能消费一次

```python
values = (x * x for x in range(4))

assert sum(values) == 14
assert sum(values) == 0
```

第一次 `sum` 已经取完了全部元素，第二次不会重新开始。需要多次遍历时有两种选择：

```python
def make_values():
    return (x * x for x in range(4))


assert sum(make_values()) == 14
assert sum(make_values()) == 14

saved = list(make_values())
assert sum(saved) == 14
assert max(saved) == 9
```

## 什么时候使用列表

生成器不是列表的替代品。以下情况应直接使用列表：

- 需要下标访问，例如 `a[i]`；
- 需要多次遍历；
- 需要修改、排序或反转数据；
- 需要同时保留全部结果用于调试；
- 状态规模很小，列表写法更清楚。

以下情况适合生成器：

- 候选只遍历一次；
- 直接交给 `sum`、`min`、`max`、`any`、`all`、`next`；
- 候选数量很大，不希望保存中间列表；
- 希望利用短路提前结束。

> [!IMPORTANT] 选择标准
> 列表强调“保存结果”，生成器强调“产生结果”。根据后续操作选择，不要为了 Pythonic 而强行改成生成器。

## 在暴力验证中的位置

生成器擅长简洁地表达候选，但决定验证程序正确性的仍然是枚举范围和判定条件。复杂状态变化应先写成清楚的循环或 DFS，再考虑是否适合用生成器压缩。

更多枚举模型见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)，更多迭代器组合见[`itertools` 实用组合](./itertools_recipes.md)。

## 参考资料

- [Python 表达式：生成器表达式](https://docs.python.org/zh-cn/3/reference/expressions.html#generator-expressions)
- [Python 教程：生成器](https://docs.python.org/zh-cn/3/tutorial/classes.html#generators)
