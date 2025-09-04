---
title: "preserveConstEnums编译器选项"
date: 2023-11-23 14:12:00
tags: ["typescript"]
toc: true
---

`preserveConstEnums` 是 TypeScript 编译器选项之一，作用是控制 TypeScript 编译过程中是否保留 `const enum` 的常量值。

### 详细作用：
当你在 TypeScript 中使用 `const enum` 时，它们会在编译时被内联展开为常量值，而不会生成单独的枚举代码。默认情况下，TypeScript 会将 `const enum` 编译为常量值，而不会生成任何枚举相关的 JavaScript 代码。

如果你启用 `preserveConstEnums`，TypeScript 编译器将不会内联 `const enum`，而是保留这些枚举，并生成相应的 JavaScript 代码。这样，编译后的代码将包含枚举的实际定义，而不是直接替换为常量值。

### 使用场景：
- **`preserveConstEnums: true`**: 如果你希望 `const enum` 在编译后依然保留为枚举定义（而不是被内联展开为常量值），可以开启这个选项。
- **`preserveConstEnums: false`**（默认值）：会直接内联 `const enum` 的值，生成的 JavaScript 代码中不会包含枚举类型定义。

### 示例：

#### 1. `preserveConstEnums: false` (默认)
TypeScript 编译器将内联 `const enum`：

```typescript
const enum Color {
  Red = 1,
  Green = 2,
  Blue = 3
}

let c = Color.Green; // 编译后直接替换成 2
```

编译后的 JavaScript 代码：

```javascript
var c = 2;
```

#### 2. `preserveConstEnums: true`
如果启用 `preserveConstEnums`，编译后的代码会保留枚举定义：

```typescript
const enum Color {
  Red = 1,
  Green = 2,
  Blue = 3
}

let c = Color.Green;
```

编译后的 JavaScript 代码：

```javascript
var Color;
(function (Color) {
    Color[Color["Red"] = 1] = "Red";
    Color[Color["Green"] = 2] = "Green";
    Color[Color["Blue"] = 3] = "Blue";
})(Color || (Color = {}));
var c = Color.Green;
```

### 总结：
- `preserveConstEnums: true` 保留 `const enum` 的定义在输出的 JavaScript 代码中，而不是将其内联成常量值。
- `preserveConstEnums: false`（默认）则会将 `const enum` 的成员内联为常量值，生成的 JavaScript 代码会更简洁。
