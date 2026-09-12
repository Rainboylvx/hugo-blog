---
title: "Kitty 终端使用入门：macOS 安装、字体配置与常用快捷键"
date: 2026-09-07
draft: true
toc: true
tags: ["工具", "终端", "kitty", "macOS"]
categories: ["工具"]
---

- [Kitty 官方网站](https://sw.kovidgoyal.net/kitty/)
- [GitHub 仓库](https://github.com/kovidgoyal/kitty)

Kitty 是一款基于 GPU 加速（OpenGL / Metal）的高性能终端仿真器。它用 C 和 Python 编写，具备极低输入延迟、高度可定制的纯文本配置，并且原生内置分屏与标签页管理、图形协议支持（可在终端里直接渲染图片）以及丰富的 `kitten` 扩展生态。

如果你在寻找一款兼具极致渲染速度、不依赖复杂外部插件又能顺手管理窗口的终端，Kitty 是一个非常理想的选择。

---

## 1. 在 macOS 上安装

### 方法一：通过 Homebrew Cask 安装（推荐）

在终端中执行：

```bash
brew install --cask kitty
```

### 方法二：通过官方脚本安装

官方提供了一个自动下载最新独立版本并解压到应用程序目录的安装脚本：

```bash
curl -L https://sw.kovidgoyal.net/kitty/installer.sh | sh /dev/stdin
```

### 将 `kitty` 命令行工具加入 PATH

如果你是通过 Homebrew 安装的，`kitty` 命令通常已经自动建立软链接。如果是通过官方独立安装包，建议将 CLI 和 `kitten` 链接到用户 PATH 中（例如 `~/.local/bin` 或 `/usr/local/bin`）：

```bash
# 确保 ~/.local/bin 存在并在你的 $PATH 中
mkdir -p ~/.local/bin

ln -sf /Applications/kitty.app/Contents/MacOS/kitty ~/.local/bin/
ln -sf /Applications/kitty.app/Contents/MacOS/kitten ~/.local/bin/
```

在终端运行以下命令验证安装：

```bash
kitty --version
```

---

## 2. 配置文件位置与热重载

Kitty 的配置完全由单一的纯文本文件驱动。

- **默认配置文件路径**：`~/.config/kitty/kitty.conf`

如果初次使用时该文件尚不存在，可以手动创建目录与配置文件：

```bash
mkdir -p ~/.config/kitty
touch ~/.config/kitty/kitty.conf
```

### 快捷重载配置

在 Kitty 运行期间，修改了 `kitty.conf` 后无需重启终端：

- **macOS 默认快捷键**：`Ctrl + Cmd + ,`
- 或者使用：`kitty_mod + F5`（默认 `kitty_mod` 为 `Ctrl + Shift`）

按下后 Kitty 会立即重新加载大部分配置项并生效。

> [!TIP] 快速打开配置文件
> 在 Kitty 中直接按下快捷键 `Cmd + ,`（相当于大多数 macOS 应用的“偏好设置”），Kitty 会自动用系统默认文本编辑器（或 `$EDITOR`）打开 `kitty.conf`。

---

## 3. 字体配置

终端最重要的体验之一就是字体渲染和图标对齐。Kitty 对字体的控制非常细致。

### 3.1 查看系统已安装的等宽字体

在终端中运行 Kitty 自带的字体列表命令：

```bash
kitty +list-fonts --psnames
```

输出中会列出当前系统所有可用字体的 PostScript 名称和家族名称，方便直接复制到配置中。

### 3.2 配置主字体与字号

在 `~/.config/kitty/kitty.conf` 中添加：

```conf
# 主字体（推荐使用带 Nerd Font 补丁的等宽字体，如 JetBrainsMono Nerd Font）
font_family      JetBrainsMono Nerd Font Mono
bold_font        auto
italic_font      auto
bold_italic_font auto

# 字体大小（单位：pt）
font_size 14.0

# 行高与字间距微调（百分比或具体数值，例如 110% 带来更舒适的代码阅读感）
modify_font cell_height 110%
modify_font cell_width 100%
```

### 3.3 中文字体与符号回退（Fallback）

如果你希望英文使用 JetBrains Mono，而中文回退到系统优雅的苹方或思源黑体，可以使用 `symbol_map` 指定字符区间的渲染字体：

```conf
# 将中文字符区间映射到 PingFang SC（苹方）
symbol_map U+4E00-U+9FFF,U+3400-U+4DBF,U+20000-U+2A6DF PingFang SC Regular
```

### 3.4 动态调整字号快捷键

日常使用时如果需要临时放大看代码或投影演示，可使用以下快捷键：

| 快捷键 | 功能说明 |
| :--- | :--- |
| `Cmd + +` 或 `Cmd + =` | 放大字号 |
| `Cmd + -` | 缩小字号 |
| `Cmd + 0` 或 `Cmd + Backspace` | 恢复为配置文件中的默认字号 |

---

## 4. 外观与主题设置

### 4.1 交互式主题选择器

Kitty 内置了主题管理工具 `kitten themes`。直接在 Kitty 终端中执行：

```bash
kitten themes
```

屏幕会展示一个全功能的交互式列表，使用方向键上下移动可以**实时预览**每个主题（如 Catppuccin, Gruvbox, Tokyo Night, Dracula, Nord 等），按下回车即可自动将选中主题写入或引入到配置中。

### 4.2 窗口样式与毛玻璃透明效果 (macOS)

为了融入 macOS 的设计风格，可开启窗口透明与毛玻璃背景：

```conf
# 窗口背景不透明度（0.0 ~ 1.0）
background_opacity 0.92

# 背景毛玻璃模糊强度（macOS 支持）
background_blur 25

# 隐藏 macOS 原生标题栏，保留左上角红绿灯（让界面极简一体化）
hide_window_decorations titlebar-only

# 终端内边距（上下左右留白，单位像素）
window_padding_width 12 14
```

---

## 5. 常用快捷键与操作

在 macOS 上，Kitty 默认支持大量的 `Cmd` 快捷键，同时也保留了 Kitty 默认的 `kitty_mod`（默认是 `Ctrl + Shift`）。

### 5.1 窗口管理（Panes / Windows）

Kitty 原生支持分屏，不需要依赖 tmux 就能完成简单的多任务管理。

| 快捷键 | 功能说明 |
| :--- | :--- |
| `Cmd + Enter` | 在当前窗口中拆分新建一个窗口（水平或垂直视布局而定） |
| `Cmd + w` | 关闭当前聚焦的窗口（分屏） |
| `kitty_mod + ]` / `kitty_mod + [` | 在已打开的分屏窗口之间切换焦点 |
| `kitty_mod + l` | 切换分屏布局模式（如 splits, tall, fat, grid, stack） |
| `kitty_mod + r` | 进入窗口尺寸调整模式（方向键微调大小，按 ESC 退出） |

> [!TIP] 单窗口最大化
> 按下 `kitty_mod + z` 可以将当前光标所在的窗格放大到全屏（Stack 模式），再按一次恢复多窗格，在需要专注看长日志时非常方便。

### 5.2 标签页管理（Tabs）

| 快捷键 | 功能说明 |
| :--- | :--- |
| `Cmd + t` | 新建标签页 |
| `Cmd + Shift + w` | 关闭当前标签页 |
| `Cmd + Shift + [` / `Cmd + Shift + ]` | 切换到上一个 / 下一个标签页 |
| `Cmd + 1` ~ `Cmd + 9` | 直接跳转到对应的第 N 个标签页 |
| `kitty_mod + alt + t` | 为当前标签页设置自定义标题 |

### 5.3 滚屏与历史搜索

| 快捷键 | 功能说明 |
| :--- | :--- |
| `kitty_mod + Up` / `kitty_mod + Down` | 逐行向上 / 向下滚动 |
| `kitty_mod + PageUp` / `kitty_mod + PageDown` | 逐页向上 / 向下滚动 |
| `kitty_mod + Home` / `kitty_mod + End` | 直接跳到缓冲区顶部 / 底部 |
| `kitty_mod + h` | **在 Pager 中浏览历史输出**（非常强大，可在独立的文本视图中搜索和复制历史日志） |

### 5.4 链接与剪贴板

- **复制**：在 macOS 上直接使用标准的 `Cmd + c`（选中文字后）。
- **粘贴**：标准的 `Cmd + v`。
- **点击链接**：按下 `Cmd` 键并用鼠标单击终端内的 URL，会自动在默认浏览器中打开。
- **在键盘模式下拾取链接/哈希**：按下 `kitty_mod + e`，Kitty 会给屏幕上的每个链接和路径标记字母，直接按字母即可快速打开或复制。

---

## 6. 特色功能：图形协议（Kitty Graphics Protocol）

Kitty 最知名的特色之一是其高效的原生终端图形协议，支持直接在终端中显示高分辨率图像。

### 查看图片示例

运行内置的 `icat` 命令：

```bash
kitty +kitten icat /path/to/your/image.png
```

图片将直接以真实分辨率嵌入终端光标处渲染。现代终端文件管理器（如 `yazi`、`ranger`）以及 Neovim 的图片预览插件均能无缝调用该协议。

---

## 7. 开箱即用的 `kitty.conf` 实用模板

将以下内容保存到 `~/.config/kitty/kitty.conf`，即可获得一个外观现代、性能优异的配置起点：

```conf
# ==========================================
# 字体设置
# ==========================================
font_family      JetBrainsMono Nerd Font Mono
bold_font        auto
italic_font      auto
bold_italic_font auto
font_size        14.0

# 优化行高
modify_font cell_height 112%

# ==========================================
# 窗口与外观
# ==========================================
# 留白边距
window_padding_width 12 14

# 隐藏 macOS 标题栏，保留交通灯按钮
hide_window_decorations titlebar-only

# 透明度与毛玻璃效果 (macOS)
background_opacity 0.94
background_blur 25

# 光标样式（block, beam, underline）
cursor_shape beam
cursor_blink_interval 0.5

# 标签栏外观（powerline 风格）
tab_bar_style powerline
tab_powerline_style slanted

# 记住关闭时的窗口大小
remember_window_size  yes
initial_window_width  1000
initial_window_height 650

# ==========================================
# 快捷键与行为
# ==========================================
# 将 Option 键视同 Alt 键处理
macos_option_as_alt yes

# 关闭窗口时不弹出烦人的确认弹窗
confirm_os_window_close 0

# 声音提示静音
enable_audio_bell no

# 支持的窗口布局
enabled_layouts splits,stack,tall,fat
```

保存后按下 `Ctrl + Cmd + ,` 即可立刻体验新配置！
