---
title: "装饰器（标准）"
date: 2026-09-21
weight: 63
draft: false
toc: true
tags: ["typescript"]
---

标准装饰器（TC39 stage-3）从 TS 5.0 起支持，**不需要任何配置**。它的签名是 `(value, context)`，语义与 legacy 装饰器不同。

## 配置

不需要配置。**不要**开 `experimentalDecorators`——开了之后标准装饰器会被按 legacy 语义解释。

## `context` 对象

标准装饰器的第二个参数是 context，包含：

| 字段 | 含义 |
|---|---|
| `name` | 成员名（可能是 `string` 或 `symbol`） |
| `kind` | `"class"` / `"method"` / `"field"` / `"getter"` / `"setter"` / `"accessor"` |
| `static` | 是否静态成员 |
| `private` | 是否私有 |
| `metadata` | 装饰器之间传递数据的对象 |
| `access` | `{ get, set, has }`，访问成员的能力 |
| `addInitializer` | 注册初始化回调 |

## 各类装饰器

{{< include "src/decorators-standard/method.ts" "ts" >}}

```text
call add
3
ok
context 提供的字段: Calc
```

### 方法装饰器

```typescript
function logged<T extends (...args: any[]) => any>(
  fn: T,
  ctx: ClassMethodDecoratorContext,
): T {
  return function (this: unknown, ...args: unknown[]) {
    console.log(`call ${String(ctx.name)}`);
    return fn.apply(this, args);
  } as T;
}
```

注意 `this` 是 `unknown`，必须显式声明（legacy 里是隐式 `any`）。

### 字段装饰器可以改初始值

这是标准装饰器相对 legacy 的**能力增强**：

```typescript
function double(_value: undefined, ctx: ClassFieldDecoratorContext) {
  return function (this: unknown, initial: number) {
    return initial * 2;      // 可以改初始值
  };
}
```

字段装饰器返回一个函数，这个函数在实例初始化时被调用，返回值作为新的初始值。

### getter 装饰器

返回类型必须匹配原 getter：

```typescript
function upper(
  getter: (this: unknown) => string,
  ctx: ClassGetterDecoratorContext,
): (this: unknown) => string {
  return function (this: unknown) {
    return getter.call(this).toUpperCase();
  };
}
```

> [!WARNING] context 类型名容易写错
> 访问器装饰器的 context 是 `ClassAccessorDecoratorContext`，**不是** `ClassAutoAccessorDecoratorContext`。实测报错：
>
> ```text
> error TS2552: Cannot find name 'ClassAutoAccessorDecoratorContext'.
> Did you mean 'ClassAccessorDecoratorContext'?
> ```

## `addInitializer` 的执行时机

这是标准装饰器最需要实测的一点。

{{< include "src/decorators-standard/context-and-others.ts" "ts" >}}

```text
static method create, static=true
class Config, kind=class
field level 初始化
2 rainboy HELLO undefined
context 字段: name, kind, static, private, metadata, access
```

实测结论：

| 装饰器位置 | `addInitializer` 执行时机 | `this` 是 |
|---|---|---|
| **类装饰器** | **类定义时执行一次** | 类本身 |
| **字段/方法装饰器** | **每个实例构造时** | 实例 |

验证输出：

```text
装饰器执行, this 是 class: App
class 级 initializer 执行, this = 类本身
--- 创建实例 1 ---
field 级 initializer 执行, this 是实例: true
--- 创建实例 2 ---
field 级 initializer 执行, this 是实例: true
```

所以**给实例加属性必须用字段装饰器的 `addInitializer`**：

```typescript
// ✗ 错误：类装饰器里的 this 是类，不是实例
function withInit(value: T, ctx: ClassDecoratorContext) {
  ctx.addInitializer(function () {
    (this as any).ready = true;    // 挂到类上了
  });
}

// ✓ 正确：字段装饰器的 this 是实例
function perInstance(_v: undefined, ctx: ClassFieldDecoratorContext) {
  ctx.addInitializer(function () {
    (this as any).ready = true;    // 每个实例都有
  });
}
```

## 与 legacy 的差异对照

{{< include "src/decorators-standard/differences.ts" "ts" >}}

```text
[class initializer] App, this === 类: true
app! true
legacyStyle/legacyWithInit 仅作对比，未使用: function function
```

| 维度 | legacy | 标准 |
|---|---|---|
| 配置 | `experimentalDecorators: true` | 无需配置 |
| 签名 | `(target, key, descriptor)` | `(value, context)` |
| 改字段初始值 | ✗ 不支持 | ✓ 返回函数即可 |
| 给实例加属性 | 返回子类 hack | 字段装饰器 `addInitializer` |
| 类替换 | ✓ 可返回新类 | ✗ 不能替换 |
| 类型元数据 | `emitDecoratorMetadata` | ✗ 无，需自己实现 |
| `this` 类型 | 隐式 `any` | `unknown`，必须显式声明 |
| 工具链兼容 | 只有 `tsc` 完整支持 | esbuild/swc 均支持 |

## 该选哪条

**选标准装饰器：**

- 新项目
- 不需要运行时类型元数据
- 想用 esbuild/swc 的高速构建
- 想用 `accessor` 关键字

**选 legacy：**

- 用 nestjs / TypeORM / Angular
- 需要 `design:paramtypes` 元数据做依赖注入
- 需要类装饰器替换类

> [!TIP] 两者的根本分歧是"元数据"
> 标准装饰器**没有** `emitDecoratorMetadata` 的对应机制——TC39 的提案里没有类型元数据这一环（因为 JavaScript 没有类型）。
>
> 所以依赖注入框架要么继续用 legacy + `reflect-metadata`，要么自己实现元数据机制（如显式写 `@Inject("token")`）。这是 nestjs 至今无法迁移到标准装饰器的根本原因。

## 相关

- [装饰器（legacy）](./decorators-legacy.md) —— legacy 装饰器详解
- [类与装饰器](./classes-and-decorators.md) —— 类成员与两条路线总览
- [运行 TypeScript](./running-ts.md) —— 工具链兼容性
