---
aliases: ["/typescript/reading-notes.html"]
title: "typescript_program"
weight: 100
date: 2025-09-04
draft: false
---

> 本文由 [简悦 SimpRead](http://ksria.com/simpread/) 转码， 原文地址 [chengjingchao.com](https://chengjingchao.com/2022/01/01/TypeScript-%E7%BC%96%E7%A8%8B/)

> 第 1 章 导言使用 TypeScript 开发的程序更安全，常见的错误都能检查出来，写出的代码还可以作为文档。

发表于 2022-01-01 | 更新于: 2022-01-06

使用 TypeScript 开发的程序**更安全**，常见的错误都能检查出来，写出的代码还可以作为文档。

更安全是指**类型安全**

> 类型安全：借助类型避免程序做无效的事情（无效指的是运行时程序崩溃或未崩溃，但做的事情毫无意义

举个 🌰

*   数字乘以一个列表
*   接收数字的函数却传入了字符串
*   调用对象上不存在的方法
*   导入已经被移除的模块

    ```
    3 + [] // "3"


    let obj = {}
    obj.foo // undefined


    function a(b) {
      return b/2
    }
    a('z') // NaN
    ```

在做无效事情的时候，JavaScript 没有抛出异常，而是尽自己所能，避免抛出异常。

而 JavaScript 这种特性让代码中**错误的产生与发现脱节**了。导致 bug 往往是由他人转告给你的。
到真正运行时可能才会发现错误。

而 TypeScript 给出错误的时间点：在输入代码的过程中，代码编辑器会给出错误消息，来提醒你。

```
3 + [] // Error TS2365: Operator '+' cannot be applied to types '3' and 'never[]'.


let obj = {}
obj.foo // Error TS2339: Property 'foo' does not exist on type '{}'

function (a: number) {
  return b / 2
}
a('z') // Error TS2345: Argument of type '"z"' is not assignable to parameter of type 'number'.
```

[](#编译器 "编译器")编译器
-----------------

TypeScript 编译器（TSC）

通常运行程序的大致流程

1.  把程序解析为 AST
2.  AST 编译成字节码
3.  运行时计算字节码

运行程序就是让运行时计算由编译器从源码解析得来的 AST 生成的字节码。

TypeScript 的特殊之处在于，不直接编译成字节码，而是编译成 JavaScript。然后再像往常一样，在浏览器 / NodeJS 中运行。

TypeScript 编译器生成 AST 之后，真正运行代码之前会对代码做类型检查。

> 类型检查器：检查代码是否符合安全要求的特殊程序

编译和运行 TypeScript (1-3 由 TSC 操作，4-6 由浏览器 / NodeJS 操作)

1.  TypeScript 源码 -> TypeScript AST
2.  类型检查器检查 AST
3.  TypeScript AST -> JavaScript 源码

4.  JavaScript 源码 -> JavaScript AST
5.  AST -> 字节码
6.  运行时计算字节码

类型只在类型检查这一步使用，TSC 把 TS 编译成 JS 时，不会考虑类型。可以确保可以随意改动、更新和改进程序中的类型，而无需担心会破坏应用的功能。

[](#类型系统 "类型系统")类型系统
--------------------

> 类型系统：类型检查器为程序分配类型时使用的一系列规则

一般来说，类型系统有两种，各有利弊

1.  通过显式句法告诉编译器所有值的类型
2.  自动推导值的类型

JavaScript 在运行时推导类型
TypeScript 身兼两种类型系统，可以显式注解类型，也可以自动推导多数类型。

显示声明类型需要使用注解。注解的形式 `value: type`，就像是告诉类型检查器，“嘿，看到这个 value 了吗？它的类型是 type。”

```
// 显示注解
let a: number = 1
let b: string = 'hello'
let c: boolean[] = [true, false]

// 自动推导
let a = 1;
let b = 'hello'
let c = [true, false]
```

### [](#TypeScript-VS-JavaScript "TypeScript VS JavaScript")TypeScript VS JavaScript

<table><thead><tr><th>类型系统特性</th><th>JavaScript</th><th>TypeScript</th></tr></thead><tbody><tr><td>类型是如何绑定的？</td><td>动态</td><td>静态</td></tr><tr><td>是否自动转换类型？</td><td>是</td><td>否（多数时候）</td></tr><tr><td>何时检查类型？</td><td>运行时</td><td>编译时</td></tr><tr><td>何时报告错误？</td><td>运行时（多数时候）</td><td>编译时（多数时候）</td></tr></tbody></table>

TypeScript 能做的是把纯 JavaScript 代码中那些运行时愈发和类型相关的错误提前到编译时报告。在代码编辑器中显示，输入代码后立即就有反馈。

类型是如何绑定的？
JavaScript 动态绑定类型，必须运行程序才能知道类型。
TypeScript 渐进式类型语言，在编译时知道所有类型

> 类型：一系列值及对其执行的操作

example

<table><thead><tr><th>类型</th><th>包含的值</th><th>可以执行的操作</th></tr></thead><tbody><tr><td>boolean</td><td>true、false</td><td>||、&&、!</td></tr><tr><td>number</td><td>所有数字</td><td>+、-、*、/、%、&&、? .toFixed()、.toString()</td></tr><tr><td>string</td><td>所有字符串</td><td>+、||、&& .concat()、.toUpperCase()</td></tr></tbody></table>

对 T 类型的值来说，我们不仅知道值的类型是 T，还知道可以 / 不可以对该值做什么操作。
类型检查器通过使用的类型和具体用法判断是否有效。

TypeScript 的类型层次结构
![](https://chengjingchao.com/img/typescript/type.jpeg)

[](#类型术语 "类型术语")类型术语
--------------------

*   类型注解（可以理解为某种界限

    ```
    function squareOf(n: number) {
      return n * n;
    }
    squareOf(2); // 4
    ```

[](#类型浅谈 "类型浅谈")类型浅谈
--------------------

### [](#any "any")any

在 TypeScript 中，编译时一切都要有类型，如果你和 TypeScript（类型检查器）无法确认类型是什么，默认为 any。这是兜底类型，应该尽量避免使用。

类型的定义（一系列值及可以对其执行的操作）any 包含所有值，而且可以对其做什么操作。any 类型的值就像常规的 JavaScript 一样，类型检查器完全发挥不了作用。

使用 any 需要显示注解。

tsconfig.json
noImplicitAny: true;

noImplicitAny 隶属于 TSC 的 strict 标志家族，

### [](#unknown "unknown")unknown

unknown 与 any 类似，也表示任何值。但是 TypeScript 会要求你在做检查，细化类型。

<table><thead><tr><th>类型</th><th>包含的值</th><th>可以执行的操作</th></tr></thead><tbody><tr><td>unknown</td><td></td><td><code>==</code>、<code>===</code>、<code>||</code>、<code>&amp;&amp;</code>、<code>?</code>、<code>!</code>、<code>typeof</code>、<code>instance of</code></td></tr></tbody></table>

```
// example
let a: unknown = 30; // unknown
let b = a === 123; // boolean
let c = a + 10; // Error TS 2571: Object is of type 'unknown'
if (typeof a === 'number') {
  let d = a + 10; // number
}
```

unknown 的用法

1.  TypeScript 不会把任何值推导为 unknown 类型，必须显示注解（a）
2.  unknown 类型的值可以比较（b）
3.  执行操作时不能假定 unknown 类型的值为某种特定类型（c），必须先向 TypeScript 证明一个值确实是某个类型（d）

### [](#boolean "boolean")boolean

<table><thead><tr><th>类型</th><th>包含的值</th><th>可以执行的操作</th></tr></thead><tbody><tr><td>boolean</td><td><code>true</code>、<code>false</code></td><td><code>==</code>、<code>===</code>、<code>||</code>、<code>&amp;&amp;</code>、<code>?</code></td></tr></tbody></table>

```
// example
let a = true                // boolean
let b = false               // boolean
const c = true              // true
let d: boolean = true       // boolean
let e: true = true          // true
let f: true = false         // Error TS2322: Type 'false' is not assignable to type 'true'.
```

1.  TypeScript 推导出值的类型为 boolean（a 和 b）
2.  使用 const，让 TypeScript 推导出值为某个具体的布尔值（c）
3.  显式注解，声明值的类型为 boolean（d）
4.  显式注解，声明值为某个具体的布尔值（e 和 f）。把类型设定为某个值，就限制了 e 和 f 在所有布尔值中只能取指定的那个值。这种特性被称为类型字面量。

> 类型字面量——仅表示一个值的类型

变量 e f 是使用类型字面量显示注解了变量，变量 c 则是由 TypeScript 推导出一个字面量类型，因为使用的是 const。
const 声明的基本类型的值，赋值之后无法修改，因此 TypeScript 推导出的是范围最窄的类型，所以 TypeScript 推导出的 c 的类型为 true，而不是 boolean。

### [](#number "number")number

<table><thead><tr><th>类型</th><th>包含的值</th><th>可以执行的操作</th></tr></thead><tbody><tr><td>number</td><td>整数、浮点数、正数、负数、Infinity、NaN 等</td><td>算术运算 比较</td></tr></tbody></table>

```
// example
let a = 1234                  // number
let b = Infinity * 0.1        // number
const c = 5678                // 5678
let d = a < b                 // boolean
let e: number = 100           // number
let f: 26.218 = 26.218        // 26.218
let g: 26.218 = 10            // Error TS2322: Type '10' is not assignable to type '26.218'
```

1.  TypeScript 推导出值的类型为 number（a 和 b）
2.  使用 const，让 TypeScript 推导出值为某个具体的数字（c）
3.  显式注解，声明值的类型为 number（e）
4.  显式注解，声明值为某个具体的数字（f 和 g）

tips：处理较长的数字时可以使用数字分隔符。

```
let oneMillion = 1_000_ 000    // 等同于 1000000
let twoMillion: 2_000_000 = 2_000_000
```

### [](#bigint "bigint")bigint

> 是 JavaScript 和 TypeScript 新引入的类型，在处理较大的整数时，不用再担心舍入误差。

number 类型表示的整数最大为 253，bigint 可以表示任意大的整数。

<table><thead><tr><th>类型</th><th>包含的值</th><th>可以执行的操作</th></tr></thead><tbody><tr><td>bigint</td><td>所有 BigInt 数</td><td>算术运算 比较</td></tr></tbody></table>

```
// example
let a = 1234n                  // bigint
const b = 5678n                // 5678n
let c = a + b                  // bigint
let d = a < 1235               // boolean
let e = 88.5n                  // Error TS1353: A bigint literal must be an integer.
let f: bigint = 100n           // bigint
let g: 100n = 100n             // 100n
let h: bigint = 100            // Error TS2322: Type '100' is not assignable ty type 'bigint'.
```

与 boolean 和 number 一样，声明 bigint 类型也有四种方式。尽量让 TypeScript 自动推导。

### [](#string "string")string

<table><thead><tr><th>类型</th><th>包含的值</th><th>可以执行的操作</th></tr></thead><tbody><tr><td>string</td><td>所有字符串</td><td>字符串可以进行的操作 例如 +、.slice()</td></tr></tbody></table>

```
// example
let a = 'hello'                 // string
let b = 'billy'                 // string
const c = '!'                   // !
let d = a + ' ' + b + c         // string
let e: string = 'zoom'          // string
let f: 'john' = 'john'          // john
let g: 'john' = 'zoe'           // Error TS2322: Type 'zoe' is not assignable to type 'john'
```

同样也是尽量让 TypeScript 自动推导 string 类型。

### [](#symbol "symbol")symbol

symbol 经常用于代替对象和映射的字符串健，防止被意外设置。
symbol 的类型就是 symbol，每一个 symbol 都是唯一的，不与其他任何符号相等，即便再使用相同的名称创建一个 symbol 也是如此。

```
// example
let a = Symbol('a')              // symbol
let b: symbol = Symbol('b')      // symbol
let c = a === b                  // boolean
let d = a + 'x'                  // Error TS2469: The '+' operator cannot be applied to type 'symbol'.
```

```
// example
const e = Symbol('e')                  // unique symbol
const f: unique symbol = Symbol('f')   // unique symbol
let g: unique symbol = Symbol('f')     // Error TS1332: A variable whose type is a 'unique symbol' type must be 'const'.
let h = e === e                        // boolean
let i = e === f                        // Error TS2367: This condition will always return 'false' since the type 'unique symbol' and 'unique symbol' have no overlap.
```

创建 symbol 的方式

1.  使用 const，TypeScript 会推导为 unique symbol 类型。
2.  显式注解 const 变量的类型为 unique symbol
3.  unique symbol 类型的值始终与自身相等
4.  TypeScript 在编译时知道一个 unique symbol 绝对不会与另一个 unique symbol 相等

unique symbol 与其他字面量类型其实是一样的。

### [](#对象 "对象")对象

TypeScript 的对象类型表示对象的结构。

> 结构化类型–一种编程设计风格，只关心对象有哪些属性，而不管属性使用什么名称（名义化类型）。在某些语言中也叫鸭子类型（即不以貌取人）

```
// example
let b: object = {
  b: 'x'
}
a.b // Error TS2339: Property 'b' does not exist on type 'object'.
```

object 只能表示该值是一个 JavaScript 对象（而且不是 null）

```
// 对象字面量

// 自动推导
let a = {
  b: 'x'
}

// or
let a: { b: string } = {
  b: 'x'
}
```

对象字面量句法的意思是，“这个东西的结构是这样过的。”

使用 const 声明对象不会导致 TypeScript 把推导的类型缩窄。与上面的基本类型不同。这是因为 JavaScript 对象是可变的，所以在 TypeScript 看来，创建对象之后你可能会更新对象的字段。

```
let a: { b: number }
b = {} // Error TS2741: Property 'b' is missing in type '{}' but required in type '{b: number}'.

b = {
  a: 1,
  b: 2
} // Error TS2322: Type '{b: number; c: number}' is not assignable to type '{b: number}'. Object literal may only specify known properties, and 'c' does not exist in type '{b: number}'.
```

默认情况下，TypeScript 对对象的属性要求十分严格。如果声明对象有个类型为 number 的属性 b，TypeScript 将预期对象有且只有这个属性。缺少或者多了，TypeScript 都会报错。

```
let a: {
  b: number
  c?: string        // 可能有个类型为 string 的属性 c。其值可以为 undefined
  readonly firstName: string // 为字段赋初始值后无法修改。类似于使用 const 声明对象的属性
  [key: number]: boolean // 可能有任意多个数字属性，其值为布尔值
}
```

> `[key: T]: U` 句法称为索引签名，通过这种方式告诉 TypeScript，指定的对象可能有更多的 key。这种句法的意思是，“在这个对象中，类型为 T 的健对应的值为 U 类型。”

*   索引签名 key 的类型 T 必须可赋值给 number 或 string。（JavaScript 对象的健为字符串；数组是特殊的对象，健为数字。）
*   key 的名称可以是任意词，不一定非的用 key

对象字面量表示法有一个特例：空对象类型 `{}`。除 null 和 undefined 之外的任何类型都可以赋值给空对象类型，应该尽量避免使用。

在 TypeScript 中声明对象类型有四种方式

1.  对象字面量表示法 `{a: string}`，也称对象结构
2.  空对象字面量表示法 `{}`。避免使用
3.  object 类型。如果需要个对象，当对这个对象的字段没有要求，使用这种方式。
4.  Object。避免使用

对一个值，在类型允许的情况下，可以对其执行特定的操作。其实在类型自身上也可以执行一些操作。  
类型别名

```
type Age = number

type Person = {
  name: string
  age: Age
}

let driver: Person = {
  name: 'Jack'
  age: 18
}
```

类型别名采用块级作用域。在同一作用于中不能重复声明相同类型。

并集和交集

```
type Cat = { name: string, purrs: boolean }
type Dog ={ name: string, barks: boolean, wags: boolean }

type CatOrDogOrBoth = Cat | Dog // 并集
type CatAndDog = Cat & Dog // 交集

// CatOrDogOrBoth 可以是 Cat 类型的值，可以是 Dog 类型的值，还可以二者兼具。
// Cat
let a: CatOrDogOrBoth = {
  name: 'Bonkers',
  purrs: true
}

// Dog
a = {
  name: 'Domino',
  barks: true,
  wags: true
}

// 二者兼具
a = {
  name: 'Donkers',
  barsk: true,
  purrs: true,
  wags: true
}

// CatAndDot
let b: CatAndDog = {
  name: 'Domino',
  barks: true,
  purrs: true,
  wags: true
}
```

并集通常更常用

*   函数返回值可能是一个字符串，也可能是 null。`string | null`
*   混合类型的数组

数组

```
let a = [1, 2, 3]                // number[]
let b = ['a', 'b']               // string[]
let c: string[] = ['a']          // string[]
let d = [1, 'a']                 // (number | string)[]
const e = [2, 'b']               // (number | string)[]
let f = ['red']                  // string[]

f.push('blue')
f.push(true)                     // Error TS2345: Argument of type 'true' is not assignable to parameter of type 'string'.

let g = []                       // any[]
g.push(1)                        // number[]
g.push('red')                    // (number | string)[]

let h: number[] = []             // number[]
h.push(1)                        // number[]
h.push('red')                    // Error TS2345: Argument of type '"red"' is not assignable to parameter of type 'number'.
```

TypeScript 支持两种注解数组类型的句法

1.  T[]
2.  Array

一般情况下，数组应该保持同质。

元祖

> array 的子类型，长度固定，各索引位上的值具有固定的已知类型。

声明元组时必须显式注解类型。

```
let a: [number] = 1
let b: [string, string, number] = ['jack', 'boy', 1963]
b = ['tom', 'boy', 'li', 1926] // Error TS2322: Type 'string' is not assignable to type 'number'.
```

元组也支持可选元素

```
let trainFares: [number, number?][] = [
  [3.75],
  [8.25, 7.70],
  [10.60],
]

// 等价于
let moreTrainFares: ([number, number] | [number])[] = [
  // ...
]
```

元组也支持剩余元素，即为元组定义最小长度

```
// 字符串列表，至少有一个元素
let friends: [string, ...string[]] = ['Sara', 'Tali', 'Chloe', 'Claire']

// 元素类型不同的列表
let list: [number, boolean, ...string[]] = [1, false, 'a', 'b', 'c']
```

只读数组和元祖

```
let as: readonly number[] = [1, 2, 3]     // readonly number[]
let bs: readonly number[] = as.concat(4)  // readonly number[]
let three = bs[2]                         // number
as[4] = 5                                 // Error TS2542: Index signature in type 'readonly number[]' only permits reading.
as.push(6)                                // Error TS2339: Property 'push' does not exist on type 'readonly number[]'.

// Readonly 和 ReadonlyArray 句法
type A = readonly string[]                // readonly string[]
type B = ReadonlyArray<string>            // readonly string[]
type C = Readonly<string[]>               // readonly string[]

type D = readonly [number, string]        // readonly [number, string]
type E = Readonly<[number, string]>       // readonly [number, string]
```

null、undefined、void 和 never
| 类型 | 含义 |
| — | — |
| null | 缺少值 |
| undefined | 尚未赋值的变量 |
| void | 没有 return 语句的函数 |
| never | 永不返回的函数 |

```
// 返回 never 的函数
function d() {
  throw TypeError('I always error')
}

function e() {
  while (true) {
    doSomething()
  }
}
```

never 是所有类型的子类型，可以赋值给其他任何类型。

枚举

> 枚举的作用是列举类型中包含的各个值。是一种无序数据结构，把键映射到值上。

枚举可以理解为编译时键固定的对象，访问键时，TypeScript 将检查指定的键是否存在。

枚举分为两种

1.  字符串到字符串之间的映射
2.  字符串到数字之间的映射

```
enum Language {
  English,
  Spaish,
  Russian
}
```

> 按约定，枚举名称为大写单数形式。枚举中的键也大写。

TypeScript 可以自动为枚举中的各个成员推导对应的数字，也可以手动设置。

```
enum Language {
  English = 0,
  Spanish = 1,
  Russian = 2
}
```

枚举中的值访问方式和对象一样

```
let myFirstLanguage = Language.Russian
let mySecondLanguage = Language['English']
```

一个枚举可以分成几次声明，TypeScript 将自动把各部分合并在一起

```
enum Language {
  English = 0,
  Spanish = 1,
}

enum Language {
  Russian = 2
}
```

meiju

### [](#小结 "小结")小结

<table><thead><tr><th>类型</th><th>子类型</th></tr></thead><tbody><tr><td>boolean</td><td>Boolean 字面量</td></tr><tr><td>bigint</td><td>BigInt 字面量</td></tr><tr><td>number</td><td>Number 字面量</td></tr><tr><td>string</td><td>String 字面量</td></tr><tr><td>symbol</td><td>unique symbol</td></tr><tr><td>object</td><td>Object 字面量</td></tr><tr><td>数组</td><td>元组</td></tr><tr><td>enum</td><td>const enum</td></tr></tbody></table>

[](#声明和调用函数 "声明和调用函数")声明和调用函数
-----------------------------

在 JavaScript 中，函数是一等对象。这意味着，可以向对象那样使用函数

1.  可以赋值给变量
2.  可以作为参数传给其他函数
3.  可以作为函数的返回值
4.  可以赋值给对象和原型
5.  可以赋予属性
6.  可以读取属性

TypeScript 通常会显示注解函数的参数

```
function add(a: number, b: number) {
  return a + b
}
```

返回类型能推导出来，不过也可以显示注解

```
function add(a: number, b: number): number {
  return a + b
}
```

TypeScript 中声明函数

```
// 具名函数
function greet(name: string) {
  return 'hello ' + name
}

// 函数表达式
let greet2 = function(name: string) {
  retunr 'hello ' + name
}

// 箭头函数表达式
let greet3 = (name: string) => {
  return 'hello ' + name
}

// 箭头函数表达式简写
let greet4 = (name: string) => 'hello ' + name

// 函数构造方法
let greet5 = new Function('name', 'return "hello " + name')
```

除了函数构造方法，其他几种句法在 TypeScript 中都可以放心使用，能够保证类型安全。通常需要注解参数的类型，而返回类型不要求必须注解。
在调用函数时，TypeScript 将检查传入的实参是否于函数形参类型兼容。

### [](#可选参数和默认参数 "可选参数和默认参数")可选参数和默认参数

可选参数必须在末尾

```
function log(message: string, userId?: string) {
  let time = new Date().toLocaleTimeString()
  console.log(time, message, userId || 'Not signed in')
}

log('Page loded')
log('User signed in', 'da763be')

// 默认值参数（类似可选参数功能
function log(message: string, userId = 'Not signed in') { // userId 会自动推导类型
  let time = new Date().toLocaleTimeString()
  console.log(time, message, userId)
}

// 显式注解默认参数类型
type Context = {
  appId?: string
  userId?: string
}

function log(message: string, context: Context = {}) {
  let time = new Date().toLocaleTimeString()
  console.log(time, message, context.userId)
}
```

默认参数更常用，默认参数可以自动类型推导。

```
```

<!-- ### 剩余参数 -->

## 多态
上面都是讲的具体类型的用法和用途
- boolean
- string
- Date[]
- {a: number} | {b: string}
- (numbers: number[]) => number

使用具体类型的前提是**类型已知**

如果事先不知道需要什么类型
不想限制函数只能接受某个类型

```typescript
// example
function filter(array, f) {
  let result = []
  for (let i = 0; i < array.length; i++) {
    let item = array[i]
    if (f(item)) {
      result.push(item)
    }
  }
  return result
}

filtre([1, 2, 3, 4], (item) => item < 3) // [1, 2]
```

例子中，数组元素的类型可以为 number，不过 filter 函数的作用应该更一般，可以筛选数字数组、字符串数字、对象数组等。
下面通过重载描述下函数签名

```
type Filter = {
  (array: number[], f: (item: number) => boolean): number[]
  (array: string[], f: (item: string) => boolean): string[]
}

// 加上对象类型
type Filter = {
  (array: number[], f: (item: number) => boolean): number[]
  (array: object[], f: (item: object) => boolean): object[]
}
```

object 无法描述对象的结构，访问数组中元素属性就会报错。
为了解决这种问题，就有了泛形参数

> 泛型参数——在类型层面施加约束的占位类型，也称多态类型参数，简称泛形

```
// example
type Filter = {
  <T>(array: T[], f: (item: T): boolean): T[]
}
```

这么做的意思是 Filter 使用了一个泛形参数 T，事先不知道具体类型是什么，调用的时候根据传入的参数推导 T 的类型。

知识点

*   泛形使用尖括号声明，可以把尖括号理解为 type 关键字，只不过声明的是泛形。
*   尖括号位置限制泛形作用域尖括号中可以声明任意多个以逗号分隔
*   T 就是一个类型名称（类似变量名称），可以使用任意名称，通常会使用 T U V W
*   泛形可以理解为一种约束，把泛形 T 所在位置的类型约束为 T 类型

### [](#什么时候绑定泛型 "什么时候绑定泛型")什么时候绑定泛型

声明泛形的位置不仅限定泛形作用域，还决定什么时候为泛形绑定具体的值

```
// 1 在调用签名中声明
type Filter = {
  <T>(array: T[], f: (item: T): boolean): T[]
}
// 调用函数时为 T 绑定具体类型
let filter: Filter = (array, f) => {
  // ...
}


// 2 在类型别名 Filter 中
type Filter<T> = {
  (array: T[], f: (item: T): boolean): T[]
}
// 使用 Filter 时显式绑定具体类型
let filter: Filter<number> = (array, f) => {
  // ...
}
```

### [](#可以在什么地方声明泛形 "可以在什么地方声明泛形")可以在什么地方声明泛形

```
// 1
type Filter = {
  <T>(array: T[], f: (item: T): boolean): T[]
}

// 2
type Filter<T> = {
  (array: T[], f: (item: T): boolean): T[]
}

// 3 1 的简写
type Filter = <T>(array: T[], f: (item: T): boolean): T[]

// 4 2 的简写
type Filter<T>( = array: T[], f: (item: T): boolean): T[]

// 5 具名函数调用签名，每次调用 filter 时绑定举腿类型
function filter<T>(array: T[], f: (item: T) => boolean): T[] {
  // ...
}
```

### [](#泛形别名 "泛形别名")泛形别名

```
```
### 泛形约束
```typescript
```
