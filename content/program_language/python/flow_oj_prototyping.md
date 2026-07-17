---
title: "Python flow：快速搭建 OJ 思路原型与随机验证"
date: 2026-07-17
draft: true
toc: true
tags: ["Python", "算法竞赛", "原型验证", "函数式编程"]
---

比赛中得到一个贪心、排序或状态转移思路后，可以先用 Python 写出原型，再用小数据暴力和随机数据寻找反例。思路稳定以后，再把算法翻译成 C++ 正式提交。

这里优化的不是 Python 程序的单次运行时间，而是人的开发时间：

```text
拆分算法阶段
-> 用 flow 拼出 Python 原型
-> 用 flow_none 表达失败分支
-> 插入 trace 和 assert
-> 编写小数据 brute
-> 固定随机种子差分
-> 固化失败用例
-> 翻译成 C++
```

`flow` 只是组织原型的工具。真正提高可信度的是独立暴力、边界数据、固定随机种子和可复现的失败输入。

> [!IMPORTANT] 验证不等于证明
> 样例和随机测试能发现实现错误与算法反例，但有限测试不能证明所有输入都正确。最终仍要解释算法为什么成立。

## 可以直接复制的最小版本

普通数据流：

```python
def flow(value, *steps):
    for step in steps:
        value = step(value)
    return value
```

以 `None` 表示失败的短路流：

```python
def flow_none(value, *steps):
    for step in steps:
        if value is None:
            break
        value = step(value)
    return value
```

两者都只支持一元步骤：每个函数接收上一步的结果，返回下一步的结果。

这几行代码不需要第三方依赖，也不建议默认塞进所有比赛模板。需要原型管道时再复制，最终 C++ 或 Python 提交代码可以按性能要求展开。

## 原型阶段真正优化什么

直接写完整算法时，输入解析、状态变换、候选筛选和答案聚合容易堆在一个函数里。思路改变后，往往不知道应该替换哪一段。

`flow` 强迫每一步只有一个输入和一个输出：

```text
原始输入 -> 解析 -> 规范化 -> 算法核心 -> 格式化答案
```

这样做的收益是：

- 可以单独测试每个阶段；
- 可以快速交换某个猜想或实现；
- 可以在阶段之间打印中间值；
- 原型和暴力可以共享数据生成器；
- 翻译 C++ 时，每个阶段都有明确对应物。

代价也很明确：每个阶段都有 Python 函数调用，生成器、集合和排序还可能改变数据类型、顺序和复杂度。

## 默认 `flow`：使用普通循环

```python
def flow(value, *steps):
    for step in steps:
        value = step(value)
    return value
```

### 无步骤时返回原值

```python
data = [3, 1, 4]

assert flow(data) is data
```

### 按从左到右的顺序执行

```python
visited = []


def add_one(x):
    visited.append("add_one")
    return x + 1


def double(x):
    visited.append("double")
    return x * 2


answer = flow(3, add_one, double)

assert answer == 8
assert visited == ["add_one", "double"]
```

这段代码等价于：

```python
answer = double(add_one(3))
```

嵌套调用从外向内阅读，`flow` 则让阅读顺序和执行顺序一致。

### 多参数通过闭包绑定

每个步骤只能接收一个值。额外参数可以用短 lambda 或返回函数的辅助器绑定：

```python
def take(k):
    def take_first(values):
        return values[:k]

    return take_first


assert flow([5, 1, 8, 2], sorted, take(2)) == [1, 2]
```

`functools.partial` 也能绑定参数，但原型阶段优先选择能看出名字和返回类型的短函数。

### 异常默认向外传播

`flow` 不应该吞掉编程错误：

```python
def reciprocal(x):
    return 1 / x


# flow(0, reciprocal) 仍然抛出 ZeroDivisionError
```

短路失败与程序异常是两件事。不要用宽泛的 `except Exception` 把真正的 Bug 伪装成“无解”。

## `reduce` 极简版

如果只追求两行速写，可以使用标准库：

```python
from functools import reduce


def flow_reduce(value, *steps):
    return reduce(lambda current, step: step(current), steps, value)
```

```python
assert flow_reduce(3, add_one, double) == 8
```

它与普通循环版行为一致，但不适合作为本文默认实现：

- 每一步多经过一层 lambda；
- 不方便打印步骤名和中间值；
- traceback 中会多出 reduce/lambda；
- 对第一次接触 `reduce` 的读者不如循环直观。

### 本机性能实测

在当前机器的 CPython 3.14 上，对三个简单函数执行一百万次：

| 写法 | 总时间 | 单次时间 |
|---|---:|---:|
| 直接嵌套调用 | 约 0.085 s | 约 85 ns |
| 普通 `for` 管道 | 约 0.226 s | 约 226 ns |
| `reduce + lambda` 管道 | 约 0.443 s | 约 443 ns |

数字会随机器、解释器和函数内容变化，只能说明 `flow` 不是零成本抽象。本文接受这部分开销，因为目标是快速修改和验证小数据原型。

本机没有 PyPy3，不能据此声称 PyPy JIT 一定会内联这些调用。洛谷上的最终语言选项应根据题目、版本和实测决定。

## `flow_none`：用 `None` 表示失败

网格转移、状态解析和候选构造经常出现“某一步失败，后面都不用执行”。约定每一步返回新状态或 `None`：

```python
def flow_none(value, *steps):
    for step in steps:
        if value is None:
            break
        value = step(value)
    return value
```

### 中间返回 `None` 后短路

```python
visited = []


def reject(_):
    visited.append("reject")
    return None


def should_not_run(value):
    visited.append("should_not_run")
    return value


result = flow_none(7, reject, should_not_run)

assert result is None
assert visited == ["reject"]
```

### 最终必须使用 `is not None`

`0`、`False` 和空列表都可能是合法结果：

```python
assert flow_none(1, lambda x: x - 1) == 0
assert flow_none(True, lambda _: False) is False
assert flow_none([1], lambda _: []) == []
```

因此不能写：

```python
# 错误：会把 0、False、[] 当成失败
if result:
    print("success")
```

应该写：

```python
if result is not None:
    print("success")
```

### 原地修改函数的返回值陷阱

许多原地操作返回 `None`：

```python
values = [3, 1, 2]
result = values.sort()

assert result is None
assert values == [1, 2, 3]
```

直接把 `list.sort` 放进 `flow_none`，会把“排序成功但原地修改”误解成失败。包装成返回对象本身的步骤：

```python
def sort_in_place(values):
    values.sort()
    return values


assert flow_none([3, 1, 2], sort_in_place) == [1, 2, 3]
```

原型中通常直接用 `sorted` 更简单，因为它返回新列表。

## `None` 也是合法值时：唯一对象 sentinel

如果题目状态可能合法地等于 `None`，使用独立对象：

```python
STOP = object()


def flow_stop(value, *steps):
    for step in steps:
        if value is STOP:
            break
        value = step(value)
    return value
```

```python
def stop_here(_):
    return STOP


assert flow_stop(1, stop_here, double) is STOP
```

`is` 比较的是对象身份，只应用于 `None`、`STOP` 这种明确的单例对象。不要写一个声称支持任意数值 sentinel 的接口：两个值相等的整数对象不保证 `is` 成立。

```python
sentinel = [1000]
produced = [1000]

assert produced == sentinel      # 内容相等
assert produced is not sentinel  # 但不是同一个对象
```

列表例子稳定展示了相等与同一对象的区别。整数是否复用对象属于实现细节，不能用 `is` 判断数值。如果题目约定 `-1` 表示失败，可以在业务逻辑里使用 `== -1`；不要把它混入基于身份的通用短路器。

## 临时加入 `flow_trace`

原型出错时，需要知道第一个异常中间值出现在哪一步：

```python
def flow_trace(value, *steps):
    print(f"[start] {value!r}")

    for index, step in enumerate(steps, 1):
        value = step(value)
        name = getattr(step, "__name__", type(step).__name__)
        print(f"[{index}:{name}] {value!r}")

    return value
```

```python
def split_words(text):
    return text.split()


def parse_ints(words):
    return [int(word) for word in words]


assert flow_trace("3 1 4", split_words, parse_ints) == [3, 1, 4]
```

输出：

```text
[start] '3 1 4'
[1:split_words] ['3', '1', '4']
[2:parse_ints] [3, 1, 4]
```

`flow_trace` 是临时诊断工具，不需要留在最终模板。大量 lambda 的名字都是 `<lambda>`；需要可读日志时使用具名函数。

生成器的 `repr` 只会显示生成器对象，不会自动展开。若确实需要观察内容，可以在小数据原型中临时 `list(...)`，但要意识到这会消费生成器并改变执行方式。

## 例一：逗号整数预处理

需求：一行包含逗号分隔整数，取最小的三个不同值。

```text
5, 3, 8, 3, 1, 9, 2
```

先把每个阶段独立命名：

```python
def split_commas(text):
    return text.split(",")


def parse_comma_ints(parts):
    return map(int, parts)


def unique(values):
    return set(values)


def take_three(values):
    return values[:3]
```

再组装：

```python
input_text = "5, 3, 8, 3, 1, 9, 2"

result = flow(
    input_text,
    split_commas,
    parse_comma_ints,
    unique,
    sorted,
    take_three,
)

assert result == [1, 2, 3]
```

这条管道短，但每一步都有需要确认的语义：

| 阶段 | 输入类型 | 输出类型 | 重要性质 |
|---|---|---|---|
| `split_commas` | `str` | `list[str]` | 保留字段顺序 |
| `parse_comma_ints` | iterable | `map` | 惰性、只能消费一次 |
| `unique` | iterable | `set` | 去重，但不保留输入顺序 |
| `sorted` | iterable | `list[int]` | 物化并升序排序 |
| `take_three` | list | list | 切片得到前三个 |

当前题意要求“不同值 + 升序”，所以 `set -> sorted` 符合要求。如果题目要求保留第一次出现顺序，使用 `set` 就会改变语义，应该改成：

```python
def unique_in_order(values):
    return list(dict.fromkeys(values))
```

`flow` 让这些语义变化形成明确边界，但不会自动保证每一步符合题意。每加入一个阶段，都要问：类型、顺序、重复次数和复杂度是否仍正确。

## 例二：网格状态的短路转移

在 `5 x 5` 网格中，把位置向右下移动一格，然后检查边界和障碍物：

```python
GRID_ROWS = 5
GRID_COLS = 5
OBSTACLES = {(2, 2), (1, 4)}


def move_right_down(position):
    row, column = position
    return row + 1, column + 1


def check_bounds(position):
    row, column = position
    if 0 <= row < GRID_ROWS and 0 <= column < GRID_COLS:
        return position
    return None


def check_obstacles(position):
    if position in OBSTACLES:
        return None
    return position
```

```python
def transition(start):
    return flow_none(
        start,
        move_right_down,
        check_bounds,
        check_obstacles,
    )


assert transition((0, 0)) == (1, 1)
assert transition((1, 1)) is None   # 到达障碍物 (2, 2)
assert transition((4, 4)) is None   # 移动到 (5, 5)，越界
```

批量检查时：

```python
for start in [(0, 0), (1, 1), (4, 4)]:
    final_state = transition(start)

    if final_state is not None:
        print(start, "->", final_state)
    else:
        print(start, "-> invalid")
```

原型阶段可以快速插入新的规则，例如传送门、钥匙、体力或方向限制。正式 BFS/DFS 中，邻居扩展可能执行数百万次，通常应把这些检查内联到循环中。

## 例三：选择 `k` 个数的最小极差

### 题意

给定数组 `values`，选择恰好 `k` 个数，最小化：

$$
\max(chosen)-\min(chosen)
$$

要求 `1 <= k <= len(values)`。

### 人脑观察

把数组排序为：

```text
b[0] <= b[1] <= ... <= b[n-1]
```

假设一个最优选择的最小元素是 `b[left]`，最大元素是 `b[right]`。这组选择共有 `k` 个元素，因此 `right >= left + k - 1`。

从 `b[left]` 开始取连续 `k` 个元素，它的最大值是 `b[left + k - 1]`，并且：

$$
b[left+k-1] \le b[right]
$$

所以连续窗口的极差不会更大。于是一定存在一个最优解，对应排序后连续的 `k` 个元素。

### 用 `flow` 搭原型

原型数据流：

```text
(原数组, k)
-> 排序
-> 产生所有长度 k 的窗口极差
-> 取最小值
```

```python
def sort_case(case):
    values, k = case
    return sorted(values), k


def window_ranges(case):
    values, k = case
    assert 1 <= k <= len(values)

    return (
        values[left + k - 1] - values[left]
        for left in range(len(values) - k + 1)
    )


def minimum_range_prototype(values, k):
    return flow(
        (values, k),
        sort_case,
        window_ranges,
        min,
    )
```

```python
assert minimum_range_prototype([10, 1, 9, 2, 8, 3, 7], 3) == 2
assert minimum_range_prototype([5, 5, 5], 2) == 0
assert minimum_range_prototype([-10, 0, 7], 1) == 0
```

### 编写独立暴力

暴力直接按照题意枚举所有选择，不复用“排序后连续窗口”的观察：

```python
from itertools import combinations


def minimum_range_brute(values, k):
    return min(
        max(chosen) - min(chosen)
        for chosen in combinations(values, k)
    )
```

```python
assert minimum_range_brute([10, 1, 9, 2, 8, 3, 7], 3) == 2
```

暴力与原型使用不同思路，才能降低两份代码写出同一种错误的概率。

## 固定随机种子做差分

```python
from random import Random


def verify_minimum_range():
    seed = 20260717
    rng = Random(seed)

    boundary_cases = [
        ([0], 1),
        ([5, 5, 5], 2),
        ([-10, -3, 0, 7], 1),
        ([-10, -3, 0, 7], 4),
        ([3, 1, 2, 2], 3),
    ]

    for case_id, (values, k) in enumerate(boundary_cases):
        expected = minimum_range_brute(values, k)
        actual = minimum_range_prototype(values, k)
        assert actual == expected, (
            f"boundary case={case_id}, values={values}, k={k}, "
            f"prototype={actual}, brute={expected}"
        )

    for case_id in range(2000):
        n = rng.randint(1, 8)
        k = rng.randint(1, n)
        values = [rng.randint(-20, 20) for _ in range(n)]

        expected = minimum_range_brute(values, k)
        actual = minimum_range_prototype(values, k)

        assert actual == expected, (
            f"seed={seed}, case={case_id}, values={values}, k={k}, "
            f"prototype={actual}, brute={expected}"
        )


verify_minimum_range()
```

固定种子可以重放整段随机序列，完整输入可以直接重放单个失败用例。失败后把它固化下来：

```python
def test_regressions():
    cases = [
        # 发现反例后追加：([values...], k, expected)
        ([3, 1, 2, 2], 3, 1),
    ]

    for values, k, expected in cases:
        assert minimum_range_prototype(values, k) == expected
```

修改原型后，先运行回归用例，再运行随机差分。这样已经发现的 Bug 不会悄悄回来。

## 从 Python 原型翻译成 C++

翻译的是算法阶段，不是逐字符模仿 `flow`：

| Python 原型 | C++ 实现 |
|---|---|
| `sorted(values)` | `sort(values.begin(), values.end())` |
| 窗口极差生成器 | 下标 `for` 循环 |
| `min(...)` | `answer = min(answer, ...)` |
| Python 整数 | 按约束选择 `long long` |

假设输入格式是第一行 `n k`，第二行 `n` 个整数：

```cpp
#include <algorithm>
#include <climits>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;

    vector<long long> values(n);
    for (long long& value : values) {
        cin >> value;
    }

    sort(values.begin(), values.end());

    long long answer = LLONG_MAX;
    for (int left = 0; left + k <= n; ++left) {
        answer = min(answer, values[left + k - 1] - values[left]);
    }

    cout << answer << '\n';
    return 0;
}
```

Python 原型中的四个阶段，在 C++ 中变成读入、排序、窗口循环和输出。算法观察已经通过独立暴力和随机数据检查，C++ 阶段只需要重点防止下标、整数类型和输入输出错误。

## 什么时候适合使用

适合：

- 输入预处理有多个清楚阶段；
- 正在尝试贪心、排序或数学猜想；
- 需要频繁替换某个步骤；
- 需要在阶段之间插入日志和断言；
- 原型只运行小数据，最终会改写成 C++。

不适合：

- 最终 Python 提交的热点循环；
- BFS/DFS 每条边、DP 每个状态都要经过多层函数；
- 算法状态大量原地修改，很难维持一元输入输出契约；
- 每一步都依赖许多共享变量，拆分后反而更难读；
- 管道只有一步，普通函数调用已经足够。

## 常见陷阱

### 一元步骤限制

步骤需要额外参数时使用闭包、短 lambda 或 `partial`。若参数很多，直接写普通函数通常更清楚。

### 生成器只能消费一次

`map` 和生成器表达式被 `set`、`list`、`sum`、`min` 消费后不能自动重放。调试阶段要重复观察时，重新生成或临时列表化。

### `set` 会改变顺序语义

去重不等于保序去重。先确认题目是否允许丢失原顺序。

### 排序与物化会改变复杂度

一条看起来平滑的管道可能隐藏 `O(n log n)` 排序或 `O(n)` 复制。每个阶段都要单独标注复杂度。

### 原地函数可能返回 `None`

`list.sort`、`list.reverse`、`random.shuffle` 都返回 `None`。在 `flow_none` 中使用时必须包装并返回状态。

### 随机验证不能代替证明

随机差分通过只能说明“当前测试范围内没有找到反例”。最小极差例子的正确性来自排序后连续窗口的论证，差分负责检查代码是否实现了该论证。

## 原型完成检查清单

1. 每个阶段的输入、输出类型是什么？
2. 是否有生成器被重复消费？
3. `set`、排序和切片是否改变了题意或复杂度？
4. `None` 是失败标记还是合法值？
5. 是否错误地用真值判断成功？
6. 暴力是否独立于原型思路？
7. 是否覆盖空、单元素、全相等、重复值、负数和全部选择等边界？
8. 随机种子和完整失败输入是否都会输出？
9. 失败用例是否已经固化为回归断言？
10. 翻译 C++ 时，哪些生成器和聚合要展开成循环？
11. C++ 是否需要 `long long`？
12. 当前测试提供的是反例搜索，还是已经有正确性证明？

## 总结

`flow` 的价值不是让 Python 跑得更快，也不是替代普通函数。它让算法原型的阶段变得可见：

```text
输入 -> 变换 -> 候选 -> 答案
```

`flow_none` 再为这条链增加统一失败出口。具名步骤和 `flow_trace` 帮助观察中间状态，独立 `brute()` 和固定随机种子帮助寻找反例。

一套可靠的使用顺序是：

```text
先写清楚的 Python flow 原型
-> 再写最笨但可信的 brute
-> 用边界和随机数据对照
-> 固化失败输入
-> 补上正确性论证
-> 最后翻译成 C++
```

pipe 的思想来源与 Haskell/Python 映射见[把 Haskell 的思考方式带到 Python OJ](./haskell_style_thinking_in_python.md)。更多枚举模型见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)，随机数据生成方法见[用 Python 生成可复现的随机测试数据](./random_test_data.md)。

## 参考资料

- [Python `functools.reduce`](https://docs.python.org/zh-cn/3/library/functools.html#functools.reduce)
- [Python `itertools.combinations`](https://docs.python.org/zh-cn/3/library/itertools.html#itertools.combinations)
- [Python `random`](https://docs.python.org/zh-cn/3/library/random.html)
- [Functional Programming HOWTO](https://docs.python.org/3/howto/functional.html)
