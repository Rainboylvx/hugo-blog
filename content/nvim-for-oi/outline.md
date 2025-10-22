---
title: "outline"
date: 2025-09-24
draft: true
toc: true
tags: ["nvim","oi"]
categories: [""]
---

好的，你正在寻找的这类插件通常被称为“符号大纲” (Symbol Outline) 或“符号树” (Symbol Tree)。它们利用 Neovim 的 LSP (Language Server Protocol) 功能来获取代码的结构信息。

对于 C++，你需要先确保你的 Neovim 已经配置好了 LSP，并且安装了 C++ 的语言服务器，最常用的是 `clangd`。

这里有几个非常出色的插件可以完美实现你想要的功能，它们都非常接近 VS Code 的大纲视图。

### 👑 首选推荐: symbols-outline.nvim

**链接:** [simrat39/symbols-outline.nvim](https://github.com/simrat39/symbols-outline.nvim)

这可能是最直接、最像 VS Code 大纲的插件。它提供一个侧边栏，用树状结构清晰地展示当前文件中的所有符号（类、函数、变量、宏等），并且点击即可跳转。

**特点:**

  * 非常直观的树状视图。
  * 自动随代码修改而更新。
  * 支持丰富的图标 (需要 `nvim-web-devicons`)。
  * 高度可定制，可以调整位置、宽度等。

**使用 `lazy.nvim` 的安装配置示例:**

```lua
{
  "simrat39/symbols-outline.nvim",
  keys = {
    { "<leader>o", "<cmd>SymbolsOutline<cr>", desc = "Toggle Outline" } 
  },
  config = function()
    require("symbols-outline").setup()
  end,
}
```

  * 上面的配置添加了一个快捷键 `<leader>o` 来打开或关闭大纲侧边栏。

-----

### 🚀 强大备选: aerial.nvim

**链接:** [stevearc/aerial.nvim](https://github.com/stevearc/aerial.nvim)

Aerial 是另一个功能极其强大的大纲插件。它不仅能显示符号，还能与 `nvim-navic` (一个在顶部显示当前代码上下文的插件) 等工具集成，提供更丰富的导航体验。

**特点:**

  * 支持多种后端（LSP, Treesitter），信息更全面。
  * UI 高度可定制，可以作为侧边栏或浮动窗口。
  * 可以显示代码的层级结构，非常适合大型项目。
  * 过滤和排序功能强大。

**使用 `lazy.nvim` 的安装配置示例:**

```lua
{
  "stevearc/aerial.nvim",
  -- 可选依赖，但强烈推荐
  dependencies = {
     "nvim-treesitter/nvim-treesitter",
     "nvim-tree/nvim-web-devicons"
  },
  keys = {
    { "<leader>o", "<cmd>AerialToggle<cr>", desc = "Toggle Outline" }
  },
  config = function()
    require('aerial').setup({
      -- 你可以在这里进行各种定制
      -- 比如，默认在打开文件时自动打开 aerial
      -- on_attach = function(bufnr)
      --   vim.api.nvim_create_autocmd("BufEnter", {
      --     buffer = bufnr,
      --     callback = function()
      --       require("aerial").open({focus = false})
      --     end
      --   })
      -- end
    })
  end,
}
```

-----

### 🚁 轻量备选: Telescope (内置功能)

如果你已经在使用 [nvim-telescope/telescope.nvim](https://github.com/nvim-telescope/telescope.nvim)，你其实已经有了一个轻量级的大纲功能，它不是一个持久的侧边栏，而是一个可以随时呼出的浮动搜索框。

**如何使用:**
在普通模式下，直接输入命令：

```
:Telescope lsp_document_symbols
```

这会弹出一个浮动窗口，列出当前文件所有的符号，你可以通过模糊搜索快速定位并跳转。

**特点:**

  * 无需安装额外插件（如果你已安装 Telescope）。
  * 利用 Telescope 强大的模糊搜索和预览功能。
  * 更适合“用完即走”的快速跳转场景。

**建议为它绑定一个快捷键:**

```lua
-- 在你的 Telescope 配置或键位配置文件中
keys = {
  { 
    "<leader>os", -- 'o' for outline, 's' for symbols
    "<cmd>Telescope lsp_document_symbols<cr>", 
    desc = "Outline Symbols" 
  },
}
```

### 总结与如何选择

| 插件 | UI 风格 | 优点 | 适合场景 |
| :--- | :--- | :--- | :--- |
| **symbols-outline.nvim** | **侧边栏 (Sidebar)** | **最像 VS Code**，直观易用 | 想要一个固定、常驻的大纲视图来随时查看代码结构的用户。 |
| **aerial.nvim** | **侧边栏 / 浮动窗口** | 功能最强大，高度可定制，集成性好 | 追求极致定制和强大功能，希望大纲能与其他导航工具联动的开发者。 |
| **Telescope** | **浮动搜索框** | 轻量，无需额外插件，搜索驱动 | 习惯使用 Telescope 进行一切操作，喜欢用搜索代替点击，不想要常驻侧边栏的用户。 |

**我的建议是：**

> 如果你刚从 VS Code 转过来，想要最相似的体验，请直接安装 **`symbols-outline.nvim`**。
>
> 如果你是一个喜欢深度定制和折腾的 "Power User"，可以试试 **`aerial.nvim`**。
>
> 如果你崇尚极简，并且是 Telescope 的重度用户，那么使用内置的 `lsp_document_symbols` 就足够了。