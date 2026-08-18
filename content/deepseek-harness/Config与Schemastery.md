---
title: "DeepSeek Harness Config 与 Schemastery"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

让插件接受 cordis.yml 传入的配置，做到"配置与代码分离"。

## 导出 Config 类型与同名 schema

```typescript
// 文件路径：scratch-plugin/src/my-plugin.ts
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'my-plugin'

// Config 接口：定义插件接受哪些配置项
export interface Config {
  greeting: string // 问候语
  maxRetries: number // 最大重试次数
  verbose?: boolean // 是否输出详细日志（可选）
}

// 同名的 Config schema：默认值写在这里
export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
  maxRetries: Schema.number().default(3),
  verbose: Schema.boolean().default(false),
})

// apply 的第二个参数就是校验后的配置
export function apply(ctx: Context, config: Config) {
  console.log(config.greeting)
}
```

- 接口给 TypeScript 类型，schema 给运行时校验与默认值；两者**同名**是 Cordis 的约定。
- **不要导出普通对象作为 Config**——它不满足 Cordis 要求的 Standard Schema 接口。

## 在 cordis.yml 里传入配置

```yaml
# 文件路径：scratch-plugin/cordis.yml
- insert:
  - id: hello
    # 插件路径必须是绝对路径
    name: '/absolute/path/to/deepseek-harness/scratch-plugin/src/my-plugin.ts'
    config:
      greeting: 'Hi there, runoob!'
      maxRetries: 5
```

插件加载时，Cordis 通过导出的 schema 校验配置，并填充未提供字段的默认值。上面没写 verbose，会取 schema 默认值 `false`。

## Schema 校验（更严格约束）

```typescript
// 文件路径：scratch-plugin/src/validated-plugin.ts
import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'validated-plugin'

export interface Config {
  apiKey: string // 必填
  timeout: number // 超时毫秒数
  mode: 'fast' | 'accurate' // 只能取这两个值之一
}

export const Config = Schema.object({
  apiKey: Schema.string().required(),
  timeout: Schema.number().default(30000),
  mode: Schema.union(['fast', 'accurate']).default('fast'),
})

export function apply(ctx: Context, config: Config) {
  // config 已经过校验，类型安全
}
```

Schema 在插件加载时执行校验；如果配置不合法，插件会**加载失败**并给出明确错误信息。

## 设计原则：无硬编码可调参数

```typescript
// 错误：把超时时间硬编码
const TIMEOUT = 30000

// 正确：定义为配置字段，默认值仍由 schema 提供
export interface Config {
  timeoutMs: number // 默认 30000
}
```

**检验标准**：能否在 cordis.yml 中改变这个值，而不需要修改代码？如果能就是合格的可调参数；如果不能，就要提成配置字段。

> **硬编码**是把本应可调的值写死在代码里。它让"改配置"变成"改代码加重新部署"，是生产事故的常见来源。

## 配合 HMR：配置热替换

- 配置变更会触发插件热替换（HMR）。
- 修改 cordis.yml 中某个插件的 config 后，框架会**卸载旧实例并加载新实例**。
- 由于注册都属于 effect 并会自动清理，替换后**不会保留旧实例的注册**。

## 要点

- 导出 Config 接口与同名 schema，默认值写进 schema，配置在加载时校验。
- 配置错误要响亮：让无效配置在插件加载时失败。
- 所有可调参数都进配置，禁止硬编码。