#!/usr/bin/env python3
"""
生成 Haskell 99 题所有 pNN.md 模板文件。
每个文件包含 frontmatter 和函数签名骨架。
"""

import os
from datetime import datetime

BASE_DIR = "/home/rainboy/mycode/hugo-blog/content/blog/haskell-99"
DATE = "2026-07-11"

# 所有 99 题的完整数据
# (编号, 中文标题, 英文标题, 核心函数/模块, 难度)
PROBLEMS = [
    # === P01-P28: Lists ===
    (1,  "取列表最后一个元素",           "Last element of a list",                    "myLast",                     "★"),
    (2,  "取列表倒数第二个元素",         "Penultimate element of a list",             "myButLast",                  "★"),
    (3,  "取列表第 k 个元素",            "Indexed element in a list",                 "elementAt",                  "★"),
    (4,  "求列表长度",                   "Length of a list",                          "myLength",                   "★"),
    (5,  "反转列表",                     "Reverse a list",                            "myReverse",                  "★"),
    (6,  "判断回文",                     "Palindromes",                               "isPalindrome",               "★"),
    (7,  "展平嵌套列表",                 "Flatten a nested list structure",           "flatten / NestedList",       "★"),
    (8,  "去除连续重复元素",             "Eliminate duplicate elements in a list",    "compress",                   "★"),
    (9,  "将连续重复元素打包成子列表",   "Pack duplicates in a list",                 "pack",                       "★★"),
    (10, "游程编码",                     "Run-length encoding of a list",             "encode",                     "★★"),
    (11, "改进的游程编码",               "Modified run-length encoding",              "encodeModified / Encoding",  "★"),
    (12, "解码游程编码",                 "Decode a run-length encoded list",          "decodeModified",             "★"),
    (13, "直接实现游程编码",             "Direct run-length encoding of a list",      "encodeDirect",               "★★"),
    (14, "复制每个元素",                 "Duplicate elements in a list",              "dupli",                      "★"),
    (15, "每个元素重复 N 次",            "Replicate elements of a list",              "repli",                      "★"),
    (16, "每隔 N 个删除一个元素",        "Drop elements in a list",                   "dropEvery",                  "★★"),
    (17, "在 N 处切分列表",              "Split a list",                              "split",                      "★"),
    (18, "提取子列表",                   "Extract a slice from a list",               "slice",                      "★★"),
    (19, "旋转列表 N 位",                "Rotate a list",                             "rotate",                     "★★"),
    (20, "删除第 k 个元素",              "Remove element from a list",                "removeAt",                   "★"),
    (21, "在指定位置插入元素",           "Insert element into a list",                "insertAt",                   "★"),
    (22, "生成整数范围",                 "Range of integers",                         "range",                      "★"),
    (23, "从列表随机选 N 个元素",        "Select random elements from a list",        "randomSelect",               "★★★"),
    (24, "从 1..M 中随机选 N 个不同数",  "Draw random numbers",                       "randomDraw",                 "★★"),
    (25, "随机排列列表",                 "Random permutation of a list",              "randomPermute",              "★★★"),
    (26, "生成所有 N 选 K 的组合",       "Combinations",                              "combinations",               "★★★"),
    (27, "互斥分组",                     "Group into disjoint subsets",               "disjointGroups",             "★★★"),
    (28, "按子列表长度排序",             "Sorting a list of lists by length",         "lsort / lfsort",             "★★"),

    # === P29-P45: Arithmetic ===
    (29, "斐波那契数列",                 "Fibonacci numbers",                         "fibonacci",                  "★★"),
    (30, "矩阵快速幂求斐波那契",         "Fibonacci numbers with matrix exponentiation", "fibonacci'",               "★★★"),
    (31, "判断素数",                     "Primality checking",                        "isPrime",                    "★★"),
    (32, "最大公约数",                   "Greatest common divisor",                   "myGCD",                      "★"),
    (33, "互质判断",                     "Coprimality",                               "coprime",                    "★"),
    (34, "欧拉函数 φ(n)",                "Euler's totient function",                  "totient",                    "★★"),
    (35, "质因数分解",                   "List of prime factors",                     "primeFactors",               "★★"),
    (36, "质因数分解（含重数）",         "List of prime factors and multiplicities",  "primeFactorsMultiplicity",   "★★"),
    (37, "欧拉乘积公式求 φ(n)",          "Euler's totient with product formula",      "totient'",                   "★★"),
    (38, "高 totient 数",                "Highly totient numbers",                    "highlyTotientNumbers",       "★★★"),
    (39, "区间内素数列表",               "List of prime numbers in range",            "primesR",                    "★★"),
    (40, "无限素数列表",                 "List of prime numbers",                     "primes",                     "★★"),
    (41, "哥德巴赫猜想",                 "Goldbach's conjecture",                     "goldbach",                   "★"),
    (42, "哥德巴赫猜想列表",             "List of Goldbach pairs",                    "goldbachList",               "★"),
    (43, "模逆元",                       "Modular multiplicative inverse",            "multiplicativeInverse",      "★★★"),
    (44, "高斯整数整除",                 "Gaussian integer divisibility",             "gaussianDividesBy",          "★★★"),
    (45, "高斯素数",                     "Gaussian primes",                           "isGaussianPrime",            "★★★"),

    # === P46-P53: Logic and Codes ===
    (46, "逻辑表达式真值表",             "Truth tables for logical expressions",      "table",                      "★★"),
    (47, "通用逻辑门",                   "Universal logic gates",                     "evaluateCircuit / buildCircuit", "★★★"),
    (48, "n 元布尔函数真值表",           "Truth tables for n-ary boolean functions",  "tablen",                     "★★"),
    (49, "格雷码",                       "Gray codes",                                "gray",                       "★★"),
    (50, "霍夫曼编码",                   "Huffman codes",                             "huffman",                    "★★★"),
    (51, "纠错码",                       "Error correction codes",                    "errorCorrectingEncode / Decode", "★★★★"),
    (52, "合取范式",                     "Conjunctive normal form",                   "toConjunctiveNormalForm",    "★★★"),
    (53, "归结原理",                     "Resolution rule",                           "isTheorem",                  "★★★★"),

    # === P54-P69: Binary Trees ===
    (54, "二叉树定义",                   "Binary trees",                              "Tree data type",             "★"),
    (55, "构造完全平衡二叉树",           "Construct completely balanced binary trees","completelyBalancedTrees",    "★★"),
    (56, "对称二叉树",                   "Symmetric binary trees",                    "symmetric",                  "★★"),
    (57, "二叉搜索树",                   "Binary search trees",                       "construct",                  "★★"),
    (58, "对称且完全平衡的二叉树",       "Symmetric and completely balanced trees",   "symmetricBalancedTrees",     "★★★"),
    (59, "构造高度平衡二叉树",           "Construct height-balanced binary trees",    "heightBalancedTrees",        "★★★"),
    (60, "给定节点数的高度平衡二叉树",   "Height-balanced trees with given nodes",    "heightBalancedTreesWithNodes", "★★★"),
    (61, "收集二叉树的叶子节点",         "Collect leaves of a binary tree",           "leaves",                     "★★"),
    (62, "收集二叉树指定层的节点",       "Collect nodes at a given level",            "atLevel",                    "★★"),
    (63, "构造完全二叉树",               "Construct a complete binary tree",          "completeBinaryTree",         "★★★"),
    (64, "二叉树布局：中序排列",         "Binary tree layout; in-order",              "layoutInorder",              "★★★"),
    (65, "二叉树布局：层级等距",         "Binary tree layout; constant distance",     "layoutLevelConstant",        "★★★"),
    (66, "二叉树布局：紧凑排列",         "Binary tree layout; compact",               "layoutCompact",              "★★★"),
    (67, "二叉树的字符串表示",           "A string representation of binary trees",   "treeToString / stringToTree","★★"),
    (68, "二叉树的中序和前序序列",       "In-order and pre-order sequences",          "inorder / preorder / ordersToTree", "★★"),
    (69, "二叉树的点串表示",             "Dotstring representation of binary trees",  "dotstringToTree / treeToDotstring", "★★"),

    # === P70-P73: Multiway Trees ===
    (70, "从节点字符串构造树",           "Tree construction from a node string",      "MultiwayTree",               "★★"),
    (71, "树的内部路径长度",             "Internal path length of a tree",            "internalPathLength",         "★★"),
    (72, "树的后序遍历",                 "Post-order sequence of a tree",             "postorder",                  "★★"),
    (73, "树的 S 表达式表示",            "Tree representation with s-expressions",    "treeToSExpression",          "★★★"),

    # === P74-P79: Monads ===
    (74, "不用 do 记法的 IO monad",      "IO monad without do notation",              "ioMonad",                    "★★★"),
    (75, "Maybe monad",                  "Maybe monad",                               "maybeMonad",                 "★★"),
    (76, "Either monad",                 "Either monad",                              "eitherMonad",                "★★"),
    (77, "List monad",                   "List monad",                                "listMonad",                  "★★"),
    (78, "Collatz 猜想",                 "Collatz conjecture",                        "collatz",                    "★★"),
    (79, "后缀表达式",                   "Postfix notation",                          "postfix",                    "★★★"),

    # === P80-P89: Graphs ===
    (80, "图的表示转换",                 "Converting between graph representations",  "Graph conversion",           "★★"),
    (81, "两点间所有路径",               "Paths between vertexes",                    "paths",                      "★★★"),
    (82, "包含指定顶点的环",             "Cycles with a given vertex",                "cycles",                     "★★★"),
    (83, "构造生成树",                   "Construct spanning trees",                  "spanningTrees",              "★★★"),
    (84, "构造最小生成树",               "Construct minimum spanning tree",           "minimumSpanningTree",        "★★★"),
    (85, "图同构",                       "Graph isomorphism",                         "graphIsomorphism",           "★★★★★"),
    (86, "图着色",                       "Graph coloring",                            "graphColoring",              "★★★"),
    (87, "深度优先遍历",                 "Depth-first graph traversal",               "depthFirst",                 "★★"),
    (88, "连通分量",                     "Connected components",                      "connectedComponents",        "★★"),
    (89, "二分图",                       "Bipartite graphs",                          "bipartite",                  "★★"),

    # === P90-P99: Miscellaneous ===
    (90, "n 皇后问题",                   "n queens problem",                          "queens",                     "★★★"),
    (91, "骑士巡游",                     "Knight's tour",                             "knightsTour",                "★★★"),
    (92, "优雅树标记",                   "Graceful tree labeling",                    "gracefulTree",               "★★★★"),
    (93, "算术谜题",                     "An arithmetic puzzle",                      "arithmeticPuzzle",           "★★★★"),
    (94, "正则图",                       "Regular graphs",                            "regularGraphs",              "★★★★"),
    (95, "英文数字单词",                 "English number words",                      "fullWords",                  "★★"),
    (96, "语法检查",                     "Syntax checking",                           "isIdentifier",               "★★"),
    (97, "数独",                         "Sudoku",                                    "sudoku",                     "★★★"),
    (98, "数织游戏",                     "Nonograms",                                 "nonogram",                   "★★★★"),
    (99, "填字游戏",                     "Crossword puzzles",                         "solveCrossword",             "★★★★"),
]

TEMPLATE = """---
title: "P{num:02d} - {cn_title}"
date: {date}
draft: true
toc: true
tags: ["Haskell", "99题", "{section}"]
---

# P{num:02d} - {cn_title}

> {en_title}
>
> 官方模块: `Problems.P{num:02d}`
> 核心函数: `{func}`

## 题目描述

{description}

## 函数签名

```haskell
```

## 思路

## 实现

```haskell
```

## 测试

```haskell
-- >>> 
```

## 参考

- [官方文档](https://ninetynine.haskell.chungyc.org/Problems-P{num:02d}.html)
"""

# 为每组问题准备描述
DESCRIPTIONS = {}

# P01-P28: Lists
DESCRIPTIONS.update({i: "这是列表类问题中的一道基础题。" for i in range(1, 29)})
DESCRIPTIONS[1] = "找出列表的最后一个元素。如果列表为空，返回 `Nothing`。"
DESCRIPTIONS[2] = "找出列表的倒数第二个元素。如果列表不足两个元素，返回 `Nothing`。"
DESCRIPTIONS[3] = "找出列表的第 k 个元素（1-based indexing）。如果下标越界，返回 `Nothing`。"
DESCRIPTIONS[4] = "求列表的长度，即列表中元素的个数。"
DESCRIPTIONS[5] = "反转列表，将列表中的元素顺序颠倒。"
DESCRIPTIONS[6] = "判断一个列表是否为回文，即正着读和反着读相同。"
DESCRIPTIONS[7] = "展平一个嵌套列表结构。需要自定义 `NestedList` 数据类型：可以是单个元素 `Elem a` 或子列表 `List [NestedList a]`。"
DESCRIPTIONS[8] = "去除列表中连续重复的元素，只保留一个。"
DESCRIPTIONS[9] = "将列表中连续重复的元素打包成子列表。"
DESCRIPTIONS[10] = "实现游程编码（run-length encoding）：将连续重复的元素编码为 (元素, 出现次数) 元组。"
DESCRIPTIONS[11] = "改进的游程编码：用自定义 `Encoding` 类型表示，`Single a` 表示只出现一次的元素，`Multiple n a` 表示出现 n 次的元素。"
DESCRIPTIONS[12] = "解码游程编码后的列表，将 `Encoding` 恢复为原始列表。"
DESCRIPTIONS[13] = "直接实现游程编码，不借助中间的 `pack` 步骤，边遍历边计数。"
DESCRIPTIONS[14] = "将列表中的每个元素复制一份。"
DESCRIPTIONS[15] = "将列表中的每个元素重复 N 次。"
DESCRIPTIONS[16] = "删除列表中每隔 N 个的元素。"
DESCRIPTIONS[17] = "在指定的索引 N 处将列表切分为两个子列表。"
DESCRIPTIONS[18] = "提取列表的一个子列表，从索引 i 到 k（包含两端）。"
DESCRIPTIONS[19] = "将列表向左旋转 N 位（N 为负数时向右旋转）。"
DESCRIPTIONS[20] = "删除列表中第 k 个元素，返回被删除的元素和剩余列表。"
DESCRIPTIONS[21] = "在列表的指定位置插入一个元素。"
DESCRIPTIONS[22] = "生成两个整数之间的所有整数组成的列表。"
DESCRIPTIONS[23] = "从列表中随机选择 N 个不重复的元素。需要处理随机数生成器。"
DESCRIPTIONS[24] = "从 1 到 M 的整数中随机选出 N 个不同的数。"
DESCRIPTIONS[25] = "随机排列列表中的元素（Fisher-Yates 洗牌算法）。"
DESCRIPTIONS[26] = "生成从列表中选取 K 个元素的所有组合。"
DESCRIPTIONS[27] = "将列表分成指定大小的互斥子组。"
DESCRIPTIONS[28] = "按子列表的长度对列表的列表进行排序，以及按出现频率排序。"

# P29-P45: Arithmetic
DESCRIPTIONS.update({i: "这是数论类问题中的一道题。" for i in range(29, 46)})
DESCRIPTIONS[29] = "计算第 n 个斐波那契数。"
DESCRIPTIONS[30] = "用矩阵快速幂方法计算第 n 个斐波那契数，效率为 O(log n)。"
DESCRIPTIONS[31] = "判断一个数是否为素数。"
DESCRIPTIONS[32] = "计算两个数的最大公约数（GCD）。"
DESCRIPTIONS[33] = "判断两个数是否互质（最大公约数为 1）。"
DESCRIPTIONS[34] = "计算欧拉函数 φ(n)：小于等于 n 且与 n 互质的正整数个数。"
DESCRIPTIONS[35] = "将一个正整数分解为质因数的列表。"
DESCRIPTIONS[36] = "将正整数分解为质因数及其重数的列表。"
DESCRIPTIONS[37] = "利用欧拉乘积公式计算欧拉函数 φ(n)，基于质因数分解结果。"
DESCRIPTIONS[38] = "找出高 totient 数：使得 φ(m) ≥ φ(k) 对所有 k < m 成立的正整数 m。"
DESCRIPTIONS[39] = "生成指定区间 [a, b] 内的所有素数。"
DESCRIPTIONS[40] = "生成无限素数列表（惰性求值，埃拉托色尼筛法）。"
DESCRIPTIONS[41] = "验证哥德巴赫猜想：每个大于 2 的偶数可以表示为两个素数之和。"
DESCRIPTIONS[42] = "列出指定范围内所有偶数的哥德巴赫分解。"
DESCRIPTIONS[43] = "计算模 n 下 a 的乘法逆元，如果不存在则返回 `Nothing`。"
DESCRIPTIONS[44] = "判断高斯整数是否整除另一个高斯整数。"
DESCRIPTIONS[45] = "判断一个高斯整数是否为高斯素数，并尝试用平方和定理进行判断。"

# P46-P53: Logic and Codes
DESCRIPTIONS.update({i: "这是逻辑与编码类问题。" for i in range(46, 54)})
DESCRIPTIONS[46] = "生成两个变量的逻辑表达式的真值表。"
DESCRIPTIONS[47] = "判断一组通用逻辑门是否可以构成某个布尔函数。"
DESCRIPTIONS[48] = "生成 n 个变量的布尔函数的真值表。"
DESCRIPTIONS[49] = "生成 n 位的格雷码序列，相邻两个码字只有一位不同。"
DESCRIPTIONS[50] = "实现霍夫曼编码，给定字符及其频率，生成最优前缀码。"
DESCRIPTIONS[51] = "实现纠错码的编码和解码功能。"
DESCRIPTIONS[52] = "将命题逻辑公式转换为合取范式（CNF）。"
DESCRIPTIONS[53] = "用归结原理判断一组公式能否推出一个结论。"

# P54-P69: Binary Trees
DESCRIPTIONS.update({i: "这是二叉树类问题。" for i in range(54, 70)})
DESCRIPTIONS[54] = "定义二叉树的数据类型 `Tree a`，包含空树 `Empty` 和分支 `Branch a (Tree a) (Tree a)`。"
DESCRIPTIONS[55] = "构造所有 N 个节点的完全平衡二叉树。"
DESCRIPTIONS[56] = "判断一棵二叉树是否对称（左右子树互为镜像）。"
DESCRIPTIONS[57] = "从列表构造二叉搜索树（BST）。"
DESCRIPTIONS[58] = "构造所有对称且完全平衡的二叉树。"
DESCRIPTIONS[59] = "构造所有高度为 H 的高度平衡二叉树。"
DESCRIPTIONS[60] = "构造所有具有 N 个节点的高度平衡二叉树。"
DESCRIPTIONS[61] = "收集二叉树的所有叶子节点。"
DESCRIPTIONS[62] = "收集二叉树中指定层的所有节点。"
DESCRIPTIONS[63] = "构造一棵 N 个节点的完全二叉树。"
DESCRIPTIONS[64] = "二叉树布局：按中序遍历顺序分配坐标。"
DESCRIPTIONS[65] = "二叉树布局：同一层的节点间距恒定。"
DESCRIPTIONS[66] = "二叉树布局：紧凑排列，尽可能缩小宽度。"
DESCRIPTIONS[67] = "二叉树的字符串表示与反序列化。"
DESCRIPTIONS[68] = "根据二叉树的中序和前序遍历序列重建二叉树。"
DESCRIPTIONS[69] = "二叉树的点串（dotstring）表示与反序列化。"

# P70-P73: Multiway Trees
DESCRIPTIONS.update({i: "这是多路树（Multiway Tree）类问题。" for i in range(70, 74)})
DESCRIPTIONS[70] = "从节点字符串构造多路树。例如 `'a(b,c(d,e),f)'` 形式的字符串。"
DESCRIPTIONS[71] = "计算树的内部路径长度（所有内部节点到根的距离之和）。"
DESCRIPTIONS[72] = "输出树的后序遍历序列。"
DESCRIPTIONS[73] = "用 S 表达式表示多路树。"

# P74-P79: Monads
DESCRIPTIONS.update({i: "这是 Monad 类问题。" for i in range(74, 80)})
DESCRIPTIONS[74] = "不用 `do` 记法，直接用 `>>=` 和 `>>` 写出 IO 操作。"
DESCRIPTIONS[75] = "练习 `Maybe` monad 的使用，处理可选值。"
DESCRIPTIONS[76] = "练习 `Either` monad 的使用，处理可能出错的计算。"
DESCRIPTIONS[77] = "练习 `List` monad 的使用（非确定性计算）。"
DESCRIPTIONS[78] = "验证 Collatz 猜想：任何正整数反复执行「偶数除以 2，奇数乘以 3 加 1」最终都会到达 1。"
DESCRIPTIONS[79] = "解析并计算后缀表达式（逆波兰表示法）。"

# P80-P89: Graphs
DESCRIPTIONS.update({i: "这是图论类问题。" for i in range(80, 90)})
DESCRIPTIONS[80] = "在图的不同表示法之间转换：邻接表、边列表、邻接矩阵等。"
DESCRIPTIONS[81] = "找出图中两个顶点之间的所有路径。"
DESCRIPTIONS[82] = "找出图中包含指定顶点的所有环。"
DESCRIPTIONS[83] = "构造图的所有生成树。"
DESCRIPTIONS[84] = "构造图的最小生成树（Prim 算法）。"
DESCRIPTIONS[85] = "判断两个图是否同构。"
DESCRIPTIONS[86] = "用尽可能少的颜色给图的顶点着色，使得相邻顶点颜色不同。"
DESCRIPTIONS[87] = "对图进行深度优先遍历。"
DESCRIPTIONS[88] = "找出图的所有连通分量。"
DESCRIPTIONS[89] = "判断一个图是否为二分图。"

# P90-P99: Miscellaneous
DESCRIPTIONS.update({i: "这是综合类问题。" for i in range(90, 100)})
DESCRIPTIONS[90] = "求解 n 皇后问题：在 n×n 棋盘上放置 n 个皇后，使得它们互不攻击。"
DESCRIPTIONS[91] = "求解骑士巡游问题：骑士在 N×N 棋盘上每格恰好访问一次。"
DESCRIPTIONS[92] = "为树找到优雅标记（graceful labeling），满足每条边的标签差唯一。"
DESCRIPTIONS[93] = "给定一组数，插入算术运算符使等式成立。"
DESCRIPTIONS[94] = "生成所有 N 个顶点的 k-正则图（每个顶点度数为 k）。"
DESCRIPTIONS[95] = "将非负整数转换为英文单词表示（如 175 → \"one-seven-five\"）。"
DESCRIPTIONS[96] = "检查一个字符串是否为合法的标识符（Ada 语法规则）。"
DESCRIPTIONS[97] = "求解数独谜题（9×9 棋盘）。"
DESCRIPTIONS[98] = "求解数织游戏（Nonogram）谜题。"
DESCRIPTIONS[99] = "求解填字游戏（Crossword puzzle）。"

SECTION_MAP = {}
for i in range(1, 29):
    SECTION_MAP[i] = "列表"
for i in range(29, 46):
    SECTION_MAP[i] = "数论"
for i in range(46, 54):
    SECTION_MAP[i] = "逻辑与编码"
for i in range(54, 70):
    SECTION_MAP[i] = "二叉树"
for i in range(70, 74):
    SECTION_MAP[i] = "多路树"
for i in range(74, 80):
    SECTION_MAP[i] = "Monad"
for i in range(80, 90):
    SECTION_MAP[i] = "图"
for i in range(90, 100):
    SECTION_MAP[i] = "综合"


def generate_problem_files():
    """生成所有 99 个 pNN.md 文件"""
    for num, cn_title, en_title, func, difficulty in PROBLEMS:
        section = SECTION_MAP[num]
        desc = DESCRIPTIONS[num]
        content = TEMPLATE.format(
            num=num,
            cn_title=cn_title,
            en_title=en_title,
            func=func,
            date=DATE,
            section=section,
            description=desc,
        )
        filename = f"p{num:02d}.md"
        filepath = os.path.join(BASE_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\n")
        print(f"✅ Created {filename}")


if __name__ == "__main__":
    generate_problem_files()
    print(f"\n🎉 All 99 problem files generated in {BASE_DIR}")
