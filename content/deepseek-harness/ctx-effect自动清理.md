---
title: "DeepSeek Harness ctx.effect() 自动清理"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

核心思想：**注册交给 ctx，清理也交给 ctx**。

通过 ctx 注册的任何东西（事件监听、工具、定时器）在插件卸载时都会被自动清理，无需手动 `removeListener` 或 `clearInterval`。因为所有通过 ctx 的注册都被记在插件的 **Fiber 作用域** 里，卸载时框架按注册顺序的**逆序**撤销它们。

## 会被自动追踪的操作

| 注册操作 | 卸载时的行为 |
| --- | --- |
| `ctx.on(event, handler)` | 事件监听自动移除 |
| `ctx.tools.register(tool)` | 工具注册自动撤销 |
| `ctx.llm.registerAdapter(names, adapter)` | LLM 适配器注册自动撤销 |
| `ctx.effect(() => cleanup)` | 执行返回的 disposer 清理函数 |

## ctx.effect() 心跳定时器示例

```typescript
// 文件路径：scratch-plugin/src/heartbeat.ts
import type { Context } from '@deepseek-ai/cordis'

export function apply(ctx: Context) {
  ctx.effect(() => {
    // 创建定时器：每 5 秒打印一次 heartbeat
    const timer = setInterval(() => {
      console.log('heartbeat')
    }, 5000)

    // 返回的清理函数在插件卸载时执行
    return () => clearInterval(timer)
  })
}
```

> **disposer**（清理函数）是 ctx.effect 回调的返回值，描述"如何销毁这次创建的资源"，插件卸载时框架会调用它。

## 执行顺序细节

- 插件卸载时，处置器按**注册顺序的逆序**开始调用（先注册后清理）。
- 多个异步处置器会**并发执行**，不保证逐个完成。
- 存在**顺序依赖**的清理步骤，必须放进**同一个** `ctx.effect()` 返回的处置器中，由该处置器负责串行等待。

## 要点

- 如果卸载时什么都不用做，disposer 可以不写；但一旦创建了定时器、连接这类资源，就一定要返回对应的清理函数。
- ctx.effect 也用来管理没有现成"注册表"可追踪的自定义资源，比如网络连接。