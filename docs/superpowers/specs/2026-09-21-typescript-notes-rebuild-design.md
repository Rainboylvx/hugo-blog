# TypeScript 栏目体系重建设计

## 背景

`content/typescript/` 目前有 9 个 Markdown 文件、约 2064 行，结构上存在三个问题：

1. **栏目页与正文混在一起**。`_index.md` 有 678 行，既当栏目首页又当正文：资料链接、安装命令、数据类型、接口、类、泛型、命名空间、parcel、jquery 全部塞在一个页面里；同时主题 `list.html` 还会在页面底部自动列出所有子页面，形成"索引 + 大杂烩正文"的双重身份。
2. **知识体系不完整且断层**。`reading-notes.md` 825 行，覆盖《Programming TypeScript》前两章后写到"泛形约束"就断了（文件末尾留有空的 ` ```typescript ` 代码块）。条件类型、映射类型、模板字面量类型、`infer`、`satisfies`、声明合并、`.d.ts`、从 JS 迁移、装饰器标准版等 TS 核心内容完全缺失。
3. **内容来源与质量参差**。6 篇 AI 生成的单点短文（18-171 行）深度不一；`decorator.md` 只有一句话加一个 include；`src/` 下是 B 站教程的编号 demo（`demo1.ts`-`demo21.ts`，编号对应视频集数），会原样发布到 `public/`。

本次重写把栏目改造成**按知识层级推进的系统学习体系**，栏目页只做导航，正文各篇独立可复习。

## 目标

- 栏目页 `_index.md` 只显示文章列表（分组标题 + 链接 + 一句话说明）加末尾一个"资源"小节。
- 建立完整体系：从类型擦除的心智模型，经类型基础、类型组合与收窄、泛型、高级类型、类与装饰器，到工程化落地。
- 每篇配套可运行的示例代码，预期输出与预期报错都经过实际编译验证。
- 旧内容全部保留可访问，不丢外部链接。

## 方案选择

### 版本基准：双轨（采用）

`npm view typescript version` 返回 **7.0.2**。TypeScript 7 是编译器的 Go 原生重写版，2026-07-08 起成为 npm `latest`。它带来两个必须写清楚的现实：

- 7.0 **没有稳定的 programmatic API**，`ts-node@10` 因为读取 `ts.sys` 而直接失效，`ts-jest@29` 把 peer 依赖锁在 `typescript <7`。
- Node.js 原生 TypeScript 支持只覆盖 **erasable syntax**：本地实测 Node v26.8.1 执行含 `enum` 的文件报 `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`。

因此采用双轨：**语言特性讲历史脉络（5.x 起 / 7.0 起分别标注），工具链只讲当前实际可用的组合**。既不假装 TS 7 之前的写法不存在，也不教已经跑不通的工具链。

### 旧内容处置：归档保留（采用）

旧文件整体移入 `content/typescript/_archive/`，内容被新文章吸收后仍可访问。相比直接删除，归档保留了原始覆盖范围作为对照，且不产生 404。

实测确认：Hugo 会正常渲染 `_archive/` 目录（下划线前缀不触发忽略），front matter 的 `aliases` 能正确生成跳转页。

### 站点改动最小化（采用）

只做三处站点级改动，全部可回退：

1. `hugo.yaml` 增加 `ignoreFiles`，阻止示例代码发布到 `public/`。
2. 新增 `layouts/partials/search-index.html` 覆盖主题同名文件，排除 `/_archive/`。
3. 仓库根新增 `package.json` + `tsconfig.json`，用于本地验证示例代码。

不改主题文件，不改首页菜单，不改其他栏目。

## 目录结构

```text
content/typescript/
├── _index.md                          # 栏目页：分组列表 + 资源
├── _archive/                          # 归档（noList: true）
│   ├── _index.md
│   ├── legacy-index.md                # 旧 _index.md 快照（678 行）
│   ├── class-value-and-type.md
│   ├── debug.md
│   ├── decorator.md
│   ├── object-literal.md
│   ├── object-vs-object.md
│   ├── preserve-const-enums.md
│   ├── reading-notes.md
│   ├── typeof-usage.md
│   └── src/                           # 旧 demo1-21 等
├── type-erasure.md                    # w=10  长文
├── type-basics.md                     # w=20  长文
├── annotations-vs-inference.md        # w=21
├── array-vs-tuple.md                  # w=22
├── function-types.md                  # w=23
├── readonly-and-immutability.md       # w=24
├── narrowing.md                       # w=30  长文
├── enum-in-depth.md                   # w=31
├── interface-vs-type.md               # w=32
├── object-and-Object.md               # w=33
├── typeof-two-meanings.md             # w=34
├── class-value-and-type.md            # w=35
├── excess-property-check.md           # w=36
├── generics.md                        # w=40  长文
├── generic-inference-positions.md     # w=41
├── advanced-types.md                  # w=50  长文
├── conditional-types-infer.md         # w=51
├── mapped-types.md                    # w=52
├── template-literal-types.md          # w=53
├── builtin-utility-types.md           # w=54
├── satisfies-and-as-const.md          # w=55
├── declaration-merging.md             # w=56
├── classes-and-decorators.md          # w=60  长文
├── abstract-class-and-implements.md   # w=61
├── decorators-legacy.md               # w=62
├── decorators-standard.md             # w=63
├── engineering.md                     # w=70  长文
├── typescript-in-2026.md              # w=71
├── running-ts.md                      # w=72
├── dts-and-third-party-types.md       # w=73
├── migrating-from-js.md               # w=74
└── src/                               # 每篇配套示例代码
```

**7 篇长文 + 24 篇短文 = 31 篇**。

命名与排序规则：

- 文件名用英文 kebab-case，排序完全靠 front matter `weight`，不靠文件名前缀。
- `weight` 按"组号 + 组内序号"编排（10 / 20-24 / 30-36 / 40-41 / 50-56 / 60-63 / 70-74），每步留 9 个空位，插入新篇不必重编号。
- `object-and-Object.md` 刻意避开 `object-vs-object.md`：归档目录里已有同名旧文，避免 slug 冲突。

## 分组与篇目

### 组 0 心智模型

| weight | 篇目 | 一句话 |
|---|---|---|
| 10 | [type-erasure](./type-erasure.md) **长文** | 类型擦除：编译期与运行时的分界。TS 的类型在运行时不存在；哪些语法会留下运行时产物；这套边界推出的全部日常结论 |

### 组 1 类型基础

| weight | 篇目 | 一句话 |
|---|---|---|
| 20 | [type-basics](./type-basics.md) **长文** | 原始类型与字面量、注解与推断、对象类型（可选/只读/索引签名/多余属性检查）、数组与元组、函数类型 |
| 21 | [annotations-vs-inference](./annotations-vs-inference.md) | 什么时候必须写注解，什么时候写了是噪音 |
| 22 | [array-vs-tuple](./array-vs-tuple.md) | 数组与元组的选择，元组的定长、可选元素与只读形态 |
| 23 | [function-types](./function-types.md) | 参数逆变、`this` 参数、重载与实现签名、可选/默认/剩余参数 |
| 24 | [readonly-and-immutability](./readonly-and-immutability.md) | `readonly`、`ReadonlyArray`、`as const` 的深浅边界 |

### 组 2 类型组合与收窄

| weight | 篇目 | 一句话 |
|---|---|---|
| 30 | [narrowing](./narrowing.md) **长文** | 联合与交叉、字面量收窄、判别联合、控制流分析、类型谓词、穷尽性检查 |
| 31 | [enum-in-depth](./enum-in-depth.md) | 数字/字符串/`const enum`、反向映射、编译产物、`preserveConstEnums`、什么时候不该用 enum |
| 32 | [interface-vs-type](./interface-vs-type.md) | 声明合并、`extends` 与 `&`、同名冲突、选择标准 |
| 33 | [object-and-Object](./object-and-Object.md) | `object` 与 `Object` 的区别、`{}` 的陷阱、该用哪个 |
| 34 | [typeof-two-meanings](./typeof-two-meanings.md) | 值位置的运行时判断 vs 类型位置的类型查询 |
| 35 | [class-value-and-type](./class-value-and-type.md) | 类既是值又是类型：`C` 与 `typeof C`、实例侧与静态侧 |
| 36 | [excess-property-check](./excess-property-check.md) | 对象字面量的特殊规则、为什么变量赋值不报错、怎么绕过 |

### 组 3 泛型

| weight | 篇目 | 一句话 |
|---|---|---|
| 40 | [generics](./generics.md) **长文** | 函数/类/接口泛型、约束、默认参数、推断时机、泛型与多态的关系 |
| 41 | [generic-inference-positions](./generic-inference-positions.md) | 类型参数从哪些位置被推断，为什么有的推断不出来 |

### 组 4 高级类型

| weight | 篇目 | 一句话 |
|---|---|---|
| 50 | [advanced-types](./advanced-types.md) **长文** | 条件类型、`infer`、映射类型、模板字面量类型、`keyof`/索引访问、工具类型总览 |
| 51 | [conditional-types-infer](./conditional-types-infer.md) | 分布式条件类型、`infer` 的约束与多个 `infer` |
| 52 | [mapped-types](./mapped-types.md) | `+`/`-` 修饰符、键重映射 `as`、同态映射 |
| 53 | [template-literal-types](./template-literal-types.md) | 模板字面量的模式匹配，与映射类型组合 |
| 54 | [builtin-utility-types](./builtin-utility-types.md) | `Partial`/`Required`/`Pick`/`Omit`/`Record`/`Exclude`/`Extract`/`ReturnType`/`Parameters`/`Awaited` 等 |
| 55 | [satisfies-and-as-const](./satisfies-and-as-const.md) | 保留推断还是断言，TS 4.9 前后的写法对比 |
| 56 | [declaration-merging](./declaration-merging.md) | interface 合并、namespace 合并、`declare module`、给第三方库加类型 |

### 组 5 类与装饰器

| weight | 篇目 | 一句话 |
|---|---|---|
| 60 | [classes-and-decorators](./classes-and-decorators.md) **长文** | 成员修饰符、参数属性、getter/setter、`static`、抽象类、两种装饰器路线 |
| 61 | [abstract-class-and-implements](./abstract-class-and-implements.md) | 抽象类与 interface 的分工，`implements` 到底检查什么 |
| 62 | [decorators-legacy](./decorators-legacy.md) | `experimentalDecorators`、五类装饰器、`emitDecoratorMetadata`、nestjs 为什么依赖它 |
| 63 | [decorators-standard](./decorators-standard.md) | TC39 stage-3 装饰器、`ClassMethodDecoratorContext`、与 legacy 的语义差异 |

### 组 6 工程化

| weight | 篇目 | 一句话 |
|---|---|---|
| 70 | [engineering](./engineering.md) **长文** | tsconfig 详解、编译与运行、声明文件、从 JS 迁移、构建与类型检查 |
| 71 | [typescript-in-2026](./typescript-in-2026.md) | 5.x/6.x/7.0 的定位，TS 7 的 Go 重写与 compiler API 移除，6→7 的删除项 |
| 72 | [running-ts](./running-ts.md) | `tsc`/`tsx`/`ts-node` 现状、Node 原生 type stripping 与 erasable syntax、调试配置 |
| 73 | [dts-and-third-party-types](./dts-and-third-party-types.md) | `@types/*`、`declare`、`.d.ts` 与 `.ts` 的区别、写自己的声明文件 |
| 74 | [migrating-from-js](./migrating-from-js.md) | `allowJs`/`checkJs`、逐步收紧、`any` 治理、常见坑 |

## 长文与短文的边界

采用"官方 Handbook 主线 + 踩坑点"划分：

- **长文（400-800 行）**：对应官方 Handbook 的一个主线章节（如 Everyday Types、Narrowing、Generics、Creating Types from Types、Classes），按完整叙述组织，可从头读到尾。
- **短文（100-250 行）**：只写两类内容——(a) 官方讲得散、需要在一处汇总的点；(b) 官方没强调但实际会踩的坑。短文是"一个可独立检索的疑问"，不承担章节串联职责。

长文之间通过正文相对链接串联；短文被长文和栏目页双向链接。

## 写作与代码约定

### front matter 模板

```markdown
---
title: "标题"
date: 2026-09-21
weight: 20
draft: true
toc: true
tags: ["typescript"]
---
```

新文一律先 `draft: true`，用户审阅后统一去掉。

### 示例代码组织

- 每篇配套 `content/typescript/src/<slug>/`，文章用 `{{< include "src/<slug>/xxx.ts" "ts" >}}` 引入。
- 预期输出写在代码块下方（不在 `src/` 里放 README）。
- **有意报错的示例统一用 `// @ts-expect-error`**：既让 `tsc --noEmit` 保持零错误，又能证明错误确实发生在该行；一旦错误消失，`@ts-expect-error` 自身会报错。
- 装饰器示例需要独立 tsconfig：legacy 需要 `experimentalDecorators: true`，标准装饰器需要它为 false，两者不能共存于同一个配置。因此装饰器目录各自带一份 `tsconfig.json`，并从根 tsconfig 排除。

### 归档与旧 URL

归档文件加 `aliases` 指回原 URL。唯一例外：`_archive/class-value-and-type.md` **不加 alias**，因为新体系里有一篇同名文章接管了 `/typescript/class-value-and-type.html`。

| 旧文件 | 旧 URL | 归档后 alias | 内容去向 |
|---|---|---|---|
| `_index.md` | `/typescript/` | 无（新栏目页接管） | 资料→`_index.md` 资源节；其余分散到各组 |
| `reading-notes.md` | `/typescript/reading-notes.html` | 有 | 组 0、组 3、组 4 |
| `debug.md` | `/typescript/debug.html` | 有 | `running-ts` |
| `decorator.md` | `/typescript/decorator.html` | 有 | `decorators-legacy` |
| `object-literal.md` | `/typescript/object-literal.html` | 有 | `type-basics` |
| `object-vs-object.md` | `/typescript/object-vs-object.html` | 有 | `object-and-Object` |
| `preserve-const-enums.md` | `/typescript/preserve-const-enums.html` | 有 | `enum-in-depth` |
| `typeof-usage.md` | `/typescript/typeof-usage.html` | 有 | `typeof-two-meanings` |
| `class-value-and-type.md` | `/typescript/class-value-and-type.html` | **无** | `class-value-and-type`（新文接管 URL） |

`src/` 整体移入 `_archive/src/`。

## 站点级改动

### 1. `hugo.yaml` 增加 ignoreFiles

```yaml
ignoreFiles:
  - "content/typescript/src/.*"
  - "content/typescript/_archive/src/.*"
```

**实测确认**：加了 `ignoreFiles` 后 `public/typescript/src/` 不再生成，但 `{{< include >}}` 的 `readFile` 仍能读到源码并正常高亮渲染（`readFile` 绕过 Hugo 页面管线）。

### 2. 搜索索引排除归档

主题的 `themes/hugo-dead-simple/layouts/partials/search-index.html` 用 `range .Site.Pages` 构建 `window.store`，会包含归档页。新增 `layouts/partials/search-index.html` 覆盖它，加一层 `if not (strings.Contains .RelPermalink "/_archive/")` 过滤，其余保持一致。只覆盖这一个 partial，不动主题其他文件。

### 3. 示例代码工具链

仓库根新增：

- `package.json`：`private: true`，`devDependencies` 为 `typescript@^7.0.2` 与 `tsx@^4.23.15`，脚本 `check: tsc --noEmit`。提交到 git。
- `tsconfig.json`：`strict: true`、`noEmit: true`，`include` 指向 `content/typescript/src`，排除装饰器目录。

验证环境（已实测）：

```bash
npm install
npx tsc -v      # Version 7.0.2
npx tsx --version
npm run check   # 示例代码零错误
```

## 实施步骤

### 第一批：骨架（已完成）

1. ✅ 本设计文档。
2. ✅ 建立 `_archive/`：移动 9 个旧 md 与 `src/`，写 `_archive/_index.md`（`noList: true`），按上表补 `aliases`。
3. ✅ 重写 `_index.md`：分组列表 + 资源节。
4. ✅ 站点级改动：`hugo.yaml`、`layouts/partials/search-index.html`、`package.json`、`tsconfig.json`。
5. ✅ 长文样本 `type-erasure.md`（301 行）+ 配套 `src/type-erasure/`。

### 第二批：长文补齐（已完成）

7 篇长文全部完成，共 2921 行，46 个示例代码文件，全部通过 `tsc --noEmit`：

| 篇目 | 行数 |
|---|---|
| `type-erasure.md` | 301 |
| `type-basics.md` | 342 |
| `narrowing.md` | 355 |
| `generics.md` | 284 |
| `advanced-types.md` | 553 |
| `classes-and-decorators.md` | 497 |
| `engineering.md` | 589 |

写作中通过实测修正的原始假设（都是凭记忆写错、编译验证后改正的）：

- `let b;` 是 evolving any，**不**触发 `noImplicitAny`（原写作说会触发）
- `satisfies` 用于数组时索引访问得到联合，不是每元素字面量
- 映射类型的 `as` 重映射**保留**修饰符；`keyof T & string` 才丢失
- `in` 对**可选**属性的负分支不能排除该类型（`swim?` 的陷阱）
- TS 7 递归类型上限约 1000 层，不是常说的 ~50 层
- 类装饰器的 `addInitializer` 在**类定义时**执行（`this` 是类），字段装饰器才在实例构造时执行
- `#private` 在类外访问是**语法错误**，不是类型错误
- `tsx`/esbuild **不实现** `emitDecoratorMetadata`（已实测复现）
- TS 7 把 lib 移到平台包，`lib: ["esnext"]` 不再含 `console`，需要 `types: ["node"]`

### 第三批：短文补齐（已完成）

24 篇短文全部完成。`enum-in-depth`、`object-and-Object`、`typeof-two-meanings`、`class-value-and-type` 已吸收归档旧文的可用内容。

写作中通过实测修正的原始假设：

- 定长元组**允许** `push`；只有 `readonly` 元组阻止修改
- `[]` 推断为 evolving `any[]`（TS7034），不是 `never[]`
- 数字枚举拒绝任意数字**字面量**（`999` 报错），但接受 `number` 变量
- `{}` 与 `Object` 行为完全一致（可互相赋值）
- 同名 `infer` 多次出现产生**联合**，不是交叉
- `keyof ({a:1} | {b:2})` 是 `never`（联合取交集）
- 映射类型的 `as` 重映射**保留**修饰符；`keyof T & string` 才丢失
- `${number}` 接受负数、科学计数法、十六进制
- 类装饰器的 `addInitializer` 在类定义时执行（`this` 是类）
- 重复 `type` 声明的 TS2300 报在**两处**声明上
- `require('typescript')` 在 TS 7 只导出 `version` 和 `versionMajorMinor` 两个键
- `tsx` 支持标准装饰器和 legacy 装饰器，但**不实现** `emitDecoratorMetadata`

### 第四批：收尾（已完成）

- 31 篇全部 `draft: true` → `draft: false`
- 不带 `-D` 的构建验证：31 篇全部发布，0 缺失
- 质量审计：无空代码块、无未闭合代码块、无遗留占位符
- 内部链接：177 个，全部有效
- 发布验证：`src/` 未发布、归档 10 页可访问、7 个旧 URL 跳转正常、搜索索引 0 个归档条目

## 最终交付

| 指标 | 数值 |
|---|---|
| 文章 | 31 篇（7 长 + 24 短） |
| Markdown 行数 | 7282 |
| 示例代码 | 81 个 `.ts` |
| 代码检查 | 3 套 tsconfig 全零错误 |
| 内部链接 | 177 个全部有效 |
| 旧 URL 兼容 | 7 个跳转页 |

## 验证方式

- 每篇写作时手动运行 `npx tsc --noEmit`（或对装饰器目录单独跑），把真实编译结果写进文章。
- 预期输出用 `npx tsx <file>` 实跑获得，不凭记忆写。
- 预期报错用 `// @ts-expect-error` 在源码里锚定，文章里引用真实错误消息。
- 全站构建：

```bash
hugo --quiet
```

本地预览：

```bash
hugo server -D --bind 0.0.0.0
```

检查清单：`public/typescript/src/` 不应存在；`public/typescript/_archive/` 应存在；旧 URL 应生成跳转页。

## 不在本次范围内

- 不写框架实战（nestjs / react），已有独立栏目 `content/program_language/nestjs/`。
- 不写 JS 语言入门，只写与 TS 相关的 JS 语义（类型擦除、运行时与编译期边界、`this`、原型、模块、class 运行时行为）。
- 不写类型体操题库，只在 `advanced-types` 里给训练路径。
- 不改主题文件、不改首页菜单、不动其他栏目。
- 不引入自动化验证脚本（用户明确选择手动验证）。
