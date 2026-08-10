---
title: "第一章 函数与极限 — 经典习题"
date: 2026-08-10
toc: true
tags: ["数学", "高等数学"]
categories: ["高等数学"]
---

以下题目来自课本和常见考题，按知识点分类，每题给出详细思路和解答。

## 一、用定义证明极限

### ε-N 语言（数列）

> [!EXAMPLE] 1.1
> 用定义证明 $\displaystyle\lim_{n\to\infty} \frac{n}{n+1} = 1$。
>
> **分析**：要证 $\forall\varepsilon>0$，$\exists N$ 使 $n>N$ 时有 $\left|\frac{n}{n+1}-1\right|<\varepsilon$。
>
> **解**：
> $$\left|\frac{n}{n+1}-1\right| = \left|\frac{-1}{n+1}\right| = \frac{1}{n+1}$$
> 令 $\frac{1}{n+1}<\varepsilon$，得 $n > \frac{1}{\varepsilon}-1$。
>
> 取 $N = \left[\frac{1}{\varepsilon}-1\right]$（取整），则 $n>N$ 时恒有 $\left|\frac{n}{n+1}-1\right|<\varepsilon$。$\square$

> [!EXAMPLE] 1.2
> 用定义证明 $\displaystyle\lim_{n\to\infty} \frac{1}{2^n} = 0$。
>
> **解**：$\left|\frac{1}{2^n}-0\right| = \frac{1}{2^n}$。令 $\frac{1}{2^n}<\varepsilon$，得 $2^n > \frac{1}{\varepsilon}$，$n > \log_2\frac{1}{\varepsilon}$。
>
> 取 $N = \left[\log_2\frac{1}{\varepsilon}\right]$，则 $n>N$ 时 $\frac{1}{2^n}<\varepsilon$。$\square$

### ε-δ 语言（函数）

> [!EXAMPLE] 1.3
> 用定义证明 $\displaystyle\lim_{x\to 2} (3x-1) = 5$。
>
> **分析**：要证 $\forall\varepsilon>0$，$\exists\delta>0$，使 $0<|x-2|<\delta$ 时 $|3x-1-5|<\varepsilon$。
>
> **解**：$|(3x-1)-5| = |3x-6| = 3|x-2|$。
>
> 令 $3|x-2|<\varepsilon$，得 $|x-2|<\frac{\varepsilon}{3}$。取 $\delta = \frac{\varepsilon}{3}$ 即可。$\square$

> [!TIP] 这类题的套路
> 1. 写出 $|f(x)-A|$ 的表达式
> 2. 把它和 $|x-x_0|$ 挂钩（放缩或因式分解）
> 3. 令 $<\varepsilon$，反解出 $\delta$

> [!EXAMPLE] 1.4
> 用定义证明 $\displaystyle\lim_{x\to 2} x^2 = 4$。
>
> **解**：$|x^2-4| = |x-2|\cdot|x+2|$。
>
> 限定 $|x-2|<1$，则 $1<x<3$，$3<|x+2|<5$。
>
> 于是 $|x^2-4| < 5|x-2|$。令 $5|x-2|<\varepsilon$，得 $|x-2|<\frac{\varepsilon}{5}$。
>
> 取 $\delta = \min\!\left(1, \frac{\varepsilon}{5}\right)$ 即可。$\square$

> [!WARNING] 关键技巧
> 当 $|f(x)-A|$ 无法直接化成 $|x-x_0|$ 的简单倍数时，先限制 $x$ 的范围（如 $|x-x_0|<1$），把另一部分放缩成常数。

## 二、极限运算法则

> [!EXAMPLE] 2.1
> 求 $\displaystyle\lim_{x\to 1} \frac{x^2-1}{x-1}$。
>
> **解**：$\frac{0}{0}$ 型，先约分：
> $$\lim_{x\to 1} \frac{(x-1)(x+1)}{x-1} = \lim_{x\to 1} (x+1) = 2$$

> [!EXAMPLE] 2.2
> 求 $\displaystyle\lim_{x\to 0} \frac{\sqrt{x+1}-1}{x}$。
>
> **解**：$\frac{0}{0}$ 型，有理化分子：
> $$\frac{\sqrt{x+1}-1}{x} = \frac{(\sqrt{x+1}-1)(\sqrt{x+1}+1)}{x(\sqrt{x+1}+1)} = \frac{x}{x(\sqrt{x+1}+1)} = \frac{1}{\sqrt{x+1}+1}$$
> 当 $x\to 0$ 时，极限为 $\frac{1}{2}$。

> [!EXAMPLE] 2.3
> 求 $\displaystyle\lim_{x\to\infty} \frac{3x^3+2x-1}{5x^3-x^2+4}$。
>
> **解**：$\frac{\infty}{\infty}$ 型，分子分母同除以最高次幂 $x^3$：
> $$\lim_{x\to\infty} \frac{3+\frac{2}{x^2}-\frac{1}{x^3}}{5-\frac{1}{x}+\frac{4}{x^3}} = \frac{3}{5}$$

> [!TIP] $\frac{\infty}{\infty}$ 型套路
> 分子分母同除以最高次幂，其余项 → 0，极限 = 最高次项系数之比。

## 三、夹逼定理

> [!EXAMPLE] 3.1
> 求 $\displaystyle\lim_{n\to\infty} \sqrt[n]{2^n+3^n}$。
>
> **解**：$\sqrt[n]{3^n} < \sqrt[n]{2^n+3^n} < \sqrt[n]{2\cdot 3^n}$，即
> $$3 < \sqrt[n]{2^n+3^n} < 3\cdot\sqrt[n]{2}$$
> 而 $\sqrt[n]{2}\to 1$，由夹逼定理，极限为 $3$。

> [!EXAMPLE] 3.2
> 求 $\displaystyle\lim_{n\to\infty} \left(\frac{1}{\sqrt{n^2+1}} + \frac{1}{\sqrt{n^2+2}} + \cdots + \frac{1}{\sqrt{n^2+n}}\right)$。
>
> **解**：$n$ 项和，每项都在 $\frac{1}{\sqrt{n^2+n}}$ 和 $\frac{1}{\sqrt{n^2+1}}$ 之间。
>
> $$\frac{n}{\sqrt{n^2+n}} < S_n < \frac{n}{\sqrt{n^2+1}}$$
> 而 $\displaystyle\lim_{n\to\infty} \frac{n}{\sqrt{n^2+n}} = \lim_{n\to\infty} \frac{1}{\sqrt{1+\frac{1}{n}}} = 1$，同理上界也为 $1$。
>
> 由夹逼定理，$\lim S_n = 1$。

## 四、两个重要极限

> [!EXAMPLE] 4.1
> 求 $\displaystyle\lim_{x\to 0} \frac{\sin 2x}{x}$。
>
> **解**：$\frac{\sin 2x}{x} = 2\cdot\frac{\sin 2x}{2x} \to 2\cdot 1 = 2$

> [!EXAMPLE] 4.2
> 求 $\displaystyle\lim_{x\to 0} \frac{\tan x - \sin x}{x^3}$。
>
> **解**（用重要极限 + 变形，不用等价无穷小）：
> $$\frac{\tan x - \sin x}{x^3} = \frac{\sin x(1-\cos x)}{x^3\cos x} = \frac{\sin x}{x} \cdot \frac{1-\cos x}{x^2} \cdot \frac{1}{\cos x}$$
> $\frac{\sin x}{x}\to 1$，$\frac{1-\cos x}{x^2} = \frac{2\sin^2(x/2)}{x^2} = \frac{1}{2}\cdot\frac{\sin^2(x/2)}{(x/2)^2}\to\frac{1}{2}$，$\frac{1}{\cos x}\to 1$。
>
> 极限为 $1\cdot\frac{1}{2}\cdot 1 = \frac{1}{2}$。

> [!EXAMPLE] 4.3
> 求 $\displaystyle\lim_{x\to 0} (1+3x)^{\frac{1}{x}}$。
>
> **解**：利用 $(1+x)^{\frac{1}{x}}\to e$ 的等价形式：
> $$(1+3x)^{\frac{1}{x}} = \left[(1+3x)^{\frac{1}{3x}}\right]^3 \to e^3$$

> [!EXAMPLE] 4.4
> 求 $\displaystyle\lim_{x\to\infty} \left(1-\frac{2}{x}\right)^{3x}$。
>
> **解**：$\left(1-\frac{2}{x}\right)^{3x} = \left[\left(1+\frac{-2}{x}\right)^{\frac{x}{-2}}\right]^{-6} \to e^{-6}$

> [!TIP] 第二重要极限的通用处理方法
> 形如 $\lim (1+u)^v$，其中 $u\to 0$ 且 $v\to\infty$ 时：
> $$\lim (1+u)^v = e^{\lim u\cdot v}$$
> 例如 4.4：$u=-\frac{2}{x},\ v=3x$，$\lim u\cdot v = -6$，极限 $e^{-6}$。

## 五、等价无穷小代换

> [!EXAMPLE] 5.1
> 求 $\displaystyle\lim_{x\to 0} \frac{\ln(1+3x)}{\sin 2x}$。
>
> **解**：$x\to 0$ 时 $\ln(1+3x)\sim 3x$，$\sin 2x\sim 2x$：
> $$\lim_{x\to 0} \frac{3x}{2x} = \frac{3}{2}$$

> [!EXAMPLE] 5.2
> 求 $\displaystyle\lim_{x\to 0} \frac{e^{2x}-1}{\tan 3x}$。
>
> **解**：$x\to 0$ 时 $e^{2x}-1\sim 2x$，$\tan 3x\sim 3x$：
> $$\lim_{x\to 0} \frac{2x}{3x} = \frac{2}{3}$$

> [!EXAMPLE] 5.3
> 求 $\displaystyle\lim_{x\to 0} \frac{\sqrt[3]{1+x}-1}{\sin x}$。
>
> **解**：由 $(1+x)^\alpha-1\sim \alpha x$，$\sqrt[3]{1+x}-1 = (1+x)^{1/3}-1 \sim \frac{1}{3}x$。
>
> 分母 $\sin x\sim x$：
> $$\lim_{x\to 0} \frac{\frac{1}{3}x}{x} = \frac{1}{3}$$

> [!EXAMPLE] 5.4（经典陷阱题）
> 求 $\displaystyle\lim_{x\to 0} \frac{\tan x - \sin x}{x^3}$。
>
> **注意**：不能直接把 $\tan x$ 和 $\sin x$ 都换成 $x$，那样就是 $\frac{x-x}{x^3}=0$，错误！
>
> **正确做法**：先变形再代换：
> $$\frac{\tan x - \sin x}{x^3} = \frac{\sin x(\frac{1}{\cos x}-1)}{x^3} = \frac{\sin x(1-\cos x)}{x^3\cos x}$$
> 将乘积因子 $\sin x\to x$，$1-\cos x\to \frac{x^2}{2}$：
> $$\lim_{x\to 0} \frac{x\cdot\frac{x^2}{2}}{x^3\cos x} = \lim_{x\to 0} \frac{1}{2\cos x} = \frac{1}{2}$$

> [!WARNING] 等价无穷小代换的黄金法则
> **代换仅限乘积因子，绝不能用于加减项！**

## 六、连续性判定与间断点分类

> [!EXAMPLE] 6.1
> 讨论 $f(x)=\begin{cases} x\sin\frac{1}{x}, & x\neq 0 \\ 0, & x=0 \end{cases}$ 在 $x=0$ 处的连续性。
>
> **解**：当 $x\neq 0$ 时，$\left|x\sin\frac{1}{x}\right|\le |x|$。
>
> $\displaystyle\lim_{x\to 0} x\sin\frac{1}{x} = 0$（无穷小 × 有界量 = 无穷小）。而 $f(0)=0$。
>
> 所以 $\displaystyle\lim_{x\to 0} f(x) = f(0)$，$f(x)$ 在 $x=0$ 连续。

> [!EXAMPLE] 6.2
> 找出 $f(x)=\frac{x^2-1}{x^2-3x+2}$ 的间断点并判断类型。
>
> **解**：分母 $x^2-3x+2=(x-1)(x-2)=0$，间断点为 $x=1$ 和 $x=2$。
>
> - $x=1$：$f(x)=\frac{(x-1)(x+1)}{(x-1)(x-2)}=\frac{x+1}{x-2}\;(x\neq 1)$。$\displaystyle\lim_{x\to 1}f(x)=\frac{2}{-1}=-2$。
>
>   左右极限存在且相等（$=-2$），但 $f(1)$ 无定义 → **可去间断点**。
>
> - $x=2$：$\displaystyle\lim_{x\to 2}\frac{x+1}{x-2} = \infty$ → **无穷间断点**（第二类）。

> [!EXAMPLE] 6.3
> 讨论 $f(x)=\begin{cases} e^{1/x}, & x>0 \\ \ln(1-x), & x\le 0 \end{cases}$ 在 $x=0$ 处的连续性。
>
> **解**：
> - 左极限：$\displaystyle\lim_{x\to 0^-} \ln(1-x) = 0$
> - 右极限：$\displaystyle\lim_{x\to 0^+} e^{1/x} = +\infty$
> - $f(0) = \ln(1-0) = 0$
>
> 右极限不存在（$+\infty$），故 $x=0$ 是**第二类间断点**（无穷间断点）。

## 七、零点定理

> [!EXAMPLE] 7.1
> 证明 $x^3-3x+1=0$ 在 $(1,2)$ 内至少有一个根。
>
> **解**：令 $f(x)=x^3-3x+1$，在 $[1,2]$ 连续。
>
> $f(1)=1-3+1=-1<0$，$f(2)=8-6+1=3>0$。
>
> $f(1)\cdot f(2)<0$，由零点定理，存在 $\xi\in(1,2)$ 使 $f(\xi)=0$。$\square$

> [!EXAMPLE] 7.2
> 证明 $e^x = 3x$ 在 $(0,1)$ 内至少有一个根。
>
> **解**：令 $f(x)=e^x-3x$，在 $[0,1]$ 连续。
>
> $f(0)=1>0$，$f(1)=e-3\approx 2.718-3 = -0.282<0$。
>
> $f(0)\cdot f(1)<0$，由零点定理，存在 $\xi\in(0,1)$ 使 $f(\xi)=0$，即 $e^\xi=3\xi$。$\square$

> [!EXAMPLE] 7.3（介值定理）
> 证明方程 $x^5-3x=1$ 在 $(1,2)$ 内恰有一个实根。
>
> **解**：令 $f(x)=x^5-3x-1$。
>
> $f(1)=-3<0$，$f(2)=32-6-1=25>0$，由零点定理至少有一个根。
>
> 又 $f'(x)=5x^4-3>0$ 在 $(1,2)$ 恒成立，$f(x)$ 严格单调增，故根**恰好一个**。
>
> 单调性 + 零点定理 = 唯一根。

## 八、综合题

> [!EXAMPLE] 8.1
> 已知 $\displaystyle\lim_{x\to 0} \frac{\sqrt{1+f(x)\sin 2x}-1}{e^{3x}-1} = 1$，求 $\displaystyle\lim_{x\to 0} f(x)$。
>
> **解**：当 $x\to 0$ 时：
> - 分母 $e^{3x}-1\sim 3x$
> - 分子 $\sqrt{1+u}-1\sim \frac{1}{2}u$，其中 $u=f(x)\sin 2x\sim 2xf(x)$
>
> 所以分子 $\sim \frac{1}{2}\cdot 2xf(x) = xf(x)$。
>
> 原极限 $\displaystyle\lim_{x\to 0} \frac{xf(x)}{3x} = \frac{1}{3}\lim_{x\to 0} f(x) = 1$，故 $\displaystyle\lim_{x\to 0} f(x) = 3$。

> [!EXAMPLE] 8.2
> 设 $f(x)$ 在 $x=0$ 连续，且 $\displaystyle\lim_{x\to 0} \frac{f(x)}{x} = 2$。求 $f(0)$ 和 $f'(0)$。
>
> **解**：由于 $\lim\frac{f(x)}{x}=2$ 存在，且分母 $x\to 0$，必有分子 $f(x)\to 0$。
>
> 由连续性，$f(0)=\lim_{x\to 0}f(x)=0$。
>
> 又 $f'(0)=\displaystyle\lim_{x\to 0}\frac{f(x)-f(0)}{x-0} = \lim_{x\to 0}\frac{f(x)}{x}=2$。
>
> 故 $f(0)=0$，$f'(0)=2$。

---

> [返回第一章目录](./)
