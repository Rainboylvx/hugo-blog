---
title: "LuaSnip"
date: 2025-10-02
draft: false
toc: true
tags: [""]
categories: [""]
---


- github : https://github.com/L3MON4D3/LuaSnip
- 文档 https://github.com/L3MON4D3/LuaSnip/blob/master/DOC.md
- 中文文档: https://zjp-cn.github.io/neovim0.6-blogs/nvim/luasnip/doc1.html
- example lua snip : https://github.com/L3MON4D3/LuaSnip/blob/master/Examples/snippets.lua


## 基础

在 LuaSnip 中，代码片段由节点 (`nodes`) 组成。节点分类：

-   `textNode`：静态文本
-   `insertNode`：可编辑的文本
-   `functionNode`：函数节点，可从其他节点的内容生成的文本
-   其他节点
    -   `choiceNode`：在两个节点（或更多节点）之间进行选择
    -   `restoreNode`：存储和恢复到节点的输入
-   `dynamicNode`：动态节点，基于输入生成的节点

通常使用 `s(trigger:string, nodes:table)` 形式的函数创建代码片段。