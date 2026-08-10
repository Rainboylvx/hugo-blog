---
title: "第一章 — 函数的极限、运算法则与存在准则（§3,§5,§6）"
date: 2025-09-16
toc: true
tags: ["数学"]
categories: ["高等数学"]
---

本节对应课本 **§3 函数的极限** + **§5 极限运算法则** + **§6 极限存在准则与两个重要极限**。

数列的极限讨论的是 $n \to \infty$ 时 $a_n$ 的趋近行为。函数的极限讨论的是 $x$ 趋近于某个值（或无穷）时 $f(x)$ 的趋近行为，比数列极限更丰富。

## §3 函数的极限

### 3.1 导入：切线斜率问题

$y = x^2$ 在 $(1,1)$ 处切线的斜率是多少？

在曲线上取点 $(1,1)$ 和邻近点 $(x, x^2)$，割线斜率为：

$$
k(x) = \frac{x^2 - 1}{x - 1} = \frac{(x-1)(x+1)}{x-1} = x + 1 \quad (x \neq 1)
$$

当 $x \to 1$ 时，$k(x) \to 2$。但 $x=1$ 时分母为 0，$k(x)$ 无定义。**函数在趋向某点时能有多接近某个值——这就是函数极限要精确描述的事情。**

### 3.2 $x \to x_0$ 时的极限

> [!IDEA] $\varepsilon$-$\delta$ 定义
> 设函数 $f(x)$ 在 $x_0$ 的某去心邻域内有定义。如果存在常数 $A$，使得：
> $$\forall \varepsilon > 0,\ \exists \delta > 0,\ \text{当}\ 0 < |x - x_0| < \delta\ \text{时，恒有}\ |f(x) - A| < \varepsilon$$
> 则称 $A$ 是 $f(x)$ 当 $x \to x_0$ 时的极限，记作
> $$\lim_{x \to x_0} f(x) = A$$

> [!TIP] 理解要点
> - $\varepsilon$ 是任给的误差，$\delta$ 是因你而定的邻域半径。
> - $0 < |x-x_0|$ 意味着 $x \neq x_0$——**极限关心的是趋近过程，不关心函数在 $x_0$ 点是否有定义。**
> - 逻辑方向：先给 $\varepsilon$ → 再找 $\delta$。$\delta$ 可以随 $\varepsilon$ 变化。

### 3.3 左极限与右极限

> [!IDEA] 左极限
> $x$ 从 $x_0$ 的**左侧**趋近（$x < x_0$）：
> $$\lim_{x \to x_0^-} f(x) = A \quad \text{或} \quad f(x_0^-) = A$$

> [!IDEA] 右极限
> $x$ 从 $x_0$ 的**右侧**趋近（$x > x_0$）：
> $$\lim_{x \to x_0^+} f(x) = A \quad \text{或} \quad f(x_0^+) = A$$

> [!IMPORTANT] 
> $\displaystyle\lim_{x \to x_0} f(x) = A \iff \lim_{x \to x_0^-} f(x) = \lim_{x \to x_0^+} f(x) = A$
>
> 函数极限存在 $\iff$ 左右极限都存在且相等。

### 3.4 $x \to \infty$ 时的极限

> [!IDEA]
> 如果 $\forall \varepsilon > 0$，$\exists X > 0$，当 $|x| > X$ 时有 $|f(x) - A| < \varepsilon$，则 $\displaystyle\lim_{x \to \infty} f(x) = A$。
>
> 例如 $\displaystyle\lim_{x \to \infty} \frac{1}{x} = 0$。

### 3.5 函数极限的性质

这些性质与数列极限类似，区别在于作用的范围是"局部"（$x_0$ 的某去心邻域）。

> [!IMPORTANT] 唯一性
> 若 $\displaystyle\lim_{x \to x_0} f(x)$ 存在，则极限唯一。

> [!IMPORTANT] 局部有界性
> 若 $\displaystyle\lim_{x \to x_0} f(x) = A$，则存在 $\delta > 0$，使得 $f(x)$ 在 $(x_0-\delta, x_0+\delta) \setminus \{x_0\}$ 内有界。

> [!IMPORTANT] 局部保号性
> 若 $\displaystyle\lim_{x \to x_0} f(x) = A > 0$，则在 $x_0$ 附近 $f(x) > 0$（同号）。
> 反之，若在 $x_0$ 附近 $f(x) \ge 0$ 且极限存在，则 $A \ge 0$。

> [!IMPORTANT] 函数极限与数列极限的关系（海涅定理/归结原则）
> $\displaystyle\lim_{x \to x_0} f(x) = A \iff$ 对任意以 $x_0$ 为极限的数列 $\{x_n\}\ (x_n \neq x_0)$，都有 $\displaystyle\lim_{n\to\infty} f(x_n) = A$。
>
> 这个定理把函数极限化归为数列极限。用处：证明函数极限不存在——找两个趋于 $x_0$ 的数列，$f(x_n)$ 趋于不同值。

## §5 极限运算法则

> [!IDEA] 四则运算法则
> 如果 $\displaystyle\lim a_n = A$，$\displaystyle\lim b_n = B$（数列或函数均适用），则：
> $$
> \begin{align}
> \lim(a_n \pm b_n) &= A \pm B \tag{1}\\[4pt]
> \lim(a_n \cdot b_n) &= A \cdot B \tag{2}\\[4pt]
> \lim\frac{a_n}{b_n} &= \frac{A}{B} \quad (b_n \neq 0,\ B \neq 0) \tag{3}
> \end{align}
> $$

> [!WARNING] 注意
> 1. 法则可推广到**有限个**（不能推广到无限个）。
> 2. 前提：各项极限必须存在。
> 3. 分母极限不能为零。
> 4. 遇到 $\frac{0}{0}$ 或 $\frac{\infty}{\infty}$ 型，需要先变形（通分、有理化、变量代换等）。

### 5.1 复合函数极限运算法则

> [!IMPORTANT]
> 设 $\displaystyle\lim_{x \to x_0} g(x) = u_0$，$\displaystyle\lim_{u \to u_0} f(u) = A$，且在 $x_0$ 的某去心邻域内 $g(x) \neq u_0$，则
> $$\lim_{x \to x_0} f[g(x)] = A$$

### 5.2 无穷等比数列的求和（应用）

> [!IDEA]
> 等比数列 $\{aq^{n-1}\}$ 的前 $n$ 项和：
> $$S_n = a + aq + aq^2 + \cdots + aq^{n-1}$$

推导：

$$
\begin{aligned}
S_n &= a + aq + aq^2 + \cdots + aq^{n-1} \\
q S_n &= aq + aq^2 + \cdots + aq^{n-1} + aq^n
\end{aligned}
$$

两式相减得 $(1-q)S_n = a - aq^n$，故：

$$
S_n = \frac{a(1-q^n)}{1-q}
$$

> [!IMPORTANT] 无穷等比级数的和（$|q| < 1$）
> 当 $|q| < 1$ 时，$\displaystyle\lim_{n\to\infty} q^n = 0$，所以：
> $$\lim_{n\to\infty} S_n = \frac{a}{1-q}$$
> 当 $|q| \ge 1$ 时级数发散。

## §6 极限存在准则

### 6.1 夹逼定理

> [!IMPORTANT] 夹逼定理（数列/函数均适用）
> 若 $\{a_n\}$、$\{b_n\}$、$\{c_n\}$ 满足：
> 1. $a_n \le b_n \le c_n$（从某项起）
> 2. $\displaystyle\lim a_n = \lim c_n = A$
>
> 则 $\displaystyle\lim b_n = A$。
>
> 函数的夹逼定理类似：$g(x) \le f(x) \le h(x)$ 且 $\lim g = \lim h = A$，则 $\lim f = A$。

核心思路：两边夹住，中间跑不掉。是求极限的重要工具。

### 6.2 单调有界定理

> [!IMPORTANT]
> 单调有界数列必有极限。
> - 单调递增且有上界 → 极限为**上确界**
> - 单调递减且有下界 → 极限为**下确界**

这个定理只告诉我们极限存在，但不保证容易算出来。下面用它来证明第二个重要极限。

### 6.3 两个重要极限

$$
\begin{align}
&\lim_{x \to 0} \frac{\sin x}{x} = 1 \tag{I}\\[6pt]
&\lim_{x \to \infty} \left(1 + \frac{1}{x}\right)^x = e \tag{II}
\end{align}
$$

#### (I) $\displaystyle\lim_{x \to 0} \frac{\sin x}{x} = 1$

> [!TIP] 证明思路（单位圆 + 夹逼）
> 在单位圆中，当 $0 < x < \frac{\pi}{2}$ 时有：
> $$\sin x < x < \tan x$$
> 除以 $\sin x$ 得：$1 < \dfrac{x}{\sin x} < \dfrac{1}{\cos x}$
> 取倒数：$\cos x < \dfrac{\sin x}{x} < 1$
> 由夹逼定理，$x \to 0^+$ 时极限为 1。$x \to 0^-$ 同理。

> [!EXAMPLE] 推论
> $\displaystyle\lim_{x \to 0} \frac{\tan x}{x} = 1$，$\displaystyle\lim_{x \to 0} \frac{1-\cos x}{x^2} = \frac{1}{2}$

#### (II) $\displaystyle\lim_{x \to \infty} \left(1 + \frac{1}{x}\right)^x = e$

> [!TIP] 证明思路（单调有界定理）
> - 考虑数列 $x_n = (1+\frac{1}{n})^n$，展开后用二项式定理。
> - 证 $x_n$ 单调递增：$x_n < x_{n+1}$（展开对比）
> - 证 $x_n$ 有上界：$x_n < 3$
> - 由单调有界定理，$\lim x_n$ 存在，定义为 $e \approx 2.71828\cdots$
> - 再推广到 $x \to \infty$（实变量）的情形，用夹逼定理。

> [!IMPORTANT] 等价形式
> $$\lim_{x \to 0} (1 + x)^{\frac{1}{x}} = e$$

![](https://s2.loli.net/2025/09/19/71kWvwXg2jrtLET.png)

> 来自: https://www.geogebra.org/m/h6DxENYh

> 继续阅读：[§4 + §7 无穷小与无穷大](./chapter1-3)
