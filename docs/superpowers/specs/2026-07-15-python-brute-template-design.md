# Python 暴力代码大模板设计

## 背景

Python 栏目已经包含暴力验证、输入输出、排序、容器、生成器、`itertools`、随机数据和数学工具等专题文章。读者理解这些工具后，比赛现场仍然需要从多篇文章中查找并重新输入常用代码。

本次新增一篇模板文章和一份真实 Python 源文件。模板面向“熟悉 C++、使用 Python 快速写小数据暴力”的场景，把常用导入、输入输出、枚举、DFS、BFS 和辅助函数集中在一个文件中。使用方式是复制整个文件，再删除当前题目不需要的分区。

模板不负责自动对拍，不调用 C++ 程序，也不管理子进程。它只缩短暴力程序本身的输入成本。

## 方案选择

### 方案一：单文件片段仓库（采用）

所有常用片段按注释分区放入一个可执行 `.py` 文件。复制一次即可使用，最符合临场写暴力的需求。代价是文件较长，因此必须保持明确分区和稳定命名。

### 方案二：小模板加文章附录

真正复制的模板只保留输入输出和 `solve`，其他片段放在文章中。模板更短，但每次仍要回文章查找并复制代码。

### 方案三：独立工具模块

将枚举和搜索函数放入 `brute_utils.py`，题目代码通过导入使用。复用性最高，但比赛目录、在线评测和不同机器都要携带额外文件，不符合单文件习惯。

## 文件结构

新增：

```text
content/program_language/python/
├── brute_force_template.md
└── src/
    └── brute_force_template.py
```

更新：

- `content/program_language/python/_index.md`
- `content/program_language/python/brute_force_validation.md`

文章通过以下 shortcode 展示真实源文件：

```text
{{< include "src/brute_force_template.py" "python" >}}
```

模板只维护一份，文章展示内容与可执行文件不会漂移。

## 模板使用模型

复制模板后按以下顺序修改：

1. 保留当前题目需要的导入，删除其余导入。
2. 在 `solve()` 中读取数据。
3. 从枚举、DFS、BFS 或数据结构分区复制或调用需要的片段。
4. 将结果输出。
5. 删除示例自测和未使用分区。

模板源文件本身不读取标准输入。默认 `solve()` 为空操作，因此直接执行不会阻塞或报错。自测统一放在 `_self_test()`，只有显式传入 `--self-test` 时运行。

## 模板分区

### 1. 常用导入

包含：

- `sys`
- `bisect_left`、`bisect_right`
- `Counter`、`defaultdict`、`deque`
- `cache`
- `heapify`、`heappop`、`heappush`
- `accumulate`、`combinations`、`combinations_with_replacement`
- `pairwise`、`permutations`、`product`
- `gcd`、`inf`、`isqrt`、`lcm`

不使用 `from module import *`，避免名称来源不清。模板要求 Python 3.10 及以上，因为使用 `pairwise`。

### 2. 输入输出

- `input = sys.stdin.buffer.readline`。
- `read_ints()` 读取一行整数。
- `read_all_ints()` 读取剩余全部整数。
- 注释展示 `n = int(input())`、`a = read_ints()`、`print(*a)`。
- 不实现复杂扫描器类，防止模板体积掩盖核心逻辑。

### 3. 列表与相邻元素

- 一维列表推导式。
- 正确的二维列表初始化。
- `enumerate` 和 `zip` 示例。
- `pairwise` 与 `zip(a, a[1:])` 两种相邻元素写法。
- 这些简短模式以注释速查形式存在，不创建无用的全局数据。

### 4. 点对与区间

- `iter_pairs(n)` 产生所有 $0\le i<j<n$。
- `iter_intervals(n)` 产生所有非空半开区间 $[l,r)$。
- 返回迭代器而不是列表，调用者可直接 `for` 遍历。

### 5. 子集与状态积

- `iter_subsets_mask(a)` 产生 `(mask, subset)`。
- `iter_subsets(a)` 按大小使用 `combinations` 产生全部子集。
- 注释给出 `product([0, 1], repeat=n)` 和 `product(range(k), repeat=n)`。
- 明确两个子集函数都会产生 $2^n$ 个状态，只用于小数据。

### 6. 排列与组合

- 直接使用 `permutations`、`combinations`、`combinations_with_replacement` 的速查注释。
- `unique_permutations(a)` 使用排序、`used` 数组和同层去重，逐个产生不同排列。
- 不使用 `set(permutations(a))` 作为主实现，避免先生成所有重复排列并保存全部不同结果。

### 7. DFS 回溯

- `dfs_assignments(options)`：每个位置有一组候选，返回所有选择序列。
- 函数内部展示 `append -> dfs -> pop`。
- 这是可运行的最小回溯骨架；实际题目可把合法性剪枝放在递归前。

### 8. BFS 最短路

- `bfs_shortest(start, is_goal, neighbors)`。
- 使用 `deque`、距离字典和可哈希状态。
- 找到目标返回距离；无法到达返回 `None`。
- 回调接口让整数状态、字符串状态、元组状态都能复用同一模板。

### 9. 记忆化 DFS

- 提供完整的 `subset_sum_exists(a, target)` 作为 `@cache` 示例。
- 说明实际题目通常保留 `@cache` 骨架，替换状态参数和转移。
- 缓存参数只使用整数、字符串或元组等可哈希类型。

### 10. 前缀和与判定助手

- `prefix_sums(a)` 返回长度 $n+1$ 的前缀和。
- `range_sum(prefix, left, right)` 返回半开区间和。
- `is_strictly_increasing(a)`。
- `is_square(n)` 使用 `isqrt`。
- `first_true(candidates, predicate)` 使用 `next` 返回首个方案或 `None`。

### 11. 容器与图

- `frequency(a)` 返回 `Counter`。
- `group_by(items, key)` 返回普通字典形式的分组结果。
- `build_undirected_graph(n, edges)` 返回长度为 `n` 的邻接表。
- 注释给出集合判重和列表状态转元组。

### 12. 堆与二分速查

- `heapify`、`heappush`、`heappop` 的最小示例放在自测中。
- `bisect_left`、`bisect_right` 的最小示例放在自测中。
- 不扩展 Dijkstra、线段树或并查集；这些属于算法模板，不是通用暴力骨架。

### 13. `solve` 与自测入口

```python
def solve():
    pass


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        _self_test()
    else:
        solve()
```

`python3 brute_force_template.py` 应立即正常退出；`python3 brute_force_template.py --self-test` 应执行所有工具的断言。

## 文章结构

`brute_force_template.md` 包含：

1. 模板解决什么问题，以及不包含自动对拍。
2. 完整模板源码。
3. 按分区说明保留和删除哪些代码。
4. 三种常见使用路径：子集枚举、排列验证、状态 BFS。
5. 从模板改出“子集和暴力”的完整示例。
6. 常见错误：忘记删除 `pass`、状态不可哈希、生成器只能消费一次、DFS 未恢复状态。
7. 链接到栏目中的输入输出、暴力验证、容器和 `itertools` 专题。

文章不逐行重复解释模板，因为各专题文章已经承担概念教学。重点说明选择哪个分区以及怎样改。

## 栏目链接

- 在 Python `_index.md` 中将模板文章放在暴力验证主文章之后。
- 在 `brute_force_validation.md` 的“相关专题”首项加入模板文章。
- 模板文章链接到相关专题，使用相对 Markdown 链接。

## 验证策略

### 源文件

- 运行 `python3 content/program_language/python/src/brute_force_template.py`，确认默认不阻塞且退出码为零。
- 运行 `python3 content/program_language/python/src/brute_force_template.py --self-test`，确认全部断言通过。
- 运行 `python3 -m py_compile content/program_language/python/src/brute_force_template.py` 检查语法。
- 为迭代器检查空输入、单元素和正常输入。
- 为 BFS 检查起点即终点、可达和不可达状态。
- 为去重排列检查重复元素。

### 文章

- 文章中的独立 Python 示例全部执行。
- shortcode 路径存在，Hugo 能将源文件渲染为代码块。
- `_index.md` 和交叉链接对应真实文件。
- 运行 `hugo -D` 和 `hugo`。
- 运行空白检查和 `git diff --check`。

## 完成标准

- 模板是一份单文件、可执行、可自测的 Python 3.10+ 源码。
- 模板包含输入输出、列表、点对、区间、子集、排列组合、DFS、BFS、记忆化、前缀和、容器、堆和二分分区。
- 默认执行不读取输入，自测模式覆盖所有可复用函数。
- 文章清楚说明怎样从大模板删减成当前题目的暴力程序。
- Python 栏目页和暴力验证主文章能够进入模板文章。
- Hugo 构建、源码自测和文章示例全部通过。
