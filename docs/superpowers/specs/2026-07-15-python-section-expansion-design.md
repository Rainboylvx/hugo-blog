# Python 栏目迁移与扩充设计

## 背景

现有文章 `content/blog/python_stress_test.md` 已经完整讲解如何用 Python 编写算法暴力验证程序，但它位于普通博客目录，不利于继续积累 Python 学习笔记。当前工作区已经由用户创建 `content/program_language/python/_index.md`、`generator_expression.md`，并在 `content/_index.md` 中加入 Python 栏目入口。

本次工作把暴力验证文章完整迁移到 Python 栏目，不拆分其正文；此前评审发现的输入输出、排序、容器、随机生成、数学工具和补充迭代器知识，分别写成独立文章。栏目形成可按主题复查的 Python 竞赛工具集，而不是把主文章扩写成标准库百科。

## 方案选择

### 方案一：合并成少量长文

将缺失内容合并为两到三篇长文。文件较少，但输入输出、随机生成和数据结构等主题混在一起，不便于以后定位。

### 方案二：按用途拆分（采用）

每篇文章解决一个明确问题，保持适中的内容长度。主文章负责暴力模型，各补充文章负责可复用的 Python 工具，通过栏目页和正文链接建立关系。

### 方案三：每个模块或函数独立成文

检索粒度最细，但会产生大量短文，重复解释导入、示例背景和适用场景，栏目过于零散。

## 目标读者与写作原则

- 读者熟悉 C++ 和算法竞赛，但 Python 经验较少。
- 每个 Python 特性都用 C++ 中熟悉的概念或具体竞赛任务解释。
- 示例以可运行、可复制、容易检查为第一目标。
- 不追求覆盖标准库全部 API，只选择能明显降低验证代码编写成本的内容。
- 每篇文章既能独立阅读，也通过相对链接连接主文章和相关主题。

## 目录结构

实施后的目录为：

```text
content/program_language/python/
├── _index.md
├── brute_force_validation.md
├── generator_expression.md
├── input_output_and_strings.md
├── sorting_and_ordering.md
├── collections_toolkit.md
├── random_test_data.md
├── math_tools.md
└── itertools_recipes.md
```

`content/blog/python_stress_test.md` 在迁移后删除，由 Git 记录文件移动关系。

## 主文章迁移

### 文件与内容

- 将 `content/blog/python_stress_test.md` 移动为 `content/program_language/python/brute_force_validation.md`。
- 保留完整正文、标题、日期、草稿状态和现有示例，不将章节拆到其他文件。
- 在介绍生成器、容器、随机数和数学工具的位置增加简短的“延伸阅读”相对链接，但不删除原有的必要解释，保证主文章仍可独立阅读。

### 旧 URL 兼容

站点启用了 `uglyURLs: true`，原文章地址为 `/blog/python_stress_test.html`。迁移后在 front matter 增加：

```yaml
aliases:
  - /blog/python_stress_test.html
```

构建后检查 `public/blog/python_stress_test.html` 存在，并指向新文章地址。

## 现有生成器文章

保留用户已经创建的 `generator_expression.md`，调整为当前栏目风格：

- 保留列表推导式与生成器表达式对比、惰性求值、`next`、`any` 和 `all`。
- 将“始终首选生成器”等绝对说法改为基于使用场景的判断。
- 将“一千万范围所以时间复杂度约等于 $O(1)$”修正为：该具体输入会在第二个元素处短路，但最坏情况仍为 $O(n)$。
- 删除过度修辞，保留直接、学习导向的技术说明。
- 为主要示例增加断言，使代码块能够独立执行。

## 新文章设计

### `input_output_and_strings.md`

解决“怎样把验证函数快速变成可执行程序”：

- `input()`、`sys.stdin.buffer.readline` 和去除行尾换行。
- `split`、`map`、`list`、多变量解包。
- `print(*a)`、`sep`、`end` 和构造多行输出。
- 字符串索引、切片、`join`、`replace`、`startswith`、`isdigit`。
- 单组数据、多组数据、整份输入按 token 读取的模板。
- 说明验证代码通常数据较小，不需要无条件使用复杂快读模板。

### `sorting_and_ordering.md`

解决“怎样快速尝试和验证不同顺序”：

- `sorted` 返回新列表，`list.sort` 原地修改。
- 默认升序、`reverse=True`。
- `key=lambda ...`、元组键和多关键字排序。
- 元组、字符串和列表的字典序。
- `operator.itemgetter` 作为可选写法。
- 用全排列暴力验证某个排序贪心的小例子。
- 提醒不要误写比较函数；确实需要时介绍 `cmp_to_key` 的适用边界。

### `collections_toolkit.md`

解决“怎样计数、分组、判重和维护 BFS 队列”：

- 普通 `dict`、`dict.get` 和成员判断。
- `Counter` 的计数、频率比较、多重集合相等和加减运算。
- `defaultdict(list/int/set)` 的分组与邻接表。
- `deque` 的 `append`、`appendleft`、`pop`、`popleft`。
- `set` 与可哈希状态，列表转元组。
- 使用 `Counter` 验证输出排列、使用 `defaultdict` 分组的完整例子。

### `random_test_data.md`

解决“怎样生成可复现且有针对性的小数据”：

- 使用独立的 `random.Random(seed)`，避免依赖全局随机状态。
- `randint`、`randrange`、`choice`、`choices`、`sample`、`shuffle`。
- 允许重复与不允许重复的区别，原地修改与返回新值的区别。
- 固定种子、打印失败用例和稳定重放。
- 将均匀随机与空数组、极值、重复值、有序、逆序等手工边界结合。
- 生成排列、区间、树和简单图时如何保持输入合法。

### `math_tools.md`

解决“怎样避免重复实现常见数学与精度工具”：

- 内置 `abs`、`pow`、`divmod`。
- `math.gcd`、`lcm`、`isqrt`、`inf`。
- 为什么整数判平方应优先使用 `isqrt`，避免浮点舍入。
- 使用 `math.isclose` 比较浮点结果，并说明相对误差和绝对误差。
- 使用 `fractions.Fraction` 验证有理数结果。
- 每个工具都配一个竞赛相关的短例子，不扩写成数论教程。

### `itertools_recipes.md`

补充主文章没有覆盖的迭代器组合工具：

- `pairwise`：相邻元素。
- `accumulate`：前缀聚合，重点示例为前缀和。
- `chain`：连接多个可迭代对象。
- `repeat`：重复值或与 `map` 配合。
- `zip_longest`：不同长度序列的并行遍历。
- 简短回顾并链接主文章的 `product`、`permutations`、`combinations`。
- 标注 `pairwise` 需要 Python 3.10；低版本使用 `zip(a, a[1:])`。

## 栏目页与导航

`content/program_language/python/_index.md` 使用 `noList: true`，主动维护学习顺序：

1. 暴力验证主文章。
2. 输入输出与字符串。
3. 排序与顺序。
4. 常用容器。
5. 生成器表达式。
6. itertools 组合工具。
7. 随机测试数据。
8. 数学工具。

栏目页为每篇文章增加一句用途说明，帮助读者选择阅读入口。保留用户已加入 `content/_index.md` 的 Python 首页入口，不改动其他首页分类。

## Front Matter 与链接规则

- 新文章使用日期 `2026-07-15`、`draft: true`、`toc: true`。
- 标签以 `Python`、`算法竞赛` 为主，只有语法专题才加入 `语法`，不批量堆叠标签。
- 文件间使用相对 Markdown 链接，例如 `[生成器表达式](./generator_expression.md)`。
- 引用优先使用 Python 官方中文文档；无法读取的知乎页面只作为用户提供的延伸链接，不声称已逐段引用其内容。

## 验证策略

### Python 示例

- 提取每篇文章的 `python` 代码块并使用本机 `python3` 执行。
- 主要示例使用 `assert` 验证结果，不依赖人工观察输出。
- 输入输出示例允许使用模拟标准输入，避免验证时等待交互。
- 随机示例使用固定种子，确保测试可复现。
- 检查 Python 版本相关 API，并在正文提供兼容说明。

### 内容与链接

- 检查 `_index.md` 中的每个相对链接都对应真实文件。
- 检查主文章和补充文章之间没有循环式重复说明，链接名称与文章标题一致。
- 检查所有代码围栏闭合、语言标记正确、没有 `TODO` 或省略核心逻辑。
- 检查旧文章路径只作为 alias 存在，不再保留重复正文。

### 站点构建

- 运行 `hugo`。
- 确认新栏目页面和八篇文章均生成。
- 确认旧 URL alias 文件生成并指向新 URL。
- 运行 `git diff --check`。
- 复查工作区，确保不修改或提交 `content/program_language/haskell-99/p30.md`。

## 完成标准

- 暴力验证主文章完整迁移到 Python 栏目，旧 URL 可继续访问。
- `_index.md` 清楚列出全部文章及其用途。
- 现有生成器文章的技术表述准确，主要示例可执行。
- 六篇新文章边界清楚，不互相复制大段内容。
- 所有 Python 示例、相对链接和 Hugo 构建通过验证。
- 用户已有的 Python 首页入口被保留，Haskell 未提交修改不受影响。
