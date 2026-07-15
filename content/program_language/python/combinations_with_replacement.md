---
title: "Python 组合数学神器：combinations_with_replacement 的巧妙应用"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "组合数学", "itertools", "算法竞赛"]
---

在 Python 的 `itertools` 库中，有一个名字特别长，却在特定场景下能发挥奇效的函数：`combinations_with_replacement`。

翻译过来，它叫做：**有放回的组合**（也可称为“允许重复的组合”）。

这篇文章我们将从**它和普通组合的区别**讲起，揭示它背后**“隔板法”的数学本质**，最后看看它在算法竞赛暴力枚举中的实战威力。

## 1. 核心区别：和普通组合的不同

假设我们有一个数字池：`a = [1, 2, 3]`，我们要从中选出 $K = 2$ 个数字。

**如果是普通的组合 `combinations(a, 2)`（不放回）：**
选出的数字不能重复。
结果是：`(1, 2), (1, 3), (2, 3)`，共 3 种。

**如果是 `combinations_with_replacement(a, 2)`（有放回）：**
选出一个数字后，还可以再选它！
结果是：`(1, 1), (1, 2), (1, 3), (2, 2), (2, 3), (3, 3)`，共 6 种。

> [!WARNING] 注意它与 product 的区别
> 千万不要把它和笛卡尔积 `product(a, repeat=2)` 搞混。
> `product` 是**排列**（关心顺序），它会生成 `(1, 2)` 和 `(2, 1)`。
> 而 `combinations_with_replacement` 是**组合**（不关心顺序），只会生成 `(1, 2)`，因为它已经代表了“选了一个 1 和一个 2”这组选择。

## 2. 数学本质：隔板法与球盒模型

在组合数学中，**“从 $N$ 种物品里任选 $K$ 件（每种都有无限个）”** 是一个经典模型。
一个初学者常常感到反直觉的结论是：这个模型绝对等价于 **“将 $K$ 个相同的小球扔进 $N$ 个不同的箱子里（允许空箱）”**。

为什么是等价的？我们用具象的例子推演一下：

假设 $N=3$ 种水果：【苹果🍎】、【香蕉🍌】、【橘子🍊】。你要挑 $K=4$ 个。
一个典型的选择可能是：**拿了 2 个苹果，0 个香蕉，2 个橘子。**

现在，我们把这三种水果摊位看作是 $N=3$ 个**箱子**。
你不要去直接拿水果，而是想象你手里拿着 $K=4$ 张一模一样的**提货券（也就是相同的小球）**。
你的任务是，把这 4 张提货券分配给这 3 个摊位：
*   你向苹果摊投了 **2** 张券。
*   你向香蕉摊投了 **0** 张券。
*   你向橘子摊投了 **2** 张券。

发现了吗？**不管你选什么水果组合，它都唯一且精确地对应着一种“把提货券（小球）投进摊位（箱子）”的方法。**

这两个问题的核心本质，都是在求解一个非负整数的多元一次方程：

$$ x_1 + x_2 + \dots + x_N = K \quad (x_i \ge 0) $$

既然变成了“把 $K$ 个相同的小球放进 $N$ 个不同箱子里（允许空箱）”，根据经典的**隔板法（Stars and Bars）**：
我们需要在 $K$ 个小球之间插入 $N-1$ 个隔板。由于允许空箱，小球和隔板可以排在任意位置，总共需要 $K + N - 1$ 个位置。
从中挑出 $K$ 个位置放小球，剩下的放隔板，方案数即为：

$$ C(N+K-1, K) $$

这就完美解释了 `combinations_with_replacement` 的结果数量。

## 3. 实战场景秒杀

在算法竞赛中，只要遇到“多重集/完全背包的暴力枚举”或是“非降序序列构造”，直接掏出这个函数。

### 实战 A：无限硬币找零的暴力组合

**题目**：你有面值为 1元、2元、5元 的硬币（每种都有无限个）。你要从中恰好挑出 3 枚硬币，求这 3 枚硬币能组成哪些不同的总金额？

```python
from itertools import combinations_with_replacement

coins = [1, 2, 5]
sums = set() # 用 set 去重

# 从 [1, 2, 5] 中有放回地挑 3 枚
for chosen in combinations_with_replacement(coins, 3):
    # chosen 会是 (1, 1, 1), (1, 1, 2), (1, 2, 5), (5, 5, 5) 等等
    sums.add(sum(chosen))

print(sorted(list(sums)))
# 输出: [3, 4, 5, 6, 7, 8, 9, 11, 12, 15]
```

### 实战 B：枚举非严格递增的数列

**题目**：构造所有长度为 $K=3$ 的序列，序列中的元素都在 $[1, 2, 3, 4]$ 之间，并且序列是**非严格递增的**（即 $A_1 \le A_2 \le A_3$）。

如果是用 C++ 写，需要写一个 DFS，并且传递当前的极小值。但在 Python 里可以直接秒杀。
因为**组合本身是不考虑顺序的，而 Python 库返回的元组默认是按输入元素的顺序从小到大排好序的！**

```python
from itertools import combinations_with_replacement

n = 4 # 可选数字 [1, 2, 3, 4]
k = 3 # 序列长度为 3

for seq in combinations_with_replacement(range(1, n+1), k):
    print(seq)
```

输出结果恰好完美满足 $A_1 \le A_2 \le A_3$：
```text
(1, 1, 1)
(1, 1, 2)
(1, 1, 3)
(1, 1, 4)
(1, 2, 2)
(1, 2, 3)
...
(4, 4, 4)
```

## 4. 封装进模板

如果你在使用我们之前整理的暴力代码模板，为了统一代码风格，我们可以把它封装成一个带语义化的 `yield` 函数（在数学中这被称为多重集的抽取）：

```python
def iter_multisets(a, k):
    """
    Yield all multisets of size k drawn from elements in a.
    equivalent to combinations_with_replacement.
    """
    from itertools import combinations_with_replacement
    yield from combinations_with_replacement(a, k)
```

下次遇到这种问题，不需要再去硬写 DFS 啦。
