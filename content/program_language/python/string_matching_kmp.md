---
title: "Python 比赛实战：字符串子串匹配（内置方法、正则与手速版 KMP）"
date: 2026-07-18
draft: true
toc: true
tags: ["Python", "算法竞赛", "字符串", "KMP"]
---

在算法比赛（ACM / Codeforces / LeetCode / 蓝桥杯）中，面对字符串匹配问题，核心目标是**在最短时间内快速验证思路**。

不同的场景下，盲目手写标准 KMP 往往不是最优解。本文总结在比赛中使用 Python 进行子串查找与验证的高效策略。

## 1. 场景一：仅验证存在 / 找首个出现位置

如果在比赛中只需要知道模式串 `p` 是否在文本串 `s` 中出现，或者只需要第一次出现的位置：

> [!IMPORTANT] 绝不要手写 KMP，直接使用 Python 内置方法
> Python 内置的 `in` 和 `s.find()` 是由 C 底层（CPython Fastsearch，结合了 Boyer-Moore-Horspool 与哈希优化）实现的，运行效率极高，且 **0 错码风险**。

```python
# 1. 验证是否存在
if p in s:
    print("Found!")

# 2. 获取第一次出现的起始下标（未找到返回 -1）
pos = s.find(p)
```

## 2. 场景二：极速查找所有子串位置（含重叠匹配）

如果要求找出模式串 `p` 在文本串 `s` 中的**所有出现位置（含重叠匹配）**，有以下两种高手速方案：

### 2.1 方案 A：`s.find()` 循环（5 行代码）

利用 `s.find(sub, start)` 移动 `start` 指针不断向后寻找：

```python
def find_all(s: str, p: str) -> list[int]:
    if not p: return []
    ans, pos = [], s.find(p)
    while pos != -1:
        ans.append(pos)
        pos = s.find(p, pos + 1)  # pos + 1 允许重叠；若不允许写 pos + len(p)
    return ans
```

- **优点**：代码极短，30 秒敲完，C 底层加速，普通数据下比手写 Python KMP 还快。
- **缺点**：在极端卡常数据下（如文本 `a`*10^6，模式串 `a`*10^3），最坏复杂度会退化到 $O(N 	imes M)$。

### 2.2 方案 B：正则前瞻断言（一行代码）

利用 `re` 模块与零宽正预测先行断言 `(?=...)` 实现重叠匹配：

```python
import re

ans = [m.start() for m in re.finditer(f'(?={re.escape(pattern)})', text)]
```

#### 测试验证

```python
text = "abababa"
pattern = "aba"

ans = [m.start() for m in re.finditer(f'(?={re.escape(pattern)})', text)]
print(ans)  # [0, 2, 4]
```

#### 原理

1. `re.escape(pattern)`：防止模式串中包含 `.`、`*`、`?` 等正则特殊字符。
2. `(?=...)`：只匹配位置而不消耗文本字符，匹配完后能从下一个字符继续，实现重叠匹配。
3. `m.start()`：提取匹配到的起始下标。

> 如果**不允许重叠匹配**：
> ```python
> ans = [m.start() for m in re.finditer(re.escape(pattern), text)]  # [0, 4]
> ```

## 3. 场景三：严格 $O(N+M)$ 复杂度（手速版 KMP）

当数据量极大（$N \ge 10^6$）且存在针对暴力的构造数据，或需要利用 $\pi$ 数组的周期/循环节性质时，手写 KMP 是必要的。

比赛中采用**高度压缩的手速版 KMP**：

```python
def kmp_all(s: str, p: str) -> list[int]:
    if not p: return []
    n, m = len(s), len(p)
    
    # 1. 快速构造 pi 数组
    pi, j = [0] * m, 0
    for i in range(1, m):
        while j > 0 and p[i] != p[j]: j = pi[j - 1]
        if p[i] == p[j]: j += 1
        pi[i] = j

    # 2. 文本匹配
    ans, j = [], 0
    for i in range(n):
        while j > 0 and s[i] != p[j]: j = pi[j - 1]
        if s[i] == p[j]: j += 1
        if j == m:
            ans.append(i - m + 1)
            j = pi[j - 1]
            
    return ans
```

#### 敲写技巧

- 把简单的 `while` / `if` 压缩，减少换行与缩进。
- 15 行以内，靠肌肉记忆 1 分钟内敲完。

## 4. 比赛实战决策表

| 比赛需求 | 推荐方案 | 核心优势 |
| --- | --- | --- |
| **仅需判断是否存在 / 找首个位置** | `p in s` 或 `s.find(p)` | C 底层实现，极速且 0 错码风险 |
| **需要找所有位置 (重叠/非重叠)** | `s.find(p, pos + 1)` 循环 | 5 行代码，手速极快 |
| **追求代码极短 (一行搞定)** | `re.finditer(f'(?={re.escape(p)})', s)` | 一行包含重叠匹配 |
| **存在极端构造数据 / 需周期性质** | **15 行手速版 KMP** | 严格 $O(N+M)$，防止被卡 TLE |
