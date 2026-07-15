---
title: "用 Python 生成可复现的随机测试数据"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛"]
---

随机数据的价值不是“看起来很乱”，而是用很低的编写成本覆盖大量小状态。一个可靠的数据生成器还必须满足题目约束、能够复现失败，并且主动包含纯随机很难碰到的边界结构。

## 使用独立的随机数生成器

```python
from random import Random

rng1 = Random(20260715)
rng2 = Random(20260715)

sequence1 = [rng1.randint(1, 100) for _ in range(5)]
sequence2 = [rng2.randint(1, 100) for _ in range(5)]

assert sequence1 == sequence2
```

相同种子和相同调用顺序会产生相同数据。使用 `Random(seed)` 有两个好处：

- 不修改模块级的全局随机状态；
- 每个测试器可以拥有独立、可重放的随机序列。

失败时应记录种子和完整输入，而不是只打印“第 137 组错误”。

## 生成整数

```python
from random import Random

rng = Random(1)

x = rng.randint(3, 7)
y = rng.randrange(3, 8)
z = rng.randrange(0, 20, 2)

assert 3 <= x <= 7
assert 3 <= y < 8
assert 0 <= z < 20 and z % 2 == 0
```

- `randint(left, right)` 两端都可能取到；
- `randrange(left, right)` 和 `range` 一样是左闭右开；
- `randrange(start, stop, step)` 可以限制步长。

注意两种区间边界不同，竞赛生成器中这是常见的越界来源。

## `choice`、`choices` 与 `sample`

```python
from random import Random

rng = Random(2)
values = [10, 20, 30, 40]

one = rng.choice(values)
many_with_repetition = rng.choices(values, k=10)
many_without_repetition = rng.sample(values, 3)

assert one in values
assert len(many_with_repetition) == 10
assert all(x in values for x in many_with_repetition)
assert len(many_without_repetition) == 3
assert len(set(many_without_repetition)) == 3
```

- `choice` 选择一个元素；
- `choices` 独立选择多次，允许重复；
- `sample` 不放回抽样，结果不重复，要求 `k <= len(population)`。

带权选择可以给边界值更高概率：

```python
from random import Random

rng = Random(3)
values = rng.choices([-1, 0, 1], weights=[1, 5, 1], k=20)

assert len(values) == 20
assert set(values) <= {-1, 0, 1}
```

## `shuffle` 原地打乱

```python
from random import Random

rng = Random(4)
a = list(range(10))
original = a.copy()

result = rng.shuffle(a)

assert result is None
assert sorted(a) == original
```

`shuffle` 修改原列表并返回 `None`。需要保留原顺序时先复制：

```python
from random import Random

rng = Random(5)
source = [1, 2, 3, 4]
permutation = source.copy()
rng.shuffle(permutation)

assert source == [1, 2, 3, 4]
assert sorted(permutation) == source
```

## 数组生成器

把随机逻辑封装成函数，可以单独检查它是否满足约束：

```python
from random import Random


def random_array(rng, max_n, low, high):
    n = rng.randint(0, max_n)
    return [rng.randint(low, high) for _ in range(n)]


rng = Random(6)
for _ in range(100):
    a = random_array(rng, max_n=8, low=-10, high=10)
    assert 0 <= len(a) <= 8
    assert all(-10 <= x <= 10 for x in a)
```

验证程序只需要小规模数据。允许 `n = 0`、负数和重复值，往往比把范围写成 `1..100` 更容易发现错误。

## 不要只生成均匀随机数据

很多 Bug 集中在特殊结构，而均匀随机很难命中。应把手工边界和随机数据合并：

```python
def boundary_arrays():
    return [
        [],
        [0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [-5, -2, -9],
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1],
        [-(10**9), 10**9],
    ]


cases = boundary_arrays()

assert [] in cases
assert [1, 1, 1, 1] in cases
assert [5, 4, 3, 2, 1] in cases
```

常见边界包括：

- 空输入和单元素；
- 全相等、全零、大量重复；
- 全负数；
- 已排序和完全逆序；
- 最小值、最大值及其附近；
- 答案恰好不存在、恰好唯一或有很多组。

## 生成合法区间

先生成左端点，再在合法范围内生成右端点：

```python
from random import Random


def random_nonempty_interval(rng, n):
    assert n > 0
    left = rng.randrange(n)
    right = rng.randrange(left + 1, n + 1)
    return left, right


rng = Random(7)
for _ in range(100):
    left, right = random_nonempty_interval(rng, 10)
    assert 0 <= left < right <= 10
```

直接独立生成两个端点再排序也能工作，但“按约束逐步生成”更容易扩展到复杂结构。

## 生成随机树

一棵 $n$ 个点的树可以让每个新点连接一个已经存在的点：

```python
from random import Random


def random_tree(rng, n):
    edges = []

    for vertex in range(1, n):
        parent = rng.randrange(vertex)
        edges.append((parent, vertex))

    rng.shuffle(edges)
    return edges


rng = Random(8)
edges = random_tree(rng, 8)

assert len(edges) == 7
assert all(0 <= u < 8 and 0 <= v < 8 for u, v in edges)
```

每个点 `vertex > 0` 都连接到更早的点，因此图一定连通且没有环。不要随机选 $n-1$ 条边后假设它们自然构成树。

## 生成简单无向图

先枚举全部可能的无向边，再不放回抽样：

```python
from itertools import combinations
from random import Random


def random_simple_graph(rng, n, m):
    possible_edges = list(combinations(range(n), 2))
    assert 0 <= m <= len(possible_edges)
    return rng.sample(possible_edges, m)


rng = Random(9)
edges = random_simple_graph(rng, n=6, m=7)

assert len(edges) == 7
assert len(set(edges)) == 7
assert all(u < v for u, v in edges)
```

这种方法只适合验证用的小图，但它天然保证无自环、无重边。

## 在断言中保存失败信息

```python
from random import Random


def brute(a):
    return sum(a)


def candidate(a):
    return sum(a)


seed = 20260715
rng = Random(seed)

for case_id in range(100):
    a = [rng.randint(-10, 10) for _ in range(rng.randint(0, 8))]
    expected = brute(a)
    actual = candidate(a)

    assert actual == expected, (
        f"seed={seed}, case={case_id}, input={a}, "
        f"expected={expected}, actual={actual}"
    )
```

固定种子负责重放整个序列，断言中的完整输入负责直接重放单个失败样例。两者都保留最方便。

完整的暴力函数组织方式见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)。

## 参考资料

- [Python `random`](https://docs.python.org/zh-cn/3/library/random.html)
