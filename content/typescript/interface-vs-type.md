---
title: "interface 与 type"
date: 2026-09-21
weight: 32
draft: false
toc: true
tags: ["typescript"]
---

两者都能描述对象，但能力并不等价。选择标准不是"哪个更好"，而是"你要用哪个能力"。

## 能力对比

{{< include "src/interface-vs-type/capabilities.ts" "ts" >}}

```text
{ a: 1, b: 'x' } Impl { a: 1, b: 2 } { a: 1 }
```

| 能力 | `interface` | `type` |
|---|---|---|
| 描述对象结构 | ✓ | ✓ |
| 函数类型 | ✓ | ✓ |
| 泛型 | ✓ | ✓ |
| 索引签名 | ✓ | ✓ |
| 扩展 | `extends` | `&` 交叉 |
| 继承多个 | ✓ | ✓（交叉） |
| **声明合并** | ✓ | ✗ |
| **联合类型** | ✗ | ✓ |
| **元组类型** | ✗ | ✓ |
| **条件类型** | ✗ | ✓ |
| **映射类型** | ✗ | ✓ |
| **原始类型别名** | ✗ | ✓ |
| **模板字面量类型** | ✗ | ✓ |

## 只有 `type` 能做的

```typescript
type Status = "a" | "b";                          // 联合
type Pair = [number, number];                     // 元组
type IsString<T> = T extends string ? true : false;  // 条件类型
type Partial2<T> = { [K in keyof T]?: T[K] };     // 映射类型
type ID = string | number;                        // 原始类型别名
type Event = `on${string}`;                       // 模板字面量
```

`interface` 写不出这些，是语法层面的限制（`interface X = "a" | "b"` 是语法错误）。

## 只有 `interface` 能做的

**声明合并**是 `interface` 独有的：

```typescript
interface Merged { a: number }
interface Merged { b: string }      // 自动合并

const merged: Merged = { a: 1, b: "x" };
```

`type` 会报 `Duplicate identifier`：

```typescript
type TM = { a: number };
type TM = { b: string };    // error: Duplicate identifier 'TM'.
```

这是给第三方库补类型的基础（见 [声明合并](./declaration-merging.md)）。**需要合并就必须用 `interface`**。

## `extends` 与 `&` 的关键差异

两者语义上都是"并且"，但**错误检查行为不同**：

```typescript
interface Base { a: number }

// interface extends：不兼容的覆盖会报错
interface Bad extends Base {
  a: string;
}
// error TS2430: Interface 'Bad' incorrectly extends interface 'Base'.
//   Types of property 'a' are incompatible.
//     Type 'string' is not assignable to type 'number'.

// type 交叉：不报错，但属性类型变成 never
type BadType = Base & { a: string };
// a 的类型是 number & string，即 never
```

> [!WARNING] `&` 不会报错，只会静默产生 `never`
> 这是 `&` 的一个陷阱。`number & string` 是 `never`，类型检查器不会提示你写错了，只会在后面赋值时以奇怪的方式失败。`interface extends` 会立刻报 `TS2430`，错误更早更清楚。

## 选择标准

**用 `interface`：**

- 描述对象结构（这是最常见的场景）
- 需要声明合并（给库补类型、扩展全局）
- 需要 `extends` 的严格检查

**用 `type`：**

- 联合类型、元组、条件类型、映射类型
- 给原始类型起别名
- 组合多个类型（`A & B`、`A | B`）

> [!TIP] 实用规则
> 默认用 `interface`，因为它可扩展、可合并、错误检查更严格。**需要 `type` 独有的能力时再换 `type`**。
>
> 反过来（默认 `type`，需要合并时换 `interface`）也行，但会导致团队里风格不统一。关键是**定一个默认值并保持一致**。

## 一个常见误区

`interface` 不是"只能描述对象"，它也能描述函数和数组：

```typescript
interface Fn { (x: number): string }
interface Arr extends Array<number> {}
```

反过来 `type` 也不是"只能描述联合"，它同样能描述对象：

```typescript
type Obj = { a: number };
```

真正的区别只在上面那张能力表里。

## 相关

- [类型基础](./type-basics.md) —— 两者的基础用法
- [声明合并](./declaration-merging.md) —— `interface` 合并的完整规则
- [高级类型](./advanced-types.md) —— `type` 独有能力的使用场景
