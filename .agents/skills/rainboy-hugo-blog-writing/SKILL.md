---
name: rainboy-hugo-blog-writing
description: 在 Rainboy 的 Hugo 博客项目中新增、整理或修改文章时使用。只要用户提到这个 hugo blog、Rainboy's Blog、写博客文章、整理技术笔记、补充书籍/数学/编程学习笔记、迁移 Markdown 到本博客，或要求 AI 按当前博客风格写内容，都应该使用此技能。
---

# Rainboy Hugo Blog 写作指南

这个技能指导 AI 在 Rainboy 的 Hugo 博客项目里写文章。目标不是写一篇通用 Markdown，而是写一篇能融入当前仓库结构、主题能力和作者习惯的 Hugo 文章。

## 开始前先读项目

在动笔前，先读取这些文件和上下文：

1. `hugo.yaml`：确认站点配置、主题、数学公式、代码高亮、URL 规则。
2. `readme.md`：确认项目说明、shortcode、admonition、预览命令。
3. 目标栏目的 `_index.md`：确认栏目标题、目录组织和链接写法。
4. 同目录下 2-3 篇相邻文章：模仿 front matter、标题层级、图片路径、语气和内容密度。

不要假设所有栏目都一样。这个博客同时包含日常 blog、编程语言笔记、Neovim/OI 配置、数学、书籍学习笔记和网络编程内容。

## 内容放置规则

优先使用现有目录：

- 普通随笔、工具记录、问题解决：`content/blog/`
- Neovim/OI 相关：`content/nvim-for-oi/`
- TypeScript：`content/typescript/`
- Lua 或其他语言：`content/program_language/<topic>/`
- MongoDB：`content/mongodb/`
- 数学：`content/math/` 或 `content/books/<书名>/`
- 读书笔记：`content/books/<书名>/`
- Linux/TCP/网络编程：`content/linux_tcp_program/`

如果要建立新栏目，先创建目录和 `_index.md`，并保持现有 `_index.md` 风格：简短 front matter，加目录链接，不写营销式介绍。

## Front Matter

文章通常使用 YAML front matter。按同目录习惯选择字段。

普通文章模板：

```markdown
---
title: "文章标题"
date: 2026-06-17T20:00:00+08:00
draft: true
toc: true
tags: ["标签"]
categories: []
---
```

简短笔记可用：

```markdown
---
title: "文章标题"
date: 2026-06-17
draft: true
toc: true
---
```

栏目首页 `_index.md` 常用：

```markdown
---
title: "栏目标题"
noList: true
---
```

规则：

- 新文章默认 `draft: true`，除非用户明确要求发布。
- 技术长文默认 `toc: true`。
- 日期使用项目时区 `Asia/Shanghai`，可写 `YYYY-MM-DD` 或 `YYYY-MM-DDTHH:mm:ss+08:00`，优先模仿同目录。
- 标题使用中文或技术名词，不要生成夸张标题。
- 不要随意批量补 tags/categories；同目录已有习惯时再补。

## 写作风格

使用中文技术笔记风格，直接、学习导向、可复查。

偏好的结构：

- 从“要解决什么问题”或“核心思想”开始。
- 使用二级标题 `##` 组织主线，三级标题 `###` 组织步骤或证明。
- 多写推导、命令、代码、现象、结论，不写空泛背景。
- 允许保留作者式表达，比如“显然想到”“这个问题的核心在于”“注意”。
- 数学和算法文章要写变量含义、公式来源、推导步骤和结论。
- 工具配置文章要写安装、配置、验证、常见问题。

避免：

- 营销式开头。
- 大段泛泛解释。
- 未验证的命令。
- 把 AI 口吻写进正文，例如“本文将带你”“作为一个 AI”。

## Markdown 和 Hugo 能力

### 数学公式

项目支持 KaTeX/Goldmark passthrough：

- 行内公式：`$a_i$`
- 块级公式：

```markdown
$$
\sum_{i=1}^{n} a_i
$$
```

需要编号时可以直接写 `\tag 1`：

```markdown
$$
F(x)=\sum_i |s_i+x| \tag 1
$$
```

### 代码块

使用 fenced code block，并写语言名：

````markdown
```lua
vim.lsp.start({
  name = "clangd",
})
```
````

项目高亮配置开启了行号和 `gruvbox` 风格。代码示例应可复制，路径、命令和依赖要写清楚。

### Admonition / Callout

项目使用 `hugo-admonitions`，可写 Obsidian 风格 callout：

```markdown
> [!TIP] 提示
> 这里写提示内容。
```

常用类型：

- `[!INFO]` 信息
- `[!TIP]` 提示
- `[!WARNING]` 注意风险
- `[!IMPORTANT]` 重要结论
- `[!IDEA]` 定义、想法、关键观察
- `[!EXAMPLE]` 例题或例子
- `[!ABSTRACT]` 抽象理解
- `[!SUCCESS]` 成功结论

可折叠：

```markdown
> [!TIP]- 点击展开
> 折叠内容。
```

### Shortcodes

包含同目录或 content 下的代码文件：

```markdown
{{< include "src/demo/void.ts" "ts" >}}
```

`include` 的路径规则：

- 相对路径从当前页面目录开始。
- 以 `/` 开头时从 `content/` 开始。

折叠详情：

```markdown
{{% details title="Title" open=true %}}
这里可以写 Markdown 内容。
{{% /details %}}
```

## 图片和资源

优先使用相对路径，让文章和图片保持在同一主题目录内：

```markdown
![](./images/example.png)
![](./assets/image.png)
![](./images/diagram.excalidraw.svg "figure_1")
```

已有习惯：

- 多数文章把图片放在同目录下的 `images/` 或 `assets/`。
- 书籍栏目常用 `cover.jpg` / `cover.png`。
- 可引用远程图片，但长期保存的学习笔记优先本地化，避免外链失效。
- 不要把大段 base64 图片写进 Markdown。

如果新增图片，放到文章相邻目录，比如：

```text
content/books/微积分/images/example.png
content/linux_tcp_program/TCPIP网络编程/chapter_1/assets/image.png
```

## 链接规则

项目启用了 `uglyURLs: true`，但正文里仍优先使用相对 Markdown 链接：

```markdown
- [概述](./readme.md)
- [环形均分纸牌](./环形均分纸牌解析.md)
```

栏目 `_index.md` 中常见目录写法：

```markdown
## 内容

- [概述](./readme.md)
- [clangd](./clangd.md)
```

不要随意改全站菜单。新增栏目是否加入首页或菜单，需要用户确认。

## 写文章流程

1. 明确文章应该属于哪个目录。
2. 读取该目录 `_index.md` 和相邻文章。
3. 创建或修改 Markdown 文件。
4. 使用符合该目录习惯的 front matter。
5. 写正文：问题、核心概念、步骤/推导、例子、结论。
6. 如果新增文章属于已有目录页，按需更新 `_index.md` 的目录链接。
7. 检查图片路径、代码块语言、公式分隔符、callout 语法。
8. 运行验证命令。

验证命令：

```bash
hugo
```

本地预览：

```bash
hugo server -D --bind 0.0.0.0
```

`-D` 会渲染 `draft: true` 的文章。

## 修改文章时的约束

- 不要重写用户已有文章的语气，除非用户要求润色或重构。
- 不要删除用户已有草稿、图片、代码文件。
- 如果发现工作区已有未提交修改，先识别是否与你的任务相关；无关修改保持不动。
- 修正错别字、公式、路径和格式时，保持改动聚焦。
- 技术内容不确定时，标注需要验证，或先查官方文档/运行命令验证。

## 交付标准

完成后向用户说明：

- 新增或修改了哪些文件。
- 文章放在哪个栏目。
- 是否更新了 `_index.md`。
- 是否运行了 `hugo` 或本地预览命令。
- 如果没有验证，说明原因。
