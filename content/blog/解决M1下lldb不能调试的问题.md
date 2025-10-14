---
title: "解决M1下lldb不能调试的问题"
date: 2025-10-12
draft: false
toc: true
tags: ["lldb", "M1", "macOS", "调试", "SSH"]
categories: ["技术", "macOS"]
---

## 问题描述

在使用 Apple M1 芯片的 Mac 通过 SSH 远程连接时，尝试使用 LLDB 进行调试时遇到以下错误：

```bash
lldb error: process exited with status -1 (this is a non-interactive debug session, cannot get permission to debug processes.)
```

这个问题通常出现在以下场景：
- 通过 SSH 远程连接到 M1 Mac
- 在终端复用器（如 tmux、zellij）中使用 LLDB
- 尝试调试非当前用户拥有的进程

## 解决方案

这个问题的原因是 macOS 的安全机制限制了非交互式会话中的调试权限。解决方法很简单：

### 1. 启用开发者工具安全权限

在终端中执行以下命令：

```bash
sudo DevToolsSecurity -enable
```

这个命令会启用开发者工具的安全设置，允许 LLDB 在非交互式会话中获取调试权限。

### 2. 验证配置

执行以下命令验证配置是否成功：

```bash
DevToolsSecurity --status
```

如果显示 "Developer tools security is ENABLED." 则表示配置成功。

## 适用场景

这个解决方案适用于：
- ✅ Apple M1/M2/M3 芯片的 Mac
- ✅ 通过 SSH 远程连接调试
- ✅ 在 tmux、zellij 等终端复用器中调试
- ✅ macOS Monterey 及以上版本

## 参考来源

这个解决方案来自 Stack Overflow 的相关讨论：[Can't debug using lldb on Apple M1 over SSH](https://stackoverflow.com/questions/70748064/cant-debug-using-lldb-on-apple-m1-over-ssh)

> "While this doesn't solve your answer, I ran into this exact error with macOS 12.3 on Intel silicon and using sudo DevToolsSecurity -enable solved it for me. After that, I was able to run lldb inside tmux through ssh." – penguin359

## 总结

通过执行 `sudo DevToolsSecurity -enable` 命令，可以成功解决在 M1 Mac 上通过 SSH 和终端复用器使用 LLDB 调试时的权限问题。这个方法简单有效，不需要复杂的配置。