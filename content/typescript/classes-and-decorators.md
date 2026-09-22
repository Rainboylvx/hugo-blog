---
title: "类与装饰器"
date: 2026-09-21
weight: 60
draft: false
toc: true
tags: ["typescript"]
---

类在 TypeScript 里有两个身份：**运行时它是一个构造函数**，**编译期它是一个类型**。这个双重身份是理解类成员修饰符、`implements`、装饰器的前提。装饰器则是"在类定义时修改类行为"的元编程能力，它有两条互不兼容的路线，选择哪条决定了你的 `tsconfig` 和整个技术栈。

## 类成员与修饰符

{{< include "src/classes-and-decorators/members.ts" "ts" >}}

```text
a1(rainboy) 100 alias s/r 1
1 3 1
s
```

### 字段的种类

| 种类 | 写法 | 归属 |
|---|---|---|
| 实例字段 | `balance = 0` | 每个实例一份 |
| 只读字段 | `readonly id: string` | 只能在声明处或构造函数里赋值 |
| 静态字段 | `static total = 0` | 挂在类上，不在实例上 |
| 可选字段 | `nickname?: string` | 类型是 `string \| undefined` |

### 两种"私有"

这是最容易混淆的地方：

| 写法 | 检查时机 | 能否运行时绕过 |
|---|---|---|
| `private secret` | 只在编译期 | **能**，运行时属性真实存在 |
| `#realSecret` | 编译期 + 运行时 | **不能**，是真正的私有槽 |

实测证明 `private` 只是编译期检查：

```typescript
class Account { private secret = "s"; }
const a = new Account();
console.log((a as any).secret);   // "s" —— 运行时确实能读到
```

而 `#` 私有字段连**解析**都过不去：

```typescript
const v = new Vault();
console.log(v.#value);
// SyntaxError: Private field '#value' must be declared in an enclosing class
```

注意这是**语法错误**而不是类型错误——它连编译都到不了。所以：

- 需要"提醒同事别碰"→ `private` 够了
- 需要"运行时真的访问不到"（安全边界）→ 必须用 `#`

### 参数属性

构造函数参数前加修饰符，会自动声明字段并赋值：

```typescript
class Point {
  constructor(
    public x: number,
    private y: number,
    readonly z: number = 0,
  ) {}
}
```

这是**不可擦除语法**——它生成真正的赋值代码（见 [类型擦除](./type-erasure.md)）。编译产物里 `this.x = x` 是显式存在的。

### getter / setter

```typescript
get label(): string { return `${this.id}(${this.owner})`; }
set label(v: string) { this.nickname = v; }
```

一个细节：如果只有 `get` 没有 `set`，属性自动变成 `readonly`。这在 TypeScript 4.3 之后是默认行为。

## 继承、抽象类与 `implements`

{{< include "src/classes-and-decorators/inheritance.ts" "ts" >}}

```text
[ '[circle area=3.14]', '[square area=4.00]' ]
1.2 c:3.14
derived
```

### 抽象类

```typescript
abstract class Shape {
  abstract area(): number;       // 子类必须实现
  describe(): string { ... }      // 子类继承
}
```

抽象类有两个作用：

1. **不能实例化**：`new Shape()` 报 `error TS2511: Cannot create an instance of an abstract class.`
2. **定义模板方法**：父类定义流程（`report()` 调用 `describe()` 调用 `area()`），子类只填 `area()`

### `implements` 检查什么

`implements` **只检查实例侧的形状**，不继承任何实现：

```typescript
interface Serializable { serialize(): string }

class Version implements Serializable, Comparable<Version> {
  serialize(): string { ... }     // 必须自己实现
}
```

关键区别：

| | `extends` | `implements` |
|---|---|---|
| 继承实现 | ✓ | ✗ |
| 继承类型 | ✓ | ✗（只检查） |
| 数量 | 只能一个 | 可以多个 |
| 目标 | 类 | 类或接口 |

### `private` 破坏结构类型

TypeScript 通常是结构类型（看形状），但 `private` 字段是个例外：

```typescript
class HasPrivate { private secret = "s" }
class OtherPrivate { private secret = "s" }

// @ts-expect-error TS2322: 私有字段来源不同
const hp: HasPrivate = new OtherPrivate();
```

两个类结构完全一样，但因为 `private` 来自不同的声明，TypeScript 认为它们不兼容。这是**名义化**（nominal）检查的少数场景。

### `override` 关键字

显式标记覆写父类方法：

```typescript
class Derived extends Base {
  override greet(): string { return "derived"; }
}
```

`override` 本身是可选的，但配合 `noImplicitOverride` 开启后强制要求：

```typescript
class Derived extends Base {
  greet(): string { return "d"; }
  // error TS4114: This member must have an 'override' modifier because it overrides
  // a member in the base class 'Base'.
}
```

它能防止"父类方法改名后子类不再覆写它"的隐蔽 bug。

## `this` 类型与泛型类

{{< include "src/classes-and-decorators/this-and-generics.ts" "ts" >}}

```text
select * from users select *
rainboy 1 1 data
```

### `this` 类型实现链式调用

```typescript
class QueryBuilder {
  select(cols: string): this { ...; return this; }
  from(table: string): this { ...; return this; }
}
```

返回类型写 `this`（而不是 `QueryBuilder`）的好处：**子类继承后链式调用不丢类型**。

```typescript
class FilterBuilder extends QueryBuilder {
  where(cond: string): this { ...; return this; }
}

new FilterBuilder().select("*").where("id=1").build();
// 如果 select 返回 QueryBuilder，这里 where 就调用不到了
```

### 泛型类

```typescript
class Repository<T extends Entity> {
  save(item: T): void { }
  find(id: string): T | undefined { }
}
```

泛型参数绑定在**实例**上，创建时确定。

### 静态方法不能引用类的类型参数

```typescript
class Box<T> {
  static of<U>(v: U): Box<U> { return new Box(v); }   // 自己声明 U

  static bad(v: T): Box<T> { }
  // error TS2302: Static members cannot reference class type parameters.
}
```

原因：静态成员属于**类本身**，而 `T` 属于**实例**。类存在时还没有实例，`T` 无从确定。静态方法需要泛型就自己声明一个。

## 装饰器：两条路线

装饰器是"在类定义时修改类行为"的语法。TypeScript 支持两套**语义不同、不能混用**的装饰器：

| | legacy | 标准（TC39 stage-3） |
|---|---|---|
| 配置 | `experimentalDecorators: true` | 无需配置 |
| 来源 | TypeScript 早期实验实现 | ECMAScript 标准提案 |
| 元数据 | `emitDecoratorMetadata` 支持 | 无 |
| 签名 | `(target, key, descriptor)` | `(value, context)` |
| 字段装饰器 | 不能改初始值 | 返回函数可改初始值 |
| 谁在用 | **nestjs**、TypeORM、Angular | 新项目、库作者 |
| TS 版本 | 一直支持 | TS 5.0+ |

> [!IMPORTANT] 两者不能共存
> 同一个类不能既有 legacy 装饰器又有标准装饰器。`experimentalDecorators` 是**全局开关**，开了之后**所有**装饰器都按 legacy 语义解释。所以本仓库给两条路线各配了一份 `tsconfig.json`：
>
> - `src/decorators-legacy/tsconfig.json` → `experimentalDecorators: true`
> - `src/decorators-standard/tsconfig.json` → 无此选项

## Legacy 装饰器

{{< include "src/decorators-legacy/class-decorator.ts" "ts" >}}

```text
register: BugReport
bug p 2020-01-01T00:00:00.000Z
```

### 五种 legacy 装饰器

| 位置 | 签名 |
|---|---|
| 类 | `(ctor) => ctor \| void` |
| 方法 | `(target, key, descriptor) => descriptor \| void` |
| 属性 | `(target, key) => void` |
| 访问器 | `(target, key, descriptor) => descriptor \| void` |
| 参数 | `(target, key, parameterIndex) => void` |

{{< include "src/decorators-legacy/method-decorator.ts" "ts" >}}

```text
call add(1,2)
3
call greet(rainboy)
hi rainboy
1.0
赋值后: 1.0
```

### 类装饰器可以替换类

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

**类型不会跟着更新**——这是 legacy 类装饰器的已知限制。要用到新字段必须断言：

```typescript
(p as Post & { createdAt: Date }).createdAt;
```

### 应用顺序

多个装饰器从**下往上**应用（靠近类/成员的先执行）：

```typescript
@prefix("Mr. ")      // 后执行
@upperCase           // 先执行
get name() { return this._name; }
// 结果：Mr. RAINBOY
```

但装饰器**工厂**的求值是**从上往下**：

```typescript
@factoryA()   // 先求值（拿到装饰器函数）
@factoryB()   // 后求值
class C {}
```

### `emitDecoratorMetadata`

开启后，TypeScript 会把类型信息写进装饰器元数据：

{{< include "src/decorators-legacy/metadata.ts" "ts" >}}

三个可读的 key：

```typescript
Reflect.getMetadata("design:type", target, key)         // 属性类型
Reflect.getMetadata("design:paramtypes", target, key)   // 参数类型数组
Reflect.getMetadata("design:returntype", target, key)   // 返回类型
```

> [!WARNING] `tsx` / esbuild 不实现 `emitDecoratorMetadata`
> 这是实践中很容易踩的坑。同一个文件：
>
> ```bash
> # 用 tsc 编译后运行 —— 元数据存在
> $ npx tsc -p content/typescript/src/decorators-legacy --outDir .../.emit --noEmit false
> $ node .../.emit/metadata.js
> find: params=[Number,String] return=Boolean
>
> # 用 tsx 直接运行 —— 元数据丢失
> $ npx tsx content/typescript/src/decorators-legacy/metadata.ts
> find: params=[] return=undefined
> ```
>
> `reflect-metadata` 是必需的运行时依赖，它提供 `Reflect.getMetadata`。nestjs 的依赖注入正是靠 `design:paramtypes` 拿到构造函数参数类型来决定注入什么——所以 nestjs 项目**必须**用 `tsc`（或配置了元数据的 swc）编译，不能用 esbuild/tsx 直接跑。

## 标准装饰器（TS 5.0+）

{{< include "src/decorators-standard/method.ts" "ts" >}}

```text
call add
3
ok
context 提供的字段: Calc
```

标准装饰器的签名是 `(value, context)`，`context` 里有：

| 字段 | 含义 |
|---|---|
| `name` | 成员名（可能是 `symbol`） |
| `kind` | `"class"` / `"method"` / `"field"` / `"getter"` / `"setter"` / `"accessor"` |
| `static` | 是否静态成员 |
| `private` | 是否私有 |
| `metadata` | 装饰器间传递数据的对象 |
| `access` | `{ get, set, has }`，访问成员的能力 |
| `addInitializer` | 注册初始化回调 |

{{< include "src/decorators-standard/context-and-others.ts" "ts" >}}

```text
static method create, static=true
class Config, kind=class
field level 初始化
2 rainboy HELLO undefined
context 字段: name, kind, static, private, metadata, access
```

### 各类标准装饰器

```typescript
// 类：接收构造函数
function tagged(value: T, ctx: ClassDecoratorContext) { return value; }

// 方法：接收函数，返回替换函数
function logged(fn: T, ctx: ClassMethodDecoratorContext) { return wrapper; }

// 字段：返回初始化函数，可以改初始值
function double(_v: undefined, ctx: ClassFieldDecoratorContext) {
  return function (initial: number) { return initial * 2; };
}

// getter：返回类型必须匹配原 getter
function upper(getter: (this: unknown) => string, ctx: ClassGetterDecoratorContext) {
  return function (this: unknown) { return getter.call(this).toUpperCase(); };
}
```

注意 context 类型的准确名称：是 `ClassAccessorDecoratorContext`（不是 `ClassAutoAccessorDecoratorContext`），这个笔误很容易犯。

### `addInitializer` 的执行时机

这是标准装饰器最需要实测的一点：

| 装饰器位置 | `addInitializer` 执行时机 | `this` 是 |
|---|---|---|
| 类装饰器 | **类定义时执行一次** | 类本身 |
| 字段/方法装饰器 | **每个实例构造时** | 实例 |

实测验证：

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
// 错误：类装饰器里的 this 是类，不是实例
function withInit(value: T, ctx: ClassDecoratorContext) {
  ctx.addInitializer(function () {
    (this as any).ready = true;    // 挂到类上了，实例拿不到
  });
}

// 正确：字段装饰器的 this 是实例
function perInstance(_v: undefined, ctx: ClassFieldDecoratorContext) {
  ctx.addInitializer(function () {
    (this as any).ready = true;    // 每个实例都有
  });
}
```

## 两条路线的差异对照

{{< include "src/decorators-standard/differences.ts" "ts" >}}

```text
[class initializer] App, this === 类: true
app! true
legacyStyle/legacyWithInit 仅作对比，未使用: function function
```

| 维度 | legacy | 标准 |
|---|---|---|
| 装饰器签名 | `(target, key, descriptor)` | `(value, context)` |
| 改字段初始值 | 不支持 | 返回函数即可 |
| 给实例加属性 | 返回子类 hack | 字段装饰器 `addInitializer` |
| 类型元数据 | `emitDecoratorMetadata` | 无，需自己实现 |
| `this` 类型 | 隐式 `any` | `unknown`，必须显式声明 |
| 工具链兼容 | 只有 `tsc` 完整支持 | esbuild/swc 均支持 |

### 该选哪条

**选 legacy 的情况：**

- 用 nestjs / TypeORM / Angular（它们的依赖注入依赖 `design:paramtypes` 元数据）
- 已有大量 legacy 装饰器代码

**选标准的情况：**

- 新项目，不需要运行时类型元数据
- 需要构建速度（esbuild/swc 支持标准装饰器，但**不支持** `emitDecoratorMetadata`）
- 想用 `accessor` 关键字和 `addInitializer`

> [!TIP] 混合工具链的现实
> 如果你想用 esbuild/swc 的高速构建，又想用装饰器，**只能选标准装饰器**。这是 nestjs 生态目前的结构性约束——它需要元数据，所以必须走 `tsc` 或专门配置的 swc。详见 [运行 TypeScript](./running-ts.md)。

## 常见错误速查

| 错误码 | 消息 | 触发场景 |
|---|---|---|
| TS2511 | `Cannot create an instance of an abstract class.` | `new` 抽象类 |
| TS2322 | `Type 'OtherPrivate' is not assignable to type 'HasPrivate'.` | `private` 字段来源不同 |
| TS2302 | `Static members cannot reference class type parameters.` | 静态成员引用类类型参数 |
| TS2339 | `Property 'createdAt' does not exist on type 'Post'.` | 类装饰器替换类后类型未更新 |
| TS2540 | `Cannot assign to 'x' because it is a read-only property.` | 只有 getter 没有 setter |
| TS4114 | `This member must have an 'override' modifier...` | 开启 `noImplicitOverride` 后漏写 `override` |
| TS2552 | `Cannot find name 'ClassAutoAccessorDecoratorContext'.` | context 类型名写错 |
| TS1270 | `Decorator function return type ... is not assignable to type ...` | 标准装饰器返回类型不匹配 |

## 小结

| 主题 | 核心结论 |
|---|---|
| `private` vs `#` | 前者只编译期，后者运行时真私有 |
| 参数属性 | 不可擦除，生成赋值代码 |
| 抽象类 | 不能实例化，用于模板方法模式 |
| `implements` | 只检查形状，不继承实现 |
| `this` 类型 | 链式调用返回 `this`，子类不丢类型 |
| 静态成员 | 不能引用类的类型参数 |
| legacy 装饰器 | 5 种签名，支持元数据，nestjs 依赖它 |
| 标准装饰器 | `(value, context)`，`addInitializer` 时机随位置不同 |
| 两者关系 | 全局互斥，`experimentalDecorators` 一开全变 legacy |

下一篇：[工程化](./engineering.md)。
