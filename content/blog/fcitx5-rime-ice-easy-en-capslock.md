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

## 检查当前状态

```bash
fcitx5-remote       # 2 表示 Fcitx 已启用
fcitx5-remote -n    # 应显示 rime
busctl --user call org.fcitx.Fcitx5 /rime org.fcitx.Fcitx.Rime1 GetCurrentSchema
```

第三条命令会显示当前 Rime 方案 ID，例如 `s "easy_en"`。Caps Lock 负责在两个方案间切换，`F4` 仍能打开完整方案菜单。
