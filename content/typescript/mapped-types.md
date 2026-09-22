---
title: "映射类型"
date: 2026-09-21
weight: 52
draft: false
toc: true
tags: ["typescript"]
---

映射类型遍历一个类型的所有键，生成新类型。它是 `Partial`、`Pick`、`Record` 等工具类型的实现机制，也是"批量改写类型"的主要手段。

## 修饰符

{{< include "src/mapped-types/modifiers.ts" "ts" >}}

```text
{ id: 1, name: 'a', email: 'b' } { id: 2, name: 'a' } {} 1 a 1 true 1 1 2 2
```

| 修饰符 | 作用 |
|---|---|
| `?` 或 `+?` | 添加可选 |
| `-?` | 移除可选 |
| `readonly` 或 `+readonly` | 添加只读 |
| `-readonly` | 移除只读 |

`+` 是默认值，所以 `?` 和 `+?` 等价。可以组合：

```typescript
// 去掉只读 + 去掉可选
type MutableRequired<T> = { -readonly [K in keyof T]-?: T[K] };
```

## 键重映射 `as`（TS 4.1+）

`as` 子句可以改名或过滤键：

```typescript
// 加前缀
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type G = Getters<{ id: number; name: string }>;
// { getId: () => number; getName: () => string }
```

`string & K` 是必需的：`K` 的类型是 `string | number | symbol`，而模板字面量只接受能转成字符串的类型。

### 用 `as` 过滤键

`as` 返回 `never` 时，该键被**移除**：

```typescript
// 按值类型过滤
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type OnlyStrings = PickByType<User, string>;    // 只保留 string 值的键

// 按值类型排除
type OmitByType<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};

// 按键名前缀过滤
type OnlyKeysStartingWith<T, P extends string> = {
  [K in keyof T as K extends `${P}${string}` ? K : never]: T[K];
};
```

### 去前缀

```typescript
type RemovePrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]: T[K];
};
```

### 生成成对的 getter/setter

```typescript
type Accessors<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void;
};
```

## 从联合生成对象

```typescript
type Flags = "a" | "b";
type FlagMap = { [K in Flags]: boolean };   // { a: boolean; b: boolean }

// 等价写法
type FlagMap2 = Record<Flags, boolean>;
```

注意这里遍历的是**联合**而不是 `keyof T`——这是映射类型的通用形式 `[K in SomeUnion]`。

## 同态映射：修饰符保留规则

这是实现工具类型时最容易出错的地方。实测结论（`U = { readonly a: number; b?: string }`）：

| 写法 | 保留 `readonly` | 保留 `?` |
|---|---|---|
| `{ [K in keyof T]: T[K] }` | ✓ | ✓ |
| `{ [K in keyof T as K]: T[K] }` | ✓ | ✓ |
| `{ [K in keyof T & string]: T[K] }` | ✗ | ✗ |

关键结论：

- **直接用 `keyof T` 或 `keyof T as ...` 都是同态的**，修饰符保留
- 一旦对 `keyof T` 做**运算**（如 `keyof T & string`），就不再同态，修饰符全部丢失

> [!WARNING] `as` 重映射不破坏同态性
> 这点容易记反。`{ [K in keyof T as K]: T[K] }` 看起来像"变换了键"，但它仍然是同态的，修饰符照常保留。真正破坏同态性的是对 `keyof T` 本身做运算。
>
> 实测验证：`NonHomo<U>` 的 `a` 不再只读、`b` 不再可选：
>
> ```typescript
> type NonHomo<T> = { [K in keyof T & string]: T[K] };
> const h3: NonHomo<U> = { a: 1, b: "x" };   // b 现在必须提供
> h3.a = 2;                                   // 不再是只读
> ```

## 常用映射类型一览

| 名称 | 实现 | 作用 |
|---|---|---|
| `Partial<T>` | `{ [K in keyof T]?: T[K] }` | 全部可选 |
| `Required<T>` | `{ [K in keyof T]-?: T[K] }` | 全部必需 |
| `Readonly<T>` | `{ readonly [K in keyof T]: T[K] }` | 全部只读 |
| `Pick<T, K>` | `{ [P in K]: T[P] }` | 保留指定键 |
| `Record<K, V>` | `{ [P in K]: V }` | 构造键值对象 |
| `Getters<T>` | 见上 | 批量加前缀 |

## 相关

- [高级类型](./advanced-types.md) —— 映射类型的基础
- [条件类型与 infer](./conditional-types-infer.md) —— 与条件类型组合
- [模板字面量类型](./template-literal-types.md) —— `as` 子句里的字符串变换
- [内置工具类型](./builtin-utility-types.md) —— 这些映射的实际应用
