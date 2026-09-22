---
title: "从 JS 迁移"
date: 2026-09-21
weight: 74
draft: false
toc: true
tags: ["typescript"]
---

把老 JavaScript 项目迁到 TypeScript，最大的风险不是技术问题，而是**一次性开 `strict` 导致上千个错误、项目卡死**。正确做法是分阶段推进。

## 分阶段策略

{{< include "src/migrating-from-js/staged-config.ts" "ts" >}}

```text
{ name: 'a' } true true
[ 1, 2 ] ok 1
```

### 阶段 0：先让项目跑起来

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "strict": false
  }
}
```

- `allowJs`：让 `.js` 也参与编译（但用 `checkJs: false` 不检查类型）
- `noEmit`：只检查，不产出
- `strict: false`：先别开严格模式

这一步的目标只是让 `tsc --noEmit` 能跑通，不改任何代码。

### 阶段 1：逐文件改后缀

把 `.js` 改成 `.ts`，**一次一个文件**，改完就修这个文件的类型错误。不要批量改。

### 阶段 2：收紧配置

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

**按模块逐步开**。老项目全局一次开 `strict` 会瞬间出现大量错误。可以先用目录级的 `tsconfig.json` 分批推进。

### 阶段 3：治理 `any`

用 `noImplicitAny` 找出隐式 `any`，用 lint 限制显式 `any`：

```json
{ "rules": { "@typescript-eslint/no-explicit-any": "warn" } }
```

## `any` 治理的实用顺序

### 第一步：`any` → `unknown`

这是收益最大的一步。`unknown` 强制调用方收窄（见 [类型收窄](./narrowing.md)），能立刻暴露大量隐藏的假设：

```typescript
// 改前
function parse(json: string): any { return JSON.parse(json) }

// 改后
function parse(json: string): unknown { return JSON.parse(json) }
```

改完后调用方全部报错——这正是价值所在，每个报错点都是一个需要处理的假设。

### 第二步：边界处做运行时校验

`JSON.parse`、`process.env`、HTTP 响应这些地方，类型系统**无法**保证正确性：

```typescript
function readEnv(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" ? v : undefined;
}
```

用类型谓词封装校验逻辑：

```typescript
function isApiResponse(v: unknown): v is ApiResponse {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as ApiResponse).id === "number" &&
    typeof (v as ApiResponse).name === "string"
  );
}
```

> [!TIP] 复杂边界考虑用 schema 库
> 手写谓词在字段多时很啰嗦。`zod` / `valibot` 这类库能在运行时校验的同时推导出类型，是更彻底的方案。代价是多一个依赖。

### 第三步：内部代码补类型

真正的业务逻辑，类型可以从数据结构推导出来，不需要运行时校验。

## 常见坑

### 坑一：`strictNullChecks` 打开后错误爆炸

老代码里 `obj.foo.bar` 假设 `foo` 一定存在。打开后全部报错。

**对策**：先只在新文件上开，或按目录分批。TypeScript 没有官方的"文件级 strict 开关"，但可以：

- 用目录级 `tsconfig.json` 分片
- 或者接受一段时间的错误，用 `// @ts-expect-error` 临时标记（记得记账）

### 坑二：`this` 类型推断差异

```javascript
// JS 里没问题
const obj = {
  count: 0,
  inc() { this.count++; }
};
```

`noImplicitThis` 会要求注解 `this`。对象方法简写通常能自动推断，但把函数拆出去就会报错：

```typescript
const inc = obj.inc;
inc();   // this 丢失
```

**对策**：用箭头函数绑定，或显式声明 `this` 参数（见 [函数类型](./function-types.md)）。

### 坑三：CommonJS 与 ESM 混用

```typescript
// 老代码
const fs = require("fs");
module.exports = { run };

// TS
import fs from "node:fs";
export function run(): string { }
```

`esModuleInterop: true` + `module: "nodenext"` 能处理大部分情况，但 `require`/`import` 混用的文件需要逐个改。

### 坑四：类字段初始化语义变化

`useDefineForClassFields` 默认为 `true`（`target` 为 `es2022`+）时，子类字段会覆盖父类访问器：

```typescript
class Base {
  set value(v: number) { void v; }
}
class Derived extends Base {
  value = 1;
}
// error TS2610: 'value' is defined as an accessor in class 'Base', but is
// overridden here in 'Derived' as an instance property.
```

**对策**：改用访问器，或设 `useDefineForClassFields: false`（如果依赖老行为）。

### 坑五：不要用 `process` 当函数名

这是个实际踩到的坑：

```typescript
// ✗ 遮蔽了 Node 的全局 process
function process(data: Data) { }

// 之后所有 process.env 都会报错：
// error TS2339: Property 'env' does not exist on type '(data: Data) => number[]'.
```

**对策**：换个名字（`extractIds`、`handleData`）。

## 迁移检查清单

| 检查项 | 说明 |
|---|---|
| `allowJs` + `checkJs: false` | 阶段 0 的基础 |
| 逐文件改后缀 | 不要批量 |
| 目录级 `tsconfig.json` | 分批收紧严格度 |
| `any` → `unknown` | 收益最大的一步 |
| 边界处运行时校验 | `JSON.parse`、`env`、HTTP |
| 类型谓词封装校验 | 或用 zod |
| `esModuleInterop` | CJS/ESM 混用 |
| `useDefineForClassFields` | 类字段语义 |
| 检查全局变量遮蔽 | 如 `process`、`name`、`length` |

## 相关

- [工程化](./engineering.md) —— tsconfig 完整配置
- [类型收窄](./narrowing.md) —— `unknown` 的处理
- [.d.ts 与第三方类型](./dts-and-third-party-types.md) —— 给无类型库补声明
- [运行 TypeScript](./running-ts.md) —— 迁移后的执行方式
