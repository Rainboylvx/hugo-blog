---
title: "object 与 Object"
date: 2026-09-21
weight: 33
draft: false
toc: true
tags: ["typescript"]
---

`object`、`Object`、`{}` 三个都表示"对象"，但接受的范围差别很大，而且**两个会把原始类型也算进去**——这几乎从不是你想要的。

## 三者对比

{{< include "src/object-and-Object/differences.ts" "ts" >}}

```text
null null null [ 1, 2 ] 42 [ 'a' ] {"a":1}
```

| 类型 | 接受 `{a:1}` | 接受 `[1,2]` | 接受 `"str"` | 接受 `42` | 接受 `null` |
|---|---|---|---|---|---|
| `object` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `Object` | ✓ | ✓ | **✓** | **✓** | ✗ |
| `{}` | ✓ | ✓ | **✓** | **✓** | ✗ |

### `object`（小写）

表示**任何非原始类型**。原始类型包括 `string`、`number`、`boolean`、`symbol`、`bigint`、`null`、`undefined`。

```typescript
let obj: object = { a: 1 };
obj = [1, 2];          // ✓ 数组是对象
obj = () => {};        // ✓ 函数是对象
obj = 42;              // ✗ 原始类型
obj = "hello";         // ✗ 原始类型
```

但它**不描述结构**，所以访问属性会报错：

```typescript
function accessOnObject(o: object) {
  return o.a;
  // error TS2339: Property 'a' does not exist on type 'object'.
}
```

### `Object`（大写）和 `{}`

两者**行为完全一致**（实测可互相赋值）：

```typescript
declare const a: {};
declare const b: Object;
const x: Object = a;   // ✓
const y: {} = b;       // ✓
```

它们接受**除 `null`/`undefined` 外的一切**，包括原始类型：

```typescript
let obj: Object = "hello";   // ✓ 这几乎肯定不是你想要的
obj = 42;                    // ✓
```

> [!WARNING] `Object` 和 `{}` 是"接受一切"的宽类型
> 因为 `string`、`number` 在 JavaScript 里都有对应的包装对象，TypeScript 认为它们满足 `Object` 和 `{}`。
>
> 所以 `function f(x: Object)` 和 `function f(x: {})` 实际上等于"接受任何非 null 值"——和你写 `unknown` 差不多，但少了 `unknown` 的强制收窄保护。**两者都应该避免使用**。

## 实测：`{}` 的真实含义

`{}` 常被误解为"空对象"，但它其实是"没有已知属性"——任何有属性的值都满足它，包括字符串和数字。

```typescript
let obj3: {} = { a: 1 };   // ✓
obj3 = [1, 2];             // ✓
obj3 = "hello";            // ✓
obj3 = 42;                 // ✓
obj3 = null;               // ✗
```

所以 `{}` 的问题是**它不检查任何东西**，却看起来像在检查。

## 该用哪个

| 需求 | 用什么 |
|---|---|
| 任何非原始类型 | `object` |
| 任何值（最安全） | `unknown` |
| 有结构的对象 | 具体类型或 `Record<K, V>` |
| 任何非 null 值 | `unknown`（不要用 `Object`/`{}`） |

**实践建议：**

```typescript
// ✓ 要"任何对象但排除原始类型" → object
function keysOf(o: object): string[] {
  return Object.keys(o);
}

keysOf({ a: 1 });      // ✓
keysOf([1, 2]);        // ✓
keysOf("hello");       // ✗ 原始类型被拒绝
```

```typescript
// ✓ 要"任何值" → unknown（强制调用方收窄）
function stringify(v: unknown): string {
  return JSON.stringify(v);
}
```

```typescript
// ✗ 避免
function bad1(x: Object) {}
function bad2(x: {}) {}
```

> [!TIP] 为什么 `unknown` 比 `Object` 好
> `unknown` 要求你在使用前先收窄（见 [类型收窄](./narrowing.md)），而 `Object` 允许你直接调用方法：
>
> ```typescript
> function withObject(x: Object) {
>   x.toString();       // 编译通过，但 x 可能是 null 之外任何东西
> }
>
> function withUnknown(x: unknown) {
>   x.toString();       // error TS18046: 'x' is of type 'unknown'.
> }
> ```
>
> `unknown` 强制你显式处理，`Object` 静默放行。

## 相关

- [类型基础](./type-basics.md) —— 对象类型的基础
- [类型收窄](./narrowing.md) —— `unknown` 的收窄
- [高级类型](./advanced-types.md) —— `Record<K, V>` 工具类型
