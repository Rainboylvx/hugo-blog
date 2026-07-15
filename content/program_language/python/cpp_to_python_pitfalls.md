---
title: "C++ 选手转 Python 写暴力：常见的 4 个血泪坑点"
date: 2026-07-15
draft: true
toc: true
tags: ["Python", "算法竞赛", "避坑指南"]
---

很多习惯了 C++ 的算法竞赛选手，在发现 Python 写暴力对拍、高精度和组合数学有多爽之后，都会立刻转投 Python 的怀抱。

然而，Python 在内存模型和作用域上的设计与 C++ 截然不同。如果你完全按照 C++ 的直觉写 Python 代码，大概率会遇到**数组联动修改（改一处变全集）**、**答案存不进去（最后全是空数组）**、**莫名其妙报错未定义**或者**神秘爆栈**等问题。

这篇文章总结了 C++ 选手转 Python 竞赛时，最容易踩的 4 个深坑。

## 坑点 1：二维数组初始化的“浅拷贝”灾难

> **症状**：修改了二维数组的一个元素，结果一整列的值全跟着变了！

在 C++ 里，声明一个 $N \times M$ 的二维数组初始化为 0 很简单：`int dp[N][M] = {0};`。
到了 Python，很多初学者会本能地利用 `*` 操作符这样写：

```python
n, m = 3, 4
# ⚠️ 错误的写法：
dp = [[0] * m] * n  

dp[0][0] = 1
print(dp)
# 期望：[[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
# 实际：[[1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0]]  <-- 灾难发生！
```

**为什么会这样？**
因为外层的 `* n` 并没有复制里面的列表本身，它只是**把内部那个列表的“内存地址”复制了 $n$ 遍**。这 $n$ 行实际上指向的是**内存里的同一个列表**。

**正确解法：使用列表推导式**
必须每次循环都新建一个内部列表：

```python
dp = [[0] * m for _ in range(n)]
dp[0][0] = 1 # 这次就对了
```

## 坑点 2：DFS 收集结果时全变成了空数组

> **症状**：在写回溯（DFS）时，把路径 `path` `append` 到 `ans` 里。结果打印 `ans` 发现，里面要么全是空数组，要么全是最后一步的状态。

来看这段典型的求子集的错误代码：

```python
ans = []
path = []

def dfs(i):
    if i == 3:
        ans.append(path)  # ⚠️ 致命错误
        return
        
    # 不选
    dfs(i + 1)
    
    # 选
    path.append(i)
    dfs(i + 1)
    path.pop() # 回溯

dfs(0)
print(ans) # 结果全是 [[], [], [], ...]！
```

**为什么会这样？**
Python 中的变量全是指针（引用）。`ans.append(path)` 只是把 `path` 数组的**地址**塞进去了。由于整个回溯过程中 `path` 一直在被 `append` 和 `pop`，到了最后，`path` 被回溯掏空成了 `[]`。此时你去查看 `ans` 里存的所有指针，它们指向的当然都是这个空数组。

**正确解法：存入拷贝 (Slice / Copy)**
把那一行的切片拷贝（相当于复制了一个快照）放进结果里：

```python
    if i == 3:
        ans.append(path[:])  # 正确：path[:] 会创建当前状态的浅拷贝
        return
```

## 坑点 3：嵌套函数中的 `UnboundLocalError`

> **症状**：在 `dfs` 内部修改外面的变量，读的时候没问题，一赋值就报错 `UnboundLocalError`。

为了不传一堆参数，我们经常把 `dfs` 写在 `solve` 函数里面。

```python
def solve():
    count = 0
    visited = [False] * 10
    
    def dfs(u):
        visited[u] = True  # ✅ 没问题
        count += 1         # ❌ 报错：local variable 'count' referenced before assignment
        
    dfs(0)
```

**为什么会这样？**
Python 的作用域规则：如果你在内部函数里**尝试给一个变量赋值（`count += 1` 等同于 `count = count + 1`）**，Python 会默认认为 `count` 是当前函数的局部变量。既然是局部变量，你还没定义怎么就 `+ 1` 呢？所以报错。
那为什么 `visited[u] = True` 不报错？因为这是在**修改**对象的内容，而不是给 `visited` 变量本身重新**赋值**。

**正确解法：使用 `nonlocal` 声明**
明确告诉 Python：这个变量不是局部的，去外面那一层找！

```python
def solve():
    count = 0
    def dfs(u):
        nonlocal count  # ✅ 声明 count 是外层变量
        count += 1
```
*(注意：如果你的变量在最外层（全局作用域），则用 `global count`)*

## 坑点 4：递归爆栈与隐藏的 $O(N)$ 陷阱

作为 C++ 选手，我们在时间复杂度和常数上是有洁癖的。但到了 Python，容易因为不熟悉底层而翻车。

### 1. 递归深度限制
Python 默认的递归深度非常小（通常是 1000）。在跑稍微大一点的数据（比如图的 DFS、树的遍历）时，会直接报 `RecursionError`。
**解法**：在代码最开头解除封印：
```python
import sys
sys.setrecursionlimit(200000) # 将递归深度改大
```

### 2. 队列的弹出 `pop(0)`
在写 BFS 时，如果你用列表当作队列：
```python
q = [1, 2, 3]
u = q.pop(0) # ❌ 极度慢！
```
C++ 的 `vector.erase(begin)` 是 $O(N)$ 的，Python 的 `list.pop(0)` 同样是 $O(N)$ 的。如果队列很长，这会直接让你 TLE。
**解法**：必须使用自带的双端队列 `collections.deque`：
```python
from collections import deque
q = deque([1, 2, 3])
u = q.popleft() # ✅ O(1) 弹出
```

### 3. 频繁的字符串拼接
如果在循环里拼答案：
```python
s = ""
for i in range(10000):
    s += str(i) # ❌ 每次拼接都会重新分配内存
```
**解法**：先放进列表，最后用 `join`，这是 $O(N)$ 的标准写法：
```python
s_list = []
for i in range(10000):
    s_list.append(str(i))
s = "".join(s_list) # ✅
```

## 总结

Python 是一把瑞士军刀，但刀刃极其锋利。记住下面 4 句口诀，能避免你 99% 的转语言痛苦：
1. **多维数组推导建** (`[[0]*m for _ in range(n)]`)
2. **存入答案要切片** (`ans.append(path[:])`)
3. **闭包赋值 nonlocal**
4. **递归记得开上限** (`sys.setrecursionlimit`)
