---
title: "类型擦除：编译期与运行时的分界"
date: 2026-09-21
weight: 10
draft: false
toc: true
tags: ["typescript"]
---

TypeScript 的所有类型在运行时都不存在。这不是一个"实现细节"，而是理解整个 TypeScript 的起点：它一次性解释清楚了为什么 `enum` 会生成 IIFE、为什么 `instanceof` 不能用 interface、为什么 Node 原生跑不了 `enum`、为什么装饰器需要 `experimentalDecorators`。

## 编译期与运行时是两套世界

TypeScript 编译器（`tsc`）做三件事，顺序固定：

```text
1. TypeScript 源码  →  TypeScript AST
2. 类型检查器检查 AST          ← 类型只在这一步存在
3. TypeScript AST   →  JavaScript 源码
```

第 2 步之后，类型信息就被丢弃了。第 3 步产出的 JavaScript 里不含任何类型。

用一段代码验证。`content/typescript/src/type-erasure/erased.ts`：

{{< include "src/type-erasure/erased.ts" "ts" >}}

运行结果：

```text
hi rainboy 1 hello
```

编译产物（`tsc --target esnext --module nodenext`）：

```javascript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// 这些类型注解在编译后完全消失
const n = 1;
const s = "hello";
function greet(user) {
    return `hi ${user.name}`;
}
console.log(greet({ name: "rainboy", age: 18 }), n, s);
```

对照一下丢掉了什么：

| 源码 | 产物 | 说明 |
|---|---|---|
| `const n: number = 1` | `const n = 1` | 类型注解被删除 |
| `const s: string = "hello"` | `const s = "hello"` | 类型注解被删除 |
| `interface User { ... }` | 无 | 整个声明消失 |
| `type ID = string \| number` | 无 | 整个声明消失 |
| `function greet(user: User): string` | `function greet(user)` | 参数和返回值类型被删除 |
| `Object.defineProperty(...)` | 新增 | **这是模块语法带来的**，不是类型 |

> [!IMPORTANT] 关键结论
> 类型只服务于类型检查器。你可以随意重构类型，而不担心改变运行时行为——前提是这个语法本身是"可擦除"的。

## 哪些语法是可擦除的

**可擦除（erasable）** 指编译后该语法完全消失，不留任何运行时痕迹：

- 类型注解：`x: number`
- `interface`、`type` 声明
- 泛型参数：`Array<T>`、`function f<T>()`
- 类型断言：`x as string`、`<string>x`
- `implements` 子句
- `declare` 声明
- `import type` / `export type`
- 可选参数标记 `?`、`readonly`、`public`/`private` 等可见性修饰符（**单独使用时**）

**不可擦除（non-erasable）** 指编译后会生成运行时代码：

- 非 `const` 的 `enum`
- `namespace`（含成员时）
- 构造函数参数属性：`constructor(public x: number)`
- 类字段初始化：`count = 0`
- 装饰器（两种路线都是）
- `import x = require("...")` 形式

第二类才是有运行时成本的部分。逐个看。

## 不可擦除的四种主要语法

{{< include "src/type-erasure/not-erasable.ts" "ts" >}}

运行结果：

```text
0 Up
3.14
1 origin
0
```

编译产物（`tsc --target es2022 --module commonjs`）：

```javascript
"use strict";
// 1. 非 const enum → IIFE + 双向映射对象
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
})(Direction || (Direction = {}));
// 2. namespace → IIFE
var Geometry;
(function (Geometry) {
    Geometry.PI = 3.14;
})(Geometry || (Geometry = {}));
// 3. 参数属性 → 构造函数里的赋值语句
class Point {
    x;
    label;
    constructor(x, label) {
        this.x = x;
        this.label = label;
    }
    get name() {
        return this.label;
    }
}
// 4. 类字段初始化 → 构造函数里的赋值语句
class Counter {
    count = 0;
}
```

### 1. `enum` → IIFE 与反向映射

```typescript
enum Direction { Up, Down }
```

生成一个 IIFE，把 `Direction` 变成一个双向映射对象：

```javascript
var Direction;
(function (Direction) {
    Direction[Direction["Up"] = 0] = "Up";
    Direction[Direction["Down"] = 1] = "Down";
})(Direction || (Direction = {}));
```

`Direction["Up"] = 0` 先赋值为 0，表达式的值也是 0，所以外层 `Direction[0] = "Up"` 同时建立了反向映射。这就是 `Direction[0] === "Up"` 能成立的原因。

注意 `Direction` 是 `var` 而不是 `const`：IIFE 需要它先在外部作用域存在。

### 2. `namespace` → IIFE

```typescript
namespace Geometry { export const PI = 3.14; }
```

同样生成 IIFE。这是 TypeScript 早期用来模拟模块的方案，现在 ES 模块已经取代了它的主要用途。

### 3. 参数属性 → 构造函数赋值

```typescript
constructor(public x: number, private label: string) {}
```

编译成：

```javascript
constructor(x, label) {
    this.x = x;
    this.label = label;
}
```

参数上的 `public` / `private` / `protected` / `readonly` 不只是类型层面的可见性标记——它**触发了实际的赋值代码**。而单独写在成员声明上的可见性修饰符（`private label: string;` 不带参数属性）则是纯类型的，会被擦除。

> [!WARNING] 这个区别容易踩
> `private label: string` 的 `private` 只在编译期检查，运行时 `p.label` 照样能读到。真正需要运行时私有请用 `#label`（ES 私有字段）。

### 4. 类字段初始化 → 构造函数赋值

```typescript
class Counter { count = 0; }
```

`count = 0` 生成的是**实例字段**，每个实例都有自己的 `count`。这与把它写在构造函数里等价，但与写在原型上不同。

注意产物里保留了 `x;` 和 `label;` 两行字段声明。这是 `useDefineForClassFields`（`target` 为 `es2022` 及以上时默认为 `true`）的语义：字段用 `Object.defineProperty` 语义定义，而不是简单赋值。这个差异会在继承场景下表现为"子类字段覆盖父类访问器"。

## 这套边界推出的结论

理解了类型擦除，很多看似孤立的问题就有了统一解释。

### 结论一：不能用类型做运行时判断

```typescript
interface User { name: string }

function isUser(value: unknown): boolean {
  return value instanceof User;  // 错误：User 只在类型空间存在
}
```

`interface` 编译后消失，`instanceof` 右边需要一个运行时存在的构造函数。所以 `instanceof` 只能用于 `class`，不能用于 `interface` 或 `type`。详见 [类既是值又是类型](./class-value-and-type.md)。

替代方案是"类型谓词 + 属性检查"，见 [类型收窄](./narrowing.md)。

### 结论二：`typeof` 在类型位置是另一回事

```typescript
const config = { debug: true };

// 运行时判断：typeof 是 JS 运算符，返回字符串
if (typeof config === "object") { }

// 编译期查询：typeof 是 TS 类型运算符，返回类型
type Config = typeof config;
```

同一个关键字，在值位置和类型位置含义完全不同。见 [typeof 的两种含义](./typeof-two-meanings.md)。

### 结论三：Node 原生只能跑可擦除语法

Node.js 从 v22.18 / v23.6 起默认启用 type stripping：**直接删除类型注解然后执行**，不做类型检查、不做代码转换。

本地实测（Node v26.8.1）：

```bash
$ node content/typescript/src/type-erasure/erased.ts
hi rainboy 1 hello

$ node content/typescript/src/type-erasure/not-erasable.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
    code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX'
```

同一个目录、同样是 `.ts`，第一个能跑，第二个报错——差别只在有没有不可擦除语法。错误码 `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` 就是在说"这段代码不是纯类型擦除能处理的"。

需要执行含 `enum` / `namespace` / 装饰器的代码，用 `tsx`：

```bash
$ npx tsx content/typescript/src/type-erasure/not-erasable.ts
0 Up
3.14
1 origin
0
```

这是 [运行 TypeScript](./running-ts.md) 的核心取舍：type stripping 零依赖、零配置，但只覆盖可擦除子集；`tsx` 覆盖全部语法，代价是多一个依赖。

### 结论四：类型断言不改变运行时值

```typescript
const value: unknown = "text";
const len = (value as string).length;
```

`as string` 只是让类型检查器闭嘴，不插入任何转换。如果 `value` 实际是数字，`as string` 不会报错，`.length` 会在运行时得到 `undefined`。

这与"类型断言不进行运行时校验"是同一件事——类型信息运行时不存在，所以没有东西可以校验。

> [!TIP] 想要运行时校验
> 需要显式写检查代码（[类型收窄](./narrowing.md)），或引入 zod / valibot 这类在运行时携带 schema 的库。

### 结论五：装饰器必须生成代码

装饰器要修改类的运行时行为，所以必然不可擦除。这也是它需要单独配置的原因：

```json
// legacy 装饰器
{ "experimentalDecorators": true }
```

标准装饰器（TC39 stage-3）不需要 `experimentalDecorators`，但**同样不可擦除**——编译后依然会调用装饰器函数。两种路线的区别见 [装饰器（legacy）](./decorators-legacy.md) 与 [装饰器（标准）](./decorators-standard.md)。

## 一个反直觉的推论

既然类型在运行时不存在，**"类型安全的库" 这个说法在跨进程边界时是失效的**。

```typescript
async function getUser(id: string): Promise<User> {
  return fetch(`/api/user/${id}`).then(r => r.json());
}
```

`Promise<User>` 是编译期的承诺。运行时 `r.json()` 返回什么，取决于服务器。如果服务器返回 `{ name: 123 }`，类型检查器不会报错，而下游代码会在很远的地方以奇怪的方式失败。

这就是为什么"类型擦除"必须和"运行时校验"配合使用——尤其是在网络、文件、`JSON.parse`、`process.env` 这些边界上。

## 小结

| 问题 | 答案 |
|---|---|
| 类型在运行时存在吗 | 不存在，`tsc` 第 3 步就丢弃了 |
| 哪些语法会留下运行时代码 | `enum`、`namespace`、参数属性、类字段、装饰器、`import =` |
| 为什么 `instanceof` 不能用 interface | interface 编译后消失，`instanceof` 需要运行时构造函数 |
| 为什么 Node 跑不了 `enum` | type stripping 只做删除，`enum` 需要代码转换 |
| `as` 会转换值吗 | 不会，它只是类型层面的断言 |
| 跨进程边界类型还有效吗 | 无效，需要在边界做运行时校验 |

下一篇：[类型基础](./type-basics.md)。
