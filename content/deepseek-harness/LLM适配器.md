---
title: "DeepSeek Harness LLM 适配器"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

LLM 适配器是继承 `LlmAdapter` 并实现 `stream()` 方法的类。它把 Harness 的**提供方无关请求**转换成具体提供方的 API 调用，再把响应转换回 Harness 的分片（`StreamChunk`）。

层级结构：顶层 `agent-loop`（消费提供方无关的流式生成服务）→ 中间 `ctx.llm` 注册表（维护 `LlmAdapter` 的抽象契约）→ 底层各适配器（对接不同 API 格式）。

## 最小实现

```typescript
// 文件路径：src/my-llm-adapter.ts
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { LlmAdapter, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'

// 适配器：继承抽象类，实现 stream()
class MyAdapter extends LlmAdapter {
  private apiKey: string

  constructor(apiKey: string) {
    super()
    this.apiKey = apiKey
  }

  // stream() 返回异步生成器，逐片产出 StreamChunk
  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    // 1. Convert options.messages to the provider format.
    // 2. Call the streaming API.
    // 3. Convert the response into StreamChunk values.
  }
}

// 插件配置：apiKey 与 providers 都必填
export interface Config {
  apiKey: string
  providers: string[]
}

// 同名的 Schemastery schema，加载时校验配置
export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().required(),
  providers: Schema.array(Schema.string()).required(),
})

export const name = 'my-llm-adapter'
// 声明依赖 llm 服务，保证 ctx.llm 已就绪
export const inject = ['llm']

export function apply(ctx: Context, config: Config) {
  const adapter = new MyAdapter(config.apiKey)
  // 把提供方路由列表绑定到这个适配器
  ctx.llm.registerAdapter(config.providers, adapter)
}
```

- `apiKey` 来自插件配置，避免把密钥硬编码进代码。
- `providers` 数组声明这个适配器负责哪些提供方路由。
- `inject: ['llm']` 保证 `ctx.llm` 服务就绪后才执行 apply。
- `stream()` 返回异步生成器，用 `yield` 逐片往外吐数据。

## GenerateOptions：适配器收到什么

| 字段 | 说明 |
| --- | --- |
| **provider** | 选择已注册的适配器 |
| **model** | 适配器拥有的模型 id，无需在启动时注册 |
| **messages** | 对话历史 |
| **system prompt** | 系统提示词 |
| **tools** | 工具 schema |
| **reasoning** | 适配器拥有的推理强度 ID（可选） |
| **signal** | 中止信号，取消与资源释放用它完全停稳 |

适配器必须把支持的字段映射到具体 API。**如果某个字段无法支持，应抛出带稳定 code 的 `LlmError`，不得静默丢弃**；否则模型会拿到残缺的结果。

## 注册适配器

```typescript
ctx.llm.registerAdapter(['my-provider'], adapter)
```

- 第一个参数是适配器处理的**提供方路由列表**。
- `GenerateOptions.provider` 选择已注册的适配器；`GenerateOptions.model` 传入由适配器拥有、无需启动时注册的模型 id。
- 可覆写 `listModels()` 向选择器公布模型选项。
- 可覆写 `resolveModel(provider, model, signal?)`，一次查询返回确切的提供方、模型身份，以及可选的 context 和 reasoning 元数据。
- 异步查询必须响应可选的 `signal`，让取消和资源释放过程完全停稳。
- 服务会校验聚合结果：显式指定但不支持的推理强度，会在调用 `stream()` 之前被拒绝。
- 省略 reasoning，表示该模型没有可选的推理强度能力。

## 在 cordis.yml 中使用

```yaml
# 文件路径：cordis.yml
# 加载适配器插件，apiKey 从环境变量读取
- id: my-llm
  name: './src/my-llm-adapter.ts'
  config:
    apiKey: !!js process.env.MY_API_KEY
    providers:
      - my-provider

# 配置 agent-loop 使用新适配器的 provider 与 model
- id: agent-loop
  name: '@deepseek-ai/dsh-agent-loop'
  config:
    agents:
      - id: main
        provider: my-provider
        model: my-model-v1
```

`config.apiKey` 从环境变量 `MY_API_KEY` 读取，不落盘。`agent-loop` 的 `agents.main` 配置 provider 与 model，生成请求时命中新适配器。

## 实战参考

仓库有两个现成完整实现：`llm-deepseek`（适配 DeepSeek API，走 OpenAI 兼容格式）与 `llm-pi-ai`（适配 Pi AI，不同 API 格式）。

> 先读 llm-deepseek 再读 llm-pi-ai，最容易看出「契约不变、实现各异」的 seam 思想。

## 要点

- LLM 适配器 = 继承 `LlmAdapter` + 实现 `stream()` + `registerAdapter` 路由注册 + cordis.yml 配置。
- `stream()` 返回 `AsyncIterable<StreamChunk>`。
- agent-loop 通过 `agents.main` 的 `provider` 与 `model` 配置选择新适配器。