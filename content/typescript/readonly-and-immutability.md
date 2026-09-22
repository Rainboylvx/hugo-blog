---
title: "只读与不可变"
date: 2026-09-21
weight: 24
draft: false
toc: true
tags: ["typescript"]
---

`readonly` 和 `as const` 都表达"不可修改"，但作用范围差别很大：`readonly` 是**浅层的**，`as const` 是**递归的**。搞错这一点会写出"以为保护了其实没保护"的类型。

## `readonly` 是浅层的

{{< include "src/readonly-and-immutability/readonly-levels.ts" "ts" >}}

```text
3 [ 1, 2, 3 ] 3 2 3 3
```

三种用法：

```typescript
interface Config {
  readonly name: string;          // 属性只读
  nested: {
    readonly value: number;       // 需要显式标记，不会自动继承
  };
  list: readonly number[];        // 只读数组
}
```

关键在于**每一层都要单独标记**：

```typescript
// @ts-expect-error TS2540: 顶层只读
c.name = "b";
// @ts-expect-error TS2540: 嵌套里显式标记了
c.nested.value = 2;
// @ts-expect-error TS2339: 只读数组没有 push
c.list.push(3);

c.nested = { value: 3 };     // 允许！nested 本身不是 readonly
```

`Readonly<T>` 工具类型同样是浅层的：

```typescript
type ShallowReadonly = Readonly<{ a: { b: number } }>;

const s: ShallowReadonly = { a: { b: 1 } };
s.a = { b: 2 };    // 错误：顶层只读
s.a.b = 3;         // 允许！嵌套不受影响
```

深度只读要自己写递归映射类型：

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```

## 赋值方向：可变 → 只读可以，反之不行

```typescript
const mutable: number[] = [1, 2];
const readonlyArr: readonly number[] = mutable;    // ✓

const back: number[] = readonlyArr;
// error TS4104: The type 'readonly number[]' is 'readonly' and cannot be
// assigned to the mutable type 'number[]'.
```

这个方向限制让 `readonly` 参数有了实用价值——**表达"我不会修改这个入参"**：

```typescript
function sum(nums: readonly number[]): number {
  return nums.reduce((a, b) => a + b, 0);   // 编译期保证不修改
}

sum([1, 2]);        // 字面量可以传
sum(mutable);       // 可变数组也可以传
```

## `as const` 是递归的

{{< include "src/readonly-and-immutability/as-const.ts" "ts" >}}

```text
dark 1 a 1 [ 'a', 'b', 'c' ] dark [ 'a', 'b', 'c' ] 1 1 up sideways
/ /about
home
```

`as const` 做两件事，**递归作用于所有嵌套层级**：

1. 所有属性/元素变成 `readonly`
2. 所有值收窄到字面量类型

```typescript
const config = {
  mode: "dark",
  tags: ["a", "b"],
  nested: { deep: { value: 1 } },
} as const;

const mode: "dark" = config.mode;          // 字面量类型，不是 string
const tag: "a" = config.tags[0];           // 数组变成只读元组
const deep: 1 = config.nested.deep.value;  // 深层也是字面量
```

数组会变成**只读元组**：

```typescript
type Tags = typeof config.tags;    // readonly ["a", "b"]
```

## 两者的对比

| | `readonly` / `Readonly<T>` | `as const` |
|---|---|---|
| 作用范围 | 浅层（标记的那一层） | 递归（所有嵌套） |
| 改变类型宽度 | 否 | 是（收窄为字面量） |
| 数组结果 | `readonly T[]` | `readonly [a, b]` 元组 |
| 用途 | 声明接口时标记只读字段 | 定义常量、推导联合类型 |

```typescript
const a1 = { x: 1 } as const;      // a1.x 类型是 1，只读
type RO = { readonly x: number };
const a2: RO = { x: 1 };           // a2.x 类型是 number，只读
```

## 常用套路：从常量推导联合类型

这是 `as const` 最有价值的用法：

```typescript
const DIRECTIONS = ["up", "down", "left", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];
// "up" | "down" | "left" | "right"
```

好处是**单一数据源**：数组和类型不会不一致。加一个方向只需改数组。

`as const satisfies` 组合可以同时获得只读、字面量和结构检查：

```typescript
const ROUTES = {
  home: "/",
  about: "/about",
} as const satisfies Record<string, `/${string}`>;
```

详见 [satisfies 与 as const](./satisfies-and-as-const.md)。

> [!WARNING] `as const` 不提供运行时保护
> `as const` 和 `readonly` 都是**纯编译期**的。编译后 `readonly` 完全消失，`as const` 也只剩普通对象：
>
> ```javascript
> const config = { mode: "dark" };
> ```
>
> 运行时改 `config.mode` 完全有效。要真正的运行时不可变用 `Object.freeze()`，但注意它也是浅层的。

## 相关

- [类型基础](./type-basics.md) —— `readonly` 的基础语法
- [数组与元组](./array-vs-tuple.md) —— 只读数组与只读元组
- [satisfies 与 as const](./satisfies-and-as-const.md) —— 组合用法
- [映射类型](./mapped-types.md) —— 用映射类型实现 `DeepReadonly`
