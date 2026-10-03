---
title: "Python 竞赛实用技巧速查：输入输出、标准库与性能避坑"
date: 2026-10-03
draft: true
toc: true
tags: ["Python", "算法竞赛", "标准库"]
---

写 Python 刷题代码时，先保证算法复杂度，再选合适的容器和输入方式，最后考虑语法简写。这篇集中整理提交代码时常查的操作；详细推导和更多模板通过各节链接继续阅读。

本文面向允许 Python 提交的 OJ 环境。具体比赛的语言限制、Python / PyPy 版本、时间和内存限制，需要查看实际评测配置，不能因为题目属于 CSP 风格就假定支持 Python。

## 1. 输入输出：按数据格式和内存选择

`input()` 用于普通输入通常足够。输入量大时，可以使用 `sys.stdin.buffer.readline` 按行读取，或一次读取全部 token。不能把“没用 `read()`”直接等同于 TLE。

### 按行读取

下面约定首行是 `n`，第二行恰好有 `n` 个整数：

```python
import sys

readline = sys.stdin.buffer.readline
n = int(readline())
a = list(map(int, readline().split()))
print(sum(a))
```

`readline()` 保留行尾换行，`split()` 会按空白分隔。二进制接口得到 `bytes`，`int()` 可以直接解析；需要字符串方法或文字处理时，使用文本接口或显式 `.decode()`。

### 一次读取全部 token

下面不要求 `n` 个整数必须在同一行：

```python
import sys


def solve():
    tokens = iter(map(int, sys.stdin.buffer.read().split()))
    n = next(tokens)
    a = [next(tokens) for _ in range(n)]
    print(sum(a))


if __name__ == "__main__":
    solve()
```

这种方式常能减少输入调用开销，但 `read().split()` 会保存整份输入拆出的 token，峰值内存可能很高。`map` 延迟转换整数，并不会让前面的 `read().split()` 变成流式读取。超大输入且内存紧张时优先逐行处理。

不要先 `read()` 再继续 `input()`，因为输入通常已经读完。交互题应按交互协议逐步读取、及时刷新输出，不能等待全部输入。

### 集中输出

```python
answers = [12, 7, 25]
print("\n".join(map(str, answers)))
print(*[1, 2, 3])
```

批量输出能减少调用次数，但也要保存答案和拼接结果；极大输出可以分批写出。完整格式模板见 [Python OJ 输入输出速查](./oj_input_output_cheatsheet.md)。

## 2. collections：队列、计数与分组

```python
from collections import Counter, defaultdict, deque

q = deque([1, 2])
q.append(3)
assert q.popleft() == 1
q.appendleft(0)

cnt = Counter([1, 1, 2, 3, 3, 3])
assert cnt[3] == 3
assert cnt[99] == 0
assert cnt.most_common(2) == [(3, 3), (1, 2)]

graph = defaultdict(list)
graph[1].append(2)
graph[1].append(3)
assert graph[1] == [2, 3]
```

- `deque` 两端增删为 $O(1)$；`list.pop(0)` 需要移动后续元素，为 $O(n)$。大量重复使用后者会把 BFS 的队列操作拖成平方级。
- `Counter` 适合频率统计，`defaultdict(list)` 适合分组和稀疏图建边。访问缺失键 `d[key]` 会创建默认值，`d.get(key)` 不会调用默认工厂。
- 顶点编号为 `0..n-1` 时，`graph = [[] for _ in range(n)]` 也很直接。
- Python 3.7+ 普通 `dict` 保证插入顺序；这不表示键已排序。只有需要专门的顺序操作时才考虑 `OrderedDict`。

详见 [Python 竞赛常用容器](./collections_toolkit.md)。

## 3. heapq：优先队列

传统 `heapq` 接口维护最小堆，`heap[0]` 是最小值，但整个列表并非有序：

```python
import heapq

heap = [5, 1, 3]
heapq.heapify(heap)
heapq.heappush(heap, 2)
assert heapq.heappop(heap) == 1
assert heap[0] == 2

max_heap = [-x for x in [5, 1, 3]]
heapq.heapify(max_heap)
assert -heapq.heappop(max_heap) == 5
```

`heapify` 为 $O(n)$，单次入堆、出堆为 $O(\log n)$。空堆出堆会抛出 `IndexError`。

存负数是数值最大堆的兼容写法。Python 3.14 已新增 `heapify_max`、`heappush_max`、`heappop_max` 等公开接口，所以“Python 只有最小堆”需要附带版本条件。评测器版本较旧时仍用负数方案。

### Dijkstra 的过期条目

`heapq` 没有直接的 decrease-key 接口。距离变小时加入新条目，弹出时跳过旧条目：

```python
import heapq
from math import inf


def dijkstra(graph, start):
    dist = [inf] * len(graph)
    dist[start] = 0
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d != dist[u]:
            continue
        for v, weight in graph[u]:
            nd = d + weight
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist


# 顶点为 0..n-1，边权必须非负
assert dijkstra([[(1, 4), (2, 1)], [], [(1, 1)]], 0) == [0, 2, 1]
```

堆中元组按字段依次比较。如果任务对象不可比较，使用 `(priority, sequence_number, task)`，用唯一序号避免优先级相同时比较任务对象。

## 4. 语法简写：同时注意边界

```python
a = [1, 2]
b = [3, 4]
assert list(enumerate(a, start=1)) == [(1, 1), (2, 2)]
assert list(zip(a, b)) == [(1, 3), (2, 4)]
assert [x + y for x, y in zip(a, b)] == [4, 6]
assert all(x > 0 for x in a)
assert any(x % 2 == 0 for x in a)
assert all([]) is True
assert any([]) is False

x, y = 3, 5
larger = x if x > y else y
assert larger == max(x, y)
```

`zip` 默认在最短输入结束时停止。如果长度不同是错误，Python 3.10+ 可使用 `zip(a, b, strict=True)`。`any`、`all` 配合生成器会短路，不必提前构造整个布尔列表。

解包细节见 [Python 解包操作符](./unpacking_operator.md)，惰性计算见 [生成器表达式](./generator_expression.md)。

## 5. 字符串与切片

```python
parts = ["ab", "cd", "ef"]
assert "".join(parts) == "abcdef"
assert "abc"[::-1] == "cba"
assert "  abc\n".strip() == "abc"

# isdigit 判断的是 Unicode 数字字符，不等同于 int 能否解析
assert "²".isdigit()
assert not "-12".isdigit()
assert all("0" <= c <= "9" for c in "123")

a = [1, 2, 3, 4, 5]
assert a[1:4] == [2, 3, 4]
assert a[:-1] == [1, 2, 3, 4]
assert a[::-1] == [5, 4, 3, 2, 1]
```

反复拼接不可变字符串可能不断复制已有内容，用列表收集再 `join` 更容易控制成本。部分解释器会优化某些 `+=` 场景，但不要依赖这种优化设计复杂度。

`strip()` 会删除两端所有空白，空格属于题目数据时应保留，只去掉行尾换行。`isdigit()` 不能判断带符号整数，也不能保证字符都属于 ASCII 的 `0..9`；检查非空纯 ASCII 数字串时还应加上 `bool(s)`。

列表切片创建新的外层列表，复制 $k$ 个元素引用需要 $O(k)$ 时间和空间，属于浅拷贝。原地反转用 `a.reverse()`，只想逆序遍历用 `reversed(a)`。详见 [切片位置记忆法](./slicing_positions.md)。

## 6. math：数论和精确整数运算

```python
import math

assert math.gcd(-18, 24) == 6
assert math.gcd(0, 0) == 0
assert math.gcd(18, 24, 30) == 6  # Python 3.9+
assert math.lcm(6, 8) == 24      # Python 3.9+
assert math.isqrt(17) == 4       # Python 3.8+
assert math.comb(5, 2) == 10     # Python 3.8+
assert math.factorial(5) == 120
assert pow(2, 10, 1000) == 24
```

`gcd` 接受负整数，结果非负；`gcd(0, 0)` 返回 `0`。Python 3.9 起支持任意个参数，数组可以写 `math.gcd(*a)`；旧版本才需要循环或 `reduce(math.gcd, a, 0)`。

`isqrt` 和 `comb` 均从 Python 3.8 提供。`isqrt` 用于非负整数，避免先转浮点数造成的舍入；`comb` 要求两个参数均为非负整数，`k > n` 返回 `0`。

浮点结果是否接近，应根据题意选择绝对或相对误差；需要精确计数时优先整数。详见 [常用数学工具](./math_tools.md)。

## 7. 位运算：任意精度也有成本

```python
x = 12  # 1100
assert x & 1 == 0
assert x & (x - 1) == 8  # 清除最低位的 1
assert x & -x == 4       # 取最低位的 1
assert x.bit_count() == 2  # Python 3.10+
assert x << 1 == 24
assert x >> 1 == 6
assert ~x == -13
assert (~x) & ((1 << 4) - 1) == 3  # 限定为 4 位取反
```

Python 整数不会发生固定宽度整数溢出，但位数越多，时间和内存开销越大。`~x == -x - 1`，并非自动在某个固定宽度内取反，位掩码题要自己限制宽度。

用 `while x: x &= x - 1` 统计置位数时，要求 `x` 非负；负数不能直接套这种循环。负数右移对应向下取整的除法，例如 `-3 >> 1 == -2`。

## 8. 递归：先估计深度，再决定实现

`sys.getrecursionlimit()` 可以查看当前限制。遇到很深的树链或 DFS，先考虑显式栈、BFS 或循环 DP。

`sys.setrecursionlimit(limit)` 只修改解释器的深度限制，不会减少递归内存，也不保证底层栈安全。不要把 `sys.setrecursionlimit(1 << 25)` 放进所有模板；确实需要递归时，根据最大深度、解释器和资源限制选择并测试。

记忆化减少重复计算，却不能减少最长递归链。多组数据更换了缓存函数依赖的图或数组时，还要使旧缓存失效；在每次 `solve()` 内新建缓存函数也是一种办法。详见 [functools 竞赛核心速览](./functools_competition.md)。

## 9. bisect：有序数组查找与离散化

```python
from bisect import bisect_left, bisect_right, insort

a = [1, 3, 3, 7]
assert bisect_left(a, 3) == 1   # 第一个 >= 3 的位置
assert bisect_right(a, 3) == 3  # 第一个 > 3 的位置
assert bisect_left(a, 9) == len(a)
assert bisect_right(a, 3) - bisect_left(a, 3) == 2
insort(a, 4)
assert a == [1, 3, 3, 4, 7]
```

前提是数组按相同规则有序。返回的是插入位置，可能等于 `len(a)`，不能不检查就用它访问元素。

查找为 $O(\log n)$，但 `insort` 还要移动列表元素，总体为 $O(n)$。大量动态插入不能只按二分查找的复杂度估算。

### 离散化：把值映射到排名

```python
from bisect import bisect_left

values = [100, -5, 100, 20]
ordered = sorted(set(values))
ranks = [bisect_left(ordered, x) for x in values]
assert ordered == [-5, 20, 100]
assert ranks == [2, 0, 2, 1]

# 大量查询已知值时，也可以预先建立字典
rank = {x: i for i, x in enumerate(ordered)}
assert [rank[x] for x in values] == ranks
```

离散化保留相等关系和大小关系，不保留数值间距。用排名替代原坐标后，长度、面积等运算仍需保留原始坐标。

## 10. array：需要紧凑数值存储时再用

```python
from array import array

a = array("I", [1, 2, 3])
a.append(4)
assert list(a) == [1, 2, 3, 4]
assert a.itemsize >= 2
```

`array('I')` 保存 C 风格的无符号整数，元素字节数可以查看 `itemsize`。取值必须在该类型范围内，不能像 Python `int` 一样任意增长；负数也不能存入这个类型。

它通常比整数列表更节省存储空间，但单次访问涉及 Python 对象转换，不保证比列表快。先确定内存瓶颈和数值范围，再用实际操作测量性能。

## 提交前速查

| 问题 | 检查重点 | 进一步阅读 |
|---|---|---|
| 大量输入输出 | 格式、峰值内存、交互要求 | [输入输出速查](./oj_input_output_cheatsheet.md) |
| BFS、计数、建图 | 队列用法、默认值、编号范围 | [常用容器](./collections_toolkit.md) |
| 二维数组或回溯出错 | 浅拷贝、共享行、是否恢复状态 | [C++ 转 Python 的坑点](./cpp_to_python_pitfalls.md) |
| 缓存结果错误 | 状态完整性、数据变化、可哈希参数 | [functools](./functools_competition.md) |
| 排序不符合预期 | 多关键字、稳定性、比较规则 | [排序与顺序验证](./sorting_and_ordering.md) |
| 枚举量太大 | 组合数量、惰性迭代也要耗时 | [itertools](./itertools_recipes.md) |
| 需要验证算法 | 小规模暴力、随机对拍 | [思路快速验证指南](./rapid_prototyping_toolkit.md) |

不要把示例在本地运行成功等同于所有 OJ 数据都能通过。提交前还应按题目规模评估时间与内存，并确认评测器支持所用接口。

## 参考

- [Python math 文档](https://docs.python.org/3/library/math.html)
- [Python heapq 文档](https://docs.python.org/3/library/heapq.html)
- [Python bisect 文档](https://docs.python.org/3/library/bisect.html)
- [Python 递归限制](https://docs.python.org/3/library/sys.html#sys.setrecursionlimit)
- [Python array 文档](https://docs.python.org/3/library/array.html)
