---
title: "DeepSeek Harness 插件生命周期 Fiber"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

## Fiber 是什么

每个被加载的插件都拥有一个 Fiber 作用域，是插件实例的执行单元，承载插件从声明、加载、运行到卸载的全部状态。

> **Fiber**：一个插件实例在 Cordis 运行时中的状态容器。它记录该插件的生命周期状态，也是卸载时清理注册的依据。

## Fiber 状态机

主路径：`PENDING → LOADING → ACTIVE → UNLOADING → DISPOSED`；在 LOADING 阶段如果 apply 抛出异常，则进入 FAILED。

| 状态 | 含义 | 发生时机 |
| --- | --- | --- |
| **PENDING** | 已声明，但所需依赖未就绪 | 插件被加入上下文，inject 的服务还没准备好 |
| **LOADING** | 依赖就绪，正在执行 apply | 所有必需服务就绪，框架调用 apply(ctx) |
| **ACTIVE** | 插件运行中 | apply 正常返回，注册生效 |
| **FAILED** | apply 抛出异常 | apply 执行过程中抛错，加载失败 |
| **UNLOADING** | 插件正在卸载并释放资源 | 依赖消失、被 dispose、或 HMR 触发卸载 |
| **DISPOSED** | 已完全卸载 | 所有处置器执行完毕 |

## 依赖驱动的加载

```typescript
// 文件路径：scratch-plugin/src/my-plugin.ts
// 声明本插件需要 tools 与 llm 两个服务，二者就绪前 apply 不会执行
export const inject = ['tools', 'llm']

export function apply(ctx: Context) {
  // 走到这里时，ctx.tools 和 ctx.llm 一定已经就绪
}
```

这是 Cordis 用服务依赖来表达加载顺序的方式，而不是手动编排启动序列。

## 自动清理机制

通过 ctx 做的任何注册，卸载时自动撤销：

| 注册操作 | 卸载时的清理 |
| --- | --- |
| `ctx.on(event, handler)` | 事件监听自动移除 |
| `ctx.tools.register(tool)` | 工具注册自动移除 |
| `ctx.llm.registerAdapter(names, adapter)` | LLM 适配器注册自动移除 |
| `ctx.effect(() => cleanup)` | 返回的处置器在卸载时执行 |

## 处置器的调用顺序

- 插件卸载时，处置器按**注册顺序的逆序**开始调用。
- 多个异步处置器**并发执行**，不保证逐个完成。
- 存在顺序依赖的清理步骤，必须放进**同一个** `ctx.effect()` 返回的处置器里，由该处置器负责串行等待。

## 动手示例：观察状态迁移

```typescript
// 文件路径：scratch-plugin/src/lifecycle-log.ts
export function apply(ctx: Context) {
  // apply 被调用：插件从 LOADING 进入 ACTIVE
  console.log('runoob plugin loading')

  // 注册一个效果：返回的清理函数在卸载时执行
  ctx.effect(() => {
    console.log('runoob effect registered')
    // 返回 disposer：插件卸载时调用
    return () => console.log('runoob effect cleaned up')
  })
}
```

加载时输出：

```
runoob plugin loading
runoob effect registered
```

卸载时输出：

```
runoob effect cleaned up
```

可以看到 apply 先执行，随后执行到 effect 注册，返回的处置器在卸载阶段被调用。

## 自测

1. Fiber 有哪六个状态？apply 抛异常时进入哪个状态？→ 六个；FAILED
2. 为什么 ctx.on 注册的监听器不需要手动 removeListener？→ 自动清理
3. 两个存在顺序依赖的清理步骤，应该怎么写才安全？→ 放进同一个 ctx.effect()