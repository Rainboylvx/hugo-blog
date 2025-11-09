---
title: "Modules"
date: 2025-11-05
draft: false
toc: true
tags: [""]
categories: [""]
---


## 📚 《Learn You a Haskell》读书笔记：模块 (Modules)

本章的核心是讲解 Haskell 如何组织代码。对于有经验的开发者来说，模块的概念（即“代码库”或“命名空间”）并不陌生，但 Haskell 的实现有几个关键的特色，尤其是在\*\*导入（Import）**和**导出（Export）\*\*的控制上。

### 1\. 核心思想：组织与封装

和 Python 的 `.py` 文件、Node.js 的 `module.exports` / `import` 类似，Haskell 的模块（`.hs` 文件）主要有两个目的：

1.  **组织代码**：将相关功能的函数和类型放在一起。
2.  **控制命名空间**：避免函数名冲突，并隐藏内部实现细节。

### 2\. 如何使用模块：`import` 的三种姿势

这是本章的第一个重点。当你需要使用标准库（如 `Data.List`）或第三方库时，`import` 语句有三种主要形式：

#### a. 默认导入 (Default Import)

```haskell
import Data.List
```

  * **作用**：将 `Data.List` 模块中**所有**导出的函数和类型加载到当前的全局命名空间。
  * **问题**：非常容易造成**命名冲突**。例如，`Data.List` 里的 `filter` 和 `Prelude`（默认导入的）里的 `filter` 就会冲突。
  * **类比**：类似于 Python 的 `from numpy import *`。通常不推荐。

#### b. 限定导入 (Qualified Import) - 最佳实践

```haskell
import qualified Data.Map as M
```

  * **作用**：导入模块，但**不**将其函数放入全局命名空间。你必须使用模块名（或别名）作为前缀来调用它们。
  * **示例**：使用 `M.insert`、`M.lookup` 来操作 Map，而不是 `insert` 或 `lookup`。
  * **类比**：这完全等同于 Python 的 `import numpy as np` 或 `import pandas as pd`。这是在 Haskell 中处理 `Data.Map`、`Data.Set`、`Data.Text` 等模块时**最常用、最推荐**的方式。

#### c. 选择性导入 (Selective Import)

```haskell
-- 1. 只导入指定的几个函数
import Data.List (nub, sort)

-- 2. 导入除指定函数外的所有内容 (常用于解决与 Prelude 的冲突)
import Data.List hiding (filter)
```

  * **作用**：提供了更细粒度的控制，精确指定你需要或你*不*需要哪些函数。
  * **场景**：`hiding` 尤其有用。当你需要 `Data.List` 中的大量函数，但又想继续使用 `Prelude` 里的 `filter` 时，`hiding (filter)` 就是完美的解决方案。

### 3\. 如何创建模块：`module` 与导出列表

这是本章的第二个重点，也是 Haskell 封装性的核心。

#### a. 模块声明与文件结构

在文件的**顶部**，你需要声明你的模块。

```haskell
module Geometry.Sphere (volume, area) where
```

  * **`module Geometry.Sphere ...`**：
      * `Geometry.Sphere` 是模块名。
      * Haskell 对文件结构有**严格要求**：这个文件必须存放在 `Geometry/` 目录下，并命名为 `Sphere.hs`。这和 Java 的包结构类似。
  * **`(volume, area)`**：
      * 这是**导出列表（Export List）**。
      * 它定义了这个模块的**公共 API**。只有在这里列出的函数和类型才能被其他模块导入和使用。
      * **类比**：这非常像 C/C++ 的 `.h` 头文件，或是 Node.js 中赋给 `module.exports` 的对象。

#### b. 导出列表的陷阱与精髓

`()` 导出列表的写法有几种情况，含义天差地别：

1.  **`module MyModule (funcA, funcB) where ...`**

      * **含义**：只导出 `funcA` 和 `funcB`。所有其他未列出的函数（例如 `internalHelperFunc`）都是**私有的**。

2.  **`module MyModule where ...` (省略导出列表)**

      * **含义**：**导出所有**在这个模块中定义的函数和类型。
      * **注意**：这在原型设计或非常小的内部模块时可用，但对于库来说，这破坏了封装性。

3.  **`module MyModule () where ...` (空的导出列表)**

      * **含义**：**不导出任何东西**。这个模块可以被编译，但其他模块无法使用它的任何功能（也许它只为了某个可执行文件的 `main` 函数）。

#### c. 导出自定义类型（Type）的秘密：`(..)` 语法

这部分是 Haskell 模块系统中最精妙、也最容易混淆的地方。当你定义一个自定义数据类型时：

```haskell
data Shape = Circle Float Float Float | Rectangle Float Float
```

你有两种导出它的方式：

1.  **`module ... (Shape) where ...` (导出类型，不导出构造函数)**

      * **含义**：其他模块知道 `Shape` 这个**类型**的存在。它们可以将其用作函数签名（例如 `calculateArea :: Shape -> Float`），但它们**不能创建** `Shape`，也**不能进行模式匹配**。
      * **结果**：你创建了一个**抽象数据类型（Abstract Data Type, ADT）**。其他模块必须使用你*同时*导出的 "智能构造函数"（例如 `createCircle :: Float -> Shape`）来创建实例。
      * **类比**：这类似于 C++ 中只在头文件里**前向声明 (forward declare)** 一个类，但不提供其完整定义，或者一个只有私有构造函数 (private constructor) 的类。

2.  **`module ... (Shape(..)) where ...` (导出类型和所有构造函数)**

      * **含义**：导出 `Shape` 类型，以及它的**所有**值构造函数（`Circle` 和 `Rectangle`）。
      * **结果**：其他模块可以自由地创建 `Shape`（如 `Circle 1.0 2.0 5.0`），并对其进行模式匹配。
      * `Shape(..)` 是 `Shape(Circle, Rectangle)` 的简写。

### 4\. 关键模块与 `Prelude`

  * **`Prelude`**：一个特殊的模块，它会在**所有** Haskell 文件中被**自动（隐式）导入**（除非你使用 `NoImplicitPrelude` 语言扩展）。这就是为什么 `map`、`filter`、`head`、`($)`、`Integer`、`Bool` 等常用功能随处可用的原因。
  * **常用模块**：本章引导我们认识了几个 `Prelude` 之外的核心模块：
      * `Data.List`：提供了更多 `Prelude` 中没有的高级列表函数（如 `nub`, `sort`, `groupBy`）。
      * `Data.Char`：提供了处理字符的函数（如 `isDigit`, `isUpper`, `toLower`）。
      * `Data.Map` 和 `Data.Set`：提供了高效的、不可变的键值对映射和集合。（LYAH 建议使用 `qualified` 导入它们）。

-----

### 💡 总结与反思 (连接你的经验)

1.  **Haskell 更倾向于 `qualified`**：与 Python（`from ... import ...` 很常见）不同，Haskell 社区由于 `Prelude` 的存在和对类型安全的重视，**强烈推荐使用 `import qualified ... as ...`**。
2.  **导出列表 = 公共 API**：Haskell 的 `module ... (...) where` 语法是一种非常明确和强大的定义公共 API 的方式，比 C++ 的 `public/private` 或 JS/TS 的 `export` 关键字更集中、更一目了然。
3.  **`(..)` 语法是封装的开关**：`Shape` vs `Shape(..)` 的区别是 Haskell 封装思想的体现。它允许你精确控制类型的"不透明度" (opacity)，这是实现真正抽象数据类型的关键。

希望这份笔记对你巩固 Haskell 模块的知识有所帮助！

接下来，你是否想深入了解一些最重要的标准库模块，比如 `Data.Map` 或 `Data.Text` 的常用 API？