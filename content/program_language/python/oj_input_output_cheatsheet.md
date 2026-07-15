---
title: "Python OJ 输入输出速查：常见题面直接套用"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛", "输入输出"]
---

写 OJ 题时，输入输出代码通常不难，真正容易浪费时间的是：题面格式变了，不知道应该改哪一行。

这篇文章按题面格式整理代码。使用时先找到与题目最接近的输入格式，复制对应片段，再把中间的算法部分换成自己的代码。

> [!IMPORTANT] 先保持一种读取方式
> 同一个程序中尽量只使用 `input()`、`sys.stdin.readline` 或 `sys.stdin.buffer` 中的一套方式。尤其不要先用 `sys.stdin.buffer.read()` 读完整个输入，后面又继续调用 `input()`。

## 先看选择表

| 题面特征 | 推荐方式 |
|---|---|
| 输入较小，题面按行描述清楚 | `input()` |
| 输入行很多，但仍要保留行结构 | `sys.stdin.buffer.readline` |
| 输入全部是整数，换行没有意义 | `sys.stdin.buffer.read` |
| 不给测试组数，一直读到文件结束 | 遍历 `sys.stdin.buffer` 或检查 `readline()` |
| 需要读取包含空格的整行文本 | `input()` 或文本模式的 `readline()` |
| 需要输出很多行 | 收集字符串后使用 `"\n".join(...)` |

大部分题目先用 `input()`。只有输入规模很大，或者确实需要按 token 读取全部数据时，再换成 `sys.stdin.buffer`。

## 读取一个整数

输入：

```text
5
```

代码：

```python
n = int(input())
```

`input()` 得到的是字符串，例如 `"5"`；`int(...)` 再把它转换成整数 `5`。

常见错误是漏掉 `int`：

```python
n = input()
# 此时 n 是字符串，n + 1 会报错
```

## 一行读取固定数量的整数

输入：

```text
10 20
```

代码：

```python
left, right = map(int, input().split())
```

这行代码可以从内向外理解：

1. `input()` 读取一整行；
2. `split()` 按任意空白切开；
3. `map(int, ...)` 把每一段转换成整数；
4. `left, right = ...` 把两个整数分别赋值给两个变量。

变量数量必须和输入数量一致。输入有三个整数却只写两个变量，会触发解包错误。

```python
n, m, target = map(int, input().split())
```

## 一行读取整数数组

输入：

```text
5
8 3 1 7 4
```

代码：

```python
n = int(input())
a = list(map(int, input().split()))
```

这里必须使用 `list(...)`，因为 `map` 返回的是一个按需产生数据的迭代器，不是可以反复下标访问的列表。转换后可以正常使用：

```python
print(a[0])
print(a[-1])
```

OJ 的输入保证符合题面时，一般不必额外检查长度。调试自己的生成数据时，可以临时加入：

```python
assert len(a) == n
```

## 读取字符串

### 读取一个不含空格的字符串

输入：

```text
codeforces
```

代码：

```python
s = input()
```

`input()` 会去掉行末换行，但不会把字符串拆开。

### 读取包含空格的整行文本

输入：

```text
hello python oj
```

代码仍然是：

```python
sentence = input()
```

不要写 `input().split()`，否则得到的是单词列表，而不是原来的一整行。

如果行首和行尾的空格也有意义，不要随手调用 `strip()`。`strip()` 不只删除换行，也会删除两端的空格。

使用 `sys.stdin.readline` 时，可以只删除换行：

```python
import sys

sentence = sys.stdin.readline().rstrip("\n")
```

## 读取多行数据

### 读取 `n` 行整数

输入：

```text
4
10
20
30
40
```

代码：

```python
n = int(input())
a = [int(input()) for _ in range(n)]
```

列表推导式会执行 `n` 次 `input()`，每次读取一个整数。

### 读取二维矩阵

输入：

```text
2 3
1 2 3
4 5 6
```

代码：

```python
n, m = map(int, input().split())
matrix = [list(map(int, input().split())) for _ in range(n)]
```

`matrix[i][j]` 表示第 `i` 行、第 `j` 列。每次循环都会创建一个新的行列表，因此各行互不影响。

如果输入是字符网格，例如：

```text
3 4
..#.
.#..
....
```

需要修改字符时，读取成字符列表：

```python
n, m = map(int, input().split())
grid = [list(input()) for _ in range(n)]
```

只读不改时，直接保存字符串更省内存：

```python
grid = [input() for _ in range(n)]
```

## 第一行给出多组测试数据

输入：

```text
3
4
1 2 3 4
3
10 20 30
1
7
```

第一行 `3` 表示有三组数据。可以把每组逻辑写成 `solve_case()`：

```python
def solve_case():
    n = int(input())
    a = list(map(int, input().split()))
    return sum(a)


test_count = int(input())
answers = []

for _ in range(test_count):
    answers.append(str(solve_case()))

print("\n".join(answers))
```

这里让 `solve_case()` 返回答案，而不是直接打印。外层先把答案转换成字符串并保存，最后一次输出，适合测试组很多的题目。

如果每组输出很少，直接打印也完全可以：

```python
test_count = int(input())

for _ in range(test_count):
    n = int(input())
    a = list(map(int, input().split()))
    print(sum(a))
```

## 读取到 EOF

有些题目不告诉测试组数，而是要求一直读到文件结束。EOF 是 End Of File，表示输入已经没有更多内容。

### 每组数据恰好占一行

输入：

```text
1 2
10 20
-5 8
```

代码：

```python
import sys

for line in sys.stdin.buffer:
    if not line.strip():
        continue
    x, y = map(int, line.split())
    print(x + y)
```

`for line in sys.stdin.buffer` 会逐行读取，文件结束时循环自然停止。`line` 是 `bytes`，但 `int(b"123")` 可以直接得到整数，所以纯数字输入不需要 `decode()`。

### 每组数据占多行

输入：

```text
3
1 2 3
2
10 20
```

每组先给 `n`，下一行给数组：

```python
import sys

readline = sys.stdin.buffer.readline

while True:
    line = readline()
    if not line:
        break
    if not line.strip():
        continue

    n = int(line)
    a = list(map(int, readline().split()))
    print(sum(a))
```

在二进制模式中，`readline()` 到达 EOF 时返回空字节串 `b""`，所以 `if not line` 表示输入结束。

## 大量输入：按行快速读取

输入有很多行，但每一行的结构仍然重要时，使用：

```python
import sys

input = sys.stdin.buffer.readline

n, m = map(int, input().split())
edges = []

for _ in range(m):
    u, v, weight = map(int, input().split())
    edges.append((u, v, weight))
```

把局部名字 `input` 绑定到 `readline` 后，后面的写法与普通 `input()` 很接近。

区别是 `sys.stdin.buffer.readline()` 返回 `bytes`。整数可以直接转换；如果读取的是文本，需要解码：

```python
name = input().decode().rstrip("\n")
```

> [!TIP] 不要见到 Python 就先写快读
> 输入只有几十或几百个数字时，普通 `input()` 通常已经足够。先选择最不容易写错的方式，再根据数据规模考虑速度。

## 大量整数：一次读取所有 token

如果题目输入全部是整数，而且换行位置没有意义，可以一次读取：

```python
import sys

data = list(map(int, sys.stdin.buffer.read().split()))
```

例如输入：

```text
5
8 3
1 7 4
```

无论数字怎样换行，`data` 都是：

```python
[5, 8, 3, 1, 7, 4]
```

按题面顺序取 token：

```python
import sys

tokens = iter(map(int, sys.stdin.buffer.read().split()))
n = next(tokens)
a = [next(tokens) for _ in range(n)]
```

`iter(...)` 创建迭代器，`next(tokens)` 每次取出下一个整数。这样不用先保存一份完整整数列表，但必须严格按照题面顺序读取。

这种方式会丢失行结构。下面几类输入不适合直接 `read().split()`：

- 空行具有特殊含义；
- 需要保留包含空格的整行字符串；
- 同一行和不同行代表不同结构；
- 后面还准备继续使用 `input()`。

## 数字和整行文本混合输入

假设输入先给整数 `n`，下一行给一个可能包含空格的标题，再读取 `n` 个整数：

```text
3
my first case
10 20 30
```

使用同一个按行读取函数：

```python
import sys

readline = sys.stdin.readline

n = int(readline())
title = readline().rstrip("\n")
a = list(map(int, readline().split()))
```

这里选择文本模式的 `sys.stdin.readline`，所以 `title` 直接是字符串。只用 `rstrip("\n")` 删除换行，不会误删标题两侧本来存在的空格。

不要先用 `sys.stdin.buffer.read().split()` 取走所有 token，再尝试读取标题。`read()` 已经消费了整个标准输入，而且 `split()` 也无法保留标题中的空格结构。

## 输出一个答案

直接使用 `print`：

```python
answer = 42
print(answer)
```

输出 `YES` 或 `NO`：

```python
ok = True
print("YES" if ok else "NO")
```

控制浮点数小数位数：

```python
answer = 1 / 3
print(f"{answer:.10f}")
```

是否需要固定小数位、允许多大误差，应以题目要求为准。

## 输出数组

假设：

```python
a = [3, 1, 4, 1, 5]
```

空格分隔输出：

```python
print(*a)
```

`*a` 把列表元素展开成 `print` 的多个参数，默认用空格分隔。不要直接写 `print(a)`，否则会输出 Python 列表格式：

```text
[3, 1, 4, 1, 5]
```

指定分隔符：

```python
print(*a, sep=",")
```

## 输出多行答案

答案很多时，先转换为字符串，再用换行连接：

```python
answers = [10, 20, 30]
print("\n".join(map(str, answers)))
```

`join` 只能连接字符串，因此需要 `map(str, answers)`。最终输出：

```text
10
20
30
```

输出二维矩阵：

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
]

for row in matrix:
    print(*row)
```

如果矩阵非常大，也可以先构造每一行：

```python
lines = [" ".join(map(str, row)) for row in matrix]
print("\n".join(lines))
```

## 两份最小模板

### 模板一：普通按行输入

适合绝大多数题目：

```python
def solve():
    n = int(input())
    a = list(map(int, input().split()))

    answer = sum(a)
    print(answer)


if __name__ == "__main__":
    solve()
```

复制后通常只需要修改三处：输入格式、`answer` 的计算、输出格式。

### 模板二：大量纯整数 token

```python
import sys


def solve():
    tokens = iter(map(int, sys.stdin.buffer.read().split()))
    n = next(tokens)
    a = [next(tokens) for _ in range(n)]

    answer = sum(a)
    print(answer)


if __name__ == "__main__":
    solve()
```

这个模板不关心数字在哪一行，只关心 token 的先后顺序。如果题面有字符串或行结构，不要使用它。

## 常见错误

### 使用 `split(" ")`

```python
parts = input().split(" ")
```

它只按单个空格切分，连续空格可能产生空字符串。OJ 输入通常应该写：

```python
parts = input().split()
```

不传参数时，`split()` 会把连续空白当作一个分隔区域，也能处理制表符。

### 忘记把 `map` 转成列表

```python
a = map(int, input().split())
```

只遍历一次时可以这样写；需要 `len(a)`、`a[i]`、排序或多次遍历时，应写：

```python
a = list(map(int, input().split()))
```

### 对有意义的文本使用 `strip()`

```python
line = input().strip()
```

这会删除两侧所有空白。只想删除 `readline()` 留下的换行时，用：

```python
line = sys.stdin.readline().rstrip("\n")
```

### `read()` 之后继续 `input()`

```python
data = sys.stdin.buffer.read()
line = input()
```

第一行已经把标准输入全部消费完，后面的 `input()` 读不到新内容。应在程序开始时确定一种解析方式。

### 混淆 `bytes` 和 `str`

```python
import sys

word = sys.stdin.buffer.readline().strip()
```

此时 `word` 是 `bytes`，所以：

```python
word == b"hello"
```

若要和普通字符串比较，先解码：

```python
word = word.decode()
```

## 最后如何选择

先问自己两个问题：

1. 换行位置是否属于题目数据的一部分？
2. 输入规模是否真的大到需要缓冲读取？

如果换行有意义，就按行读取；如果全部是整数 token 且换行无意义，可以使用 `read().split()`。输入不大时优先使用 `input()`，因为代码最直观、最容易检查。

更完整的字符串处理、可测试解析函数见[Python 竞赛输入输出与字符串处理](./input_output_and_strings.md)。需要把输入输出嵌入暴力验证骨架时，见[Python 暴力代码大模板](./brute_force_template.md)。

## 参考资料

- [Python 内置函数 `input`](https://docs.python.org/zh-cn/3/library/functions.html#input)
- [Python `sys.stdin`](https://docs.python.org/zh-cn/3/library/sys.html#sys.stdin)
- [Python 文本序列类型](https://docs.python.org/zh-cn/3/library/stdtypes.html#text-sequence-type-str)
