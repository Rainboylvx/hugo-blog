---
title: "工程化"
date: 2026-09-21
weight: 70
draft: false
toc: true
tags: ["typescript"]
---

前面六组讲的是 TypeScript 这门语言。这一组讲的是**怎么把它用在一个真实项目里**：`tsconfig.json` 怎么配、代码怎么跑起来、声明文件怎么写、从 JS 迁移怎么做。

这一组的特殊性在于：它的内容**高度依赖当前工具链状态**。TypeScript 7 是一次编译器重写，改变了整个运行与构建生态的格局，很多教程上的做法已经失效。

## 先搞清楚当前版本格局

这是 2026 年写 TypeScript 必须知道的第一件事。

```bash
$ npm view typescript version
7.0.2
```

TypeScript 7 是编译器的 **Go 原生重写版**，2026-07-08 起成为 npm 的 `latest`。它带来的变化不是语言层面的，而是**工具链层面**的：

| 版本 | 性质 | 状态 |
|---|---|---|
| 5.x | JS 实现，稳定，生态最广 | 大量生产项目在用 |
| 6.0 | JS 实现，最后一版，引入新默认值 | 过渡版本 |
| 7.0 | **Go 原生重写**，性能大幅提升 | 当前 `latest` |

官方说法是 7.0 与 6.0 行为一致——同样的类型检查、同样的错误、同样的 JS 输出，主要收益是速度（宣称约 10 倍）。但有一个**结构性变化**：

> [!IMPORTANT] TS 7.0 没有稳定的 programmatic API
> TypeScript 7.0 不提供稳定的编译器 API（新的 API 计划在 7.1）。这直接打断了依赖旧 API 的工具：
>
> - **`ts-node@10` 直接失效**：它读取 `ts.sys`，而 7.0 不再暴露这个对象
> - **`ts-jest@29` 不兼容**：peer 依赖锁在 `typescript <7`
> - 自定义 AST transformer 插件会在编译中途失败
>
> Microsoft 提供了 `@typescript/typescript6` 兼容包，让需要旧 API 的工具能和 7.0 并存。

### 实测：`ts-node` 确实坏了

```bash
$ npx ts-node@10 run.ts
TypeError: Cannot read properties of undefined (reading 'fileExists')
    at readConfig (.../ts-node/dist/configuration.js:91:33)
```

`ts.sys` 是 `undefined`，所以读 `ts.sys.fileExists` 直接崩。这不是配置问题，无法绕过。

### 现在该用什么跑 TS

| 方式 | 类型检查 | 覆盖语法 | 依赖 | 推荐度 |
|---|---|---|---|---|
| `tsc --noEmit` + `node x.ts` | ✓（分开） | 仅可擦除 | 无 | ★★★ |
| `tsx` | ✗ | 全部 | 1 个 | ★★★ |
| `ts-node` | ✓ | 全部 | — | ✗ 已失效 |
| `tsc` 编译后 `node` | ✓ | 全部 | 无 | ★★（构建场景） |

详细对比见 [运行 TypeScript](./running-ts.md)。

## `tsconfig.json` 详解

### 从哪里来

```bash
npx tsc --init
```

TS 7 生成的默认配置（实测）：

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "types": [],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  }
}
```

注意：**TS 7 的默认值比 5.x 严格得多**。`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`verbatimModuleSyntax` 这些在 5.x 时代需要手动开的选项，现在默认就开着。用旧教程的配置模板反而会失去这些保护。

### 文件范围

三个字段决定哪些文件参与编译：

| 字段 | 作用 | 是否受 `exclude` 影响 |
|---|---|---|
| `include` | 包含的目录/文件，支持 glob | 是 |
| `exclude` | 排除 `include` 里的文件 | — |
| `files` | 精确列出文件 | **否** |

```json
{
  "include": ["content/typescript/src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

`files` 里的文件一定会被编译，即使它匹配了 `exclude`。

### `strict` 家族

`strict: true` 是总闸，包含这些子选项：

| 选项 | 作用 |
|---|---|
| `noImplicitAny` | 禁止隐式 `any`（函数参数最常触发） |
| `strictNullChecks` | `null`/`undefined` 不自动属于所有类型 |
| `strictFunctionTypes` | 函数参数逆变检查 |
| `strictBindCallApply` | `bind`/`call`/`apply` 参数检查 |
| `strictPropertyInitialization` | 类字段必须在构造函数里初始化 |
| `noImplicitThis` | 禁止隐式 `any` 的 `this` |
| `alwaysStrict` | 输出 `"use strict"` |

**新项目一律开 `strict`**，没有例外。

### 不属于 `strict` 但强烈建议开启

这些选项默认不开（TS 7 的 `tsc --init` 会开部分），但收益很大。实测对比：

```typescript
const unused = 1;                  // TS6133（需要 noUnusedLocals）
function f(x) { return x; }        // TS7006（strict 已覆盖）
const s: string = arr[0];          // TS2322（需要 noUncheckedIndexedAccess）
switch (n) { case 1: console.log(); case 2: return; }  // TS7029（需要 noFallthroughCasesInSwitch）
```

| 选项 | 抓什么 | 实测错误 |
|---|---|---|
| `noUnusedLocals` | 未使用的局部变量 | `TS6133: 'unused' is declared but its value is never read.` |
| `noUnusedParameters` | 未使用的参数 | 同上 |
| `noImplicitReturns` | 部分分支没返回值 | `TS2366: Function lacks ending return statement...` |
| `noFallthroughCasesInSwitch` | `switch` 穿透 | `TS7029: Fallthrough case in switch.` |
| `noUncheckedIndexedAccess` | 索引访问可能越界 | `TS2322: Type 'string \| undefined' is not assignable to type 'string'.` |
| `noImplicitOverride` | 漏写 `override` | `TS4114: This member must have an 'override' modifier...` |
| `exactOptionalPropertyTypes` | `?` 属性不接受显式 `undefined` | `TS2375: Type '{ debug: undefined; }' is not assignable to type 'Config' with 'exactOptionalPropertyTypes: true'.` |

> [!TIP] `noUncheckedIndexedAccess` 的取舍
> 它把 `arr[0]` 的类型从 `string` 改成 `string | undefined`，这是**事实正确**的（越界访问真的返回 `undefined`）。代价是每次索引访问都要处理 `undefined`，代码会啰嗦不少。建议新项目开启，老项目按模块逐步开。

### 输出相关

| 选项 | 作用 |
|---|---|
| `outDir` | 输出目录 |
| `rootDir` | 源码根目录，决定 `outDir` 里的目录结构 |
| `declaration` | 生成 `.d.ts` |
| `declarationMap` | 生成 `.d.ts.map`，支持跳转到源码 |
| `sourceMap` | 生成 `.js.map`，用于调试 |
| `noEmit` | 只类型检查，不输出文件 |
| `incremental` | 增量编译缓存 |

实测一个最小库项目的配置与产物：

```bash
$ npx tsc -p .
$ ls dist/
index.d.ts  index.js  index.js.map
$ cat dist/index.d.ts
export declare function add(a: number, b: number): number;
```

> [!WARNING] TS 7 要求显式 `rootDir`
> 如果只指定 `outDir` 不指定 `rootDir`，当源码目录结构和预期不符时会报：
>
> ```text
> error TS5011: The common source directory of 'tsconfig.json' is '...'. The 'rootDir'
> setting must be explicitly set to this or another path to adjust your output's file layout.
> ```
>
> 加上 `rootDir` 就能解决。

### 模块相关

| 选项 | 作用 | 建议 |
|---|---|---|
| `module` | 输出模块格式 | `nodenext`（Node 项目）或 `esnext` |
| `moduleResolution` | 解析策略 | 跟 `module` 一致 |
| `verbatimModuleSyntax` | 强制 `import type` 区分类型导入 | 开 |
| `isolatedModules` | 保证每个文件可独立转译 | 开 |
| `esModuleInterop` | 兼容 CJS 默认导出 | 开 |
| `allowImportingTsExtensions` | 允许 `import "./x.ts"` | 按需 |

`verbatimModuleSyntax` 的实际效果（实测）：

```typescript
import { SomeType } from "./other";
// error TS1484: 'SomeType' is a type and must be imported using a type-only
// import when 'verbatimModuleSyntax' is enabled.

import type { SomeType } from "./other";   // 正确写法
```

这个选项很重要，因为 esbuild/swc 这类**单文件转译**工具无法知道 `SomeType` 是类型还是值。区分清楚能让这些工具正确处理。

## 编译与运行

### 开发时：类型检查与执行分离

这是 TS 7 之后最推荐的模式：

```bash
# 一个终端持续类型检查
npx tsc --noEmit --watch

# 另一个终端直接跑（Node 原生，零依赖）
node --watch src/index.ts
```

类型检查由 `tsc` 负责，执行由 Node 负责。好处是零额外依赖、启动快、职责清晰。

### 需要执行不可擦除语法时

Node 原生只支持**可擦除语法**（见 [类型擦除](./type-erasure.md)）。实测这些会失败：

| 语法 | 结果 |
|---|---|
| `enum E { A }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `const enum E { A = 1 }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `namespace N { export const a = 1 }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `constructor(public x: number)` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| 装饰器 | `SyntaxError: Invalid or unexpected token` |

{{< include "src/engineering/non-erasable-list.ts" "ts" >}}

```text
见文件注释里的不可擦除语法列表
```

而这些都是可擦除的，Node 原生能跑：

{{< include "src/engineering/erasable.ts" "ts" >}}

```text
hi rainboy rainboy 1 3
```

需要执行 `enum`、`namespace`、装饰器时，用 `tsx`：

```bash
$ npx tsx src/index.ts
```

### 生产构建

用 `tsc` 编译出 JS，再用 Node 运行：

```bash
npx tsc          # 按 tsconfig 输出到 outDir
node dist/index.js
```

或者用打包工具（esbuild / swc / rollup）转译，`tsc --noEmit` 单独做类型检查：

```bash
npx tsc --noEmit && npx esbuild src/index.ts --bundle --outfile=dist/index.js
```

> [!TIP] 为什么要分开
> esbuild/swc 的速度来自"单文件转译"——它们**不做类型检查**，只是把类型语法删掉。所以构建快，但类型错误不会拦你。标准做法是让它们负责产出，`tsc --noEmit` 负责把关。

### 调试配置

VSCode 的 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug TS (Node native)",
      "program": "${file}",
      "runtimeArgs": ["--experimental-strip-types"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

如果需要 `sourceMap` 断点映射（编译后调试源码），配置：

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true
  }
}
```

然后 `launch.json` 里指向编译产物，Node 会通过 `.js.map` 映射回 `.ts`。

## `.d.ts` 与第三方类型

### `.d.ts` 是什么

`.d.ts` 文件**只包含类型声明，没有实现**。它描述"某个东西的类型是什么"，但不产生任何运行时代码。

{{< include "src/engineering/ambient.d.ts" "ts" >}}

{{< include "src/engineering/dts-demo.ts" "ts" >}}

> [!IMPORTANT] `declare` 不提供运行时实现
> `dts-demo.ts` 能通过 `tsc --noEmit`，但**不能运行**：
>
> ```text
> Error: Cannot find module 'virtual-lib'
> ```
>
> 因为 `declare module "virtual-lib"` 只是告诉类型检查器"有这么个模块"，运行时它并不存在。这是 [类型擦除](./type-erasure.md) 的直接体现。
>
> `declare const __APP_VERSION__` 同理——它假设运行时由构建工具（如 Vite 的 `define`）注入。

### 五种常见声明

```typescript
// 1. 全局常量
declare const __APP_VERSION__: string;

// 2. 全局函数
declare function parseAmount(text: string): number;

// 3. 模块声明
declare module "virtual-lib" {
  export function helper(): string;
}

// 4. 通配模块
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

// 5. 扩展全局接口（必须写在模块文件里）
export {};
declare global {
  interface Array<T> { last(): T | undefined }
}
```

第 5 条的规则容易踩：`declare global` 必须在**模块文件**（有 `import`/`export`）里，否则报 `TS2664: Invalid module name in augmentation`。所以它通常单独放一个文件，配 `export {}` 显式声明为模块。

### `@types/*` 包

第三方库的类型有三种情况：

| 情况 | 做法 |
|---|---|
| 库自带类型 | 直接可用（看 `package.json` 的 `types` 字段） |
| 有 `@types/xxx` 包 | `npm i -D @types/xxx` |
| 都没有 | 自己写 `declare module` |

查有没有类型包：

```bash
npm view @types/jquery version
```

装类型包：

```bash
npm install --save-dev @types/jquery
```

自己写声明（给没有类型的库）：

```typescript
// types/my-lib.d.ts
declare module "my-lib" {
  export function run(config: { debug?: boolean }): void;
}
```

然后确保 `tsconfig.json` 的 `include` 覆盖了 `types/` 目录。

> [!TIP] 临时绕过：`declare var`
> 迁移老代码时，最省事的临时方案是在文件顶部声明：
>
> ```typescript
> declare var $: any;   // 让 $ 能用，但没有任何类型检查
> ```
>
> 这能让你先跑起来，但记得后面替换成 `@types/jquery`。

### `skipLibCheck` 的取舍

```json
{ "skipLibCheck": true }
```

它会跳过所有 `.d.ts` 文件的类型检查。好处是：

- 编译明显变快
- 避免第三方类型定义之间的冲突（不同库依赖不同版本的 `@types/node` 时很常见）

代价是**你自己的 `.d.ts` 里的错误也不会被发现**。所以写自己的声明文件时，临时关掉它验证一遍。

## 从 JS 迁移

### 分阶段策略

**阶段 0：先让项目跑起来**

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

`allowJs` 让 `.js` 也参与编译（不检查），`checkJs: false` 表示不检查 JS 文件的类型。这一步只是让 `tsc --noEmit` 能跑通。

**阶段 1：逐文件改后缀**

把 `.js` 改成 `.ts`，一次一个文件。改一个就修一个的类型错误。不要一次全改。

**阶段 2：收紧配置**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

按模块逐步开，不要全局一次性开 `strict`——老项目上会瞬间出现上千个错误。

**阶段 3：清理 `any`**

用 `noImplicitAny` 找出隐式 `any`，显式标注。用 lint 规则限制显式 `any`：

```json
// eslint
{ "rules": { "@typescript-eslint/no-explicit-any": "warn" } }
```

### `any` 治理的实用顺序

1. **先加 `unknown`**：把 `any` 改成 `unknown`，强制调用方收窄（见 [类型收窄](./narrowing.md)）。这一步就能暴露大量假设。
2. **边界处做运行时校验**：`JSON.parse`、`process.env`、HTTP 响应这些地方，`any` 改成 `unknown` 加校验函数。
3. **内部代码补类型**：真正的业务逻辑，类型可以从数据结构推导出来。

### 常见坑

**坑一：`strictNullChecks` 打开后错误爆炸**

老代码里 `obj.foo.bar` 假设 `foo` 一定存在。打开 `strictNullChecks` 后全部报错。

对策：先只在新文件上开，用 `// @ts-strict-ignore`（或分目录配置）逐步推进。

**坑二：`this` 类型推断差异**

```javascript
// JS 里这样写没问题
const obj = {
  count: 0,
  inc() { this.count++; }
};
```

TS 的 `noImplicitThis` 会要求注解 `this`。用对象方法简写时通常没问题，但把函数拆出去就会报错。

**坑三：CommonJS 与 ESM 混用**

```typescript
// 老代码
const fs = require("fs");
module.exports = { run };

// TS 里
import fs from "fs";           // 需要 esModuleInterop
export { run };
```

`esModuleInterop: true` + `module: "nodenext"` 能处理大部分情况，但 `require` 和 `import` 混用的文件需要逐个改。

**坑四：`class` 字段初始化语义变化**

```typescript
class C {
  field = 1;
}
```

`useDefineForClassFields` 默认为 `true`（`target` 为 `es2022`+）时，字段用 `Object.defineProperty` 语义定义，而不是赋值。在继承场景下，这会导致**子类字段覆盖父类访问器**：

```typescript
class Base {
  set value(v: number) { void v; }
}
class Derived extends Base {
  value = 1;    // 用 defineProperty 定义，不走父类的 setter
}
```

实测这个写法直接报错：

```text
error TS2610: 'value' is defined as an accessor in class 'Base', but is overridden
here in 'Derived' as an instance property.
```

如果依赖老行为（走 setter），显式设 `useDefineForClassFields: false`。

## 一个可用的最小配置

综合以上，本仓库的配置是一个实际可用的例子：

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "lib": ["esnext"],
    "strict": true,
    "types": ["node"],
    "noEmit": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["content/typescript/src/**/*.ts"]
}
```

配套脚本：

```json
{
  "scripts": {
    "check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^7.0.2",
    "tsx": "^4.23.15",
    "@types/node": "^26.6.2"
  }
}
```

> [!WARNING] TS 7 的 `lib` 与平台包
> TS 7 把 lib 文件移到了平台特定的包里（如 `@typescript/typescript-darwin-arm64`）。实测影响：`lib: ["esnext"]` 不再自动包含 `console`，会报 `TS2584: Cannot find name 'console'`。
>
> 解决办法是显式声明 types：
>
> ```json
> { "compilerOptions": { "types": ["node"] } }
> ```
>
> 这是 TS 7 迁移中一个容易困惑的报错。

## 小结

| 主题 | 核心结论 |
|---|---|
| 版本格局 | TS 7 是 Go 重写版，无稳定 API，`ts-node`/`ts-jest` 已失效 |
| 默认配置 | TS 7 的 `tsc --init` 比 5.x 严格得多，别套用旧模板 |
| 严格选项 | `strict` 必开；`noUncheckedIndexedAccess` 等强烈建议开 |
| 运行方式 | `tsc --noEmit` + Node 原生（推荐）；不可擦除语法用 `tsx` |
| 构建 | 打包工具转译 + `tsc --noEmit` 把关 |
| `.d.ts` | 只有类型没有实现，`declare` 不产生运行时 |
| 迁移 | 分阶段：`allowJs` → 逐文件改 → 收紧配置 → 治理 `any` |

下一篇：[TypeScript 版本现状](./typescript-in-2026.md)。
