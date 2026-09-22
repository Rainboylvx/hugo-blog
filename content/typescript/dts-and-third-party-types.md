---
title: ".d.ts 与第三方类型"
date: 2026-09-21
weight: 73
draft: false
toc: true
tags: ["typescript"]
---

`.d.ts` 文件只包含类型声明，没有实现。它存在的意义是：**给没有类型的 JavaScript 代码提供类型**。

## 第三方库的三种情况

{{< include "src/dts-and-third-party-types/using-types.ts" "ts" >}}

```text
hello darwin ok 3 object
```

| 情况 | 处理方式 |
|---|---|
| 库自带类型 | 直接用（看 `package.json` 的 `types` 字段） |
| 有 `@types/xxx` 包 | `npm i -D @types/xxx` |
| 都没有 | 自己写 `declare module` |

### 查有没有类型包

```bash
npm view @types/jquery version
```

### 安装类型包

```bash
npm install --save-dev @types/jquery
```

装好后全局可用：

```typescript
const timer: NodeJS.Timeout = setTimeout(() => {}, 0);
const buf: Buffer = Buffer.from("hello");
const platform: NodeJS.Platform = process.platform;
```

如果类型包没装或版本不对，会报：

```text
error TS2688: Cannot find type definition file for 'node'.
```

## 自己写声明

{{< include "src/dts-and-third-party-types/ambient.d.ts" "ts" >}}

### 模块声明

```typescript
declare module "some-legacy-lib" {
  export function doSomething(input: string): number;
  export const VERSION: string;
}
```

### 通配模块

用于 `import "./style.css"` 这类资源导入：

```typescript
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.png" {
  const src: string;
  export default src;
}
```

### 全局常量

```typescript
declare const __BUILD_TIME__: string;
```

这假设运行时由构建工具注入（Vite 的 `define`、webpack 的 `DefinePlugin`）。

## 文件位置规则

| 声明 | 写在哪种文件 |
|---|---|
| `declare module "xxx"` | **全局脚本**（无 `import`/`export`） |
| `declare global` | **模块文件**（有 `import`/`export`） |
| `declare const` / `declare function` | 都可以 |

写错位置会报：

```text
error TS2664: Invalid module name in augmentation, module 'xxx' cannot be found.
```

这条消息很误导——它说"找不到模块"，但真正的问题是在模块文件里写 `declare module` 会被当成**模块扩充**（augmentation），而扩充的目标模块必须已经存在。详见 [声明合并](./declaration-merging.md)。

### 推荐目录结构

```text
types/
├── legacy-lib.d.ts       # declare module "legacy-lib"
├── assets.d.ts           # declare module "*.css"
└── global.d.ts           # declare const / 全局接口扩展
```

确保 `tsconfig.json` 覆盖它：

```json
{ "include": ["src", "types"] }
```

## 扩展全局类型

{{< include "src/dts-and-third-party-types/global.d.ts" "ts" >}}

常见的两种扩展：

```typescript
// 扩展 Node 的环境变量
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production";
    API_URL?: string;
  }
}

// 扩展 Window（需要 DOM lib）
declare global {
  interface Window {
    __APP_VERSION__: string;
  }
}
```

`declare global` 必须在模块文件里，通常配 `export {}`。

## `import type` 与 `verbatimModuleSyntax`

开启 `verbatimModuleSyntax` 后，类型导入必须显式标记：

```typescript
import { SomeType } from "./other";
// error TS1484: 'SomeType' is a type and must be imported using a type-only
// import when 'verbatimModuleSyntax' is enabled.

import type { SomeType } from "./other";   // ✓
```

这很重要，因为 esbuild/swc 这类**单文件转译**工具无法判断 `SomeType` 是类型还是值。标记清楚它们才能正确处理。

> [!WARNING] `import type` 导入的东西不能当值用
> ```typescript
> import type { doSomething } from "some-legacy-lib";
>
> doSomething("x");
> // error TS1361: 'doSomething' cannot be used as a value because it was
> // imported using 'import type'.
> ```
>
> 要用值就用普通 `import`。但那样运行时必须真的存在这个模块——`declare module` 只提供类型（见 [类型擦除](./type-erasure.md)）。

## `skipLibCheck` 的取舍

```json
{ "skipLibCheck": true }
```

**开启的好处：**

- 编译明显变快（不用检查所有 `.d.ts`）
- 避免第三方类型定义冲突（不同库依赖不同版本的 `@types/node` 时很常见）

**代价：**

- 你自己写的 `.d.ts` 里的错误也会被跳过

所以建议：**平时开着，写自己的声明文件时临时关掉验证一遍**。

## 速查

| 需求 | 写法 |
|---|---|
| 给无类型库加类型 | `declare module "xxx"` |
| 资源导入 | `declare module "*.css"` |
| 全局常量 | `declare const X: T` |
| 扩展全局接口 | `declare global`（模块文件） |
| 扩展环境变量 | `declare namespace NodeJS` |
| 只导入类型 | `import type { T }` |

## 相关

- [声明合并](./declaration-merging.md) —— 合并规则与位置要求
- [工程化](./engineering.md) —— tsconfig 配置
- [类型擦除](./type-erasure.md) —— 为什么声明不提供运行时
