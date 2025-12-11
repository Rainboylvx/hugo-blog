---
title: "haskell竞赛io操作"
date: 2025-12-11
draft: false
toc: true
tags: [""]
categories: [""]
---

-----

## Haskell 算法竞赛指南：征服高效 IO

在 Codeforces 上使用 Haskell，最大的挑战在于处理大规模的输入输出。标准的 `getLine` 和 `read` 虽然优雅，但在面对 100MB 的输入文件时显得力不从心。本文将教你如何使用 `ByteString` 构建一套竞赛专用的高效 IO 框架。

## 1 为什么标准 IO 会慢？

在 Haskell 中，`String` 实际上是 `[Char]`，也就是字符的链表。

  * **内存开销：** 每个字符都是一个链表节点，包含指针和数据，内存消耗巨大。
  * **GC 压力：** 处理百万级字符会产生大量的垃圾回收压力。

相比之下，`ByteString` 是紧凑的字节数组（Array），操作它就像在 C/C++ 中操作 `char*` 一样快。

## 2 核心武器：`Data.ByteString.Char8`

我们需要使用 `Data.ByteString.Char8`（通常别名为 `C`）来读取 ASCII 数据（数字、字母）。

### 基础读取函数

最常用的策略是一次性读入所有内容，利用惰性求值按需处理：

```haskell
import qualified Data.ByteString.Char8 as C
import Data.Maybe (fromJust)

-- 读入所有内容
main :: IO ()
main = do
    content <- C.getContents
    -- 处理 content ...
```

### 极速整数解析

这是竞赛中最频繁的操作。我们需要一个函数，将输入流转换为 `Int` 列表。

```haskell
-- 读取输入流中的所有整数
readInts :: C.ByteString -> [Int]
readInts = map (fst . fromJust . C.readInt) . C.words
```

  * `C.words`: 按照空白字符（空格、换行）将 `ByteString` 切割成列表。
  * `C.readInt`: 尝试将 `ByteString` 转为 `(Int, ByteString)`。
  * `fromJust` & `fst`: 提取整数值。

## 3 通用竞赛模板 (The Template)

将上述逻辑封装，我们可以得到一个能够应对 95% 题目的模板。这个模板模拟了流式处理，将所有输入视为一个巨大的整数列表。

```haskell
import qualified Data.ByteString.Char8 as C
import Data.Maybe (fromJust)
import Data.List (foldl') -- 必须用严格折叠，防止爆栈

-- 1. 快速读取函数
readInt :: C.ByteString -> Int
readInt = fst . fromJust . C.readInt

-- 2. 核心逻辑入口
solve :: [Int] -> [String]
solve [] = []
solve (n:rest) = 
    -- 假设第一个数是 n，后面是数组
    let (xs, next) = splitAt n rest
        ans = sum xs -- 举例：求和
    in show ans : solve next -- 递归处理下一组数据（如果有）

-- 3. 主函数
main :: IO ()
main = do
    -- 读取所有输入，按空白切割
    input <- C.getContents
    let tokens = C.words input
        nums = map (fst . fromJust . C.readInt) tokens
    
    -- 将结果通过换行符连接并打印
    putStr . unlines $ solve nums
```

> **注意：** 在 Haskell 竞赛代码中，尽量使用 `foldl'` (strict fold) 而不是 `foldl`，以避免在大规模计算中出现 Thunk 堆积导致的 Stack Overflow。

## 4 实战模式：处理不同类型的输入

### 模式 A：单一输入，处理后输出 (A+B Problem)

输入只有两个数字 $a$ 和 $b$。

```haskell
main :: IO ()
main = do
    [a, b] <- map readInt . C.words <$> C.getContents
    print (a + b)
```

### 模式 B：第一行是 $T$ (测试用例数)，后续是 $T$ 组数据

这是 Codeforces 最常见的格式。我们可以利用 `splitAt` 来切割列表。

```haskell
main :: IO ()
main = do
    input <- C.getContents
    let (t:nums) = map (fst . fromJust . C.readInt) (C.words input)
    runCases t nums

runCases :: Int -> [Int] -> IO ()
runCases 0 _ = return ()
runCases t nums = do
    let n = head nums
        (currentCase, rest) = splitAt n (tail nums)
    -- 处理 currentCase
    print (sum currentCase) 
    runCases (t-1) rest
```

### 模式 C：交互式问题 (Interactive Problems)

对于交互式问题，由于需要每输出一行就刷新缓冲区，不能使用 `getContents`（它会等待 EOF）。需要使用 `System.IO`。

```haskell
import System.IO

main :: IO ()
main = do
    hSetBuffering stdout LineBuffering -- 设置行缓冲
    loop

loop :: IO ()
loop = do
    line <- getLine
    let x = read line :: Int
    print (x + 1) -- 自动 flush
    loop
```

## 5 高级技巧：使用 `Text.Printf` 和 `Builder`

如果输出非常巨大（例如输出 $10^6$ 个字符），`putStr . unlines` 可能会慢，因为它中间构建了庞大的 `String`。

更快的方案是使用 `Data.ByteString.Builder`：

```haskell
import qualified Data.ByteString.Builder as B
import System.IO (stdout)

-- 极速输出
main = do
   let result = B.intDec 123 <> B.char7 '' <> B.intDec 456
   B.hPutBuilder stdout result
```

-----

### 总结

1.  **拒绝 `String`**：始终引入 `Data.ByteString.Char8`。
2.  **输入流化**：将输入看作 `[Int]` 或 `[ByteString]` 的流，而不是按行读取。
3.  **惰性求值**：利用 Haskell 的惰性，写出来的代码像是在操作整个列表，实际上是流式处理。

你可以把上面的“通用模板”保存为你的 IDE 代码片段（Snippet），每次比赛开始时直接生成，只需专注于 `solve` 函数的逻辑即可。

祝你在 Codeforces 上用 Haskell 砍瓜切菜！

