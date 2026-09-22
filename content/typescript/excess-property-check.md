---
title: "多余属性检查"
date: 2026-09-21
weight: 36
draft: false
toc: true
tags: ["typescript"]
---

这是 TypeScript 里最让人困惑的规则之一：**同样的对象，直接写字面量会报错，先存变量就不报错**。

## 规则本身

{{< include "src/excess-property-check/behavior.ts" "ts" >}}

```text
{ x: 1, y: 2, z: 3 } { x: 1, y: 2, z: 3 } 1,2 { x: 1, y: 2 } { x: 1, anything: 'ok' } { kind: 'a', a: 1 } { kind: 'b', b: 1 } { anything: 1, more: 'x' } [ { id: 1, extra: true } ] [ { id: 1, extra: true } ] { kind: 'a', b: 1 }
```

```typescript
interface Point { x: number; y: number }

// 直接赋字面量：报错
const p1: Point = { x: 1, y: 2, z: 3 };
// error TS2353: Object literal may only specify known properties, and 'z'
// does not exist in type 'Point'.

// 先存变量：通过
const raw = { x: 1, y: 2, z: 3 };
const p2: Point = raw;      // ✓
```

同样的规则适用于函数参数：

```typescript
function draw(p: Point): string { }

draw({ x: 1, y: 2, z: 3 });   // ✗ 字面量直接传，检查
const withZ = { x: 1, y: 2, z: 3 };
draw(withZ);                  // ✓ 变量传，不检查
```

## 为什么会这样

两个原因：

**原因一：结构类型系统。** TypeScript 是结构类型——只要对象的形状**满足**目标类型就够了。`{ x, y, z }` 满足 `Point`（有 `x` 和 `y`），多出的 `z` 不影响兼容性。

**原因二：拼写错误防护。** 如果字面量直接写，多出来的属性很可能是**拼错了**：

```typescript
const typo: Point = { X: 1, y: 2 };
// error TS2561: Object literal may only specify known properties, but 'X' does
// not exist in type 'Point'. Did you mean to write 'x'?
```

所以这个检查**只针对字面量**，因为只有字面量才能可靠地推断"用户是不是写错了"。一旦经过变量，TypeScript 无法判断那个变量是有意构造的还是有 bug，就放弃检查。

> [!TIP] 记住这个说法
> 多余属性检查是**"新鲜对象字面量检查"**（fresh object literal check）。它只作用于"新鲜"的字面量——刚写出来、还没被赋给任何变量、也没经过类型注解的字面量。

## 什么会关闭这个检查

| 情况 | 是否检查 |
|---|---|
| 直接写字面量 | ✓ 检查 |
| 先存变量 | ✗ 不检查 |
| 通过函数返回值 | ✗ 不检查 |
| 对象展开 `{...base}` | ✗ 不检查 |
| 类型有索引签名 | ✗ 不检查 |
| 目标类型是 `{}` | ✗ 不检查 |
| 类型断言 `as` | ✗ 不检查 |

```typescript
// 索引签名关闭检查
interface WithIndex {
  x: number;
  [key: string]: unknown;
}
const p3: WithIndex = { x: 1, anything: "ok" };   // ✓

// {} 没有已知属性，所以任何字面量都满足
const anyObj: {} = { anything: 1, more: "x" };    // ✓
```

数组里的元素也是字面量，同样检查：

```typescript
const items: Item[] = [{ id: 1, extra: true }];   // ✗ 检查
const raw = [{ id: 1, extra: true }];
const items2: Item[] = raw;                        // ✓ 不检查
```

## 联合类型下的行为

```typescript
type A = { kind: "a"; a: number };
type B = { kind: "b"; b: number };

const mixed: A | B = { kind: "a", b: 1 };
// error TS2353: Object literal may only specify known properties, and 'b'
// does not exist in type 'A'.
```

错误说的是 `A`——因为 `kind: "a"` 已经确定了它应该是 `A`，然后 `b` 就成了多余属性。

## 绕过的四种方式

{{< include "src/excess-property-check/workarounds.ts" "ts" >}}

```text
{ x: 1, y: 2, z: 3 } { x: 1, y: 2, z: 3 } { x: 1, y: 2, z: 3 } 3 { x: 1, y: 2, z: 3 } { x: 1, y: 2, z: 3 } 3 { x: 1, y: 2, z: 3 } to a <b> { x: 1, y: 2, z: 3 } { X: 1, y: 2 }
```

### 方式一：中间变量

```typescript
const raw = { x: 1, y: 2, z: 3 };
const p1: Point = raw;
```

最简单，但会**丢失字面量检查**——拼写错误也不会被抓到。

### 方式二：类型断言

```typescript
const p2: Point = { x: 1, y: 2, z: 3 } as Point;

// 更精确：保留额外属性的类型
const p3 = { x: 1, y: 2, z: 3 } as Point & { z: number };
p3.z;    // ✓ 可访问
```

断言明确表达了"我知道有额外属性"，比中间变量更清晰地传达了意图。

### 方式三：索引签名

如果类型**本来就允许**额外键，直接加索引签名：

```typescript
interface PointWithExtra {
  x: number;
  y: number;
  [key: string]: unknown;
}
const p4: PointWithExtra = { x: 1, y: 2, z: 3 };   // ✓ 无需绕过
```

### 方式四：泛型函数

需要"接受宽输入但保留精确类型"时：

```typescript
function createPoint<T extends Point>(p: T): T {
  return p;
}

const p5 = createPoint({ x: 1, y: 2, z: 3 });   // T = { x: 1; y: 2; z: 3 }
p5.z;    // ✓ 保留了 z
```

对比不泛型的版本，额外属性会丢失：

```typescript
function plain(p: Point): Point { return p; }
const p6 = plain({ x: 1, y: 2, z: 3 } as Point);
// p6.z 报错：Point 上没有 z
```

## 实用场景：把宽对象传给窄参数

这是最常见的"该不该绕过"的场景：

```typescript
interface User { id: number; name: string; email: string }

function sendEmail(u: Pick<User, "name" | "email">): string { }

const fullUser: User = { id: 1, name: "a", email: "b" };
sendEmail(fullUser);              // ✓ 变量传参，不检查多余属性

sendEmail({ id: 1, name: "a", email: "b" });
// error TS2353: 'id' 是多余的

sendEmail({ name: "a", email: "b" });   // ✓ 显式构造需要的形状
```

## 判断标准

多余属性检查是**防止拼写错误的保护机制**。绕过之前先问：多出来的属性是**有意**的还是**笔误**？

```typescript
// 有意的：对象展开
const base = { x: 1, y: 2 };
const withZ = { ...base, z: 3 };
const p7: Point = withZ;      // ✓ 不检查，符合预期

// 笔误：应该被抓住
const typo: Point = { X: 1, y: 2 };
// error TS2561: Object literal may only specify known properties, but 'X' does
// not exist in type 'Point'. Did you mean to write 'x'?
```

> [!WARNING] 不要用中间变量"掩盖"错误
> `const raw = {...}; const p: Point = raw;` 这个套路很方便，但它同时关掉了拼写检查。如果你只是想快速让编译通过，可能会把真正的 bug 藏起来。
>
> 更好的做法是**显式构造需要的形状**，或者用 `as` 明确表达意图。

## 相关

- [类型基础](./type-basics.md) —— 对象类型的基础
- [interface 与 type](./interface-vs-type.md) —— `&` 交叉与 `extends` 的错误检查差异
- [类型擦除](./type-erasure.md) —— 为什么这些都是编译期检查
