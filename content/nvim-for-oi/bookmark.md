---
title: "bookmark"
date: 2025-09-24
draft: true
toc: true
tags: ["nvim","oi"]
categories: ["oi"]
---

当然，为代码行添加标记（通常称为“书签”或“Bookmarks”）以便快速导航是一个非常常见的需求。Neovim 不仅有强大的内置标记功能，还有许多优秀的插件可以极大地增强这一体验。

### 1 Neovim 的内置标记 (Built-in Marks)

首先，你需要了解 Neovim 自带的、无需任何插件的标记功能。它非常强大和快速。

  - **文件内标记 (Lowercase Marks):**

      - `m{a-z}`: 在当前光标行创建一个名为 `{char}` 的标记。例如，`ma` 会在当前行创建一个名为 'a' 的标记。这些标记只在当前文件中有效。
      - `` `a `` 或 `'a`: 跳转到标记 'a'。
          - `` `a `` (反引号) 会跳转到标记所在行的**确切光标位置**。
          - `'a` (单引号) 会跳转到标记所在行的**行首**。

  - **全局标记 (Uppercase Marks):**

      - `m{A-Z}`: 创建一个全局标记。例如，`mA`。这些标记在多个文件之间都有效（只要 Neovim 会话还在），并且会记录文件路径。
      - `` `A `` 或 `'A`: 从任何文件跳转到标记 'A' 所在的位置。

  - **查看所有标记:**

      - 输入命令 `:marks` 可以查看所有已设置的标记。

**优点:** 内置，速度极快，无需配置。
**缺点:** 标记是**不可见**的，你必须记住你把哪个标记放在了哪里，或者通过 `:marks` 命令查看。

-----

### 2 插件推荐

为了解决内置标记不可见的问题，社区开发了许多插件，它们通常会在带有标记的行旁边添加一个“符号”或“图标”，并提供更友好的交互方式。

#### 👑 首选推荐: marks.nvim

**链接:** [chentoast/marks.nvim](https://github.com/chentoast/marks.nvim)

这是一个现代化的 Neovim 插件，专门用于**增强内置的 marks 功能**。它会让你的内置标记变得可见，并添加了许多方便的功能，是目前最优雅的解决方案之一。

**特点:**

  * **可视化:** 在行号列或符号列为你设置的标记添加图标。
  * **无缝集成:** 它操作的仍然是 Neovim 的原生 marks，所以你依然可以使用 `ma` 和 `'a` 等命令。
  * **快速导航:** 提供了在标记之间循环跳转的命令。
  * **Telescope 集成:** 可以用 Telescope 模糊搜索并跳转到所有标记。
  * **持久化:** 可以跨会话保存标记。

**使用 `lazy.nvim` 的安装配置示例:**

```lua
{
  "chentoast/marks.nvim",
  event = "BufReadPost", -- 优化启动速度
  config = function()
    require('marks').setup({
      -- 默认标记，你可以自定义
      default_mappings = true,
      -- 你可以在这里进行详细配置
      -- 比如自定义图标、颜色等
    })
  end,
}
```

默认情况下，它会映射一些快捷键，例如：

  * `m,`: 在当前行设置/取消下一个可用标记。
  * `m[` / `m]`: 在标记之间向前/向后跳转。

#### 🚀 流程驱动的选择: harpoon

**链接:** [ThePrimeagen/harpoon](https://github.com/ThePrimeagen/harpoon)

Harpoon 的理念略有不同。它不只是一个简单的书签系统，而是一个面向工作流的“快速访问列表”。你可以把任何文件中的任何位置“钉”到 Harpoon 列表中，然后通过索引或快捷键在这个列表之间快速穿梭。

**特点:**

  * **任务列表:** 非常适合在一个任务中，你需要在几个关键位置之间反复横跳的场景。
  * **UI 菜单:** 提供一个浮动窗口来管理你的 Harpoon 列表。
  * **极其快速:** 切换速度非常快。

**使用 `lazy.nvim` 的安装配置示例:**

```lua
{
  "ThePrimeagen/harpoon",
  branch = "harpoon2", -- 推荐使用 harpoon2 分支
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    local harpoon = require("harpoon")
    harpoon:setup({})

    -- 基础快捷键绑定
    vim.keymap.set("n", "<leader>a", function() harpoon:list():add() end, { desc = "Harpoon add file" })
    vim.keymap.set("n", "<C-e>", function() harpoon.ui:toggle_quick_menu(harpoon:list()) end, { desc = "Harpoon quick menu" })

    vim.keymap.set("n", "<C-h>", function() harpoon:list():select(1) end, { desc = "Harpoon to file 1" })
    vim.keymap.set("n", "<C-t>", function() harpoon:list():select(2) end, { desc = "Harpoon to file 2" })
    vim.keymap.set("n", "<C-n>", function() harpoon:list():select(3) end, { desc = "Harpoon to file 3" })
    vim.keymap.set("n", "<C-s>", function() harpoon:list():select(4) end, { desc = "Harpoon to file 4" })
  end,
}
```

-----

### 总结与如何选择

| 方案 | 哲学 | 优点 | 适合场景 |
| :--- | :--- | :--- | :--- |
| **内置 Marks** | 基础功能 | 零开销，极速 | 临时、一次性的快速跳转，不想安装额外插件。 |
| **marks.nvim** | **增强内置** | **可视化**，功能全面，与原生命令结合好 | 想要一个经典、强大、可视化的“书签”系统，让代码标记一目了然。 |
| **harpoon** | **工作流列表** | 任务导向，在少量固定位置间切换极其高效 | 在重构或调试时，需要在几个（通常是2-5个）关键代码点之间高频切换。 |

**我的建议是：**

> 从 **`marks.nvim`** 开始。它最符合你“添加 mark 并快速跳转”的直接需求，并且通过可视化极大地改进了 Neovim 的原生功能，学习成本很低。
>
> 如果你发现你的工作模式经常是围绕少数几个“热点”位置展开，那么再尝试 **`harpoon`**，它可能会极大地提升你的工作效率。