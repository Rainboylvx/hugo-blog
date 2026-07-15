---
title: "用 Python 快速编写算法暴力验证程序"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "Codeforces", "算法竞赛"]
---

在 Codeforces 或其他算法竞赛中，我们经常会得到一个看起来正确的贪心、DP 或数学结论，但暂时无法完全证明它。此时最实用的办法不是继续盯着正解，而是写一个只处理小数据的暴力程序，直接按照题意枚举所有可能，再比较答案。

暴力验证程序和正式提交的代码有不同目标：

- 正解追求更低的时间复杂度；
- 验证程序追求简单、直接、容易人工检查；
- 正解可能使用复杂结论，验证程序应尽量只使用题目定义；
- 验证程序只处理很小的数据，不需要考虑正式数据范围。

Python 的列表、集合、生成器和 `itertools` 可以大幅减少枚举代码。因此，即使平时主要使用 C++，也只需要掌握一小部分 Python，就能快速写出可靠的验证程序。

> [!IMPORTANT] 本文的目标
> 本文不是完整的 Python 教程。它假设读者已经理解 C++、DFS、BFS 和复杂度，只讲如何把熟悉的暴力思路快速翻译成 Python。

## 1. 验证程序的基本结构

一个暴力验证程序通常只有三个部分：

1. **生成候选**：枚举所有可能的区间、子集、排列或操作序列。
2. **判断合法**：丢弃不满足题目条件的候选。
3. **计算答案**：判断是否存在合法方案，或者在合法方案中求最大值、最小值。

例如，判断数组中是否存在两个不同位置，使它们的和等于 `target`：

```python
def two_sum_exists(a, target):
    n = len(a)

    for i in range(n):
        for j in range(i + 1, n):
            if a[i] + a[j] == target:
                return True

    return False


assert two_sum_exists([2, 7, 11, 15], 9)
assert not two_sum_exists([1, 2, 3], 10)
```

这段代码几乎就是 C++ 的直接翻译，只需要注意几个语法差异：

- Python 使用缩进表示代码块，不写 `{}`。
- `def` 定义函数，函数参数和变量通常不用写类型。
- `len(a)` 相当于 `a.size()`。
- `range(n)` 依次产生 `0, 1, ..., n - 1`。
- `range(l, r)` 左闭右开，依次产生 `l, l + 1, ..., r - 1`。
- `True` 和 `False` 对应 C++ 的 `true` 和 `false`。

上面的程序枚举了所有满足 $i<j$ 的点对，状态数量是 $O(n^2)$。它当然不适合正式数据，但非常适合验证哈希表或双指针写出的正解。

> [!TIP] 验证程序首先要可信
> 不要急着把暴力写成一行。先写成与题意直接对应的循环，确认正确以后，再使用 Python 的简洁写法。

## 2. 枚举点对与区间

### 2.1 使用 `range` 枚举点对

竞赛中常见的点对有两种：

```python
a = [10, 20, 30]
n = len(a)

# 有序点对：(i, j) 和 (j, i) 被视为不同方案
ordered_pairs = []
for i in range(n):
    for j in range(n):
        if i != j:
            ordered_pairs.append((i, j))

# 无序点对：只枚举 i < j
unordered_pairs = []
for i in range(n):
    for j in range(i + 1, n):
        unordered_pairs.append((i, j))

assert len(ordered_pairs) == 6
assert len(unordered_pairs) == 3
```

这里的 `(i, j)` 是一个 `tuple`，也就是元组。元组与 C++ 的 `pair` 类似，可以存放多个值；与 Python 列表不同，元组创建后不能修改。

### 2.2 使用 `enumerate` 同时取得下标和值

C++ 经常写：

```cpp
for (int i = 0; i < a.size(); ++i) {
    int x = a[i];
}
```

Python 可以使用 `enumerate`：

```python
a = [10, 20, 30]
items = []

for i, x in enumerate(a):
    items.append((i, x))

assert items == [(0, 10), (1, 20), (2, 30)]
```

`for i, x in ...` 使用了元组解包。`enumerate(a)` 每次产生 `(下标, 元素)`，Python 自动把它拆到 `i` 和 `x` 中。

### 2.3 使用切片枚举区间

Python 的切片 `a[l:r]` 会得到下标范围 $[l,r)$ 内的新列表：

```python
a = [3, -2, 5, -1]

assert a[1:3] == [-2, 5]
assert a[:2] == [3, -2]       # 省略 l，表示从 0 开始
assert a[2:] == [5, -1]       # 省略 r，表示直到末尾
assert a[::-1] == [-1, 5, -2, 3]  # 步长为 -1，表示翻转
```

下面按照定义枚举所有非空子数组，求最大子数组和：

```python
def max_subarray_brute(a):
    if not a:
        return 0

    ans = a[0]
    n = len(a)

    for left in range(n):
        for right in range(left + 1, n + 1):
            segment = a[left:right]
            ans = max(ans, sum(segment))

    return ans


assert max_subarray_brute([3, -2, 5, -1]) == 6
assert max_subarray_brute([-5, -2, -8]) == -2
assert max_subarray_brute([]) == 0
```

共有 $O(n^2)$ 个区间，而 `sum(segment)` 又需要 $O(n)$，所以这个写法的总复杂度是 $O(n^3)$。作为小数据验证程序，它比维护前缀和更接近“直接计算每个区间的和”的定义，因此更容易确认正确。

## 3. 筛选候选与整体判定

Python 最值得掌握的不是某个复杂库，而是把“遍历、筛选、计算”写得接近数学定义。

### 3.1 列表推导式

下面两段代码完全等价：

```python
a = [-3, 1, 4, -2, 5]

positive = []
for x in a:
    if x > 0:
        positive.append(x)

positive_short = [x for x in a if x > 0]

assert positive == [1, 4, 5]
assert positive_short == positive
```

列表推导式的一般形式是：

```text
[要放入列表的表达式 for 元素 in 可迭代对象 if 条件]
```

它非常适合从一个候选状态中取出被选择的元素：

```python
a = [5, 8, 13, 21]
selected = [True, False, True, False]

subset = [x for x, use in zip(a, selected) if use]

assert subset == [5, 13]
```

`zip(a, selected)` 每次同时取出两个序列的对应元素，类似同时移动两个 C++ 迭代器。需要注意，`zip` 会在较短的序列结束时停止。

### 3.2 生成器表达式

把列表推导式的 `[]` 改成 `()`，就得到生成器表达式：

```python
a = [1, 2, 3, 4]

squares_list = [x * x for x in a]
squares_generator = (x * x for x in a)

assert squares_list == [1, 4, 9, 16]
assert sum(squares_generator) == 30
```

列表推导式会立即创建整个列表；生成器只在需要时逐个产生元素。验证程序中，生成器经常直接交给 `sum`、`min`、`max`、`any` 或 `all`，不需要保存所有中间结果。

### 3.3 使用 `any` 和 `all` 表达存在与全称

- `any(...)`：只要存在一个元素为真，就返回 `True`。
- `all(...)`：只有所有元素都为真，才返回 `True`。

例如检查数组是否严格递增：

```python
def is_strictly_increasing(a):
    return all(x < y for x, y in zip(a, a[1:]))


assert is_strictly_increasing([1, 3, 8])
assert not is_strictly_increasing([1, 3, 3])
assert is_strictly_increasing([])
```

`zip(a, a[1:])` 会产生所有相邻元素对。`all` 遇到第一个 `False` 就停止，`any` 遇到第一个 `True` 就停止，这叫短路求值。

> [!INFO] 空序列上的结果
> `any([])` 是 `False`，因为不存在满足条件的元素；`all([])` 是 `True`，因为没有元素违反条件。这与数学中的存在量词和全称量词一致。

## 4. 枚举子集

长度为 $n$ 的集合有 $2^n$ 个子集。写验证程序时，通常有位掩码和 `itertools.product` 两种方法。

### 4.1 位掩码：最接近 C++ 的写法

下面暴力验证 0/1 背包：

```python
def knapsack_brute_mask(weights, values, capacity):
    n = len(weights)
    best = 0

    for mask in range(1 << n):
        total_weight = 0
        total_value = 0

        for i in range(n):
            if mask >> i & 1:
                total_weight += weights[i]
                total_value += values[i]

        if total_weight <= capacity:
            best = max(best, total_value)

    return best


assert knapsack_brute_mask([2, 3, 4], [3, 4, 5], 6) == 8
assert knapsack_brute_mask([], [], 10) == 0
```

这里的 `1 << n`、`mask >> i & 1` 与 C++ 完全相同。它适合把已有的位运算思路直接搬到 Python。

### 4.2 `product`：把多层循环写成状态选择

`itertools.product` 计算笛卡尔积。`product([False, True], repeat=n)` 表示每个位置都从“不选、选”两种状态中选择一次：

```python
from itertools import product


def knapsack_brute_product(weights, values, capacity):
    n = len(weights)
    best = 0

    for selected in product([False, True], repeat=n):
        total_weight = sum(
            weight
            for weight, use in zip(weights, selected)
            if use
        )

        if total_weight <= capacity:
            total_value = sum(
                value
                for value, use in zip(values, selected)
                if use
            )
            best = max(best, total_value)

    return best


assert knapsack_brute_product([2, 3, 4], [3, 4, 5], 6) == 8
assert knapsack_brute_product([], [], 10) == 0
```

如果每个位置不止两种状态，`product` 比位掩码更加自然。例如把每个物品分配给 A、B 或不选择，一共有 $3^n$ 种状态：

```python
from itertools import product

states = list(product([0, 1, 2], repeat=2))

assert len(states) == 3 ** 2
assert (0, 0) in states
assert (2, 1) in states
```

`product` 返回的是迭代器，每次产生一个元组。不要在大状态空间上随意套 `list(...)`；上面转换成列表只是为了演示。

## 5. 枚举排列与组合

### 5.1 `permutations`：枚举顺序

如果题目关心元素的执行顺序，可以使用 `itertools.permutations`。例如用全排列验证旅行商问题的最短回路：

```python
from itertools import permutations


def tsp_brute(dist):
    n = len(dist)
    if n <= 1:
        return 0

    best = None

    # 固定从 0 出发，只排列剩下的点
    for order in permutations(range(1, n)):
        route = (0,) + order + (0,)
        cost = sum(
            dist[route[i]][route[i + 1]]
            for i in range(len(route) - 1)
        )

        if best is None or cost < best:
            best = cost

    return best


dist = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
]

assert tsp_brute(dist) == 80
assert tsp_brute([]) == 0
```

`(0,)` 是只有一个元素的元组。单元素元组必须带逗号，否则 `(0)` 只是整数 `0`。

全排列共有 $n!$ 种。$8!=40320$，但 $10!=3628800$，如果还要重复验证很多组数据，增长会非常快。实际验证时通常把排列规模控制在 $n\leq 8$ 左右。

### 5.2 `combinations`：只关心选择，不关心顺序

从 $n$ 个元素中选择 $k$ 个、不区分顺序时，使用 `combinations`：

```python
from itertools import combinations


def best_k_sum_not_exceed(a, k, limit):
    best = None

    for chosen in combinations(a, k):
        current = sum(chosen)
        if current <= limit:
            if best is None or current > best:
                best = current

    return best


assert best_k_sum_not_exceed([2, 4, 7, 9], 2, 13) == 13
assert best_k_sum_not_exceed([8, 9], 2, 5) is None
```

`combinations(a, k)` 产生 $\binom{n}{k}$ 个元组。没有合法方案时，上面的函数返回 `None`，类似 C++ 的 `optional` 或一个专门表示“无解”的值。

如果允许同一个候选值被选择多次，可以使用 `combinations_with_replacement`：

```python
from itertools import combinations_with_replacement

choices = list(combinations_with_replacement([1, 2, 3], 2))

assert choices == [
    (1, 1), (1, 2), (1, 3),
    (2, 2), (2, 3),
    (3, 3),
]
```

> [!WARNING] 重复元素与重复排列
> `permutations([1, 1, 2])` 按位置排列，因此会产生内容相同的元组。小数据下可以写 `set(permutations(a))` 去重，但它仍会枚举全部位置排列，并保存所有不同的结果。更大的状态空间应在搜索过程中跳过重复选择。

## 6. 选择依赖当前状态：DFS 与回溯

`product` 适合每个位置的候选集合固定不变。如果下一步能选什么取决于当前状态，就需要 DFS 和回溯。

例如生成所有长度为 $2n$ 的合法括号序列：

```python
def generate_parentheses(n):
    answer = []
    path = []

    def dfs(left, right):
        if left == n and right == n:
            answer.append("".join(path))
            return

        if left < n:
            path.append("(")
            dfs(left + 1, right)
            path.pop()

        if right < left:
            path.append(")")
            dfs(left, right + 1)
            path.pop()

    dfs(0, 0)
    return answer


assert generate_parentheses(0) == [""]
assert generate_parentheses(3) == [
    "((()))",
    "(()())",
    "(())()",
    "()(())",
    "()()()",
]
```

这里最重要的模式是：

```text
选择：path.append(choice)
递归：dfs(...)
撤销：path.pop()
```

Python 的 `list` 是可变对象，所有递归层看到的是同一个 `path`。如果递归返回后不执行 `pop()`，上一个分支留下的选择就会污染下一个分支。

终点处使用 `"".join(path)`，会把字符列表连接成一个新字符串。也可以使用 `path.copy()` 保存当前列表的副本；不能直接 `answer.append(path)`，否则答案中的所有元素都会指向同一个列表。

## 7. 枚举状态图：BFS

如果每种状态都能通过若干操作转移到新状态，并且需要验证最少操作次数，可以在小状态空间上直接 BFS。

例如：每次只能交换相邻元素，求把一个短数组变成目标数组的最少交换次数。

```python
from collections import deque


def min_adjacent_swaps(start, target):
    start = tuple(start)
    target = tuple(target)

    if sorted(start) != sorted(target):
        return None
    if start == target:
        return 0

    queue = deque([(start, 0)])
    visited = {start}

    while queue:
        state, distance = queue.popleft()

        for i in range(len(state) - 1):
            next_state = list(state)
            next_state[i], next_state[i + 1] = (
                next_state[i + 1],
                next_state[i],
            )
            next_state = tuple(next_state)

            if next_state == target:
                return distance + 1

            if next_state not in visited:
                visited.add(next_state)
                queue.append((next_state, distance + 1))

    return None


assert min_adjacent_swaps([3, 1, 2], [1, 2, 3]) == 2
assert min_adjacent_swaps([1, 2], [1, 2]) == 0
assert min_adjacent_swaps([1, 2], [1, 3]) is None
```

这里用到了三个重要的数据结构：

- `deque`：双端队列，`popleft()` 可以 $O(1)$ 弹出队首，适合 BFS；
- `set`：哈希集合，平均 $O(1)$ 判断状态是否访问过；
- `tuple`：不可修改，可以放进 `set`，而 `list` 不能作为哈希键。

如果还需要记录每个状态的距离、来源或答案，可以使用 `dict`：

```python
distance = {(1, 2, 3): 0}
distance[(2, 1, 3)] = 1

assert distance[(2, 1, 3)] == 1
assert (3, 2, 1) not in distance
```

## 8. 消除重复搜索：记忆化

有些递归暴力会反复遇到相同状态。此时可以使用 `functools.cache` 保存“状态到答案”的映射。

例如，在每个数前添加 `+` 或 `-`，统计有多少种符号分配能得到目标值：

```python
from functools import cache


def count_sign_assignments(a, target):
    @cache
    def dfs(index, current_sum):
        if index == len(a):
            return int(current_sum == target)

        return (
            dfs(index + 1, current_sum + a[index])
            + dfs(index + 1, current_sum - a[index])
        )

    return dfs(0, 0)


assert count_sign_assignments([1, 1, 1, 1, 1], 3) == 5
assert count_sign_assignments([], 0) == 1
assert count_sign_assignments([], 1) == 0
```

不使用缓存时，递归树有 $2^n$ 个叶子。加入 `cache` 后，每个不同的 `(index, current_sum)` 只计算一次。这已经接近记忆化 DP，但代码仍然保持了“枚举当前位置放正号或负号”的暴力结构，很适合用来验证更复杂的推导。

`cache` 的参数必须可以哈希。整数、字符串和只包含可哈希元素的元组可以作为参数，列表不可以。如果状态原来是列表，可以在调用前转成 `tuple(state)`。

> [!INFO] Python 版本
> `functools.cache` 从 Python 3.9 开始提供。旧版本可以使用 `functools.lru_cache(maxsize=None)`，含义相同。

## 9. 从候选方案得到答案

生成候选以后，常见目标可以归纳成几种操作：

| 目标 | Python 写法 |
|---|---|
| 求和 | `sum(candidates)` |
| 最大值 | `max(candidates)` |
| 最小值 | `min(candidates)` |
| 是否存在 | `any(condition(x) for x in candidates)` |
| 是否全部满足 | `all(condition(x) for x in candidates)` |
| 找到第一个方案或反例 | `next(generator, default)` |

例如，寻找一个和恰好等于数组总和一半的子集：

```python
from itertools import combinations


def find_equal_partition(a):
    total = sum(a)
    if total % 2 != 0:
        return None

    target = total // 2

    for size in range(len(a) + 1):
        answer = next(
            (
                chosen
                for chosen in combinations(a, size)
                if sum(chosen) == target
            ),
            None,
        )
        if answer is not None:
            return answer

    return None


assert find_equal_partition([1, 5, 11, 5]) == (11,)
assert find_equal_partition([1, 2, 5]) is None
assert find_equal_partition([]) == ()
```

`next(generator, None)` 返回生成器产生的第一个元素；如果没有元素，则返回 `None`。因此它不仅能回答“是否存在”，还能给出一个具体方案或反例。

`min` 和 `max` 默认不能处理空序列。候选集合可能为空时，可以先判断，或者使用 `default`：

```python
assert max([], default=0) == 0
assert min([], default=None) is None
```

`default` 应根据题意选择，不能一律写成 `0`。例如所有合法答案都可能是负数时，`0` 也许不是合法答案。

## 10. Python 验证代码的常见陷阱

验证程序本身也可能出错。下面这些问题尤其容易让熟悉 C++ 的读者误判。

### 10.1 赋值不是复制

```python
a = [1, 2, 3]
b = a
b.append(4)

assert a == [1, 2, 3, 4]
assert a is b

c = a.copy()
c.append(5)

assert a == [1, 2, 3, 4]
assert c == [1, 2, 3, 4, 5]
```

`b = a` 只是让两个变量指向同一个列表。`a.copy()` 或 `a[:]` 可以复制一层；如果列表内部还有列表，并且也需要完全独立，应使用 `copy.deepcopy()`。

### 10.2 不要用乘法创建二维列表

```python
wrong = [[0] * 3] * 2
wrong[0][0] = 7

# 两行实际指向同一个内部列表
assert wrong == [[7, 0, 0], [7, 0, 0]]

correct = [[0] * 3 for _ in range(2)]
correct[0][0] = 7

assert correct == [[7, 0, 0], [0, 0, 0]]
```

### 10.3 列表不能放进集合

```python
visited = set()
state = [1, 2, 3]

visited.add(tuple(state))

assert (1, 2, 3) in visited
```

集合中的元素必须可哈希。列表可能被修改，因此不能直接放进 `set`；元组不可修改，可以用作状态表示。

### 10.4 生成器只能消费一次

```python
numbers = (x * x for x in range(4))

assert sum(numbers) == 14
assert sum(numbers) == 0  # 第一次 sum 已经把生成器取完
```

需要多次遍历时，应重新创建生成器，或者在状态规模很小时转换成列表。

### 10.5 全排列可能重复

```python
from itertools import permutations

all_orders = list(permutations([1, 1, 2]))
unique_orders = set(all_orders)

assert len(all_orders) == 6
assert len(unique_orders) == 3
```

`permutations` 排列的是位置，而不是不同的值。验证程序规模很小时可以用集合去重，但必须意识到它先枚举了全部 $n!$ 个排列。

### 10.6 回溯后必须恢复状态

凡是递归中修改了共享的列表、集合或字典，都要检查递归返回后是否恢复了现场。常见的成对操作包括：

```text
append  <-> pop
add     <-> remove
赋新值  <-> 恢复旧值
```

如果不想在原状态上修改，也可以为下一层创建新状态，但代码要明确知道复制的是一层还是深层。

## 11. 用验证函数检查正解

掌握上面的写法后，对拍本身反而是最简单的一步：对同一份小数据分别调用暴力函数和待验证函数，然后使用 `assert` 比较。

下面用 $O(n^3)$ 的区间枚举验证 $O(n)$ 的最大子数组和算法：

```python
from random import Random


def max_subarray_brute(a):
    if not a:
        return 0

    answer = a[0]
    for left in range(len(a)):
        for right in range(left + 1, len(a) + 1):
            answer = max(answer, sum(a[left:right]))
    return answer


def max_subarray_fast(a):
    if not a:
        return 0

    current = a[0]
    answer = a[0]

    for x in a[1:]:
        current = max(x, current + x)
        answer = max(answer, current)

    return answer


rng = Random(20260715)

for case_id in range(1000):
    n = rng.randint(0, 8)
    a = [rng.randint(-10, 10) for _ in range(n)]

    expected = max_subarray_brute(a)
    actual = max_subarray_fast(a)

    assert actual == expected, (
        f"case={case_id}, a={a}, "
        f"expected={expected}, actual={actual}"
    )
```

这里使用独立的 `Random` 对象和固定种子。只要代码不变，每次运行都会生成相同的数据，出现错误时就能稳定复现。

这个例子说明，对拍流程并不是重点。真正需要练习的是前面的 `max_subarray_brute`：能否快速把题目定义写成简单、独立、值得信任的 Python 程序。

## 12. 如何选择枚举方式

| 要枚举的对象 | 常用写法 | 状态数量 |
|---|---|---:|
| 所有点对 | 两层 `for` | $O(n^2)$ |
| 所有区间 | `left`、`right` 两层循环 | $O(n^2)$ 个区间 |
| 所有子集 | 位掩码或 `product` | $2^n$ |
| 每个位置 $k$ 种状态 | `product(range(k), repeat=n)` | $k^n$ |
| 选择 $k$ 个元素 | `combinations` | $\binom{n}{k}$ |
| 所有顺序 | `permutations` | $n!$ |
| 下一步依赖当前状态 | DFS + 回溯 | 取决于搜索树 |
| 最少操作次数 | `deque` + BFS | 取决于状态图 |
| 大量重复子问题 | DFS + `cache` | 取决于不同状态数 |

不要死记“Python 能跑到多大的 $n$”。验证程序的总耗时还取决于单个状态的计算量和需要测试多少组数据。更稳妥的做法是从很小的 $n$ 开始，确认能够快速运行后再逐渐增大。

## 总结

使用 Python 写暴力验证程序，最值得掌握的不是完整语法，而是几种能够直接表达状态空间的工具：

1. 用 `range`、`enumerate` 和切片枚举点对与区间；
2. 用列表推导式和生成器筛选、转换候选；
3. 用 `any`、`all`、`sum`、`min`、`max`、`next` 表达判定和答案；
4. 用位掩码、`product`、`permutations`、`combinations` 枚举规则状态空间；
5. 用 DFS、回溯、BFS 和 `cache` 处理依赖当前状态的搜索；
6. 用 `tuple`、`set`、`dict` 和 `deque` 表示、判重和管理状态；
7. 时刻注意可变对象、复制、状态恢复和空候选集合。

一个好的验证程序不需要聪明。它应该尽量接近题目定义，让你能一眼确认每个候选都被枚举、每个条件都被检查。Python 的价值，就是让这种直接写法足够短，能够在比赛中迅速完成。

## 参考资料

- [Python 教程：数据结构](https://docs.python.org/zh-cn/3/tutorial/datastructures.html)
- [Python 文档：itertools](https://docs.python.org/zh-cn/3/library/itertools.html)
- [Python 文档：collections](https://docs.python.org/zh-cn/3/library/collections.html)
- [Python 文档：functools](https://docs.python.org/zh-cn/3/library/functools.html)
- [知乎：算法竞赛中的 Python 常用知识整理](https://zhuanlan.zhihu.com/p/607575071)
