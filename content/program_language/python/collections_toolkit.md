---
title: "Python 竞赛常用容器：Counter、defaultdict 与 deque"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛"]
---

验证程序经常需要做四件事：统计出现次数、按照某个键分组、判断状态是否访问过、从队首取出 BFS 状态。普通 `dict`、`set` 和 `collections` 中的 `Counter`、`defaultdict`、`deque` 可以直接表达这些操作。

## 普通字典 `dict`

字典相当于 C++ 的 `unordered_map`，保存键到值的映射：

```python
score = {"Alice": 95, "Bob": 90}

assert score["Alice"] == 95
assert "Carol" not in score
```

手动统计频率时，`dict.get(key, default)` 很方便：

```python
a = [3, 1, 3, 2, 3, 2]
count = {}

for x in a:
    count[x] = count.get(x, 0) + 1

assert count == {1: 1, 2: 2, 3: 3}
```

`count.get(x, 0)` 在键不存在时返回 `0`，但不会自动把这个键插入字典。

## `Counter`：直接统计频率

```python
from collections import Counter

a = [3, 1, 3, 2, 3, 2]
count = Counter(a)

assert count[3] == 3
assert count[2] == 2
assert count[100] == 0
assert count.most_common(2) == [(3, 3), (2, 2)]
```

`Counter` 对不存在的键返回 `0`。`most_common(k)` 返回出现次数最多的前 `k` 项。

### 验证两个序列是否为同一多重集合

集合会丢失重复次数：

```python
assert set([1, 1, 2]) == set([1, 2, 2])
```

使用 `Counter` 才能同时比较元素和出现次数：

```python
from collections import Counter


def is_permutation(source, answer):
    return Counter(source) == Counter(answer)


assert is_permutation([1, 1, 2], [2, 1, 1])
assert not is_permutation([1, 1, 2], [1, 2, 2])
```

这适合验证“输出必须是输入的一个排列”之类的构造题条件。

### Counter 运算

```python
from collections import Counter

left = Counter("aab")
right = Counter("abb")

assert left + right == Counter({"a": 3, "b": 3})
assert left - right == Counter({"a": 1})
assert left & right == Counter({"a": 1, "b": 1})
assert left | right == Counter({"a": 2, "b": 2})
```

`+` 合并计数，`-` 只保留正计数，`&` 取每项最小值，`|` 取每项最大值。需要保留零或负计数时，不要依赖减法结果，改用 `subtract` 或普通字典检查。

## `defaultdict`：自动创建默认值

按键分组时，普通字典需要先判断键是否存在；`defaultdict` 可以自动创建空容器：

```python
from collections import defaultdict

groups = defaultdict(list)

for x in [1, 2, 3, 4, 5, 6]:
    groups[x % 3].append(x)

assert groups[0] == [3, 6]
assert groups[1] == [1, 4]
assert groups[2] == [2, 5]
```

参数不是一个默认值，而是创建默认值的函数：

```python
from collections import defaultdict

integer_count = defaultdict(int)
sets_by_key = defaultdict(set)

integer_count["x"] += 1
sets_by_key[0].add(7)

assert integer_count["x"] == 1
assert sets_by_key[0] == {7}
```

### 构造邻接表

```python
from collections import defaultdict

edges = [(1, 2), (1, 3), (2, 4)]
graph = defaultdict(list)

for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)

assert graph[1] == [2, 3]
assert graph[4] == [2]
```

读取一个从未出现的键会把它插入 `defaultdict`。只想查询而不改变字典时，可以使用 `key in graph` 或 `graph.get(key)`。

## `set`：判重与集合关系

```python
seen = set()

for x in [3, 1, 3, 2]:
    seen.add(x)

assert seen == {1, 2, 3}
assert 2 in seen
```

常用集合运算：

```python
a = {1, 2, 3}
b = {3, 4}

assert a | b == {1, 2, 3, 4}
assert a & b == {3}
assert a - b == {1, 2}
assert a ^ b == {1, 2, 4}
```

集合元素必须可哈希。列表不能直接放进集合，状态通常转成元组：

```python
visited = set()
state = [1, 2, 3]

visited.add(tuple(state))

assert (1, 2, 3) in visited
```

## `deque`：双端队列

列表尾部的 `append`、`pop` 很快，但 `pop(0)` 需要移动后面所有元素。BFS 应使用 `deque.popleft()`：

```python
from collections import deque

queue = deque([2, 3])
queue.append(4)
queue.appendleft(1)

assert queue.popleft() == 1
assert queue.pop() == 4
assert list(queue) == [2, 3]
```

### BFS 模板

```python
from collections import deque


def shortest_steps(start, target):
    queue = deque([(start, 0)])
    visited = {start}

    while queue:
        x, distance = queue.popleft()
        if x == target:
            return distance

        for next_x in (x - 1, x + 1, x * 2):
            if 0 <= next_x <= 100 and next_x not in visited:
                visited.add(next_x)
                queue.append((next_x, distance + 1))

    return None


assert shortest_steps(5, 17) == 4
assert shortest_steps(7, 7) == 0
```

## 怎样选择

| 任务 | 数据结构 |
|---|---|
| 键到值的映射 | `dict` |
| 统计出现次数 | `Counter` |
| 按键收集列表或集合 | `defaultdict` |
| 只判断是否出现 | `set` |
| BFS 队列、双端操作 | `deque` |
| 可哈希的复合状态 | `tuple` |

容器应该表达题意，而不是为了使用标准库而使用。只有计数时用 `Counter`，需要附加信息时普通 `dict` 往往更清楚。

状态搜索的完整例子见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)，无序答案的排序比较见[Python 排序与顺序验证](./sorting_and_ordering.md)。

## 参考资料

- [Python `collections`](https://docs.python.org/zh-cn/3/library/collections.html)
- [Python 映射类型 `dict`](https://docs.python.org/zh-cn/3/library/stdtypes.html#mapping-types-dict)
- [Python 集合类型](https://docs.python.org/zh-cn/3/library/stdtypes.html#set-types-set-frozenset)
