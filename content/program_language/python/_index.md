---
title: "Python"
noList: true
---

这里整理面向算法竞赛和小数据验证的 Python 笔记。默认读者熟悉 C++，文章重点放在如何快速表达数据、状态和枚举过程。

## 内容

1. [用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)：点对、区间、子集、排列、回溯、BFS 和记忆化等常见验证模型。
2. [Python 暴力代码大模板](./brute_force_template.md)：输入输出、常用导入、枚举、DFS、BFS 和辅助函数集中在一个可复制文件中。
3. [Python 竞赛输入输出与字符串处理](./input_output_and_strings.md)：读取整数和字符串、按 token 解析、格式化输出。
4. [Python OJ 输入输出速查](./oj_input_output_cheatsheet.md)：按常见题面格式查找可直接套用的输入输出代码，并解释每种写法。
5. [Python 切片位置记忆法](./slicing_positions.md)：把切片数字看成元素之间的切割线，快速理解前缀、后缀和半开区间。
6. [Python 排序与顺序验证](./sorting_and_ordering.md)：`sorted`、`key`、多关键字排序，以及用全排列验证排序贪心。
7. [Python 竞赛常用容器](./collections_toolkit.md)：`Counter`、`defaultdict`、`deque`、`dict` 和 `set`。
8. [Python 生成器表达式](./generator_expression.md)：惰性计算、一次性消费以及 `any`、`all`、`next` 的短路。
9. [Python itertools 实用组合](./itertools_recipes.md)：`pairwise`、`accumulate`、`chain`、`repeat` 和 `zip_longest`。
10. [用 Python 生成可复现的随机测试数据](./random_test_data.md)：固定种子、随机数组、排列、区间、树和简单图。
11. [Python 验证代码中的常用数学工具](./math_tools.md)：整数平方根、最大公约数、浮点比较和精确分数。
12. [Python 函数式编程三剑客：map、filter 与 reduce](./map_reduce_filter.md)：深入理解高阶函数思想以及在数据聚合与映射中的应用。
13. [把 Haskell 的思考方式带到 Python OJ](./haskell_style_thinking_in_python.md)：用 pattern、guard 和 pipe 先分类与串联思路，再落地为适合 Python 提交的实现。
14. [Python flow：快速搭建 OJ 思路原型与随机验证](./flow_oj_prototyping.md)：用轻量数据流组织原型、短路状态、追踪中间值，并通过暴力随机差分寻找反例。
15. [C++ 选手转 Python 竞赛的 4 个血泪坑点](./cpp_to_python_pitfalls.md)：浅拷贝灾难、回溯存答案为空、闭包赋值报错与性能陷阱。
16. [Python 组合数学神器：有放回的组合与隔板法](./combinations_with_replacement.md)：利用 `combinations_with_replacement` 秒杀无限背包暴力与非严格递增序列构造。
17. [Python 暴力验证：含有重复元素的全排列去重](./unique_permutations.md)：原理解析 `unique_permutations` 及其核心的同级枝剪算法。
18. [组合去重的核心哲学：有序唯一性](./ordered_uniqueness.md)：从算法“术”到数学“道”，一统组合 DFS 与去重排列的底层思想。
19. [Python 隐式图 BFS 最短路径模板](./bfs_shortest.md)：通用 `bfs_shortest` 函数在数轴、网格迷宫、八数码与单词接龙中的用法。
20. [Python 子集和判定：记忆化 DFS 与 @cache](./subset_sum_exists.md)：暴力指数级搜索加上缓存，和 C++ 全局数组记忆化一一对照。
21. [Python 竞赛中的字典经典用法](./dict_usage.md)：dict、defaultdict、Counter 三件套覆盖竞赛 30% 的数据结构需求。
22. [Python 解包操作符 * 和 **：写更少做更多](./unpacking_operator.md)：扩展解包、合并列表、矩阵转置、合并字典。

## 学习资源

- [Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html)：Python 官方文档中的函数式编程指南。
