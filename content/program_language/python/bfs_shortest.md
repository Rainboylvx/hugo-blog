---
title: "Python 暴力验证：通用 BFS 最短路径模板（隐式图状态搜索）"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "BFS", "最短路径", "算法竞赛", "隐式图"]
---

在算法竞赛的暴力验证中，我们经常需要在**没有显式建图**的情况下，对一个隐式的状态空间进行 BFS，求取从起点到目标状态的最短步数（最小步数）。

这种需求极其常见，比如：八数码问题、迷宫寻路、单词接龙、华容道等。

在我们的 [Python 暴力代码大模板](./brute_force_template.md) 中，提供了一个高度泛化的 BFS 函数 `bfs_shortest`，它不需要你提前建好整个图，只需要告诉它三个东西：起点、如何判断终点、如何从当前状态产生下一步。

## 函数签名与三个参数

```python
def bfs_shortest(start, is_goal, neighbors):
    """Return the minimum number of edges to a goal, or None."""
```

| 参数 | 类型 | 含义 |
|------|------|------|
| `start` | `any` | 起始状态，可以是整数、元组、字符串、甚至是自定义对象 |
| `is_goal` | `state -> bool` | 一个函数，接收一个状态，返回它是否为目标 |
| `neighbors` | `state -> iterable` | 一个函数，接收一个状态，返回所有相邻状态的集合（可迭代） |

**返回值**：
- 如果可达，返回从 `start` 到目标的**最少步数（边数）**。
- 如果不可达，返回 `None`。

## 设计亮点：为什么 distance 既是 visited 又是距离？

在标准的 BFS 中，我们通常需要一个 `visited` 集合防止走回头路，和一个 `dist` 数组记录步数。

这个函数把它们合二为一，用了**一个 `dict`**：
```python
distance = {start: 0}
```
- `if next_state in distance`：等价于 visited 判重。
- `distance[next_state] = current_distance + 1`：同时完成了距离记录。

这比另外维护一个 `set` 和一个 `list/dict` 更简洁，且同样高效（dict 的 key 查找是 $O(1)$ 的）。

## 实战 1：一维数轴上的最短步数

**题目**：你在位置 `0`，每次可以向左或向右走 1 步，但不能走出 `[0, 4]` 这个区间。求到达位置 `3` 需要的最少步数。

```python
def line_neighbors(x):
    return [y for y in (x - 1, x + 1) if 0 <= y <= 4]

dist = bfs_shortest(0, lambda x: x == 3, line_neighbors)
print(dist)  # 输出 3
# 路径：0 -> 1 -> 2 -> 3
```

## 实战 2：网格迷宫（二维坐标）

**题目**：在 4×4 网格上从 `(0, 0)` 走到 `(3, 3)`，`*` 是障碍物，每一步可以上下左右移动，求最短步数。

```python
maze = [
    [0, 0, 0, 0],
    [0, 1, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 0, 0],
]
# 1 表示障碍物，不能走

def neighbors(pos):
    x, y = pos
    res = []
    for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < 4 and 0 <= ny < 4 and maze[nx][ny] == 0:
            res.append((nx, ny))
    return res

dist = bfs_shortest((0, 0), lambda p: p == (3, 3), neighbors)
print(dist)  # 输出 6
```

## 实战 3：八数码 / 滑块问题的状态搜索（元组做状态）

**题目**：2×3 的滑块，数字 `[0,1,2,3,4,5]`，`0` 代表空格，可以和上下左右的格子交换。求从初始状态到目标状态的最小步数。

```python
start = (1, 2, 3, 0, 4, 5)  # 空格在第 3 个位置
target = (1, 2, 3, 4, 0, 5)

def neighbors(state):
    zero = state.index(0)
    res = []
    # 行数 = 2，列数 = 3
    row, col = zero // 3, zero % 3

    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = row + dr, col + dc
        if 0 <= nr < 2 and 0 <= nc < 3:
            new_zero = nr * 3 + nc
            lst = list(state)
            lst[zero], lst[new_zero] = lst[new_zero], lst[zero]
            res.append(tuple(lst))
    return res

dist = bfs_shortest(start, lambda s: s == target, neighbors)
print(dist)
```

## 实战 4：单词接龙（编辑距离为 1）

**题目**：给定一个单词集合 `word_set`，从 `"hit"` 开始，每次可以改变一个字母，求到达 `"cog"` 的最短步数（所有中间词必须在词集内）。

```python
word_set = {"hot", "dot", "dog", "lot", "log", "cog"}

def neighbors(word):
    res = []
    for i in range(len(word)):
        for c in "abcdefghijklmnopqrstuvwxyz":
            nw = word[:i] + c + word[i+1:]
            if nw in word_set:
                res.append(nw)
    return res

dist = bfs_shortest("hit", lambda w: w == "cog", neighbors)
print(dist)  # 输出 4  (hit -> hot -> dot -> dog -> cog)
```

## 总结

`bfs_shortest` 的通用性来源于它将 BFS 的骨架完全抽象出来，核心就是**三个参数**：

```
start + is_goal(判终) + neighbors(邻接) = BFS(最短步数)
```

在暴力对拍中，遇到需要求“最小步数”的隐式图搜索，直接套这个函数，你只需要写 `neighbors` 函数定义状态如何转移，其余的判重、出队入队、距离记录全部交给模板完成，既快又不出错。
