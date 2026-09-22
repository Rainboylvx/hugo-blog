---
title: "数组与元组"
date: 2026-09-21
weight: 22
draft: false
toc: true
tags: ["typescript"]
---

数组是"同质、长度不定"，元组是"定长、每个位置的类型固定"。选择标准是：**位置是否有独立含义**。

{{< include "src/array-vs-tuple/choose.ts" "ts" >}}

```text
[ 1, 2, 3 ] [ 1, 2 ] [ 'age', 18 ] [ 0, 2, 3 ] [ 1, 2, 3 ] [ 1, 2, 3 ] [ 'a', 'b', 'c', 'd' ] [ 'a', 'b', 'c', 'd' ] 1 3 [ [ 'a', 1 ], [ 'b', 2 ] ] [ 'a', 1, 'b', true ] { name: 'a', age: 1, city: 'b', active: true }
```

## 什么时候用元组

**适合：**

- 函数返回多个值：`[number, number]` 表示 `[min, max]`
- 固定形状的键值对：`Object.entries` 返回 `[string, T][]`
- React 的 `useState`：`[value, setValue]`
- 固定长度的坐标/矩阵：`[number, number]`

**不适合：**

- 元素超过 3 个，或元素含义不明显。`[string, number, string, boolean]` 完全无法从调用处看懂，用对象：

```typescript
type Bad = [string, number, string, boolean];
type Good = { name: string; age: number; city: string; active: boolean };

goodUser.age;    // 比 badUser[1] 可读得多
```

- 同质列表。`[string, string, string, string]` 应该写成 `string[]`。

## 元组的各种形态

{{< include "src/array-vs-tuple/tuple-forms.ts" "ts" >}}

```text
[ 'a', 1 ] [ 'a' ] [ 'a', 1 ] [ 'a' ] [ 'a', 'b', 'c' ] [ 1, true, 'a', 'b' ] [ 'b', 1 ] [ [ 'a', 1 ], [ 'b', 2 ] ]
[ 1 ] [ 1 ] [ 1, 10 ] [ [ 1, 2 ], [ 3, 4 ] ] a 1 a [ 'b', 'c' ] 2
```

| 形态 | 写法 | 说明 |
|---|---|---|
| 基本 | `[string, number]` | 位置类型固定 |
| 可选元素 | `[string, number?]` | 必须放最后；等价于 `[string, number] \| [string]` |
| 剩余元素 | `[string, ...string[]]` | 定义最小长度 |
| 混合 | `[number, boolean, ...string[]]` | 前面固定，后面不定 |
| 只读 | `readonly [string, number]` | 不可修改 |
| 命名元素 | `[start: number, end: number]` | 仅用于提示，不改变类型 |

### `length` 是字面量类型

```typescript
const pair: [string, number] = ["a", 1];
type Len = typeof pair["length"];    // 2
```

这个特性可以用来做类型层面的长度检查。

> [!WARNING] 元组的 `length` 不等于"不可 push"
> 这是最容易误解的一点。定长元组**仍然允许 `push`**：
>
> ```typescript
> const goodPoint: [number, number] = [1, 2];
> goodPoint.push(3);        // 编译通过！
> ```
>
> `length: 2` 只表示"已知至少有这两个位置"，不阻止运行时增长。真正要阻止修改必须用 `readonly`：
>
> ```typescript
> const roPoint: readonly [number, number] = [1, 2];
> roPoint.push(3);
> // error TS2339: Property 'push' does not exist on type 'readonly [number, number]'.
> ```
>
> 只读元组的索引赋值报：
>
> ```text
> error TS2540: Cannot assign to '0' because it is a read-only property.
> ```

## 数组的两种写法

```typescript
const a: number[] = [1, 2];        // 简写
const b: Array<number> = [1, 2];   // 泛型写法
```

完全等价。选一种保持一致即可。区别只在于复杂类型下 `T[]` 的可读性会下降：

```typescript
const x: (string | number)[] = [];      // 需要括号
const y: Array<string | number> = [];   // 更清楚
```

## 只读数组

```typescript
const ro: readonly number[] = [1, 2, 3];
ro.push(4);
// error TS2339: Property 'push' does not exist on type 'readonly number[]'.
```

`readonly T[]`、`ReadonlyArray<T>`、`Readonly<T[]>` 三种写法等价。只读数组的用处是**表达"这个函数不会修改传入的数组"**：

```typescript
function sum(nums: readonly number[]): number {
  return nums.reduce((a, b) => a + b, 0);   // 保证不修改入参
}

sum([1, 2, 3]);
const arr = [1, 2];
sum(arr);          // 可变数组可以传给只读参数
```

反过来不行：`readonly number[]` 不能赋给 `number[]`，因为那样就绕过了保护。

## 相关

- [类型基础](./type-basics.md) —— 数组与元组的完整基础
- [只读与不可变](./readonly-and-immutability.md) —— `readonly` 的深浅边界
- [satisfies 与 as const](./satisfies-and-as-const.md) —— 保留元组的字面量类型
