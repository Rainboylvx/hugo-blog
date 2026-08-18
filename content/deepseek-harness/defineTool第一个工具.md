---
title: "DeepSeek Harness defineTool 第一个工具"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

工具是 Agent 用来干活的函数，模型看到工具定义后决定调用。在 dsh 里通过 `ctx.tools.register` 注册到工具注册表。

## defineTool 字段

| 字段 | 作用 | 说明 |
| --- | --- | --- |
| **name** | 工具名 | 模型用它发起调用 |
| **description** | 工具说明 | 告诉模型这个工具做什么 |
| **parameters** | 入参 schema | 类型化定义，defineTool 据此推导并校验 args |
| **output.schema** | 返回值 schema | 声明 execute 返回的规范值类型 |
| **output.render** | 结果格式化 | 把规范值转成面向模型的内容 |
| **execute** | 工具实现 | 真正执行逻辑，返回规范值 |

## greet 工具完整代码

```typescript
// 文件路径：scratch-plugin/src/my-plugin.ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
// 需要 tools 服务：注册工具的前提
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    // 工具名：模型会以这个名字发起调用
    name: 'greet',
    // 工具说明：告诉模型什么时候用
    description: 'Greet someone by name.',
    // 入参 schema：defineTool 会推导并校验 args
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    // 输出定义
    output: {
      // 规范值类型：execute 的返回值
      schema: { type: 'string' },
      // render：把规范值转成面向模型的内容
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    // 工具实现：真正执行逻辑
    async execute(args) {
      // 返回规范值，这里是一个字符串
      return `Hello, ${args.name}!`
    },
  }))
}
```

## 运行并调用

```bash
pnpm dsh web --patch ./scratch-plugin/cordis.yml
```

打开 http://127.0.0.1:3080，输入：

```
Use the greet tool to greet RUNOOB.
```

模型可以调用 greet，并收到 `Hello, RUNOOB!` 这一工具结果。

## 关键点：schema 自动流入提示词

工具的 name、description、parameters、output 会自动组装进模型提示词。模型"知道"有这样一个工具，就会在合适的时候调用。不需要手写函数签名给模型，**schema 就是模型看到的接口**。

> **规范值**（canonical value）是 execute 返回、output.schema 声明的值。它与"面向模型的内容"解耦：同一个规范值可以通过不同 render 变成不同格式。