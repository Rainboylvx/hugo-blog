---
title: "归档：TypeScript 旧笔记"
date: 2026-09-21
noList: true
toc: false
---

这里保存 2026-09-21 重写之前的 TypeScript 笔记。内容已被新体系吸收或替代，保留在此仅供对照，**不建议作为学习材料**。

新体系见 [TypeScript 学习笔记](../)。

## 归档内容

- [旧栏目页快照](./legacy-index.md) — 重写前的 `_index.md`（678 行），含资料链接、安装、类型、接口、类、泛型、命名空间、parcel、jquery 等混排内容
- [旧 readme 快照](./legacy-readme.md) — 另一份早期整理的 TS 笔记（243 行），用 `include` 引入 demo 代码
- [reading-notes](./reading-notes.md) — 《Programming TypeScript》前两章整理，写到"泛形约束"中断
- [debug](./debug.md) — 用 vscode 调试 ts 的极简记录
- [decorator](./decorator.md) — 装饰器的一句话概括与 include 示例
- [object-literal](./object-literal.md) — 对象字面量的类型注解、可选/只读属性、索引签名
- [object-vs-object](./object-vs-object.md) — `object` 与 `Object` 的对比表
- [preserve-const-enums](./preserve-const-enums.md) — `preserveConstEnums` 编译选项与 `const enum` 内联
- [typeof-usage](./typeof-usage.md) — `typeof` 的四种用法
- [class-value-and-type](./class-value-and-type.md) — 类声明既是值又是类型
- `src/` — 旧 B 站教程示例代码（`demo1.ts`-`demo21.ts`，编号对应视频集数）

## 内容去向

| 归档文件 | 新文章 |
|---|---|
| `legacy-index.md` | 资料链接 → [栏目页资源节](../)；类型/接口/类/泛型 → 组 1-3 各长文 |
| `legacy-readme.md` | 同 `legacy-index.md`，内容高度重叠 |
| `reading-notes.md` | [type-erasure](../type-erasure.md)、[generics](../generics.md)、[advanced-types](../advanced-types.md) |
| `debug.md` | [running-ts](../running-ts.md) |
| `decorator.md` | [decorators-legacy](../decorators-legacy.md) |
| `object-literal.md` | [type-basics](../type-basics.md) |
| `object-vs-object.md` | [object-and-Object](../object-and-Object.md) |
| `preserve-const-enums.md` | [enum-in-depth](../enum-in-depth.md) |
| `typeof-usage.md` | [typeof-two-meanings](../typeof-two-meanings.md) |
| `class-value-and-type.md` | [class-value-and-type](../class-value-and-type.md)（新文接管原 URL） |
