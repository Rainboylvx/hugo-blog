---
title: "M4 Pro Mac mini 装机指南：教学、万兆内网与 Dotfiles 统一管理"
date: 2026-09-12
draft: true
toc: true
tags: ["工具", "macOS", "dotfiles", "yadm", "self-record"]
categories: ["工具"]
---

- [yadm 官方文档](https://yadm.io/docs/)
- [AeroSpace 文档](https://nikitabobko.github.io/AeroSpace/guide)
- [Homebrew Cask](https://docs.brew.sh/Brew-Lessons-Cask-Text)

这台 M4 Pro Mac mini 不是我的第一台 Mac，但它是第一台打算当**主力开发机**用的。之前主力一直在 Arch Linux 上，现在要把日常搬到 macOS，同时保留 Linux 那套按键、终端和配置管理习惯。

它要承担的事情很具体：

1. **算法教学与课件**——写题解、编译讲义、录课、改学生的代码；
2. **家里那堆节点的入口**——Proxmox、Debian、Arch、NAS、Home Assistant，全靠 SSH 和万兆内网串起来；
3. **知识库与产出**——Obsidian 笔记、3D 打印切片、短视频剪辑。

所以装机的判断标准只有一条：**能不能把我 Linux 上那套肌肉记忆原样搬过来**。下面按这个标准记录装了哪些、哪些坑必须绕、以及配置怎么在多设备之间统一。

> [!NOTE] 说明
> 本文的安装清单和验证结果都在本机 `brew` 里实际跑过。表格里的「状态」列反映 2026-09-12 这台机器的真实情况，装机顺序建议直接按第 9 节走。

---

## 1. 系统基建与包管理器

**Homebrew** 是第一步，后面所有软件基本都能一行命令搞定。

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

装完要把 shellenv 写进 `~/.zprofile`，否则新开终端找不到 `brew`：

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
```

然后是 **GNU Coreutils**。macOS 默认带的是 BSD 版本命令行工具，`sed -i`、`date -d`、`ls --color` 这些写法行为都不一样，在两台机器间来回切会被绊倒。Homebrew 用 `g` 前缀避免覆盖系统版本：

```bash
brew install coreutils findutils gnu-tar gnu-sed gawk grep
```

> [!WARNING] 这一条我还没做
> 本机目前**没有安装** coreutils（`command -v gls` 为空）。也就是说现在 `ls`/`sed`/`date` 走的仍是 BSD 行为，脚本里写 Linux 风格参数会静默出错。补装后需要在 `~/.zshrc` 里把 `$(brew --prefix coreutils)/libexec/gnubin` 加进 `PATH` 才能真正顶掉 BSD 版本。

---

## 2. 教学与课件开发

| 工具 | 用途 | 状态 |
| :--- | :--- | :--- |
| LLVM | 提供 `clangd` 语言服务器 | ✅ `llvm` 已装 |
| GCC | 保证 C++ 竞赛代码语法与评测机一致 | ✅ 已装 |
| VS Code | 主 IDE，配 `clangd` + `PlatformIO` | ✅ `visual-studio-code` |
| Neovim | 原生运行，Linux 配置直接软链过来 | ✅ 已装 |
| Typst | 本地极速编译讲义与试卷 | ✅ 已装 |
| Obsidian | 知识库核心，Dataview 管题解与学生进度 | ✅ 已装 |

两个值得单独说的点：

**`clangd` 不是独立的包。** 它随 `llvm` 一起装，Homebrew 里没有单独的 `clangd` formula（`brew info --cask clangd` 会报 unavailable）。所以 VS Code 里用 clangd 插件时，指向 llvm 的路径：

```bash
brew install llvm
# Apple Silicon 上前缀在 /opt/homebrew
ls /opt/homebrew/opt/llvm/bin/clangd
```

**Typst 对教学场景是决定性的。** LaTeX 改一行公式重排半分钟，Typst 是毫秒级增量编译，配 VS Code 的 Tinymist 插件基本是所见即所得。现场改卷子的时候这个差距很有用。

```bash
typst compile lecture.typ
```

---

## 3. 远程协同与万兆内网

```bash
brew install --cask tailscale royal-tsx termius microsoft-remote-desktop
```

| 工具 | 状态 | 说明 |
| :--- | :--- | :--- |
| Tailscale | ❌ **待装** | 应该第一时间装，后面所有节点访问都依赖它 |
| Termius | ✅ 已装 | 集中管 SSH |
| Royal TSX | ❌ 待装 | 连接多、需要分组和凭据管理时更顺手 |
| Microsoft Remote Desktop | ❌ 待装 | 远控 Win 机器跑 SolidWorks |

> [!IMPORTANT] Tailscale 要在配置内网之前装
> 这台机器的万兆网卡一旦配好静态 IP、接管了内网路由，Tailscale 的「拦截 LAN 流量」选项就会开始影响本机访问内网设备，排错时容易误判成网卡问题。顺序装反了要多花一小时。之前记录过一次 Sequoia 上的内网访问踩坑，见 [macOS Sequoia 本地网络权限导致 ERR_ADDRESS_UNREACHABLE](./macos-sequoia-local-network-permission.md)——同样是系统层权限而不是应用配置的问题。

**万兆网卡的吞吐值得单独监控**，第 6 节的 `Stats` 菜单栏可以实时显示，不用每次开活动监视器。

---

## 4. 硬件创客与全栈

```bash
brew install --cask bambu-studio orcaslicer miniforge
brew install node
```

- **Bambu Studio / OrcaSlicer**：本地切片，内网推送到 P1S 或 A1 mini。
- **Node.js / Python**：前端构建跑 Node，Pandas 脚本用 Miniforge（conda 系，不污染系统 Python）。本机已装 `node` 和 `uv`，轻量脚本我越来越多直接用 `uv` 起。

> [!TIP] 包名注意
> Bambu 的 cask 名是 **`bambu-studio`**，写成 `bambustudio` 会报 not found。相关还有 `bambu-connect`（打印机联网管理），两者不是一个东西。

---

## 5. AI 与多媒体

```bash
brew install --cask cherry-studio ollama
```

| 工具 | 用途 | 状态 |
| :--- | :--- | :--- |
| Cherry Studio | 桌面端 AI 客户端，接 DeepSeek 等 API 生成测试数据与代码骨架 | ❌ 待装 |
| Roo Code | VS Code 里的 agent 插件 | ⚠️ 见下 |
| Ollama | 常驻后台跑本地模型 | ❌ 待装 |
| 剪映专业版 / CapCut | 短视频与引流视频，M4 媒体引擎渲染很快 | ❌ 待装 |

> [!WARNING] Roo Code 不是桌面 App
> 它是 VS Code 扩展，在插件市场里装，`brew install --cask roo-code` 找不到。另外 brew 里能装到的是海外版 **`capcut`**，国区的剪映专业版（`jianying-pro` 这个 cask 名并不存在）得走官网下载。

24G 内存跑本地模型是个尴尬的档位：7B/8B 量化模型很舒服，再往上就要认真算 KV cache 占用。写代码辅助用 API 更划算，本地模型我主要留给离线场景和批量数据清洗。

---

## 6. 终端方案：Kitty + tmux

终端我选 Kitty：GPU 加速（macOS 上走 Metal），纯文本配置，原生分屏。详细配置单独写了一篇：

- [Kitty 终端使用入门：macOS 安装、字体配置与常用快捷键](./kitty使用入门.md)
- [我的 tmux 配置详解：C-s 前缀、无前缀键与编号会话](./tmux配置详解.md)

装机时最容易踩的三个点：

**1. Option 键。** 常见建议是无脑加 `macos_option_as_alt yes`，否则 `Alt` 组合键失灵。但这行会把 Option 从 macOS 的系统输入行为里抢走（失去输入 `©`、`≈` 这类字符，以及一些 App 依赖的 ⌥ 菜单项）。我现在的配置是：

```ini
# 注：暂不使用 macos_option_as_alt —— 用户选择保留 ⌘ 习惯（见下方 ⌘W noop）
macos_option_as_alt both
```

`both` 表示左右两个 Option 键都当 Alt 用。判断依据是：只有当你在终端里跑 vim/neovim 且大量用 `Alt` 组合时，这行才是**必需**的，否则它是有代价的取舍，不是必选项。

**2. 字体。** Nerd Font 是图标字体的超集，不加的话 tmux 状态栏和 powerline 类主题会掉字：

```bash
brew install --cask font-jetbrains-mono-nerd-font
```

本机当前实际装的是 `font-fira-code-nerd-font`，但 `kitty.conf` 里写的是：

```ini
font_family      JetBrainsLxgwNerdMono
font_size        17.0
```

> [!TIP] 验证字体名是否匹配
> `font_family` 必须匹配系统注册名而不是文件名。装完字体后用 Kitty 自带工具核对，改完在 Kitty 里按 `Ctrl+Shift+F6` 重载配置：
> ```bash
> kitty --list-fonts "JetBrains" | head -20
> ```
> 名字对不上时 Kitty 会静默回退到默认字体，图标显示成方块，很难第一时间联想到字体。

**3. tmux 配置路径。** tmux 的查找顺序是 `~/.tmux.conf` 优先，只有它不存在才去看 XDG 路径。我这边两个都有，需要小心哪个才是真正生效的：

```bash
tmux -V
grep -n "prefix" ~/.config/tmux/tmux.conf   # 主配置（完整定制）
cat ~/.tmux.conf                             # 只放了少量覆盖项
```

> [!NOTE] 一个容易漏的按键协议问题
> 本机 `~/.tmux.conf` 里只有这么一行，是 coding agent 在 tmux 下工作时的必要修正：
> ```tmux
> set -g extended-keys-format csi-u
> ```
> 不设置时 tmux 默认向应用广播 `xterm` 风格的扩展键序列，现代终端（Kitty / Ghostty）里 `Alt+方向键`、`Shift+Enter` 会被错误解析。改完需要**重启整个 tmux server**（`tmux kill-server`），只 kill 当前会话不生效。

Kitty 自带的分屏确实能顶掉一部分 tmux 场景，但我还是保留 tmux：会话要跨 SSH 存活着，Kitty 的窗口布局做不到断线重连后原样恢复。

---

## 7. 扩展工具

### 7.1 窗口管理与键盘流

| 工具 | 作用 | 状态 |
| :--- | :--- | :--- |
| AeroSpace | 平铺窗口管理器，类 i3/Hyprland，无需关 SIP | ✅ 已装，⚠️ 未配置 |
| Raycast | 替代 Spotlight，带剪贴板历史和插件生态 | ✅ 已装 |
| Karabiner-Elements | 键位映射，CapsLock →「单击 Esc、长按 Ctrl」 | ✅ 已装 |

AeroSpace 的安装三步：

```bash
brew install --cask nikitabobko/tap/aerospace
# 或直接走主仓库
brew install --cask aerospace
```

1. 首次启动后，在 **系统设置 → 隐私与安全性 → 辅助功能** 里授权（不授权它完全不动，也不报错）；
2. 复制默认配置：
   ```bash
   cp /Applications/AeroSpace.app/Contents/Resources/default-config.toml ~/.aerospace.toml
   ```
3. 改完配置按 `Option + Shift + ;` 热重载。

> [!WARNING] 本机卡在第二步
> `brew list --cask` 里 aerospace 已装（0.21.3-Beta），但 `~/.aerospace.toml` 和 `~/.config/aerospace/` 都不存在，等于装了个默认键位的空壳。想复刻 i3 手感的话，主修饰键建议从 `Option` 换成 `Ctrl` 或 `Super`，否则会和终端、Karabiner 的映射打架。

### 7.2 虚拟化与监控

```bash
brew install --cask orbstack stats iina cyberduck
```

- **OrbStack** ✅：Docker Desktop 的替代，资源占用极低、启动秒级，这台机器跑 compose 完全够用。
- **Stats** ✅：菜单栏监控，能看 CPU、内存压力**和万兆网卡吞吐**。
- **IINA** ✅：mpv 系播放器，硬件解码 NAS 上的高清素材。
- **Cyberduck** ❌：SFTP/SMB/S3 图形化文件管理，连 NAS 方便。

### 7.3 现代 CLI 效率套件

```bash
brew install zoxide eza bat ripgrep fd lazygit btop
```

| 工具 | 替代 | 价值 | 状态 |
| :--- | :--- | :--- | :--- |
| zoxide | `cd` | 按频率智能跳转，不用敲完整路径 | ✅ |
| eza | `ls` | 带 Git 状态、图标 | ✅ |
| bat | `cat` | 语法高亮，自动分页 | ✅ |
| rg | `grep -r` | 快一个数量级，默认读 `.gitignore` | ✅ |
| fd | `find` | 语法极简 | ✅ |
| lazygit | `git add -p` | 终端内秒级暂存、回滚 | ✅ |
| btop | `top` | 现代化资源监视 | ✅ |

这一组是纯赚的：零配置，装完就能把 Linux 上的搜索/预览手感带过来。Neovim 的 `telescope` / `fzf-lua` 也全都依赖 `rg` + `fd` + `fzf`，属于地基。

### 7.4 教学演示辅助

```bash
brew install --cask shottr keycastr obs
brew install --cask snipaste
```

| 工具 | 用途 | 状态 |
| :--- | :--- | :--- |
| Shottr / Snipaste | 截图贴图，长截图与标注 | ✅ Shottr 已装，❌ Snipaste 待装 |
| KeyCastr | 屏幕按键回显，录编码教学视频必备 | ✅ 已装 |
| OBS Studio | Apple Silicon 深度优化，硬件编码录屏推流 | ✅ 已装 |
| AppCleaner | 拖进去卸载，清残留 | ✅ 已装 |

> [!TIP] 录课前先测一次编码
> OBS 里硬件编码选 **Apple H.264 (VideoToolbox)**。用默认的 x264 会吃满 CPU 且风扇起飞，录 4K 演示直接掉帧。KeyCastr 记得设一个不显眼的半透明样式，否则学生注意力全在按键上。

---

## 8. Dotfiles：Stow 还是 yadm

我手上有 macOS、Arch Linux、Debian 三套环境，配置必须统一。两个主流方案：

| 评估维度 | GNU Stow | yadm |
| :--- | :--- | :--- |
| 工作原理 | 集中目录 + 外派**软链接** | 整个 Home 目录是一个 **Git 裸仓库** |
| 模块化管理 | 极强，可精细 `stow nvim` | 较弱，整目录共享一条 Git 时间线 |
| 跨系统差异 | 繁琐，需手动按系统建目录 | **原生后缀识别**，自动适配 OS |
| 文件侵入性 | 软链接易被部分软件覆盖报错 | 实体文件，与普通操作无异 |
| 敏感信息保护 | 无原生支持 | 自带 `yadm encrypt` 加密 |

**结论：多设备异构场景选 yadm。** 关键就在「跨系统差异」这一行——`kitty.conf` 在 Mac 上需要 `macos_option_as_alt`，在 Linux 上不需要，这种分支用 Stow 得靠手工维护平行目录，yadm 只要改文件名。

> [!NOTE] 小修正
> 官方只有 `yadm encrypt` / `yadm decrypt`，没有 `yadm crypt`。加密需要额外的 gpg 配置，见 [Encryption 文档](https://yadm.io/docs/encryption)。

### 落地工作流

```bash
# 1. 安装与初始化（裸仓库藏在 ~/.local/share/yadm，不干扰 ~/ 下其他项目）
brew install yadm
yadm init

# 2. 像用 git 一样添加配置
yadm add ~/.config/kitty
yadm add ~/.config/tmux
yadm add ~/.aerospace.toml
yadm add ~/.zshrc
yadm add ~/.gitconfig

# 3. 处理跨系统差异：双井号后缀，可组合 os / arch / hostname / user
mv ~/.config/kitty/kitty.conf ~/.config/kitty/kitty.conf##os.Darwin
yadm alt          # 手动生成本机对应版本的软链

# 4. 提交与推送
yadm commit -m "feat: init mac workspace"
yadm branch -M main
yadm remote add origin git@github.com:<用户名>/dotfiles.git
yadm push -u origin main
```

可用后缀条件：`##os.Darwin`、`##os.Linux`、`##arch.arm64`、`##hostname.主机名`、`##user.用户名`、`##default`，逗号可以叠加（如 `##os.Darwin,arch.arm64`），**条件越多优先级越高**。若不想让变体和生成软链混在同一目录，可放到 `~/.config/yadm/alt/` 下保持相对路径。

> [!TIP] 优先用条件块，其次才用变体文件
> 分隔变体意味着改一处要在每个变体里各改一遍。能写进文件内的条件优先：
> ```tmux
> # macOS 上用 pbcopy/pbpaste，Linux 走 xclip
> if-shell "test \"$(uname -s)\" = Darwin" \
>   "set -g clipboard on" \
>   "set -g default-command 'xclip -selection clipboard'"
> ```
> 变体文件留给那种"文件本身不支持条件语法"的场景（比如 `kitty.conf`），或者是真的两套完全不同的配置。

换新机器只要一行：

```bash
yadm clone git@github.com:<用户名>/dotfiles.git
```

再配合 bootstrap 脚本自动装 Homebrew 和整个 bundle（bootstrap 文件必须放在 `~/.config/yadm/bootstrap` 且有可执行位）：

```bash
#!/bin/sh
# ~/.config/yadm/bootstrap —— 要写成幂等的，clone 后会自动提示运行
if [ "$(uname -s)" = "Darwin" ]; then
  command -v brew >/dev/null 2>&1 || \
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  [ -f "$HOME/.Brewfile" ] && brew bundle --global
fi
```

`.Brewfile` 的写法：

```ruby
cask  "kitty"
cask  "aerospace"
cask  "orbstack"
cask  "font-fira-code-nerd-font"
brew  "ripgrep"
brew  "fzf"
brew  "yadm"
```

这样 `brew install` 清单本身也进了 dotfiles，换机重装从「照文章一条条复制」变成一条 `brew bundle`。

> [!WARNING] 本机这一条完全没开始
> `yadm` 已装，但 `yadm status` 报 `Git repo does not exist`，即从未 `init`；`~/.Brewfile` 也不存在。这台机器的配置目前**只存在于这台机器上**。装完软件就该开始第 8 节，不要等到要迁第二台机器时才后悔。

---

## 9. 装机顺序建议

按实际踩坑倒推，建议顺序：

1. **Homebrew + shellenv** —— 没有它后面全是手动下载；
2. **Tailscale** —— 在内网/路由还没被折腾之前先装（见第 3 节）；
3. **GNU coreutils** —— 后面所有 shell 脚本的语法基线；
4. **Kitty + Nerd Font + tmux** —— 终端和按键手感先对齐，之后所有操作都顺手；
5. **`yadm init` + `.Brewfile`** —— 把 1～4 的成果当场纳管，越早开始越省事；
6. CLI 效率套件、VS Code + clangd + PlatformIO、Neovim 配置软链、Typst、Obsidian；
7. 剩下的按需：OrbStack / OBS / 切片 / AI 客户端。

> [!SUCCESS] 一句话总结
> macOS 装机的难点从来不是装什么，而是**怎么让一台 Unix 里的"异类"表现得像 Linux**：coreutils 补齐行为差异、Kitty 补齐终端能力、AeroSpace 补齐窗口管理、yadm 补齐跨设备一致性。这四件事做完，剩下的只是选软件口味。

---

## 相关

- [Kitty 终端使用入门](./kitty使用入门.md)
- [我的 tmux 配置详解](./tmux配置详解.md)
- [macOS Sequoia 本地网络权限踩坑](./macos-sequoia-local-network-permission.md)
- [zellij 使用入门](./zellij使用入门.md)
- [my-awesome-tools](./my-awesome-tools.md)
