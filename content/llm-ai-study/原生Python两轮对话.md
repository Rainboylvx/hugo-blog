---
title: "用原生 Python 完成两轮 DeepSeek 对话"
date: 2026-09-19T00:30:00+08:00
draft: true
toc: true
tags: ["AI", "DeepSeek", "Python", "LLM"]
---

这一篇的目标很具体：**不装任何 SDK**，只用 Python 标准库向 DeepSeek 的 `/chat/completions` 发请求，完成一次「提问 → 回答 → 追问 → 回答」的两轮对话，并搞清楚多轮到底是怎么拼出来的。

先把结论写在前面：

> [!IMPORTANT] 核心结论
> `/chat/completions` 是**无状态**接口，服务端不保存你的上下文。
> 多轮对话的本质是：**客户端自己维护一个 `messages` 数组，每轮把「历史全部 + 新提问」一起发过去**。
> 所以「第二轮请求体比第一轮长」不是 bug，而是多轮对话的全部机制。

## 接口的形状

| 项 | 值 |
| --- | --- |
| 方法 / 路径 | `POST /chat/completions` |
| Base URL（OpenAI 格式） | `https://api.deepseek.com` |
| 完整地址 | `https://api.deepseek.com/chat/completions` |
| 认证 | `Authorization: Bearer ${DEEPSEEK_API_KEY}` |
| Content-Type | `application/json` |
| 模型 | `deepseek-flash`、`deepseek-v4-pro` |

请求体最小可用形态只有两个必填字段：

```json
{
  "model": "deepseek-flash",
  "messages": [{ "role": "user", "content": "你好" }]
}
```

`messages` 里每条消息是一个对象，`role` 取 `system` / `user` / `assistant` / `tool`，`content` 是文本（或内容块数组，用于图片）。

剩下的字段都是可选的，本篇会用到三个：

| 字段 | 作用 | 本篇取值 |
| --- | --- | --- |
| `thinking` | 思考模式开关，`{"type": "enabled"\|"disabled"}` | `enabled` |
| `reasoning_effort` | 思考强度，`none/low/high/max` | `high` |
| `stream` | 是否用 SSE 流式返回 | `false` |

> [!WARNING] `thinking` 放哪取决于调用方式
> 直接发 HTTP 时，`thinking` 是**请求体的顶层字段**。
> 如果用的是 OpenAI SDK，则要放进 `extra_body`，因为 SDK 不认识这个非标准字段（官方文档里那句 `extra_body={"thinking": {...}}` 就是这个原因）。
> 另外 `reasoning_effort` 只在思考模式下有意义；思考模式下 `temperature`、`frequency_penalty`、`presence_penalty` 都不生效，设置了也不报错，只是被忽略。

## 第一轮：一次请求

用 `urllib` 发请求，核心就是把 dict 序列化成 JSON 再 POST 出去。注意错误处理必须读 `exc.read()`：DeepSeek 的真实错误原因在响应体里，只看状态码会一头雾水。

```python
import json, os, sys, urllib.error, urllib.request

API_URL = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-flash"


def chat(messages, *, model=MODEL, thinking=True, reasoning_effort="high",
         max_tokens=None, timeout=120):
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        sys.exit("缺少环境变量 DEEPSEEK_API_KEY")

    body = {
        "model": model,
        "messages": messages,
        # raw HTTP 下 thinking 是顶层字段，不需要 SDK 的 extra_body
        "thinking": {"type": "enabled" if thinking else "disabled"},
        "stream": False,
    }
    if thinking:
        body["reasoning_effort"] = reasoning_effort  # 只有思考模式才接受
    if max_tokens is not None:
        body["max_tokens"] = max_tokens

    request = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # 4xx/5xx 的正文里才有真正的错误信息，不要只看状态码
        detail = exc.read().decode("utf-8", "replace")
        raise SystemExit(f"HTTP {exc.code} {exc.reason}\n{detail}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"网络错误：{exc.reason}") from exc
```

第一轮只要一条 user 消息：

```python
messages = [{"role": "user", "content": "世界上最高的山是哪一座？"}]
resp = chat(messages)
```

响应结构里我们关心两块：`choices[0].message` 和 `usage`。下面是一份真实字段结构的示例（字段名与层级来自官方文档，**具体数值仅为示意**）：

```json
{
  "id": "…",
  "object": "chat.completion",
  "created": 1758268800,
  "model": "deepseek-flash",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "世界上最高的山是珠穆朗玛峰……",
        "reasoning_content": "用户问的是世界最高峰，这属于地理常识……"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 260,
    "total_tokens": 272,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "prompt_cache_hit_tokens": 0,
      "prompt_cache_miss_tokens": 12
    },
    "completion_tokens_details": { "reasoning_tokens": 128 }
  }
}
```

几个容易忽略的点：

- `reasoning_content` 是**思考模式下特有**的字段，与 `content` 同级，装的是最终答案之前的思维链。非思考模式下没有这个字段。
- `usage.prompt_tokens_details.cached_tokens` 是命中上下文缓存的 token 数。命中缓存的输入单价便宜得多，而多轮对话的**前缀天然不变**，所以第二轮开始就很容易吃到缓存。这是多轮对话顺手省钱的来源。
- `finish_reason` 常见取值：`stop`（正常结束）、`length`（撞到 `max_tokens`）、`content_filter`、`tool_calls`、`insufficient_system_resource`（推理资源不足被打断）。

## 第二轮：把回答塞回历史

这里是新手最容易翻车的地方：**不能只发新的那一句**，必须把第一轮的 assistant 回答也带上，否则模型根本不知道你在追问什么。

`choices[0].message` 本身就是一条合法的 assistant 消息（它带着 `role: assistant`），但里面还有 `reasoning_content`、`tool_calls` 等字段。这里显式只取 `role` 和 `content` 构造干净的历史项，行为更可控：

```python
def take_assistant_message(response):
    """从响应里取出 assistant 消息。

    返回两项：可直接 append 回 messages 的历史项，以及原始 message
    （后者用于打印 reasoning_content 和 content）。
    """
    message = response["choices"][0]["message"]
    history_entry = {
        "role": "assistant",
        "content": message.get("content"),
    }
    return history_entry, message
```

> [!TIP] 为什么不用 `messages.append(response.choices[0].message)`
> 官方样例常用这种简写，它会把 `reasoning_content` 等字段一并塞进历史（虽然不带 `tools` 时会被忽略）。
> 本文明式构造 `{"role", "content"}` 两项，历史更干净，以后要加字段也清楚该加在哪里。

于是两轮的主流程只有 8 行关键代码：

```python
# 第一轮：只带一条 user 消息
messages = [{"role": "user", "content": "世界上最高的山是哪一座？"}]

resp = chat(messages)
assistant_entry, message = take_assistant_message(resp)
messages.append(assistant_entry)   # 关键：把模型回答写回历史

# 第二轮：第一轮的历史 + 新的追问，一起发过去
messages.append({"role": "user", "content": "那第二高的是哪一座？"})

resp = chat(messages)
assistant_entry, message = take_assistant_message(resp)
messages.append(assistant_entry)
```

两轮结束后，`messages` 的长度是 4：

```text
[0] user      世界上最高的山是哪一座？
[1] assistant 世界上最高的山是珠穆朗玛峰……
[2] user      那第二高的是哪一座？
[3] assistant 世界第二高峰是乔戈里峰（K2）……
```

对应到网络层，两次请求的 body 分别是：

```text
Round 1 → messages 长度 1
  [{ user: 世界上最高的山是哪一座？ }]

Round 2 → messages 长度 3     ← 多出的两条就是第一轮的往返
  [{ user:     世界上最高的山是哪一座？ },
   { assistant: 世界上最高的山是珠穆朗玛峰…… },
   { user:     那第二高的是哪一座？ }]
```

> [!ABSTRACT] 为什么大模型"记得"上下文
> 模型本身没有记忆。「记得」的错觉来自每一轮都把整段历史重新喂了一遍。
> 代价是 token 随轮数线性增长（第二轮输入 ≈ 第一轮输入 + 第一轮输出 + 新提问），
> 好处是这段前缀不变，能稳定命中上下文缓存，实际计费比表面上便宜。

## 关于 reasoning_content 要不要回传

这是个值得单独记住的规则，搞错了会直接报错：

| 请求是否携带 `tools` | 历史轮次的 `reasoning_content` |
| --- | --- |
| 不带 `tools`（本篇情况） | **不用回传**；即使传了也会被忽略，不进入上下文 |
| 带 `tools`（工具调用） | **必须完整回传**，否则 API 返回 `400` |

所以本篇的 `take_assistant_message` 丢掉 `reasoning_content` 是完全正确的做法——不浪费 token，也不改变模型行为。一旦以后要写工具调用，就必须改成回传完整 message。

另外注意：思考模式下的 token 消耗包含思维链。`usage.completion_tokens_details.reasoning_tokens` 就是思维链部分，它同样按输出 token 计费。所以 `reasoning_effort` 从 `high` 换成 `max` 不只是变慢，是真的更贵。

## 完整可运行文件

代码放在 [deepseek_dialog.py](./src/deepseek_dialog.py)，除了上面讲的内容，还加了：

- 每轮打印 `reasoning_content`（思维链）与 `content`（最终回答）
- 打印 `usage`，包括缓存命中 token
- 结尾回显最终 `messages` 结构，方便肉眼确认拼接结果

{{< include "src/deepseek_dialog.py" "python" >}}

运行方式：

```bash
export DEEPSEEK_API_KEY="sk-..."
python3 deepseek_dialog.py
```

只需要标准库，Python 3.8+ 都能跑，不需要 `pip install openai`。

## 验证方式

本机没有配置 API key，无法请求真实端点，因此用一个本地 mock server 验证了请求形状与两轮拼接逻辑，断言如下：

- 两次请求路径为 `/chat/completions`，`Authorization` 为 `Bearer <key>`
- `thinking == {"type": "enabled"}`，且 `reasoning_effort == "high"`
- 第一轮 `messages` 长度为 1；第二轮为 3，且 `messages[1]` 恰为第一轮的 assistant 回答
- 响应被正确解析，`usage` 与 `reasoning_content` 均能取到

mock 校验通过后，接入真实 key 时只需确认 API Key 有效即可，代码路径不变。

## 小结

- `/chat/completions` 无状态，多轮 = 客户端维护 `messages` 并整体重发
- 必填只有 `model` 和 `messages`，其余都是可选参数
- 原生 HTTP 下 `thinking` 是顶层字段，用 SDK 才需要 `extra_body`
- 不带 `tools` 时不必回传 `reasoning_content`；带 `tools` 时必须回传
- 输入前缀稳定 → 缓存命中 → 多轮比想象中便宜；但思维链 token 按输出计费
