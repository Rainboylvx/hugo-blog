---
title: "satisfies 与 as const"
date: 2026-09-21
weight: 55
draft: false
toc: true
tags: ["typescript"]
---

`satisfies`（TS 4.9+）解决了一个长期痛点：**注解会丢失推断，不注解会丢失检查**。它让你同时得到两者。

## 注解的两个问题

```typescript
type Route = { path: string; method: "GET" | "POST" };

// 问题一：注解丢失推断
const routes1: Route[] = [{ path: "/a", method: "GET" }];
// routes1[0].method 的类型是 "GET" | "POST"，丢了具体值

// 问题二：不注解丢失检查
const routes2 = [{ path: "/a", method: "GETT" }];   // 拼错了也不报错
```

`satisfies` 的语义是：**检查这个值满足某个类型，但不要用那个类型去覆盖推断出来的类型**。

```typescript
const routes3 = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] satisfies Route[];   // 有检查，且保留了字面量类型
```

## 四种写法的对比

{{< include "src/satisfies-and-as-const/satisfies.ts" "ts" >}}

```text
[ { path: '/a', method: 'GET' } ] [ { path: '/a', method: 'GETT' } ] [ { path: '/a', method: 'GET' }, { path: '/b', method: 'POST' } ] { path: '/a', method: 'GET' } [ { path: '/a', method: 'GET' }, { path: '/b', method: 'POST' } ] { dev: 'http://localhost', prod: 'https://example.com' } { dev: 'a', prod: 'b' } { primary: 'red', secondary: 'green' } { path: '/a', method: 'GET' } { path: '/a', method: 'GET' } { path: '/a', method: 'GET' } { path: '/a', method: 'GET' } GET GET GET
```

| 写法 | 有检查 | 保留字面量 | `method` 的类型 |
|---|---|---|---|
| `const a: Route = {...}` | ✓ | ✗ | `"GET" \| "POST"` |
| `const a = {...}` | ✗ | ✓ | `string` |
| `const a = {...} satisfies Route` | ✓ | ✓ | `"GET"` |
| `... as const satisfies Route` | ✓ | ✓ + 只读 | `"GET"` |

> [!TIP] `satisfies` 的读法
> 把 `x satisfies T` 读作"`x` 必须满足 `T`，但 `x` 还是它自己"。注解 `x: T` 读作"`x` 就是 `T`"——后者会**丢弃** `x` 更具体的信息。

## `satisfies` 的一个细节：数组 vs 单对象

数组用 `satisfies` 后，索引访问得到的是**元素类型的联合**，不是每个位置的具体类型：

```typescript
const routes3 = [...] satisfies Route[];

type Route3Method = (typeof routes3)[number]["method"];   // "GET" | "POST"
// 不是 "GET"，因为数组的每个元素类型被统一了
```

**单个对象**才能保留具体字面量：

```typescript
const single = { path: "/a", method: "GET" } satisfies Route;
const r3: "GET" = single.method;      // ✓
```

数组要保留**每个位置**的信息，必须加 `as const`（让数组变成元组）：

```typescript
const tuple = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] as const satisfies readonly Route[];

const t0: "GET" = tuple[0].method;    // ✓ 元组保留了位置
```

## 检查对象键完整

这是 `satisfies` 最实用的场景之一：

```typescript
type Env = "dev" | "prod";

const urls = {
  dev: "http://localhost",
  prod: "https://example.com",
} satisfies Record<Env, string>;
// 少写一个键会报错
```

而且它**保留具体的键**，不像注解那样退化成 `Env`：

```typescript
type K = keyof typeof urls;            // "dev" | "prod"（satisfies）

const urls2: Record<Env, string> = { dev: "a", prod: "b" };
type K2 = keyof typeof urls2;          // Env（注解丢失了具体键）
```

## 检查值符合约束

```typescript
type Color = "red" | "green" | "blue";

const palette = {
  primary: "red",
  secondary: "green",
} satisfies Record<string, Color>;   // 值必须是 Color 之一
```

## `as const` 的补充

`satisfies` 只做检查，不改只读性。要同时获得只读和字面量，用 `as const satisfies`：

```typescript
const config = {
  mode: "dark",
  tags: ["a", "b"],
} as const satisfies { mode: string; tags: readonly string[] };

config.mode;      // "dark"，且只读
config.tags[0];   // "a"
```

注意 `satisfies` 的类型里要用 `readonly`，因为 `as const` 把数组变成了只读元组。详见 [只读与不可变](./readonly-and-immutability.md)。

## 选择指南

| 想要 | 写 |
|---|---|
| 值必须符合类型，且丢弃具体信息 | `const x: T = ...` |
| 只想要检查，不想改变类型 | `const x = ... satisfies T` |
| 检查 + 只读 + 字面量 | `const x = ... as const satisfies T` |
| 只想要推断，不要检查 | `const x = ...` |

## 相关

- [只读与不可变](./readonly-and-immutability.md) —— `as const` 的完整语义
- [高级类型](./advanced-types.md) —— 条件类型与映射类型基础
- [enum 深挖](./enum-in-depth.md) —— 用 `as const` 替代 enum
