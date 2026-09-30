---
title: "Pythonic 代码去哪里练：题库、点评与 lint 闭环"
date: 2026-09-28
draft: true
toc: true
tags: ["Python", "Pythonic", "代码风格", "练习方法"]
---

你在洛谷上 AC 了一道题，代码 60 行：`for` 套 `for`、一堆 `tmp`、建了三个数组。旁边有人 25 行写完，用了 `defaultdict`、`@cache` 和一个生成器。两边的评测结果一模一样——**都是 AC**。

这不是因为你"不会 Python"，而是因为**你在一个不提供风格反馈的地方练习**。OJ 的判分器只回答"对不对"，从不回答"能不能写得更清楚"。

想练 Pythonic，需要的是三类反馈：**有人给你点评**、**有高手解让你对比**、**有工具指出"这里可以不这么写"**。本文按这三类给出可用的场地，再给一套能直接跑的 lint 闭环和一张交付前自检表。

## 1. 为什么刷 OJ 练不出 Pythonic

先明确 Pythonic 到底指什么。它不是"用得多"、也不等于"写得短"，而是三条：

1. **用语言内建的抽象表达意图**：要"取不到就返回默认值"就用 `dict.get`，而不是先 `if key in d`；
2. **让数据形状决定容器**：值到至多两个生产者，就用一个 `dict` 而不是两条定长数组；
3. **把重复劳动交给标准库**：`@cache`、`itertools`、推导式。

对照这三条看，OJ 的问题就很清楚了：

- **它只反馈正确性**。`for` 循环和推导式在它眼里等价，`tmp` 和 `can_start` 也等价；
- **它的时间限制反向惩罚 Pythonic**。为了不被卡常数，很多人会退回 C++ 式写法（定长数组、手写建表），这恰好是反 Pythonic 的方向；
- **Code Golf 是另一个极端**。它的目标是**字符数最短**，而 Pythonic 的目标是**清晰**。同一段逻辑，最短的写法往往需要注释才能读：

```python
# 最短，但需要读懂 setdefault 的返回值语义
nxt[v] = person if nxt.setdefault(v, person) == person else ANY
```

这段代码在 golf 场上是好答案，在工程和教学里必须配一行"本轮首次出现 value、或唯一生产者还是自己 → person，否则 ANY"的注释才算合格。**短和清晰是两个指标，OJ 只奖励其中一个。**

## 2. 三类练习场

| 站点 | 给的反馈 | 适合练什么 | 成本 |
| --- | --- | --- | --- |
| [Exercism](https://exercism.org/tracks/python) | **mentor 逐题点评** + 读完题后能看别人的解 | 局部 idiom、命名、测试意识 | 免费（可申请 mentoring） |
| [Python Morsels](https://www.pythonmorsels.com/) | 每周练习题，交完附**参考解 + 为什么这样写** | 标准库、迭代器、数据结构选型 | 付费 |
| [Codewars](https://www.codewars.com/) | 通过后能看社区解，同题常有五六种写法 | 表达式能力、`itertools`、位运算 | 免费 |
| [Advent of Code](https://adventofcode.com/) | 题本身不教 Python，但 r/adventofcode 的 Python 解质量高 | 完整小项目的结构与拆分 | 免费 |
| [HackerRank Python](https://www.hackerrank.com/domains/python) | 语法分档练习，**没有风格反馈** | 补语法盲区 | 免费 |
| LeetCode / 洛谷 / Codeforces | 只有正确性 | 算法，不练风格 | 免费 |
| Code Golf | 字符数 | 与 Pythonic 目标相反 | 免费 |

用法上有两个关键点，决定这些站点是"练题"还是"练风格"：

- **Codewars 别做完就交**。先自己写一版，提交通过后**再写第二版**，最后对比社区解里最 Pythonic 的那份，找出自己漏掉的哪个标准库工具；
- **Exercism 一定要开 mentoring**。没有点评的 Exercism 就退化成普通题库；被指出"这里可以用 `dict.setdefault`"才是它的价值所在。

## 3. 工具闭环：把 lint 当老师

题库给的是别人的解，工具给的是**针对你自己代码**的反馈，而且能重复跑、零等待。Pythonic 规则已经被几个 linter 编码成规则集了：

```bash
pipx install ruff refurb

# C4=flake8-comprehensions  SIM=flake8-simplify  PERF=perflint
# PIE=flake8-pie  FURB=refurb  UP=pyupgrade  PLR=pylint 重构建议
ruff check --select C4,SIM,PERF,PIE,FURB,UP,PLR main.py

refurb main.py
```

三个它会直接抓出来的例子：

```python
# C4 / SIM：for + append 换成推导式
squares = []
for x in xs:
    squares.append(x * x)
squares = [x * x for x in xs]

# PERF：手写累加换成 sum
total = 0
for x in xs:
    total += x
total = sum(xs)

# SIM：if/else 赋值换成条件表达式
if on_board:
    choices = range(8)
else:
    choices = (None,)
choices = range(8) if on_board else (None,)
```

**但它抓不到结构级的改法。**下面两条都是真实的改进，lint 一条都不会报：

```python
# 之前：先枚举 9^5 种窗口，手工建表
COLORED = bytearray(9 ** 5)
for code in range(9 ** 5):
    ...                     # 还要配 window_code() / decode_window() 两个进制转换函数

# 之后：让表按需生成，编码转换和建表循环一起消失
@cache
def colored_mask(window: tuple[int | None, ...]) -> int:
    ...
```

```python
# 之前：读者在 if 条件里当场解 prev.get 的默认值语义
if prev.get(value, person) != person:
    deadline = pos + k - 1

# 之后：先命名再判断，条件里只留一个已经想清楚的名字
can_start = prev.get(value, person) != person
if can_start:
    deadline = pos + k - 1
```

结论：**lint 管局部 idiom，结构级改法要靠自检表**（第 5 节）。

## 4. 最有效的练法：同题两语言

最省事的练习素材其实是你手上已有的题：**先用 C++ 写一遍正确解，再把它翻成 Pythonic 短解**。

这个流程强在三点：

- **有正确性参照**。C++ 版就是标准答案，Python 版跑样例对拍就知道有没有翻错，注意力可以全放在"表达"上；
- **翻译过程会逼出 idiom**。C++ 的定长数组在 Python 里是 `dict`，C++ 的手写建表在 Python 里是 `@cache`，C++ 的 `for + push_back` 在 Python 里是推导式——每一处都是主动选择，而不是习惯性照抄；
- **复杂度约束还在**。因为有 C++ 版对照，你不会退回暴力枚举，练的是"同样复杂度下换表达"。

一个真实例子：同一道五列窗口 DP，教学版先用 `build_lines()` 生成线表、再把 $9^5$ 种窗口的掩码整表算进 `COLORED`，151 行；Pythonic 版把线表写成四个列表推导，把整表换成 `@cache`，行数掉到 90 行以内，而且 `window_code()` / `decode_window()` 与建表循环整体消失：

```python
# 窗口里所有"经过中间列（列 2）"的三连，共 16 条；每条写成 3 个 (行, 列) 格子。
LINES = (
    [((r, c), (r, c + 1), (r, c + 2)) for r in range(3) for c in range(3)]  # 横向 9 条
    + [((0, 2), (1, 2), (2, 2))]                                           # 纵向 1 条
    + [((0, c), (1, c + 1), (2, c + 2)) for c in range(3)]                  # 右下斜 3 条
    + [((0, c + 2), (1, c + 1), (2, c)) for c in range(3)]                  # 右上斜 3 条
)
```

注意这里的注释：**每个"家族"一行、行尾标数量**。这种注释密度是 Pythonic 短代码的一部分，不是负担——它把"这段推导式在生成什么"从读者脑内推导变成了明示。

## 5. 结构级改法：交付前自检表

风格这个词很难执行，除非把它拆成**可否证**的条目。下面这张表是我自己交付（或让 AI 交付）Python 代码前逐条核对用的，每条都能在代码里指到具体行：

| # | 检查项 | 不通过的样子 |
| --- | --- | --- |
| 1 | 每个函数都能用一句话说清"它回答什么问题" | 有函数说不清职责，只能写"处理一下" |
| 2 | 状态编码的含义只在模块级常量处解释一次 | 哨兵值的含义散落各处，靠读者拼 |
| 3 | 热循环里没有裸的复合表达式 | `if nxt.setdefault(v, p) == p:` 直接进 `if` |
| 4 | 只有一个调用点的单行函数数量 = 0 | 定义了 `add_producer(...)` 却只调用一次 |
| 5 | "单人层 / 单轮层 / 主流程"各占一个函数 | 三层 `for` 全塞在 `main` 里 |
| 6 | 输入里的每个位置量都有名字 | `for _ in range(next(data))`、`range(max(by_round) + 1)` |
| 7 | 主流程只做读入、调用、输出 | 主流程里出现算法判断 |
| 8 | 能用 `dict` / `set` / 生成器的地方不写定长数组或全量预计算 | 手写建表循环；`size=V` 的数组只为查一次 |
| 9 | 谓词用局部变量承载名字，而不是抽单行函数 | `def can_start(prev, value, person) -> bool: return ...` 只被调用一次 |
| 10 | 状态空了就停 | 明知后面全部不可达还老实跑满 R 轮 |

第 4 条和第 9 条看起来矛盾，其实是一条规则的两面：**名字要留在调用点，参数表不要**。

```python
# ✅ 名字在调用点，没有参数表
can_start = prev.get(value, person) != person
if can_start: ...

# ❌ 为一个表达式跳去读参数表
def can_start(prev, value, person) -> bool:
    return prev.get(value, person) != person
```

而"层"相反，必须留成函数——`advance(prev, seqs, k)` 这样的名字本身就是一个可复用的概念，它能让你在阅读主流程时不必展开细节。

## 6. 免费的点评渠道与阅读清单

- **[Code Review Stack Exchange](https://codereview.stackexchange.com/)**：贴上代码，直接问 "how would you make this more Pythonic"，通常能收到"用 `defaultdict`/`itertools.batched`/生成器分层"这类具体建议；
- **r/learnpython**：同样可以贴代码求改写意见，比 SO 更宽容；
- **[Fluent Python](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/)**（Ramalho）：练"读"的能力，讲清每个语法糖背后的数据模型；
- **Python Workout**（Reuven Lerner）：按周做练习册，每道题都有对照解；
- **Raymond Hettinger, "Transforming Code into Beautiful, Idiomatic Python"**：经典的"坏写法 → 好写法"对照演讲，B 站和 YouTube 都有搬运；
- **CPython 标准库源码**：`statistics.py`、`pathlib.py`、`itertools` 文档里的 recipes，是最好的 idiom 范文。

## 小结

一句话：**题库给题目，lint 给局部反馈，自检表给结构反馈，同题两语言给压力。**

如果你的目标是"我写出来的 Python 能被人一眼看懂"，那么练习顺序建议是：

1. 用 lint 闭环（`ruff --select C4,SIM,PERF,PIE,FURB`）清掉所有局部坏习惯；
2. 用同题两语言做主动翻译练习，逼自己每处都做选择；
3. 交付前跑一遍第 5 节的自检表，把"感觉不够 Pythonic"变成具体的待改条目。
