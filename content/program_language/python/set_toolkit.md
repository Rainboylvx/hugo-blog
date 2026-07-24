---
title: "Python set：哈希集合的核心操作与竞赛用法"
date: 2026-07-18
draft: true
toc: true
tags: ["Python", "set", "哈希表", "算法竞赛"]
---

在实际开发和算法竞赛中，突然意识到 `set` 的价值，往往是从「把功能写出来」转向「把性能压到够用」的一个转折点。

很多初学者只把集合当成「去重工具」，但它的底层是**哈希表（Hash Table）**，平均能做到 $O(1)$ 查找与插入。再配合集合代数运算，经常能把 $O(N^2)$ 的超时代码压到 $O(N)$。

容器总览见 [Python 竞赛常用容器](./collections_toolkit.md)；本文单独把 `set` 讲透。

## 1. 核心特性与创建盲区

集合有三条硬规则：

- **无序**：不能用下标 `s[0]` 访问
- **互异**：自动去重
- **元素必须可哈希**：只能放不可变对象

### 空的 `{}` 不是集合

字典和集合都用大括号。为了兼容，`s = {}` 创建的是**空字典**。空集合只能写：

```python
s = set()
```

### 元素必须可哈希

集合元素必须是不可变对象，例如 `int`、`float`、`str`、`tuple`。不能直接塞 `list`、`dict` 或普通 `set`，否则：

```text
TypeError: unhashable type
```

## 2. 集合代数：四大核心运算

集合真正强的地方在于直接做集合代数。有两套写法：**运算符**和**方法**。

| 概念 | 运算符 | 方法 | 含义 |
| --- | --- | --- | --- |
| 并集 | `s1 \| s2` | `.union(s2)` | 两边所有元素（自动去重） |
| 交集 | `s1 & s2` | `.intersection(s2)` | 两边共有元素 |
| 差集 | `s1 - s2` | `.difference(s2)` | 在 `s1` 不在 `s2` |
| 对称差 | `s1 ^ s2` | `.symmetric_difference(s2)` | 只在一边出现的元素 |

### 运算符 vs 方法

- **运算符**（`|`、`&`、`-`、`^`）左右两边都必须是 `set`
- **方法**（`.union()` 等）参数更宽松，可以传任意可迭代对象（list、tuple、str…），方法内部会临时转成集合再算

```python
s = {1, 2, 3}
# s & [2, 3]                 # TypeError：运算符两边类型不匹配
print(s.intersection([2, 3]))  # {2, 3}
```

原地更新可用 `|=`、`&=`、`-=`、`^=`，例如：

```python
seen = set()
seen |= {1, 2, 3}   # 等价于 seen.update({1, 2, 3})
```

## 3. 元素增删：`remove` 与 `discard`

### 增加

- `.add(x)`：加单个元素；已存在则静默忽略
- `.update(iterable)`：批量添加，效果类似 `|=`

### 删除

这是写代码时最容易翻车的地方：

| 方法 | 行为 |
| --- | --- |
| `.remove(x)` | 删除 `x`；**不存在就抛 `KeyError`** |
| `.discard(x)` | 删除 `x`；**不存在则什么都不做** |
| `.pop()` | **随机**弹出并返回一个元素；空集合抛 `KeyError` |

绝大多数清理场景优先用 `.discard()`，少写一层 `if x in s`。

图论里用集合维护「待处理节点」时，`.pop()` 很方便：

```python
todo = {1, 2, 3}
while todo:
    u = todo.pop()
    # 处理 u，再把新节点 add 进去
```

## 4. 关系判定与短路优化

```python
A = {1, 2}
B = {1, 2, 3, 4}

print(A.issubset(B))    # True，也可用 A <= B
print(B.issuperset(A))  # True，也可用 B >= A
print(A.isdisjoint({5, 6}))  # True：完全没有公共元素
```

### 为什么 `isdisjoint()` 值得用？

判断 `A` 和列表 `B` 是否有交集，新手常写：

```python
if len(A & set(B)) == 0:
    ...
```

这会先完整算出交集并占一块内存。而 `A.isdisjoint(B)` 在扫描时**遇到第一个公共元素就立刻返回 `False`**，既省内存，平均也更快。

## 5. 不可变集合 `frozenset`

普通 `set` 可变，所以：

- 不能当字典的 key
- 不能嵌进另一个 `set`

需要「集合的集合」或「以边为 key」时，用 `frozenset`：

```python
fs1 = frozenset([1, 2, 3])
fs2 = frozenset([2, 3])

valid_states = {fs1, fs2}
graph_weights = {frozenset(["Beijing", "Shanghai"]): 1200}
```

`frozenset` 保留查找、交并差等能力，只是没有增删方法。

## 6. 为什么它是优化核武器？

| 操作 | `list` | `set` | 原因 |
| --- | --- | --- | --- |
| `x in obj` | $O(N)$ | **$O(1)$ 平均** | 列表线性扫；集合靠哈希直达 |
| 去重 | 手动常 $O(N^2)$ | **$O(N)$** | `set(my_list)` 一次遍历完成 |
| 删除中间元素 | $O(N)$ | **$O(1)$ 平均** | 列表要搬移后续元素；集合不需要 |

**代价：** 哈希表用空间换时间，同等元素数量下 `set` 通常比 `list` 更吃内存。在现代硬件和多数 OJ 限制下，这个代价往往划算。

## 7. 竞赛里的典型用法

### 判重 / 访问标记

```python
visited = set()
if state not in visited:
    visited.add(state)
```

### 快速去重

```python
unique = list(set(a))          # 顺序不保证
unique = list(dict.fromkeys(a))  # 需要保序时用 dict
```

### 两边共有元素

```python
common = set(a) & set(b)
```

### 多坐标 / 多状态当集合元素

```python
edges = {frozenset((u, v)) for u, v in pairs}
```

把 `set` 挂在心上：先问「这里是不是在反复查某个东西在不在」，答案是的话，优先考虑哈希集合。
