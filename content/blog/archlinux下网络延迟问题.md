---
title: "archlinux下网络延迟问题"
date: 2025-09-23
draft: false
toc: true
tags: ["linux","bug fix"]
categories: [""]
---

## 1. 起因

最近在使用archlinux,发现网络延迟很高,但是其他设备正常,于是开始排查问题.

## 2. 问题排查

直接问AI,AI 告诉我最大的可能是:

> Wi-Fi 省电模式 (Power Save Management): 这是 最可疑的软件层面原因。Linux 内核为了节省电力，可能会让 Wi-Fi 网卡频繁进入休眠和唤醒状态，导致响应延迟急剧增加。

```bash
sudo pacman -S wireless_tools
```


```bash
iwconfig wlan0 | grep "Power Management"
```
如果显示为 `Power Management:on`，说明省电模式已开启。

临时解决

```bash
sudo iwconfig <your wlan-name> power off
```

ping值,恢复正常

## 3. 解决方案

```bash
sudo vim /etc/NetworkManager/conf.d/wifi-powersave.conf
```

添加以下内容：

```bash
[connection]
wifi.powersave = 2
```

一行命令

```bash
sudo cat > /etc/NetworkManager/conf.d/wifi-powersave.conf <<EOF
[connection]
wifi.powersave = 2
EOF
```

然后重启 NetworkManager：

```bash
sudo systemctl restart NetworkManager
```

## 参考

- [NetworkManager Wi-Fi powersaving configuration](https://gist.github.com/jcberthon/ea8cfe278998968ba7c5a95344bc8b55)
- [Arch Linux Wi-Fi Power Management](https://wiki.archlinux.org/title/Power_management#NetworkManager  )