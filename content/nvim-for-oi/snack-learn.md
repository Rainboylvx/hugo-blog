---
title: "snack-leaern"
date: 2025-09-26
draft: true
toc: true
tags: [""]
categories: [""]
---

## step 1
```
-- learn/step1.lua
-- 目标：理解选择器的最基本形态：输入一个列表，输出用户的选择。
-- 技术点：使用 Neovim 内置的 `vim.ui.select`。

local M = {}

function M.run()
  -- 1. 定义我们要选择的数据
  local fruits = { "Apple", "Orange", "Banana", "Grape" }

  -- 2. 调用 `vim.ui.select`，它会弹出一个UI让用户选择
  -- 第一个参数是我们的数据列表
  -- 第二个参数是一个配置表，我们在这里定义了提示符 `prompt`
  -- 第三个参数是一个回调函数(callback)，当用户做出选择后，这个函数会被执行
  vim.ui.select(fruits, { prompt = "Select a fruit:" }, function(choice)
    -- `choice` 就是用户选择的项，如果用户按 <Esc> 取消，`choice` 会是 nil
    if not choice then
      print("Picker was cancelled.")
      return
    end

    -- 3. 在命令行输出用户的选择
    print("You selected: " .. choice)
  end)
end

return M
```