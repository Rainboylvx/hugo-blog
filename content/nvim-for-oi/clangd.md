---
title: "nvim-lsp-clangd"
date: 2025-09-24
draft: true
toc: true
tags: ["nvim","oi"]
categories: []
---

在 Neovim 中不使用 `nvim-lspconfig` 插件来手动配置 `clangd` 是一个很好的学习 Neovim 内置 LSP API 的方式。这能让你更深入地理解 LSP 客户端是如何工作的。

下面是详细的步骤和一份完整的 Lua 配置示例。

### 核心思路

不使用 `nvim-lspconfig` 的核心是直接调用 Neovim 的原生 LSP 函数 `vim.lsp.start()`。这个函数负责启动一个 LSP 服务进程，并将其附加到当前的缓冲区。

主要步骤如下：

1.  **确保 `clangd` 已安装**：Neovim 不会帮你安装 LSP 服务器，你需要自己通过系统包管理器安装。
2.  **定义 `on_attach` 函数**：这个函数在 LSP 成功附加到一个缓冲区后执行。我们在这里设置快捷键、高亮等。
3.  **定义 LSP 服务器配置**：创建一个配置表，告诉 Neovim 如何启动 `clangd`（命令、根目录、文件类型等）。
4.  **使用 `autocmd` 触发 LSP**：创建一个自动命令，在打开 C/C++ 文件时，调用 `vim.lsp.start()` 来启动 `clangd`。

---

### 步骤 1: 安装 clangd

首先，确保你的系统上已经安装了 `clangd`。

-   **macOS (Homebrew):**
    ```bash
    brew install llvm
    # Homebrew 安装的 llvm 可能需要手动链接，或者你可以在配置中指定完整路径
    ```

-   **Ubuntu/Debian:**
    ```bash
    sudo apt update
    sudo apt install clangd
    ```

-   **Arch Linux:**
    ```bash
    sudo pacman -S clangd
    ```

安装后，在终端运行 `clangd --version` 确认它已经安装并且在你的 `PATH` 中。

---

### 步骤 2: 创建 `compile_commands.json` (非常重要!)

`clangd` 需要 `compile_commands.json` 文件来了解你的项目是如何编译的（比如头文件路径、宏定义等）。没有这个文件，`clangd` 的功能会大打折扣，尤其是在大型项目中。

如果你的项目使用 CMake，生成它非常简单：
```bash
# 在你的构建目录中
cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=1 ..
```
这会在构建目录中生成一个 `compile_commands.json` 文件。`clangd` 会自动在当前文件所在目录及父目录中寻找它。

---

### 步骤 3: Neovim Lua 配置

将以下代码放入你的 Neovim 配置文件中（例如 `~/.config/nvim/lua/lsp/clangd.lua`），然后在你的 `init.lua` 中 `require` 它。

这是一个完整且带有详细注释的示例：

```lua
-- ~/.config/nvim/lua/lsp/clangd.lua

print("加载自定义 clangd 配置...")

-- 1. 定义 on_attach 函数
--    这个函数会在 LSP 客户端成功附加到缓冲区时调用
--    我们在这里为该缓冲区设置 LSP 相关的快捷键
local on_attach = function(client, bufnr)
  -- 启用代码补全 (如果你使用 nvim-cmp)
  -- client.server_capabilities.completionProvider = true -- 这行通常不需要，因为 capabilities 已经处理了

  print("clangd 已附加到缓冲区: " .. bufnr)

  -- 设置快捷键
  local opts = { noremap = true, silent = true, buffer = bufnr }
  local keymap = vim.keymap.set

  -- 跳转到定义
  keymap('n', 'gd', vim.lsp.buf.definition, opts)
  -- 查看悬浮文档
  keymap('n', 'K', vim.lsp.buf.hover, opts)
  -- 跳转到实现
  keymap('n', 'gi', vim.lsp.buf.implementation, opts)
  -- 列出引用
  keymap('n', 'gr', vim.lsp.buf.references, opts)
  -- 重命名符号
  keymap('n', '<F2>', vim.lsp.buf.rename, opts)
  -- 显示代码动作 (修复、重构等)
  keymap('n', '<leader>ca', vim.lsp.buf.code_action, opts)
  -- 显示当前行的诊断信息 (错误、警告)
  keymap('n', '<leader>e', vim.diagnostic.open_float, opts)
  -- 跳转到上一个/下一个诊断
  keymap('n', '[d', vim.diagnostic.goto_prev, opts)
  keymap('n', ']d', vim.diagnostic.goto_next, opts)
  
  -- 设置高亮
  -- 当光标移动到有引用的符号上时，高亮所有引用
  vim.api.nvim_create_autocmd('CursorHold', {
    buffer = bufnr,
    callback = function()
      vim.lsp.buf.document_highlight()
    end,
  })
  vim.api.nvim_create_autocmd('CursorMoved', {
    buffer = bufnr,
    callback = function()
      vim.lsp.buf.clear_references()
    end,
  })

end

-- 2. 定义 LSP 能力 (Capabilities)
--    这告诉 LSP 服务器，客户端（Neovim）支持哪些功能
--    如果你使用 nvim-cmp 进行补全，需要从 cmp_nvim_lsp 获取 capabilities
local capabilities = require('cmp_nvim_lsp').default_capabilities(vim.lsp.protocol.make_client_capabilities())

-- 3. 创建自动命令来启动 clangd
--    当打开 C/C++/Objective-C 文件时，会触发这个自动命令
vim.api.nvim_create_autocmd('FileType', {
  pattern = { 'c', 'cpp', 'objc', 'objcpp', 'cuda' }, -- 触发 clangd 的文件类型
  callback = function()
    -- 使用 vim.lsp.start() 启动客户端
    vim.lsp.start({
      -- 客户端的名称，可以自定义
      name = 'my-clangd-server',

      -- 启动 LSP 服务器的命令
      -- 如果 clangd 不在你的 PATH 中，你需要提供完整路径
      -- 你也可以在这里传递 clangd 的命令行参数
      cmd = {
        'clangd',
        '--query-driver=/usr/bin/gcc,**/gcc-*,/usr/bin/g++,**/g++-*', -- 帮助 clangd 找到系统头文件
        '--background-index',       -- 后台索引
        '--clang-tidy',             -- 启用 clang-tidy
        '--completion-style=detailed',
      },

      -- 查找项目根目录的逻辑
      -- clangd 会自动寻找 compile_commands.json 或 .git 目录
      -- 这里使用 Neovim 内置的工具函数
      root_dir = vim.lsp.util.root_pattern('.git', 'compile_commands.json', 'compile_flags.txt'),

      -- 文件类型
      filetypes = { 'c', 'cpp', 'objc', 'objcpp', 'cuda' },

      -- 附加函数
      on_attach = on_attach,

      -- 能力
      capabilities = capabilities,

      -- 服务器特定设置 (settings)
      -- 对于 clangd，大多数配置通过命令行参数或 .clangd 配置文件完成
      settings = {
        -- 这里可以放一些 clangd 的特定配置，但通常留空
      },
    })
  end,
})

-- (可选) 配置诊断信息的显示方式
vim.diagnostic.config({
  virtual_text = true, -- 在行尾显示错误信息
  signs = true,        -- 在行号列显示图标
  underline = true,
  update_in_insert = false,
  severity_sort = true,
})

-- (可选) 设置诊断图标 (需要 Nerd Font 字体支持)
local signs = { Error = " ", Warn = " ", Hint = " ", Info = " " }
for type, icon in pairs(signs) do
  local hl = "DiagnosticSign" .. type
  vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = hl })
end

print("自定义 clangd 配置加载完毕。")
```

### 步骤 4: 在 `init.lua` 中加载配置

确保在你的主配置文件 `init.lua` 中加载上面创建的 Lua 文件：

```lua
-- ~/.config/nvim/init.lua

-- ... 其他配置 ...

-- 加载 LSP 相关配置
require('lsp.clangd') -- 假设你把文件放在 lua/lsp/clangd.lua

-- ... 其他配置 ...
```

### 配置解释

1.  **`on_attach` 函数**: 这是自定义 LSP 行为的关键。它只会在 LSP 客户端成功连接到当前文件后执行，确保了 `vim.lsp.buf.*` 系列函数可用。将快捷键设置在这里可以避免在没有 LSP 的缓冲区中创建无效的快捷键。

2.  **`capabilities`**: 这个配置非常重要，特别是当你使用 `nvim-cmp` 这样的补全插件时。它告诉 `clangd`，Neovim 客户端支持哪些功能（例如，代码片段补全、动态注册等）。`cmp_nvim_lsp` 提供了一个方便的函数来生成这个配置。如果你不使用补全插件，可以使用默认的 `vim.lsp.protocol.make_client_capabilities()`。

3.  **`vim.lsp.start()`**: 这是核心函数。
    *   `name`: 一个唯一的标识符，方便调试。
    *   `cmd`: 一个包含命令及其参数的 table。这是告诉 Neovim 如何启动 `clangd` 进程的地方。你可以添加 `clangd` 支持的各种命令行参数来微调其行为。
    *   `root_dir`: `vim.lsp.util.root_pattern` 是一个辅助函数，它会从当前文件所在的目录开始向上查找，直到找到 `.git` 目录或 `compile_commands.json` 文件，并将其所在的目录作为项目根目录。
    *   `on_attach`: 引用我们之前定义的函数。

4.  **`autocmd`**: `FileType` 事件是最适合用来启动 LSP 的时机。当 Neovim 识别到一个文件的类型是 `c` 或 `cpp` 等时，就会执行回调函数，从而启动 `clangd`。

### 总结

通过这种手动方式，你可以完全控制 `clangd` 的启动参数和行为，而无需依赖任何中间层插件。虽然 `nvim-lspconfig` 通过预设的社区配置简化了这个过程，但了解其底层原理对于调试问题和进行深度定制非常有帮助。

现在，重启 Neovim 并打开一个 C/C++ 项目（确保有 `compile_commands.json`），你应该能看到 `clangd` 成功启动，并且你设置的快捷键也能正常工作了。
