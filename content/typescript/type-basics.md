---
title: "类型基础"
date: 2026-09-21
weight: 20
draft: false
toc: true
tags: ["typescript"]
---

这一篇覆盖 TypeScript 日常写代码会用到的全部基础类型：原始类型与字面量、注解与推断、对象类型、数组与元组、函数类型、联合与交叉。它是后面所有章节的地基——[类型收窄](./narrowing.md) 讲怎么从联合里挑出一个成员，[泛型](./generics.md) 讲怎么把类型当参数传递，都建立在这里的语法之上。

## 类型注解与类型推断

TypeScript 的类型系统有两条路径来知道一个值的类型：

- **类型注解**（type annotation）：你显式写出来，`value: type`
- **类型推断**（type inference）：类型检查器自己算出来

```typescript
let count: number;   // 注解
count = 3;

let total = 3;       // 推断：number
```

实用的工作原则只有两条：

1. TypeScript 能自动推断出类型时，什么都不用写
2. TypeScript 推断不出来时，才需要注解

判断"能不能推断出来"的标准很简单：**类型信息是否从值的右侧流到了左侧**。有初始化表达式就能推断，没有就不行。

```typescript
let a = 3;            // 推断 number，不需要注解
let b;                // 推断 any —— 危险
b = 3;
b = "text";           // 不报错，因为 b 是 any
```

`let b;` 没有初始化表达式，TypeScript 推断不出类型。但它的行为和普通 `any` 不同，这叫 **evolving any**（演进式 any）：

```typescript
let b;
b = 3;
b = "text";   // 不报错
b = true;     // 也不报错
```

实测（`--strict`）：

- 声明后**不报** `noImplicitAny` 错误——这是它和函数参数的隐式 `any` 的关键区别
- 赋值后类型会**收窄**到赋进去的类型，可以正常用该类型的方法
- 但可以反复重新赋成**不同**类型，每次都对

对比函数参数，隐式 `any` 是直接报错的：

```typescript
function f(x) { return x; }
// error TS7006: Parameter 'x' implicitly has an 'any' type.
```

> [!WARNING] evolving any 仍然是隐患
> 它让编译器无法替你发现"同一个变量被当作两种类型用"的问题。所以声明变量时尽量同时初始化，别写 `let b;`。

`strict` 是这一系列检查开关的总闸，包含 `noImplicitAny`、`strictNullChecks`、`strictFunctionTypes` 等。新项目一律开：

```json
{ "compilerOptions": { "strict": true } }
```

## 原始类型与字面量类型

TypeScript 的原始类型与 JavaScript 一致，但多了 `bigint` 和 `symbol` 的一等支持：

{{< include "src/type-basics/primitives.ts" "ts" >}}

```text
hello 42 true 9007199254740993 id undefined null
hello 42 1000000 NaN Infinity
```

### 字面量类型

每个原始类型都有一个"只表示一个值"的子类型：

```typescript
let a = "hello";        // string
const c = "hello";      // "hello"
```

差别在 `let` 与 `const`。`let` 声明的变量可以被重新赋值，所以推断为宽泛的 `string`；`const` 声明后不能改，TypeScript 推断出**范围最窄**的类型，也就是字面量类型 `"hello"`。

`as const` 把这个行为扩展到对象和数组：

{{< include "src/type-basics/literals.ts" "ts" >}}

```text
hello hello left dark 1 true
```

`config.mode` 的类型是 `"dark"` 而不是 `string`，因为 `as const` 让整个对象的所有属性都变成只读的字面量类型。这个特性在 [satisfies 与 as const](./satisfies-and-as-const.md) 里展开。

> [!TIP] 字面量类型是联合类型的原料
> `"left" | "right"` 这种写法就是字面量类型联合，它是 [类型收窄](./narrowing.md) 和可辨识联合的基础。

## 对象类型

对象类型描述"这个对象有哪些属性"。四种声明方式，按推荐程度排列：

```typescript
// 1. 内联对象类型
function f(p: { x: number; y: number }) {}

// 2. interface（推荐用于对象）
interface Point { x: number; y: number }

// 3. type 别名
type Point2 = { x: number; y: number };

// 4. object / Object / {}（都不推荐，见下）
```

`interface` 与 `type` 的选择见 [interface 与 type](./interface-vs-type.md)。这里先看对象类型支持的特性：

{{< include "src/type-basics/object-types.ts" "ts" >}}

```text
rainboylvx 18 u_1 true
```

四个要点：

| 特性 | 写法 | 说明 |
|---|---|---|
| 可选属性 | `email?: string` | 类型实际是 `string \| undefined` |
| 只读属性 | `readonly id: string` | 只在编译期检查，运行时仍可改 |
| 索引签名 | `[key: string]: unknown` | 允许任意键，键类型只能是 `string`/`number`/`symbol` |
| 多余属性检查 | 见下 | 对象字面量的特殊规则 |

### 该用 `object`、`Object` 还是 `{}`

这三个都容易误用：

```typescript
let a: object = { x: 1 };   // 任何非原始类型（不含 string/number/boolean/...）
let b: Object = "text";     // 除 null/undefined 外的所有类型，包括 string！
let c: {} = 42;             // 除 null/undefined 外的所有类型，包括 number！
```

`Object` 和 `{}` 会接受 `string`、`number`，几乎从不是你想要的。`object` 才是"这是个对象"，但它不描述结构，访问属性仍然报错。详见 [object 与 Object](./object-and-Object.md)。

### 多余属性检查

对象字面量赋值给已声明的类型时，TypeScript 会检查有没有多余的键：

```typescript
interface Point { x: number; y: number }

// @ts-expect-error 对象字面量的多余属性检查
const p: Point = { x: 1, y: 2, z: 3 };
```

但把同一个对象先存到变量，就不再报错：

```typescript
const raw = { x: 1, y: 2, z: 3 };
const p: Point = raw;   // 不报错
```

这是 TypeScript 里最容易让人困惑的规则之一，完整解释见 [多余属性检查](./excess-property-check.md)。

## 数组与元组

```typescript
const nums: number[] = [1, 2, 3];
const nums2: Array<number> = [4, 5];    // 等价
```

`T[]` 和 `Array<T>` 完全等价，选一种风格保持一致即可。

**元组**是定长数组，每个位置的类型固定：

{{< include "src/type-basics/arrays-tuples.ts" "ts" >}}

```text
[ 1, 2, 3 ] [ 4, 5 ] [ 1, 'a' ] [ 'age', 18 ] [ [ 'a' ], [ 'b', 1 ] ] [ 'a', 'b', 'c' ]
[ 1, 2, 3 ] [ 'a', 1 ]
```

元组支持三种变形：

```typescript
type A = [string, number?];              // 可选元素
type B = [string, ...string[]];          // 剩余元素（至少一个）
type C = readonly [string, number];      // 只读元组
```

> [!WARNING] 元组的常见误用
> 元组读起来是"带名字的多个值"，但访问靠下标（`pair[0]`），可读性差。超过 3 个元素、或元素含义不明显时，用对象类型更好。这也是为什么实践中元组主要用于：函数返回多个值、`Object.entries` 的 `[key, value]` 这类固定形状。

## 函数类型

函数的参数必须注解，返回值通常可以推断：

{{< include "src/type-basics/functions.ts" "ts" >}}

```text
3 a Dr. a xx 6
hi
5 1 { value: 1 } undefined
boom
```

几个要点：

**可选参数必须在末尾。** `function f(a?: number, b: number)` 是语法错误。如果确实需要"中间可选"，用对象参数：

```typescript
function f({ a, b = 1 }: { a: number; b?: number }) {}
```

**默认参数会自动推断类型。** `times = 2` 让 `times` 推断为 `number`，不需要注解。

**解构参数需要整体注解。** 因为解构本身不提供类型信息：

```typescript
function dist({ x, y }: { x: number; y: number }) { }
```

**箭头函数返回对象字面量要加括号**，否则 `{}` 被解析成函数体：

```typescript
const make = (n: number) => ({ value: n });   // 括号不能省
```

### `void` 与 `never`

| 类型 | 含义 | 例子 |
|---|---|---|
| `void` | 函数不返回值 | `function log(msg: string): void` |
| `never` | 函数永不正常返回 | 抛异常、死循环 |

`never` 是所有类型的子类型，可以赋值给任何类型，反之不行。它在 [类型收窄](./narrowing.md) 的穷尽性检查里有关键作用。

### 参数逆变

函数类型的参数是**逆变**的（contravariant）：参数类型更宽的函数可以赋值给参数类型更窄的位置。

```typescript
type Handler = (e: MouseEvent) => void;

// 能接受更宽泛的 Event，就可以当 MouseEvent 的处理器用
const h: Handler = (e: Event) => {};
```

这个规则由 `strictFunctionTypes` 控制，`strict` 下自动开启。它是 `strict` 家族里最容易被忽视、也最容易在回调场景救你一命的一条。详见 [函数类型](./function-types.md)。

## 联合与交叉

```typescript
type ID = string | number;                       // 联合：或
type Person = { name: string } & { age: number }; // 交叉：且
```

联合类型上的属性访问，只能访问**所有成员共有**的成员：

```typescript
function describe(id: ID): string {
  return id.toString();   // string 和 number 都有 toString
  // return id.toUpperCase();  // 错误：number 没有
}
```

要用成员特有的属性，必须先收窄，这是下一篇 [类型收窄](./narrowing.md) 的主题。

**可辨识联合**（discriminated union）是最有用的联合模式：给每个成员一个共同的字面量字段作为"标签"，然后 `switch` 那个字段：

{{< include "src/type-basics/unions.ts" "ts" >}}

```text
{ name: 'rainboy', age: 18 } 3.141592653589793 6
a 1
```

注意 `area` 函数里没有 `default` 分支也不报错——TypeScript 检查了所有 `kind` 都被覆盖。这就是穷尽性检查。

## interface 与 type

两者都能描述对象，但能力不同：

{{< include "src/type-basics/interfaces.ts" "ts" >}}

```text
{ name: 'wang', age: 3, owner: 'rainboy', breed: 'corgi' } { name: 'a', age: 1, owner: 'b', salary: 100 } 1 2
```

关键差异：

| 能力 | `interface` | `type` |
|---|---|---|
| 描述对象结构 | ✓ | ✓ |
| 声明合并（同名自动合并） | ✓ | ✗ |
| `extends` 继承 | ✓ | 用 `&` 交叉 |
| 联合类型 | ✗ | ✓ |
| 元组类型 | ✗ | ✓ |
| 条件类型 | ✗ | ✓ |
| 映射类型 | ✗ | ✓ |

一句话规则：**描述对象结构用 `interface`，需要联合/元组/条件类型时用 `type`**。完整讨论见 [interface 与 type](./interface-vs-type.md)。

## 常见错误速查

以下错误消息都经实际编译验证（`@ts-expect-error` 锚定，源码见 `src/type-basics/errors.ts`）：

{{< include "src/type-basics/errors.ts" "ts" >}}

| 错误码 | 消息 | 触发场景 |
|---|---|---|
| TS2353 | `Object literal may only specify known properties, and 'z' does not exist in type 'Point'` | 对象字面量多写了属性 |
| TS2741 | `Property 'y' is missing in type '{ x: number; }' but required in type 'Point'` | 缺少必需属性 |
| TS2322 | `Type 'string' is not assignable to type 'number'` | 类型不匹配 |
| TS2540 | `Cannot assign to 'id' because it is a read-only property` | 给只读属性赋值 |
| TS2339 | `Property 'nickname' does not exist on type 'User'` | 访问不存在的属性 |
| TS2493 | `Tuple type '[string, number]' of length '2' has no element at index '2'` | 元组越界 |
| TS2345 | `Argument of type 'string' is not assignable to parameter of type 'number'` | 实参类型不匹配 |

> [!TIP] 用 `@ts-expect-error` 而不是 `@ts-ignore`
> `@ts-ignore` 会无脑压掉错误，包括将来新出现的错误。`@ts-expect-error` 要求**下一行必须有错误**，否则它自己报错。所以在示例代码里用它，既能让 `tsc --noEmit` 保持干净，又能证明错误确实发生在预期的位置。

## 小结

| 主题 | 核心结论 |
|---|---|
| 注解 vs 推断 | 有初始化表达式就能推断；`let x;` 是隐式 `any` 陷阱 |
| 原始类型 | `let` 推断宽类型，`const` 推断字面量类型 |
| 对象类型 | 用 `interface`/`type`，别用 `Object`/`{}` |
| 元组 | 定长、位置类型固定，超过 3 个元素考虑换对象 |
| 函数 | 参数必须注解，可选参数在末尾，参数逆变 |
| 联合 | 只能访问公共成员，要收窄 |
| 可辨识联合 | 共同字面量字段 + `switch` = 穷尽性检查 |

下一篇：[类型收窄](./narrowing.md)。
