---
title: "制造我们自己的类型和类型类"
date: 2025-11-05
draft: false
toc: true
tags: ["haskell"]
categories: [""]
---


## chapter_8 制造我们自己的类型和类型类

本章是 Haskell 学习过程中的一个重要转折点。它标志着从“使用”语言特性转向“创造”语言特性。核心内容围绕两个方面：一是如何使用 `data` 和 `type` 关键字定义自己的数据结构，二是如何使用 `class` 关键字定义自己的接口（即类型类），并用 `instance` 来实现它。

### 1\. 自定义数据类型 (Data Types)

Haskell 提供了两种主要方式来创建新类型：`data` 和 `type`。

#### a. `data` 关键字：创建全新的数据结构

`data` 关键字用于定义一个全新的数据类型。这是本章的重点。

  * **基本结构**：
    `data TypeName = ValueConstructor1 [ParamType1] | ValueConstructor2 [ParamType2] | ...`

  * **值构造函数 (Value Constructors)**：

      * 它们是 `data` 声明中 `=` 右侧的部分（如 `Circle`, `Rectangle`）。
      * 它们本质上是函数，用于“构造”出该类型的一个值。
      * **关键点**：类型名（`Shape`）和值构造函数（`Circle`）位于不同的命名空间。我们可以在函数签名中使用类型名，但在模式匹配或创建实例时使用值构造函数。

  * **示例分析**：

    ```haskell
    data Shape = Circle Float Float Float | Rectangle Float Float Float Float
    ```

      * `Shape` 是**类型名**。
      * `Circle` 和 `Rectangle` 是**值构造函数**。
      * `Circle` 接受三个 `Float` 参数（例如 x坐标, y坐标, 半径），并返回一个 `Shape` 类型的值。
      * `|` 符号读作“或”。所以 `Shape` 类型的值，*要么*是一个 `Circle`，*要么*是一个 `Rectangle`。

  * **记录语法 (Record Syntax)**：
    当数据结构变得复杂时，使用记录语法可以自动生成用于访问字段的“getter”函数，使代码更清晰。

    ```haskell
    data Person = Person { firstName :: String
                         , lastName :: String
                         , age :: Int
                         }
    ```

    这不仅创建了 `Person` 类型和 `Person` 值构造函数，还自动创建了三个函数：

      * `firstName :: Person -> String`
      * `lastName :: Person -> String`
      * `age :: Person -> Int`

  * **参数化类型 (Parameterized Types)**：
    自定义类型可以接受其他类型作为参数，使其更加通用，类似于其他语言中的“泛型”。

    ```haskell
    data Maybe a = Nothing | Just a
    ```

      * `a` 是一个类型变量。
      * `Maybe` 本身不是一个具体的类型，它是一个**类型构造函数 (Type Constructor)**。它接受一个具体类型（如 `Int`）并返回一个新的具体类型（如 `Maybe Int`）。
      * `Maybe Int` 的值可以是 `Nothing` 或 `Just 5`。

#### b. `type` 关键字：创建类型别名

`type` 关键字不会创建新类型，它只是为现有类型提供一个“别名”或“同义词”。

  * **作用**：主要为了提高代码的可读性。
  * **示例**：
    ```haskell
    type String = [Char]
    type Phonebook = [(String, String)]
    ```
      * `String` 和 `[Char]` 是完全相同、可互换的。
      * `Phonebook` 比 `[(String, String)]` 更能清晰地表达其意图。
  * **与 `data` 的区别**：`type` 只是别名；`data` 创造了全新的、独立于其他任何类型的类型。

### 2\. 派生 (Deriving)

Haskell 可以为我们自动实现某些标准类型类的实例，如 `Show`, `Eq`, `Ord`, `Read`。

```haskell
data Point = Point Float Float deriving (Show, Eq)
```

  * `deriving (Show)`：让 Haskell 自动生成一个函数，以便 `Point` 类型的值可以被转换成字符串（例如，`show (Point 1 2)` 会返回 `"Point 1.0 2.0"`）。这对于调试至关重要。
  * `deriving (Eq)`：让 Haskell 自动生成比较两个 `Point` 值是否相等（`==`）的逻辑。

### 3\. 类型类 (Typeclasses)

类型类是 Haskell 实现“接口”或“多态”的方式。它定义了一组函数签名，任何类型只要实现了这些函数，就可以成为该类型类的“实例”。

#### a. 核心概念对比

  * **类型 (Type)**：定义了数据的结构（例如 `Int`, `Bool`, `Shape`）。
  * **类型类 (Typeclass)**：定义了一组行为或功能（例如 `Eq` 定义了“可比较相等性”，`Show` 定义了“可显示为字符串”）。

#### b. `class` 关键字：定义类型类

`class` 关键字用于定义一个新的类型类（接口）。

```haskell
class Eq a where
    (==) :: a -> a -> Bool
    (/=) :: a -> a -> Bool
    x == y = not (x /= y)  -- 默认实现
    x /= y = not (x == y)  -- 默认实现
```

  * `class Eq a where ...`：定义了一个名为 `Eq` 的类型类，它接受一个类型变量 `a`。
  * `a` 受到了约束：任何想成为 `Eq` 实例的类型 `a`，都必须实现 `(==)` 和 `(/=)` 这两个函数。
  * Haskell 允许提供默认实现，实例可以选择性地只实现其中一个。

#### c. `instance` 关键字：实现类型类

`instance` 关键字用于为特定类型提供类型类的具体实现。

```haskell
-- 为我们之前定义的 Shape 类型实现 Eq
instance Eq Shape where
    (Circle _ _ r1) == (Circle _ _ r2) = r1 == r2
    (Rectangle _ _ w1 h1) == (Rectangle _ _ w2 h2) = (w1 == w2) && (h1 == h2)
    _ == _ = False -- 任何不同类型（如 Circle 和 Rectangle）的比较都为 False
```

  * `instance Eq Shape where ...`：声明我们正在为 `Shape` 类型提供 `Eq` 类型类的实例。
  * 我们必须提供 `(==)`（或 `(/=)`）的具体函数体，其类型必须符合 `Shape -> Shape -> Bool`。

### 4\. 类型类作为约束 (Constraints)

类型类最强大的用途是约束函数签名，使其具有通用性（多态）。

```haskell
find :: (Eq a) => a -> [a] -> Maybe Int
```

  * `(Eq a) =>`：这是一个**类型约束**。
  * 它读作：“对于**任何**满足 `Eq` 类型类（即可比较相等性）的类型 `a`，`find` 函数接受一个 `a` 类型的值和一个 `[a]` 类型的列表...”。
  * 这使得 `find` 函数可以用于 `Int` 列表、`String` 列表，或任何我们为其实现了 `Eq` 实例的自定义类型列表。

### 总结与反思

1.  **`data` 是核心**：`data` 关键字是 Haskell 中数据建模的基础。通过它，我们可以创建出具有高度表现力的数据结构，例如 `Maybe a` 或 `Either a b`，它们在函数式编程中用于处理错误和可选值。
2.  **类型类即接口**：类型类（Typeclasses）是 Haskell 对“接口”的解答。它比 Java 的 `interface` 或 C++ 的抽象基类更灵活，因为它允许我们在类型定义之后“追溯性”地添加实现（如我们为 `Shape` 添加 `Eq` 实例），实现了数据和行为的分离。
3.  **约束即多态**：`(Eq a) =>` 这样的约束是 Haskell 实现泛型编程或多态的方式。它允许函数在不知道具体类型的情况下，安全地操作数据，只要这些数据满足特定接口（类型类）的要求。
