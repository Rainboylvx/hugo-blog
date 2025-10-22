---
title: "nvim-dap"
date: 2025-09-25
draft: true
toc: true
tags: ["nvim"]
---

https://github.com/mfussenegger/nvim-dap

> Debug Adapter Protocol client implementation for Neovim

## 安装

```
return  {
    "mfussenegger/nvim-dap",
    config = function()
    end
}
```


## Debug Adapter installation

我使用dap ui,按文档,我在linux下使用 [vscode-cpptools](https://codeberg.org/mfussenegger/nvim-dap/wiki/C-C---Rust-(gdb-via--vscode-cpptools)),在 macos上使用
[codelldb](https://codeberg.org/mfussenegger/nvim-dap/wiki/C-C---Rust-(via--codelldb))

### linux 下安装 

1. 根据系统在[github cpp-tools releases](https://github.com/microsoft/vscode-cpptools/releases/tag/v1.27.7)下载对应系统的visx
2. Unpack it. .vsix is a zip file and you can use unzip to extract the contents.
3. Ensure `extension/debugAdapters/bin/OpenDebugAD7` is executable.



Adapter definition

```lua
local dap = require('dap')
dap.adapters.cppdbg = {
  id = 'cppdbg',
  type = 'executable',
  command = '/absolute/path/to/cpptools/extension/debugAdapters/bin/OpenDebugAD7',
}
```

Configuration
The VSCode C/C++ documentation contains a full reference for all options supported by the debug adapter.

Common configuration examples:

```lua
local dap = require('dap')
dap.configurations.cpp = {
  {
    name = "Launch file",
    type = "cppdbg",
    request = "launch",
    program = function()
      return vim.fn.input('Path to executable: ', vim.fn.getcwd() .. '/', 'file')
    end,
    cwd = '${workspaceFolder}',
    stopAtEntry = true,
  },
  {
    name = 'Attach to gdbserver :1234',
    type = 'cppdbg',
    request = 'launch',
    MIMode = 'gdb',
    miDebuggerServerAddress = 'localhost:1234',
    miDebuggerPath = '/usr/bin/gdb',
    cwd = '${workspaceFolder}',
    program = function()
      return vim.fn.input('Path to executable: ', vim.fn.getcwd() .. '/', 'file')
    end,
  },
}
```

### macos 下安装

Installation

1. Install codelldb:
1. Download the VS Code extension.
2. Unpack it. .vsix is a zip file and you can use unzip to extract the contents


codelldb-darwin-arm64.vsix


## 配合nvim-dap-ui 使用

## FAQ

### 如何使用display

###  如何使用条件断点:

设置条件断点的核心是调用 `require('dap').set_breakpoint()` 函数，并向其传递一个条件表达式字符串。


## 参考

- [The complete guide to iOS & macOS development in Neovim](https://wojciechkulik.pl/ios/the-complete-guide-to-ios-macos-development-in-neovim)