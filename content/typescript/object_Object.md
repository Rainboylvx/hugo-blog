---
title: "TypeScript 中的 object 和 Object 的区别"
date: 2023-11-23 14:12:00
tags: ["typescript"]
toc: true
---

在 TypeScript 中，`object` 和 `Object` 虽然看起来相似，但它们有着不同的含义和用途。

### 1. `object`（小写）

`object` 是一个 **类型**，表示任何非原始类型的值。原始类型包括：`number`、`string`、`boolean`、`symbol`、`null` 和 `undefined`。换句话说，`object` 类型是指 **除原始类型之外的所有类型**。

#### 特点：
- `object` 类型表示的值必须是一个对象（即非原始值），但不限定对象的结构（属性和方法）。
- 它并不等同于 `Object` 构造函数的类型。
- 不能直接访问对象的属性或方法，除非将其类型进一步细化。

#### 示例：
```typescript
let obj: object;

obj = { name: "Alice" };  // 合法
obj = [1, 2, 3];          // 合法
obj = () => {};           // 合法

obj = 42; // 错误：类型 'number' 不能赋值给类型 'object'
obj = "hello"; // 错误：类型 'string' 不能赋值给类型 'object'
```

`object` 类型限制了只能是“非原始类型”的值，但是它并不关心具体是什么类型（例如是数组、函数还是普通对象）。因此，你不能直接访问对象的属性，除非你进一步指定对象的结构或类型。

### 2. `Object`（大写）

`Object` 是 **JavaScript 中的内置构造函数**，用来创建对象实例。在 TypeScript 中，`Object` 表示所有非 `null` 的类型，也就是说，它是所有类型的超集，除了 `null` 和 `undefined`。

#### 特点：
- `Object` 类型表示 **所有对象类型**，包括原始类型（`string`、`number` 等）以外的所有类型。
- 它是 JavaScript 中所有对象的父类，甚至可以用于表示原始类型（不过通常不这么做）。

#### 示例：
```typescript
let obj: Object;

obj = { name: "Alice" };  // 合法
obj = [1, 2, 3];          // 合法
obj = "hello";            // 合法（尽管通常不这么做）
obj = 42;                 // 合法（`number` 也是 `Object` 类型的一部分）

obj = null;  // 错误：`null` 不能赋值给 `Object`
```

`Object` 类型实际上包含了 **所有类型**，除 `null` 和 `undefined` 之外。

### 3. 区别总结

| 特性              | `object`                            | `Object`                         |
|-------------------|-------------------------------------|----------------------------------|
| 表示的内容        | 任何非原始类型（不包括 `number`, `string`, `boolean`, `symbol`, `null`, `undefined`） | 所有类型（包括 `number`, `string`, `boolean`, `symbol`, 除 `null` 和 `undefined`）|
| 是否允许原始类型  | 不允许原始类型（只能是对象）       | 允许原始类型（包括 `number`, `string`, `boolean`, `symbol` 等）|
| 访问属性         | 不能直接访问属性，需要进一步细化类型 | 允许访问属性，实际上是 `Object` 类型的超集 |
| 常见用途         | 用于限定某个值是对象类型（而不是原始值） | 表示所有类型（但不包括 `null` 和 `undefined`）|

### 4. 进一步的示例：

#### `object` 示例：
```typescript
let obj: object;

obj = { name: "Alice" };  // 合法
obj = [1, 2, 3];          // 合法
obj = () => {};           // 合法

// 下面的类型会报错，因为 `object` 类型不允许原始类型
obj = 42; // 错误
obj = "hello"; // 错误
obj = true; // 错误
```

#### `Object` 示例：
```typescript
let obj: Object;

obj = { name: "Alice" };  // 合法
obj = [1, 2, 3];          // 合法
obj = "hello";            // 合法
obj = 42;                 // 合法

// `null` 不能赋值给 `Object` 类型
obj = null; // 错误
```

### 5. 总结

- **`object`** 是一个类型，表示非原始类型（即排除 `number`, `string`, `boolean`, `symbol`, `null` 和 `undefined`）。它不能直接用于访问对象的属性。
- **`Object`** 是 JavaScript 中的构造函数，它是所有类型的超集，除了 `null` 和 `undefined`，它允许表示任何类型，包括原始类型（如 `string`、`number` 等）。

在 TypeScript 中，建议尽量使用 `object` 来表示对象类型，避免使用 `Object`，除非你确实需要一个更宽泛的类型（表示所有非 `null`/`undefined` 的值）。
