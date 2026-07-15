---
title: "Python 函数式编程三剑客：map、filter 与 reduce"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "语法", "函数式编程"]
---

在学习了“生成器表达式”之后，我们已经初步体会到了函数式编程带来的代码精简和优雅。而在 Python 中，还有三个历史悠久且非常经典的内置高阶函数——也就是常说的“三剑客”：`map`、`filter` 和 `reduce`。

虽然很多时候它们的功能可以用生成器表达式或列表推导式替代，但在某些特定场景下，它们能提供更紧凑的语义表达，尤其是在处理数据流转换和聚合时。

这篇文章我们来彻底搞懂它们的设计思想和使用场景。

## 什么是“高阶函数”？

在讲三剑客之前，必须先明白什么是高阶函数（Higher-order function）。
简单来说，如果一个函数**能接收另一个函数作为参数**，或者**返回一个函数**，那它就是高阶函数。

在 Python 中，函数是一等公民，你可以像传递普通变量一样传递函数名：

```python
def double(x):
    return x * 2

# 此时我们没有调用 double()，而是把函数本身赋值给 f
f = double 
print(f(5)) # 输出 10
```

`map`、`filter` 和 `reduce` 就是最典型的高阶函数，它们的核心思想都是：**“我来负责控制遍历的过程，你传一个函数告诉我该对元素做什么操作”**。

---

## 1. `map`：映射变换

`map(function, iterable)` 的作用是：把一个可迭代对象（列表、元组等）里的每一个元素，挨个送到 `function` 里加工，然后把加工后的结果组合成一个新的迭代器返回。

> [!IDEA] 记忆诀窍
> 想象一条流水线，传送带上是生鸡蛋。`map` 就是那台机器，你给它安装一个叫“煎制”的刷子（函数），出来的就是一排煎蛋。一一对应，数量不变。

### 基本用法

假设要把一个字符串列表全都转成大写：

```python
words = ["hello", "world", "python"]

# 使用 map，传给它的第一个参数是内置函数 str.upper
upper_words = map(str.upper, words)

# 注意：map 返回的是一个迭代器（惰性求值），需要用 list() 展开
print(list(upper_words)) 
# 输出: ['HELLO', 'WORLD', 'PYTHON']
```

### 配合 `lambda`（匿名函数）

通常我们需要传递的函数逻辑很简单，没必要专门用 `def` 定义一个，这时候可以用 `lambda`：

```python
nums = [1, 2, 3, 4, 5]
# 把每个数字平方
squared = list(map(lambda x: x**2, nums))
print(squared) # [1, 4, 9, 16, 25]
```

### 算法竞赛中的神级用法

在算法题（比如 Codeforces 或洛谷）中，我们最常见的一行读取并转换输入：

```python
# 输入例如: 10 20 30
# input().split() 得到字符串列表 ['10', '20', '30']
# map(int, ...) 会把每个字符串送给 int() 转成整数
a, b, c = map(int, input().split())
```

---

## 2. `filter`：条件过滤

`filter(function, iterable)` 的作用是：对可迭代对象里的每个元素进行测试。如果 `function` 返回 `True`，这个元素就被留下；如果返回 `False`，就被丢弃。

> [!IDEA] 记忆诀窍
> 就像一个漏勺，满足你设定条件（返回 True）的才能漏下来，不满足的就被挡住了。

### 基本用法

过滤出数组里的所有偶数：

```python
nums = [1, 2, 3, 4, 5, 6]

# 只留下能被 2 整除的数
evens = filter(lambda x: x % 2 == 0, nums)

print(list(evens)) # [2, 4, 6]
```

### 妙用：过滤空值

如果不传函数（传 `None`），`filter` 会自动把所有被视为 `False` 的元素（如 `0`、`""`、`[]`、`None`）全过滤掉：

```python
mixed = [0, 1, False, True, "", "hello", None, []]
clean = list(filter(None, mixed))
print(clean) # [1, True, 'hello']
```

---

## 3. `reduce`：聚合归约

`reduce(function, iterable[, initializer])` 是最需要理解的一个。
它的作用是：**把前两个元素丢给函数算出一个结果，再把这个结果和第三个元素丢给函数算出一个结果...一直滚动下去，最终把整个集合“压缩”成一个单一的值。**

> [!WARNING] 注意
> 在 Python 3 中，`reduce` 已经被移出了全局命名空间，你需要从 `functools` 模块导入它。因为 Python 之父 Guido 认为在多数情况下用普通的 `for` 循环更易读。

### 工作原理拆解

我们要算 `[1, 2, 3, 4]` 的累加和：

```python
from functools import reduce

nums = [1, 2, 3, 4]

# 这里的 lambda 需要接收两个参数：
# acc 是前面累积的结果 (accumulator)，x 是当前元素
total = reduce(lambda acc, x: acc + x, nums)
print(total) # 输出 10
```

它的执行过程是这样的：
1. `acc=1, x=2`，结果 = `3`
2. `acc=3, x=3`，结果 = `6`
3. `acc=6, x=4`，结果 = `10`
结束，返回 10。

### 实战：最大值与连乘

虽然有自带的 `max()` 和 `sum()`，但体会一下用 `reduce` 实现它们：

```python
from functools import reduce

nums = [3, 8, 1, 6, 2]

# 找最大值
max_val = reduce(lambda a, b: a if a > b else b, nums)
print(max_val) # 8

# 计算阶乘（连乘）
factorial_5 = reduce(lambda a, b: a * b, range(1, 6))
print(factorial_5) # 1 * 2 * 3 * 4 * 5 = 120
```

### 进阶：带初始值的 `reduce`

`reduce` 的第三个参数可以指定一个初始值。如果指定了初始值，第一步时 `acc` 就等于这个初始值，`x` 等于数组第一个元素。

常用于把一个数组合并成字典：

```python
from functools import reduce

words = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple']

# 统计词频
def count_words(acc, word):
    acc[word] = acc.get(word, 0) + 1
    return acc

# 传入空字典 {} 作为初始状态
word_count = reduce(count_words, words, {})
print(word_count) # {'apple': 3, 'banana': 2, 'orange': 1}
```

## 总结：该用推导式还是三剑客？

在现代 Python 中，其实这三者的很多功能可以被列表推导式和生成器表达式完全替代：

- `map`: `map(lambda x: x*2, arr)`  $\Leftrightarrow$  `[x*2 for x in arr]`
- `filter`: `filter(lambda x: x>0, arr)`  $\Leftrightarrow$  `[x for x in arr if x>0]`

**选择指南：**

1. 如果你**已经有现成的函数**（比如 `int`, `str.upper`），用 `map` 非常简洁优雅：`map(int, arr)` 优于 `[int(x) for x in arr]`。
2. 如果你的逻辑很简单，但需要写 `lambda` 才能用 `map`，那**直接写推导式**通常可读性更好。
3. `reduce` 比较抽象，如果不是为了炫技或者处理复杂的链式状态机合并，普通情况下用一个简单的 `for` 循环累加，对以后的代码维护更友好。
