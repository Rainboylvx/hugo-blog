---
title: "泛型"
date: 2026-09-21
weight: 40
draft: false
toc: true
tags: ["typescript"]
---

泛型（generics）是把**类型**变成参数。前面所有章节的类型都是具体的——`string`、`number`、`{ x: number }`——泛型解决的问题是：**当类型本身事先未知时，怎么让类型关系在调用点才确定下来**。

这不是"为了少写几个类型"，而是为了表达"输入和输出之间的关系"。

## 为什么需要泛型

先看不使用泛型的做法。一个取数组首元素的函数，要为每种类型写一遍：

```typescript
function firstString(arr: string[]): string | undefined { return arr[0]; }
function firstNumber(arr: number[]): number | undefined { return arr[0]; }
function firstBool(arr: boolean[]): boolean | undefined { return arr[0]; }
```

用联合类型可以少写几个，但会**丢失类型关系**：

```typescript
function first(arr: unknown[]): unknown { return arr[0]; }
const x = first([1, 2, 3]);   // x 是 unknown，不是 number
```

返回类型 `unknown` 和输入类型 `number[]` 之间的关系丢失了。泛型把这条关系写出来：

```typescript
function first<T>(arr: T[]): T | undefined { return arr[0]; }
const x = first([1, 2, 3]);   // x 是 number | undefined
```

`T` 表示"调用时才知道的那个类型"，`arr: T[]` 和 `: T` 之间的对应关系被类型检查器记住了。

## 泛型函数、接口、类

{{< include "src/generics/basics.ts" "ts" >}}

```text
hello 42 [ 'k', 1 ] 3 2
a a 1 2 2
```

### 泛型函数

```typescript
function identity<T>(value: T): T { return value; }

identity<string>("hello");   // 显式指定 T
identity(42);                // 自动推断 T = number
```

显式指定通常不必要——推断能处理绝大多数情况，而显式指定反而可能写错。只在推断失败或推断结果不符合预期时才写。

### 泛型接口与类型别名

```typescript
interface Box<T = string> {
  value: T;
}

type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

`= string` 是**默认类型参数**，不指定时使用。它可以避免调用方被迫写 `Box<string>` 这种显而易见的情况。

### 泛型类

```typescript
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}

const s = new Stack<number>();   // T 在这里绑定
s.push(1);
```

> [!TIP] 泛型类 vs 泛型构造函数
> 类型参数绑定在**类**上（`Stack<number>`）时，整个实例的生命周期共享同一个 `T`。如果只需要单个方法泛型，把 `<T>` 写在方法上，不要写在类上——类级泛型会让 `T` 在实例创建时就固定，失去灵活性。

## 泛型约束

无约束的 `T` 可以是任何类型，所以不能对它做任何假设：

```typescript
function bad<T>(x: T): number {
  return x.length;
  // error TS2339: Property 'length' does not exist on type 'T'.
}
```

要使用 `T` 的成员，必须约束它：

{{< include "src/generics/constraints.ts" "ts" >}}

```text
a [ 1, 2 ]
id_1 widget 1
1 [ 'a', 'b' ] [ 'a', 'b' ]
```

约束的五种常见形态：

| 形态 | 写法 | 用途 |
|---|---|---|
| 对象形状 | `T extends { name: string }` | 要求有某个属性 |
| `keyof` | `K extends keyof T` | 键必须存在于对象上 |
| 联合 | `T extends string \| number` | 限定取值集合 |
| 构造函数 | `new () => T` | 传入一个类 |
| 带参数构造函数 | `new (...args: A) => T` | 传入类并转发参数 |

### `keyof` 约束是最常用的一个

```typescript
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const value = get({ x: 1, y: "a" }, "y");   // 类型是 string
```

`K extends keyof T` 保证 `key` 一定是 `obj` 的键，`T[K]` 是索引访问类型，返回精确的值的类型。这样拼错键名会在编译期报错：

```typescript
get({ x: 1, y: "a" }, "z");
// error TS2345: Argument of type '"z"' is not assignable to parameter of type '"x" | "y"'.
```

### `const` 类型参数（TS 5.0+）

普通推断会把数组字面量推成 `string[]`，加上 `const` 修饰符后保留字面量类型：

```typescript
function tuple<T extends readonly unknown[]>(items: T): T { return items; }
function tupleConst<const T extends readonly unknown[]>(items: T): T { return items; }

const t1 = tuple(["a", "b"]);
const probe1: string[] = t1;              // 通过，说明 t1 是 string[]

const t2 = tupleConst(["a", "b"]);        // readonly ["a", "b"]
// @ts-expect-error TS4104: readonly 不能赋给可变类型
const probe2: string[] = t2;
```

实测错误消息，证明 `t2` 保留了字面量元组类型：

```text
error TS4104: The type 'readonly ["a", "b"]' is 'readonly' and cannot be assigned to the mutable type 'string[]'.
```

`const T` 是给"类型推断太宽"这个问题提供的官方解法，比自己写 `as const` 更自然。

## 推断时机与位置

类型参数从哪些位置被推断出来，是理解泛型行为的关键：

{{< include "src/generics/inference.ts" "ts" >}}

```text
a 1 1 1 undefined 1 a undefined 1 1
```

| 推断来源 | 例子 | 结果 |
|---|---|---|
| 参数本身 | `f<T>(x: T)` | `f("a")` → `T = string` |
| 参数的结构 | `f<T>(o: { value: T })` | `f({value: 1})` → `T = number` |
| 数组元素 | `f<T>(arr: T[])` | `f([1,2])` → `T = number` |
| 回调返回值 | `f<T>(cb: () => T)` | `f(() => 1)` → `T = number` |
| 默认参数 | `f<T = string>(x?: T)` | `f()` → `T = string` |

### 推断不出来的情况

如果类型参数**只出现在返回位置**，就没有东西可以推断：

```typescript
function make<T>(): T {
  return undefined as T;
}

const uninferred = make();          // T = unknown
// @ts-expect-error TS2322: unknown 不能赋给 string
const probe: string = uninferred;

const r5 = make<string>();          // 必须显式指定
```

注意结果是 `unknown` 而不是 `any`，也不是报错。这是有意的设计：`unknown` 强制你显式收窄（见 [类型收窄](./narrowing.md)），而 `any` 会静默传播。

### `NoInfer`（TS 5.4+）

有些位置你不希望参与推断：

```typescript
function withNoInfer<T>(items: T[], fallback: NoInfer<T>): T {
  return items.length ? items[0]! : fallback;
}

const r11 = withNoInfer([1, 2], 0);   // T = number，由 items 决定
```

没有 `NoInfer` 时，`fallback` 也会参与推断，可能把 `T` 推成一个不该出现的联合类型。

## 类型参数的位置决定作用域

`<T>` 写在哪里，决定了它什么时候被绑定：

```typescript
// T 在调用签名里 → 每次调用函数时绑定
type Filter1 = { <T>(arr: T[], f: (x: T) => boolean): T[] };

// T 在类型别名上 → 使用 Filter2<number> 时绑定一次
type Filter2<T> = { (arr: T[], f: (x: T) => boolean): T[] };

// 具名函数：每次调用绑定
function filter<T>(arr: T[], f: (x: T) => boolean): T[] { /* ... */ }
```

第一种更灵活（一个变量可以依次处理不同类型），第二种更简单（写一次约束到底）。选择取决于你是否需要同一个函数变量处理多种类型。

## 常见误区

### 误区一：给泛型加不必要的约束

```typescript
// 没必要：T 没有被真正约束，只是限制了调用方
function bad<T extends object>(x: T): T { return x; }

// 需要时才约束
function good<T extends { length: number }>(x: T): number { return x.length; }
```

`extends object` 没有给你任何额外的能力，只是把 `string`、`number` 等调用方排除掉了。

### 误区二：把泛型当 `any` 用

```typescript
// 这是泛型语法，但等于 any
function bad<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
```

`T` 没有任何约束时，你不能对 `x` 做任何有意义的操作。如果函数体不需要用到 `T` 的任何能力，那它可能不需要泛型。

### 误区三：忽略 `T` 可能推断成 `never`

```typescript
function first<T>(arr: T[]): T | undefined { return arr[0]; }
const r = first([]);   // T 推断为 never
```

实测：`T` 确实是 `never`，而返回类型 `never | undefined` 会被简化为 `undefined`：

```typescript
const a: never = first([])!;    // 通过，证明 T 是 never
const b: undefined = r;         // 通过，证明返回类型就是 undefined
const c: string = r;
// error TS2322: Type 'undefined' is not assignable to type 'string'.
```

空数组让 TypeScript 无法确定元素类型，推断为 `never`。这时显式指定类型参数：`first<number>([])`。

## 小结

| 主题 | 核心结论 |
|---|---|
| 泛型的作用 | 表达输入与输出之间的类型关系，不是少写代码 |
| 类型参数位置 | 写在类上 = 实例级绑定；写在方法上 = 调用级绑定 |
| 约束 | 要用 `T` 的成员就必须约束；`K extends keyof T` 最常用 |
| 推断来源 | 参数、参数结构、数组元素、回调返回值、默认值 |
| 推断失败 | 结果是 `unknown`，需要显式指定或收窄 |
| `const T` | 保留字面量类型，替代 `as const` |
| `NoInfer` | 阻止某个位置参与推断 |

下一篇：[高级类型](./advanced-types.md)。
