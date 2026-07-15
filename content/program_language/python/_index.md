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
5. [Python 排序与顺序验证](./sorting_and_ordering.md)：`sorted`、`key`、多关键字排序，以及用全排列验证排序贪心。
6. [Python 竞赛常用容器](./collections_toolkit.md)：`Counter`、`defaultdict`、`deque`、`dict` 和 `set`。
7. [Python 生成器表达式](./generator_expression.md)：惰性计算、一次性消费以及 `any`、`all`、`next` 的短路。
8. [Python itertools 实用组合](./itertools_recipes.md)：`pairwise`、`accumulate`、`chain`、`repeat` 和 `zip_longest`。
9. [用 Python 生成可复现的随机测试数据](./random_test_data.md)：固定种子、随机数组、排列、区间、树和简单图。
10. [Python 验证代码中的常用数学工具](./math_tools.md)：整数平方根、最大公约数、浮点比较和精确分数。
11. [Python 函数式编程三剑客：map、filter 与 reduce](./map_reduce_filter.md)：深入理解高阶函数思想以及在数据聚合与映射中的应用。
12. [C++ 选手转 Python 竞赛的 4 个血泪坑点](./cpp_to_python_pitfalls.md)：浅拷贝灾难、回溯存答案为空、闭包赋值报错与性能陷阱。
