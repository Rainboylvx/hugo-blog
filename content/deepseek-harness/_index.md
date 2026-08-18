---
title: DeepSeek Harness 系列
noList: true
---

DeepSeek Harness（`dsh`）学习系列，整理自菜鸟教程的 29 篇系列文章。

## 入门

- [快速入门](./快速入门.md)
- [模型配置与 Python SDK](./模型配置与PythonSDK.md)

## 插件开发

- [第一个插件](./第一个插件.md)
- [加载本地插件](./加载本地插件.md)
- [ctx.effect() 自动清理](./ctx-effect自动清理.md)
- [inject 声明依赖](./inject声明依赖.md)
- [defineTool 第一个工具](./defineTool第一个工具.md)
- [Config 与 Schemastery](./Config与Schemastery.md)
- [插件生命周期 Fiber](./插件生命周期Fiber.md)
- [依赖驱动加载与嵌套上下文](./依赖驱动加载与嵌套上下文.md)

## 服务与事件

- [Service 基类与类型声明](./Service基类与类型声明.md)
- [服务隔离与作用域](./服务隔离与作用域.md)
- [事件系统 emit/bail/serial/waterfall](./事件系统.md)
- [能力三角色 Definition/Provider/Consumer](./能力三角色.md)
- [实战：写一个可替换的能力](./实战可替换能力.md)

## 模型接入

- [LLM 适配器](./LLM适配器.md)
- [StreamChunk 协议与错误处理](./StreamChunk协议.md)

## 打包与发布

- [bundle 与 profile](./bundle与profile.md)
- [安装插件与配置加载顺序](./安装插件与配置加载顺序.md)
- [发布插件](./发布插件.md)

## 运行机制

- [工具执行流水线与权限门禁](./工具执行流水线.md)
- [沙箱与审批](./沙箱与审批.md)
- [会话日志与轮次生命周期](./会话日志与轮次.md)

## 工程实践

- [防御性编程](./防御性编程.md)
- [事故复盘与工程文化](./事故复盘与工程文化.md)