---
title: "DeepSeek Harness 模型配置与 Python SDK"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

## 模型配置

### 三类提供方

| 提供方类型 | 是什么 | 凭据要求 | 适用场景 |
| --- | --- | --- | --- |
| **DeepSeek** | DeepSeek 官方端点 | DeepSeek API 密钥（只写） | 默认、最快上手 |
| **目录提供方** | 已安装目录里的提供方，如 Anthropic、OpenAI | 各家 API 密钥 | 接入已收录主流厂商 |
| **自定义提供方** | 自建端点，如公司网关、自建服务器 | Provider ID、baseURL、协议、凭据、模型 | 目录里没有的端点 |

配置入口：设置 → 模型。API 申请：https://platform.deepseek.com/api_keys

### 原生认证的目录提供方

| 提供方 | 需要的原生凭据 |
| --- | --- |
| **Bedrock** | AWS 凭据与区域 |
| **Vertex** | ADC 项目 |
| **Azure** | api-version |
| **Codex** | OAuth |

### 自定义提供方字段

| 字段 | 说明 | 是否必填 |
| --- | --- | --- |
| **Provider ID** | 小写，永久标识 | 必填 |
| **显示名称** | 界面显示的名字 | 可选 |
| **基础 URL** | 端点的 baseURL | 必填 |
| **API 协议** | 如 openai-completions | 必填 |
| **凭据** | API 密钥或环境变量引用 | 必填 |
| **模型** | 至少一个模型 | 必填 |

Provider ID 是**永久的**（请求、已保存会话、模型默认值、凭据引用都会使用它），要改名就新建再删旧的。

### 图片输入：给视觉模型声明模态

手动录入的模型默认按纯文本对待，要支持图片必须显式声明。在 `$DSH_HOME/settings.yaml` 中：

```yaml
llm-pi-ai:
  providers:
    my-gateway:
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://gateway.example/v1
      models:
        - id: legacy-chat                 # 纯文本，不写 input
        - id: vision-preview              # 视觉模型
          input: [text, image]            # 声明同时接受文本与图片
```

路由级回退值（该路由下目录未描述的模型生效）：

```yaml
llm-pi-ai:
  providers:
    vision-gateway:
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://vision.example/v1
      defaultInput: [text, image]
      models:
        - id: first-model
        - id: second-model
```

收窄目录提供方某模型的模态，写在 `modelOverrides` 下：

```yaml
llm-pi-ai:
  providers:
    anthropic:
      modelOverrides:
        claude-sonnet-4-5:
          input: [text]
```

> [!WARNING] `input` 是断言不是检查
> `input` 与 `defaultInput` 都是对端点的断言。声明了端点并不提供的图片能力不会被拦下，改由提供方拒绝请求。

### 排错表

| 错误 | 含义 | 解决 |
| --- | --- | --- |
| **MISSING_CREDENTIAL** | 缺少提供方密钥 | 存储密钥或提供被引用的环境变量 |
| **UNKNOWN_MODEL** | 请求的模型未配置 | 选择已配置模型，或添加缺失模型 |
| **获取模型返回 401** | 密钥无效或端点不支持模型发现 | 检查密钥；不支持 `GET /models` 就手动录入 |
| **图片发送前被拒绝** | 模型未声明图片模态 | 加 `input: [text, image]` |

---

## Python SDK 调用

SDK 把 dsh 变成程序里的一行调用。核心类 **`DeepSeekHarness`**，用上下文管理器管理运行时生命周期：进入 with 块延迟启动内置运行时，退出时自动释放，中间可反复调用 run。运行时不需要系统 Node.js。

### 安装

```bash
pip install deepseek-harness-sdk
```

前置：Python 3.10+、Git、Linux x64/arm64 或 macOS 14+ (arm64)。

### 基本用法

```python
from pathlib import Path
from deepseek_harness import DeepSeekHarness

config = Path("examples/jsonrpc-agent/minimal.cordis.yml").resolve()
workspace = Path("/absolute/path/to/workspace").resolve()
sessions = Path("/absolute/path/to/sessions").resolve()

with DeepSeekHarness(
    provider="deepseek-official",
    model="deepseek-v4-flash",
    max_tokens=49_152,
    cwd=str(workspace),
    session_root=str(sessions),
    cordis=str(config),
) as harness:
    result = harness.run(
        "Inspect the runoob-demo repository and fix the failing tests.",
        session_id="example-001",
    )

print(result.final_response)
```

同一 harness 可在 with 块内多次调用 run，运行时只启动一次。

### 复用 session id：保留 Bash 进程

复用同一 harness 与 session id，会保留该会话拥有的 Bash 进程（工作目录、已导出变量、shell 函数延续到下一次调用）：

```python
result = harness.run(
    "Run `cd /repo && export RUNOOB_MODE=dev` and confirm.",
    session_id="runoob-session",
)
# 第二次调用，那个导出的变量还在
result = harness.run("Print the value of RUNOOB_MODE.", session_id="runoob-session")
```

> [!TIP] 独立任务应使用新的 session id；只有需要延续同一段持久化对话时才复用原 id。

### 工具与安全边界

minimal 组合默认仅开放**持久 bash** 与 `str_replace_editor` 两个工具；Bash 超时 300 秒，编辑器输出上限 16000 字符。

> [!WARNING] danger-full-access 边界
> 只能在可丢弃的 checkout 或容器内运行。Bash 与编辑器可以修改运行时进程有权访问的任何路径，没有沙箱兜底。持久 PTY 后端需要 POSIX 终端环境，不支持 Windows agent。