---
title: "Python functools 竞赛核心速览：缓存、排序、折叠与参数绑定"
date: 2026-10-03
draft: true
toc: true
tags: ["Python", "functools", "算法竞赛", "函数式编程"]
---

刷题时，`functools` 最实用的地方是：给递归加缓存，把双参数比较规则接入排序，把一串值合并成一个结果，以及预先绑定函数参数。

高阶函数指接收函数或返回函数的函数。Python 中函数可以像普通对象一样传递；`lambda`、闭包、实现 `__call__` 的可调用对象，都可以参与这些操作。不过，代码短不等于算法快，比赛中仍然要先检查状态数、复杂度和内存。

## 先记住这张表

```python
from functools import lru_cache, cache, cmp_to_key, reduce, partial
```

| 工具 | 解决的问题 | 典型用途 |
|---|---|---|
| `lru_cache` | 缓存函数调用结果，可限制容量 | 记忆化搜索 |
| `cache` | 无容量限制的函数缓存 | Python 3.9+ 的记忆化搜索 |
| `cmp_to_key` | 把双参数比较规则转换为排序键对象 | 拼接最大数等排序贪心 |
| `reduce` | 从左向右合并，得到最终值 | 按位异或、定制规约 |
| `partial` | 预先绑定部分参数 | 配置解析函数或回调 |

这五个名字对应四类用途，其中 `cache` 与 `lru_cache(maxsize=None)` 的作用相同。运行环境低于 Python 3.9 时，不要导入 `cache`，使用 `lru_cache` 即可。具体考试或 OJ 是否支持 Python、使用哪个版本，以实际环境为准。

## 1. lru_cache / cache：自动记忆化

### 从斐波那契数列看缓存

朴素递归会反复计算相同的 `fib(n)`。装饰器保存“参数 → 返回值”，再次遇到同一参数时直接取结果。

```python
from functools import lru_cache


@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


assert fib(40) == 102334155
print(fib.cache_info())
fib.cache_clear()
assert fib.cache_info().currsize == 0
```

LRU 是 Least Recently Used，即容量不足时淘汰最近最少使用的缓存条目。`maxsize=None` 关闭容量限制，也就不再淘汰条目。默认 `@lru_cache()` 只保留至多 128 个条目，复杂 DP 中可能导致状态被反复计算。

`cache_info()` 中，`hits` 是命中次数，`misses` 是未命中次数，`currsize` 是当前缓存条目数。它们适合检查状态是否重复、缓存是否有效。

Python 3.9+ 可以简写：

```python
from functools import cache


@cache
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


assert fib(10) == 55
```

对于这个例子，状态数量和加法次数为 $O(n)$，缓存有 $O(n)$ 个条目，递归深度仍为 $O(n)$；这里没有计入大整数运算的额外成本。

> [!WARNING] 缓存不会消除递归深度
> 深链仍可能触发 `RecursionError`。盲目调高递归限制也不能保证安全；大规模线性 DP 通常适合改成循环。无限缓存还可能耗尽内存。

### 参数必须可哈希，状态必须完整

整数、字符串、只含可哈希元素的元组可以作为参数。列表、字典、集合不能直接作为缓存键。

```python
from functools import cache


@cache
def state_sum(state):
    return sum(state)


assert state_sum(tuple([1, 2, 3])) == 6
```

注意：`([1, 2], 3)` 虽然是元组，内部含有列表，仍然不可哈希。把列表转换成元组时，也要考虑复制和计算哈希的成本；DP 通常更适合传索引、剩余容量、位掩码等小状态。

缓存只记录传入的参数，不会自动跟踪全局变量、闭包列表是否变化。因此要保证：**在一个缓存的有效期内，相同参数始终对应相同答案。**

### 多组数据：什么时候需要 cache_clear？

不是所有多组输入都必须清缓存。上面的 `fib(n)` 只依赖 `n`，跨组复用结果是正确的。

如果同一个 `dfs(i, j)` 读取的三角形、图或数组已经换成下一组，而缓存键仍然只有 `(i, j)`，旧答案就会污染新数据。常见处理方式有：

- 复用同一个缓存函数时，在更换题目数据后、首次求解前调用 `dfs.cache_clear()`。
- 在每次 `solve()` 中重新定义装饰后的 `dfs`，让每组数据拥有独立缓存。
- 将影响答案的数据纳入参数，但不要为了缓存而传递巨大对象。

下面用一道完整例题演示第二种写法。

## 2. 例题：数字三角形最大路径和

给定一个有 $n$ 行的数字三角形，从顶点出发，每次走到下一行的左下或右下，求走到底部的最大路径和。

定义 `dfs(i, j)` 为从第 `i` 行第 `j` 个数出发，到底部的最大路径和，索引从 `0` 开始：

$$
f(i,j)=a_{i,j}+\max(f(i+1,j),f(i+1,j+1))
$$

最后一行的答案就是当前位置的值。状态数为 $n(n+1)/2$，每个状态只需要两个子状态。

下面约定输入首行为测试组数 `T`，每组先给 `n`，再给三角形。这个输入格式用于演示多组数据，提交其他题目时按题面修改。

```text
2
3
1
2 3
4 5 6
3
10
1 1
1 1 1
```

输出：

```text
10
12
```

完整代码：

```python
import sys
from functools import lru_cache


def max_path_sum(triangle):
    n = len(triangle)
    if n == 0:
        return 0

    @lru_cache(maxsize=None)
    def dfs(i, j):
        if i == n - 1:
            return triangle[i][j]
        return triangle[i][j] + max(
            dfs(i + 1, j), dfs(i + 1, j + 1)
        )

    answer = dfs(0, 0)
    dfs.cache_clear()  # 求解已结束，主动释放缓存条目
    return answer


def main():
    tokens = iter(map(int, sys.stdin.buffer.read().split()))
    t = next(tokens)
    answers = []
    for _ in range(t):
        n = next(tokens)
        triangle = [
            [next(tokens) for _ in range(i + 1)]
            for i in range(n)
        ]
        answers.append(str(max_path_sum(triangle)))
    print("\n".join(answers))


if __name__ == "__main__":
    main()
```

每次调用 `max_path_sum` 都会创建新的缓存函数，因此这里的 `cache_clear()` 用于主动释放条目，**不是跨组正确性的必要条件**。计算期间不要修改 `triangle`。

时间复杂度为 $O(n^2)$，缓存空间为 $O(n^2)$，递归深度为 $O(n)$。行数很大时，优先使用自底向上的循环 DP，还可以把额外空间压到 $O(n)$。

### 对照：手写 memo 字典

装饰器隐藏的核心过程，就是“查表 → 计算 → 存表”：

```python
def max_path_sum_memo(triangle):
    if not triangle:
        return 0
    memo = {}

    def dfs(i, j):
        state = (i, j)
        if state in memo:
            return memo[state]
        if i == len(triangle) - 1:
            answer = triangle[i][j]
        else:
            answer = triangle[i][j] + max(
                dfs(i + 1, j), dfs(i + 1, j + 1)
            )
        memo[state] = answer
        return answer

    return dfs(0, 0)
```

字典写法适合需要定制缓存逻辑的情况。用 `state in memo` 判断是否计算过，不要把 `0` 当作“未计算”：合法答案可能就是 `0`。

更多状态设计例子见 [Python 子集和判定：记忆化 DFS 与 @cache](./subset_sum_exists.md)。

## 3. cmp_to_key：把比较规则接入排序

Python 3 的排序使用 `key=`，没有 `cmp=` 参数。当规则天然依赖两个元素的相互关系时，可以用 `cmp_to_key`。

比较函数 `compare(a, b)` 的约定：

| 返回值 | 顺序 |
|---|---|
| 负数 | `a` 排在 `b` 前 |
| 零 | 二者在此规则下等价 |
| 正数 | `a` 排在 `b` 后 |

不必恰好返回 `-1` 或 `1`，但不能直接照搬 C++ 返回布尔值的比较器；`False` 会被当成 `0`。

### 拼接最大数

对于非负整数的十进制字符串，比较 `a + b` 和 `b + a`：若前者更大，就把 `a` 放在前面。

```python
from functools import cmp_to_key


def compare(a, b):
    ab = a + b
    ba = b + a
    if ab > ba:
        return -1
    if ab < ba:
        return 1
    return 0


arr = ["3", "30", "34", "5", "9"]
arr.sort(key=cmp_to_key(compare))
assert "".join(arr) == "9534330"
assert compare("12", "1212") == 0
```

这里的相等指拼接结果相同，两个字符串本身不一定相同。把比较器写成“否则一律返回 `1`”会破坏等价情况的比较约定。

规则的局部依据是：在同一个前缀和后缀之间，交换相邻的 `a`、`b`，只需要比较中间的 `ab` 与 `ba`。按上述顺序排列就符合最大化拼接结果的目标。

如果题目要求全零输入输出单个 `0`，可以在拼接后使用 `result.lstrip("0") or "0"`；是否保留前导零由题意决定。

### 能写 key 时优先写 key

按分数降序、名字升序，直接写：

```python
students = [("Li", 90), ("Wang", 95), ("Chen", 90)]
students.sort(key=lambda item: (-item[1], item[0]))
assert students == [("Wang", 95), ("Chen", 90), ("Li", 90)]
```

普通 `key` 对每个元素计算一次键；`cmp_to_key` 会在排序比较过程中反复调用比较器。若字符串长度上界为 $L$，拼接比较本身也有 $O(L)$ 的成本，应把它计入复杂度。

比较规则还必须保持一致，不能出现循环偏好。更多内容见 [Python 排序与顺序验证](./sorting_and_ordering.md)。

## 4. reduce：从左向右折叠

`reduce(func, iterable[, initial])` 把序列不断合并成一个结果：

```text
reduce(f, [a, b, c, d])
= f(f(f(a, b), c), d)
```

带初始值时，初始值先参与运算。空序列没有初始值会抛出 `TypeError`；有初始值则返回初始值。

```python
from functools import reduce
from itertools import accumulate
import operator


assert reduce(operator.mul, [1, 2, 3, 4], 1) == 24
assert reduce(operator.mul, [], 1) == 1
assert reduce(operator.xor, [3, 5, 3], 0) == 5
assert list(accumulate([1, 2, 3, 4], operator.mul)) == [1, 2, 6, 24]
```

`reduce` 给出最终结果，`accumulate` 产生每一步的中间结果。左折叠的顺序也不能随便改，例如减法不满足结合律。

求和、最大值、累乘时，优先考虑 `sum`、`max`、`math.prod`；复杂的状态更新往往用 `for` 循环更易读。详细对照见 [map、filter 与 reduce](./map_reduce_filter.md) 和 [itertools 实用组合](./itertools_recipes.md)。

## 5. partial：预先绑定部分参数

`partial` 保存原函数和已绑定参数，返回一个可调用对象；创建时不会执行原函数。

```python
from functools import partial


def add(a, b):
    return a + b


add5 = partial(add, 5)
assert add5(3) == 8

parse_binary = partial(int, base=2)
assert parse_binary("1010") == 10
```

普通位置参数从左侧绑定，调用时的新位置参数追加在后面。预设的关键字参数可以被调用时提供的同名关键字覆盖：

```python
assert parse_binary("10", base=10) == 10
```

它适合配置解析函数、回调；直接写 `lambda x: add(5, x)` 也很清楚。`partial` 不会复制绑定的可变对象，不会自动让函数变成纯函数，也不会自动提升性能。

如果用它给 DFS 绑定图或数组，仍需检查缓存真正接收了哪些参数，以及绑定数据是否变化。详细参数规则见已有专题 [Python functools.partial](./functools_partial.md)。

## 其他工具：知道用途即可

| 工具 | 用途 | 注意 |
|---|---|---|
| `total_ordering` | 为类补全大小比较方法 | 自己定义 `__eq__` 和至少一种大小比较；与 `__call__` 仿函数无直接关系 |
| `cached_property` | 首次访问属性时计算并保存结果 | 对象数据变化后可能需要 `del obj.attr` 使缓存失效 |
| `singledispatch` | 按第一个参数的类型分派实现 | 适合通用接口，刷题通常不需要 |
| `wraps` | 写装饰器时保留被包装函数的名称、文档等元数据 | 自己实现装饰器时常用 |

## functools、itertools 与可调用对象怎么配合

这几类工具处理的问题不同，可以按需要组合：

| 工具 | 主要职责 | 刷题中的例子 |
|---|---|---|
| `functools` | 包装函数、缓存结果、绑定参数或折叠数据 | 缓存 `dfs(i, remaining)`，配置解析函数 |
| `itertools` | 构造和组合迭代过程 | 用 `combinations` 枚举固定大小子集，用 `product` 枚举笛卡尔积 |
| `lambda` | 就地写一个简短函数表达式 | `key=lambda item: (-item[1], item[0])` |
| 闭包 | 让内部函数访问外层调用的数据 | 每次 `solve()` 创建读取本组数组的 `dfs` |
| 实现 `__call__` 的类 | 让对象可像函数一样调用，并保存实例状态 | 创建多个各自带有配置或统计状态的评分器 |

例如，先用 `itertools.combinations` 枚举候选集合，再调用函数评分，最后用 `max(..., key=score)` 选择结果。只有评分过程确实反复遇到相同状态时，缓存才有减少计算的价值；如果每个候选只计算一次，给评分函数加缓存通常只会增加开销。

对于本文的数字三角形，闭包负责保存本组 `triangle`，`lru_cache` 负责保存 `(i, j)` 的答案，两者各有职责。并不需要为了“函数式”而把所有工具都放进一道题。

## 比赛前检查

- 缓存参数是否可哈希？状态是否包含所有影响答案的信息？
- 换一组数组或图后，会不会复用旧缓存？
- 状态数量、缓存内存、递归深度能否承受？缓存无法自动解决循环依赖。
- 缓存函数是否有副作用？命中缓存时函数体不会执行，因此不能依赖其中的打印或状态修改。
- 比较器是否正确处理等价元素？能否用元组 `key` 更直接地表达？
- `reduce` 是否比内置函数或循环更容易读懂？

函数、闭包与可调用对象是组织代码的工具。记忆化的关键仍是正确的状态，排序的关键仍是一致的规则；先保证这些，再选择更简洁的写法。

## 参考

- [Python 官方文档：functools](https://docs.python.org/zh-cn/3/library/functools.html)
- [Python 官方文档：排序指南](https://docs.python.org/zh-cn/3/howto/sorting.html)
