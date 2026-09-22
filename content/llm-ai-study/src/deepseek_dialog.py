#!/usr/bin/env python3
"""用 Python 标准库调用 DeepSeek Chat Completions API，完成两轮对话。

不依赖 openai SDK，只用 urllib + json。
运行前先导出 API key：

    export DEEPSEEK_API_KEY="sk-..."
    python3 deepseek_dialog.py
"""

import json
import os
import sys
import urllib.error
import urllib.request

API_URL = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-flash"


def chat(messages, *, model=MODEL, thinking=True, reasoning_effort="high",
         max_tokens=None, timeout=120):
    """发一次 /chat/completions 请求，返回解析后的 JSON 字典。

    messages 是本轮为止的完整对话历史；API 无状态，历史由调用方维护。
    """
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        sys.exit("缺少环境变量 DEEPSEEK_API_KEY")

    body = {
        "model": model,
        "messages": messages,
        # 思考模式：raw HTTP 下 thinking 是顶层字段，不需要 SDK 的 extra_body
        "thinking": {"type": "enabled" if thinking else "disabled"},
        "stream": False,
    }
    if thinking:
        # 只有思考模式才接受 reasoning_effort；强度 none/low/high/max
        body["reasoning_effort"] = reasoning_effort
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


def take_assistant_message(response):
    """从响应里取出 assistant 消息，转成可直接 append 回 messages 的 dict。"""
    message = response["choices"][0]["message"]
    history_entry = {
        "role": "assistant",
        "content": message.get("content"),
    }
    return history_entry, message


def print_round(label, message, usage):
    reasoning = message.get("reasoning_content")
    if reasoning:
        print(f"--- {label} 思维链（reasoning_content）---")
        print(reasoning)
    print(f"--- {label} 回答（content）---")
    print(message.get("content"))
    print(
        f"[usage] prompt={usage['prompt_tokens']} "
        f"cached={usage['prompt_tokens_details']['cached_tokens']} "
        f"completion={usage['completion_tokens']} "
        f"total={usage['total_tokens']}"
    )
    print()


def main():
    # 第一轮：只带一条 user 消息
    messages = [
        {"role": "user", "content": "世界上最高的山是哪一座？"},
    ]

    resp = chat(messages)
    assistant_entry, message = take_assistant_message(resp)
    messages.append(assistant_entry)  # 关键：把模型回答写回历史
    print_round("Round 1", message, resp["usage"])

    # 第二轮：第一轮的历史 + 新的追问，一起发过去
    messages.append({"role": "user", "content": "那第二高的是哪一座？"})

    resp = chat(messages)
    assistant_entry, message = take_assistant_message(resp)
    messages.append(assistant_entry)
    print_round("Round 2", message, resp["usage"])

    # 两轮结束后 messages 里有 4 条消息
    print("最终 messages 结构：")
    for i, m in enumerate(messages):
        preview = (m.get("content") or "")[:30].replace("\n", " ")
        print(f"  [{i}] {m['role']:<9} {preview}...")
    print(f"\nmessages 长度 = {len(messages)}")


if __name__ == "__main__":
    main()
