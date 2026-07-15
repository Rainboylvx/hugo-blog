---
title: "Python 暴力代码大模板：复制后直接改"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛", "模板"]
---

这份模板用于快速编写小数据暴力程序。它把常用导入、输入输出、点对、区间、子集、排列组合、DFS、BFS、记忆化和若干辅助函数放在一个 Python 文件中。

使用方法不是把整个模板原样提交，而是：

1. 复制完整文件；
2. 找到当前题目需要的分区；
3. 在 `solve()` 中写输入、调用和输出；
4. 删除没有使用的导入、函数和自测。

> [!IMPORTANT] 模板的边界
> 这不是自动对拍器，不会编译或调用 C++ 程序，也不负责比较两个外部进程的输出。它只负责缩短暴力程序本身的编写时间。

模板源文件：[brute_force_template.py](./src/brute_force_template.py)

## 完整模板

{{< include "src/brute_force_template.py" "python" >}}

## 模板的分区

| 分区 | 通常在什么题目中保留 |
|---|---|
| Constants and input | 几乎所有需要读取输入的程序 |
| List construction | 临场忘记推导式、二维列表或相邻元素写法时 |
| Pairs and intervals | 点对、所有子数组、所有区间 |
| Subsets and Cartesian products | 子集、每个位置有多种状态 |
| Permutations and combinations | 顺序、选 $k$ 个、允许重复选择 |
| DFS / backtracking | 下一步选择依赖当前状态 |
| BFS shortest path | 小状态空间中的最少操作次数 |
| Memoized DFS | 暴力递归反复遇到相同状态 |
| Prefix sums and predicates | 区间和、单调性、完全平方数 |
| Containers and graphs | 计数、分组、邻接表、状态判重 |
| Heap and binary search | 需要不断取最小值或查询插入位置 |
| Template self-test | 修改模板本身时保留；做题副本中通常删除 |

模板故意比较大。实际题目只保留一条解决路径，避免无关代码干扰调试。

## 输入输出怎么改

默认的 `solve()` 不读取输入，所以直接执行模板会立即退出：

```python
def solve():
    # n, target = read_ints()
    # a = read_ints()
    # print("YES" if subset_sum_exists(a, target) else "NO")
    pass
```

假设输入是：

```text
4 9
2 7 11 15
```

可以改成：

```python
def solve_text(text):
    lines = iter(text.strip().splitlines())
    n, target = map(int, next(lines).split())
    a = list(map(int, next(lines).split()))
    assert len(a) == n

    answer = any(
        sum(a[i] for i in range(n) if mask >> i & 1) == target
        for mask in range(1 << n)
    )
    return "YES" if answer else "NO"


assert solve_text("4 9\n2 7 11 15\n") == "YES"
assert solve_text("3 20\n2 7 11\n") == "YES"
assert solve_text("3 100\n2 7 11\n") == "NO"
```

在实际模板中，把 `solve_text` 的解析部分换成：

```python
# n, target = read_ints()
# a = read_ints()
```

更多读入方式见[Python 竞赛输入输出与字符串处理](./input_output_and_strings.md)。

## 使用路径一：子集枚举

### 位掩码

需要同时使用 `mask` 时保留 `iter_subsets_mask`：

```python
def iter_subsets_mask(a):
    n = len(a)
    for mask in range(1 << n):
        subset = tuple(a[i] for i in range(n) if mask >> i & 1)
        yield mask, subset


subsets = list(iter_subsets_mask([10, 20]))

assert subsets == [
    (0, ()),
    (1, (10,)),
    (2, (20,)),
    (3, (10, 20)),
]
```

### 只需要子集元素

只关心被选中的元素时，按大小枚举组合更直观：

```python
from itertools import combinations


def iter_subsets(a):
    for size in range(len(a) + 1):
        yield from combinations(a, size)


assert list(iter_subsets([1, 2])) == [(), (1,), (2,), (1, 2)]
```

两种方法都会产生 $2^n$ 个状态，只适用于小数据。

## 使用路径二：枚举顺序

元素互不相同时，直接使用 `permutations`：

```python
from itertools import permutations


def minimum_adjacent_cost(a):
    return min(
        sum(abs(order[i] - order[i + 1]) for i in range(len(order) - 1))
        for order in permutations(a)
    )


assert minimum_adjacent_cost([1, 4, 6]) == 5
```

输入有重复值时，普通 `permutations` 会产生内容相同的排列。模板中的 `unique_permutations` 使用排序、`used` 数组和同层去重，不需要先保存全部排列。

## 使用路径三：状态 BFS

模板提供：

```text
bfs_shortest(start, is_goal, neighbors)
```

调用者只需要描述目标和下一步状态。例如从整数 `start` 变到 `target`，每次可以 `-1`、`+1` 或乘 `2`：

```python
def make_integer_bfs(target):
    def is_goal(x):
        return x == target

    def neighbors(x):
        for next_x in (x - 1, x + 1, x * 2):
            if 0 <= next_x <= 100:
                yield next_x

    return is_goal, neighbors


is_goal, neighbors = make_integer_bfs(17)

assert not is_goal(5)
assert set(neighbors(5)) == {4, 6, 10}
```

在模板中调用：

```python
# answer = bfs_shortest(5, is_goal, neighbors)
# print(answer)
```

BFS 状态必须可以放进字典。列表状态先转换为元组，例如 `state = tuple(state_list)`。

## DFS 骨架怎么改

`dfs_assignments(options)` 适合“每个位置选择一个值”：

```python
def dfs_assignments(options):
    answer = []
    path = []

    def dfs(position):
        if position == len(options):
            answer.append(tuple(path))
            return

        for choice in options[position]:
            if choice in path:  # 示例剪枝：不允许重复选择
                continue
            path.append(choice)
            dfs(position + 1)
            path.pop()

    dfs(0)
    return answer


assert dfs_assignments([[1, 2], [1, 2]]) == [(1, 2), (2, 1)]
```

实际题目通常只需要修改三个位置：

- 递归结束条件；
- 当前层能选择什么；
- `append` 之前的合法性剪枝。

`append -> dfs -> pop` 必须成对出现，否则一个分支的状态会污染下一个分支。

## 常用速查

### 每个位置两种或多种状态

```python
from itertools import product

assert list(product([0, 1], repeat=2)) == [
    (0, 0),
    (0, 1),
    (1, 0),
    (1, 1),
]

assert len(list(product(range(3), repeat=2))) == 3**2
```

### 前缀和

```python
from itertools import accumulate

a = [3, -2, 5, -1]
prefix = list(accumulate(a, initial=0))

left, right = 1, 3
assert prefix[right] - prefix[left] == sum(a[left:right]) == 3
```

### 频率和分组

```python
from collections import Counter, defaultdict

a = [1, 2, 1, 3, 2]
count = Counter(a)
groups = defaultdict(list)

for x in a:
    groups[x % 2].append(x)

assert count == Counter({1: 2, 2: 2, 3: 1})
assert groups[0] == [2, 2]
assert groups[1] == [1, 1, 3]
```

## 自测模板

默认执行不会读取输入：

```bash
python3 content/program_language/python/src/brute_force_template.py
```

运行模板内置断言：

```bash
python3 content/program_language/python/src/brute_force_template.py --self-test
```

只检查语法：

```bash
python3 -m py_compile content/program_language/python/src/brute_force_template.py
```

复制到题目目录以后，通常删除 `_self_test()`，再在 `solve()` 中写当前题目。

## 常见错误

### 忘记替换 `solve()`

模板默认的 `solve()` 只有 `pass`，所以运行后没有输出。写题时应先完成输入和一个最朴素的输出，再加入枚举逻辑。

### 把列表作为 BFS 状态

`distance` 和 `visited` 的键必须可哈希。列表改成元组，嵌套列表则要递归转换为元组。

### 重复消费生成器

`iter_pairs`、`iter_subsets`、`unique_permutations` 都返回迭代器。遍历一次后不会自动重新开始；需要再次遍历就重新调用函数。

### 忘记恢复 DFS 状态

修改 `path`、`used`、集合或棋盘后，递归返回时必须撤销。另一种写法是给下一层创建新状态，但要明确浅拷贝和深拷贝的区别。

### 保留太多无关代码

大模板的价值是查找和复制，不是让每份暴力程序都带着全部工具。删掉无关分区可以减少变量名冲突，让失败样例更容易调试。

## 相关专题

- [用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)
- [Python 竞赛输入输出与字符串处理](./input_output_and_strings.md)
- [Python 竞赛常用容器](./collections_toolkit.md)
- [Python 生成器表达式](./generator_expression.md)
- [Python itertools 实用组合](./itertools_recipes.md)
- [用 Python 生成可复现的随机测试数据](./random_test_data.md)
- [Python 验证代码中的常用数学工具](./math_tools.md)
