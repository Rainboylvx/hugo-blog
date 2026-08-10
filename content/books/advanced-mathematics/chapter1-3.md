---
title: "第一章 — 无穷小、无穷大及无穷小的比较（§4,§7）"
date: 2025-09-20
toc: true
tags: ["数学"]
categories: ["高等数学"]
---

本节对应课本 **§4 无穷小与无穷大** + **§7 无穷小的比较**。

## §4 无穷小与无穷大

### 4.1 无穷小

> [!IDEA] 定义
> 若 $\displaystyle\lim_{x \to x_0} f(x) = 0$（或 $x \to \infty$ 时），则称 $f(x)$ 为当 $x \to x_0$（或 $x \to \infty$）时的**无穷小**。

> [!WARNING] 重要澄清
> 无穷小是一个**变量**（趋于 0 的函数），不是某个很小的固定数。$0$ 是唯一可以看作无穷小的常数。

> [!IMPORTANT] 无穷小与极限的关系
> $$\lim_{x \to x_0} f(x) = A \iff f(x) = A + \alpha(x)$$
> 其中 $\alpha(x)$ 是 $x \to x_0$ 时的无穷小。
>
> 这个等价关系非常有用：**函数 = 极限值 + 无穷小**。

> [!TIP] 无穷小的运算性质
> - 有限个无穷小的和仍是无穷小
> - 有界函数与无穷小的乘积仍是无穷小
> - 常数与无穷小的乘积仍是无穷小
> - 有限个无穷小的乘积仍是无穷小

### 4.2 无穷大

> [!IDEA] 定义
> 若 $\forall M > 0$，$\exists \delta > 0$，当 $0 < |x-x_0| < \delta$ 时有 $|f(x)| > M$，则称 $x \to x_0$ 时 $f(x)$ 为**无穷大**，记作
> $$\lim_{x \to x_0} f(x) = \infty$$

> [!IMPORTANT] 无穷小与无穷大的关系
> 在自变量的同一变化过程中：
> - 若 $f(x)$ 是无穷大，则 $\dfrac{1}{f(x)}$ 是无穷小。
> - 若 $f(x)$ 是无穷小且 $f(x) \neq 0$，则 $\dfrac{1}{f(x)}$ 是无穷大。

## §7 无穷小的比较

两个无穷小趋于 0 的速度可以不同。比较它们能帮助我们简化极限计算。

### 7.1 定义

> [!IDEA] 高阶、低阶、同阶、等价
> 设 $\alpha, \beta$ 是同一过程的无穷小，且 $\alpha \neq 0$：
>
> | 条件 | 结论 | 记法 |
> |------|------|------|
> | $\displaystyle\lim \frac{\beta}{\alpha} = 0$ | $\beta$ 是 $\alpha$ 的高阶无穷小 | $\beta = o(\alpha)$ |
> | $\displaystyle\lim \frac{\beta}{\alpha} = \infty$ | $\beta$ 是 $\alpha$ 的低阶无穷小 | — |
> | $\displaystyle\lim \frac{\beta}{\alpha} = c \neq 0$ | $\beta$ 与 $\alpha$ 是同阶无穷小 | — |
> | $\displaystyle\lim \frac{\beta}{\alpha} = 1$ | $\beta$ 与 $\alpha$ 是等价无穷小 | $\alpha \sim \beta$ |

> [!TIP] $o(\alpha)$ 的含义
> $o(\alpha)$ 不是某个具体的量，而是表示"比 $\alpha$ 更高阶的无穷小"这个性质。
> 例如 $x^2 = o(x)$（当 $x \to 0$），因为 $\lim \frac{x^2}{x} = 0$。

### 7.2 等价无穷小代换定理

> [!IMPORTANT] 等价无穷小代换定理
> 设 $\alpha \sim \alpha'$，$\beta \sim \beta'$，且 $\displaystyle\lim \frac{\beta'}{\alpha'}$ 存在，则
> $$\lim \frac{\beta}{\alpha} = \lim \frac{\beta'}{\alpha'}$$
>
> **求极限时，可以把乘积因子用等价无穷小替换掉，简化计算。**

> [!WARNING] 代换的注意事项
> - **等价无穷小代换只能用于乘积因子，不能用于加减项！**
> - 例如 $\tan x - \sin x$ 中不能直接把 $\tan x$ 换成 $x$，$\sin x$ 换成 $x$，这会得到 $x - x = 0$，是错误的。

### 7.3 常用等价无穷小

> [!IMPORTANT] 当 $x \to 0$ 时的常用等价无穷小
> $$\begin{aligned}
> \sin x &\sim x, &
> \tan x &\sim x, &
> \arcsin x &\sim x, &
> \arctan x &\sim x \\[2pt]
> 1 - \cos x &\sim \frac{1}{2}x^2, &
> \ln(1+x) &\sim x, &
> e^x - 1 &\sim x, &
> (1+x)^\alpha - 1 &\sim \alpha x
> \end{aligned}$$

**记忆技巧**：前四个是三角/反三角类（都 $\sim x$），后四个是指对幂类。

### 7.4 例题

> [!EXAMPLE] 例1：分段函数的极限
> 设 $f(x) = \begin{cases} x^2, & x < 0 \\ 2, & x = 0 \\ \sin x, & x > 0 \end{cases}$，讨论 $\displaystyle\lim_{x \to 0} f(x)$。
>
> **解**：
> - 左极限：$\displaystyle\lim_{x \to 0^-} f(x) = \lim_{x \to 0^-} x^2 = 0$
> - 右极限：$\displaystyle\lim_{x \to 0^+} f(x) = \lim_{x \to 0^+} \sin x = 0$
> - 左右极限相等，故 $\displaystyle\lim_{x \to 0} f(x) = 0$。注意 $f(0)=2$ 与极限无关。

> [!EXAMPLE] 例2：重要极限
> 求 $\displaystyle\lim_{x \to 0} \frac{\sin 3x}{\sin 5x}$。
>
> **解**：
> $$\lim_{x \to 0} \frac{\sin 3x}{\sin 5x} = \lim_{x \to 0} \frac{\frac{\sin 3x}{3x} \cdot 3x}{\frac{\sin 5x}{5x} \cdot 5x} = \frac{3}{5}$$

> [!EXAMPLE] 例3：等价无穷小代换（加减时要小心）
> 求 $\displaystyle\lim_{x \to 0} \frac{\tan x - \sin x}{x^3}$。
>
> **解**：直接用等价无穷小代换会出错（$\tan x - \sin x$ 是差，不能分别代换）。先变形：
> $$\frac{\tan x - \sin x}{x^3} = \frac{\sin x(\frac{1}{\cos x} - 1)}{x^3} = \frac{\sin x(1-\cos x)}{x^3 \cos x}$$
> 代入 $\sin x \sim x$，$1-\cos x \sim \frac{x^2}{2}$：
> $$\lim_{x \to 0} \frac{x \cdot \frac{x^2}{2}}{x^3 \cos x} = \lim_{x \to 0} \frac{1}{2\cos x} = \frac{1}{2}$$

> [!EXAMPLE] 例4：等价无穷小代换
> 求 $\displaystyle\lim_{x \to 0} \frac{\ln(1+2x)}{\sin 3x}$。
>
> **解**：当 $x \to 0$ 时，$\ln(1+2x) \sim 2x$，$\sin 3x \sim 3x$：
> $$\lim_{x \to 0} \frac{\ln(1+2x)}{\sin 3x} = \lim_{x \to 0} \frac{2x}{3x} = \frac{2}{3}$$

> 继续阅读：[§8~§10 函数的连续性](./chapter1-4)
