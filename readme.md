# Rainboy's Blog

这是一个使用 [Hugo](https://gohugo.io/) 静态网站生成器构建的个人博客项目。

博客基于 [hugo-dead-simple](https://github.com/barklan/hugo-dead-simple) 主题，并进行了深度定制以满足个性化需求。

## 主要特性

- **静态生成**：由 Hugo 驱动，网站加载速度快，安全可靠。
- **数学公式支持**：集成了 [KaTeX](https://katex.org/)，可以完美渲染 LaTeX 数学公式，无论是行内 (`$...$`) 还是块级 (`$$...$$`)。
- **独立搜索页面**：将默认的实时搜索功能重构，实现了独立的 `/search/` 结果页面，提升了用户体验。该功能由 [Lunr.js](https://lunrjs.com/) 在前端实现。
- **自定义主页**：实现了响应式的网格图标布局，用于分类导航，并带有交互式悬停效果。
- **响应式设计**：主题本身支持在不同设备上良好地显示。

## 本地开发

在开始之前，请确保你已经安装了 [Hugo (extended version)](https://gohugo.io/installation/)。

1.  **克隆仓库**

    ```bash
    git clone <your-repository-url>
    cd hugo-blog
    ```

2.  **启动本地服务器**

    运行以下命令来启动 Hugo 的开发服务器：

    ```bash
    hugo server -D --bind 0.0.0.0
    ```

    `-D` 参数会同时渲染标记为草稿（draft）的页面。

3.  **访问网站**

    在浏览器中打开 `http://localhost:1313` 即可实时预览你的网站。

## 构建网站

当你准备好部署网站时，运行以下命令：

```bash
hugo
```

Hugo 会将完整的静态网站文件生成到 `public/` 目录下。你只需将此目录下的所有文件部署到任何静态网站托管服务（如 Netlify, Vercel, GitHub Pages 等）即可。

nignx 配置

因为我使用了 `uglyURLs: true`

我使用的 nginx 配置如下

```conf
# 规则一：专门处理以 / 结尾的请求 (例如 /path/a/)
# 这个 location 块的优先级会高于下面的 location /
location ~ ^(.+)/$ {
    # $1 变量会捕获到 URI 中除了最后一个斜杠之外的所有内容
    # 例如，请求 /path/a/，那么 $1 的值就是 /path/a
    try_files $1.html $uri $uri/ =404;
}

# 规则二：处理所有其他请求 (例如 /path/a, /style.css 等)
location / {
    # 这是标准的鲁棒性配置
    try_files $uri $uri.html $uri/ $uri/ =404;
}
```

## 使用

### 特点

- 代码高亮: `gruvbox`,如果想局部高亮某些行,参考这里:https://gohugo.io/content-management/syntax-highlighting/
- 数学公式: katex
- 使 [赫蹏](https://github.com/sivan/heti)排版样式增强
- 使用 google font Roboto Mono 英文字体


### shortcodes

- include 代码片段
    ```html
    {{< include "src/demo/void.ts" "ts" >}}
    ```
- details
    ```html
    {{% details title="Title" open=true %}}
    ## Markdown content
    Lorem markdownum insigne...
    {{% /details %}}
    ```
### shortcodes

使用了: https://github.com/KKKZOZ/hugo-admonitions

```
> [!IDEA] Summary
> This is a summary using the `IDEA` callout!

> [!TIP] You can choose to only to show the header!

> [!NOTIFY] System notification: Your password will expire in 30 days

> [!SUCCESS] Congratulations! Your code has been successfully deployed to production

> [!WARNING] Warning: This operation will delete all data. 


extends

> [!TIP]- Click here to view the tips

> [!TIP]+ Click here to view the tips

nest extends more

> [!QUESTION] Can admonitions be nested?
> > [!TODO] Yes!, they can.
> > > [!EXAMPLE]  You can even use multiple layers of nesting.

```

Available Callouts List

| Alerts & Emphasis | Information & Elaboration | Guidance & Interaction |
|-------------------|---------------------------|------------------------|
| `[!DANGER]`       | `[!INFO]`                 | `[!TIP]`               |
| `[!ERROR]`        | `[!NOTE]`                 | `[!TASK]`              |
| `[!WARNING]`      | `[!ABSTRACT]`             | `[!GOAL]`              |
| `[!CAUTION]`      | `[!CONCLUSION]`           | `[!IDEA]`              |
| `[!IMPORTANT]`    | `[!EXAMPLE]`              | `[!QUESTION]`          |
| `[!SUCCESS]`      | `[!QUOTE]`                | `[!NOTIFY]`            |
|                   | `[!CODE]`                 |                        |
|                   | `[!EXPERIMENT]`           |                        |
|                   | `[!MEMO]`                 |                        |