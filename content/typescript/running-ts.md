---
title: "运行 TypeScript"
date: 2026-09-21
weight: 72
draft: false
toc: true
tags: ["typescript"]
---

TypeScript 7 之后，"怎么把 `.ts` 跑起来"的答案变了。`ts-node` 已经失效，Node 原生支持成为新选项。这一篇讲清楚现状和取舍。

## 先看结论

| 方式 | 类型检查 | 覆盖语法 | 依赖 | 推荐 |
|---|---|---|---|---|
| `tsc --noEmit` + `node x.ts` | ✓（分开） | 仅可擦除 | 无 | ★★★ |
| `tsx x.ts` | ✗ | 全部 | 1 个 | ★★★ |
| `ts-node` | ✓ | 全部 | — | ✗ 已失效 |
| `tsc` 编译后 `node dist/x.js` | ✓ | 全部 | 无 | ★★（构建场景） |

## 推荐组合：类型检查与执行分离

```bash
# 终端 1：持续类型检查
npx tsc --noEmit --watch

# 终端 2：直接执行（Node 原生，零依赖）
node --watch src/index.ts
```

`tsc` 负责类型，Node 负责执行。零额外依赖、启动快、职责清晰。

## Node 原生 type stripping

Node.js 从 v22.18 / v23.6 起默认启用 type stripping：**直接删除类型注解然后执行**。

关键限制：**它只删除，不转换**。所以只支持"可擦除语法"。

{{< include "src/running-ts/erasable-vs-not.ts" "ts" >}}

```text
hi rainboy rainboy 1 2 a
```

### 实测：不可擦除语法会失败

| 语法 | Node 原生的结果 |
|---|---|
| `enum E { A }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `const enum E { A = 1 }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `namespace N { export const a = 1 }` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| `constructor(public x: number)` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |
| 装饰器 | `SyntaxError: Invalid or unexpected token` |
| `import x = require("...")` | `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` |

完整错误示例：

```text
$ node file-with-enum.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
    code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX'

$ node file-with-param-property.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
    code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX'
```

### 可擦除语法清单

Node 原生**能跑**的：

- 类型注解、`interface`、`type`
- 泛型参数与泛型调用
- 类型断言 `as`、`<T>x`
- `implements`、`declare`
- `import type` / `export type`
- 可选参数 `?`、`readonly`、可见性修饰符（**不带**参数属性）
- `satisfies`

原理见 [类型擦除](./type-erasure.md)。

> [!WARNING] 参数属性是最容易踩的坑
> `constructor(public x: number)` 看起来只是"加个修饰符"，但它会生成 `this.x = x`，所以不可擦除。改写方式：
>
> ```typescript
> // ✗ Node 原生跑不了
> class C { constructor(public x: number) {} }
>
> // ✓ 可擦除
> class C {
>   x: number;
>   constructor(x: number) { this.x = x; }
> }
> ```
>
> 代价是代码变长。所以"用 Node 原生"和"用参数属性"只能选一个。

## `tsx`：覆盖全部语法

需要执行 `enum`、`namespace`、参数属性、装饰器时，用 `tsx`：

```bash
$ npx tsx src/index.ts
```

同一份含 `enum` + 参数属性 + `namespace` 的文件：

```bash
$ npx tsx t.ts
0 5 1                    # ✓ 正常执行

$ node t.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]   # ✗ 拒绝
```

`tsx` 基于 esbuild，速度很快。但注意两点：

1. **它不做类型检查**。类型错误不会拦你，要另跑 `tsc --noEmit`。
2. **它不实现 `emitDecoratorMetadata`**。nestjs 这类依赖元数据的框架不能用 `tsx` 直接跑（见 [装饰器（legacy）](./decorators-legacy.md)）。

关于装饰器，实测结论：

| 装饰器类型 | `tsx` 支持 |
|---|---|
| 标准装饰器（TC39 stage-3） | ✓ 可以跑 |
| legacy 装饰器（`experimentalDecorators`） | ✓ 可以跑 |
| legacy + `emitDecoratorMetadata` | ✗ 元数据丢失 |

也就是说 `tsx` 能执行装饰器本身，只是拿不到类型元数据。

## `ts-node` 为什么失效

`ts-node@10` 读取 `ts.sys` 来访问文件系统 API，而 TypeScript 7 **不再暴露这个对象**。实测：

```bash
$ npx ts-node@10 run.ts
TypeError: Cannot read properties of undefined (reading 'fileExists')
    at readConfig (.../ts-node/dist/configuration.js:91:33)
```

这不是配置问题，无法绕过。原因是 TS 7 是 Go 原生重写版，**没有稳定的 programmatic API**（新的 API 计划在 7.1）。

同样受影响的还有：

- **`ts-jest@29`**：peer 依赖锁在 `typescript <7`
- **自定义 AST transformer 插件**：会在编译中途失败，错误信息可能很误导

Microsoft 提供了 `@typescript/typescript6` 兼容包，让需要旧 API 的工具能和 7.0 并存。

> [!TIP] 迁移建议
> 如果项目在用 `ts-node`：
>
> 1. 开发执行改用 `tsx` 或 Node 原生
> 2. 测试改用 `swc/jest` 或 vitest
> 3. 类型检查始终用 `tsc --noEmit`（这个不受影响）
>
> 如果必须留在 TS 5.x/6.x，`ts-node` 仍然可用——它只是不能配 TS 7。

## 调试配置

VSCode 的 `.vscode/launch.json`，用 Node 原生：

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

用 `tsx`：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug TS (tsx)",
  "runtimeArgs": ["--import", "tsx"],
  "program": "${file}",
  "console": "integratedTerminal"
}
```

### 编译后调试（sourceMap）

需要断点映射回源码时：

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "inlineSources": true
  }
}
```

`launch.json` 指向编译产物，Node 会通过 `.js.map` 映射回 `.ts`。

## 生产构建

```bash
# 方案一：tsc 编译
npx tsc
node dist/index.js

# 方案二：打包工具转译 + tsc 把关
npx tsc --noEmit && npx esbuild src/index.ts --bundle --outfile=dist/index.js
```

> [!TIP] 为什么方案二常见
> esbuild/swc 的速度来自"单文件转译"——它们**不做类型检查**，只是删掉类型语法。所以构建快，但类型错误不会拦你。标准做法是让它们负责产出，`tsc --noEmit` 负责把关。

## 相关

- [类型擦除](./type-erasure.md) —— 可擦除与不可擦除的根本原因
- [TypeScript 版本现状](./typescript-in-2026.md) —— TS 7 的变化与影响
- [工程化](./engineering.md) —— tsconfig 与构建配置
- [装饰器（legacy）](./decorators-legacy.md) —— `emitDecoratorMetadata` 的限制
