---
date: '2025-09-07T20:01:50+08:00'
draft: true
title: 'Latex数学公式手册'
toc: true
---

## 前言

准备整理一下我所使用的Latex数学公式(其实我大部分时间都在使用[katex](https://katex.org/) )

下面列举一些有用的资源

1. katex document https://katex.org/docs/api
2. [LaTeX公式手册(全网最全) - 樱花赞 - 博客园](https://www.cnblogs.com/1024th/p/11623258.html)
3. 这个显示有问题，有时间的话，我会 fork 一下修改 https://1024th.github.io/MathJax_Tutorial_CN/#/quickstart


## Latex 公式手册

> 转载自: https://blog.csdn.net/Yushan_Ji/article/details/134322574

### 基本符号

-----

#### 小写希腊字母

**注：部分希腊字母在数学公式中常以变量形式出现，例如 $\epsilon$ 在数学中一般写法为 $\varepsilon$，$\phi$ 在数学中通常写作 $\varphi$**

| 符号 | 语法 | 符号 | 语法 | 符号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\alpha$ | `\alpha` | $\beta$ | `\beta` | $\gamma$ | `\gamma` |
| $\theta$ | `\theta` | $\varepsilon$ | `\varepsilon` | $\delta$ | `\delta` |
| $\mu$ | `\mu` | $\nu$ | `\nu` | $\eta$ | `\eta` |
| $\zeta$ | `\zeta` | $\lambda$ | `\lambda` | $\psi$ | `\psi` |
| $\sigma$ | `\sigma` | $\xi$ | `\xi` | $\tau$ | `\tau` |
| $\phi$ | `\phi` | $\varphi$ | `\varphi` | $\rho$ | `\rho` |
| $\chi$ | `\chi` | $\omega$ | `\omega` | $\pi$ | `\pi` |

### 大写希腊字母

大写希腊字母通常是小写希腊字母的 LATEX 语法第一个字母改为大写，见下表

| 符号 | 语法 | 符号 | 语法 | 符号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\Sigma$ | `\Sigma` | $\Pi$ | `\Pi` | $\Delta$ | `\Delta` |
| $\Gamma$ | `\Gamma` | $\Psi$ | `\Psi` | $\Theta$ | `\Theta` |
| $\Lambda$ | `\Lambda` | $\Omega$ | `\Omega` | $\Phi$ | `\Phi` |
| $\Xi$ | `\Xi` | | | | |

### 常用字体

默认的字体为 $ABCdef$，也就是 `\mathnormal{ABCdef}`（当然，打公式的时候不需要加上这个 `\mathnormal`，直接打字母就是这个效果）

| 字体 | 语法 | 字体 | 语法 |
| :--- | :--- | :--- | :--- |
| $\mathrm{ABCdef}$ | `\mathrm{ABCdef}` | $\mathbf{ABCdef}$ | `\mathbf{ABCdef}` |
| $\mathit{ABCdef}$ | `\mathit{ABCdef}` | $\pmb{ABCdef}$ | `\pmb{ABCdef}` |
| $\mathscr{ABCdef}$ | `\mathscr{ABCdef}` | $\mathcal{ABCdef}$ | `\mathcal{ABCdef}` |
| $\mathfrak{ABCdef}$ | `\mathfrak{ABCdef}` | $\mathbb{ABCdef}$ | `\mathbb{ABCdef}` |

### 常见运算符

| 运算符 | 语法 | 运算符 | 语法 | 运算符 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $+$ | `+` | $-$ | `-` | $\\times$ | `\times` |
| $\\pm$ | `\pm` | $\\cdot$ | `\cdot` | $\\ast$ | `\ast` |
| $\\cup$ | `\cup` | $\\cap$ | `\cap` | $\\circ$ | `\circ` |
| $\\lor$ | `\lor` 或 `\vee` | $\\land$ | `\land` 或 `\wedge` | $\\lnot$ | `\lnot` |
| $\\oplus$ | `\oplus` | $\\ominus$ | `\ominus` | $\\otimes$ | `\otimes` |
| $\\odot$ | `\odot` | $\\oslash$ | `\oslash` | $\\bullet$ | `\bullet` |
| $\\sqrt{x}$ | `\sqrt{x}` | $\\sqrt[n]{x}$ | `\sqrt[n]{x}` | | |

### 大尺寸运算符

| 运算符 | 语法 | 运算符 | 语法 | 运算符 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\sum$ | `\sum` | $\prod$ | `\prod` | $\int$ | `\int` |
| $\bigcup$ | `\bigcup` | $\bigcap$ | `\bigcap` | $\oint$ | `\oint` |
| $\bigvee$ | `\bigvee` | $\bigwedge$ | `\bigwedge` | $\iint$ | `\iint` |
| $\coprod$ | `\coprod` | $\bigsqcup$ | `\bigsqcup` | $\oiint$ | `\oiint` |

### 常见关系符号

| 符号 | 语法 | 符号 | 语法 | 符号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $<$ | `<` | $\>$ | `>` | $=$ | `=` |
| $\leq$ | `\leq` | $\geq$ | `\geq` | $\neq$ | `\neq` |
| $\ll$ | `\ll` | $\gg$ | `\gg` | $\equiv$ | `\equiv` |
| $\subset$ | `\subset` | $\supset$ | `\supset` | $\approx$ | `\approx` |
| $\subseteq$ | `\subseteq` | $\supseteq$ | `\supseteq` | $\sim$ | `\sim` |
| $\in$ | `\in` | $\ni$ | `\ni` | $\propto$ | `\propto` |
| $\vdash$ | `\vdash` | $\dashv$ | `\dashv` | $\models$ | `\models` |
| $\mid$ | `\mid` | $\parallel$ | `\parallel` | $\perp$ | `\perp` |
| $\notin$ | `\notin` | $\Join$ | `\Join` | $\nsim$ | `\nsim` |
| $\subsetneq$ | `\subsetneq` | $\supsetneq$ | `\supsetneq` | | |

### 数学模式重音符

| 符号 | 语法 | 符号 | 语法 | 符号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\\hat{a}$ | `\hat{a}` | $\\bar{a}$ | `\bar{a}` | $\\tilde{a}$ | `\tilde{a}` |
| $\\vec{a}$ | `\vec{a}` | $\\dot{a}$ | `\dot{a}` | $\\ddot{a}$ | `\ddot{a}` |
| $\\widehat{abc}$ | `\widehat{abc}` | $\\widetilde{abc}$ | `\widetilde{abc}` | $\\overline{abc}$ | `\overline{abc}` |

### 箭头

如果需要长箭头，只需要在语法前面加上 `\long`，例如 `\longleftarrow` 即为 $\\longleftarrow$，如果加上 `\Long` 则变为双线长箭头，例如 `\Longleftarrow` 即为 $\\Longleftarrow$

| 符号 | 语法 | 符号 | 语法 | 符号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\\leftarrow$ | `\leftarrow` | $\\rightarrow$ | `\rightarrow` | $\\leftrightarrow$ | `\leftrightarrow` |
| $\\Leftarrow$ | `\Leftarrow` | $\\Rightarrow$ | `\Rightarrow` | $\\Leftrightarrow$ | `\Leftrightarrow` |
| $\\uparrow$ | `\uparrow` | $\\downarrow$ | `\downarrow` | $\\updownarrow$ | `\updownarrow` |
| $\\Uparrow$ | `\Uparrow` | $\\Downarrow$ | `\Downarrow` | $\\Updownarrow$ | `\Updownarrow` |
| $\\leftharpoonup$ | `\leftharpoonup` | $\\leftharpoondown$ | `\leftharpoondown` | $\\rightharpoonup$ | `\rightharpoonup` |
| $\\rightharpoondown$ | `\rightharpoondown` | $\\rightleftharpoons$ | `\rightleftharpoons` | $\\leftrightharpoons$ | `\leftrightharpoons` |
| $\\iff$ | `\iff` | $\\mapsto$ | `\mapsto` | | |

### 括号

| 括号 | 语法 | 括号 | 语法 | 括号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $()$ | `()` | $[]$ | `[]` | ${}$ | `\{\}` |
| $\\lfloor\\rfloor$ | `\lfloor\rfloor` | $\\lceil\\rceil$ | `\lceil\rceil` | $\\langle\\rangle$ | `\langle\rangle` |

### 大尺寸括号

| 括号 | 语法 | 括号 | 语法 |
| :--- | :--- | :--- | :--- |
| $\\left(\\right)$ | `\left(\right)` | $\\left[ \\right]$ | `\left[\right]` |
| $\\overbrace{x\_1x\_2\\ldots x\_n}^{n}$ | `\overbrace{x_1x_2\ldots x_n}^{n}` | $\\underbrace{x\_1x\_2\\ldots x\_n}\_{n}$ | `\underbrace{x_1x_2\ldots x_n}_{n}` |

**注：大尺寸的 `()` 和 `[]` 是可以根据公式的高度自动调节的，例如**

```latex
\arg\min_{\theta}
\left[
    -\sum_{i=1}^{n}
    \left[
        \mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
        (1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
    \right]
\right]
```

$$
\arg\min_{\theta}
\left[
-\sum_{i=1}^{n}
\left[
\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
\right]
\right]
$$

可以看出，括号高度可以框住整个公式。因此在这种大型的公式中，使用大尺寸括号视觉效果更美观。

### 其他常见符号

| 符号 | 语法 | 符号 | 语法 | 符号 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\\forall$ | `\forall` | $\\exists$ | `\exist` | $\\angle$ | `\angle` |
| $\\emptyset$ | `\emptyset` | $\\partial$ | `\partial` | $\\infty$ | `\infty` |
| $\\ldots$ | `\ldots` | $\\cdots$ | `\cdots` | $\\dots$ | `\dots` |
| $\\vdots$ | `\vdots` | $\\ddots$ | `\ddots` | $\\prime$ | `\prime` |
| $\\because$ | `\because` | $\\therefore$ | `\therefore` | $\\Box$ | `\Box` |
| $\\triangle$ | `\triangle` | $\\S$ | `\S` | | |

## 数学公式写法

-----

### 上下标

* `^`：上标
* `_`：下标

例如:

* `\sum_{i=1}^{n}X_n` 表示 $\\sum\_{i=1}^{n}X\_n$
* `\int_{0}^{\infty}x^2dx` 表示 $\\int\_{0}^{\\infty}x^2dx$
* `\prod_{i=1}^{n}X_n` 表示 $\\prod\_{i=1}^{n}X\_n$

### 分数

使用 `\frac{}{}` 即可，例如 `\frac{a}{b}` 表示 $\\frac{a}{b}$

### 插入文字

使用 `\text`，例如 `\text{hello,world!}` 表示 $\\text{hello,world\!}$

### 常见函数

| 函数 | 语法 | 函数 | 语法 | 函数 | 语法 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| $\\log()$ | `\log()` | $\\ln()$ | `\ln()` | $\\lg()$ | `\lg()` |
| $\\max$ | `\max` | $\\min$ | `\min` | $\\lim\_{x \\to \\infty}$ | `\lim_{x \to \infty}` |
| $\\arg\\max\_{c \\in C}$ | `\arg\max_{c \in C}` | $\\arg\\min\_{c \\in C}$ | `\arg\min_{c \in C}` | $\\exp$ | `\exp` |

### 矩阵、行列式

`&` 表示分隔元素，`\\` 表示换行

```latex
A=
\begin{pmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{pmatrix}
```

$$A=
\begin{pmatrix}
a\_{11} & a\_{12} \\
a\_{21} & a\_{22}
\end{pmatrix}
$$

```latex
A=
\begin{bmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{bmatrix}
```

$$A=
\begin{bmatrix}
a\_{11} & a\_{12} \\
a\_{21} & a\_{22}
\end{bmatrix}
$$

```latex
A=
\begin{Bmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{Bmatrix}
```

$$A=
\begin{Bmatrix}
a\_{11} & a\_{12} \\
a\_{21} & a\_{22}
\end{Bmatrix}
$$

```latex
A=
\begin{vmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{vmatrix}
```

$$A=
\begin{vmatrix}
a\_{11} & a\_{12} \\
a\_{21} & a\_{22}
\end{vmatrix}
$$

```latex
A=
\begin{Vmatrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{Vmatrix}
```

$$A=
\begin{Vmatrix}
a\_{11} & a\_{12} \\
a\_{21} & a\_{22}
\end{Vmatrix}
$$

```latex
A=
\begin{matrix}
a_{11} & a_{12} \\
a_{21} & a_{22}
\end{matrix}
```

$$A=
\begin{matrix}
a\_{11} & a\_{12} \\
a\_{21} & a\_{22}
\end{matrix}
$$

### 多行公式对齐

使用 `\begin{split} \end{split}`，在需要对齐的地方添加 `&` 符号，注意需要用 `\\` 来换行。

例如：

```latex
\begin{split}
L(\theta)
&=	\arg\max_{\theta}\ln(P_{All})\\
&=	\arg\max_{\theta}\ln\prod_{i=1}^{n}
    \left[
        (h_{\theta}(\mathbf{x}^{(i)}))^{\mathbf{y}^{(i)}}\cdot
        (1-h_{\theta}(\mathbf{x}^{(i)}))^{1-\mathbf{y}^{(i)}}
    \right]\\
&=	\arg\max_{\theta}\sum_{i=1}^{n}
	\left[
		\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
		(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
	\right]\\
&=	\arg\min_{\theta}
	\left[
        -\sum_{i=1}^{n}
        \left[
            \mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
            (1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
        \right]
	\right]\\
&=	\arg\min_{\theta}\mathscr{l}(\theta)
\end{split}
```

$$
\begin{split}
L(\theta)
&=	\arg\max_{\theta}\ln(P_{All})\\
&=	\arg\max_{\theta}\ln\prod_{i=1}^{n}
\left[
(h_{\theta}(\mathbf{x}^{(i)}))^{\mathbf{y}^{(i)}}\cdot
(1-h_{\theta}(\mathbf{x}^{(i)}))^{1-\mathbf{y}^{(i)}}
\right]\\
&=	\arg\max_{\theta}\sum_{i=1}^{n}
\left[
\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
\right]\\
&=	\arg\min_{\theta}
\left[
-\sum_{i=1}^{n}
\left[
\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
\right]
\right]\\
&=	\arg\min_{\theta}\mathscr{l}(\theta)
\end{split}
$$

上例中，在 `=` 前添加了 `&`，因此实现**等号对齐**；

`\begin{split} \end{split}` 语法**默认为右对齐**，也就是说如果不在任何地方添加 `&` 符号，则公式默认右侧对齐，例如：

```latex
\begin{split}
L(\theta)
=	\arg\max_{\theta}\ln(P_{All})\\
=	\arg\max_{\theta}\ln\prod_{i=1}^{n}
\left[
(h_{\theta}(\mathbf{x}^{(i)}))^{\mathbf{y}^{(i)}}\cdot
(1-h_{\theta}(\mathbf{x}^{(i)}))^{1-\mathbf{y}^{(i)}}
\right]\\
=	\arg\max_{\theta}\sum_{i=1}^{n}
\left[
\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
\right]\\
=	\arg\min_{\theta}
\left[
-\sum_{i=1}^{n}
\left[
\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
\right]
\right]\\
=	\arg\min_{\theta}\mathscr{l}(\theta)
\end{split}
```

上述 LATEX 代码没有添加 `&` 符号，则公式右对齐：

$$
\begin{split}
L(\theta)
=	\arg\max_{\theta}\ln(P_{All})\\
=	\arg\max_{\theta}\ln\prod_{i=1}^{n}
    \left[
        (h_{\theta}(\mathbf{x}^{(i)}))^{\mathbf{y}^{(i)}}\cdot
        (1-h_{\theta}(\mathbf{x}^{(i)}))^{1-\mathbf{y}^{(i)}}
    \right]\\
=	\arg\max_{\theta}\sum_{i=1}^{n}
	\left[
		\mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
		(1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
	\right]\\
=	\arg\min_{\theta}
	\left[
        -\sum_{i=1}^{n}
        \left[
            \mathbf{y}^{(i)}\ln(h_{\theta}(\mathbf{x}^{(i)})) +
            (1-\mathbf{y}^{(i)})\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
        \right]
	\right]\\
=	\arg\min_{\theta}\mathscr{l}(\theta)
\end{split}

$$

如果希望**左对齐**，例如

```latex
\begin{split}
&\ln h_{\theta}(\mathbf{x}^{(i)})
=	\ln\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}}
= 	-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})\\
&\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
=	\ln(1-\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}})
= 	-\theta^T \mathbf{x}^{(i)}-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})
\end{split}
```

$$
\begin{split}
&\ln h_{\theta}(\mathbf{x}^{(i)})
=	\ln\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}}
= 	-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})\\
&\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
=	\ln(1-\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}})
= 	-\theta^T \mathbf{x}^{(i)}-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})
\end{split}
$$

除了 `\begin{split} \end{split}`，也可以用 `\begin{align} \end{align}`，用法与 `split` 相同，对齐方式也相同；

只有一点不同：**采用 align 环境会默认为每一条公式编号**（如下例），split 则不会编号。

```latex
\begin{align}
&\ln h_{\theta}(\mathbf{x}^{(i)})
=	\ln\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}}
= -\ln(1+e^{\theta^T \mathbf{x}^{(i)}})\\
&\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
=	\ln(1-\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}})
= -\theta^T \mathbf{x}^{(i)}-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})
\end{align}
```

$$
\begin{align}
&\ln h_{\theta}(\mathbf{x}^{(i)})
=	\ln\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}}
	= -\ln(1+e^{\theta^T \mathbf{x}^{(i)}})\\
&\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
=	\ln(1-\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}})
	= -\theta^T \mathbf{x}^{(i)}-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})
\end{align}
$$

但可以在 align 后加一个 `*` 号，则 align 环境也可以取消公式自动编号，如下：
(也就是说 `align*` 和 `split` 的用法完全相同)

```latex
\begin{align*}
&\ln h_{\theta}(\mathbf{x}^{(i)})
=	\ln\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}}
	= -\ln(1+e^{\theta^T \mathbf{x}^{(i)}})\\
&\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
=	\ln(1-\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}})
	= -\theta^T \mathbf{x}^{(i)}-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})
\end{align*}
```

$$
\begin{align*}
&\ln h_{\theta}(\mathbf{x}^{(i)})
=	\ln\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}}
= -\ln(1+e^{\theta^T \mathbf{x}^{(i)}})\\
&\ln(1-h_{\theta}(\mathbf{x}^{(i)}))
=	\ln(1-\frac{1}{1+e^{-\theta^T \mathbf{x}^{(i)}}})
= -\theta^T \mathbf{x}^{(i)}-\ln(1+e^{\theta^T \mathbf{x}^{(i)}})
\end{align*}
$$

### 方程组

使用 `\begin{cases} \end{cases}`

例如：

```latex
\begin{cases}
\begin{split}
p &= P(y=1|\mathbf{x})=
\frac{1}{1+e^{-\theta^T\mathbf{X}}}\\
1-p &= P(y=0|\mathbf{x})=1-P(y=1|\mathbf{x})=
\frac{1}{1+e^{\theta^T\mathbf{X}}}
\end{split}
\end{cases}
```

$$
\begin{cases}
\begin{split}
p &= P(y=1|\mathbf{x})=
\frac{1}{1+e^{-\theta^T\mathbf{X}}}\\
1-p &= P(y=0|\mathbf{x})=1-P(y=1|\mathbf{x})=
\frac{1}{1+e^{\theta^T\mathbf{X}}}
\end{split}
\end{cases}
$$

注意 LATEX 语法可以嵌套使用，上例即为 `\begin{cases} \end{cases}` 下嵌套了 `\begin{split} \end{split}`。

也可以将公式和文字结合起来，例如：

```latex
\text{Decision Boundary}=
\begin{cases}
    1\quad \text{if }\ \hat{y}>0.5\\
    0\quad \text{otherwise}
\end{cases}
```

$$
\text{Decision Boundary}=
\begin{cases}
1\quad \text{if }\ \hat{y}>0.5\\
0\quad \text{otherwise}
\end{cases}
$$

注：`\quad` 表示空格。
