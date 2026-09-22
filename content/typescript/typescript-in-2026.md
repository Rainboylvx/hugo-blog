---
title: "TypeScript 版本现状"
date: 2026-09-21
weight: 71
draft: false
toc: true
tags: ["typescript"]
---

写 TypeScript 之前需要知道的第一件事：**当前的 `latest` 是 7.0，它是一次编译器重写**。很多教程上的做法已经失效。

## 版本格局

```bash
$ npm view typescript dist-tags
{
  "latest": "7.0.2",
  "beta": "6.0.0-beta",
  "rc": "7.0.1-rc",
  "next": "7.1.0-dev.20260920.1"
}
```

| 版本 | 实现 | 定位 |
|---|---|---|
| 5.x | JavaScript | 长期稳定，生态最广 |
| 6.0 | JavaScript | 最后一版 JS 实现，引入新默认值 |
| **7.0** | **Go 原生重写** | 当前 `latest`，性能大幅提升 |
| 7.1 | Go | 计划补上稳定 API |

官方说法是 7.0 与 6.0 行为一致——**同样的类型检查、同样的错误、同样的 JS 输出**，主要收益是速度（宣称约 10 倍，来自多核并行）。语言层面没有新特性。

## 关键变化：没有稳定的 programmatic API

这是 7.0 最需要知道的一点。实测验证：

```bash
$ node -e "console.log(Object.keys(require('typescript')))"
[ 'version', 'versionMajorMinor' ]
```

主入口**只导出两个键**——版本号。没有 `ts.sys`，没有 `ts.createProgram`。

对比 TS 5.x/6.x，那时 `require('typescript')` 会导出完整的编译器 API（几百个符号）。

> [!IMPORTANT] 这对工具链的影响
> 所有依赖编译器 API 的工具都会失效：
>
> | 工具 | 状态 | 原因 |
> |---|---|---|
> | `ts-node@10` | ✗ 失效 | 读取 `ts.sys`，现在是 `undefined` |
> | `ts-jest@29` | ✗ 不兼容 | peer 依赖锁在 `typescript <7` |
> | 自定义 AST transformer | ✗ 失败 | 编译中途报错，信息可能误导 |
> | typescript-eslint | 需适配 | 需要 compiler API |
>
> Microsoft 发布了 `@typescript/typescript6`（当前 6.0.2）兼容包，让需要旧 API 的工具能与 7.0 并存。

### 新的 API 在哪里

7.0 提供了 `unstable/` 前缀的实验性 API：

```bash
$ node -e "console.log(Object.keys(require('typescript/unstable/sync')).length)"
44
```

可用但**不稳定**（`unstable` 前缀就是警告），且只覆盖部分能力。稳定的 API 计划在 7.1。

### `ts-node` 失效的实测复现

```bash
$ npx ts-node@10 run.ts
TypeError: Cannot read properties of undefined (reading 'fileExists')
    at readConfig (.../ts-node/dist/configuration.js:91:33)
```

`ts.sys` 是 `undefined`，所以读 `ts.sys.fileExists` 直接崩。**这不是配置问题，无法绕过**。

## 现在该怎么跑 TypeScript

| 方式 | 类型检查 | 覆盖语法 | 依赖 |
|---|---|---|---|
| `tsc --noEmit` + `node x.ts` | ✓（分开） | 仅可擦除 | 无 |
| `tsx` | ✗ | 全部 | 1 个 |
| `ts-node` | ✓ | 全部 | — ✗ 已失效 |
| `tsc` 编译后 `node` | ✓ | 全部 | 无 |

详见 [运行 TypeScript](./running-ts.md)。

## 另一处变化：lib 文件移到平台包

TS 7 把 lib 文件从主包移到了**平台特定的包**里：

```bash
# 主包里已经没有 lib.es5.d.ts
$ ls node_modules/typescript/lib/
getExePath.d.ts  getExePath.js  tsc.js  version.cjs  version.d.cts

# lib 文件在平台包里（macOS ARM 示例）
$ ls node_modules/@typescript/typescript-darwin-arm64/lib/ | head
lib.dom.d.ts
lib.es5.d.ts
lib.esnext.d.ts
...
```

**实际影响**：`lib: ["esnext"]` 不再自动包含 `console`，会报：

```text
error TS2584: Cannot find name 'console'. Do you need to change your target
library? Try changing the 'lib' compiler option to include 'dom'.
```

解决办法是显式声明 types：

```json
{ "compilerOptions": { "types": ["node"] } }
```

这是迁移中一个容易困惑的报错——错误消息建议你改 `lib`，但正确做法是加 `types`。

## `tsc --init` 的默认值变严格了

TS 7 生成的配置比 5.x 时代严格得多：

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  }
}
```

`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`verbatimModuleSyntax` 在 5.x 时代需要手动开。

> [!TIP] 别套用旧教程的配置模板
> 老模板会显式关掉一些现在默认开启的检查，反而降低保护。建议用 `tsc --init` 生成后再按需调整。

## 关于"faithful port"的说明

官方把 7.0 描述为"faithful port"（忠实移植）——同一份代码在 6.0 和 7.0 上应该编译出相同结果。但这有几个前提：

- 代码在 6.0 上**干净通过**（没有 deprecation 警告）
- 没有用 `ignoreDeprecations` 绕过警告
- 不依赖编译器 API

**6.0 里被标记为 deprecated 的东西，7.0 里已经移除**。所以升级检查清单是：

```bash
# 1. 在 6.0 上编译，看有没有 deprecation 警告
npx typescript@6 tsc --noEmit

# 2. 有警告的先修掉

# 3. 再升到 7.0
```

## 实测中遇到的其他差异

以下都是在写这批笔记时实际遇到的：

| 现象 | 说明 |
|---|---|
| `tsc file.ts` 报 `TS5112` | 有 tsconfig 时传文件需要 `--ignoreConfig` |
| 显式 `rootDir` 变必需 | 否则报 `TS5011`，要求明确 `rootDir` |
| `console` 找不到 | lib 移到平台包，需 `types: ["node"]` |
| 递归类型上限约 1000 层 | 比旧版本报告的 ~50 层高得多 |
| 数字枚举拒绝任意数字字面量 | `const s: Status = 999` 报错 |

> [!WARNING] 第三方博客的可信度
> 关于 7.0 的中文/英文博客里，"破坏性变更"清单差异很大。有些说 `ts-jest`/`ts-node`/Vue/Svelte 全坏，有些说 `strict` 变成默认。**可靠的做法是自己跑一遍**——本仓库的所有结论都来自实际执行。

## 现在该选哪个版本

| 场景 | 建议 |
|---|---|
| 新项目 | TS 7（快，语言行为与 6 一致） |
| 老项目 + 用 `ts-node` | 先迁执行方式（改 `tsx`），再升 7 |
| 老项目 + 用 `ts-jest` | 等 `ts-jest` 适配，或改 `swc/jest`、vitest |
| 依赖 typescript-eslint | 确认适配情况再升 |
| 需要 compiler API 写工具 | 留在 6.x，或用 `@typescript/typescript6` |

> [!TIP] 迁移的最小改动路径
> 1. **类型检查**：`tsc --noEmit`（7.0 不受影响）
> 2. **开发执行**：`ts-node` → `tsx` 或 Node 原生
> 3. **测试**：`ts-jest` → `swc/jest` 或 vitest
> 4. **构建**：不受影响（esbuild/swc/rollup 都不用 compiler API）
>
> 真正需要改的只有第 2、3 步。

## 相关

- [运行 TypeScript](./running-ts.md) —— 各执行方式的详细对比
- [工程化](./engineering.md) —— tsconfig 与构建配置
- [装饰器（legacy）](./decorators-legacy.md) —— `emitDecoratorMetadata` 的生态影响
