---
title: "类既是值又是类型"
date: 2026-09-21
weight: 35
draft: false
toc: true
tags: ["typescript"]
---

`class` 是 TypeScript 里唯一同时占据**值空间**和**类型空间**的声明。这解释了为什么 `console.log(C.a)` 会报错，也解释了 `typeof C` 和 `C` 为什么是两回事。

## 两个身份

{{< include "src/class-value-and-type/two-sides.ts" "ts" >}}

```text
function
123 3 123
1.0 0
D { a: '123' }
```

```typescript
class C {
  a = "123";                // 实例属性
  static version = "1.0";   // 静态属性
  method(): string { }
  static create(): C { }
}

const ctor = C;              // ✓ 值位置：C 是构造函数
let c: C = new C();          // ✓ 类型位置：C 是实例类型
```

| 位置 | `C` 表示什么 | 有哪些成员 |
|---|---|---|
| 值 | 构造函数（运行时函数） | `version`、`create`、`prototype` |
| 类型 | 实例类型 | `a`、`n`、`method` |

## `C` 与 `typeof C`

这是理解类双身份的关键：

```typescript
const inst: C = new C();          // C 作类型 = 实例类型
const ctorTyped: typeof C = C;    // typeof C = 构造函数类型
```

`typeof C` 在类型位置查询 `C` 这个**值**的类型，得到构造函数类型——包含静态成员。

```typescript
inst.a;            // ✓ 实例成员
inst.method();     // ✓

ctorTyped.version; // ✓ 静态成员
ctorTyped.create(); // ✓
```

## 经典错误：把类当实例用

```typescript
class D { a = "123" }

const d: D = new D();
console.log(d);     // D { a: '123' }  ← 实例
console.log(D);     // [class D]      ← 构造函数

console.log(D.a);
// error TS2339: Property 'a' does not exist on type 'typeof D'.
```

`a` 是**实例属性**，只在 `new D()` 出来的对象上。`D` 本身是构造函数，它上面只有静态成员和 `prototype`。

> [!WARNING] 报错信息里的 `typeof D`
> 注意错误说的是 `typeof D` 而不是 `D`。因为 `D` 在值位置被使用时，类型检查器看的是它的**值的类型**，也就是构造函数类型。看到这个措辞就知道是"静态侧没有这个成员"。

## 接口只约束实例侧

```typescript
interface HasA { a: string }

const asInterface: HasA = new C(4);   // ✓ 实例满足

const ctorAsInterface: HasA = C;
// error TS2741: Property 'a' is missing in type 'typeof C' but required in type
// 'HasA'.
```

`implements` 也是同一规则——它检查实例侧：

```typescript
interface Serializable { serialize(): string }

class Foo implements Serializable {
  serialize() { return ""; }     // 必须是实例方法
}
```

## 用 `typeof C` 表达"传入一个类"

这是实际开发中常见的需求：

```typescript
// 泛型构造函数类型
function instantiate<T>(Ctor: new (...args: any[]) => T): T {
  return new Ctor();
}

const made = instantiate(C);   // T 推断为 C
```

更精确的写法：

```typescript
type Ctor<T> = new (...args: any[]) => T;
function make<T>(ctor: Ctor<T>): T { return new ctor(); }
```

需要静态成员时，用接口约束静态侧：

```typescript
interface WithCreate<T> {
  create(): T;
}

function fromStatic<T, S extends WithCreate<T>>(Static: S): T {
  return Static.create();
}
```

## 抽象类

```typescript
abstract class Base {
  abstract run(): string;
  static helper() { return "h"; }
}

const baseStatic: typeof Base = Base;   // ✓ 静态侧可用
baseStatic.helper();

new Base();
// error TS2511: Cannot create an instance of an abstract class.
```

`typeof Base` 正常包含静态成员，但实例化被禁止。

## 为什么这样设计

类的双身份是为了贴合 JavaScript 的实际语义。`class` 在运行时就是一个构造函数（一个值），而 TypeScript 额外给它一个类型身份来描述实例形状。

对比其他声明：

| 声明 | 值空间 | 类型空间 |
|---|---|---|
| `class C` | ✓ 构造函数 | ✓ 实例类型 |
| `function f` | ✓ 函数 | ✗（用 `typeof f`） |
| `interface I` | ✗ | ✓ |
| `type T` | ✗ | ✓ |
| `enum E` | ✓ 对象 | ✓ 枚举类型 |
| `const x` | ✓ | ✗（用 `typeof x`） |

只有 `class` 和 `enum` 同时占据两个空间。`function` 是值，要用 `typeof f` 才能拿到它的类型。

> [!TIP] 为什么不能用 `instanceof` 检查 interface
> `interface` 只存在于类型空间，运行时没有对应值，所以 `value instanceof SomeInterface` 报 `TS2693: 'SomeInterface' only refers to a type, but is being used as a value here.`。
>
> `class` 就没这个问题——它在运行时真实存在。详见 [类型擦除](./type-erasure.md)。

## 相关

- [类型擦除](./type-erasure.md) —— 为什么 interface 没有运行时对应物
- [typeof 的两种含义](./typeof-two-meanings.md) —— 类型位置查询的完整规则
- [类与装饰器](./classes-and-decorators.md) —— 类的成员与静态成员
