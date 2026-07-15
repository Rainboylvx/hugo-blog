---
title: "Python 竞赛输入输出与字符串处理"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛"]
---

暴力验证函数写好以后，还要把输入转换成列表、整数和字符串，再把答案按题目格式输出。Python 不需要复杂的扫描器；掌握 `input`、`split`、`map` 和解包，已经能处理大多数小数据。

## 读取一行

`input()` 读取一行文本，并自动去掉末尾换行：

```python
from io import StringIO

source = StringIO("5\n")
n = int(source.readline())

assert n == 5
```

真实程序中可以直接写：

```python
# n = int(input())
```

这里注释掉调用，是为了让代码片段不等待标准输入。`int` 把字符串转换为整数，`float` 转换为浮点数。

## 一行读取多个整数

输入：

```text
3 7 11 15
```

常见写法是：

```python
line = "3 7 11 15"
a = list(map(int, line.split()))

assert a == [3, 7, 11, 15]
```

执行过程可以拆开理解：

1. `line.split()` 按任意空白切分，得到字符串列表；
2. `map(int, ...)` 对每个字符串调用 `int`；
3. `list(...)` 保存转换后的全部整数。

如果元素个数固定，可以直接解包：

```python
line = "10 20"
left, right = map(int, line.split())

assert left == 10
assert right == 20
```

真实竞赛代码通常写成：

```python
# a = list(map(int, input().split()))
# x, y = map(int, input().split())
```

## `input` 与 `sys.stdin.buffer`

`input()` 简单清楚，写小数据验证程序时通常足够。如果正式 Python 提交需要读取大量数据，可以使用缓冲输入：

```python
from io import BytesIO

source = BytesIO(b"4\n1 2 3 4\n")
readline = source.readline

n = int(readline())
a = list(map(int, readline().split()))

assert n == 4
assert a == [1, 2, 3, 4]
```

真实程序把前两行替换成：

```python
# import sys
# readline = sys.stdin.buffer.readline
```

`bytes.split()` 同样按空白切分，`int(b"123")` 也能直接得到整数，所以纯数字输入不必手动解码。

> [!TIP] 选择原则
> 验证代码优先使用容易读懂的 `input()`。只有输入确实很大时才换成 `sys.stdin.buffer`，不要让快读模板掩盖验证逻辑。

## 按 token 读取整份输入

当换行位置不重要时，可以把整份输入按空白切成 token：

```python
def parse_case(data):
    tokens = iter(data.split())
    n = int(next(tokens))
    a = [int(next(tokens)) for _ in range(n)]
    target = int(next(tokens))
    return a, target


a, target = parse_case("4\n2 7 11 15\n9\n")

assert a == [2, 7, 11, 15]
assert target == 9
```

真实程序可以从 `sys.stdin.buffer.read()` 获得整份字节数据：

```python
def parse_all(data):
    values = list(map(int, data.split()))
    return values


assert parse_all(b"1 2\n3 4\n") == [1, 2, 3, 4]
```

这种方式很快，但失去了行结构。题目包含整行字符串或空行有特殊含义时，应按行读取。

## 多组测试数据

常见格式是第一行给出测试组数 `t`：

```python
def parse_cases(text):
    lines = iter(text.strip().splitlines())
    test_count = int(next(lines))
    cases = []

    for _ in range(test_count):
        n = int(next(lines))
        a = list(map(int, next(lines).split()))
        assert len(a) == n
        cases.append(a)

    return cases


text = """\
2
3
1 2 3
4
5 5 8 13
"""

assert parse_cases(text) == [[1, 2, 3], [5, 5, 8, 13]]
```

把解析写成独立函数有一个好处：可以直接用字符串构造边界用例，不必创建临时输入文件。

## 输出列表和多行答案

`print(*a)` 使用 `*` 解包列表，相当于把元素作为多个参数传给 `print`：

```python
from io import StringIO

output = StringIO()
a = [1, 2, 3]

print(*a, file=output)
assert output.getvalue() == "1 2 3\n"
```

`sep` 控制参数之间的分隔符，`end` 控制结尾：

```python
from io import StringIO

output = StringIO()

print(1, 2, 3, sep=",", end="!", file=output)
assert output.getvalue() == "1,2,3!"
```

需要积累很多行时，先构造字符串列表，最后一次输出：

```python
answers = [3, 5, 8]
text = "\n".join(map(str, answers))

assert text == "3\n5\n8"
```

## 常用字符串操作

字符串支持下标和切片，但创建后不能原地修改：

```python
s = "algorithm"

assert s[0] == "a"
assert s[-1] == "m"
assert s[1:4] == "lgo"
assert s[::-1] == "mhtirogla"
```

常用判断与变换：

```python
s = "codeforces-2026"

assert s.startswith("code")
assert s.endswith("2026")
assert s.replace("2026", "2027") == "codeforces-2027"
assert "12345".isdigit()
assert not "12a45".isdigit()
assert " Ab C ".strip().lower() == "ab c"
```

字符串和字符列表之间经常互相转换：

```python
s = "cba"
chars = list(s)
chars.sort()
result = "".join(chars)

assert result == "abc"
```

## 一个完整的验证程序接口

把解析、暴力计算和格式化分开，测试会更简单：

```python
def two_sum_exists(a, target):
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if a[i] + a[j] == target:
                return True
    return False


def solve(text):
    tokens = iter(text.split())
    n = int(next(tokens))
    a = [int(next(tokens)) for _ in range(n)]
    target = int(next(tokens))
    return "YES" if two_sum_exists(a, target) else "NO"


assert solve("4\n2 7 11 15\n9\n") == "YES"
assert solve("3\n1 2 3\n10\n") == "NO"
```

这种结构比在算法内部反复调用 `input` 更容易复用，也更容易为边界数据写断言。

比赛时需要根据题面格式快速查找可复制代码，见[Python OJ 输入输出速查](./oj_input_output_cheatsheet.md)。更多暴力枚举方法见[用 Python 快速编写算法暴力验证程序](./brute_force_validation.md)。

## 参考资料

- [Python 内置函数](https://docs.python.org/zh-cn/3/library/functions.html)
- [Python 字符串方法](https://docs.python.org/zh-cn/3/library/stdtypes.html#string-methods)
- [Python `sys` 模块](https://docs.python.org/zh-cn/3/library/sys.html)
