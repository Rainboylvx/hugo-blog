---
title: "Python 排序与顺序验证"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛"]
---

排序不仅用于写正解，也常用于验证结论：尝试某种贪心顺序、构造规范化结果，或者把两个无序答案转成可比较的形式。Python 的关键不是记住排序算法，而是掌握 `sorted`、`list.sort` 和 `key`。

## `sorted` 与 `list.sort`

`sorted` 接受任意可迭代对象，返回一个新列表，不修改原数据：

```python
a = [5, 1, 4, 2]
b = sorted(a)

assert a == [5, 1, 4, 2]
assert b == [1, 2, 4, 5]
```

`list.sort` 只用于列表，原地修改并返回 `None`：

```python
a = [5, 1, 4, 2]
result = a.sort()

assert a == [1, 2, 4, 5]
assert result is None
```

> [!WARNING] 常见错误
> 不要写 `a = a.sort()`。执行后 `a` 会变成 `None`。需要新列表时用 `sorted(a)`，允许修改原列表时单独调用 `a.sort()`。

## 降序与翻转

```python
a = [5, 1, 4, 2]

assert sorted(a, reverse=True) == [5, 4, 2, 1]
assert list(reversed(a)) == [2, 4, 1, 5]
```

`reverse=True` 按排序规则降序排列；`reversed(a)` 只是把当前顺序反过来，两者含义不同。

## 使用 `key` 指定排序依据

`key` 接收一个函数。排序前，Python 对每个元素调用一次该函数，并按照返回值比较。

按绝对值排序：

```python
a = [-7, 2, -3, 5]

assert sorted(a, key=abs) == [2, -3, 5, -7]
```

按第二个字段排序：

```python
items = [("apple", 3), ("banana", 1), ("pear", 2)]
answer = sorted(items, key=lambda item: item[1])

assert answer == [
    ("banana", 1),
    ("pear", 2),
    ("apple", 3),
]
```

`lambda item: item[1]` 是一个没有名字的短函数，相当于：

```python
def second(item):
    return item[1]


items = [("apple", 3), ("banana", 1), ("pear", 2)]
assert sorted(items, key=second)[0] == ("banana", 1)
```

复杂逻辑应使用普通 `def`，不要为了少写一行把 `lambda` 变得难以阅读。

## 多关键字排序

Python 的元组按字典序比较：先比较第一项，相等时再比较第二项。

例如先按分数降序，再按名字升序：

```python
students = [
    ("Bob", 90),
    ("Alice", 95),
    ("Carol", 90),
]

answer = sorted(students, key=lambda item: (-item[1], item[0]))

assert answer == [
    ("Alice", 95),
    ("Bob", 90),
    ("Carol", 90),
]
```

数字字段前加负号，可以让这一项按降序排列，同时保留其他字段的升序规则。

也可以直接利用元组默认顺序：

```python
pairs = [(2, 3), (1, 9), (2, 1), (1, 4)]

assert sorted(pairs) == [(1, 4), (1, 9), (2, 1), (2, 3)]
```

## `itemgetter`

`operator.itemgetter` 可以代替简单的下标 `lambda`：

```python
from operator import itemgetter

items = [("apple", 3), ("banana", 1), ("pear", 2)]

assert sorted(items, key=itemgetter(1)) == [
    ("banana", 1),
    ("pear", 2),
    ("apple", 3),
]
```

它不是必须掌握的技巧。竞赛临时代码中，`lambda item: item[1]` 往往更容易立即看懂。

## 稳定排序

Python 排序是稳定的：如果两个元素的 `key` 相同，它们保持原来的相对顺序。

```python
items = [
    ("first", 2),
    ("second", 1),
    ("third", 2),
]

answer = sorted(items, key=lambda item: item[1])

assert answer == [
    ("second", 1),
    ("first", 2),
    ("third", 2),
]
```

这允许我们分两次排序，但通常一次返回元组键更加直接。

## 用全排列验证排序贪心

有 $n$ 个任务，第 $i$ 个任务耗时为 $t_i$。依次执行任务，每个任务的完成时间是它结束的时刻。目标是让所有完成时间之和最小。

贪心结论是按照耗时从小到大执行。小规模时可以枚举所有顺序验证：

```python
from itertools import permutations


def completion_cost(order):
    elapsed = 0
    total = 0

    for duration in order:
        elapsed += duration
        total += elapsed

    return total


def brute_best(tasks):
    return min(
        (completion_cost(order), order)
        for order in permutations(tasks)
    )


def greedy(tasks):
    order = tuple(sorted(tasks))
    return completion_cost(order), order


tasks = [4, 1, 3]

assert brute_best(tasks) == greedy(tasks) == (13, (1, 3, 4))
```

这里 `min` 比较 `(代价, 顺序)` 元组，先选择代价最小的方案；代价相同再按顺序打破平局。

## 自定义比较函数

Python 更推荐 `key`，因为每个元素的键只计算一次。确实只有“两元素比较规则”时，可以使用 `cmp_to_key`：

```python
from functools import cmp_to_key


def compare_length_then_text(a, b):
    if len(a) != len(b):
        return len(a) - len(b)
    return (a > b) - (a < b)


words = ["bbb", "a", "cc", "aa"]
answer = sorted(words, key=cmp_to_key(compare_length_then_text))

assert answer == ["a", "aa", "cc", "bbb"]
```

这个例子用 `key=lambda word: (len(word), word)` 会更简单。只有比较规则难以转换成独立键时才考虑 `cmp_to_key`。

## 规范化后比较答案

题目不要求输出顺序时，可以先排序再比较：

```python
expected = [(1, 3), (2, 4), (5, 8)]
actual = [(5, 8), (1, 3), (2, 4)]

assert sorted(actual) == sorted(expected)
```

如果元素允许重复并且只关心出现次数，[`Counter`](./collections_toolkit.md) 通常比集合更合适。

## 参考资料

- [Python `sorted`](https://docs.python.org/zh-cn/3/library/functions.html#sorted)
- [Python 排序指南](https://docs.python.org/zh-cn/3/howto/sorting.html)
