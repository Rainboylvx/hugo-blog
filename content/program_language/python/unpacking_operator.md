---
title: "Python 解包操作符 * 和 **：写更少，做更多"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "解包", "语法糖", "算法竞赛"]
---

解包（Unpacking）是 Python 中最实用的语法糖之一。它能显著减少临时变量和循环，让代码更紧凑、更接近数学表达。

我们用一个经典问题开场：读入三个整数并排序，然后按给定的字母顺序输出。

```python
values = sorted(map(int, input().split()))
order = input()

named = {"A": values[0], "B": values[1], "C": values[2]}

print(*(named[ch] for ch in order), end="")
```

这里的 `*(named[ch] for ch in order)` 就是解包操作：把生成器产生的多个值展开成 `print` 的独立参数，等价于 `print(5, 1, 3)`。

下面我们把解包的所有实用场景梳理一遍。

## 1. `*` 解包：展开可迭代对象

### 函数调用时解包

```python
print(*[1, 2, 3])        # 等价于 print(1, 2, 3)
print(*range(5))         # 0 1 2 3 4

# 数学函数
nums = [3, 1, 4, 1, 5]
print(max(*nums))        # 5
# 但 max 本身支持可迭代对象，所以 max(nums) 更直接
```

### 合并多个列表

```python
a = [1, 2]
b = [3, 4]
merged = [*a, *b]        # [1, 2, 3, 4]
```

等价于 `a + b`，但在函数返回时或表达式中间组合时非常方便。

### 赋值时的扩展解包

把可迭代对象的一部分拆给变量，剩余的部分用 `*` 接收。

```python
first, *rest = [1, 2, 3, 4]
# first = 1, rest = [2, 3, 4]

*begin, last = [1, 2, 3, 4]
# begin = [1, 2, 3], last = 4

first, *middle, last = [1, 2, 3, 4]
# first = 1, middle = [2, 3], last = 4

# 竞赛中的实用场景：读入 n 和数组
n, *a = map(int, input().split())
# 输入 "5 1 2 3 4 5" → n=5, a=[1,2,3,4,5]
```

### 矩阵转置：`zip(*matrix)`

这是竞赛中的高频技巧。

```python
matrix = [[1, 2, 3],
          [4, 5, 6]]

# 转置
transposed = list(zip(*matrix))
# [(1, 4), (2, 5), (3, 6)]
```

`zip(*matrix)` 等价于 `zip([1,2,3], [4,5,6])`，把每行的对应列元素配对。

### 用 `*` 清空列表

```python
*a, = range(5)
# a = [0, 1, 2, 3, 4]
```

注意后面的逗号，这是语法要求。

## 2. `**` 解包：展开字典

### 合并字典

```python
d1 = {"a": 1, "b": 2}
d2 = {"c": 3, "d": 4}

merged = {**d1, **d2}
# {'a': 1, 'b': 2, 'c': 3, 'd': 4}

# 后面的覆盖前面的 key
d1 = {"a": 1, "b": 2}
d2 = {"b": 99, "c": 3}
merged = {**d1, **d2}
# {'a': 1, 'b': 99, 'c': 3}
```

### 更新字典的简洁写法

```python
base = {"x": 0, "y": 0}
point = {**base, "y": 5}   # 更新 y，保留 x
# {'x': 0, 'y': 5}
```

等价于 `base.copy(); base["y"] = 5` 但在一行内完成。

### 函数调用时解包字典

```python
def draw_point(x, y, color="black"):
    print(f"({x}, {y}) in {color}")

params = {"x": 10, "y": 20, "color": "red"}
draw_point(**params)   # (10, 20) in red
```

## 3. 综合实战

### 读入矩阵并转置

```python
n, m = map(int, input().split())
matrix = [list(map(int, input().split())) for _ in range(n)]

col_sum = [sum(col) for col in zip(*matrix)]  # 每列的和
```

### 从字典构建格式化输出

```python
data = {"A": 5, "B": 3, "C": 1}
order = "CAB"
print(*(data[ch] for ch in order))
# 1 5 3
```

### 拆分并合并区间

```python
l1, r1 = map(int, input().split())
l2, r2 = map(int, input().split())

# 取并集的端点
left = min(l1, l2)
right = max(r1, r2)
```

## 总结

| 写法 | 作用 | 竞赛场景 |
|------|------|----------|
| `*iterable` | 展开可迭代对象为函数参数 | `print(*arr)` |
| `zip(*matrix)` | 矩阵转置 | 行列互换 |
| `a, *b = iterable` | 扩展解包赋值 | 分出第一个和剩余 |
| `{**d1, **d2}` | 合并字典 | 合并配置 |
| `f(**d)` | 字典解包为关键字参数 | 参数转发 |

解包的核心思想是：**不要手动写循环去拆解结构，让 Python 帮你拆**。
