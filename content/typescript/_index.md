---
title: "TypeScript 学习笔记"
date: 2026-09-21
noList: true
toc: false
tags: ["typescript"]
---

按知识层级推进的 TypeScript 学习体系。假定读者已经会 JavaScript，只讲与 TypeScript 相关的 JS 语义（类型擦除、运行时与编译期的边界）。

## 0. 心智模型

- [类型擦除：编译期与运行时的分界](./type-erasure.md) — TS 的类型在运行时不存在；哪些语法会留下运行时产物

## 1. 类型基础

- [类型基础](./type-basics.md) — 原始类型与字面量、注解与推断、对象类型、数组与元组、函数类型
- [注解与推断](./annotations-vs-inference.md) — 什么时候必须写注解，什么时候写了是噪音
- [数组与元组](./array-vs-tuple.md) — 两者的选择，元组的定长、可选元素与只读形态
- [函数类型](./function-types.md) — 参数逆变、`this` 参数、重载与实现签名
- [只读与不可变](./readonly-and-immutability.md) — `readonly`、`ReadonlyArray`、`as const` 的深浅边界

## 2. 类型组合与收窄

- [类型收窄](./narrowing.md) — 联合与交叉、判别联合、控制流分析、类型谓词、穷尽性检查
- [enum 深挖](./enum-in-depth.md) — 数字/字符串/`const enum`、反向映射、编译产物、何时不该用
- [interface 与 type](./interface-vs-type.md) — 声明合并、`extends` 与 `&`、选择标准
- [object 与 Object](./object-and-Object.md) — 两者的区别、`{}` 的陷阱、该用哪个
- [typeof 的两种含义](./typeof-two-meanings.md) — 值位置的运行时判断 vs 类型位置的类型查询
- [类既是值又是类型](./class-value-and-type.md) — `C` 与 `typeof C`、实例侧与静态侧
- [多余属性检查](./excess-property-check.md) — 对象字面量的特殊规则、怎么绕过

## 3. 泛型

- [泛型](./generics.md) — 函数/类/接口泛型、约束、默认参数、推断时机
- [泛型的推断位置](./generic-inference-positions.md) — 类型参数从哪些位置被推断，为什么有的推断不出来

## 4. 高级类型

- [高级类型](./advanced-types.md) — 条件类型、`infer`、映射类型、模板字面量类型、`keyof`、工具类型
- [条件类型与 infer](./conditional-types-infer.md) — 分布式条件类型、`infer` 的约束与多个 `infer`
- [映射类型](./mapped-types.md) — `+`/`-` 修饰符、键重映射 `as`、同态映射
- [模板字面量类型](./template-literal-types.md) — 模式匹配，与映射类型组合
- [内置工具类型](./builtin-utility-types.md) — `Partial`、`Pick`、`Omit`、`Record`、`ReturnType`、`Awaited` 等
- [satisfies 与 as const](./satisfies-and-as-const.md) — 保留推断还是断言
- [声明合并](./declaration-merging.md) — interface 合并、`declare module`、给第三方库加类型

## 5. 类与装饰器

- [类与装饰器](./classes-and-decorators.md) — 成员修饰符、参数属性、`static`、抽象类、两种装饰器路线
- [抽象类与 implements](./abstract-class-and-implements.md) — 抽象类与 interface 的分工
- [装饰器（legacy）](./decorators-legacy.md) — `experimentalDecorators`、五类装饰器、`emitDecoratorMetadata`
- [装饰器（标准）](./decorators-standard.md) — TC39 stage-3 装饰器与 legacy 的语义差异

## 6. 工程化

- [工程化](./engineering.md) — tsconfig 详解、编译与运行、声明文件、从 JS 迁移
- [TypeScript 版本现状](./typescript-in-2026.md) — 5.x/6.x/7.0 的定位，TS 7 的 Go 重写与 compiler API 移除
- [运行 TypeScript](./running-ts.md) — `tsc`/`tsx`/`ts-node` 现状、Node 原生 type stripping、调试配置
- [.d.ts 与第三方类型](./dts-and-third-party-types.md) — `@types/*`、`declare`、写自己的声明文件
- [从 JS 迁移](./migrating-from-js.md) — `allowJs`/`checkJs`、逐步收紧、`any` 治理

## 资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/) — Handbook 与 TSConfig 参考
- [TypeScript Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html) — 逐版本新特性与弃用项
- [TypeScript 官方博客](https://devblogs.microsoft.com/typescript/) — 版本发布与编译器重写进展
- [Type Challenges](https://github.com/type-challenges/type-challenges) — 类型体操题库，配合第 4 组练习
- [Node.js 原生 TypeScript 支持](https://nodejs.org/api/typescript.html) — type stripping 的边界与 erasable syntax 限制
- [TypeScript Playground](https://www.typescriptlang.org/play) — 在线试验与查看编译产物
- [阮一峰 TypeScript 教程](https://typescript.p6p.net/typescript-tutorial/intro.html) — 中文入门
- [TypeScript 入门教程（xcatliu）](https://ts.xcatliu.com/) — 中文入门

> [!INFO] 旧笔记
> 2026-09-21 重写之前的笔记保存在 [_archive/](./_archive/)，内容已被本体系吸收或替代。
