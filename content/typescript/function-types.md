---
title: "函数类型"
date: 2026-09-21
weight: 23
draft: false
toc: true
tags: ["typescript"]
---

函数是 TypeScript 里类型最复杂的构造之一：参数的变型规则、`this` 的类型、重载签名与实现签名的分离，每一条都有反直觉的地方。

## 参数逆变与返回值协变

{{< include "src/function-types/variance.ts" "ts" >}}

```text
function function function object object object object function
```

核心规则：**参数类型更宽的函数，可以赋值给参数类型更窄的位置**。

```typescript
interface BaseEvent { type: string }
interface ClickEvent extends BaseEvent { x: number; y: number }

type Handler = (e: ClickEvent) => void;

const wide: Handler = (e: BaseEvent) => {};      // ✓ 参数更宽，安全
const narrow: (e: BaseEvent) => void = (e: ClickEvent) => {};
// error TS2322: Types of parameters 'e' and 'e' are incompatible.
```

为什么？因为 `Handler` 会被用 `ClickEvent` 调用。如果实现只接受 `ClickEvent`，那没问题；但如果实现接受 `BaseEvent`，也能处理 `ClickEvent`（因为它是子类型）。反过来，如果实现只接受比 `ClickEvent` **更窄**的类型，就无法处理所有 `ClickEvent`。

实测错误消息：

```text
error TS2322: Type '(e: BaseEvent) => void' is not assignable to type '(e: ClickEvent) => void'.
  Types of parameters 'e' and 'e' are incompatible.
    Property 'type' is missing in type 'ClickEvent' but required in type 'BaseEvent'.
```

返回值方向相反——**返回更窄类型是安全的**：

```typescript
type Factory = () => BaseEvent;
const specific: Factory = () => ({ type: "click", x: 1, y: 2 });   // ✓ 返回子类型
```

### 方法简写 vs 属性写法

这是 `strictFunctionTypes` 的一个例外，很容易踩：

```typescript
interface WithMethod {
  handle(e: BaseEvent): void;      // 方法简写：双变（bivariant）
}
interface WithProperty {
  handle: (e: BaseEvent) => void;  // 属性写法：逆变
}

// 方法简写允许传"更窄参数"的函数
const m: WithMethod = { handle: (e: ClickEvent) => {} };

// 属性写法拒绝
const p: WithProperty = { handle: (e: ClickEvent) => {} };
// error TS2322: Type '(e: ClickEvent) => void' is not assignable to type '(e: BaseEvent) => void'.
```

**结论：方法简写比属性写法宽松**。这是历史原因（为了让 `Array` 等内置类型的方法可用），但意味着：

> [!WARNING] 想要严格的逆变检查，用属性写法
> 如果类型安全对你很重要，把接口里的方法写成属性形式 `handle: (e: T) => void`，而不是方法简写 `handle(e: T): void`。`strictFunctionTypes` 只对属性写法生效。

## `this` 参数

{{< include "src/function-types/this-param.ts" "ts" >}}

```text
div click
1 42 1 4 1 1 3
```

`this` 默认是 `any`，`noImplicitThis`（`strict` 包含）下报错：

```typescript
function bad() {
  return this.value;
  // error TS2683: 'this' implicitly has type 'any' because it does not have a
  // type annotation.
}
```

显式声明用**伪参数**语法——它写在参数列表第一位，但**不占实参位置**：

```typescript
function good(this: { value: number }): number {
  return this.value;
}

good.call({ value: 1 });    // 用 call/apply 绑定
// good({ value: 1 });      // 错误：this 参数不占实参位
```

`this: void` 表示"这个函数不能用 `this`"：

```typescript
function standalone(this: void, x: number): number { return x * 2; }
```

两个类型工具：

```typescript
type T = ThisParameterType<typeof good>;      // { value: number }
type N = OmitThisParameter<typeof good>;      // () => number
```

## 函数重载

{{< include "src/function-types/overloads.ts" "ts" >}}

```text
A 1.00 2020-01-01T00:00:00.000Z
string number narrow
1 1 a 1
```

重载的结构是**多个调用签名 + 一个实现签名**：

```typescript
function format(value: string): string;      // 重载签名（调用方可见）
function format(value: number): string;
function format(value: Date): string;
function format(value: string | number | Date): string {   // 实现签名（调用方不可见）
  // ...
}
```

实现签名**不对外可见**，且必须兼容所有重载签名。

### 重载顺序决定匹配结果

TypeScript 按声明顺序**从上往下**匹配，先匹配到的生效：

```typescript
function badPick(x: string | number): "wide";
function badPick(x: string): "narrow";
function badPick(x: string | number): "wide" | "narrow" {
  return typeof x === "string" ? "narrow" : "wide";
}

const r = badPick("a");    // 类型是 "wide"！
```

注意这里有个**危险的错位**：类型说 `"wide"`，但运行时返回 `"narrow"`。实测确认：

```typescript
const probe: "wide" = badPick("a");   // 编译通过
// 但运行时 badPick("a") === "narrow"
```

> [!WARNING] 把窄签名写在前面
> 宽签名放在前面会"吃掉"所有调用，窄签名永远匹配不到。这不会报错，但会让类型和运行时行为不一致。规则：**更具体的签名写在更宽泛的前面**。

### 什么时候该用重载

| 场景 | 用什么 |
|---|---|
| 返回类型依赖入参类型 | **重载** |
| 入参数量不同 | **重载** |
| 返回值不依赖入参 | 联合类型更简单 |

```typescript
// 用重载：空数组返回 null，非空返回元素类型
function firstOrNull(arr: []): null;
function firstOrNull<T>(arr: T[]): T;
function firstOrNull<T>(arr: T[]): T | null {
  return arr.length ? arr[0]! : null;
}

// 用联合：返回值不依赖入参
function simple(x: string | number): string { return String(x); }
```

### 用箭头函数写重载

箭头函数不能有重载签名，要用类型别名 + 断言：

```typescript
type Overloaded = {
  (x: string): string;
  (x: number): number;
};

const impl = ((x: string | number) => x) as Overloaded;
```

`as` 在这里是必要的，因为实现签名的类型和重载集合不完全兼容。

## 参数的其他形式

```typescript
function greet(name: string, title?: string): string { }    // 可选参数（必须在末尾）
function repeat(text: string, times = 2): string { }        // 默认参数（自动推断）
function sum(...nums: number[]): number { }                 // 剩余参数
function dist({ x, y }: { x: number; y: number }): number { }  // 解构参数（需整体注解）
```

解构参数必须整体注解，因为解构本身不提供类型信息。

## 相关

- [类型基础](./type-basics.md) —— 函数类型的基础语法
- [泛型](./generics.md) —— 泛型函数与推断位置
- [类与装饰器](./classes-and-decorators.md) —— 类方法中的 `this` 类型
