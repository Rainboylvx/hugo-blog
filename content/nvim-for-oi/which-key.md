---
title: "which-key"
date: 2025-09-24
draft: true
toc: true
tags: ["nvim","oi"]
categories: [""]
---

## 1. 使用 which-key 最佳实践

当然，使用 `which-key.nvim` 的目标不仅仅是“显示按键”，更是为了构建一个**可发现、有逻辑、易于记忆**的键位系统。以下是一些被广泛认可的最佳实践：

### 1.1. 合理组织你的按键 (Organize Your Keys Logically)

这是最核心的一点。不要随意放置键位，要用分组和助记符来构建你的配置。

  * **使用助记符 (Mnemonics):** 键位的首字母应该和它执行的动作相关联。这使得记忆成本大大降低。

      * `<leader>f` -\> **F**ind (查找)
      * `<leader>g` -\> **G**it (Git 相关)
      * `<leader>b` -\> **B**uffers (缓冲区)
      * `<leader>p` -\> **P**roject (项目)
      * `<leader>t` -\> **T**oggle (切换) or **T**erminal (终端)

  * **创建嵌套分组:** `which-key` 最强大的功能就是分组。将相关的功能组织在一起。

    一个典型的 Git 分组示例：

    ```lua
    {
      "<leader>g",
      group = "Git",
      -- 这个分组的图标
      icon = "",
    },
    { "<leader>gs", "<cmd>Telescope git_status<cr>", desc = "Status" },
    { "<leader>gc", "<cmd>Telescope git_commits<cr>", desc = "Commits" },
    { "<leader>gb", "<cmd>Telescope git_branches<cr>", desc = "Branches" },
    { "<leader>gp", "<cmd>Git push<cr>", desc = "Push" },
    { "<leader>gl", "<cmd>Git pull<cr>", desc = "Pull" },
    ```

    当你按下 `<leader>g` 后，`which-key` 会弹出一个标题为 "Git" 的菜单，里面列出了 Status, Commits, Branches 等选项，非常清晰。

### 1.2. 编写清晰、简洁的描述 (Write Clear and Concise Descriptions)

`desc` 字段是用户看到的提示，它的好坏直接影响体验。

  * **描述“做什么”，而不是“用什么工具”**:

      * **推荐**: `desc = "Find Files"`
      * **不推荐**: `desc = "Telescope find_files"`
        用户关心的是“查找文件”这个动作，而不是背后用的是 Telescope 还是 fzf.vim。

  * **保持简洁**: 菜单空间有限，描述要一目了然。

  * **动词开头**: 尽量使用 "Find", "Go to", "Toggle", "Open", "Format" 等动词开头的描述，表意更明确。

### 1.3. 利用 Lazy Loading (Leverage Lazy Loading)

为了优化 Neovim 的启动速度，你应该尽可能地懒加载插件。`which-key` 与 `lazy.nvim` 插件管理器可以完美配合。

  * **将键位绑定和插件配置放在一起**: 这是现代 Neovim 配置的最佳实践。`lazy.nvim` 允许你使用 `keys` 表来定义键位，这些键位会在你按下时才触发插件加载。`which-key` 会自动识别这些键位。

    ```lua
    -- plugins/telescope.lua
    return {
      "nvim-telescope/telescope.nvim",
      dependencies = { "nvim-lua/plenary.nvim" },
      -- 使用 keys 来定义键位，这会自动实现懒加载
      keys = {
        { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find Files" },
        { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live Grep" },
        { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Find Buffers" },
        -- which-key 会自动把这些键位收集起来并显示
      },
    }
    ```

    这样做的好处是：

    1.  Telescope 不会在启动时加载，只有当你按下 `<leader>ff` 等键时才会加载。
    2.  键位配置和插件本身在一起，方便管理。
    3.  `which-key` 无需额外配置，就能智能地展示这些懒加载的键位。

### 1.4. 分离你的键位配置 (Separate Your Keymap Configurations)

对于不属于任何特定插件的核心键位（例如窗口管理、缓冲区跳转），最好将它们统一放在一个地方。

  * 创建一个专门的文件，例如 `lua/core/keymaps.lua`。
  * 在这个文件中定义你的通用键位绑定。
  * 在你的 `init.lua` 中加载这个文件。

这样可以让你的配置结构更加清晰，易于查找和修改。

```lua
-- lua/core/keymaps.lua
-- 使用 which-key.add() 来注册
local wk = require("which-key")

wk.add({
  { "<leader>w", group = "Window" },
  { "<leader>wv", "<C-w>v", desc = "Split Vertical" },
  { "<leader>ws", "<C-w>s", desc = "Split Horizontal" },
  { "<leader>wc", "<C-w>c", desc = "Close Window" },

  { "<leader>h", "<C-w>h", desc = "Navigate Left" },
  { "<leader>j", "<C-w>j", desc = "Navigate Down" },
  -- ... etc
})
```

### 1.5. 善用高级功能 (Make Good Use of Advanced Features)

  * **图标 (Icons)**: 如果你安装了 `nvim-web-devicons`，可以为分组或单个条目添加图标，让菜单更美观、更具辨识度。
    ```lua
    { "<leader>f", group = "Find", icon = "" }, --    等 Nerd Font 图标
    ```
  * **条件显示 (`cond`)**: 可以根据特定条件决定是否显示某个键位。例如，只在当前缓冲区支持代码格式化时，才显示格式化快捷键。
    ```lua
    {
      "<leader>lf",
      function() vim.lsp.buf.format() end,
      desc = "Format Code",
      -- 仅当 LSP 支持格式化时才显示此按键
      cond = function()
        return vim.lsp.get_active_clients({ bufnr = 0, method = "textDocument/formatting" })[1]
      end
    }
    ```
  * **区分模式 (`mode`)**: 不要忘记为不同的模式（如 Visual 模式 `v`，Insert 模式 `i`）设置不同的键位。`which-key` 同样支持。

### 1.6. 总结

`which-key` 的最佳实践核心思想是\*\*“设计”而非“堆砌”\*\*。一个好的 `which-key` 配置本身就是一份动态、交互式的个人文档，它能引导你更高效地使用 Neovim，并最终帮你把这些键位形成肌肉记忆。

## 2. 定义分组在“共同前缀”上

例子

```lua
-- 在你的 plugins/gitsigns.lua 文件中
return {
  "lewis6991/gitsigns.nvim",
  -- 其他配置...
  keys = {
    -- ↓↓↓ 这就是那个特殊的“显式分组条目” ↓↓↓
    {
      "<leader>g",
      group = "Git", -- 子菜单的标题
      desc = "Git (Gitsigns)", -- 在<leader>菜单中显示的描述
      icon = "", -- Nerd Font 图标 (可选)
      -- 注意: 这里没有第二个元素 (rhs 命令)
    },
    
    -- ↓↓↓ 下面是这个分组里的具体键位 ↓↓↓
    { "<leader>gj", "<cmd>Gitsigns next_hunk<cr>", desc = "Next Hunk" },
    { "<leader>gk", "<cmd>Gitsigns prev_hunk<cr>", desc = "Previous Hunk" },
    { "<leader>gp", "<cmd>Gitsigns preview_hunk<cr>", desc = "Preview Hunk" },
    { "<leader>gs", "<cmd>Gitsigns stage_hunk<cr>", desc = "Stage Hunk" },
    { "<leader>gu", "<cmd>Gitsigns undo_stage_hunk<cr>", desc = "Undo Stage" },
    { "<leader>gr", "<cmd>Gitsigns reset_hunk<cr>", desc = "Reset Hunk" },
  },
}
```
