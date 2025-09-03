---
date: '2025-09-03T21:05:27+08:00'
draft: true
title: 'Hugo自动发布'
toc: true
---

> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [blog.wjhwjhn.com](https://blog.wjhwjhn.com/posts/7f5297a/)

> 背景 我一直计划迁移我的博客，一方面是认为之前主题的代码展示能力不强，文章的信息密度低，不适宜于技术内容的展示；另一方面，我曾认为极为安全的 Typecho，在 2023 年 6 月爆出了 XSS 漏洞，这加剧了我迁移的紧迫性。

注意

本文最后更新于 2024-02-13，文中内容可能已过时。

背景[](#%e8%83%8c%e6%99%af)
-------------------------

我一直计划迁移我的博客，一方面是认为之前主题的代码展示能力不强，文章的信息密度低，不适宜于技术内容的展示；另一方面，我曾认为极为安全的 Typecho，在 2023 年 6 月爆出了 XSS 漏洞，这加剧了我迁移的紧迫性。鉴于此，我早就转向一款既美观又实用的静态博客平台——我选择了 Hugo，并选用了 FixIt 主题。恰逢过年，我拥有了许多碎片化的时间，这成为了我迁移博客的绝佳时机。

![](https://blog.wjhwjhn.com/images/image-20240213122431630.png)

问题和解决方案[](#%e9%97%ae%e9%a2%98%e5%92%8c%e8%a7%a3%e5%86%b3%e6%96%b9%e6%a1%88)
---------------------------------------------------------------------------

在迁移博客的过程中，我遇到了一系列问题。为了帮助同样面对这些挑战的读者，我在下面详细记录了我所面临的问题以及我采取的解决措施，希望这些经验能为您提供实际的帮助和指引。

警告

在迁移之前，请务必备份原有博客的文件和数据库数据，以防意外发生。

### 文章迁移[](#%e6%96%87%e7%ab%a0%e8%bf%81%e7%a7%bb)

1.  文章内容：文章内容储存在 `typecho_contents` 表的 `text` 字段中，提取比较容易，只需要去除 `<!--markdown-->` 标记即可，原先编写文章时就使用的是 markdown，所以直接创建文件即可，不过在这个过程中也遇到了不少问题
    1.  在我刚建立这个博客时，因为对 markdown 语法的不熟悉，导致以前的很多文章使用了 markdown 的方言。这些文章，在 Typecho 中显示正常，但是在 Hugo 中就出现了排版错误，好在有问题的文章不是很多，这里手动编辑了一下；
    2.  在 Hugo 中，文章的元信息（文章创建时间、文章类别、文章标题等…）都内嵌文章开头的 yaml 元信息中，这些信息需要从 Typecho 的数据库中提取并生成，例如 `typecho_contents` 表的 `created` 、`modified` 、`title` 字段；
    3.  原先的 Typecho 的 `typecho_contents` 表的 `status` 字段，如果是非 `public` 的文章，则设置 `hiddenFromHomePage: true`、`hiddenFromSearch: true`、`hiddenFromRss: true`、`hiddenFromRelated: true` 以及 `password: {password}` 密码字段，由主题进行加密处理。
2.  原博客链接跳转
    1.  问题：原博客的链接是使用 `/archives/{cid}/` 这种形式的，而新博客的链接是使用 `/posts/{name}` 这种形式的；
    2.  解决方案：利用文章元信息中的 `aliases` 字段来生成一个额外的别名链接。

### 评论和阅读量迁移[](#%e8%af%84%e8%ae%ba%e5%92%8c%e9%98%85%e8%af%bb%e9%87%8f%e8%bf%81%e7%a7%bb)

使用了 Twikoo 的评论系统，并解决了链接转换问题

1.  Twikoo 的评论系统运行在 docker 设备中，并且映射到 8099 端口。为了安全性，我使用 ufw 将此端口设置为 deny，但发现无效，在 [xianyu](https://blog.wjhwjhn.com/friends/) 的帮助下 (Orz)，使用了 [ufw-docker](https://github.com/chaifeng/ufw-docker)，并成功解决；
2.  因为 Twikoo 原生只支持使用 http，而我的博客使用的是 https，导致 twikoo 被 block。这里使用了反向代理来解决，设置了 `https://blog.wjhwjhn.com/twikoo` 代理到 `http://localhost:8099` ；
3.  阅读量是我在数据库中新增的 `viewsNum` 字段，我进行了导出生成，并转化为 Twikoo 的数据格式；
4.  在评论和阅读量中需要提供文章的地址和标题，而在数据库中的都是先前的地址和标题。这里编写了 Python 脚本，逻辑如下
    1.  在新版博客中，去访问原来的路径下访问 html 文件（通过 `aliases` 字段生成的跳转文件），并使用正则（`meta http-equiv="refresh" content="0; url=http://[^/]+(/[^"]+)"`）取出更新后的地址。
    2.  前往新版博客的地址下使用正则（`<title>([^<]+)</title>`）取出标题。

### 图片链接修复[](#%e5%9b%be%e7%89%87%e9%93%be%e6%8e%a5%e4%bf%ae%e5%a4%8d)

让 ChatGPT 编写正则，提取出图片链接，从原来的图片链接中下载到本地，并替换原有链接

1.  发现以前有部分旧文章的图片使用的是 http，导致图片无法访问，编写了 SQL 语句进行了替换 `UPDATE typecho_contents SET text = REPLACE(text, 'http://blog.wjhwjhn', 'https://blog.wjhwjhn');`。
2.  发现以前有部分图片无法访问到：之前有过一段时间的博客文章编写是在石墨上的，而石墨的导出 markdown 功能也经过两次的转变
    1.  我最早接触的时候，石墨的导出功能是可以直接导出文章内的图片的，并且使用了石墨的图片储存服务链接；
    2.  估计后来石墨发现盗链的人过多，于是对访问来源做了检测，导致了我当时有大量的博客图片无法访问。我编写了一个插件，在导入时对文章内外链图片进行检测，如果存在外链图片，则下载到本地并替换链接，具体内容查看 [博客外链图片已恢复](https://blog.wjhwjhn.com/posts/%E5%8D%9A%E5%AE%A2%E5%A4%96%E9%93%BE%E5%9B%BE%E7%89%87%E5%B7%B2%E6%81%A2%E5%A4%8D/) 这篇文章；
    3.  再后面文章内图片使用 base64 进行编码嵌入在 markdown 文件中，但如果图片过大，markdown 文件过大，甚至无法在 Typecho 中储存。因此我也就不用石墨写文章了，通常会在本地 (使用本地图床) 写好文章，然后通过插件自动下载图床图片并修正到本地链接；
    4.  插件的鲁棒性不佳，存在下载失败的情况，不过好在下载失败的情况不多，我手动补了几张图片就解决了。
3.  markdown 内图片链接提取，一般分为两种形式，都是使用正则来匹配
    1.  直接嵌入的图片`![{text}]({url})`，匹配正则：`!\[.*?\]\((.*?)\)`；
    2.  在文章底部使用 `[{id}]:{url}` 定义了一个脚注或引用链接，在使用时使用 `![{text}][{id}]` 来引用，匹配正则：`\[\d+\]:\s*(.*?)\s*(?="#|$)`。

GitHub Action[](#github-action)
-------------------------------

警告

为确保与您的服务器配置、仓库路径和特定需求相匹配，请适当修改以下代码段。避免直接复制粘贴，以预防潜在的兼容性问题或配置错误。

在过去的博客中，发布文章仅需在后台编辑后直接发送，便可立即在页面上看到效果。然而，自从转换到静态博客平台后，原本简洁的发布流程变得复杂。经过参考众多文章与资料，我目前采用了 GitHub Action 来简化这一流程。

### 新增文章流程[](#%e6%96%b0%e5%a2%9e%e6%96%87%e7%ab%a0%e6%b5%81%e7%a8%8b)

1.  在本地操作 Hugo 新增文章，并使用 git 进行管理，并 push 到 GitHub 上；
2.  GitHub Action 检测到 push 并自动执行编译，编译后的页面结果存放在 gh-pages 分支中；
3.  编译完毕后，GitHub Action 使用 Webhook 通知博客服务器来 GitHub 上拉取 gh-pages 的博客数据。

因为我的 GitHub 仓库是私有的，所以还需要把博客服务器的 SSH keys 添加到 GitHub，才能够拉取私有仓库。

### GitHub Action 代码流程[](#github-action-%e4%bb%a3%e7%a0%81%e6%b5%81%e7%a8%8b)

**配置解读**

1.  当 master 分支被 push 时自动执行；
2.  运行在 Ubuntu-22.04 的环境上；
3.  使用 Hugo 最新扩展版对博客源文件进行编译；
4.  将编译后的 public 文件夹部署到 gh-pages 分支上；
5.  通过 Webhook 来通知博客服务器来同步最新的静态页面数据。

```
name: GitHub Pages

on:
  push:
    branches:
      - master  # Set a branch to deploy
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-22.04
    concurrency:
      group: ${{ github.workflow }}-${{ github.ref }}
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true  # Fetch Hugo themes (true OR recursive)
          fetch-depth: 0    # Fetch all history for .GitInfo and .Lastmod

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
          extended: true

      - name: Build
        run: hugo --minify

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/master'
        with:
          github_token: ${{ secrets.GH_TOKEN }}
          publish_dir: ./public
      
      - name: Update Blog Server
        uses: distributhor/workflow-webhook@v1
        env:
          webhook_url: ${{ secrets.WEBHOOK_URL }}
          webhook_secret: ${{ secrets.WEBHOOK_SECRET }}
```

**实际效果展示**

![](https://blog.wjhwjhn.com/images/image-20240213143719067.png)

### Webhook 执行脚本[](#webhook-%e6%89%a7%e8%a1%8c%e8%84%9a%e6%9c%ac)

```
#!/bin/bash

# Start of the script
echo "$(date "+%Y-%m-%d %H:%M:%S") Run"

# Define variables
gitPath="/www/wwwroot/newblog"
gitSSH="git@github.com:wjhwjhn/blog.git"

echo "Web site path: $gitPath"

# Check if the directory exists
if [ -d "$gitPath" ]; then
    # Attempt to enter the directory
    cd "$gitPath" || { echo "Failed to enter directory $gitPath"; exit 1; }
    
    echo "------"
    # Check if .git needs to be cloned
    if [ ! -d ".git" ]; then
        echo "Cloning git into this directory"
        if git clone -b gh-pages "$gitSSH" gittemp && mv gittemp/.git . && rm -rf gittemp; then
            echo "Clone successful"
        else
            echo "Clone failed"
            exit 1
        fi
    fi
    
    # Update the git repository
    if git reset --hard gh-pages && git pull; then
        echo "Update successful"
    else
        echo "Update failed"
        exit 1
    fi
    
    # Change ownership
    chown -R www:www "$gitPath"
    echo "Finish"
else
    echo "The project path does not exist"
    echo "Finish"
fi
```

Typora 图片设置[](#typora-%e5%9b%be%e7%89%87%e8%ae%be%e7%bd%ae)
-----------------------------------------------------------

Typora 支持便捷地在本地保存文件。但是如果设置不当，它可能无法兼容 Hugo 的图片存储方式，这里对 Typora 的配置做了以下调整

1.  格式 -> 图像 -> 设置图片根目录，设置目录为 Hugo 源文件下的 `static` 文件夹
    
2.  偏好设置 -> 图像 -> 插入图片处设置路径为 Hugo 源文件下的 `static\images\` 文件夹
    
    ![](https://blog.wjhwjhn.com/images/image-20240213134357438.png)
    
3.  设置完毕后，在 Typora 中 Ctrl + V 粘贴图片就会自动以 `/images/xxx.png` 的链接呈现，并把图片保存在 `static\images\` 文件夹，这个图片链接形式在 Typora 中和 Hugo 博客中都可以正常浏览。
    

总结[](#%e6%80%bb%e7%bb%93)
-------------------------

此次迁移历时三天，过程中虽然遇到了不少挑战，但也收获颇丰。通过提出问题、构思解决方案，以及运用编程技术解决实际问题的过程，为我带来了极大的满足感。

四年前，我建立了这个博客，那时对 Linux 的操作感到极度畏惧，我的理解也仅限于书本知识。在过去的四年中，我对 Linux（尤其是 Ubuntu）的了解和熟悉程度有了显著提高，逐渐体会到了类 Unix 系统的独特魅力。与此同时，我的云服务器也从最初以 Windows 系统为主、Linux 系统为辅，转变为全面采用 Linux 系统。

现在，回顾起我当初配置的服务器，我意识到了许多安全上的疏漏，同样，重新审视我早期的文章时，我也意识到了当时的视野局限和思维的稚嫩。我相信，四年后的自己再回看今日所做，可能会对某些决定感到可笑或有所遗憾。然而，我认为这正体现了人生的一环——持续学习，回望过往，对曾经的自己会心一笑。