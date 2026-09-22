---
title: "注解与推断"
date: 2026-09-21
weight: 21
draft: false
toc: true
tags: ["typescript"]
---

TypeScript 有两条路径知道类型：**类型注解**（你写出来）和**类型推断**（编译器算出来）。判断该不该写注解的标准只有一条：**类型信息是否从值的右侧流到了左侧**。

{{< include "src/annotations-vs-inference/when-required.ts" "ts" >}}

```text
3 later [] {} 1 3 x 1 a [ 1, 2, 3 ] { a: 1 } 0
[ 1 ] [ 1 ]
```

## 必须写注解的五种情况

| 情况 | 例子 | 为什么 |
|---|---|---|
| 函数参数 | `function add(a: number, b: number)` | 没有初始化表达式，无从推断 |
| 声明后延迟赋值 | `let pending: string;` | 同上 |
| 空数组/空对象 | `const arr: number[] = []` | 推断不出元素类型 |
| 需要收窄联合 | `let id: string \| number = "a"` | 默认推断为 `string`，太窄 |
| 公开 API 返回值 | `export function parse(): number` | 推断得出，但写出来能防止实现改动意外改变契约 |

函数参数是唯一**强制**要求注解的地方（`noImplicitAny` 下）。其余都是"建议"或"按需"。

## 不写注解的四种情况

```typescript
const n = 1;              // 不需要 : number
const arr = [1, 2, 3];    // 不需要 : number[]
const obj = { a: 1 };     // 不需要 : { a: number }

[1, 2, 3].map((x) => x * 2);   // x 自动推断为 number
```

**回调参数能从上下文推断**，这是最常被多写注解的地方。`map`、`filter`、`forEach` 的参数都有上下文类型，不需要手写。

> [!TIP] 判断标准
> 如果注解和右侧的值**完全重复**（`const n: number = 1`），那是噪音。如果注解表达了右侧**看不出来**的信息（`let id: string | number = "a"`），那是必要的。

## 空容器的推断陷阱

空数组的推断行为比较特殊：

```typescript
const arrNoAnn = [];
arrNoAnn.push(1);
const narrowed: number[] = arrNoAnn;      // 收窄为 number[]
```

这是 **evolving `any[]`**：声明时是 `any[]`，`push` 之后收窄。如果一直没 `push` 就用到它，会报：

```text
error TS7034: Variable 'emptyArr' implicitly has type 'any[]' in some locations where its type cannot be determined.
```

和 `let b;` 的 evolving `any` 是同一机制（见 [类型基础](./type-basics.md)）。空数组建议直接注解，意图更清楚。

空对象字面量 `{}` 的类型就是 `{}`，它可以赋给 `Record<string, number>`，但**不能**赋给 `{ a: number }`：

```text
error TS2741: Property 'a' is missing in type '{}' but required in type '{ a: number; }'.
```

## 返回值注解该不该写

推断能得出返回类型，所以技术上不写也行。但有两种情况建议写：

**情况一：公开 API**。写了返回类型后，实现改动如果意外改变了返回类型，会在函数内部报错，而不是在调用方报错——错误离源头更近。

```typescript
// 建议写：改动实现时立刻发现契约变化
export function parse(text: string): number { return Number(text); }

// 如果实现改成 return text，调用方会先炸
```

**情况二：递归函数**。递归的返回类型推断需要先知道返回类型，不注解可能报 `TS7023: 'f' implicitly has return type 'any'`。

```typescript
function fib(n: number): number {     // 不注解这里会报错
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
```

其余情况（内部小函数、回调）不写更简洁。

## 相关

- [类型基础](./type-basics.md) —— 注解与推断的完整基础
- [类型收窄](./narrowing.md) —— 联合类型的收窄机制
- [工程化](./engineering.md) —— `noImplicitAny` 等严格选项
