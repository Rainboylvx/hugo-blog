---
title: "我的 tmux 配置详解：C-s 前缀、无前缀键与编号会话"
date: 2026-09-07
draft: true
toc: true
tags: ["工具", "终端", "tmux"]
categories: ["工具"]
---

之前写过一篇 [tmux 常用快捷键速查](./tmux常用快捷键.md)，讲的是默认 `C-b` 前缀那一套。后来我把整个配置重做了，`~/.tmux.conf` 里改成了 `C-s` 前缀 + 大量"无前缀"直接键，并让会话自动编号为 `1-名称`、`2-名称`。这套配置已经稳定用了很久，这篇把它的设计思路和键位体系完整记下来，方便自己回查，也给想折腾 tmux 的人参考。

## 配置文件与依赖

配置本体是 `~/.tmux.conf`（约 440 行），但大量键位是通过 `run-shell` 调外部脚本来实现的，依赖 `~/.config/tmux/` 下的三个部分（通常软链到 dotfiles 仓库）：

| 路径 | 作用 |
| :--- | :--- |
| `fzf_panes.tmux` | fzf 面板选择器（MRU 排序 + 预览） |
| `scripts/` | 各种功能脚本（分割、移动、监视、编号等） |
| `tmux-status/` | 状态栏渲染脚本（left.sh / right.sh 等） |

> [!WARNING] 只拷贝 `~/.tmux.conf` 不够
> 如果只把这个文件拷走而缺少上面的脚本目录，大量 `bind -n` 无前缀键和钩子都会失效。整套配置是"配置文件 + 脚本"一起工作的。

## 设计思路

配置头部注释把整套思想说得很清楚：

- 前缀键用 `C-s`（替代默认 `C-b`），之后按 `C-s` 再松开可发一个字面 `C-s` 给程序。
- 大量键位采用**无前缀**绑定（`bind -n` = root table，全局直接按），减少按前缀的次数。
- 会话自动编号为 `N-名称`（`1-xxx`、`2-xxx`），用编号即可快速切换/搬移窗口。
- 状态栏左侧 = 会话编号列表，右侧 = git 分支 + 主机 + 时间。

```conf
# 前缀 C-s 意味着终端不能把它当 XOFF 用，否则一按就冻结输出
unbind C-b
set -g prefix 'C-s'
```

> [!TIP] 会话怎么来的
> 这里的"编号会话"不是手动建的，而是新建会话时由 `session_created.sh` 自动把名字改成 `N-xxx` 并保证编号连续（`1-2-3` 不留空）。

## 1. 基础设置

### 通用

| 设置 | 含义 |
| :--- | :--- |
| `set -g mouse on` | 开启鼠标：滚轮、点选 pane、拖拽改大小 |
| `set -s escape-time 0` | 去掉按键延迟，退出 vim 普通模式反应更快 |
| `set -sg repeat-time 300` | 按住可重复执行的按键（如 `C-p`/`C-n` 切窗口） |
| `set -s focus-events on` | 让 tmux 感知焦点进出，配合 `pane-focus-in` 钩子 |
| `set -s extended-keys on` | 开启扩展键盘协议（现代终端真彩/特殊键） |
| `setw -g xterm-keys on` | 识别 `Ctrl+方向键` 等扩展键 |
| `set -g default-shell /bin/zsh` | 新 pane/窗口默认用 zsh |
| `set -g history-limit 10000` | 每个 pane 保留 10000 行滚回 |
| `set -g detach-on-destroy off` | 窗口被销毁时客户端 detach 而非直接关掉 |
| `set -g exit-empty on` | 最后一个 pane 关闭时自动退出该 session |
| `set -g allow-passthrough on` | 允许 DCS 透传（给需要特殊协议的程序用） |

还关掉了三样容易打扰人的监控提示：

```conf
set -g visual-activity off
setw -g monitor-activity off
setw -g monitor-bell off
```

### 环境变量继承

`update-environment` 里的变量会在新建 session 时从宿主环境带进 session，GUI / 输入法 / 字体相关依赖它们：

```conf
set -ga update-environment '\
DISPLAY DBUS_SESSION_BUS_ADDRESS \
QT_IM_MODULE QT_QPA_PLATFORMTHEME \
XDG_CONFIG_HOME XDG_CACHE_HOME XDG_DATA_HOME \
XDG_MENU_PREFIX XDG_RUNTIME_DIR XDG_SESSION_CLASS \
XDG_SESSION_DESKTOP XDG_SESSION_TYPE XDG_CURRENT_DESKTOP \
XMODIFIERS FZF_DEFAULT_OPTS TMUX_THEME_COLOR \
TERM TERM_PROGRAM \
'
```

其中的 `TMUX_THEME_COLOR` 是这套配置的主题色来源：运行时读环境变量缓存到 `@theme_color`，状态栏和边框都用它取强调色。

## 2. Hooks：事件钩子

配置大量使用 set-hook，统一套路是**先 `-gu` 解绑旧的再 `-g` 绑新的**，避免 `tmux source` 重载配置时反复叠加：

| 钩子 | 触发时机 | 做的事 |
| :--- | :--- | :--- |
| `client-attached` | 有客户端接入 | 强制刷新状态栏 |
| `pane-focus-in` | 焦点进入某 pane | 更新 MRU pane 顺序（供 fzf 选择器）、清该窗口 `@unread`/`@watch_failed` 标记、刷新状态栏 |
| `after-select-window` | 切换活动窗口 | 若当前/上级目录有 `on-tmux-window-activate.sh` 则自动执行，并清标记 + 刷新 |
| `session-created` | 新 session 建立 | 调 `session_created.sh` 重新分配编号（保持 1-2-3 连续） |
| `session-renamed` / `session-closed` | 改名/关闭 | 刷新状态栏（更新左侧编号列表） |

清未读标记这步很重要：窗口被标记"未读"后你切过去看过了，图标就该消失。例如 `pane-focus-in` 的后缀追加：

```conf
set-hook -ag pane-focus-in 'run -b "tmux set -wu -t #{window_id} @unread 2>/dev/null || true; tmux set -wu -t #{window_id} @watch_failed 2>/dev/null || true"'
```

启动时还会先手动跑一次编号脚本，把已存在的 session 重新排号：

```conf
run-shell "~/.config/tmux/scripts/session_created.sh"
```

## 3. 窗口与 pane 编号

从 1 开始编号（默认从 0 开始），删除中间窗口后自动重排：

```conf
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
setw -g automatic-rename on
set -g set-titles on
set -g display-panes-time 2000
set -g display-time 2000
```

## 4. 无前缀键位体系

这套配置最大的特点：**能直接按的就不用按前缀**。下面把无前缀键分类整理。

> 以下表格中 `M-` 指 Alt，`前缀 X` 指"先按 `C-s` 再按 X"。

### 4.1 会话管理

| 键位 | 作用 |
| :--- | :--- |
| `M-S` | 在当前会话右侧新建会话并切过去（新会话自动排号） |
| `前缀 C-c` | 新建一个空白 session |
| `M-O` | `break-pane`：把当前 pane 拆出来单独成为一个窗口 |
| `前缀 .` | 重命名当前会话（走编号脚本保持排序） |
| `C-1` ~ `C-9` / `F1` ~ `F5` | 直接切到编号为 N 的会话 |
| `前缀 1` ~ `9` / `0` | 把当前窗口搬到编号为 N 的会话（跨会话移动窗口） |
| `前缀 l` / `y` | 把当前会话在编号序列里向左/右移动一格 |

会话键位和窗口键位是配套的：会话有编号（`C-1`..`C-9` 切会话），窗口也有编号（`M-1`..`M-9` 切窗口），都能一眼定位。

### 4.2 窗口管理

| 键位 | 作用 |
| :--- | :--- |
| `M-o` | 在当前 pane 所在目录**右侧**开一个新窗口 |
| `M-1` ~ `M-9` | 直接跳到第 N 个窗口 |
| `M-l` / `M-y` | 上一个 / 下一个窗口 |
| `M-L` / `M-Y` | 与左边 / 右边相邻窗口交换位置 |
| `前缀 ,` | 重命名当前窗口 |
| `M-Q` | 杀掉当前 pane |
| `M-f` | 放大 / 还原当前 pane（zoom） |

```conf
# M-o 是这套配置开新窗口的主入口
bind -n M-o run-shell "~/.config/tmux/scripts/open_shell_here.sh new-window '#{window_id}' '#{pane_current_path}' -a"
```

`open_shell_here.sh` 保证新窗口/新 pane 都开在当前 pane 的目录下，而不是会话的起始目录——这是多任务时最顺手的细节。

### 4.3 pane 分割与导航

分割键用 `u/e/n/i`，取的是它们的方向语义，和导航键一一对应：

| 键位 | 作用 |
| :--- | :--- |
| `前缀 u` | 向上分割（新 pane 在下侧 `-b`） |
| `前缀 e` | 向下分割 |
| `前缀 n` | 向左分割（`-h -b`） |
| `前缀 i` | 向右分割 |

```conf
bind u run-shell "~/.config/tmux/scripts/open_shell_here.sh split '#{pane_id}' '#{pane_current_path}' -v -b"
bind e run-shell "~/.config/tmux/scripts/open_shell_here.sh split '#{pane_id}' '#{pane_current_path}' -v"
bind n run-shell "~/.config/tmux/scripts/open_shell_here.sh split '#{pane_id}' '#{pane_current_path}' -h -b"
bind i run-shell "~/.config/tmux/scripts/open_shell_here.sh split '#{pane_id}' '#{pane_current_path}' -h"
```

在 pane 间移动则用同样的方向字母：

| 键位 | 作用 |
| :--- | :--- |
| `M-n` / `M-e` / `M-u` / `M-i` | 选择 左/下/上/右 相邻 pane |
| `M-a` | 跳到最左列 pane |
| `M-g` | 跳到右上 pane |
| `M-r` | 跳到右下 pane |

`M-a` / `M-g` / `M-r` 按"屏幕位置"跳转，适合你固定某类 pane 摆右下/右上的习惯布局。

### 4.4 pane 大小调整与交换

| 键位 | 作用 |
| :--- | :--- |
| `M-N` / `M-E` / `M-U` / `M-I` | 向左/下/上/右微调大小 3 格 |
| `前缀 >` / `<` | 当前 pane 与下/上相邻 pane 交换位置 |
| `前缀 \|` | 与另一个 session 的 pane 交换（弹出选择） |

### 4.5 把 pane 并入别的窗口 / 布局

| 键位 | 作用 |
| :--- | :--- |
| `M-!` / `M-@` / `M-#` / `M-$` / `M-%` / `M-^` / `M-&` / `M-*` / `M-(` | 把当前 pane 并入第 1~9 号窗口（join-pane） |
| `前缀 I` / `N` / `U` / `E` | 布局构建器：第一个 pane 放到右/左/上/下，再重组第二个 |
| `前缀 Space` | 两个 pane 时横竖布局来回切换 |
| `前缀 W` | 带预览的窗口/会话浏览树（choose-tree） |
| `前缀 S` / `V` | 在浏览树里选窗口，把当前 pane 纵向/横向搬过去 |

```conf
# join-pane 键位：Shift+数字 就是 ! @ # $ % ^ & * (
bind -n M-! join-pane -t :1
bind -n M-@ join-pane -t :2
```

`前缀 F` 打开 fzf 面板选择器，按 MRU（最近使用）排序并带预览，能直接合并/搬移/杀死 pane：

```conf
bind F run-shell "bash ~/.config/tmux/fzf_panes.tmux new_window"
```

### 4.6 同步输入

`前缀 C-g` 在"所有 pane 同步键盘输入"与关闭之间切换，开启时 pane 边框变红提示：

```conf
bind C-g if-shell '[[ $(tmux showw synchronize-panes | cut -d\  -f2) == "on" ]]' \
'setw synchronize-panes off; set -g pane-border-style fg=...' \
'setw synchronize-panes on; set -g pane-border-style fg=red'
```

## 5. 复制模式与剪贴板

复制模式用 `mode-keys vi`，状态栏用 `mode-keys emacs`：

```conf
set -g status-keys emacs
set -g mode-keys vi
bind -n M-v copy-mode
```

进入复制模式后，方向键同样是 `u↑ e↓ n← i→` 那套（与 vim 的 hjkl 错开，但记忆一致），并按 vim 习惯选择/复制：

| 键位 | 作用 |
| :--- | :--- |
| `M-v` | 直接进入复制模式（可回滚屏幕） |
| `v` | 开始选择 |
| `C-v` | 矩形选择开关 |
| `y` | 复制选中内容进**系统剪贴板**并退出 |
| `Y` | 复制到行尾并退出 |
| `n` / `i` / `u` / `e` | 左 / 右 / 上 / 下移动光标 |
| `h` | 跳到下一个词尾 |
| `N` / `I` | 行首 / 行尾 |
| `U` / `E` | 上移 / 下移 5 行 |
| `C-u` / `C-e` | 上 / 下滚 5 行 |
| `q` | 退出 |

```conf
bind -T copy-mode-vi v send-keys -X begin-selection
bind -T copy-mode-vi C-v send-keys -X rectangle-toggle
bind -T copy-mode-vi y send-keys -X copy-pipe-and-cancel "~/.config/tmux/scripts/copy_to_clipboard.sh"
```

选中内容通过 `copy-pipe-and-cancel` 直接进系统剪贴板（走 `copy_to_clipboard.sh`），不用再管 tmux buffer。

### 系统剪贴板粘贴

无前缀 `C-S-v` / `M-V` 把系统剪贴板内容直接粘进 pane，复制模式里按同样生效（会先退出复制模式再粘贴）：

```conf
bind -n C-S-v run -b "~/.config/tmux/scripts/paste_from_clipboard.sh"
bind -T copy-mode-vi C-S-v send-keys -X cancel \; run -b "~/.config/tmux/scripts/paste_from_clipboard.sh"
```

> [!TIP] tmux 自己的 buffer 也没丢
> `前缀 b` 列出所有 tmux buffer，`前缀 p` 把最近一个 buffer 粘贴出来。复制模式里 `y` 是进系统剪贴板，这里仍保留 tmux 内部 buffer 的入口。

## 6. 未读 / 监视标记

窗口名后面会显示任务状态图标（`window_task_icon.sh` 渲染），配合状态栏：

| 键位 | 作用 |
| :--- | :--- |
| `M-b` | 手动把当前窗口标记"未读"（出 🔔）或取消 |
| `M-w` | 监视当前 pane 跑的命令，结束时弹系统通知；命令退出码非 0 标 ❌；再按一次取消 |

监视逻辑：`M-w` 置上 `@watching` 标记后 `watch_pane.sh` 等该 pane 的进程结束，结束再发系统通知并清标记。这套"窗口内任务状态"是配置里比较复杂的联动：pane 名里的图标 + 边框标题 + 系统通知，都由那几个 `@unread`/`@watching`/`@watch_failed` 窗口选项驱动。

## 7. 主题与状态栏

### pane 边框即状态条

```conf
setw -g pane-border-status top
```

每个 pane 顶部有一条标题栏，内容用 `pane_starship_title.sh` 调用 starship 渲染出"目录 + git 分支 + venv"，zoomed 时加 `⛶`：

```conf
setw -g pane-border-format '#{?pane_active, #[fg=#{@theme_color}]...#1d1f21]#[bold] #{?window_zoomed_flag,⛶ ,} #(~/.config/tmux/scripts/pane_starship_title.sh ...) #[bg=default]... }'
```

活动 pane 边框用强调色，非活动用灰色：

```conf
set -g pane-active-border-style fg=#b294bb
set -g pane-border-style fg=colour244
```

### 底部状态栏

左侧是 `left.sh` 渲染的高亮会话编号列表，右侧是 `right.sh` 渲染的 git 分支 + 主机 + 时间，窗口之间不加分隔符：

```conf
set -g status-interval 1
set -g status-left "#(~/.config/tmux/tmux-status/left.sh #{q:session_id} ...)   "
set -g status-right "#(~/.config/tmux/tmux-status/right.sh ...)"
```

窗口名字末尾由 `window_task_icon.sh` 追加 ⏳/🔔/❌ 图标：

```conf
setw -g window-status-current-format '#[fg=#{@theme_color},bold] #W#(~/.config/tmux/tmux-status/window_task_icon.sh "#{window_id}" "#{@unread}" "#{@watching}" "#{@watch_failed}") '
```

### 真彩支持

```conf
set -g default-terminal "tmux-256color"
set -as terminal-features ",*256col*:RGB"
set -as terminal-overrides ",*256col*:Tc"
```

## 8. 插件（TPM）

用 TPM 管理，装了三个插件，且把安装/更新/清理统一绑到 `M-F12`（避免误触默认的 `prefix I`）：

```conf
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
```

- `tmux-resurrect`：保存 pane 屏幕内容；重启后自动恢复 lazygit / yazi 这类进程。
- `tmux-continuum`：每 5 分钟自动保存一次；恢复是手动（`@continuum-restore off`，不自动 restore）。

配置最后必须 `run '~/.tmux/plugins/tpm/tpm'` 初始化 TPM（放在最底部，插件依赖此项加载）。

## 总结

这套配置的核心不是"记住更多快捷键"，而是把**会话当作一等公民**：编号管理会话、无前缀键直接切窗口/pane、钩子自动维护编号与未读状态，再让 starship + 状态栏把信息一次渲染到位。照着抄的话，记得把 `~/.config/tmux/` 下的脚本一起带走。
