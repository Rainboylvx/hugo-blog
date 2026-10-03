---
title: "Python"
noList: true
---

这里整理面向算法竞赛和小数据验证的 Python 笔记。默认读者熟悉 C++，文章重点放在如何快速表达数据、状态和枚举过程。

## 内容

1. [pudb 与 pdbpp：像 cgdb 那样调试 Python](./pudb-and-pdbpp.md)：pudb 全屏 TUI 的四种入口、真实键位表、条件断点与崩溃现场，以及 pdbpp 劫持 `pdb` 的 `.pth` 机制和 AUR/venv 安装踩坑清单。
2. [Pythonic 代码去哪里练：题库、点评与 lint 闭环](./pythonic-practice.md)：三类能给出风格反馈的练习场、`ruff --select C4,SIM,PERF,PIE,FURB` 工具闭环、同题两语言的翻译练法，以及交付前的 10 条结构级自检表。
3. [Python Protocol 使用教程：从鸭子类型到依赖解耦](./typing_protocol.md)：结构化子类型的写法、`@runtime_checkable` 的三个坑、泛型 Protocol，以及如何用它给存储层解耦。
4. [从课程报名例子理解 Python 四层架构](./registration-layered-architecture.md)：从报名规则出发，拆分 domain、service、db、api，并运行 SQLite 与 FastAPI 示例。
5. [Python 算法思路快速验证指南：全武器库与四层验证法](./rapid_prototyping_toolkit.md)：内置语法糖、标准库黑魔法、调试对拍与本地第三方库（SymPy、NetworkX、Z3）。
6. [Python 比赛实战：字符串子串匹配（内置方法、正则与手速版 KMP）](./string_matching_kmp.md)：`s.find()`、正则前瞻断言 `(?=...)` 查找所有匹配，以及 15 行极简 KMP 模板。
7. [Python set：哈希集合的核心操作与竞赛用法](./set_toolkit.md)：创建盲区、交并差、增删、`frozenset`，以及 $O(1)$ 查找带来的复杂度降维。
8. [Python 函数传参：对象引用绑定与参数排布](./function_arguments.md)：位置/关键字、默认参数陷阱、`*args/**kwargs`、`/` 与 `*`，以及对象引用传递。
9. [Python functools.partial](./functools_partial.md)：预先绑定位置参数或关键字参数，把通用函数快速配置成新的可调用对象。
10. [Python flow：快速搭建 OJ 思路原型与随机验证](./flow_oj_prototyping.md)：用轻量数据流组织原型、短路状态、追踪中间值，并通过暴力随机差分寻找反例。
11. [把 Haskell 的思考方式带到 Python OJ](./haskell_style_thinking_in_python.md)：用 pattern、guard 和 pipe 先分类与串联思路，再落地为适合 Python 提交的实现。
12. [Python 切片位置记忆法](./slicing_positions.md)：把切片数字看成元素之间的切割线，快速理解前缀、后缀和半开区间。
13. [Python 解包操作符 * 和 **：写更少做更多](./unpacking_operator.md)：扩展解包、合并列表、矩阵转置、合并字典。
14. [Python 竞赛中的字典经典用法](./dict_usage.md)：dict、defaultdict、Counter 三件套覆盖竞赛 30% 的数据结构需求。
15. [Python 子集和判定：记忆化 DFS 与 @cache](./subset_sum_exists.md)：暴力指数级搜索加上缓存，和 C++ 全局数组记忆化一一对照。
16. [Python 隐式图 BFS 最短路径模板](./bfs_shortest.md)：通用 `bfs_shortest` 函数在数轴、网格迷宫、八数码与单词接龙中的用法。
17. [组合去重的核心哲学：有序唯一性](./ordered_uniqueness.md)：从算法“术”到数学“道”，一统组合 DFS 与去重排列的底层思想。
18. [Python 暴力验证：含有重复元素的全排列去重](./unique_permutations.md)：原理解析 `unique_permutations` 及其核心的同级枝剪算法。
19. [Python 组合数学神器：有放回的组合与隔板法](./combinations_with_replacement.md)：利用 `combinations_with_replacement` 秒杀无限背包暴力与非严格递增序列构造。
20. [C++ 选手转 Python 竞赛的 4 个血泪坑点](./cpp_to_python_pitfalls.md)：浅拷贝灾难、回溯存答案为空、闭包赋值报错与性能陷阱。
21. [Python 函数式编程三剑客：map、filter 与 reduce](./map_reduce_filter.md)：深入理解高阶函数思想以及在数据聚合与映射中的应用。
22. [Python OJ 输入输出速查](./oj_input_output_cheatsheet.md)：按常见题面格式查找可直接套用的输入输出代码，并解释每种写法。
23. [Python 竞赛输入输出与字符串处理](./input_output_and_strings.md)：读取整数和字符串、按 token 解析、格式化输出。
24. [用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)：点对、区间、子集、排列、回溯、BFS 和记忆化等常见验证模型。
25. [Python 暴力代码大模板](./brute_force_template.md)：输入输出、常用导入、枚举、DFS、BFS 和辅助函数集中在一个可复制文件中。
26. [Python 验证代码中的常用数学工具](./math_tools.md)：整数平方根、最大公约数、浮点比较和精确分数。
27. [Python itertools 实用组合](./itertools_recipes.md)：`pairwise`、`accumulate`、`chain`、`repeat` 和 `zip_longest`。
28. [用 Python 生成可复现的随机测试数据](./random_test_data.md)：固定种子、随机数组、排列、区间、树和简单图。
29. [Python 排序与顺序验证](./sorting_and_ordering.md)：`sorted`、`key`、多关键字排序，以及用全排列验证排序贪心。
30. [Python 竞赛常用容器](./collections_toolkit.md)：`Counter`、`defaultdict`、`deque`、`dict` 和 `set`。
31. [Python 生成器表达式](./generator_expression.md)：惰性计算、一次性消费以及 `any`、`all`、`next` 的短路。

32. [Python functools 竞赛核心速览](./functools_competition.md)：记忆化缓存、多组数据隔离、拼接排序、折叠与参数绑定，附数字三角形完整例题。

33. [Python 竞赛实用技巧速查](./competition_cheatsheet.md)：输入输出、堆、二分与离散化、位运算、递归和标准库版本避坑。

## 学习资源

- [Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html)：Python 官方文档中的函数式编程指南。
