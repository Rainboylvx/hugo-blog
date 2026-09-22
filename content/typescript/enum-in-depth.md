---
title: "enum 深挖"
date: 2026-09-21
weight: 31
draft: false
toc: true
tags: ["typescript"]
---

`enum` 是 TypeScript 独有的语法，它有三种形态、会生成运行时产物、类型安全性还有缺口。这一篇讲清楚它的实际行为，以及为什么**新代码通常不该用 enum**。

## 三种形态

{{< include "src/enum-in-depth/forms.ts" "ts" >}}

```text
0 Idle UP YES 1 2 done
200 11 1 0 999
```

| 形态 | 写法 | 反向映射 |
|---|---|---|
| 数字枚举 | `enum E { A, B }` | ✓ 有 |
| 字符串枚举 | `enum E { A = "a" }` | ✗ 无 |
| 异构枚举 | `enum E { A = 0, B = "b" }` | 部分 |
| `const enum` | `const enum E { A = 1 }` | 编译时内联 |

数字枚举默认从 0 递增，也可以指定起始值：

```typescript
enum Code { Ok = 200, NotFound = 404, Error = 500 }
enum Mixed { A, B = 10, C, D }    // 0, 10, 11, 12（中间指定后续跟着递增）
```

字符串枚举必须每个成员都赋值——这是好事，因为字符串枚举**没有反向映射**，也就没有数字枚举那些问题。

## 反向映射只存在于数字枚举

```typescript
enum Status { Idle, Loading, Done }

Status.Idle;      // 0
Status[0];        // "Idle"  ← 反向映射
```

字符串枚举做不到：

```typescript
enum Direction { Up = "UP" }
Direction.Up;       // "UP"
Direction["UP"];    // 报错：没有反向映射
```

## 编译产物：不可擦除语法

这是 enum 最重要的性质——它**留下运行时代码**（见 [类型擦除](./type-erasure.md)）。

数字枚举编译成一个 IIFE 加双向映射对象：

```javascript
var Status;
(function (Status) {
    Status[Status["Idle"] = 0] = "Idle";
    Status[Status["Loading"] = 1] = "Loading";
})(Status || (Status = {}));
```

字符串枚举只有单向赋值：

```javascript
var Direction;
(function (Direction) {
    Direction["Up"] = "UP";
    Direction["Down"] = "DOWN";
})(Direction || (Direction = {}));
```

`const enum` 则是**编译时内联**，默认不生成对象：

```typescript
const enum Fast { A = 1, B = 2 }
const x = Fast.A;
```

编译后：

```javascript
const x = 1 /* Fast.A */;
```

值被直接替换成 `1`，`Fast` 对象不存在。

### `preserveConstEnums` 编译选项

开启 `preserveConstEnums` 后，`const enum` 的**定义**会被保留：

```javascript
var Fast;
(function (Fast) {
    Fast[Fast["A"] = 1] = "A";
    Fast[Fast["B"] = 2] = "B";
})(Fast || (Fast = {}));
const x = 1 /* Fast.A */;
```

> [!WARNING] 注意它**没有**改变使用点
> `preserveConstEnums` 只是保留枚举对象本身（这样运行时反射能拿到它），**使用点仍然被内联**为 `1 /* Fast.A */`。它不等于"把 `const enum` 变成普通 `enum`"。
>
> 用途是：当你的代码被别的工具（如 Babel 单独转译）处理，或者需要在运行时遍历枚举成员时，保留定义才有意义。

### Node 原生跑不了 enum

因为 enum 不可擦除，Node 的 type stripping 直接拒绝：

```bash
$ node file-with-enum.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
    code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX'
```

`const enum` 同样报错。要跑就得用 `tsc` 编译或 `tsx`。详见 [运行 TypeScript](./running-ts.md)。

## 类型安全性的缺口

数字枚举最被诟病的问题：**任意 `number` 变量都能赋给它**。

```typescript
enum Status { Idle, Loading }

const n: number = 1;
const s: Status = n;        // 允许！失去了所有检查
```

但规则比"接受任意数字"更细——实测确认：

| 来源 | 结果 |
|---|---|
| `const n: number = 1; const s: Status = n;` | ✓ 允许 |
| `const s: Status = 999;` | ✗ `TS2322` |
| `Status.Idle` 赋给 `number` | ✓ 允许 |

所以准确说法是：**枚举对 `number` 是"双向宽松"的**——`number` 变量能进来，枚举值能出去，但枚举外的数字字面量进不来。这个不对称规则在实践中还是会漏掉错误（比如把 HTTP 状态码变量赋给 `Code` 枚举）。

枚举成员本身作为类型是严格的：

```typescript
type S = Status.Done;
const s2: S = Status.Idle;
// error TS2322: Type 'Status.Idle' is not assignable to type 'Status.Done'.
```

## 为什么不推荐用 enum

{{< include "src/enum-in-depth/why-not-enum.ts" "ts" >}}

```text
1 idle idle 0 200 空闲 done 1 unknown 2 201
```

三个问题：

1. **类型安全性有缺口**：任意 `number` 可以赋给数字枚举
2. **不可擦除**：Node 原生跑不了，必须走编译
3. **有运行时成本**：每个非 `const` enum 都生成 IIFE 和映射对象

### 四种替代方案

**方案一：字面量联合（最推荐）**

```typescript
type Status = "idle" | "loading" | "done";
```

可擦除、可序列化、类型严格、零运行时产物。

**方案二：`as const` 对象**

```typescript
const STATUS = {
  Idle: "idle",
  Loading: "loading",
  Done: "done",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];   // "idle" | "loading" | "done"
```

保留了 `STATUS.Idle` 这种命名空间式访问，同时有联合类型的严格性。**这是替代 enum 的最佳选择**。

**方案三：数字常量对象**

需要数字值时：

```typescript
const STATUS = { Idle: 0, Loading: 1 } as const;
type Status = (typeof STATUS)[keyof typeof STATUS];   // 0 | 1

const s: Status = STATUS.Idle;
const bad: Status = 2;
// error TS2322: Type '2' is not assignable to type '0 | 1'.
```

注意这里 `2` **真的被拒绝了**——这正是数字枚举做不到的。

**方案四：从数组推导**

```typescript
const CODES = [200, 404, 500] as const;
type Code = (typeof CODES)[number];    // 200 | 404 | 500
```

单一数据源，还能运行时遍历。

### 什么时候 enum 仍然合理

- **已有大量代码在用**：迁移成本可能大于收益
- **真的需要反向映射**：数字 → 名字，且确实用得到
- **项目必须用 `tsc` 编译**：不能改用 Node 原生或 esbuild 直接跑

> [!TIP] 迁移建议
> 老项目里 `enum` 不必急着改。但**新代码建议用 `as const` 对象**——它同时解决了类型安全、可擦除、零运行时三个问题，而且迁移路径很自然：
>
> ```typescript
> // 改前
> enum Status { Idle = "idle", Loading = "loading" }
> // 改后
> const Status = { Idle: "idle", Loading: "loading" } as const;
> type Status = (typeof Status)[keyof typeof Status];
> ```
>
> 使用点 `Status.Idle` 完全不用改。

## 相关

- [类型擦除](./type-erasure.md) —— 为什么 enum 会留下运行时产物
- [运行 TypeScript](./running-ts.md) —— Node 原生 type stripping 的限制
- [satisfies 与 as const](./satisfies-and-as-const.md) —— `as const` 的完整用法
- [类型收窄](./narrowing.md) —— 字面量联合的穷尽性检查
