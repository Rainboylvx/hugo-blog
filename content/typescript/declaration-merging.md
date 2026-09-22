---
title: "声明合并"
date: 2026-09-21
weight: 56
draft: false
toc: true
tags: ["typescript"]
---

同名声明会自动合并，这是给第三方库补类型、扩展全局对象的基础。但**不是所有声明都能合并**，规则需要记清楚。

## 能合并的声明

{{< include "src/declaration-merging/merging.ts" "ts" >}}

```text
{ b: 1 }
{ a: 1 } s n
```

### `interface` 合并

```typescript
interface Box { width: number }
interface Box { height: number }     // 自动合并

const box: Box = { width: 1, height: 2 };
```

同名**同类型**的成员可以重复，类型不同则报错：

```typescript
interface Conflict { b: number }
interface Conflict { b: string }
// error TS2717: Subsequent property declarations must have the same type.
```

### `namespace` 合并

```typescript
namespace Util { export const a = 1 }
namespace Util { export const b = 2 }
// Util 同时有 a 和 b
```

### `namespace` 与 `class` / `function` / `enum` 合并

这让类、函数、枚举获得"额外成员"：

```typescript
class Widget { render() { return "w" } }
namespace Widget { export const version = "1.0" }

const w = new Widget();
Widget.version;      // ✓ 类获得了静态成员
```

```typescript
enum Color { Red, Green }
namespace Color {
  export function name(c: Color): string { ... }
}

Color.name(Color.Red);   // ✓ 枚举获得了方法
```

### 方法重载顺序

多个同名 `interface` 声明方法时，**后声明的签名优先**：

```typescript
interface Calc { add(x: string): string }
interface Calc { add(x: number): number }

const calc = { add: (x: string | number) => x } as Calc;
calc.add(1);    // number（后声明的优先）
```

## 不能合并的声明

**`type` 不能合并**：

```typescript
type T1 = { a: 1 };
type T1 = { b: 2 };
// error TS2300: Duplicate identifier 'T1'.   ← 两行都报
```

注意错误**同时报在两处声明上**，这和其他错误不同。

`const`/`let` 也不能重复声明：

```typescript
const x = 1;
const x = 2;
// error TS2451: Cannot redeclare block-scoped variable 'x'.
```

（`var` 可以重复声明，这是 JavaScript 的遗留行为。）

> [!TIP] 需要合并就用 `interface`
> 这是 [interface 与 type](./interface-vs-type.md) 里"优先用 interface"的一条实际理由。类型别名更灵活，但失去了可合并性。

## 给第三方库补类型

两种场景，写法不同。

### 场景一：模块不存在

用 `declare module`，写在**全局脚本文件**（无 `import`/`export`）里：

{{< include "src/declaration-merging/ambient.d.ts" "ts" >}}

### 场景二：扩展全局作用域

用 `declare global`，必须写在**模块文件**（有 `import`/`export`）里：

{{< include "src/declaration-merging/global-extend.ts" "ts" >}}

> [!WARNING] 位置规则容易踩
> - `declare module "xxx"` → 全局脚本文件（无 import/export）
> - `declare global` → 模块文件（有 import/export，通常配 `export {}`）
>
> 写错位置会报：
>
> ```text
> error TS2664: Invalid module name in augmentation, module 'xxx' cannot be found.
> ```
>
> 这条错误消息很误导——它说的是"找不到模块"，但真正的问题是**文件类型不对**（在模块文件里写 `declare module` 会被当成模块扩充而不是模块声明）。

### 只提供类型，不提供实现

这是最容易忽略的一点：

{{< include "src/declaration-merging/use-augment.ts" "ts" >}}

```text
1 true false 1 false 3
```

`declare global` 和 `declare module` **只提供类型**。运行时实现要自己补，而且**必须在首次使用之前**执行：

```typescript
// ✓ 先补实现
Array.prototype.first = function <T>(this: T[]): T | undefined {
  return this[0];
};

// ✓ 再使用
const arr: number[] = [1, 2];
arr.first();
```

如果顺序反了，会得到运行时的 `TypeError: arr.first is not a function`——类型检查完全通过，但代码跑不起来。这是 [类型擦除](./type-erasure.md) 的直接后果。

> [!WARNING] 扩展内置原型是有代价的
> 给 `Array.prototype` 加方法会影响**所有**数组，包括第三方库里的。这可能导致：
>
> - 与未来的 JavaScript 标准冲突（标准加了同名方法时行为可能不同）
> - 与第三方库的同名扩展冲突
> - `for...in` 遍历时出现意外属性
>
> 现代实践倾向于用**独立函数**（`first(arr)`）而不是原型扩展。原型扩展主要用在无法改动调用点的场景。

## 声明文件的位置约定

常见做法是建一个 `types/` 目录：

```text
types/
├── legacy-lib.d.ts       # declare module "legacy-lib"
└── global.d.ts           # declare global / 全局接口
```

然后确保 `tsconfig.json` 的 `include` 覆盖它：

```json
{ "include": ["src", "types"] }
```

详见 [.d.ts 与第三方类型](./dts-and-third-party-types.md)。

## 速查

| 声明 | 能否合并 | 用途 |
|---|---|---|
| `interface` | ✓ | 扩展接口、给库加成员 |
| `namespace` | ✓ | 组织代码、附加静态成员 |
| `class` + `namespace` | ✓ | 类加静态成员 |
| `function` + `namespace` | ✓ | 函数加属性 |
| `enum` + `namespace` | ✓ | 枚举加方法 |
| `declare module` | ✓ | 模块声明（全局脚本文件） |
| `declare global` | ✓ | 全局扩展（模块文件） |
| `type` | ✗ | — |
| `const`/`let` | ✗ | — |

## 相关

- [interface 与 type](./interface-vs-type.md) —— 为什么需要可合并性
- [.d.ts 与第三方类型](./dts-and-third-party-types.md) —— 声明文件的组织
- [类型擦除](./type-erasure.md) —— 为什么声明不提供运行时
