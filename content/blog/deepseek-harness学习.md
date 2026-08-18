---
title: "DeepSeek Harness 学习笔记"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

DeepSeek 在 2026 年 8 月开源了自己的 agent harness（智能体框架）——`DeepSeek Harness`（`dsh`）。它和 `deepseek-chat`、DeepSeek API 是两回事：后者是模型，前者是跑智能体的框架，类似于 Claude Code / OpenAI Codex 这类 Agent 运行环境。

它的核心设计理念只有一句话：**Everything is a Plugin（一切皆插件）**。整个产品没有一个"特权核心"，包括模型适配器、工具注册表、会话日志、甚至 Agent 主循环本身，全部是插件。这意味着产品里每个部件都可以通过配置替换掉。

## 快速开始

前提：装了 `Node.js`。然后一行命令：

```sh
npx @deepseek-ai/dsh web
```

启动后浏览器访问 `http://127.0.0.1:3080`。

> [!WARNING] 开发者预览
> 项目目前处于开发者预览阶段，正在快速迭代，未来会出现破坏兼容性的变更。

从源码运行：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

许可证是 MIT。

## 三个步骤用起来

1. **配置模型**：打开 设置 → 模型，填入 [DeepSeek API Key](https://platform.deepseek.com/)，保存即可用，不用重启。
2. **选择工作区**：点击"选择工作区"，把启动 `dsh` 时所在的目录加进去并选中。没选工作区之前，会话输入框是不可用的。
3. **运行任务**：发一条指令，比如 "Summarize this repository and identify its main packages."。Agent 会读取/编辑工作区文件、跑命令、委派子任务、维护计划。需要审批的操作会先问你（受权限策略控制）。

密钥是只写的：保存后页面只显示脱敏的描述符，不会回显明文。密钥存在 `$DSH_HOME/.credentials.yaml` 里，settings 只保留凭证引用。

## CLI 模式

`dsh` 命令是产品启动器，加载的是"profile"（按顺序叠起来的插件层）。常用模式：

| 命令 | 作用 |
|---|---|
| `dsh web` | 启动 Web UI（`--profile web` 的别名） |
| `dsh --profile headless "job"` | 跑一次新的持久会话，打印最终答案后退出，无服务器 |
| `dsh plugin --profile <name> <pnpm args>` | 用 pnpm 管理某个 profile 的插件 |
| `dsh --profile web --dump-config` | 打印实际启动的插件树，不真正启动 |

启动时的目录是默认工作区根目录。`web` 和 `headless` 两个 profile 首次使用会自动初始化（从内置模板生成），其他 profile 要通过 `dsh plugin` 创建。

launcher 只解析自己的参数，剩下的全部交给被启动的 profile 里的 app 插件解析：

```sh
dsh --profile web --port 8080       # --port 属于 web app
dsh --profile headless "run the tests"
dsh --profile web --help            # 这是 web app 的帮助，不是 launcher 的
```

## 核心架构

`dsh` 建立在 [Cordis](https://github.com/cordiverse/cordis) 插件框架之上。Cordis 的五个核心思想：

1. **插件是实现 Service 的对象**：可以是一个带可选 `inject`/`apply(ctx)` 的函数，也可以是一个 Service 子类。
2. **上下文是服务的仓库**：服务在上下文中占据稳定的 `ctx.<key>`（如 `ctx.tools`、`ctx.llm`、`ctx.sessions`），其他插件按 key 找服务，而不是 import 具体实现。
3. **用 `inject` 声明依赖**：插件声明需要的服务，等它们存在了才加载。加载顺序通过"服务依赖"表达，而不是手动排 boot 顺序。
4. **类型化事件通信**：服务通过 TypeScript 声明合并定义事件名，然后用 `emit` / `waterfall` / `parallel` / `serial` 四种方式分发。
5. **注册是可逆的副作用**：prompt 片段、工具 schema、适配器、监听器都用 `ctx.effect()` 或 `ctx.on()` 安装，插件卸载时能可预期地回滚。

### 四种事件分发模式

| 模式 | 是否 await | 分发顺序 | 有返回值 |
|---|---|---|---|
| `emit` | 否 | 按注册顺序观察 | 无 |
| `waterfall` | 否 | 按注册顺序观察 | 有 |
| `parallel` | 是 | 所有监听器并行 | 无 |
| `serial` | 是 | 按注册顺序 | 有 |

其中 `ctx.waterfall` 是"环绕式中间件"：监听器收到 `(...args, next)`，调用 `next()` 把结果传给下一个服务；不调用 `next()` 就短路。这是拦截和策略的常用手段——比如一个策略监听器决定"我做主"时直接不调 `next()` 返回，而只做注解/观察的监听器必须委托。

### Profile 和 Bundle

- **Profile**：一个具名的组合，存在 Harness home 下。它列出自己叠加的 bundles、装的外部插件、以及用户自己的 `cordis.patch.yml`。`web` 和 `headless` 自带模板。
- **Bundle**：Cordis 配置行 + 它们挂载的代码的发布格式。每个 bundle 在自己的 `package.json` 的 `dsh` 字段里声明：`dsh.profile` 列出 profile 的 bundles，`dsh.bundle` 指向 bundle 的 patch 文件。

层叠顺序（应用到空列表上）：

1. profile 里列出的各 bundle（按顺序）
2. profile 的 `cordis.patch.yml`
3. home 级别的 `$DSH_HOME/cordis.patch.yml`
4. `--patch` 覆盖层

patch 按 id 定位某行，整体替换它的配置，或插入新行。任何 `--dump-config` 打印出来的行都能用你自己的 patch 替换。

基础层 `dsh-base` 提供：模型适配器、工具、持久化、沙箱与审批策略、设置、凭证、遥测。`dsh-web-app` 加浏览器应用，`dsh-headless` 加一次性 runner。

## 核心包

| 包 | 职责 | `ctx` key |
|---|---|---|
| `core/session` | 只追加的 `SessionEvent` 日志 + 内存存储 | `ctx.sessions` |
| `core/system-prompt` | prompt 片段和工具 schema 组装 | `ctx.systemPrompt` |
| `core/tools` | 作用域工具注册表和受守卫的执行管道 | `ctx.tools` |
| `core/agent` | Agent 接口、活动注册表、`agent/*` 事件 | `ctx.agents` |
| `core/agent-loop` | 实现该接口的默认驱动 | `ctx.agentLoop` |
| `llm/llm` | 消息/流词汇 + 适配器接缝 | `ctx.llm` |

## 回合流程（Turn flow）

- **step**：一次模型请求 + 它调用的工具。
- **turn**：零个或多个 step。在第一个输入被认领前打开，直到无欠账后关闭。

核心流水线：

```text
turn/start
  claim 下一步输入 + 一条排队消息
  组装 prompt 片段 + 工具 schemas
  -> agent/pre-step
     step/start
     把进入的消息追加为 user/message
     从日志推导模型历史
     agent/request -> llm/stream -> assistant/chunk* -> assistant/message
     tool/call* -> tools/pre-execute -> tools/execute -> tools/post-execute -> tool/result*
     step/end
  -> agent/turn-stopping
turn/end
```

关键点：**模型能看到的，必须被记入日志。** 任何能到达模型请求的东西都必须能从会话日志重建出来，运行时有个不变式强制这一点。这就是为什么新增模型可见的输入必须新增一个会话事件类型。

## 能力接缝（Seam）

**Seam** 是一个可替换的能力，有三方角色：Service Definition（声明接口）、Service Provider（实现）、Consumer（使用方，通常是模型面对的工具）。同一个包可以合并多个角色，但只有一方不算 seam——加新能力意味着三个角色都要设计。

seam 的好处：换一个 provider 就换整个产品的行为。比如文件系统和子进程 provider 共享同一个执行世界，把它们指向远程沙箱，Bash、PTY、LSP 就跟着一起远程了，不用为每个工具 fork 一套。

## 新行为往哪挂

| 目标 | 机制 |
|---|---|
| 加模型 provider | 在 `ctx.llm` 注册适配器 |
| 加模型面对的能力 | 注册到 `ctx.tools`，schema 自动进 prompt 组装 |
| 加 shell 执行 | 注册 `ctx.shell` 后端 |
| 加后台任务 | 注册 `ctx.jobs` |
| 加文件系统访问/策略 | 注册 `ctx.fs` provider 或监听 `fs/*` 事件 |
| 拦截请求/工具/回合 | 用对应的 `agent/*` 或 `tools/*` 事件 |
| 加模型面对上下文 | 调 `agent.inject()` |
| 生成会话标题 | 注册唯一的 `ctx.sessionTitle` provider |
| fork 一个存活会话 | `ctx.sessions.fork(source, boundary?, childSessionId?)` |
| 把注册作用域限定到某个 agent | 用该 agent 的 `agent.ctx` |

## 模型配置进阶

`settings.yaml` 可以直接手写，比如自定义一个 OpenAI 兼容网关：

```yaml
llm-pi-ai:
  providers:
    my-gateway:
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://gateway.example/v1
      models:
        - id: legacy-chat
```

自定义 provider 的 Provider ID 是永久的（请求、会话、默认模型、凭证引用都靠它），要改名就新建一个再删旧的。

> [!TIP] 手写模型默认按纯文本处理
> 手写录入的模型默认 `input: [text]`，因为它没法问端点支持什么模态。要让自定义 provider 的模型收图片，给它加 `input: [text, image]`。DeepSeek 自己的 chat-completions 路由是纯文本的，改不了。

常见报错排查：

- `MISSING_CREDENTIAL`：key 没存或环境变量没给。
- `UNKNOWN_MODEL`：选一个已配置的模型，或把缺失的模型加进自定义 provider。
- 拉取可用模型返回 401：检查 key。模型发现走 OpenAI 兼容的 `GET /models`，不提供该端点的就手动录入。

## 学习要点小结

- `dsh` 是 DeepSeek 开源的 **agent harness 框架**（MIT），不是模型。
- 架构上"一切皆插件"，基于 Cordis：services + typed events + reversible effects。
- 每个能力部件都挂在一个 `ctx.<key>` 上，通过事件做拦截和策略。
- 三个概念分层：**seam**（接口+实现+使用方）> **bundle**（配置行+代码的分发单元）> **profile**（具名的 bundle 叠层组合）。
- 学习路径：先 `npx @deepseek-ai/dsh web` 跑起来 → 看 `--dump-config` 认识插件树 → 读 `docs/cookbook/` 学着写第一个插件 → 用 `ctx.tools` 加工具、用 `agent/*` 事件做拦截。

后续计划：跑通环境后写一篇"第一个 dsh 插件"的实操笔记，重点看如何用 `ctx.tools` 注册自定义工具。
