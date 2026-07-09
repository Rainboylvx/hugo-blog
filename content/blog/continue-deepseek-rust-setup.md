---
title: "用 Continue + DeepSeek 搭建 Rust AI 编码环境"
date: 2026-07-09
draft: false
toc: true
tags: ["工具", "Rust", "AI"]
---

写 Rust 的时候，`rust-analyzer` 能帮你做语法检查、类型提示、跳转定义。但遇到「这一段怎么写」的问题，还是要自己翻文档。有没有像 Copilot 那样按 `Tab` 就能 AI 补全的方案？

**Continue** 就是答案——一个开源的 AI 编码助手，支持 VS Code 和 JetBrains。配合 DeepSeek V4 Flash，既能智能补全又能对话问答，完全免费（只需要付 API 费用，比 Copilot 便宜得多）。

## 安装 Continue

VS Code 搜索安装 **Continue** 插件：

![继续安装Continue](./continue-install.png)

安装后在侧边栏会出现 Continue 图标。

## 获取 DeepSeek API Key

1. 打开 [platform.deepseek.com](https://platform.deepseek.com)
2. 注册并充值（最低几块钱就行）
3. 在 API Keys 页面创建一个 Key

`deepseek-v4-flash` 定价：输入 0.14 元/百万token，输出 0.28 元/百万token，日常写代码一个月几块钱。

## 配置 Continue

Continue 的配置文件是 `~/.continue/config.yaml`，内容如下：

```yaml
name: Rust Dev Config
version: 1.0.0
schema: v1
models:
  - name: DeepSeek V4 Flash (Chat)
    provider: deepseek
    model: deepseek-v4-flash
    apiKey: sk-your-api-key-here
    contextLength: 1048576
    roles:
      - chat

  - name: DeepSeek V4 Flash (Autocomplete)
    provider: deepseek
    model: deepseek-v4-flash
    apiKey: sk-your-api-key-here
    contextLength: 1048576
    roles:
      - autocomplete
    requestOptions:
      extraBodyProperties:
        thinking:
          type: disabled
```

几个关键配置说明：

| 字段 | 说明 |
|------|------|
| `model: deepseek-v4-flash` | DeepSeek 最新 V4 快模型，性价比最高 |
| `contextLength: 1048576` | 1M token 上下文，等于 2^20 |
| `roles: [chat]` | 分配给对话功能 |
| `roles: [autocomplete]` | 分配给 Tab 补全功能 |
| `extraBodyProperties.thinking.type: disabled` | **关掉补全的思考模式**，速度更快 |

> [!TIP] 为什么补全要关掉思考？
> 思考模式会让模型先「想」一会再输出，对对话质量有帮助，但对代码补全（你敲 `let x =` 它接 `String::new()`）不需要推理。关掉后延迟明显降低。

## 使用方式

### 对话

按 `Ctrl+I`（或 `Cmd+I`）打开 Continue 对话窗口，问 Rust 相关问题：

- 「这段代码怎么改成迭代器写法？」
- 「解释一下所有权规则」
- 「帮我把这个 match 简化」

它可以读取当前打开的文件作为上下文，回答更有针对性。

### Tab 补全

无需快捷键，敲代码时灰色补全会自动出现，按 `Tab` 接受：

```rust
fn main() {
    let mut v: Vec<i32> = Vec::        // Tab → new();
    v.                                 // Tab → push(1);
```

补全对常见模式非常灵敏——`let x = String::` 自动补 `new()`，`match` 自动补分支结构，`vec!` 自动补宏调用。

### 选中代码编辑

选中一段代码，按 `Ctrl+I`，输入「改成 for 循环」，Continue 会直接替换选中区域。

## Continue vs Copilot

| | Continue | Copilot |
|---|---|---|
| 价格 | 免费（自付 API 费） | $10/月 |
| 模型 | 任意（DeepSeek、Claude、Ollama 等） | 只能用 Copilot 模型 |
| 对话 | 支持 | 支持 |
| 离线 | 支持（接 Ollama） | 不支持 |
| 开源 | 是 | 否 |

## 总结

- **Continue** 是免费开源的 VS Code AI 插件
- 接 **DeepSeek V4 Flash**：chat 保留思考，autocomplete 关掉思考
- 配置只需一个 `config.yaml`，填上 API Key 就能用
- 比 Copilot 便宜、更灵活，还支持本地模型
