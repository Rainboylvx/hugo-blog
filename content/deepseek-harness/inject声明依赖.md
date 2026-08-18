---
title: "DeepSeek Harness inject 声明依赖"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

## 什么是服务

服务是一个插件向其他插件公开的命名能力。在 Harness 中，`tools`、`llm`、`agents` 都是服务，挂载在 ctx 上。

| 内置服务 | 是什么 | 典型用法 |
| --- | --- | --- |
| **ctx.tools** | 工具运行时（ToolRuntime） | 注册 / 调用工具 |
| **ctx.llm** | 大语言模型服务（LLM） | 注册适配器、发起模型请求 |
| **ctx.agents** | 智能体服务（Agent） | 管理子智能体 |

## 用 inject 声明依赖

```typescript
// 文件路径：scratch-plugin/src/my-tool-plugin.ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-tool-plugin'
// 声明依赖：需要 tools 服务
export const inject = ['tools']

export function apply(ctx: Context) {
  // 走到这里时，ctx.tools 一定已就绪
  ctx.tools.register(/*... */)
}
```

**依赖未就绪的行为**：如果某个服务还没准备好，插件不会执行，其 Fiber 停在 **PENDING** 状态等待服务出现。服务一直不来就一直等，不会出错，也不会执行 apply。

## 可选依赖（用 ctx.get() 查询）

```typescript
import type { Context } from '@deepseek-ai/cordis'

export function apply(ctx: Context) {
  // metrics 服务可能在也可能不在
  const metrics = ctx.get('metrics')
  // 可选链：不存在就跳过，不报错
  metrics?.record('plugin_loaded', 1)
}
```

## 服务消失时会发生什么

运行期间必需服务消失（比如提供方被卸载）：
1. 依赖它的插件会自动 dispose（释放资源）。
2. 当服务重新出现时，插件自动重新加载。

这防止插件调用一个已不存在的服务。此规则与自动清理配合——卸载会触发 disposer。

## 要点

- `inject` 声明的是**必需依赖**（服务缺席时插件不加载）；可选服务不写 inject，在使用处用 `ctx.get()` 查询。
- 服务基类、类型声明等完整机制见 [Service 基类与类型声明](./Service基类与类型声明.md)。