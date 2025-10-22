---
title: "vim交互"
date: 2025-09-24
draft: true
toc: true
tags: ["nvim"]
---


Interaction


https://neovim.io/doc/user/lua.html#vim.ui.input()



当然有！这是一个非常好的问题，也是 Neovim 区别于传统 Vim 的一大优势。Neovim 提供了多种创建和管理“对话框”或交互式 UI 的方式，从简单的命令行输入到功能强大的浮动窗口应有尽有。

由于 Neovim 是一个终端应用（TUI），它的“对话框”通常以**浮动窗口**或**命令行提示**的形式出现。

下面我将为你介绍三种由浅入深、最主流的实现方式：

1.  **标准 API (`vim.ui`)**: 最简单、最标准的交互方式。
2.  **美化插件 (`dressing.nvim`)**: 让标准 API 的对话框变得非常漂亮。
3.  **UI 库 (`nui.nvim`)**: 完全从零开始构建你自己的、复杂的对话框。

---

### 方式一：使用标准 `vim.ui` API

Neovim 提供了一套标准的、可被插件覆盖的 UI 接口：`vim.ui.input()` 和 `vim.ui.select()`。这是编写交互功能的**首选方式**，因为它具有最好的兼容性。

#### 1. `vim.ui.input()` - 获取用户文本输入

这个函数会弹出一个提示，让用户输入一段文本。

**示例：** 创建一个命令，询问你的名字，然后打印欢迎信息。

```lua
-- 你可以把这个函数放在你的任意配置文件中
function AskNameAndGreet()
  vim.ui.input({ prompt = "What is your name? " }, function(name)
    if name then
      vim.notify("Hello, " .. name .. "!", vim.log.levels.INFO)
    else
      vim.notify("Greeting cancelled.", vim.log.levels.WARN)
    end
  end)
end

-- 创建一个用户命令来调用这个函数
vim.api.nvim_create_user_command("Greet", AskNameAndGreet, {})
```

**如何使用：**
1.  将上述代码添加到你的配置中（例如 `init.lua`）。
2.  重启 Neovim。
3.  在命令模式下输入 `:Greet` 并回车。

默认情况下，这会在命令行显示一个简单的输入提示。

#### 2. `vim.ui.select()` - 让用户从列表中选择

这个函数会显示一个列表，让用户选择其中一项。

**示例：** 创建一个命令，让你选择一个编程语言，然后告诉你你的选择。

```lua
function ChooseLanguage()
  local items = { "C++", "Rust", "Lua", "TypeScript" }
  vim.ui.select(items, { prompt = "Choose your favorite language:" }, function(choice)
    if choice then
      vim.notify("You chose: " .. choice)
    else
      vim.notify("Selection cancelled.")
    end
  end)
end

vim.api.nvim_create_user_command("ChooseLang", ChooseLanguage, {})
```

**如何使用：**
1.  将代码加入配置并重启。
2.  输入 `:ChooseLang` 并回车。

默认情况下，这会在命令行显示带编号的选项列表。

> **重点**：`vim.ui` 的美妙之处在于，它的外观是可以被其他插件“美化”的。接下来我们看如何做到。

---

### 方式二：使用 `dressing.nvim` 升级对话框外观

`dressing.nvim` 是一个“胶水”插件，它的唯一作用就是将 `vim.ui.input` 和 `vim.ui.select` 的请求，转发给其他更美观的 UI 插件，比如 `Telescope`、`fzf-lua` 或者它自己内置的漂亮浮动窗口。

**这是实现漂亮对话框最简单、最推荐的方式。**

**配置 (`lazy.nvim`):**

```lua
-- lua/plugins/dressing.lua
return {
  "stevearc/dressing.nvim",
  event = "VeryLazy",
  opts = {
    -- backend = { "telescope", "fzf_lua", "fzf", "builtin", "nui" }, -- 你可以指定后端的优先级
    input = {
      -- 使用内置的漂亮浮动窗口作为输入框
      backend = "builtin",
    },
    select = {
      -- 使用内置的浮动窗口作为选择器
      backend = "builtin",
      -- 如果你更喜欢 Telescope，可以这样设置：
      -- backend = "telescope",
    },
  },
}
```

**效果：**
安装并配置好 `dressing.nvim` 后，你**不需要修改任何代码**。再次运行 `:Greet` 或 `:ChooseLang` 命令，你会发现原来的命令行提示变成了一个居中的、带边框的漂亮浮动窗口！

![Dressing.nvim
Example](https://user-images.githubusercontent.com/506791/148731388-e218861c-8472-4d7a-b586-2a7bd4c8449c.png)

---

### 方式三：使用 `nui.nvim` 构建完全自定义的对话框

当你需要构建一个非标准的、布局复杂的对话框时（例如，一个包含多个输入框和按钮的窗口），`nui.nvim` 就是你的终极武器。它是一个底层的 UI 组件库，让你像拼乐高一样组合出任意界面。

`dressing.nvim` 的 `builtin` 后端就是基于 `nui.nvim` 构建的。

**示例：** 创建一个简单的带边框和标题的浮动窗口。

这是一个更底层的 API，代码会相对复杂一些。

```lua
function ShowCustomDialog()
  local nui = require("nui")
  local Popup = nui.require("nui.popup")

  local popup = Popup({
    enter = true,        -- 创建后立即进入
    focusable = true,    -- 可聚焦
    border = {
      style = "rounded", -- 圆角边框
      text = {
        top = " My Custom Dialog ",
        top_align = "center",
      },
    },
    position = "50%",    -- 水平居中
    size = {
      width = "80%",
      height = "60%",
    },
  })

  -- 挂载 UI 组件，使其显示出来
  popup:mount()

  -- 当窗口关闭时，卸载它以释放资源
  popup:on("BufLeave", function()
    popup:unmount()
  end)
end

vim.api.nvim_create_user_command("CustomDialog", ShowCustomDialog, {})
```

**如何使用：**
1.  确保你已安装 `nui.nvim` (`dressing.nvim` 会自动安装它作为依赖）。
2.  将代码加入配置并重启。
3.  输入 `:CustomDialog` 即可看到一个空的、自定义样式的浮动窗口。你可以在此基础上添加更多组件。

### 总结与推荐

| 方法 | 优点 | 缺点 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **`vim.ui` API** | **标准、可移植、简单** | 默认外观简陋 | **编写所有交互逻辑的首选。** |
| **`dressing.nvim`** | **配置简单、效果立竿见影** | 依赖其他插件 | **让 `vim.ui` 变漂亮的“一劳永逸”方案。** |
| **`nui.nvim`** | **极其灵活，完全控制 UI** | API 相对复杂，代码量大 | 编写插件，或需要高度自定义的复杂对话框。 |

**我的建议是：**

始终使用 `vim.ui.input` 和 `vim.ui.select` 来编写你的交互功能。然后，安装 `dressing.nvim` 来美化它们。这样你的代码既标准又能在任何配置了 `dressing.nvim` 的 Neovim 上获得漂亮的 UI。只有在 `dressing.nvim` 无法满足你复杂的布局需求时，才考虑直接使用 `nui.nvim`。



[解放双手：snacks.nvim input模块语音输入全指南](https://blog.csdn.net/gitblog_00769/article/details/151891034)