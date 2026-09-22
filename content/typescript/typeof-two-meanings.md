---
title: "typeof 的两种含义"
date: 2026-09-21
weight: 34
draft: false
toc: true
tags: ["typescript"]
---

`typeof` 在 TypeScript 里是**两个不同的运算符**，同名但完全无关：值位置上是 JavaScript 的运行时运算符，类型位置上是 TypeScript 的类型查询运算符。

## 两种位置，两种含义

{{< include "src/typeof-two-meanings/two-positions.ts" "ts" >}}

```text
object number undefined object  a 1.0
{ debug: true, level: 1 } { retries: 3, timeout: 1000 } { min: 0, max: 100 } [ 'red', 'green' ] 1 1
{ debug: false, level: 2 } 0
a [ 'a', 1 ] { id: '1' } [] 1 0
```

| | 值位置 | 类型位置 |
|---|---|---|
| 是什么 | JavaScript 运算符 | TypeScript 类型查询 |
| 返回 | 字符串（`"number"`） | 类型 |
| 何时求值 | 运行时 | 编译时 |
| 例子 | `typeof x === "string"` | `type T = typeof x` |

```typescript
const config = { debug: true, level: 1 };

// 值位置：运行时字符串
const t1 = typeof config;      // "object"

// 类型位置：编译时类型
type Config = typeof config;   // { debug: boolean; level: number }
```

## 值位置的 `typeof`

用于**类型收窄**（见 [类型收窄](./narrowing.md)）：

```typescript
function pad(x: string | number): string {
  if (typeof x === "string") return x.padStart(2);   // 收窄为 string
  return x.toFixed(1);                                // 收窄为 number
}
```

能识别的八种结果：

```typescript
typeof "a"        // "string"
typeof 1          // "number"
typeof true       // "boolean"
typeof 1n         // "bigint"
typeof Symbol()   // "symbol"
typeof undefined  // "undefined"
typeof (() => {}) // "function"
typeof {}         // "object"
```

> [!WARNING] `typeof null === "object"`
> 这是 JavaScript 的历史遗留 bug。`typeof x === "object"` **不能**排除 `null`，必须额外检查：
>
> ```typescript
> if (typeof x === "object" && x !== null) { }
> ```

## 类型位置的 `typeof`

从**已有的值**推导类型，这是它最有价值的用途。

### 从常量推导类型

```typescript
const DEFAULT = { retries: 3, timeout: 1000 };
type Options = typeof DEFAULT;      // { retries: number; timeout: number }
```

好处是**单一数据源**：类型和值不会不一致。改 `DEFAULT` 的结构，`Options` 自动跟着变。

### 配合 `keyof` 取键

```typescript
type OptionKey = keyof typeof DEFAULT;   // "retries" | "timeout"
```

顺序不能反。`keyof` 需要类型，`typeof` 把值变成类型。

### 配合 `as const` 保留字面量

```typescript
const LIMITS = { min: 0, max: 100 } as const;
type Limits = typeof LIMITS;   // { readonly min: 0; readonly max: 100 }
```

不加 `as const` 的话类型是 `{ min: number; max: number }`，丢了具体值。

### 从函数推导

```typescript
function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}

type User = ReturnType<typeof createUser>;
type UserParams = Parameters<typeof createUser>;
```

这里 `typeof createUser` 得到**函数类型**，再用 `ReturnType` 取返回类型。

### 从数组推导联合

```typescript
const COLORS = ["red", "green"] as const;
type Color = (typeof COLORS)[number];   // "red" | "green"
```

这是"从常量数组推导联合类型"的标准写法。

### 类的静态侧 vs 实例侧

这是 `typeof` 最容易被忽略的用途：

```typescript
class Factory {
  static create() { return new Factory(); }
  value = 1;
}

type FactoryStatic = typeof Factory;   // 有 create（静态侧）
type FactoryInstance = Factory;        // 有 value（实例侧）
```

`typeof Factory` 得到的是**构造函数类型**，包含静态成员。不加 `typeof` 的 `Factory` 是实例类型。详见 [类既是值又是类型](./class-value-and-type.md)。

## 类型位置的限制

`typeof` 在类型位置**只能用于值**，不能用于纯类型：

```typescript
type MyType = { a: number };

type Bad3 = typeof MyType;
// error TS2693: 'MyType' only refers to a type, but is being used as a value here.

type Bad2 = typeof string;
// error TS2693: 'string' only refers to a type, but is being used as a value here.
```

也不能用于表达式或函数调用——这是**语法错误**：

```typescript
type Bad6 = typeof getValue();
// error TS1005: ';' expected.
```

要去函数的返回类型，用 `ReturnType`：

```typescript
function getValue() { return 1; }

type OkType = typeof getValue;            // ✓ 不加括号
type Ret = ReturnType<typeof getValue>;   // ✓ 1
```

## 速记

| 看到 | 位置 | 含义 |
|---|---|---|
| `typeof x === "string"` | 值 | 运行时判断 |
| `type T = typeof x` | 类型 | 编译时查询 |
| `keyof typeof x` | 类型 | 先查询再取键 |
| `ReturnType<typeof f>` | 类型 | 取函数返回类型 |
| `typeof Class` | 类型 | 静态侧（构造函数） |

## 相关

- [类型收窄](./narrowing.md) —— 值位置 `typeof` 的收窄用法
- [类既是值又是类型](./class-value-and-type.md) —— `typeof Class` 的详细解释
- [高级类型](./advanced-types.md) —— `keyof`、`ReturnType` 等工具类型
