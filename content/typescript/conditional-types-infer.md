---
title: "条件类型与 infer"
date: 2026-09-21
weight: 51
draft: false
toc: true
tags: ["typescript"]
---

条件类型是类型层面的 `if`，`infer` 是类型层面的"提取变量"。两者组合出的能力是 TypeScript 类型系统的核心，也是内置工具类型的实现基础。

## 分布式条件类型

{{< include "src/conditional-types-infer/distribution.ts" "ts" >}}

```text
[ 1 ] [ 1, 'a' ] undefined x undefined b a s yes no true false true undefined true false
```

最容易踩的规则：**裸类型参数遇到联合类型时会分发**。

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

type A = ToArray<string | number>;   // string[] | number[]  ← 分发了
```

不是 `(string | number)[]`。分发意味着条件类型在**每个成员上独立求值**，结果再合并成联合。

用方括号包裹可以阻止分发：

```typescript
type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never;

type B = ToArrayNoDist<string | number>;   // (string | number)[]
```

### `never` 的特殊性

```typescript
type C = ToArray<never>;   // never（不是 never[]）
```

因为 `never` 是**空联合**，没有成员可以分发，整个条件类型直接返回 `never`。

### 分发的实际影响

内置工具类型都靠分发实现：

```typescript
type MyExclude<T, U> = T extends U ? never : T;
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

理解分发后，`Exclude` 和 `Extract` 的实现就不再神秘。

分发也会带来"意外"的结果：

```typescript
type IsString<T> = T extends string ? "yes" : "no";

type I = IsString<string | number>;        // "yes" | "no"  ← 分发成两个结果

type IsStringNoDist<T> = [T] extends [string] ? "yes" : "no";
type J = IsStringNoDist<string | number>;  // "no"  ← 不分发
```

## 类型探测技巧

有些类型无法用 `extends` 直接判断，需要技巧：

```typescript
// 探测 any：any 同时匹配 1 和 0，用交叉类型利用这个特性
type IsAny<T> = 0 extends 1 & T ? true : false;

// 探测 never：必须用 [] 阻止分发
type IsNever<T> = [T] extends [never] ? true : false;
type M = IsNever<never>;   // true
```

> [!WARNING] `IsNever` 不加方括号会失败
> ```typescript
> type IsNeverBad<T> = T extends never ? true : false;
> type N = IsNeverBad<never>;   // never，不是 true！
> ```
>
> 因为传入 `never` 时触发分发规则，空联合直接返回 `never`。这是最容易踩的一个坑。

## `infer` 的进阶用法

{{< include "src/conditional-types-infer/infer-usage.ts" "ts" >}}

```text
a undefined a undefined [ 1, 'a' ] [ 2, 3, 1 ] { a: 1, b: 2 } s s true [ 'a', 1 ] a Point { x: 1, y: 2 } [ 1, 2 ] 1 [ 'name', 'rainboy' ] id
```

### `infer` 带约束（TS 4.7+）

```typescript
type FirstString<T> = T extends [infer S extends string, ...unknown[]] ? S : never;

type A = FirstString<["a", 1]>;   // "a"
type B = FirstString<[1, 2]>;     // never（1 不满足 string）
```

约束不满足时该分支直接不匹配。对比不加约束的写法，需要在结果里再检查一次：

```typescript
type FirstStringLoose<T> = T extends [infer S, ...unknown[]]
  ? S extends string ? S : never
  : never;
```

### 多个 `infer` 按位置对应

```typescript
type Swap<T> = T extends [infer A, infer B] ? [B, A] : never;
type E = Swap<[string, number]>;     // [number, string]

type Rotate<T> = T extends [infer A, infer B, infer C] ? [B, C, A] : never;
type F = Rotate<[1, 2, 3]>;          // [2, 3, 1]
```

### 同名 `infer` 产生联合

同一个名字在多个位置出现时，结果是**联合**：

```typescript
type SameName<T> = T extends [infer X, infer X] ? X : never;
type R = SameName<[1, 2]>;   // 1 | 2（实测确认）
```

要得到**交叉**（交集），需要利用函数参数的逆变位置：

```typescript
type UnionToIntersection<U> =
  (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

type G = UnionToIntersection<{ a: 1 } | { b: 2 }>;   // { a: 1 } & { b: 2 }
```

这是 `UnionToIntersection` 的实现原理——参数位置逆变，多个候选类型在逆变位置合并时取交叉。

### 递归 `infer`

```typescript
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;
type H = DeepUnwrap<Promise<Promise<string>>>;   // string

type DeepElement<T> = T extends (infer U)[] ? DeepElement<U> : T;
type I = DeepElement<string[][]>;                // string
```

### 提取函数的各个部分

```typescript
type Fn = (a: string, b: number) => boolean;

type Ret<T> = T extends (...args: never[]) => infer R ? R : never;
type Params<T> = T extends (...args: infer P) => unknown ? P : never;
type FirstParam<T> = T extends (first: infer F, ...rest: never[]) => unknown ? F : never;
type ThisOf<T> = T extends (this: infer U, ...args: never[]) => unknown ? U : never;
```

注意 `(...args: never[])` 的写法——用 `never[]` 而不是 `any[]`，因为参数位置逆变，`never[]` 是最宽松的匹配。

### 提取构造函数

```typescript
type InstanceOf<T> = T extends new (...args: never[]) => infer R ? R : never;

class Point { constructor(public x: number, public y: number) {} }
type M = InstanceOf<typeof Point>;   // Point
```

`typeof Point` 是构造函数类型（见 [类既是值又是类型](./class-value-and-type.md)），`infer R` 提取出实例类型。

### 在模板字面量里 `infer`

```typescript
type ParseKV<T> = T extends `${infer K}=${infer V}` ? [K, V] : never;
type P = ParseKV<"name=rainboy">;    // ["name", "rainboy"]

type PathParam<T> = T extends `${string}:${infer P}` ? P : never;
type Q = PathParam<"/users/:id">;    // "id"
```

详见 [模板字面量类型](./template-literal-types.md)。

## 速查

| 需求 | 写法 |
|---|---|
| 阻止分发 | `[T] extends [U]` |
| 探测 `any` | `0 extends 1 & T` |
| 探测 `never` | `[T] extends [never]` |
| `infer` 加约束 | `infer S extends string` |
| 提取返回类型 | `(...args: never[]) => infer R` |
| 联合转交叉 | 利用函数参数逆变位置 |

## 相关

- [高级类型](./advanced-types.md) —— 条件类型的基础
- [映射类型](./mapped-types.md) —— 与条件类型组合
- [内置工具类型](./builtin-utility-types.md) —— 这些技巧的实际应用
- [模板字面量类型](./template-literal-types.md) —— `infer` 的字符串模式匹配
