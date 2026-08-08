---
title: "DAP远程调试教学方案"
date: 2026-08-08
draft: true
toc: true
tags: ["todo"]
---

> 目标：老师(Agent)驱动 gdb 调试，学生(用户)在浏览器里实时观看源码、当前执行行、变量值，达到教学目的。

## 1. 背景与需求

- 场景：调试 C/C++ 递归回溯程序（如"放苹果"问题）
- 学生端：打开一个前端页面，能看到：
  - 源码
  - 当前执行到哪一行
  - 变量值
- 老师端：负责发出调试命令（continue / next / evaluate），学生只看过程
- 教学属性：可回放、可逐步、可自动脚本化

## 2. 为什么选 DAP

DAP（Debug Adapter Protocol）是 Microsoft 定义的语言无关的调试协议，把"调试 UI"和"调试器"彻底解耦：

```
你的浏览器(前端)  ⇄ DAP JSON-RPC ⇄  DAP 适配器  ⇄  gdb/lldb
   (显示源码/当前行/变量)          (cpptools / lldb-dap)   (实际调试)
```

- 消息全部是纯 JSON（JSON-RPC 2.0 风格），可读、可代理、可自动化
- 前端可以是任意 Web 页面，不依赖 VS Code 本身
- 适配器（如 VS Code 的 cpptools）负责把 gdb 的 MI 接口翻译成 DAP

## 3. 核心难点：一个适配器一次只服务一个客户端

教学场景要求"老师驱动 + 学生观看"，但 DAP 适配器默认是 1:1 的。
因此正确姿势是在中间加一个 **DAP 网关(proxy)**：

```
你的浏览器(VS Code 网页版 / 自写页) ⇄ WebSocket ⇄ 网关 ⇄ TCP(DAP) ⇄ lldb-dap --port 4711 ⇄ gdb
                                                      ↑
                                             老师命令通道(同一协议)
```

- 网关是适配器唯一的客户端
- 网关同时接受多个观看者连接
- 转发命令、把 `stopped`/`variables` 等事件广播给所有浏览器
- 网关很薄：150~250 行（Node 用 `vscode-debugprotocol` 包，或 Python）

## 4. 协议消息示例

```jsonc
// 客户端发给适配器：
{"type":"request","seq":1,"command":"initialize","arguments":{"adapterID":"lldb"}}
{"type":"request","seq":2,"command":"setBreakpoints","arguments":{"source":{"path":"1.cpp"},"breakpoints":[{"line":10}]}}
{"type":"request","seq":3,"command":"continue"}

// 适配器推给前端：
{"type":"event","event":"stopped","body":{"reason":"breakpoint","threadId":1}}

// 前端请求变量：
{"type":"request","command":"stackTrace",...} → {"type":"response","body":{"stackFrames":[...]}}
{"type":"request","command":"variables",...}  → {"type":"response","body":{"variables":[{"name":"m","value":"7"},...]}}
```

## 5. 落地三档方案

### 档位 1：零代码验证 DAP 远程调试（10 分钟）

- 适配器用 `lldb-dap --port 4711`（LLVM 自带，原生 DAP，能调 g++ 产物）
- 想坚持 gdb 就用 cpptools 的独立适配器
- VS Code 的 launch.json 里写 `"debugServer": "4711"`，VS Code 就会直连这个 DAP server
- 桌面/浏览器都有完整调试 UI
- 代价：VS Code 独占连接，做不到"老师驱动学生观看"

### 档位 2：完整教学方案（推荐）

- `lldb-dap --port` 起适配器
- 写一个 DAP 网关（proxy）
- 前端用 **code-server（VS Code 网页版）+ C/C++ 扩展**
- 学生浏览器看当前行高亮、变量悬浮窗
- 老师在网关另一头发 `continue`/`next`/`evaluate`，事件同步到学生页面

### 档位 3：自写轻量前端（教学神器）

- 前端两三百行：Monaco editor 渲染源码 + `stopped` 事件高亮当前行 + `scopes`/`variables` 请求画变量树
- 学生调试时不仅看效果，还能直接读协议消息，理解 DAP 本身

## 6. 与 ttyd 方案的对比

| 维度 | ttyd + gdb TUI | DAP 网关 |
|------|----------------|----------|
| 界面 | 终端 TUI（源码 + 当前行，变量靠 display） | 网页版 VS Code / Monaco，变量面板完整 |
| 老师驱动 | 直接 tmux send-keys 敲 gdb 命令 | 发 DAP JSON 消息，可脚本化（自动 step 20 次）|
| 多人观看 | 一个终端会话，天然共享 | 网关广播，可任意加观众 |
| 教学价值 | 学到 gdb 命令 | 学到 DAP 协议本身 |
| 工程量 | 低（几乎零）| 中（网关 200 行 + 前端）|

## 7. 推荐路径

1. 先做档位 1，验证"DAP 远程调试"手感（装 lldb-dap + debugServer 配置）
2. 上档位 2，加网关，实现"老师调、学生看"
3. 教学效果拉满再上档位 3（自写前端）

## 8. 下一步待办

- [ ] 安装/确认 lldb-dap 可用（`which lldb-dap`）
- [ ] 验证 `lldb-dap --port 4711` 起服务
- [ ] 写 VS Code launch.json 的 debugServer 配置
- [ ] 写 DAP 网关（转发 + 广播）
- [ ] 选前端（code-server 或 Monaco 自写页）
