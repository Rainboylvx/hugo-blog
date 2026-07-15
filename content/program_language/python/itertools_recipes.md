---
title: "Python itertools 实用组合"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛"]
---

`itertools` 提供一组按需产生数据的迭代器。排列、组合和笛卡尔积已经在[暴力验证主文章](./brute_force_validation.md)中使用；本文补充相邻元素、前缀聚合、连接序列和不等长并行遍历。

这些函数返回迭代器，不会自动创建完整列表。需要调试输出或多次遍历时再使用 `list(...)` 保存结果。

## `pairwise`：枚举相邻元素

```python
from itertools import pairwise

a = [3, 5, 8, 13]

assert list(pairwise(a)) == [(3, 5), (5, 8), (8, 13)]
```

检查严格递增：

```python
from itertools import pairwise


def is_strictly_increasing(a):
    return all(x < y for x, y in pairwise(a))


assert is_strictly_increasing([1, 3, 8])
assert not is_strictly_increasing([1, 3, 3])
assert is_strictly_increasing([])
```

`pairwise` 从 Python 3.10 开始提供。旧版本使用：

```python
a = [3, 5, 8, 13]

assert list(zip(a, a[1:])) == [(3, 5), (5, 8), (8, 13)]
```

切片会创建一个新列表，验证用小数据通常无需担心这点。

## `accumulate`：前缀聚合

默认情况下，`accumulate` 产生前缀和：

```python
from itertools import accumulate

a = [3, -2, 5, -1]
prefix = list(accumulate(a))

assert prefix == [3, 1, 6, 5]
```

添加 `initial=0` 可以得到竞赛中常用的长度为 $n+1$ 的前缀和：

```python
from itertools import accumulate

a = [3, -2, 5, -1]
prefix = list(accumulate(a, initial=0))

assert prefix == [0, 3, 1, 6, 5]

left, right = 1, 3
assert sum(a[left:right]) == prefix[right] - prefix[left] == 3
```

也可以传入其他二元函数：

```python
from itertools import accumulate
from operator import mul

assert list(accumulate([2, 3, 4], mul)) == [2, 6, 24]
assert list(accumulate([3, 1, 5, 2], max)) == [3, 3, 5, 5]
```

`initial` 从 Python 3.8 开始提供。旧版本可以写 `[0] + list(accumulate(a))`。

## `chain`：连接多个序列

```python
from itertools import chain

left = [1, 2]
middle = (3, 4)
right = {5, 6}

combined = list(chain(left, middle, sorted(right)))

assert combined == [1, 2, 3, 4, 5, 6]
```

它相当于依次遍历多个容器，不创建中间拼接列表。容器本身放在一个列表中时，使用 `chain.from_iterable`：

```python
from itertools import chain

groups = [[1, 2], [], [3], [4, 5]]

assert list(chain.from_iterable(groups)) == [1, 2, 3, 4, 5]
```

列表嵌套只有一层时，这是一种直接的展平方法。

## `repeat`：重复同一个值

```python
from itertools import repeat

assert list(repeat("x", 4)) == ["x", "x", "x", "x"]
```

它可以为 `map` 的某个参数提供固定值。例如计算每个数的平方：

```python
from itertools import repeat

bases = [2, 3, 4]
squares = list(map(pow, bases, repeat(2)))

assert squares == [4, 9, 16]
```

这里 `map` 每次分别从 `bases` 和 `repeat(2)` 取一个参数，调用 `pow(base, 2)`。

不提供次数时，`repeat(value)` 是无限迭代器，必须由较短的输入、`islice` 或短路条件限制。

## `zip_longest`：并行遍历不同长度序列

普通 `zip` 在最短序列结束时停止：

```python
assert list(zip([1, 2, 3], [10, 20])) == [(1, 10), (2, 20)]
```

`zip_longest` 会继续到最长序列结束，并为缺失位置填默认值：

```python
from itertools import zip_longest

pairs = list(zip_longest([1, 2, 3], [10, 20], fillvalue=0))

assert pairs == [(1, 10), (2, 20), (3, 0)]
```

例如逐位相加两个低位在前的数字数组：

```python
from itertools import zip_longest


def add_digits_without_carry(a, b):
    return [
        x + y
        for x, y in zip_longest(a, b, fillvalue=0)
    ]


assert add_digits_without_carry([3, 2, 1], [7, 6]) == [10, 8, 1]
```

如果长度不同本身就是错误，不应使用 `zip_longest` 掩盖问题，应先显式断言长度相等。

## `islice`：截取迭代器

切片语法不能直接用于生成器，`islice` 可以按位置截取：

```python
from itertools import islice

squares = (x * x for x in range(100))

assert list(islice(squares, 3, 7)) == [9, 16, 25, 36]
```

它不会倒序，也不支持负下标，因为普通迭代器只能向前产生元素。

## 与排列组合工具的关系

| 任务 | 工具 |
|---|---|
| 相邻元素 | `pairwise` |
| 前缀和、前缀最大值 | `accumulate` |
| 顺序连接多个序列 | `chain` |
| 提供重复参数 | `repeat` |
| 不同长度并行遍历 | `zip_longest` |
| 截取迭代器 | `islice` |
| 每个位置选择一种状态 | `product` |
| 枚举顺序 | `permutations` |
| 选择若干元素 | `combinations` |

最后三项直接枚举指数级或阶乘级状态空间，详见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)。生成器的一次性消费、短路与内存特点见[Python 生成器表达式](./generator_expression.md)。

## 参考资料

- [Python `itertools`](https://docs.python.org/zh-cn/3/library/itertools.html)
