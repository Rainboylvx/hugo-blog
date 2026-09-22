---
title: "抽象类与 implements"
date: 2026-09-21
weight: 61
draft: false
toc: true
tags: ["typescript"]
---

`interface` 是纯契约，抽象类是"部分实现 + 部分契约"。`implements` 只检查形状，不继承任何实现。这三者的分工决定了代码结构。

## 三者对比

{{< include "src/abstract-class-and-implements/differences.ts" "ts" >}}

```text
[ '[circle: 3.14]', '[sub: 1.00]' ]
Person { name: 'a', age: 1 } 1 {"id":0}
[log] svg x
[ 'a' ]
```

| | `interface` | 抽象类 | 普通类 |
|---|---|---|---|
| 有实现 | ✗ | 部分 | ✓ |
| 有状态（字段） | ✗ | ✓ | ✓ |
| 能实例化 | ✗ | ✗ | ✓ |
| `extends` 数量 | 多个（`extends A, B`） | 1 个 | 1 个 |
| `implements` 数量 | — | 多个 | 多个 |
| 访问修饰符 | ✗ | ✓（`protected` 等） | ✓ |

## 抽象类的两个作用

**作用一：不能实例化**

```typescript
abstract class Factory {
  abstract create(): string;
}

new Factory();
// error TS2511: Cannot create an instance of an abstract class.
```

**作用二：模板方法模式**

父类定义流程，子类只填细节：

```typescript
abstract class Shape {
  abstract area(): number;
  abstract readonly kind: string;

  // 已实现：子类继承
  describe(): string {
    return `${this.kind}: ${this.area().toFixed(2)}`;
  }

  // 模板方法：定义流程，调用抽象成员
  report(): string {
    return `[${this.describe()}]`;
  }
}
```

`report()` 调用了 `describe()`，`describe()` 调用了抽象的 `area()`。子类只需实现 `area()` 和 `kind`，就自动获得了完整的 `report()` 能力。

## `implements` 只检查形状

```typescript
interface Serializable {
  serialize(): string;
}

class Version implements Serializable {
  serialize(): string { return String(this.major); }   // 必须自己实现
}
```

`implements` **不提供任何实现**，它只是"编译期承诺这个类满足这个接口"。

## 数量限制

```typescript
// ✓ 可以实现多个接口
class Person implements Named, Aged {
  constructor(public name: string, public age: number) {}
}

// ✓ 抽象类也可以 implements
abstract class BaseEntity implements Serializable {
  abstract serialize(): string;    // 声明为抽象，交给子类
  id = 0;
}

// ✗ 只能继承一个类
// class X extends A, B {}
```

`interface` 之间可以多继承：

```typescript
interface Combined extends Named, Aged {}
```

## 抽象类与 `protected`

抽象类独有的能力：`protected` 成员能被继承但对外不可见。

```typescript
abstract class Shape {
  protected label: string;
  constructor(label: string) { this.label = label; }
}

class Sub extends Shape {
  readLabel(): string { return this.label; }    // ✓ 子类可访问
}

new Sub("x").label;
// error TS2445: Property 'label' is protected and only accessible within class
// 'Shape' and its subclasses.
```

这是 `interface` 做不到的——接口只有公开成员。

## 选择标准

| 需求 | 用什么 |
|---|---|
| 只要契约 | `interface` |
| 多个不相关的类共享形状 | `interface` |
| 需要共享实现 | 抽象类 |
| 需要 `protected` 成员 | 抽象类 |
| 需要模板方法模式 | 抽象类 |
| 需要状态（字段） | 抽象类 |

> [!TIP] 实践建议
> **优先用 `interface`**。它的约束更弱、组合更灵活（一个类可以实现多个接口），也避免了继承层级过深的问题。
>
> 只有在"确实要共享实现"或"需要 protected"时才用抽象类。这是"组合优于继承"原则在 TypeScript 里的体现。

## 混合使用

两者可以配合：

```typescript
interface Drawable { draw(): string }

abstract class Renderer {
  abstract render(target: Drawable): string;
  log(msg: string): string { return `[log] ${msg}`; }
}

class SvgRenderer extends Renderer {
  render(target: Drawable): string {
    return this.log(target.draw());     // 复用了父类的 log
  }
}
```

`Drawable` 是契约（很多不相关的类都可以实现），`Renderer` 提供共享实现（`log`）。

## 相关

- [类与装饰器](./classes-and-decorators.md) —— 类的成员与修饰符
- [interface 与 type](./interface-vs-type.md) —— 接口的选择
- [类型收窄](./narrowing.md) —— 用 `instanceof` 收窄类实例
