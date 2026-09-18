---
title: "在 Fcitx5 中安装雾凇拼音与 Easy English，并用 Caps Lock 切换"
date: 2026-09-18
draft: true
toc: true
tags: ["Linux", "Fcitx5", "Rime", "Hyprland", "输入法"]
categories: ["工具"]
---

我在 Arch Linux、Hyprland 和 Fcitx5 上使用两套 Rime 输入方案：写中文用[雾凇拼音](https://github.com/iDvel/rime-ice)自带的小鹤双拼 `double_pinyin_flypy`，写代码和英文用 [Easy English](https://github.com/BlindingDark/rime-easy-en) 的独立方案 `easy_en`。按一次 Caps Lock 切到另一套方案，再按一次切回来。

这里的“雾凇拼音”是配置仓库的名字；`rime_ice` 是其中的全拼方案，小鹤双拼的方案 ID 是 `double_pinyin_flypy`。如果你想在全拼和英文之间切换，文末说明了需要改哪一行。

Caps Lock 切换的是**输入方案**，Rime 方案内部的**中英切换**是另一套机制，默认挂在左 Shift 上。最后一节说明怎么把它改到右 Shift，并让 Ctrl+Space 也做同样的事。

## 安装 Fcitx5 与 Rime

本机使用的包是 `fcitx5`、`fcitx5-rime` 和 `librime`。`jq` 供后面的切换脚本解析 D-Bus 输出。

```bash
sudo pacman -S --needed git fcitx5 fcitx5-rime librime jq
```

在 Fcitx5 的输入法列表中加入 `Rime`。我的 `~/.config/fcitx5/profile` 同时保留 `keyboard-us` 和 `rime`，默认输入法设为 `rime`。Hyprland 的启动配置运行 `fcitx5 -d`。

## 下载雾凇拼音

Fcitx5-Rime 在这台机器上的用户目录是 `~/.local/share/fcitx5/rime`。如果该目录已经存在，先移走它；其中可能有个人词库，不要直接覆盖。

```bash
fcitx5-remote -e
rime_dir="$HOME/.local/share/fcitx5/rime"
mkdir -p "$(dirname "$rime_dir")"

if test -e "$rime_dir"; then
  mv "$rime_dir" "$rime_dir.backup.$(date +%Y%m%d-%H%M%S)"
fi

git clone --depth 1 https://github.com/iDvel/rime-ice.git "$rime_dir"
```

我安装时克隆到的雾凇拼音提交是 `59fcb4a`（2026-09-14）。之后可运行 `git -C "$rime_dir" log -1 --oneline` 查看自己的版本。

重新克隆前，本机的旧版本是 `6319944`。它的 `lua/search.lua` 在 Lua 5.5 下报过 `attempt to assign to const variable 'i'`，导致输入中文时没有候选；[rime-ice issue #1502](https://github.com/iDvel/rime-ice/issues/1502)记录了相同错误。新版脚本已修复，我用 `find "$rime_dir/lua" -type f -name '*.lua' -print0 | xargs -0 -n1 luac -p` 检查过语法。

## 下载并安装 Easy English

Easy English 的仓库也放在 `rime` 目录下，方便以后更新源码。Rime 只会从用户目录根部加载方案文件，因此还要按照项目的[手动安装说明](https://github.com/BlindingDark/rime-easy-en#手动安装-easy_en)，把四个文件复制到指定位置。

```bash
rime_dir="$HOME/.local/share/fcitx5/rime"
cd "$rime_dir"
git clone --depth 1 https://github.com/BlindingDark/rime-easy-en.git rime-easy-en

cp rime-easy-en/easy_en.schema.yaml \
   rime-easy-en/easy_en.dict.yaml \
   rime-easy-en/easy_en.yaml .
mkdir -p lua
cp rime-easy-en/lua/easy_en.lua lua/
```

我安装时 Easy English 的提交是 `54a4a07`（2025-02-28）。`rime-easy-en/` 是源码仓库；根目录中的 `easy_en.schema.yaml`、`easy_en.dict.yaml`、`easy_en.yaml`，以及 `lua/easy_en.lua` 才是 Rime 实际读取的文件。

## 配置输入方案

新建 `~/.local/share/fcitx5/rime/default.custom.yaml`。这份配置保留了原有方案，并增加 `easy_en`。`Ctrl+Shift+1` 是我另外设置的“切到最近使用的另一个方案”快捷键；Caps Lock 的固定两方案切换由后面的脚本负责。

```yaml
patch:
  schema_list:
    - schema: melt_eng
    - schema: easy_en
    - schema: double_pinyin_flypy
    - schema: rime_ice
    - schema: t9
    - schema: double_pinyin
    - schema: double_pinyin_abc
    - schema: double_pinyin_mspy
    - schema: double_pinyin_sogou
    - schema: double_pinyin_ziguang
    - schema: double_pinyin_jiajia
  "key_binder/bindings/@before 0":
    when: always
    accept: Control+Shift+1
    select: .next
  "key_binder/bindings/@before 1":
    when: always
    accept: Control+Shift+exclam
    select: .next
```

Easy English 默认启用连续输入增强，但其 Lua 过滤器需要额外的 `wordninja` 模块。这台机器没有安装该模块。我只使用独立英文候选，所以创建 `~/.local/share/fcitx5/rime/easy_en.custom.yaml` 关闭该增强：

```yaml
patch:
  "engine/filters":
    - uniquifier
```

这不会移除英文词典；输入 `hello` 仍会出现英文候选。若以后要使用自动分词和连续输入增强，需要按 Easy English 的 README 安装 `wordninja`，再移除这段过滤器补丁。

## 部署 Rime

文件放好后编译方案，并选中 `easy_en`。`rime_deployer --set-active-schema` 在 Rime 用户目录下运行。

```bash
rime_dir="$HOME/.local/share/fcitx5/rime"
rime_deployer --build "$rime_dir" /usr/share/rime-data "$rime_dir/build"

cd "$rime_dir"
rime_deployer --set-active-schema easy_en
fcitx5-remote -e
sleep 1
fcitx5 -d
```

部署后，`build/easy_en.schema.yaml`、`build/easy_en.table.bin` 和 `build/easy_en.prism.bin` 应当存在。输入 `hello` 可以测试英文候选。`F4` 可以打开 Rime 方案菜单，手动选择小鹤双拼或其他方案。

## 用 Caps Lock 固定切换英文和小鹤双拼

我原来的 Caps Lock 是 Compose 键：`~/.config/hypr/input.conf` 中设置了 `kb_options = compose:caps`。要让它只负责切换输入方案，改为：

```ini
input {
  kb_layout = us
  kb_options = caps:none
  # 其他现有设置保持原样
}
```

`caps:none` 会取消 Caps Lock 原来的大小写锁定及 Compose 行为。在我的 US 键盘映射中，物理 Caps Lock 的 XKB keycode 是 `66`。禁用后它的键名变成 `VoidSymbol`，所以 Hyprland 绑定使用 `code:66`，不依赖键名。可用 `xkbcli compile-keymap --layout us --options caps:none` 检查当前系统的映射。

把下面的脚本保存为 `~/.local/bin/rime-toggle-easy-en-flypy`：

```bash
#!/usr/bin/env bash
set -euo pipefail

english_schema=easy_en
chinese_schema=double_pinyin_flypy
rime_service=org.fcitx.Fcitx5
rime_object=/rime
rime_interface=org.fcitx.Fcitx.Rime1

/usr/bin/fcitx5-remote -o >/dev/null
/usr/bin/fcitx5-remote -s rime >/dev/null

current_schema=$(
  /usr/bin/busctl --user --json=short call \
    "$rime_service" "$rime_object" "$rime_interface" GetCurrentSchema \
    | /usr/bin/jq -er '.data[0]'
)

if [[ "$current_schema" == "$english_schema" ]]; then
  next_schema=$chinese_schema
else
  next_schema=$english_schema
fi

/usr/bin/busctl --user call \
  "$rime_service" "$rime_object" "$rime_interface" SetSchema s "$next_schema" >/dev/null
/usr/bin/busctl --user call \
  "$rime_service" "$rime_object" "$rime_interface" SetAsciiMode b false >/dev/null
```

让它可以执行：

```bash
chmod 755 ~/.local/bin/rime-toggle-easy-en-flypy
bash -n ~/.local/bin/rime-toggle-easy-en-flypy
```

最后在 `~/.config/hypr/bindings.conf` 添加：

```ini
bindd = , code:66, Toggle Rime Easy English and Flypy, exec, /home/rainboy/.local/bin/rime-toggle-easy-en-flypy
```

这里的绝对路径是我的用户名；在其他机器上要替换成自己的路径。Hyprland 的[按键绑定文档](https://wiki.hypr.land/0.54.0/Configuring/Binds/)也说明了不带修饰键的绑定及 `code:` 写法。

重载并检查配置：

```bash
hyprctl reload
hyprctl configerrors
hyprctl binds -j | jq '.[] | select(.keycode == 66)'
```

我的 `hyprctl configerrors` 没有报错，绑定列表显示 `keycode: 66` 指向上述脚本。脚本连续运行两次时，Rime 方案依次从 `double_pinyin_flypy` 切到 `easy_en`，再切回小鹤双拼。实际按键也应在输入框中做一次往返测试。

如果想用雾凇**全拼**代替小鹤双拼，只需把脚本中的 `chinese_schema=double_pinyin_flypy` 改成 `chinese_schema=rime_ice`，保存即可；不需要重新部署 Rime。

## 把中英切换改到右 Shift，并让 Ctrl+Space 也能切换

上一节让 Caps Lock 在**两套方案之间**切换。这一节处理另一件事：当前方案内部的**中英（ascii_mode）切换**。雾凇拼音默认用左 Shift 切换中英，我想换成右 Shift，把左 Shift 让给 Shift+方向键移动拼音光标这类操作。

### 改哪一行

要改的是 `~/.local/share/fcitx5/rime/default.yaml` 里的 `ascii_composer`，第 72–79 行：

```yaml
ascii_composer:
  good_old_caps_lock: true  # true | false
  switch_key:
    Caps_Lock: clear      # commit_code | commit_text | clear
    Shift_L: commit_code  # ← 现在左 Shift 切换中英
    Shift_R: noop         # ← 现在右 Shift 被屏蔽
    Control_L: noop
    Control_R: noop
```

把这两行互换：

```yaml
    Shift_L: noop
    Shift_R: commit_code
```

`commit_code` 表示按下 Shift 时先把已输入的编码原样上屏，再切到英文，也就是雾凇拼音原本的行为。想改成“上屏拼出的词句”就写 `commit_text`，其他可选值见同文件第 62–70 行的注释。`noop` 只是屏蔽这个键的切换功能，左 Shift 的其他用途不受影响。

### 再加一个 Ctrl+Space

同一份 `default.yaml` 的 `key_binder/bindings`，第 241 行：

```yaml
    # Ctrl+Space 与右 Shift 一样切换中英（Shift_R 在 ascii_composer 里，见文件开头）
    - { when: always, toggle: ascii_mode, accept: Control+space }              # 切换中英
```

### 为什么 Control+space 不能写进 switch_key

一开始我想把 Ctrl+Space 直接加到 `switch_key` 里，结果不行。librime 加载 `switch_key` 时会拒绝带修饰键的写法，[`ascii_composer.cc`](https://github.com/rime/librime/blob/master/src/rime/gear/ascii_composer.cc) 的 `load_bindings()` 里有这么一段：

```cpp
if (!ke.Parse(it->first) || ke.modifier() != 0) {
  LOG(WARNING) << "invalid ascii mode switch key: " << it->first;
  continue;
}
```

`modifier() != 0` 会把 `Control+space` 判为非法并跳过，只在日志里留一条 WARNING。所以 `switch_key` 只能填单个修饰键（`Shift_L`、`Control_R` 之类），组合键必须走 `key_binder`。

`key_binder` 能安全接收这个键：它在 `engine.processors` 里的位置排在 `ascii_composer` 之后。引擎遍历处理器时，只有 `kRejected` 会中断链条，`kNoop` 会继续往下传：

```cpp
for (auto& processor : processors_) {
  ret = processor->ProcessKeyEvent(key_event);
  if (ret == kRejected)
    break;
  if (ret == kAccepted)
    return true;
}
```

而 `ascii_composer` 碰到 `Control+space` 正好返回 `kNoop`（它的提前返回条件是 `ctrl || alt || super || (shift && space)`），所以事件会继续传给 `key_binder`。

另一个容易撞车的地方是 Fcitx5 自己也有 Ctrl+Space。不过它要求当前输入法组里有不止一个输入法才生效，而我的 `~/.config/fcitx5/profile` 里只有 `rime` 一个，所以这个键是空的，能落到 Rime 手上。

### 两种写法的行为并不完全一样

`Shift_R: commit_code` 和 `toggle: ascii_mode` 看似都是“切换中英”，但有一个区别：前者切换前会把已输入的编码**原样上屏**，后者只是翻转开关。所以打字打到一半按 Ctrl+Space，未上屏的编码会被丢弃；按右 Shift 则会先上屏再切。

这是配置项能力的上限。`key_binder` 支持的动作用只有 `send`、`send_sequence`、`toggle`、`set_option`、`unset_option`、`select`，没有 `commit_code`。要完全一致得自己写 Lua processor。

### 为什么直接改 default.yaml

`build/default.yaml` 是部署时生成的副本，改它会在下次部署时被覆盖，所以只改仓库根目录的 `default.yaml`。

另一种做法是写进 `default.custom.yaml` 的 patch，但 `ascii_composer` 是映射，必须写完整的路径：

```yaml
patch:
  "ascii_composer/switch_key/Shift_R": commit_code
```

我用 `rime_deployer --build` 实测过嵌套写法（`ascii_composer:` 下面再缩进 `switch_key:`），它会把整个 `ascii_composer` 节点替换掉，合并结果里只剩 `Shift_R` 一项，`good_old_caps_lock` 和 `Caps_Lock` 全部丢失。补丁适合覆盖单个键，整体改动直接改 `default.yaml` 更清楚。

### 重新部署

改完源文件要重新编译，再让 Fcitx5 重新加载。这两步是分开的，我实测了四种触发方式：

```bash
rime_dir="$HOME/.local/share/fcitx5/rime"
rime_deployer --build "$rime_dir" /usr/share/rime-data "$rime_dir/build"
```

| 操作 | 是否让 Rime 重读 `default.yaml` |
| --- | --- |
| `rime_deployer --build` | 是，重新生成 `build/` |
| 重启 Fcitx5（`fcitx5 -r -d`） | 是 |
| `busctl --user call org.fcitx.Fcitx5 /controller org.fcitx.Fcitx.Controller1 ReloadAddonConfig s rime` | 是 |
| `fcitx5-remote -r` | **否** |

最后一行是重点。`fcitx5-remote -r` 只重读 Fcitx5 的全局配置，不会让 Rime 重新加载 `build/`。看 [fcitx5-rime 的源码](https://github.com/fcitx/fcitx5-rime/blob/master/src/rimeengine.cpp)，`RimeEngine::reloadConfig()` 读的是 `conf/rime.conf` 并调用 `updateConfig()`；而全局配置重载事件的处理函数只调了 `refreshSessionPoolPolicy()`：

```cpp
globalConfigReloadHandle_ = instance_->watchEvent(
    EventType::GlobalConfigReloaded, EventWatcherPhase::Default,
    [this](Event &) { refreshSessionPoolPolicy(); });
```

所以改完 `default.yaml` 只跑 `-r` 是没用的，这点和不少教程写的不一样。我验证的方式是：往 `default.yaml` 追加一行注释，记录 `build/default.yaml` 的修改时间，再分别执行上述命令，只有前三行会让 `build/` 的时间戳更新。

最省事的组合是重新部署加重启：

```bash
rime_dir="$HOME/.local/share/fcitx5/rime"
rime_deployer --build "$rime_dir" /usr/share/rime-data "$rime_dir/build"
fcitx5 -r -d
```

部署后确认内容已经落到产物里：

```bash
sed -n '/^ascii_composer/,/^config_version/p' "$rime_dir/build/default.yaml"
grep -n 'Control+space' "$rime_dir/build/default.yaml"
```

第二条应当输出一行 `{accept: "Control+space", toggle: ascii_mode, when: always}`。顺便可以确认 `build/` 下所有方案文件都带上了这条绑定：

```bash
grep -c 'Control+space' "$rime_dir"/build/*.schema.yaml
```

我的输出是 12 个方案各命中一次。

### 一个已知缺陷

`ascii_composer` 内部只用一个 `shift_key_pressed_` 布尔量记录“Shift 被按下”，不区分左右。看 [librime 的源码](https://github.com/rime/librime/blob/master/src/rime/gear/ascii_composer.cc)，按下和抬起时都会分别检查 `XK_Shift_L` 和 `XK_Shift_R`，但中间状态是共享的，于是出现这样的问题：配置 `Shift_L: noop`、`Shift_R: commit_code` 之后，按住左 Shift 再按 `'` 输入配对引号，中英仍会被切换。[librime issue #1116](https://github.com/rime/librime/issues/1116) 记录了同样的现象，修复用的 [PR #1228](https://github.com/rime/librime/pull/1228) 至今没有合并。

我核对了 librime 1.12.0 到 1.17.0（本机版本）以及 master 的 `ascii_composer.cc`，这段逻辑一直是共享变量，没有变化。好在这个缺陷只影响“按住 Shift 打符号”这类操作，单击 Shift 切换中英是准的。

## 检查当前状态

```bash
fcitx5-remote       # 2 表示 Fcitx 已启用
fcitx5-remote -n    # 应显示 rime
busctl --user call org.fcitx.Fcitx5 /rime org.fcitx.Fcitx.Rime1 GetCurrentSchema
busctl --user call org.fcitx.Fcitx5 /rime org.fcitx.Fcitx.Rime1 IsAsciiMode
```

第三条命令会显示当前 Rime 方案 ID，例如 `s "easy_en"`；第四条返回 `b false` 表示当前是中文模式，`b true` 表示英文模式。Caps Lock 负责在两个方案间切换，右 Shift 和 Ctrl+Space 负责切换中英，`F4` 仍能打开完整方案菜单。

`SetAsciiMode b false` 就是前面切换脚本最后调用的方法：切到英文方案后顺手把 ascii_mode 复位，避免停在英文模式。
