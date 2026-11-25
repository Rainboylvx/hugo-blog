---
name: copy-book-md
description: >
  把一个外部的 Markdown 书籍目录搬进本 Hugo 博客，成为 content/books/<书名>/ 下的读书笔记栏目。
  只要用户说「把这里的 md 拷到仓库当笔记」「copy book md」「导入这本书」「把这个 OCR 结果搬到博客」
  「迁移这本书的 markdown」，或给出一个含多章 .md + images/ 的目录要求搬进来，都必须使用本 skill。
  也用于导入后修 KaTeX 渲染报错、补 _index.md、在首页登记新书。
---

# copy-book-md

把外部一本 Markdown 形态的书（OCR 产物、出版社电子书导出、他人笔记）搬进本博客，
落成 `content/books/<书名>/`，并补齐 Hugo 需要的一切：front matter、`_index.md`、图片、首页登记、构建验证。

**不要直接 `cp -r`。** 源目录几乎总是带着博客不需要的东西（锁文件、孤儿图、断链、无 front matter），
直接拷会留下 500+ 无用文件、失效链接和构建报错。

## 第一步：先勘察，再动手

在写任何文件之前，先摸清源目录的形状。至少要回答这些问题：

```bash
# 1. 目录树和规模
find <src> -type f | sort | head -50
du -sh <src>; find <src> -name '*.md' | wc -l; find <src> -type f \( -name '*.jpg' -o -name '*.png' \) | wc -l

# 2. 单个章节文件长什么样
head -30 <src>/<某章>/<某章>.md

# 3. 图片到底有多少被正文引用（关键！）
grep -rho '!\[[^]]*\]([^)]*)' --include='*.md' <src> | wc -l

# 4. 有没有会干扰 Hugo 的东西
grep -rn '{{' --include='*.md' <src> | head          # shortcode 冲突
grep -rn '<[a-zA-Z]' --include='*.md' <src> | head   # raw HTML
grep -rn '^|' --include='*.md' <src> | head          # markdown 表
```

必须确认的几件事：

| 检查项 | 为什么 |
| --- | --- |
| 每个章节文件是否已有 front matter | 有 `---` 开头就别重复加，先读出来 |
| 图片总数 vs 被引用数 | OCR 工具常留大量孤儿公式截图（实测 561 张里只有 28 张被引用） |
| 图片引用路径形式 | `images/x.jpg` 相对路径最省事；绝对路径要重写 |
| 首行有没有指向 PDF 的链接 | 搬到新位置必然断链 |
| 标题层级 | 很多 OCR 产物没有 h1，只有一个 `## 第N章 xxx`，要靠它取 title |
| 文件名里的特殊字符 | 中文、`、`、空格、括号会让 URL 变长但 Hugo 能处理，不必改名 |

## 第二步：把不确定项问清楚

勘察完，把**只有用户能决定**的事一次性问出来（用 ask_user，别猜）。典型清单：

1. **目录名**：中文书名还是英文短名？（`112个组合问题` vs `112-combinatorial-problems`）
2. **章节文件布局**：保持 `04-容斥原理/04-容斥原理.md` 的双层嵌套，还是拍平成 `04-容斥原理.md`？
   （拍平 URL 更干净；不拍平则图片引用一行都不用改）
3. **图片搬多少**：只搬正文引用的，还是全搬？
4. **指向原 PDF 的链接**：转纯文本保留页码、直接删、还是把 PDF 也放进 `static/`？
5. **附加动作**：生成封面？在首页登记？顺手修 OCR 破损？

已经有明确答案的直接按默认走，不要为了问而问。

### 本仓库的默认值

除非用户另有要求，按这套来：

- 章节**拍平**成 `content/books/<书名>/<原目录名>.md`
- 图片**只搬被引用的**，放到 `images/<原目录名>/`，引用重写成 `images/<原目录名>/<file>`
- 首行 PDF 链接转成纯文本 `> 原书 PDF 第 7-12 页`
- 章节文件补 `title` / `date` / `draft: true` / `toc: true`
- 生成 `_index.md`（`noList: true` + 目录链接）
- 封面用 `pdftoppm` 从原书 PDF 第 1 页渲染成 `cover.jpg`
- 首页 `content/_index.md` 的「读书笔记」区块加一条

## 第三步：本仓库的书籍栏目约定

先读同栏目已有的两本书当模板，别凭记忆写：

```bash
ls content/books/
cat content/books/<任一本>/_index.md
head -12 content/books/<任一本>/<任一章>.md
sed -n '55,100p' content/_index.md     # 「读书笔记」区块
```

### 章节文件 front matter

```markdown
---
title: "第4章 容斥原理"
date: 2026-11-25
draft: true
toc: true
---
```

- `draft: true` 是默认。用户明确要求发布才去掉。
- `title` 用「第N章 标题」，中英文之间留空格；OCR 常见的 `第4章容斥原理`、`第8章 归 纳 法`、`附录:递推关系` 都要顺手规范化。
- 已有 `---` front matter 的源文件：合并字段，不要嵌套两层 `---`。

### `_index.md`

```markdown
---
title: "112个组合问题：来自AwesomeMath夏季课程"
date: 2026-11-25
noList: true
---

![cover](./cover.jpg)

## 关于这本书

- 原书: *英文原名*
- 作者: ...
- 译者: ...
- 出版: ...

一两段说明这本书讲什么、适合谁看。

## 内容

- [序言](./00-序言.md)
- [第1章 计数的基本知识](./01-计数的基本知识.md)
...
```

`noList: true` 关掉主题自动列表，目录手写，链接用相对 `.md` 路径。

### 首页登记

`content/_index.md` 里「读书笔记」的 `children` 列表，按现有格式加一条：

```yaml
      - name: 112个组合问题
        icon: "books/112-combinatorial-problems/cover.jpg"
        link: "books/112-combinatorial-problems"
```

**改首页前先确认**——这是全站入口，不属于「搬文件」的默认动作，用户没说就别动。

## 第四步：写搬迁脚本

纯机械转换，写成一次性 Python 脚本比手改 20 个文件可靠。放 `/tmp/`，不要塞进仓库。
下面是实际用过的版本，按源目录形状调整正则即可：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把外部 md 书籍目录搬进 hugo-blog 的 content/books/<书名>/。"""
import re, shutil
from pathlib import Path

SRC = Path("<源目录>")
DST = Path("content/books/<书名>")
DATE = "<YYYY-MM-DD>"

PDF_RE = re.compile(r"^> \[原书 PDF 第 ([^\]]+?) 页\]\([^)]*\)\s*$")
IMG_RE = re.compile(r"!\[([^\]]*)\]\((images/[^)]+)\)")
H2_RE = re.compile(r"^## (.+)$", re.M)

copied, skipped = [], []

for chapter_dir in sorted(p for p in SRC.iterdir() if p.is_dir()):
    md_src = chapter_dir / f"{chapter_dir.name}.md"
    if not md_src.exists():
        print(f"!! 跳过 {chapter_dir} (无同名 md)")
        continue

    text = md_src.read_text(encoding="utf-8")
    lines = text.split("\n")

    # 首行 PDF 链接 -> 纯文本
    if lines and PDF_RE.match(lines[0]):
        pages = PDF_RE.match(lines[0]).group(1)
        lines[0] = f"> 原书 PDF 第 {pages} 页"
    text = "\n".join(lines)

    # 从唯一的 h2 取章节标题
    m = H2_RE.search(text)
    title = re.sub(r"\s+", " ", m.group(1).strip()) if m else chapter_dir.name

    # 图片: 只搬被引用的, 重写路径
    def repl(mo):
        alt, rel = mo.group(1), mo.group(2)
        name = Path(rel).name
        src_img = chapter_dir / rel
        dst_img = DST / "images" / chapter_dir.name / name
        if not src_img.exists():
            skipped.append(f"{chapter_dir.name}/{name} (缺失)")
            return mo.group(0)
        dst_img.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_img, dst_img)
        copied.append(f"{chapter_dir.name}/{name}")
        return f"![{alt}](images/{chapter_dir.name}/{name})"

    text = IMG_RE.sub(repl, text)

    fm = (
        "---\n"
        f'title: "{title}"\n'
        f"date: {DATE}\n"
        "draft: true\n"
        "toc: true\n"
        "---\n\n"
    )
    (DST / f"{chapter_dir.name}.md").write_text(fm + text, encoding="utf-8")
    print(f"ok  {chapter_dir.name}.md")

print(f"\n图片: 复制 {len(copied)} 张, 缺失 {len(skipped)}")
for s in skipped:
    print("  missing:", s)
```

脚本里要打印**每一条**处理结果，跑完立刻能看出有没有漏章、缺图。

跑完再做一次标题规范化（脚本取的 title 常带 OCR 空格）：

```python
import re, pathlib
for p in sorted(pathlib.Path("content/books/<书名>").glob("*.md")):
    t = p.read_text(encoding="utf-8")
    m = re.search(r'^title: "(.+)"$', t, re.M)
    if not m: continue
    old = m.group(1)
    mm = re.match(r"^第\s*(\d+)\s*章\s*(.*)$", old)
    if mm:
        new = f"第{mm.group(1)}章 {re.sub(r'\s+', '', mm.group(2))}"
    elif old.startswith("附录"):
        new = re.sub(r"\s*[:：]\s*", " ", old)
    else:
        continue
    if new != old:
        p.write_text(t.replace(f'title: "{old}"', f'title: "{new}"', 1), encoding="utf-8")
        print(f"{old!r} -> {new!r}")
```

### 封面

仓库里通常没有现成封面，从 PDF 首页渲染：

```bash
pdftoppm -f 1 -l 1 -jpeg -r 80 -singlefile "<书.pdf>" /tmp/cover
cp /tmp/cover.jpg content/books/<书名>/cover.jpg
```

渲染后**用 read 工具看一眼**，确认不是空白页或纯版权页。`Syntax Warning: Invalid number of shared object groups` 是 poppler 的噪音，可忽略。

## 第五步：修 KaTeX 报错

这是搬 OCR 书最容易翻车的地方。`hugo` 构建成功不代表公式能渲染——
Goldmark 把 `$...$` 透传给 KaTeX，KaTeX 遇到不合法输入会抛错并渲染成红色报错块。

```bash
hugo -D 2>&1 | grep -c 'KaTeX parse error'
hugo -D 2>&1 | grep 'KaTeX parse error' | grep -o 'books/<书名>/[^:]*\.md' | sort | uniq -c
```

### 定位

报错信息里带 `at position N: …上下文…`，但 position 是**公式内部**偏移，不是行内列号。
按「文件名 + 出现的非法字符」批量找更快：

```python
import re, pathlib
for p in sorted(pathlib.Path("content/books/<书名>").glob("*.md")):
    t = p.read_text(encoding="utf-8")
    for m in re.finditer(r"\$\$(.+?)\$\$|\$(.+?)\$", t, re.S):
        seg = m.group(1) if m.group(1) is not None else m.group(2)
        if re.search(r"[\u4e00-\u9fff]", seg):
            print(f"--- {p.name} [{m.start()}]\n{seg.strip()}\n")
```

### 三类成因与修法

**1. 中文混进公式**（最常见，占九成）

```
\underbrace{n \cdot n}_{k 个因数}        →  _{\text{k 个因数}}
\pmod{2}  或  C \equiv                  →  \pmod{2} \text{ 或 } C
\cdots \cdots  上                        →  公式整段退出，改成正文「……上」
```

中文一律包进 `\text{}`。但如果这个公式本身就是 OCR 把中文句子误判成公式（`$\cdots \cdots 上$`、`$"在 \cdots 上"$`），
更该做的是**把整段公式换成普通中文**，别硬塞 `\text`。

**2. `\textcircled{1}` 脚注标记**

KaTeX 的 `\textcircled` 只能在 text mode 用，且 `①` 本身在数学模式里是未知字符。
正确做法是把标记**移到公式外面**，并和文件底部的脚注对上：

```markdown
$\binom{14}{3} = 364$①
...
<small><span class="docvortex-page-footnote">① 口味仍有n种.——译者注</span></small>
```

**3. OCR 字符错认**

```
$2^{n}  千  1$     →  $2^{n} + 1$        # 千 是 + 的误认
$口 ABDC$          →  平行四边形 $ABDC$   # 口 是 □ 的误认
```

这类必须**回到原文核实**，不能猜。优先手段：

- 源目录里若同时有英文版 OCR（如 `markdown-en/`），对照英文原句最可靠：
  ```bash
  grep -rn 'integer coordinates' <src-en>/ | head -3
  ```
- 没有英文版就 `pdftoppm -f <页> -l <页>` 渲出该页，read 看图核对。

### 修完必须复查

```bash
hugo -D 2>&1 | grep -icE 'error'          # 必须是 0
for f in public/books/<书名>/*.html; do
  n=$(grep -c 'katex-error' "$f"); [ "$n" != "0" ] && echo "$n $f"
done                                       # 必须无输出
```

只信 `hugo` 退出码不够——KaTeX 报错在旧版 Hugo 里不一定让构建失败，但页面里会留 `katex-error` 红块。

## 第六步：验证

```bash
hugo -D --quiet; echo "exit=$?"
hugo -D 2>&1 | grep -iE 'warn|error' | head
```

还要肉眼确认三件事：

```bash
# 1. 页面都生成了
ls public/books/<书名>/

# 2. 图片路径能对上（Hugo 会把中文 URL 编码，正常）
grep -o '<img[^>]*>' public/books/<书名>/<某章>.html | head -3
ls public/books/<书名>/images/<原目录名>/ | head -3

# 3. 首页真的链到了
grep -o 'books/<书名>[^"]*' public/index.html | head -3
```

## 第七步：汇报

给用户的清单要具体：

- 新增目录和文件数（几章、几张图、总体积）
- 改了哪些已有文件（首页 `_index.md`？某本旧书的目录？）
- 搬了什么、**没搬什么、为什么**（锁文件、孤儿图、英文版、原 PDF）
- 修了哪些 OCR 破损，逐条列出改前改后
- `hugo` 是否 0 error，`katex-error` 是否清零
- 还有哪些已知瑕疵没处理（例如 `\hat{p}` 这类需逐处对 PDF 确认的）

## 检查清单

搬完后逐条过：

- [ ] 每个章节文件都有 front matter，且没有双层 `---`
- [ ] `title` 是「第N章 标题」格式，OCR 空格已清理
- [ ] 首行的 PDF 链接不再指向不存在的相对路径
- [ ] 图片只搬了被引用的，引用路径与磁盘路径一致
- [ ] 没有带进 `.convert.lock`、`.extracted/`、`markdown-en/` 之类的中间产物
- [ ] `_index.md` 的目录链接与磁盘文件名逐一对应
- [ ] 首页登记已加（且已征得用户同意）
- [ ] `hugo -D` 0 error，`katex-error` 计数为 0
- [ ] `git status` 里没有意外多出的文件

## 常见坑

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 构建成功但页面公式是红字 | KaTeX 报错不阻断构建 | 查 `katex-error`，按第五步修 |
| 图片全裂 | 只搬了 md 没搬 images，或路径没重写 | 重跑脚本的图片段，确认 `images/<目录>/` 存在 |
| 章节页面 404 | `_index.md` 链接名和文件名不一致 | `ls` 对比，注意拍平后少了中间一层 |
| 首页多出一堆文章 | 没设 `noList: true` | 补到 `_index.md` front matter |
| 仓库膨胀几十 MB | 搬了 PDF 或孤儿图 | 只搬被引用的图片，PDF 留在原处 |
| `{{` 报 shortcode 错误 | 数学公式里出现 `{{` | 检查是否被 Hugo 当 shortcode；实测 `\binom{{ \tilde k }}{2}` 这类通常安全，但构建后要看一眼 |
