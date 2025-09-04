---
title: "typeof的使用"
date: 2025-09-04
draft: false
---

在 TypeScript 中，`typeof` 是一个非常强大的运算符，它有两个主要用途：一种用于 **获取值的类型**，另一种用于 **获取类型的构造函数**。下面我们分别解释这两种用途，并给出一些示例。

## 1. **`typeof` 用于获取值的类型**

在 TypeScript 中，`typeof` 可以用来获取一个值的类型。你可以通过 `typeof` 来推断或显式地获取变量的类型。

### 示例：获取值的类型

```typescript
let x = "hello";
let y: typeof x;  // y 的类型会自动推断为 string

y = "world";  // 正确
// y = 42;    // 错误: 类型 'number' 不能赋值给类型 'string'
```

- `typeof x` 会推断出变量 `x` 的类型。在这个例子中，`x` 是一个 `string`，所以 `y` 的类型也会被推断为 `string`。
- 你可以将 `typeof` 用于变量声明，或者在类型注解中指定类型。

### 示例：获取对象属性的类型

```typescript
const person = { name: "Alice", age: 30 };
let nameType: typeof person.name;  // nameType 的类型是 string
let ageType: typeof person.age;    // ageType 的类型是 number
```

- 这里，`typeof person.name` 会得到 `person.name` 的类型（即 `string`），`typeof person.age` 会得到 `number`。

## 2. **`typeof` 用于获取类型**

`typeof` 还可以用来获取 **类型的构造函数**，特别是在你需要引用某个类型或类型的构造函数时。这个用途通常与 `keyof` 一起使用来限制某个值的类型。

### 示例：获取类的构造函数类型

```typescript
class Person {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

let PersonConstructor: typeof Person;  // PersonConstructor 的类型是 `typeof Person`，即构造函数类型
PersonConstructor = Person;  // 正确
// PersonConstructor = String;  // 错误: 类型 'typeof String' 不兼容类型 'typeof Person'
```

- 在这个例子中，`typeof Person` 会获取 `Person` 类的构造函数类型，即 `typeof Person` 实际上是 `new (name: string) => Person`，表示可以用来创建 `Person` 实例的构造函数类型。

### 示例：通过 `typeof` 引用类型构造函数

```typescript
let x: number = 42;
let y: typeof x;  // y 的类型是 number
y = 123;  // 正确
// y = "hello";  // 错误: 类型 'string' 不能赋值给类型 'number'
```

- 这里，`typeof x` 取得了 `x` 的类型，`x` 是 `number` 类型，因此 `y` 的类型也是 `number`。

## 3. **`typeof` 用于类型推断与类型保护**

`typeof` 还可以用于类型保护，即在类型判断中帮助我们明确变量的类型。这对于某些复杂的类型检查很有用。

### 示例：`typeof` 在类型保护中的应用

```typescript
function printLength(value: string | string[]) {
  if (typeof value === "string") {
    console.log(value.length);  // value 是 string 类型
  } else {
    console.log(value.length);  // value 是 string[] 类型
  }
}

printLength("Hello");  // 输出: 5
printLength(["a", "b", "c"]);  // 输出: 3
```

- `typeof value === "string"` 用来判断 `value` 是否是 `string` 类型，帮助 TypeScript 确定在 `if` 语句块中的类型。
- 同理，可以使用 `typeof` 来判断其他基本类型，如 `number`、`boolean` 等。

## 4. **`typeof` 用于联合类型和字面量类型的推断**

`typeof` 也能用来推断字面量类型（literal types）。

### 示例：推断字面量类型

```typescript
const color = "red";
type Color = typeof color;  // Color 的类型是 "red"

let myColor: Color = "red";  // 正确
// let anotherColor: Color = "blue";  // 错误: 类型 '"blue"' 不能赋值给类型 '"red"'
```

- 在这个例子中，`typeof color` 会推断出 `color` 变量的字面量类型 `"red"`，因此 `Color` 类型实际上是 `"red"`，而不是 `string`。

## 总结

- **`typeof` 获取值的类型**：你可以用 `typeof` 获取一个变量或对象的类型，通常用于类型推断或动态类型赋值。
- **`typeof` 获取构造函数类型**：当你使用 `typeof` 对类进行操作时，它会获取类的构造函数类型，可以用于引用类型的构造函数。
- **类型保护**：`typeof` 在类型保护中可以帮助你根据值的类型做出判断。
- **字面量类型推断**：`typeof` 可以用于推断变量的字面量类型，从而实现更精确的类型定义。

通过 `typeof`，你可以更灵活地在 TypeScript 中进行类型推断、类型保护和类型约束，增强代码的类型安全性和可维护性。
