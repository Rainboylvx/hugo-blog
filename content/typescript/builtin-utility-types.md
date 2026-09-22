---
title: "内置工具类型"
date: 2026-09-21
weight: 54
draft: false
toc: true
tags: ["typescript"]
---

TypeScript 自带一批工具类型，它们都是用前面几篇讲的条件类型和映射类型实现的。这一篇是完整目录加组合示例。

## 完整目录

{{< include "src/builtin-utility-types/catalog.ts" "ts" >}}

```text
{ id: 1 } [Function: noThis] [ 1, 2 ] Point { x: 1, y: 2 } s 1 s A a Ab ab
{ id: 1, name: 'a', age: 1 } { id: 1, email: 'b' } { id: '1', name: 'a', email: 'b', age: 1 } { a: { b: {} } } { a: { b: 1 } } { a: 1 } s { a: 1, b: 2 } name
```

### 对象变换

| 工具类型 | 作用 | 实现 |
|---|---|---|
| `Partial<T>` | 全部可选 | `{ [K in keyof T]?: T[K] }` |
| `Required<T>` | 全部必需 | `{ [K in keyof T]-?: T[K] }` |
| `Readonly<T>` | 全部只读 | `{ readonly [K in keyof T]: T[K] }` |
| `Pick<T, K>` | 保留指定键 | `{ [P in K]: T[P] }` |
| `Omit<T, K>` | 排除指定键 | `Pick<T, Exclude<keyof T, K>>` |
| `Record<K, V>` | 构造键值对象 | `{ [P in K]: V }` |

### 联合变换

| 工具类型 | 作用 | 实现 |
|---|---|---|
| `Exclude<T, U>` | 排除可赋给 `U` 的成员 | `T extends U ? never : T` |
| `Extract<T, U>` | 只保留可赋给 `U` 的成员 | `T extends U ? T : never` |
| `NonNullable<T>` | 排除 `null`/`undefined` | `T extends null \| undefined ? never : T` |

这三个是**分布式条件类型**的直接应用（见 [条件类型与 infer](./conditional-types-infer.md)）。

### 函数变换

| 工具类型 | 作用 |
|---|---|
| `ReturnType<T>` | 返回类型 |
| `Parameters<T>` | 参数元组 |
| `ThisParameterType<T>` | `this` 类型 |
| `OmitThisParameter<T>` | 去掉 `this` 参数 |
| `ConstructorParameters<T>` | 构造函数参数元组 |
| `InstanceType<T>` | 构造函数实例类型 |

`ThisParameterType` 和 `OmitThisParameter` 配合使用：

```typescript
type Fn = (this: { id: number }, a: string, b: number) => boolean;

type ThisT = ThisParameterType<Fn>;     // { id: number }
type NoThis = OmitThisParameter<Fn>;    // (a: string, b: number) => boolean
```

> [!WARNING] `ReturnType` 对重载函数取最后一个签名
> 实测确认：重载函数用 `ReturnType` 时，得到的是**最后一个**重载签名的返回类型，不是所有签名的联合。写类型时要注意这个行为。

### Promise

| 工具类型 | 作用 |
|---|---|
| `Awaited<T>` | 递归拆开 Promise |

```typescript
Awaited<Promise<string>>              // string
Awaited<Promise<Promise<number>>>     // number（递归）
Awaited<string | Promise<number>>     // string | number
```

### 字符串（TS 4.1+）

| 工具类型 | 作用 |
|---|---|
| `Uppercase<S>` | 转大写 |
| `Lowercase<S>` | 转小写 |
| `Capitalize<S>` | 首字母大写 |
| `Uncapitalize<S>` | 首字母小写 |

## 组合出项目专用工具

内置的 12 个不够用时，用它们拼。

### 把某个键变成可选

```typescript
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

思路：先用 `Omit` 删掉这个键，再用 `Partial<Pick>` 加回来（这次是可选的）。

### 把某个键变成必需

```typescript
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

### 只改一个键的类型

```typescript
type Override<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };
```

`Omit & Pick` 是"改一个键"的标准套路。

### 深度变换

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};
```

### 至少一个键必需

```typescript
type AtLeastOne<T, K extends keyof T = keyof T> = Omit<T, K> &
  { [P in K]: Required<Pick<T, P>> & Partial<Record<Exclude<K, P>, never>> }[K];
```

### 取出值为某类型的键

```typescript
type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
```

末尾的 `[keyof T]` 是索引访问，把映射类型的**值**联合起来——这是"从映射类型提取联合"的标准技巧。

### 联合转交叉

```typescript
type UnionToIntersection<U> =
  (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
```

靠函数参数的逆变位置实现（见 [条件类型与 infer](./conditional-types-infer.md)）。

## 查看源码

内置工具类型定义在 `lib.es5.d.ts` 里。在 TS 7 中这个文件在平台包里：

```bash
# macOS ARM
node_modules/@typescript/typescript-darwin-arm64/lib/lib.es5.d.ts
```

搜索 `type Partial`、`type Pick`、`type Exclude` 就能找到。它们都很短（大多 1-3 行），是学习类型编程最好的材料。

> [!TIP] 学习路径
> 1. 读 `lib.es5.d.ts` 里的 `Partial`、`Pick`、`Exclude`、`ReturnType`
> 2. 自己实现一遍，不看源码
> 3. 做 [Type Challenges](https://github.com/type-challenges/type-challenges) 的 Easy
> 4. 读真实库的类型定义（`zod` 的 `z.infer`、`Prisma` 的 `GetPayload`）

## 相关

- [高级类型](./advanced-types.md) —— 这些工具类型的实现原理
- [条件类型与 infer](./conditional-types-infer.md) —— 分布式条件类型
- [映射类型](./mapped-types.md) —— 映射类型与修饰符
- [工程化](./engineering.md) —— lib 文件在 TS 7 中的位置
