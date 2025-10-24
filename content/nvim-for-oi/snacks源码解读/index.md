---
title: "snacks源码解读"
date: 2025-10-23
draft: false
toc: true
tags: [""]
categories: [""]
---

## 起因 

发现了一个插件 `https://github.com/folke/snacks.nvim` 发现非常适合我,但是在配置的过程中,我发现需要理解并阅读它的源代码,同时我也想知道如何使用lua语言写neovim的插件.

## 准备

根据 [nvim-doc NVIM_APPNAME](https://neovim.io/doc/user/starting.html#%24NVIM_APPNAME),我们可以配置出一个单独的专门使用的配置,和我们的主nvim 配置,进行分离

```bash
# 1. 创建一个用于学习的根目录 (可以放在任何你喜欢的地方)
configPath="~/.config/snacks-learn"
mkdir -p $configPath

# 2. 创建 lazy.vim 需要的配置、数据和状态目录
mkdir -p $configPath/config/nvim
mkdir -p $configPath/data
mkdir -p $configPath/state
mkdir -p $configPath/cache

# 3. 把你的 snacks.nvim 插件克隆到这个目录中 (方便管理)
git clone https://github.com/folke/snacks.nvim.git $configPath/snacks.nvim
```

```bash
# 在.zshrc 中添加
# 告诉 Neovim 使用 'snacks-learn' 作为配置名
# 它会自动查找 $HOME/.config/snacks-learn/init.lua
NVIM_APPNAME=snacks-learn nvim
```

```lua
-- ~/.config/snacks-learn/init.lua

-- =============================================================================
-- 1. 设置 Neovim 的数据、配置、状态等路径
--    使其完全隔离在我们的 ~/snacks-learn 目录中
-- =============================================================================
-- 注意：我们将在启动 nvim 时使用 NVIM_APP_NAME=snacks-learn 环境变量,
-- Neovim 会自动将 stdpath('config') 指向 ~/snacks-learn/config/nvim
-- 我们需要手动设置其他路径，以确保完全隔离

local path = vim.fn.stdpath("config")
vim.env.XDG_DATA_HOME = path .. "/data"
vim.env.XDG_STATE_HOME = path .. "/state"
vim.env.XDG_CACHE_HOME = path .. "/cache"

-- =============================================================================
-- 2. 基本的 Neovim 设置 (QoL)
-- =============================================================================
vim.opt.number = true         -- 显示行号
vim.opt.relativenumber = true -- 显示相对行号
vim.opt.termguicolors = true  -- 启用真彩色
vim.opt.mouse = "a"           -- 启用鼠标
vim.opt.clipboard = "unnamedplus" -- 使用系统剪贴板
vim.opt.swapfile = false      -- 关闭交换文件
vim.opt.backup = false        -- 关闭备份
vim.opt.writebackup = false

-- =============================================================================
-- 3. lazy.vim 插件管理器 - 引导程序
-- =============================================================================
-- local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"

-- 这里没用使用stdpath("data") 而是使用了stdpath("config"),方便我们查看
local lazypath = vim.fn.stdpath("config") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  print("正在克隆 lazy.nvim...")
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://gh-proxy.com/https://github.com/folke/lazy.nvim.git",
    "--branch=stable", -- latest stable release
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- =============================================================================
-- 4. lazy.vim 插件设置
-- =============================================================================
require("lazy").setup({
  -- 这是我们要学习的插件：snacks.nvim
  {
    -- 核心：使用 `dir` 关键字指向你本地克隆的路径
    -- !! 你需要修改这个路径为你克隆 `snacks.nvim` 的实际路径 !!
    dir = os.getenv("HOME") .. "/.config/snacks-learn/snacks.nvim",

    -- `name` 是可选的，但当使用 `dir` 时，它有助于 lazy.nvim 识别插件
    name = "snacks.nvim",

    -- snacks.nvim 的依赖项
    -- lazy.nvim 会自动从 GitHub 下载这些依赖
    dependencies = {
      "nvim-tree/nvim-web-devicons", -- (可选) 用于显示图标
      "rcarriga/nvim-notify",        -- (可选) 用于显示通知
    },

    -- `opts` 表格用于配置 snacks.nvim
    -- 你可以在这里打开/关闭/配置 snacks 的各个模块
    opts = {
      -- 模块白名单，只加载你感兴趣的
      -- 留空 (opts = {}) 来加载所有模块
      modules = {
        "cursor",    -- 高亮光标所在行
        "indent",    -- 缩进线
        "navic",     -- (需要 nvim-navic 插件)
        "notify",    -- (需要 nvim-notify 插件)
        "regex",     -- 正则表达式预览
        "scrollbar", -- 滚动条
        "search",    -- 搜索高亮
      },

      -- ==================
      -- 模块的具体配置示例
      -- ==================

      -- 启用滚动条
      scrollbar = {
        enabled = true,
      },

      -- 启用缩进线
      indent = {
        enabled = true,
        -- 你可以尝试 "conveal" 或 "list" 策略
        -- strategy = "conceal",
      },

      -- 启用光标行高亮
      cursor = {
        enabled = true,
      },
    },

    -- `config` 函数会在插件加载后运行
    -- `snacks.nvim` 会自动调用 `setup(opts)`，所以这里通常是空的
    -- 但你可以用它来添加额外的键位绑定等
    config = function(_, opts)
      require("snacks").setup(opts)

      -- 示例：添加一个键位绑定来切换缩进线
      vim.keymap.set("n", "<leader>ti", function()
        local indent = require("snacks.indent")
        indent.toggle()
        print("缩进线: " .. (indent.is_enabled() and "ON" or "OFF"))
      end, { desc = "[T]oggle [I]ndent guides (Snacks)" })
    end,
  },

  -- snacks.nvim 的依赖项 (lazy.nvim 会自动处理)
  -- 我们不需要在这里再次列出 "nvim-tree/nvim-web-devicons" 和 "rcarriga/nvim-notify"
  -- 因为它们已经在 snacks.nvim 的 `dependencies` 中了。

  -- (可选) 添加一个主题，让界面更好看
  { "folke/tokyonight.nvim" },

})

```
