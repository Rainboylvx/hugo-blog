---
title: "macOS Sequoia 本地网络权限导致 ERR_ADDRESS_UNREACHABLE：一次踩坑记录"
date: 2026-09-07
draft: true
toc: true
tags: ["macOS", "Sequoia", "Edge", "Chrome", "TCC", "网络调试", "bug fix"]
categories: ["macOS", "网络"]
---

## 1. 起因

最近在 M1 Mac（macOS 15.1 Sequoia）上重新安装了 Edge 浏览器，访问局域网内一台虚拟机上的服务时遇到了一个诡异的错误：

```
无法访问此页面
无法访问 http://192.168.9.103:3002/。
ERR_ADDRESS_UNREACHABLE
```

最令人困惑的是：**手机、Windows 主机、Mac 上的 Safari、curl 都能正常访问**，唯独 Edge 不行。换 Chrome 试也是一样。这让我意识到问题不在于"网络"，而在于"Mac 上的 Chromium 内核浏览器"。

## 2. 环境背景

```
- 局域网部署：路由器做 DNS，通过域名访问内网服务
- 反向代理：nginx 在虚拟机上转发 coder、memos 等服务
- 本机：Mac M1，macOS 15.1
- 测试浏览器：Edge（全新安装）、Chrome（下载安装）、Safari（系统自带）、curl
```

## 3. 排查过程

按常规思路逐项排查：

| 排查项 | 结果 |
|--------|------|
| `curl http://192.168.9.103:3002/` | ✅ 正常返回 nginx 默认页面 |
| Safari 访问 | ✅ 正常 |
| 手机/Win 浏览器访问 | ✅ 正常 |
| `nc -zv 192.168.9.103 3002` | ✅ `Connection succeeded!` |
| Edge 重启/重装 | ❌ 仍然 ERR_ADDRESS_UNREACHABLE |
| 清除 DNS 缓存 | ❌ 无效 |
| Edge flags 关掉 TLS 1.3 相关项 | ❌ 无效 |
| 关闭 Secure DNS（DoH） | ❌ 无效 |
| 路由器管理页面 | ✅ 正常访问 |

**关键线索**：网络层、路由层、DNS 都正常，Safari/curl 也没问题，唯独 Chromium 内核浏览器不行。说明这是浏览器沙箱内的某种权限问题。

## 4. 关键转折：Chrome 的权限弹窗

抱着"是不是 Chromium 内核的问题"的心态下载了 Chrome，再次访问内网 IP 时，**系统弹出了权限询问框**：

> "Chrome" 想查找并连接到本地网络上的设备。是否允许？

**就是这个弹窗！**

点「允许」之后 Chrome 立即能访问了。回到 Edge 做同样操作：

```
系统设置 → 隐私与安全性 → 本地网络 → 勾选 Microsoft Edge
```

Edge 也能访问了。

## 5. 根因分析：macOS Sequoia 的 TCC LocalNetwork 服务

macOS 15（Sequoia）起，Apple 在 TCC（Transparency, Consent, and Control）权限框架中新增了一个服务类：`kTCCServiceLocalNetwork`。

### 5.1 行为机制

- 每个 App **首次**尝试访问局域网设备时，系统会弹出权限询问
- 用户授权后，权限记录在 `/Library/Application Support/com.apple.TCC/TCC.db` 中
- 权限**被拒绝后**，Chromium 内核的网络服务进程（`--service-sandbox-type=network`）直接返回 `ERR_ADDRESS_UNREACHABLE`，看起来像"网络问题"
- **首次弹窗可能没注意到**（尤其是浏览器启动时自动请求后台资源）

### 5.2 为什么 Safari/curl 没事

| 客户端 | TCC LocalNetwork 限制 |
|--------|----------------------|
| Safari | 系统自带，默认授权 |
| curl | 不受 TCC 管控（命令行工具） |
| Chrome/Edge/其他 Chromium | 受 TCC 管控，需用户授权 |
| VSCode、Cursor、Termius 等 | 同样受管控 |

### 5.3 为什么错误是 `ERR_ADDRESS_UNREACHABLE` 而不是更明确的提示

Chromium 的网络服务在沙箱内收到 macOS 的 socket 权限拒绝后，统一映射为 `ERR_ADDRESS_UNREACHABLE`。**这个错误信息极具误导性** —— 字面看是"路由不可达"，实际是"沙箱拒绝访问"。这正是本次踩坑最久的原因。

## 6. 解决方案

### 6.1 快速修复（图形界面）

```
系统设置 → 隐私与安全性 → 本地网络 → 勾选对应浏览器
```

### 6.2 重置后重新触发权限询问

如果权限被永久拒绝，可执行以下步骤重新触发：

```bash
# 1. 重置对应 App 的 TCC 权限
tccutil reset LocalNetwork com.microsoft.edgemac
tccutil reset LocalNetwork com.google.Chrome

# 2. 完全退出浏览器
osascript -e 'quit app "Microsoft Edge"'
pkill -f "Microsoft Edge"

# 3. 重新打开，访问内网 IP，会再次弹窗
open -a "Microsoft Edge" "http://192.168.9.103:3002/"
```

### 6.3 验证命令

查看当前所有授予 LocalNetwork 权限的应用：

```bash
sqlite3 "/Library/Application Support/com.apple.TCC/TCC.db" \
  "SELECT client, auth_value FROM access WHERE service='kTCCServiceLocalNetwork';"
```

> 注：该路径受 SIP 保护，部分系统版本需先进入 Recovery Mode 关闭 SIP 才能读取。

## 7. 经验教训

1. **macOS Sequoia 的 TCC 权限更严格了**，`LocalNetwork` 是新增项，所有访问局域网的应用都可能触发
2. **错误信息的"误导性"**：Chromium 的 `ERR_ADDRESS_UNREACHABLE` 看起来像网络问题，实际可能是沙箱权限问题。看到这个错误时，应该同时检查：
   - `curl` 是否能通（排除网络问题）
   - 系统设置里相关 App 的权限
3. **不要习惯性拒绝权限请求** —— TCC 在 macOS 15+ 的"拒绝"行为已经升级为"直接拒绝服务"，不像以前只是"不再询问"
4. **遇到"奇怪的内网访问问题"时**，第一时间检查的是 `系统设置 → 隐私与安全性 → 本地网络`，而不是去折腾 DNS、proxy、TLS flags

## 8. 写在最后

这次踩坑断断续续花了好几个小时，从怀疑 Edge 的安全策略，到怀疑 Chromium 内核，再到怀疑 nginx/路由器配置，绕了一大圈。

**真正有用的排查思路其实是：**

> 当一个浏览器报错而另一个不报错时，先去看系统级的权限设置 —— 而不是浏览器内部配置。

希望这篇文章能帮到遇到同样问题的同学，少走一些弯路。
