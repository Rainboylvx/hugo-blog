---
title: "类型收窄"
date: 2026-09-21
weight: 30
draft: false
toc: true
tags: ["typescript"]
---

联合类型说"这个值可能是 A 或 B"，收窄（narrowing）解决的是下一个问题：**在这个分支里，它到底是哪个**。这是 TypeScript 里最实用、也最容易被低估的部分——类型系统真正的价值不在于声明类型，而在于沿着控制流自动把宽类型收窄成窄类型，让你在每一行都拿到最精确的类型。

## 为什么要收窄

联合类型上只能访问**所有成员共有**的成员：

{{< include "src/narrowing/narrowing-limits.ts" "ts" >}}

```text
h 抛错: Cannot read properties of null (reading 'length')
1 2 1
3 a undefined
```

第一条错误是核心：

```text
error TS2339: Property 'a' does not exist on type 'A | B'.
  Property 'a' does not exist on type 'B'.
```

`A | B` 可能是 `B`，而 `B` 没有 `a`。类型检查器拒绝访问任何"不保证存在"的成员。

要访问 `a`，必须先**证明**这个值是 `A`。证明的方式就是收窄。

## `typeof` 收窄

最基础的手段，用于原始类型：

{{< include "src/narrowing/typeof-guard.ts" "ts" >}}

```text
  a   1.50
string: X number: 1.0 null undefined
```

`typeof` 在 `if` 里对原始类型是精确的：

| 判断 | 收窄为 |
|---|---|
| `typeof x === "string"` | `string` |
| `typeof x === "number"` | `number` |
| `typeof x === "boolean"` | `boolean` |
| `typeof x === "bigint"` | `bigint` |
| `typeof x === "symbol"` | `symbol` |
| `typeof x === "undefined"` | `undefined` |
| `typeof x === "function"` | 函数类型 |
| `typeof x === "object"` | `object \| null` ← **注意含 null** |

> [!WARNING] `typeof null === "object"`
> 这是 JavaScript 的历史遗留问题。`typeof x === "object"` **不能**排除 `null`，必须额外写 `x !== null`。这是最常见的收窄漏洞。

## 真值收窄

在 `if` 里直接判断，会把 falsy 值全部排除：

{{< include "src/narrowing/truthiness-guard.ts" "ts" >}}

```text
1 0
A anonymous false 1 1
```

`if (!name) return` 之后，`name` 被收窄为 `string`——因为 `null`、`undefined`、`""` 都是 falsy。

> [!TIP] `??` 与 `||` 的区别
> `a ?? b` 只在 `a` 是 `null`/`undefined` 时用 `b`；`a || b` 在 `a` 是任何 falsy 值时都用 `b`。对 `0`、`""`、`false` 这些合法值，`||` 会错误地替换掉它们：
>
> ```typescript
> const zero = 0;
> console.log(zero || 1, zero ?? 1);   // 1 0
> ```
>
> 处理可选配置项时优先用 `??`。

## `in` 收窄

判断属性是否存在，用于区分对象形状：

```typescript
interface Fish { swim: () => void }
interface Bird { fly: () => void }

function move(animal: Fish | Bird): string {
  if ("swim" in animal) {
    animal.swim();          // 收窄为 Fish
    return "swimming";
  }
  animal.fly();             // 收窄为 Bird
  return "flying";
}
```

`in` 对可选属性的窄化（TS 4.9+）有个陷阱。属性**可选**时，`in` 判断为假**不能排除**该类型：

```typescript
type OptionalFish = { swim?: () => void };
type Bird = { fly: () => void };

function f(animal: OptionalFish | Bird) {
  if ("swim" in animal) {
    const probe: () => void = animal.swim;   // 报错：(() => void) | undefined
  }
  return animal.fly;                          // 报错：OptionalFish 也可能没有 fly
}
```

实测两条错误：

```text
error TS2322: Type '(() => void) | undefined' is not assignable to type '() => void'.
  Type 'undefined' is not assignable to type '() => void'.
error TS2339: Property 'fly' does not exist on type 'Bird | OptionalFish'.
  Property 'fly' does not exist on type 'OptionalFish'.
```

原因：`OptionalFish` 合法地**可能**没有 `swim`（因为它是可选的），所以 "`swim` 不在里面" 无法排除它。修正办法是加真值检查，或者把属性改成必需：

```typescript
// 办法一：真值检查
if ("swim" in animal && animal.swim) {
  animal.swim();      // undefined 被排除
}

// 办法二：属性必需时，负分支能正确收窄
type RequiredFish = { swim: () => void };
function g(animal: RequiredFish | Bird) {
  if ("swim" in animal) return "swim";
  animal.fly();       // 收窄为 Bird，通过
}
```

## `instanceof` 收窄

`instanceof` 检查原型链，**只能用于 class**：

{{< include "src/narrowing/in-and-instanceof.ts" "ts" >}}

```text
swimming flying
api 404: not found error: boom plain
```

为什么只能用于 class？因为 `instanceof` 在运行时需要右侧的构造函数真实存在。`interface` 编译后被擦除（见 [类型擦除](./type-erasure.md)），所以：

```typescript
interface User { name: string }
value instanceof User;
// error TS2693: 'User' only refers to a type, but is being used as a value here.
```

在 `catch` 里 `instanceof` 是标准做法。注意 `catch` 的变量类型是 `unknown`（TS 4.4+ 默认，配合 `useUnknownInCatchVariables`）：

```typescript
try { } catch (e) {
  if (e instanceof ApiError) { }      // 先收窄
  else if (e instanceof Error) { }
  else { String(e); }                  // 仍是 unknown
}
```

## 可辨识联合：最有价值的模式

给每个联合成员一个**共同的字面量字段**作为标签，然后 `switch` 它：

{{< include "src/narrowing/discriminated-union.ts" "ts" >}}

```text
1
3.141592653589793 4
failed
```

这是 TypeScript 里最值得推广的模式。三个好处：

1. **每个分支自动收窄**，不用写类型断言
2. **穷尽性检查**：漏掉一个成员会编译报错
3. **自文档化**：`kind` 字段本身就是可读的枚举

穷尽性检查靠 `never` 实现：

```typescript
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default: {
      const exhaustive: never = s;   // 新增成员时这里报错
      throw new Error(`unhandled: ${JSON.stringify(exhaustive)}`);
    }
  }
}
```

如果给 `Shape` 加一个 `{ kind: "triangle"; ... }`，`s` 在 `default` 里就不再是 `never`，赋值报错：

```text
error TS2322: Type '{ kind: "triangle"; ... }' is not assignable to type 'never'.
```

这是重构时最有价值的一道保险。

> [!TIP] 让穷尽性检查更早暴露
> 开启 `noImplicitReturns` 和 `noFallthroughCasesInSwitch`（都属于 `strict` 家族或建议手动开启），配合 `never` 检查，能让"忘了处理新分支"在编译期就被抓住。

## 自定义类型谓词

当内置手段不够用时，用 `value is T` 声明一个类型谓词：

{{< include "src/narrowing/custom-guards.ts" "ts" >}}

```text
meow bark
ABC [ 'a', 'b' ]
nope
```

两种写法：

```typescript
// 类型谓词：返回 boolean，收窄为 T
function isCat(a: Cat | Dog): a is Cat {
  return "meow" in a;
}

// 断言函数：不返回，收窄调用点之后的类型
function assertIsString(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new Error("not a string");
}
```

断言函数（`asserts`）的特别之处：它在**调用点之后**改变类型。上例中 `assertIsString(v)` 之后，`v` 直接被当作 `string`，不需要 `if` 包裹。

> [!WARNING] 类型谓词是"你向编译器承诺"，不是"编译器替你验证"
> `function isCat(a): a is Cat { return true; }` 完全合法，编译不会报错。如果谓词实现错了，编译器不会发现——它只是相信你。所以谓词内部要写真正的检查逻辑。

### 数组 filter 的自动谓词

`Array.prototype.filter` 曾经必须手写类型谓词，TS 5.5 起会**自动推断**：

```typescript
const items: (string | null)[] = ["a", null];

// 不用手写 x is string，TS 5.5+ / 7 自动推断出 string[]
const nonNull = items.filter((x) => x !== null);
```

实测确认（TS 7.0.2）：

```typescript
const items: (string | null)[] = ["a", null];
const out = items.filter((x) => x !== null);
const check: string[] = out;      // 通过，说明 out 被推断为 string[]
```

条件更复杂时推断不出来，仍需手写谓词：

```typescript
const nonNull = items.filter((x): x is string => x !== null);
```

## 收窄的边界

有些情况收窄确实帮不上忙，需要知道边界在哪：

{{< include "src/narrowing/narrowing-limits.ts" "ts" >}}

### 赋值会重置收窄

```typescript
function h(o: { v: string | null }) {
  if (o.v !== null) {
    o.v = null;               // 赋值后收窄被重置
    // @ts-expect-error TS18047: 'o.v' is possibly 'null'
    return o.v.length;
  }
  return 0;
}
```

注意上面这个函数**编译通过**（因为 `@ts-expect-error` 抑制了），但**运行时真的会抛错**：

```text
h 抛错: Cannot read properties of null (reading 'length')
```

这正说明收窄是编译期概念：它只是告诉类型检查器"在这一行，我认为它是 `string`"，不产生任何运行时保护。

解法是取出到 `const` 局部变量，收窄就稳定了：

```typescript
const v = o.v;
if (v !== null) {
  return v.length;          // v 是 const，不会被重新赋值
}
```

### 类型断言绕过检查

```typescript
function assert(x: A | B) {
  return (x as A).a;          // 编译通过，运行时可能是 undefined
}
```

`as` 不做运行时验证，见 [类型擦除](./type-erasure.md)。

### 索引访问默认不检查越界

```typescript
const arr: string[] = ["a"];
const second = arr[1];        // 推断为 string —— 但运行时是 undefined
```

实测开启 `noUncheckedIndexedAccess` 后：

```text
error TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

这个选项属于"更严格但不属于 `strict`"的类别，新项目建议开启。

## 常见错误速查

以下消息经实际编译验证（TS 7.0.2）：

| 错误码 | 消息 | 触发场景 |
|---|---|---|
| TS2339 | `Property 'a' does not exist on type 'A \| B'.` | 联合上访问非公共成员 |
| TS18047 | `'o.v' is possibly 'null'.` | 收窄后被赋值重置 |
| TS18046 | `'x' is of type 'unknown'.` | 未收窄就操作 `unknown` |
| TS2367 | `This comparison appears to be unintentional because the types '1' and '2' have no overlap.` | 比较两个不可能相等的字面量类型 |

## 小结

| 手段 | 适用 | 注意 |
|---|---|---|
| `typeof` | 原始类型 | `typeof null === "object"` 陷阱 |
| 真值判断 | 排除 falsy | `\|\|` 会误伤 `0`/`""`，用 `??` |
| `in` | 区分对象形状 | 属性名是字符串 |
| `instanceof` | class 实例 | 不能用于 interface |
| 可辨识联合 | 多态对象 | 最有价值，配 `never` 做穷尽性检查 |
| 类型谓词 | 自定义逻辑 | 编译器信任你，谓词要写对 |
| `asserts` | 调用点后收窄 | 需要真的抛异常 |

下一篇：[泛型](./generics.md)。
