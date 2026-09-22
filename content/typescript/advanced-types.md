---
title: "高级类型"
date: 2026-09-21
weight: 50
draft: false
toc: true
tags: ["typescript"]
---

前四组讲的是"怎么描述一个类型的形状"。这一组讲的是**类型层面的计算**：条件类型、`infer`、映射类型、模板字面量类型，以及由此派生出的内置工具类型。这些能力让 TypeScript 的类型系统成为一个可以编程的语言。

> [!INFO] 先建立预期
> 这一组的能力日常写业务代码用得不多，但在写库、写通用工具、给第三方库补类型时会密集使用。更重要的是：**理解它们能让你看懂别人写的类型定义**——包括 React、Express、Prisma 的类型声明。

## 条件类型

`T extends U ? X : Y` 是类型层面的 `if`：

{{< include "src/advanced-types/conditional.ts" "ts" >}}

```text
true false [ 1 ] [ 1, 'a' ] x true false true false
```

### 分布式条件类型

这是条件类型最容易踩坑的地方：**当 `T` 是裸类型参数且传入联合类型时，条件类型会分发到每个成员**。

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

type D = ToArray<string | number>;   // string[] | number[]
```

不是 `(string | number)[]`，而是 `string[] | number[]`。

用方括号包裹可以阻止分发：

```typescript
type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never;
type E = ToArrayNoDist<string | number>;   // (string | number)[]
```

`Exclude`、`Extract`、`NonNullable` 这些工具类型正是靠分发实现的：

```typescript
type NonNullable2<T> = T extends null | undefined ? never : T;
type F = NonNullable2<string | null | undefined>;   // string
```

### `never` 的特殊性

在分布式条件类型里，`never` 会直接返回 `never`，而不是分发：

```typescript
type G = ToArray<never>;   // never（不是 never[]）
```

因为 `never` 是空联合，没有成员可以分发。

### 类型探测技巧

有些类型用 `extends` 判断不出来，需要技巧：

```typescript
// 探测 any：any 会同时匹配 1 和 0，用交叉类型利用这个特性
type IsAny<T> = 0 extends 1 & T ? true : false;

// 探测 never：必须用 [T] extends [never] 阻止分发
type IsNever<T> = [T] extends [never] ? true : false;
```

`IsNever` 必须用方括号。写成 `T extends never ? true : false` 时，传入 `never` 会因为分发规则直接返回 `never`，而不是 `true`。

## `infer`：在条件类型里提取类型

`infer` 声明一个"待推断的类型变量"，让条件类型可以**从结构里提取出类型**：

{{< include "src/advanced-types/infer.ts" "ts" >}}

```text
s true [ 's', 1 ] s 1 s 1 [ 1, 's' ] a undefined s { id: 1 } true
```

常见用途：

| 目标 | 写法 |
|---|---|
| 提取返回类型 | `T extends (...args: never[]) => infer R ? R : never` |
| 提取参数类型 | `T extends (...args: infer P) => unknown ? P : never` |
| 提取数组元素 | `T extends (infer E)[] ? E : never` |
| 拆开 Promise | `T extends Promise<infer U> ? U : T` |
| 交换元组 | `T extends [infer A, infer B] ? [B, A] : never` |
| 提取构造函数实例 | `T extends new (...args: never[]) => infer R ? R : never` |

### `infer` 带约束（TS 4.7+）

```typescript
type FirstString<T> = T extends [infer S extends string, ...unknown[]] ? S : never;

type I = FirstString<["a", 1]>;   // "a"
type J = FirstString<[1, 2]>;     // never
```

约束写在 `infer S extends string` 里，不满足时该分支不匹配。

### 递归 `infer`

`infer` 可以配合递归处理嵌套结构：

```typescript
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;
type K = DeepUnwrap<Promise<Promise<string>>>;   // string
```

> [!WARNING] 递归深度有限制
> TypeScript 对递归类型有实例化深度上限，过深会报 `error TS2589: Type instantiation is excessively deep and possibly infinite`。
>
> 实测（TS 7.0.2，形如 `type Deep<T> = T extends readonly [infer U] ? Deep<U> : T` 的单层递归）：
>
> | 嵌套层数 | 结果 |
> |---|---|
> | 950 | 通过 |
> | 1000 | `TS2589` |
>
> 实际上限与递归的具体形状有关（旧版本报告的上限低得多，TS 7 明显提高），所以不要把这个数字当硬指标。要点是：写递归类型时留个基础分支，别让它无限展开。

## 映射类型

映射类型遍历一个类型的所有键，生成新类型：

{{< include "src/advanced-types/mapped.ts" "ts" >}}

```text
1 a 1 true a 1 1
```

### 基本形态与修饰符

```typescript
type Partial2<T> = { [K in keyof T]?: T[K] };
type Required2<T> = { [K in keyof T]-?: T[K] };      // -? 去掉可选
type Readonly2<T> = { readonly [K in keyof T]: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // -readonly 去掉只读
```

`+` 和 `-` 前缀用来增删修饰符。`+` 是默认值，所以 `+?` 等于 `?`。

### 键重映射 `as`（TS 4.1+）

`as` 子句可以改名或过滤键：

```typescript
// 批量加前缀
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// 按值类型过滤键
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};
type OnlyStrings = PickByType<User, string>;   // { name: string; email: string }
```

`as` 后面返回 `never` 时，该键被移除——这就是 `PickByType` 过滤的实现原理。

`string & K` 的写法是必须的：`K` 可能是 `string | number | symbol`，而模板字面量只接受能转成字符串的类型。

### 同态映射

`{ [K in keyof T]: ... }` 这种形式叫**同态映射**（homomorphic mapped type），它会**自动保留**原类型的 `readonly` 和 `?` 修饰符。

实测对比（`U = { readonly a: number; b?: string }`）：

| 写法 | 保留 `readonly` | 保留 `?` |
|---|---|---|
| `{ [K in keyof T]: T[K] }` | ✓ | ✓ |
| `{ [K in keyof T as K]: T[K] }` | ✓ | ✓ |
| `{ [K in keyof T & string]: T[K] }` | ✗ | ✗ |

结论：**直接用 `keyof T` 或 `keyof T as ...` 都是同态的**，修饰符保留。但一旦对 `keyof T` 做了运算（如 `keyof T & string`），就不再是同态，修饰符全部丢失：

```typescript
type H3<T> = { [K in keyof T & string]: T[K] };
type R = H3<{ readonly a: number; b?: string }>;
// R 的 a 不再只读，b 不再可选
// error TS2741: Property 'b' is missing in type '{ a: number; }' but required in type 'H3<U>'.
```

`as` 重映射本身不破坏同态性——这点容易记反，实测才能确认。

## 模板字面量类型

模板字面量类型（TS 4.1+）在类型层面做字符串拼接与模式匹配：

{{< include "src/advanced-types/template-literal.ts" "ts" >}}

```text
ABC abc Abc abc users/1 [ 'a', 'b/c' ] { key: 'name', value: 'rainboy' } userFirstName { userId: 1, userName: 'a' } sm-red v1 v1.5 v1.2.3
```

### 四个内置字符串操作类型

```typescript
Uppercase<"abc">      // "ABC"
Lowercase<"ABC">      // "abc"
Capitalize<"abc">     // "Abc"
Uncapitalize<"Abc">   // "abc"
```

### 模式匹配

配合 `infer` 可以解析字符串：

```typescript
type ParseKV<T> = T extends `${infer K}=${infer V}` ? { key: K; value: V } : never;
type G = ParseKV<"name=rainboy">;   // { key: "name"; value: "rainboy" }
```

### 递归转换

模板字面量类型可以递归，这是"蛇形转驼峰"这类工具的实现方式：

```typescript
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

type H = SnakeToCamel<"user_first_name">;   // "userFirstName"
```

配合映射类型的 `as` 就能批量改对象键名：

```typescript
type CamelKeys<T> = {
  [K in keyof T as SnakeToCamel<string & K>]: T[K];
};
```

### 联合分发

模板字面量遇到联合类型会做笛卡尔积：

```typescript
type Size = "sm" | "md";
type Color = "red" | "blue";
type Variant = `${Size}-${Color}`;   // 4 个成员的联合
```

### `${number}` 的边界

```typescript
type SemverMajor = `v${number}`;
const v1: SemverMajor = "v1";        // 通过
const v1_5: SemverMajor = "v1.5";    // 通过

// @ts-expect-error TS2322: "v1.2.3" 不是单个 number 字面量
const v1_2_3: SemverMajor = "v1.2.3";

type Version = `v${string}`;         // 需要任意字符串时用 string
const vAny: Version = "v1.2.3";
```

实测错误消息：

```text
error TS2322: Type '"v1.2.3"' is not assignable to type '`v${number}`'.
```

`${number}` 只匹配合法的数字字面量，`1.2.3` 不是。

## `keyof` 与索引访问

{{< include "src/advanced-types/keyof-index.ts" "ts" >}}

```text
id 1 a b x 1 debug any 0 [ 1, 'a' ] bj
```

### `keyof` 的边界行为（均已实测）

| 表达式 | 结果 |
|---|---|
| `keyof { a: 1; b: 2 }` | `"a" \| "b"` |
| `keyof ({ a: 1 } \| { b: 2 })` | `never` ← 取**交集**，无公共键 |
| `keyof ({ a: 1; c: 3 } \| { a: 1; b: 2 })` | `"a"` |
| `keyof ({ a: 1 } & { b: 2 })` | `"a" \| "b"` ← 交叉取**并集** |
| `keyof any` | `string \| number \| symbol` |
| `keyof never` | `string \| number \| symbol` |
| `keyof unknown` | `never` |
| `keyof { [k: string]: number }` | `string \| number` |

联合类型取交集、交叉类型取并集，这个方向容易记反。

### 索引访问类型

```typescript
type IdType = User["id"];                  // number
type CityType = User["address"]["city"];   // string
type AllValues = User[keyof User];         // 所有值的联合
```

`T[K]` 就是"取 `T` 上 `K` 这个键的类型"，可以嵌套、可以用联合作为键。

### `typeof` + `keyof` 组合

从值反推键：

```typescript
const config = { debug: true, level: 1 };
type ConfigKey = keyof typeof config;   // "debug" | "level"
```

注意 `keyof` 和 `typeof` 的顺序不能反。`typeof` 在类型位置是类型查询（见 [typeof 的两种含义](./typeof-two-meanings.md)）。

## 内置工具类型

{{< include "src/advanced-types/utility-types.ts" "ts" >}}

```text
{ id: 1 } { id: 1, name: 'a', email: 'b', age: 1 } { id: 1, name: 'a' } { id: 1, name: 'a', age: 1 } { a: 1, b: 2 } b a s true [ 's', 1 ]
{ id: 1, name: 'a', email: 'b', age: 1 } s 1 s A a Ab ab { id: 1, name: 'a', age: 1 } { id: '1', name: 'a', email: 'b', age: 1 } { a: { b: {} } }
```

### 对象变换

| 工具类型 | 作用 | 实现要点 |
|---|---|---|
| `Partial<T>` | 全部可选 | `[K in keyof T]?: T[K]` |
| `Required<T>` | 全部必需 | `[K in keyof T]-?: T[K]` |
| `Readonly<T>` | 全部只读 | `readonly [K in keyof T]: T[K]` |
| `Pick<T, K>` | 保留指定键 | `[P in K]: T[P]` |
| `Omit<T, K>` | 排除指定键 | `Pick<T, Exclude<keyof T, K>>` |
| `Record<K, V>` | 构造键值对象 | `[P in K]: V` |

### 联合变换

| 工具类型 | 作用 |
|---|---|
| `Exclude<T, U>` | 从 `T` 中排除可赋给 `U` 的成员 |
| `Extract<T, U>` | 只保留可赋给 `U` 的成员 |
| `NonNullable<T>` | 排除 `null` 和 `undefined` |

`Exclude` 和 `Extract` 是分布式条件类型的直接应用：

```typescript
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
```

### 函数变换

| 工具类型 | 作用 |
|---|---|
| `ReturnType<T>` | 返回类型 |
| `Parameters<T>` | 参数元组 |
| `ThisParameterType<T>` | `this` 类型 |
| `OmitThisParameter<T>` | 去掉 `this` 参数 |
| `ConstructorParameters<T>` | 构造函数参数元组 |
| `InstanceType<T>` | 构造函数实例类型 |

> [!WARNING] `ReturnType` 对重载函数取最后一个签名
> 实测确认：对重载函数使用 `ReturnType` 时，得到的是**最后一个**重载签名的返回类型，而不是所有签名的联合。这是 TypeScript 的既有行为，写类型时要注意。

### Promise 与字符串

| 工具类型 | 作用 |
|---|---|
| `Awaited<T>` | 递归拆开 Promise |
| `Uppercase` / `Lowercase` | 大小写转换 |
| `Capitalize` / `Uncapitalize` | 首字母转换 |

`Awaited` 支持三种形态（已实测）：

```typescript
Awaited<Promise<string>>              // string
Awaited<Promise<Promise<number>>>     // number（递归拆开）
Awaited<string | Promise<number>>     // string | number
```

### 组合出项目专用工具

内置工具类型不够用时，用它们拼：

```typescript
// 把某个键变成可选
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 只改一个键的类型
type Override<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };

// 深度 Partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

`Omit & Pick` 是"改一个键"的标准套路：先删掉它，再用新类型加回来。

## `satisfies` 与 `as const`

{{< include "src/advanced-types/satisfies-as-const.ts" "ts" >}}

```text
GET GETT GET GET GET dark a dark dev dev http://localhost b 1 1
```

### 注解的两个问题

```typescript
// 问题一：注解会丢失推断
const routes1: Route[] = [{ path: "/a", method: "GET" }];
// routes1[0].method 是 "GET" | "POST"，丢失了具体值

// 问题二：不注解会丢失检查
const routes2 = [{ path: "/a", method: "GETT" }];   // 拼错了也不报错
```

`satisfies` 同时解决两者：

```typescript
const routes3 = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] satisfies Route[];
// 有检查，且保留了具体的字面量类型
```

### `satisfies` 的一个细节

数组用 `satisfies` 后，索引访问得到的是**元素类型的联合**：

```typescript
type Route3Method = (typeof routes3)[number]["method"];   // "GET" | "POST"

// 单个对象才保留具体字面量
const single = { path: "/a", method: "GET" } satisfies Route;
const r3: "GET" = single.method;      // 通过

// 数组要保留每个位置的字面量，用 as const satisfies
const tuple = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] as const satisfies readonly Route[];
const t0: "GET" = tuple[0].method;    // 通过
```

### 常用组合

```typescript
// 检查对象键完整
const urls = {
  dev: "http://localhost",
  prod: "https://example.com",
} satisfies Record<Env, string>;      // 少写一个键会报错

// 最严格：只读 + 字面量 + 检查
const config = {
  mode: "dark",
  tags: ["a", "b"],
} as const satisfies { mode: string; tags: readonly string[] };
```

## 声明合并

同名声明会按规则合并，这是给第三方库补类型的基础：

{{< include "src/advanced-types/declaration-merging.ts" "ts" >}}

```text
{ width: 1, height: 2 } 1 1 2 w 1.0 hi 1 red { a: 1, b: 2 } base 1.0.0
```

### 能合并的

| 声明 | 合并规则 |
|---|---|
| `interface` | 成员累加（同名同类型允许，类型不同报错） |
| `namespace` | 成员累加 |
| `class` + `namespace` | 类获得静态成员 |
| `function` + `namespace` | 函数获得属性 |
| `enum` + `namespace` | 枚举获得方法 |
| `declare global` | 扩展全局作用域 |
| `declare module` | 给不存在的模块补类型 |

### 不能合并的

```typescript
type T1 = { a: 1 };
type T1 = { b: 2 };   // error: Duplicate identifier 'T1'
```

**类型别名不能合并**。需要合并时改用 `interface`：

```typescript
interface Merged { a: 1 }
interface Merged { b: 2 }
```

这是 [interface 与 type](./interface-vs-type.md) 里"优先用 interface 描述对象"的一条实际理由。

### 接口重载的顺序

多个同名 interface 声明方法时，**后声明的签名优先**：

```typescript
interface Calc { add(x: string): string }
interface Calc { add(x: number): number }

declare const calc: Calc;
calc.add(1);      // number（后声明的优先）
```

### 环境声明的位置规则

`declare module "xxx"` 和 `declare global` 对文件类型有要求：

- `declare module "不存在的模块"` 写在**全局脚本文件**（无 `import`/`export`）里，如 `ambient.d.ts`
- `declare global` 必须写在**模块文件**（有 `import`/`export`）里，且通常配 `export {}` 显式声明为模块

写错位置会得到 `error TS2664: Invalid module name in augmentation, module 'xxx' cannot be found`。

> [!TIP] 给第三方库加类型
> 标准做法是建一个 `types/` 目录，放 `declare module` 声明文件，并在 `tsconfig.json` 的 `include` 里包含它。详见 [.d.ts 与第三方类型](./dts-and-third-party-types.md)。

## 类型体操训练路径

这一组的能力需要练习才能内化。推荐顺序：

1. **读懂内置工具类型的实现**。打开 `node_modules/typescript/lib/lib.es5.d.ts`，找 `Partial`、`Pick`、`Exclude`、`ReturnType`，逐个看实现。它们都很短。
2. **自己实现一遍内置工具类型**，不看源码。这是 [Type Challenges](https://github.com/type-challenges/type-challenges) 的 Easy 部分。
3. **做 Medium 难度的题**。主要涉及 `infer` 的位置、分布式条件类型、递归。
4. **读一个真实库的类型定义**。推荐 `zod` 的 `z.infer`、`Prisma` 的 `Prisma.UserGetPayload`，看它们怎么组合这些能力。

> [!WARNING] 类型体操的收益递减
> 类型体操能让类型精确到极致，但代价是可读性。业务代码里 `type X = A extends B ? ... : ...` 嵌套三层后没人看得懂，报错信息也会变得极难读。判断标准：**这段类型能不能让调用方少犯错**。如果只是为了炫技，直接写宽一点更好。

## 小结

| 能力 | 关键点 |
|---|---|
| 条件类型 | 裸类型参数遇联合会分发，`[T] extends [U]` 阻止分发 |
| `infer` | 从结构提取类型，可带约束 `infer S extends string`，可递归 |
| 映射类型 | `as` 子句改名或过滤键；同态映射保留修饰符 |
| 模板字面量 | 字符串模式匹配，联合会做笛卡尔积，`${number}` 有边界 |
| `keyof` | 联合取交集，交叉取并集 |
| 工具类型 | `Omit & Pick` 是改一个键的标准套路 |
| `satisfies` | 既检查又保留推断；数组要配 `as const` 才保留位置信息 |
| 声明合并 | interface/namespace 可合并，type 不行 |

下一篇：[类与装饰器](./classes-and-decorators.md)。
