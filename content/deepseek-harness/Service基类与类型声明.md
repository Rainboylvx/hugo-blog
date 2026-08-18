---
title: "DeepSeek Harness Service 基类与类型声明"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

## 什么是服务

服务是挂载在 `ctx` 上的命名能力。任何插件都可以提供服务供其他插件使用。它占据一个稳定的 `ctx.<key>`（如 `ctx.tools`、`ctx.llm`、`ctx.sessions`），其他插件通过 key 查找服务，而不是导入具体实现。

## 使用服务：inject 声明

使用已有服务时在插件里声明 `inject`。框架保证：`apply` 执行时，inject 声明的服务已经全部就绪。如果服务还没准备好，插件会等待，不会执行 `apply`。

```typescript
// 文件路径：scratch-plugin/src/use-tools.ts
export const inject = ['tools']

export function apply(ctx: Context) {
  // ctx.tools 一定存在且已就绪
  ctx.tools.register(/*... */)
}
```

## 提供服务：Service 基类

用 `Service` 基类派生一个子类，在构造函数里调用 `super(ctx, '服务名')` 注册命名服务。

```typescript
// 文件路径：scratch-plugin/src/metrics-service.ts
import { Service, type Context } from '@deepseek-ai/cordis'

// 服务也允许依赖其它服务，用静态 inject 声明
export default class MetricsService extends Service {
  static inject = ['llm'] // 本服务需要 llm 服务先就绪

  constructor(ctx: Context) {
    // 第二个参数 'metrics' 就是服务名，挂载到 ctx.metrics
    super(ctx, 'metrics')
  }

  // 对外公开的服务方法
  record(event: string, value: number) {
    // 记录一条指标
  }
}
```

消费方通过 `ctx.metrics` 访问：

```typescript
// 文件路径：scratch-plugin/src/use-metrics.ts
export const inject = ['metrics']

export function apply(ctx: Context) {
  ctx.metrics.record('runoob_tool_call', 1)
}
```

## 类型声明：declare module 合并

使用 TypeScript 声明合并，让 `ctx.metrics` 拥有正确的类型，写代码时有自动补全，编译期能发现拼错服务名的错误。

```typescript
// 文件路径：scratch-plugin/src/metrics-service.ts
import { Service, type Context } from '@deepseek-ai/cordis'

// 声明合并：告诉 TypeScript，Context 上有一个 metrics 字段
declare module '@deepseek-ai/cordis' {
  interface Context {
    metrics: MetricsService
  }
}

export default class MetricsService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'metrics')
  }

  record(event: string, value: number) {
    /* 实现省略 */
  }
}
```

> `declare module` 声明合并是 TypeScript 给已有模块补类型的标准做法。这里把 `ctx.metrics` 的类型与实现写在同一个文件里，保证两者不漂移。

## 必需依赖与可选依赖

| 依赖类型 | 写法 | 服务缺席时的行为 | 适用场景 |
| --- | --- | --- | --- |
| **必需依赖** | `export const inject = ['tools']` | 插件不加载，停留在 PENDING | 没有该服务就无法正常工作 |
| **可选依赖** | 省略 inject，用 `ctx.get('metrics')` 查询 | 插件照常加载，`ctx.get()` 返回 undefined | 服务可有可无，缺席时也要正常工作 |

```typescript
// 文件路径：scratch-plugin/src/optional-dep.ts
export const inject = ['tools']

export function apply(ctx: Context) {
  const metrics = ctx.get('metrics')
  metrics?.record('runoob_plugin_loaded', 1)
}
```

## 服务消失时的行为

如果应用运行期间某项必需服务消失（例如其提供方被卸载），会发生两件事：
1. 依赖它的插件会自动 `dispose`（释放资源）。
2. 当服务重新出现时，插件自动重新加载。

## 要点

- Service 子类通过 `super(ctx, '名字')` 提供命名服务。
- `declare module` 声明合并补齐类型。
- `inject` 声明必需依赖、`ctx.get()` 查询可选依赖。
- 内置服务清单以仓库自动生成的各服务子系统页面为准，不要依赖手写的静态清单。