---
title: "Python functools.partial：预先绑定参数，快速构造新函数"
date: 2026-07-17
draft: true
toc: true
tags: ["Python", "functools", "函数式编程", "算法竞赛"]
---

有些函数本身已经完成了需要的工作，只是每次调用时都有几个参数固定不变。与其反复写 lambda 或包装函数，可以使用 `functools.partial` 预先绑定这些参数，得到一个新的可调用对象。

```python
from functools import partial

parse_binary = partial(int, base=2)

assert parse_binary("1010") == 10
assert parse_binary("1111") == 15
```

`int(text, base=2)` 的 `base` 被固定为 `2`，因此 `parse_binary` 只需要接收待解析的字符串。

> [!IDEA] 核心理解
> `partial` 不会立即调用原函数。它保存“原函数 + 已绑定参数”，返回一个以后可以继续接收剩余参数的新函数对象。

## 基本语法

```python
from functools import partial

new_function = partial(function, *bound_args, **bound_keywords)
```

以后调用：

```python
new_function(*args, **keywords)
```

可以近似理解为：

```python
def rough_partial(function, *bound_args, **bound_keywords):
    def new_function(*args, **keywords):
        merged_keywords = {**bound_keywords, **keywords}
        return function(*bound_args, *args, **merged_keywords)

    return new_function
```

真正的 `partial` 是标准库实现，还支持属性检查、序列化、弱引用及 Python 3.14 的位置占位符。上面的代码只用于理解参数如何合并。

## 先绑定左侧位置参数

定义一个三参数函数：

```python
def affine(x, scale, offset):
    return x * scale + offset
```

直接绑定第一个参数：

```python
from functools import partial

start_from_ten = partial(affine, 10)

assert start_from_ten(3, 2) == 32
```

实际调用等价于：

```python
affine(10, 3, 2)
```

新传入的位置参数会追加在已绑定位置参数的后面。因此普通 `partial` 最自然地绑定左侧参数。

再绑定两个位置参数：

```python
triple_ten_plus = partial(affine, 10, 3)

assert triple_ten_plus(2) == 32
```

## 用关键字绑定指定参数

关键字参数不受位置顺序限制：

```python
triple = partial(affine, scale=3, offset=0)

assert triple(7) == 21
```

也可以只固定偏移量：

```python
add_five_after_scaling = partial(affine, offset=5)

assert add_five_after_scaling(4, 3) == 17
```

这次调用等价于：

```python
affine(4, 3, offset=5)
```

## 调用时可以覆盖已绑定关键字

调用 `partial` 对象时，新关键字会覆盖旧关键字：

```python
transform = partial(affine, scale=2, offset=1)

assert transform(10) == 21
assert transform(10, offset=100) == 120
```

但已绑定的位置参数不能用新的位置参数“挤掉”。如果参数可能经常被覆盖，关键字绑定通常更灵活。

## 一个完整参数合并例子

```python
def record(a, b, c=0):
    return a, b, c


saved = partial(record, 10, c=30)

assert saved(20) == (10, 20, 30)
assert saved(20, c=40) == (10, 20, 40)
```

绑定后的含义是：

```text
a = 10       已绑定位置参数
b = ?        等待调用时提供
c = 30       已绑定关键字，但允许覆盖
```

## 查看 partial 保存了什么

`partial` 对象保留三个重要属性：

```python
assert saved.func is record
assert saved.args == (10,)
assert saved.keywords == {"c": 30}
```

- `.func`：原函数；
- `.args`：已经绑定的位置参数元组；
- `.keywords`：已经绑定的关键字参数字典。

调试时可以直接检查这些属性，确认是否绑错了参数。

`inspect.signature` 还能看到剩余调用接口：

```python
from inspect import signature

assert str(signature(saved)) == "(b, *, c=30)"
```

这表示新函数还需要参数 `b`，而 `c` 已有默认值 `30`。

## OJ 用法一：固定转换函数

`map` 的第一个参数经常固定为 `int`：

```python
to_ints = partial(map, int)

numbers = to_ints(["10", "20", "30"])

assert list(numbers) == [10, 20, 30]
```

`to_ints(words)` 等价于 `map(int, words)`。

注意，`map` 返回一次性迭代器，不是列表：

```python
numbers = to_ints(["1", "2", "3"])

assert sum(numbers) == 6
assert sum(numbers) == 0
```

需要下标、长度或重复遍历时再转成列表：

```python
values = list(to_ints(["1", "2", "3"]))

assert values[0] == 1
assert len(values) == 3
```

## OJ 用法二：固定排序规则

按二元组第二项排序：

```python
from operator import itemgetter

sort_by_second = partial(sorted, key=itemgetter(1))

items = [("A", 5), ("B", 2), ("C", 7)]

assert sort_by_second(items) == [("B", 2), ("A", 5), ("C", 7)]
```

需要降序时可以覆盖或追加 `reverse`：

```python
assert sort_by_second(items, reverse=True) == [
    ("C", 7),
    ("A", 5),
    ("B", 2),
]
```

如果同一个排序规则会在多组小数据上反复使用，命名后的 `sort_by_second` 比重复写 `key=itemgetter(1)` 更短。

## OJ 用法三：固定网格大小

```python
def in_bounds(position, rows, columns):
    row, column = position
    return 0 <= row < rows and 0 <= column < columns


inside_board = partial(in_bounds, rows=5, columns=7)

assert inside_board((0, 0))
assert inside_board((4, 6))
assert not inside_board((5, 6))
```

`rows` 和 `columns` 固定后，新函数只接收位置。它适合传给 `filter`、`all`、`any` 或原型管道：

```python
positions = [(0, 0), (4, 6), (5, 6), (-1, 3)]
valid_positions = list(filter(inside_board, positions))

assert valid_positions == [(0, 0), (4, 6)]
```

正式 BFS 的热点循环中，直接写边界条件可能更快；Python 原型阶段可以优先考虑表达是否清楚。

## 配合 `flow` 构造一元步骤

`flow` 要求每一步接收一个输入。`partial` 可以把多参数函数变成一元函数：

```python
def flow(value, *steps):
    for step in steps:
        value = step(value)
    return value
```

```python
input_text = "5 3 8 3 1 9 2"

result = flow(
    input_text,
    str.split,
    partial(map, int),
    set,
    sorted,
)

assert result == [1, 2, 3, 5, 8, 9]
```

这里 `partial(map, int)` 把“使用 `int` 映射某个 iterable”封装为一个等待 iterable 的步骤。

如果还要取前三个，可以用 lambda，因为切片的参数位置不适合旧版 `partial`：

```python
result = flow(result, lambda values: values[:3])

assert result == [1, 2, 3]
```

完整的原型、短路和随机差分工作流见[Python flow：快速搭建 OJ 思路原型与随机验证](./flow_oj_prototyping.md)。

## `partial` 与 lambda 的选择

两者都能构造新函数：

```python
parse_with_partial = partial(int, base=2)
parse_with_lambda = lambda text: int(text, base=2)

assert parse_with_partial("101") == parse_with_lambda("101") == 5
```

### 适合 partial

- 已有函数正好完成工作，只需固定部分参数；
- 希望通过 `.func`、`.args`、`.keywords` 检查绑定内容；
- 不需要重排参数，也不需要额外计算；
- 想避免重复写只负责转发的 lambda。

### 适合 lambda

- 需要重排参数；
- 需要调用多个函数；
- 需要表达式计算或条件；
- 包装逻辑短，并且只在当前位置使用一次。

例如固定除数，把被除数留给调用时传入：

```python
divide_by_ten = lambda numerator: numerator / 10

assert divide_by_ten(40) == 4
```

如果写成 `partial(operator.truediv, 10)`，得到的是 `10 / x`，不是 `x / 10`。普通 `partial` 只能从左边绑定位置参数，不能把第二个位置固定后空出第一个位置。Python 3.14 的 `Placeholder` 扩展了这部分能力，后文会讲。

## `partial` 与 def 的选择

逻辑开始包含校验、分支、多个语句或有意义的文档时，使用 `def`：

```python
def parse_nonnegative_binary(text):
    value = int(text, base=2)
    if value < 0:
        raise ValueError("expected a nonnegative value")
    return value
```

选择顺序可以记成：

```text
只绑定参数 -> partial
一个短表达式 -> lambda
有分支、断言或多步逻辑 -> def
```

`partial` 的目标不是消灭 `def`，而是避免没有新逻辑的转发函数。

## 调试时注意函数名字

普通函数有 `__name__`，但 `partial` 对象不会自动得到一个描述业务含义的名字：

```python
parse_binary = partial(int, base=2)

assert not hasattr(parse_binary, "__name__")
```

因此某些日志和追踪工具只会显示 `partial`。原型中可以主动加属性：

```python
parse_binary.__name__ = "parse_binary"

assert parse_binary.__name__ == "parse_binary"
```

如果日志、文档或类型提示已经成为主要需求，直接写具名 `def` 往往更稳妥。

## 绑定的是对象引用，不是副本

`partial` 保存参数对象本身。绑定可变对象后，外部修改会影响之后的调用：

```python
def take_with_config(values, config):
    return values[:config["limit"]]


config = {"limit": 2}
take_configured = partial(take_with_config, config=config)

assert take_configured([10, 20, 30, 40]) == [10, 20]

config["limit"] = 3

assert take_configured([10, 20, 30, 40]) == [10, 20, 30]
```

这既可以用于共享动态配置，也可能成为难以发现的状态 Bug。竞赛原型中尽量绑定整数、字符串、元组等不可变值。

## Python 3.14：使用 Placeholder 跳过位置

Python 3.14 为 `partial` 增加了 `functools.Placeholder`，可以预留任意位置参数槽位。

例如 `str.replace(text, old, new)` 的第一个参数是待处理字符串。希望固定 `old` 和 `new`、把 `text` 留到以后传入：

```python
from functools import Placeholder

replace_commas = partial(
    str.replace,
    Placeholder,
    ",",
    " ",
)

assert replace_commas("1,2,3") == "1 2 3"
```

调用时传入的位置参数依次填充 `Placeholder`。所有占位符都必须被填满，否则抛出 `TypeError`。

多个占位符也可以一起使用：

```python
remove_text = partial(
    str.replace,
    Placeholder,
    Placeholder,
    "",
)

assert remove_text("banana", "a") == "bnn"
```

### OJ 版本兼容性

`Placeholder` 是 Python 3.14 新功能。洛谷等 OJ 的 Python/PyPy 版本可能更旧，提交前必须检查解释器版本。

旧版本使用 lambda：

```python
replace_commas_legacy = lambda text: text.replace(",", " ")

assert replace_commas_legacy("1,2,3") == "1 2 3"
```

基础 `partial` 很早就存在，可以放心使用；只有 `Placeholder` 需要特别检查版本。

## 类方法中使用 partialmethod

在类定义中，普通方法需要正确绑定 `self`。标准库提供 `partialmethod`：

```python
from functools import partialmethod


class Counter:
    def __init__(self):
        self.value = 0

    def change(self, delta):
        self.value += delta
        return self.value

    increment = partialmethod(change, 1)
    decrement = partialmethod(change, -1)
```

```python
counter = Counter()

assert counter.increment() == 1
assert counter.increment() == 2
assert counter.decrement() == 1
```

`partialmethod` 会先让方法描述符绑定实例，再插入预设参数。普通 OJ 函数很少需要它，但写状态类、测试辅助器或本地工具时很方便。

## 常见错误

### 以为 partial 已经执行函数

```python
parse_binary = partial(int, base=2)
```

这一行只创建可调用对象，真正转换发生在：

```python
value = parse_binary("1010")
```

### 把剩余位置参数顺序想反

```python
def subtract(a, b):
    return a - b


subtract_from_ten = partial(subtract, 10)

assert subtract_from_ten(3) == 7
```

它表示 `10 - x`，不是 `x - 10`。需要后者时使用：

```python
subtract_ten = lambda x: x - 10
```

或在 Python 3.14 使用 `Placeholder`。

### 重复提供已经位置绑定的参数

```python
def add(a, b):
    return a + b


add_ten = partial(add, 10)

assert add_ten(5) == 15
```

再给两个位置参数会导致参数过多，而不是覆盖已绑定的 `10`。

### 忘记迭代器和副作用

`partial(map, int)` 返回的仍然是 `map`；绑定 `list.sort` 后返回值仍然是 `None`。`partial` 只绑定参数，不改变原函数的求值方式、返回类型和副作用。

### 为了一行代码牺牲可读性

```python
# 绑定层次已经难以一眼看懂时，不如写 def
```

`partial` 最适合“函数已经合适，只差固定几个参数”的情况。若读者需要先推演参数位置才能理解，具名函数更好。

## 速查表

| 目标 | 写法 |
|---|---|
| 固定左侧位置参数 | `partial(function, value)` |
| 固定指定关键字 | `partial(function, key=value)` |
| 调用时覆盖关键字 | `configured(x, key=new_value)` |
| 查看原函数 | `configured.func` |
| 查看绑定位置参数 | `configured.args` |
| 查看绑定关键字 | `configured.keywords` |
| 查看剩余签名 | `inspect.signature(configured)` |
| 类方法中预设参数 | `partialmethod(method, value)` |
| Python 3.14 预留位置 | `partial(function, Placeholder, fixed)` |

## 总结

`functools.partial` 适合把一个通用函数配置成更具体的函数：

```python
parse_binary = partial(int, base=2)
to_ints = partial(map, int)
sort_by_second = partial(sorted, key=itemgetter(1))
inside_board = partial(in_bounds, rows=5, columns=7)
```

使用时记住四点：

1. 已绑定位置参数放在调用参数之前；
2. 调用时关键字可以覆盖已绑定关键字；
3. 参数对象按引用保存，不会自动复制；
4. `partial` 不改变原函数的返回类型、副作用或复杂度。

只绑定参数时使用 `partial`，需要短表达式时使用 lambda，需要分支和多步逻辑时使用 `def`。这样既能减少重复代码，也不会让参数绑定变成新的理解负担。

高阶函数基础见[Python 函数式编程三剑客](./map_reduce_filter.md)，`partial` 在数据原型中的组合方式见[Python flow：快速搭建 OJ 思路原型与随机验证](./flow_oj_prototyping.md)。

## 参考资料

- [Python `functools.partial`](https://docs.python.org/zh-cn/3/library/functools.html#functools.partial)
- [Python `functools.Placeholder`](https://docs.python.org/zh-cn/3/library/functools.html#functools.Placeholder)
- [Python `functools.partialmethod`](https://docs.python.org/zh-cn/3/library/functools.html#functools.partialmethod)
