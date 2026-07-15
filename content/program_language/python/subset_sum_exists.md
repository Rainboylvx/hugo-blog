---
title: "Python 暴力验证：子集和判定（记忆化 DFS 与 @cache）"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "记忆化搜索", "DFS", "DP", "算法竞赛"]
---

在算法竞赛的暴力对拍中，我们经常需要验证这样一个问题：**给定一个数组，是否能选出若干个元素，使得它们的和恰好等于某个目标值？**

这就是经典的子集和判定问题（Subset Sum）。用 C++ 写暴力指数级枚举太慢，用 DP 提前算出所有状态又太重。**记忆化 DFS（Memoized DFS）** 是一个折中优雅的方案——它只递归那些真正被访问到的状态，并用缓存把算过的结果存起来。

本文从具体用法出发，深入到 `@cache` 的原理，并用 C++ 手动记忆化做对比，彻底讲透这个写法。

## 函数用法

在我们的 [Python 暴力代码大模板](./brute_force_template.md) 中，提供了 `subset_sum_exists` 函数：

```python
def subset_sum_exists(a, target):
    """Return whether a subset of a sums to target."""
    values = tuple(a)

    @cache
    def dfs(index, current_sum):
        if index == len(values):
            return current_sum == target

        return (
            dfs(index + 1, current_sum)
            or dfs(index + 1, current_sum + values[index])
        )

    return dfs(0, 0)
```

| 参数 | 含义 |
|------|------|
| `a` | 数组 |
| `target` | 目标和 |
| 返回值 | `True` 或 `False` |

### 用法

```python
print(subset_sum_exists([3, 34, 4, 12, 5, 2], 9))   # True  (4 + 5 = 9)
print(subset_sum_exists([3, 34, 4, 12, 5, 2], 30))  # False
```

## 核心思想：指数级暴力 + 记忆化

首先看最基本的暴力思路。每个位置 `index` 有两个分支：

```
dfs(index, sum)
├── dfs(index + 1, sum)                  ← 不取 a[index]
└── dfs(index + 1, sum + a[index])       ← 取 a[index]
```

base case：当 `index == len(values)` 时，检查 `sum == target`。

没有记忆化的话，这就是一棵 $2^N$ 的二叉树，$N=40$ 时就跑不动了。但仔细观察：**很多不同的路径会到达相同的 `(index, current_sum)` 状态**。比如 `dfs(5, 10)` 可以从 "前 5 个数加起来恰为 10" 的任意路径过来，而结果只需要算一次。

## @cache 的原理：和 C++ 全局数组记忆化完全一样

如果你写过 C++ 记忆化，那么 `@cache` 的工作原理会非常熟悉。

C++ 的做法是手动声明一个全局 DP 数组，用 `-1` 表示未计算：

```cpp
int dp[1005][1005];
memset(dp, -1, sizeof(dp));

int dfs(int i, int sum) {
    if (i == n) return sum == target;
    if (dp[i][sum] != -1) return dp[i][sum];  // 查表：算过了直接返回

    int res = dfs(i + 1, sum);
    if (sum + a[i] <= target)
        res = res || dfs(i + 1, sum + a[i]);

    dp[i][sum] = res;  // 写表：保存结果
    return res;
}
```

Python 的 `@cache` 就是在底层帮你自动完成了上面这三件事：
1. **声明 dict 作为缓存**（相当于 C++ 的 `dp[1005][1005]`）。
2. **查表**：`if key in cache: return cache[key]`（相当于 `if (dp[i][sum] != -1)`）。
3. **写表**：`cache[key] = result`（相当于 `dp[i][sum] = res`）。

它的 key 是 `(index, current_sum)` 这个元组，value 是函数返回值。

> [!INFO] `@cache` 的限制
> `@cache` 的 key 包含 `current_sum`。如果数组中有负数，或者 `target` 值域极大（如 $10^9$），那么 `(index, current_sum)` 的组合数会爆炸，cache 退化成普通暴力。这种场景应该使用双向搜索（Meet in the middle）而非记忆化 DFS。

## 与 DP 的区别

- **DP（动态规划）**：不管用不用得上，算出 $dp[0 \dots N][0 \dots target]$ 所有状态。
- **记忆化 DFS**：只计算被递归实际访问到的状态，在目标值小、但数组长（有很多无效分支）时非常高效。

## 总结

`subset_sum_exists` 的核心就是把指数级 DFS 暴力用 `@cache` 做了缓存剪枝。

```
暴力 DFS  +  @cache  =  记忆化搜索
```

和 C++ 全局数组记忆化是同一个东西，只是 `@cache` 让你不需要手动写查表和写表的模板代码。
