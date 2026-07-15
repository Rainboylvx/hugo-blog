---
title: "Python 暴力验证：含有重复元素的全排列去重（unique_permutations）"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "全排列", "DFS", "算法竞赛"]
---

在算法竞赛中，全排列暴力枚举是我们经常用来验证贪心结论或者小数据骗分的杀手锏。

在 Python 里，原生提供了 `itertools.permutations`。但它有一个致命的弱点：**当数组中含有重复元素时，它无法自动去重。**

这篇文章我们就来聊聊为什么必须手动实现带去重功能的全排列 `unique_permutations`，它的经典实战场景，以及最核心的那一行“神级剪枝代码”到底是怎么生效的。

## 1. 痛点：为什么原生库会翻车？

假设我们有一个数组 `[1, 1, 2]`，我们想要求它的所有全排列。

如果你直接使用原生库：
```python
from itertools import permutations
for p in permutations([1, 1, 2]):
    print(p)
```
**结果会输出 6 行：**
```text
(1, 1, 2)
(1, 2, 1)
(1, 1, 2)  <-- 重复了！
(1, 2, 1)  <-- 重复了！
(2, 1, 1)
(2, 1, 1)  <-- 重复了！
```

**原因分析**：
Python 原生的 `permutations` 是基于“元素所在数组的索引”来排列的，它是个“脸盲”。在它眼里，第 0 号位的 `1` 和第 1 号位的 `1` 是截然不同的两个存在。所以它老老实实地输出了 $3! = 6$ 种排列。

如果在比赛中，你遇到的是 `[1, 1, 1, 1, 2, 2]` 这种有大量重复元素的数组，原生库会生成 $6! = 720$ 种状态，而实际不重复的排列只有 $C(6, 2) = 15$ 种！这会引起严重的性能灾难（TLE）。

## 2. 正确姿势：使用 DFS 手写去重全排列

为了解决这个问题，在我们的 [Python 暴力代码大模板](./brute_force_template.md) 中，提供了一个 `unique_permutations` 函数。

```python
def unique_permutations(a):
    """Yield distinct permutations even when a contains duplicates."""
    items = sorted(a)
    used = [False] * len(items)
    path = []

    def dfs():
        if len(path) == len(items):
            yield tuple(path)
            return

        for i, value in enumerate(items):
            if used[i]:
                continue
            
            # 核心剪枝：保证相同元素的相对顺序
            if i > 0 and items[i] == items[i - 1] and not used[i - 1]:
                continue

            used[i] = True
            path.append(value)
            yield from dfs()
            path.pop()
            used[i] = False

    yield from dfs()
```

调用 `list(unique_permutations([1, 1, 2]))`，结果将干净利落地只剩下 3 个：
```text
(1, 1, 2)
(1, 2, 1)
(2, 1, 1)
```

## 3. 核心剪枝原理解析

这段代码之所以高效，全靠里面的一行剪枝判定：

```python
if i > 0 and items[i] == items[i - 1] and not used[i - 1]:
    continue
```

要彻底理解它，我们必须给相同的元素打上标签。把 `[1, 1, 2]` 想象成 `[1A, 1B, 2]`。我们有 3 个“坑位”等待填入数字。

这行代码背后的数学思想极其霸道：**强制规定相同元素的相对顺序！**
我们给算法定下一个死规矩：**在生成的任何排列里，`1A` 必须永远出现在 `1B` 的前面！**
一旦强制了相对顺序不变，像 `(1B, 1A, 2)` 这种重复产生的分支，就从根本上被掐断了。

让我们跟着 DFS 模拟一下 `not used[i - 1]` 是如何执法的：

### 合法情况（允许生成 `1A, 1B, 2`）
1. 第 1 个坑填了 `1A`。此时 `1A` 被使用，`used[0] = True`。
2. DFS 进入下一层，准备填第 2 个坑。它遍历到了 `1B`（索引 $i=1$）。
3. 检查条件：`items[1] == items[0]` 成立，但是 `used[0]` 是 `True`（即 `not used[0]` 为 `False`）。
4. **不拦截！** 允许把 `1B` 放到第 2 个坑里。（这保证了 1A 在前，1B 在后的合法情况能顺利生成）。

### 剪枝情况（拦截 `1B, 1A, 2` 的生成）
1. 后来回溯发生了，`1A` 被从第 1 个坑里拔出来了。此时第 1 个坑是空的，`used[0]` 变回了 `False`。
2. DFS 尝试在第 1 个坑放其他的数。它遍历到了 `1B`（索引 $i=1$）。
3. 检查条件：`items[1] == items[0]` 成立，且此时 `used[0]` 为 `False`（即 `not used[0]` 为 `True`！说明前面的 `1A` 还是自由之身）。
4. **致命一击（拦截）！** `continue` 跳过。

> [!IDEA] 一句话口诀
> **“同卵双胞胎哥哥还没被用过，做弟弟的就不许抢先占用前面的坑位！”**

## 4. 经典实战应用场景

只要你碰到**“数组或字符串里有重复元素，需要枚举所有排列情况”**，直接无脑复制这个函数。

### 场景 A：字符串异构词枚举（字母重排）
**题目**：给定一个字符串（可能有重复字母如 `"AAB"`），求出它能组合出的所有不同的单词。
```python
s = "AAB"
for p in unique_permutations(list(s)):
    word = "".join(p)
    print(word)
    # AAB, ABA, BAA
```

### 场景 B：含有重复数字的暴力数字组合
**题目**：给你几张数字卡片 `[2, 0, 2, 4]`，拼成 4 位数（第一位不能是 0），有多少种不同的结果？
```python
cards = [2, 0, 2, 4]
ans = 0
for p in unique_permutations(cards):
    if p[0] != 0:  # 第一位不能是 0
        ans += 1
print(ans) # 自动去重计算
```

### 场景 C：二值数组的状态枚举
有时候我们只想从 $N$ 个位置里挑 $K$ 个位置变成 1，剩下的变成 0。你可以用 `combinations` 挑索引，但也完全可以把一个 `[1]*K + [0]*(N-K)` 的数组进行 `unique_permutations`，两种写法在暴力对拍中一样实用！
