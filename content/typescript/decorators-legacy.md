---
title: "装饰器（legacy）"
date: 2026-09-21
weight: 62
draft: false
toc: true
tags: ["typescript"]
---

legacy 装饰器是 TypeScript 早期的实验实现，需要 `experimentalDecorators: true`。它在 ECMAScript 标准化之前就存在，与标准装饰器**语义不同**。nestjs、TypeORM、Angular 都依赖它。

## 配置

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

`emitDecoratorMetadata` 是可选的，它让装饰器能读取类型信息（需要 `reflect-metadata`）。

> [!IMPORTANT] 这是全局开关
> `experimentalDecorators: true` 会让**所有**装饰器按 legacy 语义解释，不能只对部分类生效。所以标准装饰器和 legacy 装饰器不能共存于同一个项目配置里。

## 五种装饰器

| 位置 | 签名 |
|---|---|
| 类 | `(ctor) => ctor \| void` |
| 方法 | `(target, key, descriptor) => descriptor \| void` |
| 属性 | `(target, key) => void` |
| 访问器 | `(target, key, descriptor) => descriptor \| void` |
| 参数 | `(target, key, parameterIndex) => void` |

### 类装饰器

{{< include "src/decorators-legacy/class-decorator.ts" "ts" >}}

```text
register: BugReport
bug p 2020-01-01T00:00:00.000Z
```

类装饰器可以**返回一个新类**来替换原类：

```typescript
function withTimestamp<T extends new (...args: any[]) => object>(ctor: T) {
  return class extends ctor {
    createdAt = new Date("2020-01-01");
  };
}

@withTimestamp
class Post { title = "p"; }

const p = new Post();
p.createdAt;
// error TS2339: Property 'createdAt' does not exist on type 'Post'.
```

> [!WARNING] 类型不会跟着更新
> 类装饰器替换了类，但**类型定义不变**。要用新字段必须断言：
>
> ```typescript
> (p as Post & { createdAt: Date }).createdAt;
> ```
>
> 这是 legacy 装饰器的已知限制。标准装饰器没有这个问题（但它也不能替换类）。

### 方法装饰器

{{< include "src/decorators-legacy/method-decorator.ts" "ts" >}}

```text
call add(1,2)
3
call greet(rainboy)
hi rainboy
1.0
赋值后: 1.0
```

方法装饰器接收 `descriptor`，可以包装原方法：

```typescript
function log(target: object, key: string, descriptor: PropertyDescriptor): void {
  const original = descriptor.value as (...args: unknown[]) => unknown;
  descriptor.value = function (this: unknown, ...args: unknown[]) {
    console.log(`call ${key}(${args.join(",")})`);
    return original.apply(this, args);
  };
}
```

### 属性装饰器

**没有** `descriptor` 参数——这是和其他装饰器的区别：

```typescript
function readonly(target: object, key: string): void {
  Object.defineProperty(target, key, { writable: false });
}
```

因为属性装饰器只能拿到 `target` 和 `key`，它**无法改变初始值**。这是 legacy 装饰器的一个能力缺口（标准装饰器补上了这一点）。

### 访问器装饰器

{{< include "src/decorators-legacy/accessor-decorator.ts" "ts" >}}

```text
Mr. RAINBOY
```

可以包装 getter：

```typescript
function upperCase(target: object, key: string, descriptor: PropertyDescriptor): void {
  const original = descriptor.get;
  if (original) {
    descriptor.get = function (this: unknown) {
      return String(original.call(this)).toUpperCase();
    };
  }
}
```

### 应用顺序

多个装饰器**从下往上**应用（靠近声明的先执行）：

```typescript
@prefix("Mr. ")      // 后执行
@upperCase           // 先执行
get name() { return this._name; }
// 结果：Mr. RAINBOY
```

但装饰器**工厂**的求值顺序相反（从上往下）：

```typescript
@factoryA()   // 先求值（拿到装饰器函数）
@factoryB()   // 后求值
class C {}
```

## `emitDecoratorMetadata`

开启后，TypeScript 把类型信息写进装饰器元数据：

{{< include "src/decorators-legacy/metadata.ts" "ts" >}}

三个可读的 key：

```typescript
Reflect.getMetadata("design:type", target, key)         // 属性类型
Reflect.getMetadata("design:paramtypes", target, key)   // 参数类型数组
Reflect.getMetadata("design:returntype", target, key)   // 返回类型
```

需要 `reflect-metadata` 提供运行时支持。

### 实测：工具链兼容性

这是实践中最容易踩的坑：

```bash
# 用 tsc 编译后运行 —— 元数据存在
$ npx tsc -p content/typescript/src/decorators-legacy --outDir .../.emit --noEmit false
$ node .../.emit/metadata.js
find: params=[Number,String] return=Boolean

# 用 tsx 直接运行 —— 元数据丢失
$ npx tsx content/typescript/src/decorators-legacy/metadata.ts
find: params=[] return=undefined
```

| 工具 | 装饰器本身 | `emitDecoratorMetadata` |
|---|---|---|
| `tsc` | ✓ | ✓ |
| `tsx` / esbuild | ✓ | ✗ |
| swc（需配置） | ✓ | ✓（需显式开） |

> [!WARNING] 这决定了 nestjs 项目的构建方式
> nestjs 的依赖注入靠 `design:paramtypes` 拿到构造函数参数类型，决定注入什么。所以 nestjs 项目**必须**用 `tsc`（或配置了元数据的 swc）编译，**不能**用 esbuild/tsx 直接跑。
>
> 这是 nestjs 生态的结构性约束，不是配置问题。

## 为什么还在用

尽管有标准装饰器，legacy 仍在广泛使用：

| 原因 | 说明 |
|---|---|
| 生态依赖 | nestjs、TypeORM、Angular、class-validator 都用它 |
| 元数据能力 | 标准装饰器没有 `emitDecoratorMetadata` 的对应物 |
| 类替换 | legacy 类装饰器能返回新类，标准装饰器不能 |

## 与标准装饰器的选择

见 [装饰器（标准）](./decorators-standard.md)。简单规则：

- **用 nestjs / TypeORM / Angular** → 只能 legacy
- **新项目，不需要元数据** → 标准装饰器（工具链兼容性更好）
- **想用 esbuild/swc 高速构建 + 装饰器** → 只能标准装饰器

## 相关

- [装饰器（标准）](./decorators-standard.md) —— TC39 标准装饰器与差异对照
- [类与装饰器](./classes-and-decorators.md) —— 类成员与两种路线的完整对比
- [运行 TypeScript](./running-ts.md) —— 工具链兼容性
- [TypeScript 版本现状](./typescript-in-2026.md) —— TS 7 对工具链的影响
