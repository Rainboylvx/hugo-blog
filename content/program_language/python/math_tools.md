---
title: "Python 验证代码中的常用数学工具"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛"]
---

Python 自带任意精度整数，标准库还提供最大公约数、整数平方根、浮点比较和有理数。写验证程序时直接使用这些工具，通常比临时重写一个版本更可靠。

## 任意精度整数

Python 的 `int` 不会像 C++ 的 `long long` 一样在 $2^{63}-1$ 后溢出：

```python
x = 10 ** 100

assert len(str(x)) == 101
assert x * x == 10 ** 200
```

这非常适合验证组合计数、乘法和递推结果。但整数越大，运算成本仍会增加；“不会溢出”不等于“无限快”。

## `abs`、`pow` 与 `divmod`

```python
assert abs(-17) == 17
assert pow(2, 10) == 1024
assert pow(2, 10, 1000) == 24
assert divmod(17, 5) == (3, 2)
```

`pow(base, exponent, mod)` 直接计算模幂，不会先构造完整的巨大幂。`divmod(a, b)` 同时返回商和余数，相当于 `(a // b, a % b)`。

```python
for a in range(20):
    quotient, remainder = divmod(a, 7)
    assert a == quotient * 7 + remainder
    assert 0 <= remainder < 7
```

## `gcd` 与 `lcm`

```python
from math import gcd, lcm

assert gcd(18, 24) == 6
assert gcd(18, 24, 30) == 6
assert lcm(6, 8) == 24
assert lcm(6, 8, 15) == 120
```

多个数的最大公约数和最小公倍数可以直接传入多个参数。空参数时 `gcd()` 返回 `0`，`lcm()` 返回 `1`。

```python
from math import gcd, lcm

assert gcd() == 0
assert lcm() == 1
```

`math.lcm` 从 Python 3.9 开始提供。旧版本可以使用 `a // gcd(a, b) * b`，但要自行处理零和符号。

## `isqrt`：精确整数平方根

`math.isqrt(n)` 返回 $\lfloor\sqrt n\rfloor$，整个过程使用整数运算：

```python
from math import isqrt

assert isqrt(0) == 0
assert isqrt(15) == 3
assert isqrt(16) == 4
assert isqrt(17) == 4
```

判断完全平方数：

```python
from math import isqrt


def is_square(n):
    if n < 0:
        return False
    root = isqrt(n)
    return root * root == n


assert is_square(0)
assert is_square(10**40)
assert not is_square(10**40 - 1)
assert not is_square(-1)
```

不要使用 `int(n ** 0.5)` 验证大整数。浮点数精度有限，大整数转换后可能发生舍入。

## `inf`：初始化最优值

```python
from math import inf

best_min = inf
best_max = -inf

for x in [3, -2, 7, 1]:
    best_min = min(best_min, x)
    best_max = max(best_max, x)

assert best_min == -2
assert best_max == 7
```

如果“没有合法候选”是可能结果，使用 `None` 往往比返回 `inf` 更能表达无解：

```python
def minimum_positive(a):
    candidates = [x for x in a if x > 0]
    return min(candidates, default=None)


assert minimum_positive([-3, 0, -1]) is None
assert minimum_positive([-3, 5, 2]) == 2
```

## 浮点数不能直接依赖相等

```python
value = 0.1 + 0.2

assert value != 0.3
```

验证浮点答案时使用 `math.isclose`：

```python
from math import isclose

assert isclose(0.1 + 0.2, 0.3)
assert isclose(1_000_000.0, 1_000_000.1, rel_tol=1e-6)
assert isclose(1e-10, 0.0, abs_tol=1e-9)
```

判断公式近似为：

$$
|a-b| \leq \max(\text{rel\_tol}\cdot\max(|a|,|b|),\text{abs\_tol}).
$$

- `rel_tol` 控制相对于数值规模的误差；
- `abs_tol` 控制接近零时允许的绝对误差；
- 两个容差要根据题目要求选择，不要机械复制。

## `Fraction`：精确有理数

如果问题只包含整数分数，可以使用 `fractions.Fraction` 避免浮点误差：

```python
from fractions import Fraction

a = Fraction(1, 3)
b = Fraction(1, 6)

assert a + b == Fraction(1, 2)
assert a * 6 == 2
```

用字符串构造十进制分数可以保持字面值精确：

```python
from fractions import Fraction

assert Fraction("0.1") + Fraction("0.2") == Fraction("0.3")
```

直接传入浮点数会保留这个浮点数的真实二进制值：

```python
from fractions import Fraction

assert Fraction(0.1) != Fraction(1, 10)
```

`Fraction` 适合小规模验证，不适合无条件替换正式算法中的高性能整数表示。

## 用数学工具写简单验证

例如验证数组中是否存在一对数，其乘积是完全平方数：

```python
from math import isqrt


def is_square(n):
    if n < 0:
        return False
    root = isqrt(n)
    return root * root == n


def has_square_product_pair(a):
    return any(
        is_square(a[i] * a[j])
        for i in range(len(a))
        for j in range(i + 1, len(a))
    )


assert has_square_product_pair([2, 8, 3])
assert not has_square_product_pair([2, 3, 5])
```

这个验证版本直接检查每个点对，不需要推导质因数奇偶性。更多枚举方式见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)。

## 参考资料

- [Python `math`](https://docs.python.org/zh-cn/3/library/math.html)
- [Python `fractions`](https://docs.python.org/zh-cn/3/library/fractions.html)
