---
title: "模板字面量类型"
date: 2026-09-21
weight: 53
draft: false
toc: true
tags: ["typescript"]
---

模板字面量类型（TS 4.1+）把字符串拼接和模式匹配搬到了类型层面。它是"批量改写键名"和"解析字符串结构"的核心工具。

## 基础

{{< include "src/template-literal-types/patterns.ts" "ts" >}}

```text
ABC abc Abc abc users/1 [ 'a', 'b/c' ] { key: 'name', value: 'rainboy' } id userFirstName user_first_name a_b-c a_b_c { userId: 1, userName: 'a', createdAt: 'd' } sm-red v1 v1.5 v1.2.3 true null true false v1.2.3
```

拼接语法和运行时模板字符串一样，只是位置在类型里：

```typescript
type EventName = "click" | "focus";
type Handler = `on${Capitalize<EventName>}`;   // "onClick" | "onFocus"
```

**联合类型会做笛卡尔积**：

```typescript
type Size = "sm" | "md";
type Color = "red" | "blue";
type Variant = `${Size}-${Color}`;   // 4 个成员的联合
```

## 四个内置字符串操作类型

```typescript
Uppercase<"abc">      // "ABC"
Lowercase<"ABC">      // "abc"
Capitalize<"abc">     // "Abc"
Uncapitalize<"Abc">   // "abc"
```

它们只作用于**字面量字符串类型**。传入 `string` 会得到 `string`。

## 用 `infer` 做模式匹配

```typescript
// 去掉前导斜杠
type StripLeadingSlash<T> = T extends `/${infer Rest}` ? Rest : never;
type E = StripLeadingSlash<"/users/1">;        // "users/1"

// 只切第一段
type SplitFirst<T> = T extends `${infer Head}/${infer Tail}` ? [Head, Tail] : never;
type F = SplitFirst<"a/b/c">;                  // ["a", "b/c"]

// 解析键值对
type ParseKV<T> = T extends `${infer K}=${infer V}` ? { key: K; value: V } : never;
type G = ParseKV<"name=rainboy">;              // { key: "name"; value: "rainboy" }
```

注意 `SplitFirst<"a/b/c">` 的结果是 `["a", "b/c"]`——**非贪婪匹配**，只切第一段。

## 递归转换

模板字面量类型可以递归，这是"字符串算法"在类型层面的实现：

```typescript
// 蛇形转驼峰
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

type I = SnakeToCamel<"user_first_name">;      // "userFirstName"
```

**全部替换**需要递归（因为 `infer` 只匹配第一处）：

```typescript
type Replace<S extends string, From extends string, To extends string> =
  S extends `${infer Head}${From}${infer Tail}` ? `${Head}${To}${Tail}` : S;

type K = Replace<"a-b-c", "-", "_">;           // "a_b-c"（只替换第一处）

type ReplaceAll<S extends string, From extends string, To extends string> =
  S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;

type L = ReplaceAll<"a-b-c", "-", "_">;        // "a_b_c"
```

## 与映射类型组合：批量改键名

这是模板字面量类型最有价值的应用：

```typescript
interface ApiResponse {
  user_id: number;
  user_name: string;
  created_at: string;
}

type CamelKeys<T> = {
  [P in keyof T as SnakeToCamel<string & P>]: T[P];
};

type M = CamelKeys<ApiResponse>;
// { userId: number; userName: string; createdAt: string }
```

`string & P` 是必需的——`keyof T` 的元素类型是 `string | number | symbol`，而模板字面量只接受字符串。详见 [映射类型](./mapped-types.md)。

## 判断前缀/后缀

```typescript
type StartsWith<T, P extends string> = T extends `${P}${string}` ? true : false;

type N = StartsWith<"onClick", "on">;   // true
type O = StartsWith<"click", "on">;     // false
```

## `${number}` 的边界

```typescript
type SemverMajor = `v${number}`;

const v1: SemverMajor = "v1";        // ✓
const v1_5: SemverMajor = "v1.5";    // ✓

const v1_2_3: SemverMajor = "v1.2.3";
// error TS2322: Type '"v1.2.3"' is not assignable to type '`v${number}`'.
```

`${number}` 只匹配**单个合法的数字字面量**。`1.2.3` 不是合法数字，所以不匹配。需要任意字符串时用 `${string}`：

```typescript
type Version = `v${string}`;
const vAny: Version = "v1.2.3";      // ✓
```

## 其他占位类型

| 占位 | 匹配 | 实测通过的示例 |
|---|---|---|
| `${string}` | 任意字符串 | `"anything"` |
| `${number}` | 合法数字字面量 | `"1"`、`"1.5"`、`"-1"`、`"1e3"`、`"0x10"` |
| `${bigint}` | 整数字面量 | `"1"`、`"1n"` |
| `${boolean}` | 布尔 | `"true"` \| `"false"` |
| `${null}` | null | `"null"` |
| `${undefined}` | undefined | `"undefined"` |

实测确认 `${number}` 的匹配范围比想象的宽——负数、科学计数法、十六进制都算合法数字字面量，都会通过。它只排除真正不合法的形式（如 `"1.2.3"`、`"vabc"`）：

```text
error TS2322: Type '"v1.2.3"' is not assignable to type '`v${number}`'.
error TS2322: Type '"vabc"' is not assignable to type '`v${number}`'.
```

## 实用模式

| 需求 | 写法 |
|---|---|
| 加前缀 | `` `get${Capitalize<K>}` `` |
| 去前缀 | `` K extends `${P}${infer R}` ? R : K `` |
| 全部替换 | 递归 |
| 判断前缀 | `` T extends `${P}${string}` `` |
| 解析键值 | `` T extends `${infer K}=${infer V}` `` |

## 相关

- [映射类型](./mapped-types.md) —— `as` 子句里的键重映射
- [条件类型与 infer](./conditional-types-infer.md) —— `infer` 的完整规则
- [高级类型](./advanced-types.md) —— 模板字面量类型的基础
