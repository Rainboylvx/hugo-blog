---
title: "chapter_4 《Haskell：函数语法》读书笔记核心内容"
date: 2025-11-02
draft: false
toc: true
tags: [""]
categories: [""]
---



## 一、 模式匹配 (Pattern Matching)

模式匹配是 Haskell 中一种极其强大的特性，它允许你根据输入数据的具体“形状”或“值”来定义函数的不同行为。

### 1\. 基本用法

通过为同一个函数提供多个定义（称为“函数子句”），Haskell 会按从上到下的顺序检查哪个模式匹配了当前的参数：

```haskell
-- 如果参数是 7，就返回 "LUCKY NUMBER SEVEN!"
lucky :: Int -> String
lucky 7 = "LUCKY NUMBER SEVEN!"
-- 如果参数是其他任何整数（用 x 匹配），就返回 "Sorry, you're out of luck, pal!"
lucky x = "Sorry, you're out of luck, pal!"

-- 调用:
-- ghci> lucky 7
-- "LUCKY NUMBER SEVEN!"
-- ghci> lucky 8
-- "Sorry, you're out of luck, pal!"
```

### 2\. 在递归中的应用

模式匹配是实现递归函数的自然方式，特别是用于定义“基本情况”（Base Case）：

```haskell
factorial :: Int -> Int
-- 基本情况：0 的阶乘是 1
factorial 0 = 1
-- 递归情况：n 的阶乘是 n * (n-1) 的阶乘
factorial n = n * factorial (n - 1)
```

### 3\. 匹配元组 (Tuples) 和列表 (Lists)

模式匹配可以“解构”数据结构：

  * **元组：**

    ```haskell
    addVectors :: (Double, Double) -> (Double, Double) -> (Double, Double)
    -- 将两个元组的元素分别解构到 a, b 和 x, y
    addVectors (a, b) (x, y) = (a + x, b + y)
    ```

  * **列表：**

      * `[]`：匹配空列表。
      * `x:xs`（Cons 操作符）：匹配非空列表。`x` 绑定到列表的**头部**（第一个元素），`xs` 绑定到**尾部**（剩余所有元素组成的列表）。
      * `x:y:zs`：匹配至少有两个元素的列表。`x` 是第一个，`y` 是第二个，`zs` 是剩下的。

    <!-- end list -->

    ```haskell
    myHead :: [a] -> a
    -- 如果列表非空 (x:xs)，返回头部 x
    myHead (x:xs) = x
    -- 注意：这个版本的 myHead 在遇到空列表时会引发错误，因为它没有匹配 [] 的模式。
    ```

### 4\. “as”模式（As-Patterns）

使用 `@` 符号，你可以在解构的同时，保留对整个匹配项的引用：

```haskell
-- xs@(x:y:_)
-- xs 会绑定到整个列表
-- x 会绑定到第一个元素
-- y 会绑定到第二个元素
capital :: String -> String
capital "" = "Empty string, whoops!"
capital all@(x:xs) = "The first letter of " ++ all ++ " is " ++ [x]

-- 调用:
-- ghci> capital "Dracula"
-- "The first letter of Dracula is D"
```

## 二、 哨兵 (Guards)

如果说模式匹配是根据“形状”进行分支，那么哨兵（Guards）就是根据“布尔条件”（`True` 或 `False`）来进行分支。

  * 哨兵写在函数体等号的右侧，用 `|`（管道符）开始。
  * Haskell 会**依次检查**每个哨兵条件。


```haskell
bmiTell :: Double -> Double -> String
bmiTell weight height
    | bmi <= 18.5 = "You're underweight, you emo, you!"
    | bmi <= 25.0 = "You're supposedly normal."
    | bmi <= 30.0 = "You're fat! Lose some weight, fatty!"
    | otherwise   = "You're a whale, congratulations!"
    where bmi = weight / height ^ 2 -- 'where' 绑定在下面介绍

-- `otherwise` 是一个特殊的哨兵，它总是为 True，用于捕捉所有其他情况，
-- 类似于其他语言中的 'else'。
```

## 三、 `where` 绑定

`where` 关键字允许你在函数定义的**末尾**（在所有哨兵之后）定义局部变量或辅助函数。

  * **作用域**：`where` 中定义的名称只在**当前这个函数定义**（包括它所有的哨兵）中可见。
  * **对齐**：`where` 块中的所有绑定必须正确对齐。

<!-- end list -->

```haskell
bmiTell :: Double -> Double -> String
bmiTell weight height
    | bmi <= skinny = "You're underweight, you emo, you!"
    | bmi <= normal = "You're supposedly normal."
    | bmi <= fat    = "You're fat! Lose some weight, fatty!"
    | otherwise     = "You're a whale, congratulations!"
    where bmi = weight / height ^ 2
          -- 可以在 where 内部继续定义
          (skinny, normal, fat) = (18.5, 25.0, 30.0)
```

## 四、 `let` 绑定

`let` 绑定是另一种创建局部变量的方式，但它是一个**表达式**，而不是像 `where` 那样的“块”。

  * **格式**：`let <bindings> in <expression>`
  * **作用域**：`let` 中定义的名称**只在 `in` 之后的表达式中**可见。

<!-- end list -->

```haskell
cylinder :: Double -> Double -> Double
cylinder r h =
    let sideArea = 2 * pi * r * h
        topArea = pi * r ^ 2
    in sideArea + 2 * topArea
```

  * **`let` vs `where`**：
      * `where` 绑定在函数底部，其作用域覆盖整个函数（包括所有哨兵）。
      * `let` 绑定是表达式，可以**随处使用**（例如在 `if` 语句的某个分支中），但作用域仅限于其 `in` 部分。
      * `let` 绑定在 GHCI（Haskell 解释器）中非常有用，可以用来定义临时变量。

## 五、 `case` 表达式

`case` 表达式是模式匹配的“表达式版本”。它允许你在函数体内的任何地方，根据一个值进行模式匹配。

  * **格式**：

    ```haskell
    case <expression> of
        <pattern1> -> <result1>
        <pattern2> -> <result2>
        ...
    ```

  * **用途**：当你不想为每种模式都创建一个顶层函数定义，或者想在另一个表达式内部进行模式匹配时，`case` 非常有用。

<!-- end list -->

```haskell
-- 使用 case 重写 head
head' :: [a] -> a
head' xs = case xs of []    -> error "No head for empty lists!"
                      (x:_) -> x

-- 描述列表的 case 表达式
describeList :: [a] -> String
describeList xs = "The list is " ++ case xs of []  -> "empty."
                                               [x] -> "a singleton list."
                                               _   -> "a longer list."
```

-----