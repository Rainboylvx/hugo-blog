---
title: "DeepSeek Harness bundle 与 profile"
date: 2026-08-18
draft: true
toc: true
tags: ["AI", "工具", "DeepSeek"]
---

安装机制建立在两个概念上：**bundle（组合包）** 与 **profile**，二者都由一份 `package.json` 描述，但携带不同的 manifest。

- **bundle** = 附带一个配置层的 npm 包。manifest 声明 `dsh.bundle`，回答"这个包贡献什么"——一个插入或覆盖插件行的 patch 文件。
- **profile** = 位于 `$DSH_HOME/profiles/<name>` 下、描述一份可启动组合的目录。manifest 声明 `dsh.profile`，回答"这套配置由哪些 bundle 按什么顺序组成"。
- **bundle 是你编写并分发的东西；profile 是用户用 `dsh --profile <name>` 启动的东西。没有东西同时是两者。**

| 概念 | manifest 键 | 回答的问题 | 谁编写 / 谁使用 |
| --- | --- | --- | --- |
| bundle（组合包） | `dsh.bundle` | 这个包贡献什么（一个 patch 文件） | 插件作者编写，随包分发 |
| profile | `dsh.profile` | 这套配置由哪些 bundle 按什么顺序组成 | 由 `dsh plugin` 自动创建维护，用户启动 |

## 动手：创建 hello-plugin 组合包

```
hello-plugin/
├── package.json       # 声明 dsh.bundle
├── cordis.patch.yml   # profile 列出该 bundle 时应用的配置层
└── index.js           # patch 行引用的插件模块
```

`hello-plugin/package.json`：

```json
{
  "name": "dsh-hello-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.js",
  "files": ["index.js", "cordis.patch.yml"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } }
}
```

| 字段 | 说明 |
| --- | --- |
| `name` | 包名，Node 模块解析靠它找到已安装的代码 |
| `type` | `"module"` 表示使用 ESM 模块格式 |
| `files` | 发布时只包含的文件清单 |
| `dsh.bundle.patch` | 组合包 manifest：声明贡献的 patch 文件路径 |

`hello-plugin/index.js`：

```javascript
export const name = 'hello-plugin' // 插件名，用于日志与诊断

export function apply() {
  console.log('[hello-plugin] plugin loaded!')
}
```

`hello-plugin/cordis.patch.yml`：

```yaml
# 文件路径：hello-plugin/cordis.patch.yml
# 与 --patch overlay 一样的 patch 条目 YAML 数组
# 区别：插件行按包名而不是相对源码路径引用
- insert:
  - id: hello
    name: dsh-hello-plugin
```

> [!TIP] 该 patch 与 `--patch overlay` 完全同构；关键区别在 `name` 字段：写包名 `dsh-hello-plugin` 而非相对源码路径。安装后 pnpm 把包链接到 node_modules，Node 模块解析按包名找到已安装代码。

- 没有 `dsh.bundle` 声明的包仍可安装，但只作为普通依赖，`dsh plugin` 会打印警告且不激活任何层。供插件包 import、而非供用户启用的库就用这种格式。
- **profile manifest 从不需要手写**：`dsh plugin` 负责创建和维护。profile 目录含两个文件：① package.json（树外插件依赖 + `dsh.profile` manifest + 有序 bundles 列表）；② cordis.patch.yml（用户自己的 patch 层，在每个组合包层之后应用）。

## 自测

1. bundle 的 manifest 声明什么？→ `dsh.bundle`，回答"贡献什么 patch"
2. profile 位于哪里？→ `$DSH_HOME/profiles/<name>`，回答"由哪些 bundle 按什么顺序组成"
3. 为什么用包名而不是相对源码路径？→ 包名才能让 Node 模块解析找到已安装的代码