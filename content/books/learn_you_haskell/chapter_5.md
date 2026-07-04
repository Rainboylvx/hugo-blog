---
title: "chapter 5 Recursion"
date: 2026-07-04
draft: false
toc: true
tags: ["读书笔记"]
categories: [""]
---

## 一、 递归 (Recursion) 的核心思想

在 Haskell 中，**根本没有循环**（没有 `for`、`while`）。要实现重复操作，唯一的方式就是**递归**。

递归的核心模式就两步：

1.  **基线条件 (Base Case)**：问题的最简形式，直接返回结果。
2.  **递归条件 (Recursive Case)**：将问题缩小一步，然后调用自身处理缩小后的版本。

## 二、 经典递归示例

### 1. 最大值 `maximum'`

```haskell
maximum' :: (Ord a) => [a] -> a
maximum' [] = error "maximum of empty list"
maximum' [x] = x
maximum' (x:xs)
    | x > maxTail = x
    | otherwise   = maxTail
    where maxTail = maximum' xs
```

可以写成更简洁的形式：

```haskell
maximum' :: (Ord a) => [a] -> a
maximum' [] = error "maximum of empty list"
maximum' [x] = x
maximum' (x:xs) = max x (maximum' xs)
```

**执行过程**：`maximum' [2,5,1]`：
```
maximum' [2,5,1]
  → max 2 (maximum' [5,1])
  → max 2 (max 5 (maximum' [1]))
  → max 2 (max 5 1)
  → max 2 5
  → 5
```

### 2. 复制 `replicate'`

```haskell
replicate' :: Int -> a -> [a]
replicate' n x
    | n <= 0 = []          -- 基线：复制 0 次或负数次，返回空列表
    | otherwise = x : replicate' (n-1) x  -- 递归：放一个元素，然后复制剩下的
```

### 3. 取前 n 个元素 `take'`

```haskell
take' :: Int -> [a] -> [a]
take' n _
    | n <= 0 = []          -- 基线 1：取 0 个元素，空列表
take' _ [] = []            -- 基线 2：空列表，取啥都是空
take' n (x:xs) = x : take' (n-1) xs  -- 递归：取一个，再取剩下的
```

注意：这里使用了 `_` 来忽略不需要的参数，以及**多个基数条件**。

### 4. 反转 `reverse'`

```haskell
reverse' :: [a] -> [a]
reverse' [] = []
reverse' (x:xs) = reverse' xs ++ [x]
```

### 5. 无限递归 `repeat'`

Haskell 支持无限列表，所以递归**可以没有基线条件**：

```haskell
repeat' :: a -> [a]
repeat' x = x : repeat' x
```

`repeat' 3` 会产生 `3:3:3:3:...` 永不停歇。单独调用它会无限循环，但配合 `take` 就能截取想要的长度：

```haskell
-- ghci> take 5 (repeat' 3)
-- [3,3,3,3,3]
```

这与 `replicate 5 3` 等价。

### 6. 判断相等 `zip'`

```haskell
zip' :: [a] -> [b] -> [(a, b)]
zip' _ [] = []
zip' [] _ = []
zip' (x:xs) (y:ys) = (x, y) : zip' xs ys
```

关键是同时匹配两个列表的基线条件。

### 7. 元素是否在列表中 `elem'`

```haskell
elem' :: (Eq a) => a -> [a] -> Bool
elem' a [] = False
elem' a (x:xs)
    | a == x    = True
    | otherwise = a `elem'` xs
```

### 8. 快速排序 (Quicksort)

这是 Haskell 用递归实现算法的经典例子——**极其优雅**：

```haskell
quicksort :: (Ord a) => [a] -> [a]
quicksort [] = []
quicksort (x:xs) =
    let smallerSorted = quicksort [a | a <- xs, a <= x]
        biggerSorted  = quicksort [a | a <- xs, a > x]
    in smallerSorted ++ [x] ++ biggerSorted
```

**怎么理解？**

1.  基线条件：空列表已经排好序。
2.  取第一个元素 `x` 作为 **基准 (pivot)**。
3.  `smallerSorted`：所有 `<= x` 的元素排序后的结果。
4.  `biggerSorted`：所有 `> x` 的元素排序后的结果。
5.  结果就是：`smallerSorted ++ [x] ++ biggerSorted`。

测试一下：

```haskell
-- ghci> quicksort [10, 2, 5, 3, 1, 6, 7, 4, 2, 8, 5]
-- [1,2,2,3,4,5,5,6,7,8,10]
```

**纯函数式 Quicksort 和命令式的区别**：

| 特性 | C/Java | Haskell |
|------|--------|---------|
| 排序方式 | 原地交换 (in-place) | 产生新列表 |
| 内存 | O(log n) 额外 | O(n) 额外 |
| 代码行数 | ~30 行 | 4 行 |
| 可读性 | 需要仔细跟踪指针 | 声明式，一目了然 |

## 三、 思考递归的方式

**不要手动展开递归！**

坏习惯：
```haskell
-- 不要这样想：
-- quicksort [5,1,9,3]
-- = quicksort [1,3] ++ [5] ++ quicksort [9]
-- = (quicksort [] ++ [1] ++ quicksort [3]) ++ [5] ++ (quicksort [] ++ [9] ++ quicksort [])
-- ...
```

好习惯：**相信递归能正确处理子问题**。你只需要：

1.  定义**最简单的情况**（基线条件）。
2.  把问题**缩小一步**。
3.  假设递归调用已经正确处理了缩小后的子问题。
4.  把当前这一小步和递归结果**组合**起来。

> "You take an empty list—that's the base case. Then you assume the function can sort any non-empty list's tail, and you just handle the head."

### 单位元 (Identity Element)

每种递归操作都有一个**单位元**——与该值运算不会改变结果：

| 操作 | 单位元 | 原因 |
|------|--------|------|
| 阶乘 `factorial n = n * factorial (n-1)` | `1` | `1 * x = x` |
| 求和 `sum (x:xs) = x + sum xs` | `0` | `0 + x = x` |
| 反转 `reverse (x:xs) = reverse xs ++ [x]` | `[]` | `[] ++ xs = xs` |
| Quicksort 边界 | `[]` | `[] ++ xs = xs` |

在定义基线条件时，问问自己：**最小情况返回什么值才不会破坏结果？**

## 四、 总结

- Haskell 用递归代替循环，这是函数式编程的核心思维方式。
- 模式匹配是定义递归的天然工具：用 `[]` 和 `(x:xs)` 来匹配列表。
- 列表的递归模式非常统一：**处理头部，递归尾部**。
- Quicksort 是最能体现 Haskell 声明式编程优雅性的例子。
