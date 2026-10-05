---
title: "Python heapq 进阶：合并操作、固定规模堆与大根堆"
date: 2026-10-05
draft: true
toc: true
tags: ["Python", "算法竞赛", "标准库"]
---

`heapify`、`heappush`、`heappop` 三件套在 [Python 竞赛实用技巧速查](./competition_cheatsheet.md) 里已经讲过。这篇集中解决四个进阶问题：怎么用一次调整完成"弹旧放新"、怎么维护固定规模的堆、怎么实现大根堆，以及元组比较有哪些坑。最后附一张 C++ `priority_queue` 对照表。

本文示例在 Python 3.14.7 下验证通过；涉及 3.14 新接口的地方会单独标注，提交前需要确认评测器版本。

## 1. 合并操作：heapreplace 与 heappushpop

"弹出最小值、再放入新值"是最常见的堆操作组合。`heapq` 提供两个合并接口，都只做一次调整（$O(\log n)$），比 `heappop` + `heappush` 两次调整快：

```python
from heapq import heapify, heapreplace, heappushpop

h = [1, 4, 4]

old = heapreplace(h, 3)  # 先弹出最小值 1，再放入 3；返回被弹出的旧值
assert old == 1
assert sorted(h) == [3, 4, 4]

big = heappushpop(h, 10)  # 先放入 10，再弹出最小值；返回弹出的值
assert big == 3           # 注意：此时弹出的未必是刚放进去的 10
assert sorted(h) == [4, 4, 10]
```

两者的区别只有一句话：**`heapreplace` 先弹后放，`heappushpop` 先放后弹**。所以：

- `heapreplace` 要求堆非空（空堆会抛 `IndexError`），适合"堆的规模不变，拿新值换掉旧最值"；
- `heappushpop` 空堆也能用，适合"放进去之后再取走最值"；
- `heapreplace` 返回的是**旧的最小值**，不是新放入的值，接收返回值时别弄反。

### 参数先求值：heapreplace(h, h[0] + x)

负载均衡类题目的万能句式是这样的：

```python
from heapq import heapify, heapreplace


def finish_time(loads: list[int], taps: int) -> int:
    """n 个人排队接水，m 个龙头，每人接 w 秒，返回总时间。"""
    earliest = loads[:taps]        # 堆里存"每个龙头已累计的水量"= 它空出的时刻
    heapify(earliest)
    for load in loads[taps:]:
        heapreplace(earliest, earliest[0] + load)  # 新人接上最先空出的龙头
    return max(earliest, default=0)


assert finish_time([4, 4, 1, 2, 1], 3) == 4
```

`heapreplace(earliest, earliest[0] + load)` 能成立，靠的是 Python 的求值顺序：**函数参数在函数执行之前全部求值**。所以 `earliest[0]` 读到的正是即将被弹掉的那个最小值，函数内部再把它换掉。如果把代码拆成"先 `heappop` 再算 `h[0] + load`"，最小值就丢了。

同理，`heappushpop(h, h[0] + x)` 里 `h[0]` 也是先读的。当 `x >= 0` 时两者结果相同（新值不小于旧最值，`heappushpop` 弹出的仍是旧最值）；语义上"换掉旧最值"就写 `heapreplace`，意图更准。

## 2. 固定规模堆：top-k 与条件替换

堆的规模固定为 $k$ 时，"满了才替换"是标准写法。官方文档里 `heapreplace` 的说明就是为这种场景写的：

```python
from heapq import heapify, heappush, heapreplace


def top_k_largest(data: list[int], k: int) -> list[int]:
    """保留最大的 k 个数，时间 O(n log k)，额外空间 O(k)。"""
    h: list[int] = []
    for x in data:
        if len(h) < k:
            heappush(h, x)          # 没满先装
        elif x > h[0]:
            heapreplace(h, x)       # 满了且比堆里最小的还大，才换
    return sorted(h, reverse=True)


assert top_k_largest([5, 1, 9, 3, 7], 3) == [9, 7, 5]
assert top_k_largest([], 3) == []
```

要点是 `elif x > h[0]` 这个条件：不做判断直接 `heapreplace(h, x)` 会把最小值换成更小的数，堆里就错了。求"最小的 k 个"把条件改成 `x < h[0]` 即可。

需要给堆里的旧条目做"更新"（例如距离变小）时，不要试图修改堆内元素，用"加新条目、弹出时跳过过期条目"的懒删除写法，见 [速查的 Dijkstra 一节](./competition_cheatsheet.md)。

## 3. 大根堆：三种解决办法

`heapq` 的传统接口只维护最小堆。要"每次取最大"，有三条路。

### 方案一：存负数（兼容性最好，首选）

把每个数取负再入堆，最小堆上的"最小值"就是原数的最大值：

```python
from heapq import heapify, heappush, heappop

h = [-x for x in [1, 5, 3]]
heapify(h)
assert -h[0] == 5          # 看最大：取负
heappush(h, -4)            # 入堆：先取负
assert -heappop(h) == 5    # 出堆：再取负
```

存元组时**只把比较用的 key 字段取负**，其他字段保持原样：

```python
from heapq import heapify, heappop

# 按截止时间从大到小处理
h = [(-deadline, name) for deadline, name in [(3, "a"), (5, "b"), (3, "c")]]
heapify(h)
assert heappop(h) == (-5, "b")
assert heappop(h) == (-3, "a")  # key 相同按第二字段排
```

缺点是取负散落在读写两端，代码里要处处记得"存进去取负、拿出来取负"，漏一处就是答案差个符号。

### 方案二：包装类反转比较

给元素包一层，反转 `__lt__` 的方向，堆就变成大根堆：

```python
from heapq import heapify, heappop


class Rev:
    """可比较的包装：数值越大越'小'，让最小堆变成大根堆。"""

    def __init__(self, v: int):
        self.v = v

    def __eq__(self, other: "Rev") -> bool:   # 必须一起定义，见第 4 节
        return self.v == other.v

    def __lt__(self, other: "Rev") -> bool:
        return other.v < self.v


h = [Rev(x) for x in [1, 5, 3]]
heapify(h)
assert heappop(h).v == 5
assert heappop(h).v == 3
```

适合元素本身是对象、不方便取负的场合。注意 `__eq__` 必须和 `__lt__` 一起定义，原因见下一节。

### 方案三：Python 3.14+ 原生 max 接口

Python 3.14 给 `heapq` 增加了公开的大根堆接口，和最小堆三件套一一对应：

```python
import sys

from heapq import heapify_max, heappush_max, heappop_max

assert sys.version_info >= (3, 14)   # 评测器版本旧时退回方案一

h = [1, 5, 3]
heapify_max(h)
assert h[0] == 5                     # 最大值直接看 h[0]，不用取负
heappush_max(h, 4)
assert heappop_max(h) == 5
```

此外还有 `heapreplace_max`、`heappushpop_max`，语义和第 1 节的合并操作相同，只是方向相反。优点是不用取负、`h[0]` 直接就是最大值；缺点是**版本门槛**——评测环境不是自己说了算，拿不准就用负数方案，多一次取负换绝对的兼容性。

### 三方案对比

| 方案 | 取最值 | 优点 | 代价 |
|---|---|---|---|
| 存负数 | `-h[0]` | 任何版本可用 | 读写两端都要记得取负 |
| `Rev` 包装类 | `h[0].v` | 元素是对象时自然 | 要写类，`__eq__` 别漏 |
| 3.14 `*_max` | `h[0]` | 原生、最直观 | 评测器须为 Python 3.14+ |

## 4. 元组比较的坑

堆里放 `(key, value)` 元组时，Python 按字段依次比较，这带来三个容易踩的点：

**其一，key 相同才比到第二字段。** 前提是第一字段比较时"相等"。如果第一字段是自定义包装类，只定义 `__lt__` 不定义 `__eq__`，元组比较会认为两个对象"既不相等也不小于"，就不会落到第二字段，堆序直接乱掉——上面 `Rev` 类里那行 `__eq__` 就是为这个补的。

**其二，后面的字段必须可比较。** `(deadline, task)` 里两个任务 `deadline` 相同时会去比较 `task`；如果 `task` 是不可比较的对象，抛 `TypeError`。稳妥写法是插入唯一序号：`(deadline, seq, task)`，`seq` 保证永远不会比到 `task`。

**其三，大根堆只反转 key 字段。** `(-deadline, seq, task)` 而不是把整个元组取负。元组没有整体取负的操作，字段各管各的。

## 5. C++ → Python 对照

| 意图 | C++ | Python |
|---|---|---|
| 最小堆 | `priority_queue<int, vector<int>, greater<int>> pq;` | `h = [];` 默认就是最小堆 |
| 建堆 | 用迭代器构造，`make_heap` | `heapify(h)`，O(n) |
| 入堆 | `pq.push(x)` | `heappush(h, x)` |
| 看最小 | `pq.top()` | `h[0]` |
| 弹最小 | `pq.pop()` | `heappop(h)` |
| 弹旧放新 | `pq.pop(); pq.push(new);`（两次调整） | `heapreplace(h, new)`（一次调整） |
| 元组比较 | `pair<int,int>` 按字段比 | `(priority, id)` 也自动按字段比 |
| 大根堆 | `priority_queue<int> pq;` 默认就是 | 存负数 / `Rev` 包装类 / `heapify_max`（3.14+） |

最大区别：C++ 的 `priority_queue` 是个黑盒类；Python 的堆就是一个可索引的 list，可以 `h[0]`、可以 `len(h)`、可以切片复制（`loads[:taps]` 就是这么来的），调试时直接 `print(h)`。

## 提交前速查

| 需求 | 写法 | 注意 |
|---|---|---|
| 弹旧放新 | `heapreplace(h, x)` | 堆非空；返回旧最小值 |
| 先放后弹 | `heappushpop(h, x)` | 弹出的未必是 x |
| 更新最值 | `heapreplace(h, h[0] + x)` | 靠"参数先求值"成立 |
| top-k | `elif x > h[0]: heapreplace(h, x)` | 条漏了判断会写错堆 |
| 大根堆 | 存负数 | 3.14+ 可用 `*_max` 系列 |
| `(key, value)` | key 相同比 value | 包装类要补 `__eq__` |

## 参考

- [Python heapq 文档](https://docs.python.org/3/library/heapq.html)
- [Python 竞赛实用技巧速查](./competition_cheatsheet.md)：最小堆基础、Dijkstra 懒删除
- [Python 算法思路快速验证指南](./rapid_prototyping_toolkit.md)：双堆求中位数
