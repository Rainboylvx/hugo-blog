---
title: "泛型的推断位置"
date: 2026-09-21
weight: 41
draft: false
toc: true
tags: ["typescript"]
---

理解"类型参数从哪里被推断出来"，能解释绝大多数"为什么这里推断成了 `unknown`"的困惑。

## 会被推断的位置

{{< include "src/generic-inference-positions/positions.ts" "ts" >}}

```text
a 1 1 [ 1, 'a' ] 1 true 1 undefined 1 1 a [ 1, 'a' ] undefined undefined 1 1 undefined undefined
```

| 位置 | 例子 | 推断结果 |
|---|---|---|
| 参数本身 | `f<T>(x: T)` → `f("a")` | `T = string` |
| 参数的结构 | `f<T>(o: { value: T })` | `T = number` |
| 数组元素 | `f<T>(arr: T[])` | `T = number` |
| 元组位置 | `f<T, U>(p: [T, U])` | 按位置对应 |
| 回调返回值 | `f<T>(cb: () => T)` | `T = number` |
| 嵌套结构 | `f<T>(o: { a: { b: T } })` | `T = boolean` |
| 索引访问 | `f<T, K extends keyof T>(o, k)` | `T` 和 `K` 分别推断 |

共同点：**类型参数出现在参数的类型里**，调用时就能从实参反推。

## 不会被推断的位置

### 只在返回位置出现

```typescript
function make<T>(): T { return undefined as T; }

const h = make();     // T = unknown
```

没有任何参数提供信息，TypeScript 无法推断。结果是 `unknown`——**不是 `any`，也不是报错**：

```typescript
const q = onlyReturn();
const qCheck: string = q;
// error TS2322: Type 'unknown' is not assignable to type 'string'.
```

`unknown` 的设计意图是强制你显式处理（见 [类型收窄](./narrowing.md)）。要拿具体类型必须显式指定：

```typescript
const r = onlyReturn<string>();   // T = string
```

### 只在约束里出现

```typescript
function constrained<T, U extends T>(a: T, b: U): T { return a; }
```

`T` 从 `a` 推断，`U` 从 `b` 推断。看起来没问题，但有个陷阱：

```typescript
constrained(1, 2);
// error TS2345: Argument of type '2' is not assignable to parameter of type '1'.
```

`T` 被推断为**字面量** `1`（因为 `const` 风格的推断），所以 `U extends 1` 只接受 `1`。需要显式放宽：

```typescript
constrained<number, number>(1, 2);   // ✓
```

## 多位置推断：取最佳公共类型

同一个类型参数出现在多个参数位置时，TypeScript 会找"最佳公共类型"：

```typescript
function combine<T>(a: T, b: T): T { return a; }

combine(1, 2);        // T = number
combine("a", "b");    // T = string
combine(1, "a");      // 报错
```

`combine(1, "a")` 会尝试 `T = string | number`，但那时 `a: number` 和 `b: string` 都不满足 `T`。

> [!TIP] 用独立类型参数避免这个问题
> 如果两个参数类型确实可以不同，用两个类型参数：
>
> ```typescript
> function combine2<T, U>(a: T, b: U): [T, U] { return [a, b]; }
> const l = combine2(1, "a");   // T = number, U = string
> ```

## 默认类型参数

推断失败时的兜底：

```typescript
function withDefault<T = string>(): T | undefined { return undefined; }

withDefault();              // T = string（用默认值）
withDefault<number>();      // T = number（显式指定优先）
```

## `NoInfer`：阻止某位置参与推断（TS 5.4+）

有些位置你不希望它影响推断结果：

```typescript
function withNoInfer<T>(items: T[], fallback: NoInfer<T>): T {
  return items.length ? items[0]! : fallback;
}

withNoInfer([1, 2], 0);     // T = number，由 items 决定
```

没有 `NoInfer` 时，`fallback` 也参与推断——它会让不匹配的值直接报错，而不是静默扩大 `T`：

```typescript
function withoutNoInfer<T>(items: T[], fallback: T): T { }

withoutNoInfer([1, 2], "x");
// error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.

// 想接受混合类型要显式标注
withoutNoInfer<number | string>([1, 2], "x");   // ✓
```

`NoInfer<T>` 的语义是"这个位置**使用** `T`，但不**推断** `T`"。它适合的场景是：某个参数的类型应该完全跟随另一个参数，而不应该反过来影响它。

## 推断规则速查

| 想做的事 | 写法 |
|---|---|
| 从参数推断 | `f<T>(x: T)` |
| 保留字面量 | `f<const T>(x: T)`（见 [泛型](./generics.md)） |
| 阻止某位置推断 | `NoInfer<T>` |
| 提供兜底 | `f<T = string>(...)` |
| 只在返回位置用 | 调用方必须显式指定 `f<string>()` |

## 相关

- [泛型](./generics.md) —— 泛型的完整基础
- [高级类型](./advanced-types.md) —— `infer` 在条件类型里的推断
- [类型收窄](./narrowing.md) —— `unknown` 的处理
