---
title: "Python 竞赛中的字典 (dict) 经典用法"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "dict", "算法竞赛"]
---

`dict` 是 Python 里最重要的数据结构之一，没有它很多代码写起来会非常痛苦。在算法竞赛中，dict 的本质是**哈希表**，$O(1)$ 插入、$O(1)$ 查找，配上 `get`、`defaultdict`、`Counter` 三个变体，覆盖了竞赛中至少 30% 的数据结构需求。

## 0. dict 基础回顾

```python
d = {}
d["key"] = value        # 插入 / 修改
d.get("key", default)   # 安全取值，不存在返回 default
"key" in d              # 判存在
d.keys()                # 所有 key
d.values()              # 所有 value
list(d)                 # key 列表
```

## 1. 计数器（频次统计）

最最常见的用法，统计每个元素出现了多少次。

```python
arr = [1, 3, 2, 1, 3, 1]

cnt = {}
for x in arr:
    cnt[x] = cnt.get(x, 0) + 1

print(cnt)  # {1: 3, 3: 2, 2: 1}
```

> [!TIP] 等价于一行 `Counter`
> `from collections import Counter` 然后 `cnt = Counter(arr)` 直接得到同样的结果。

## 2. 映射 / 替换规则

把一种值映射到另一种值，常用于编码转换。

```python
mp = {"石头": 0, "剪刀": 1, "布": 2}
code = mp["石头"]  # 0
```

## 3. 记忆化 / DP 缓存

当状态不是简单的整数下标（比如 `(mask, last)` 这样的元组）时，用 dict 做手动 cache。

```python
cache = {}

def dfs(mask, last):
    key = (mask, last)
    if key in cache:
        return cache[key]
    # ... 计算 ...
    cache[key] = ans
    return ans
```

其实就是 `@cache` 底层做的事，只是这里你可以手动控制何时清空缓存。

## 4. 邻接表（图）

当节点编号不连续或不是整数（如字符串名称）时，dict 比 list 更适合做邻接表。

```python
g = {}
for u, v in edges:
    if u not in g: g[u] = []
    if v not in g: g[v] = []
    g[u].append(v)
    g[v].append(u)
```

当然，配合下一节的 `defaultdict` 写起来更干净。

## 5. defaultdict：省掉判存在

`defaultdict` 是 dict 的增强版——访问不存在的 key 时，自动调用工厂函数生成默认值，不会抛 `KeyError`。

```python
from collections import defaultdict
```

### 5.1 统计频次

```python
arr = [1, 3, 2, 1, 3, 1]
cnt = defaultdict(int)   # 默认值是 0

for x in arr:
    cnt[x] += 1          # 首次 cnt[x] 自动 = 0

print(cnt)  # {1: 3, 3: 2, 2: 1}
```

### 5.2 分组聚合

把元素按某个 key 分组，value 存成列表。

```python
items = [("苹果", 5), ("香蕉", 3), ("苹果", 2), ("香蕉", 7)]

groups = defaultdict(list)
for name, val in items:
    groups[name].append(val)

print(dict(groups))
# {'苹果': [5, 2], '香蕉': [3, 7]}
```

### 5.3 邻接表建图

```python
g = defaultdict(list)

for u, v in edges:
    g[u].append(v)
    g[v].append(u)

# 直接 g[u] 访问，首次自动是 []
```

### 5.4 多层嵌套 defaultdict

比如要建一个 `dict` 套 `dict` 的结构：

```python
d = defaultdict(lambda: defaultdict(int))
d["Alice"]["数学"] += 1
d["Alice"]["语文"] += 1
d["Bob"]["数学"] += 1
```

## 6. 去重 + 记录位置

保留每个元素第一次出现的位置。

```python
arr = [4, 2, 4, 1, 2, 3]
pos = {}

for i, x in enumerate(arr):
    if x not in pos:
        pos[x] = i

print(pos)  # {4: 0, 2: 1, 1: 3, 3: 5}
```

## 7. 两数之和（查找表）

经典 $O(N)$ 解法，用 dict 存“值→下标”。

```python
arr = [2, 7, 11, 15]
target = 9

seen = {}
for i, x in enumerate(arr):
    need = target - x
    if need in seen:
        print(seen[need], i)  # 0 1
    seen[x] = i
```

## 8. 坐标离散化

稀疏坐标映射成连续的整数下标，用于线段树或 BIT。

```python
xs = sorted(set(raw_xs))
mp = {v: i for i, v in enumerate(xs)}
```

## 9. 合并区间 / 分组聚合

和 5.2 类似，但场景更明确：把一对多的关联关系整理成 dict。

```python
pairs = [("A", 1), ("B", 2), ("A", 3), ("B", 4)]
agg = defaultdict(list)

for k, v in pairs:
    agg[k].append(v)

print(dict(agg))  # {'A': [1, 3], 'B': [2, 4]}
```

## 总结

| 场景 | 写法 | 备注 |
|------|------|------|
| 统计频次 | `d[x] = d.get(x, 0) + 1` | 或 `Counter` |
| 分组 | `defaultdict(list)` | 自动建空列表 |
| 查表 | `if key in d:` | $O(1)$ 判存在 |
| 手动 cache | `key = (a,b); d[key]` | 状态是复合结构时 |
| 邻接表 | `defaultdict(list)` | 节点不连续时 |
| 嵌套结构 | `defaultdict(lambda: defaultdict(int))` | 二维统计 |

**dict + defaultdict + Counter** 这三件套，基本覆盖了竞赛中所有哈希表需求。
