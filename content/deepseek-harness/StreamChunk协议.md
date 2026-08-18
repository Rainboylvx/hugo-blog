---
title: "DeepSeek Harness StreamChunk 协议与错误处理"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

`StreamChunk` 是 Harness 与适配器之间的**流式协议**，一种有严格顺序的分片协议。一个内容块先用 `block-start` 开始，中间用 `delta` 增量传输，最后用 `block-end` 结束。文本与工具调用是两类不同的内容块，各自走一遍 start / delta / end。所有分片收尾时，先发 `usage` 报告 token 用量，再发 `finish` 声明结束原因。

## 完整分片序列

```typescript
// 示例代码，演示一次完整的 chunk 序列
import { CallId, type StreamChunk } from '@deepseek-ai/dsh-llm'

async function* exampleChunks(): AsyncIterable<StreamChunk> {
  // 1. 开启一个文本块，index 为 0
  yield { type: 'block-start', index: 0, blockType: 'text' }

  // 2. 文本增量，可拆成多个分片
  yield { type: 'text-delta', index: 0, text: 'runoob' }
  yield { type: 'text-delta', index: 0, text: ' 教程' }

  // 3. 用完整块结束，index 与 block-start 一致
  yield {
    type: 'block-end',
    index: 0,
    block: { type: 'text', text: 'runoob 教程' },
  }

  // 4. 工具调用块，index 为 1
  yield { type: 'block-start', index: 1, blockType: 'tool-call' }
  yield {
    type: 'tool-call-delta',
    index: 1,
    id: CallId('call-123'),
    name: 'bash',
    argumentsDelta: '{"command":"echo runoob"}',
  }
  yield {
    type: 'block-end',
    index: 1,
    block: {
      type: 'tool-call',
      id: CallId('call-123'),
      name: 'bash',
      arguments: '{"command":"echo runoob"}',
    },
  }

  // 5. 报告 token 用量，必须在 finish 之前
  yield { type: 'usage', usage: { inputTokens: 100, outputTokens: 50 } }

  // 6. 最后一个分片，声明结束原因
  yield { type: 'finish', reason: { kind: 'stop' } }
  // 也可以是 { kind: 'tool-calls' } 请求执行工具
}
```

- `CallId` 是协议自带的工厂函数，用来生成工具调用 id。
- `argumentsDelta` 可以一个分片完整生成，也可以分多个分片增量生成。

## 关键规则（五条硬性规则）

| 规则 | 说明 |
| --- | --- |
| **block-start 与 block-end 成对** | 每个 block-start 都必须有与之对应的 block-end |
| **index 从 0 开始递增** | 用于标识内容块的顺序 |
| **argumentsDelta 是原始 JSON 增量** | 可以一个分片完整生成，也可以分多个分片生成 |
| **finish 必须是最后一个分片** | 之后不能再有任何分片 |
| **usage 必须在 finish 之前** | 先报告 token 用量，再声明结束 |

> `text-delta` 与 `tool-call-delta` 都要带上所属块的 index，内容块之间不要交叉。

## 错误处理：用 LlmError 表达失败

适配器应通过带稳定 code 的 `LlmError` 抛出传输和协议故障。`agent-loop` 会保留该错误及其 code 用于诊断和策略处理。**不要依赖普通 Error 被自动转换**。

```typescript
// 一个带错误处理的 HttpAdapter 骨架
import {
  attributionHeaders,
  LlmAdapter,
  LlmError,
  type GenerateOptions,
  type StreamChunk,
} from '@deepseek-ai/dsh-llm'

class HttpAdapter extends LlmAdapter {
  constructor(private readonly endpoint: string) {
    super()
  }

  async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    // 发起 HTTP 请求，合并归属头，传递中止信号
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...attributionHeaders(),
      },
      body: JSON.stringify({ model: options.model, messages: options.messages }),
      // 调用方要求取消时，fetch 会立刻中止
      ...options.signal ? { signal: options.signal } : {},
    })
    if (!response.ok) {
      // 用带稳定 code 的 LlmError 表达传输失败
      throw new LlmError(`Provider API error: ${response.status}`, 'PROVIDER_HTTP_ERROR')
    }
    // 真实适配器在这里解析响应体，产出完整的分片序列
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}
```

- `attributionHeaders()` 把归属信息合并进请求头。
- `options.signal` 存在时作为 fetch 的 signal 传入，取消请求时立即停止。
- `response.ok` 为 false 时抛出 `LlmError`，code 是 `PROVIDER_HTTP_ERROR`。

> [!WARNING] LlmError 的第二个参数是稳定 code。上层按 code 做策略判断，因此 **code 一旦发布就不要改动**。

## 不能静默丢弃的字段

`GenerateOptions` 里若有适配器无法支持的字段，同样要抛 `LlmError`，不要静默丢弃。保留适配器给出的权威可选列表（包括上游能力 API 返回的 `off`），不要把可选推理强度提升为核心枚举，否则适配器会失去上游的灵活性。

## 要点

- 文本块最少需要三个分片：`block-start` + `text-delta` + `block-end`（`text-delta` 可多个）。
- 顺序：`usage` 必须在 `finish` 之前，`finish` 必须是最后一个分片。
- 请求失败时用带稳定 code 的 `LlmError`（而非普通 Error），这样上层能精确匹配错误类型做策略判断。