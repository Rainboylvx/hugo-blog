---
title: "typescript"
date: 2023-11-23 14:12:00
tags: ["typescript"]
toc: true
---

## 安装
```
yarn global add typescript ts-node
```

## 数据类型

 - string
 - boolean
 - number
 - void 用在没有返回值的函数,其它可以用,但不能赋值
  ```typescript
  function alerme():void {
    alert('my name is tom');
  }

  ```
 - null,undefined,是所有类型的子类型,可以赋值给其它类型,而 void 类型的变量不能赋值给 number 类型的变量：
 ```
 let num:number = null
 ```
 - 对象类型
```
const xiaoJieJie : {
    name:string,
    age:number
}   = {
    name:'hel',
    age:19
} //1 普通

const xiaoJjiejieS :string [] = ['1','dajiao','liuyaing']; // 2  .数组

class Person{}
const dajiao: Person = new Person() //3 类类型

const jianXiaoJjieJie: () => string  = () => {return "dajiao"}; //函数对象类型
```

## 类型注解 与 类型推断

 - type annotation
 - type inference

工作使用的原则

  - 如果TS能够自动分析变量类型,我们就什么也不需要做了
  - 如果TS无法分析变量类型的话,我们就需要使用类型注解了

## 05 函数参数和返回类型的注解

```typescript
<%- include("demo/demo5.ts") %>
```

## 06数组类型的定义

 - 类型别名

```typescript
<%- include("demo/demo6.ts") %>
```

## 07 元组的使用


```typescript
<%- include("demo/demo7.ts") %>
```

元组现在用的少了,因为可以用对象的形式来代替

## 08 09 interface 接口

```typescript
<%- include("demo/demo8.ts") %>
```

```typescript
<%- include("demo/demo9.ts") %>
```

 - [propname:string] : any;
 - 内部约束了一个函数`say():string;`
 - 接口约束一个类`class xiaojiejie implements Gril`
 - 接口的拓展`interface Teacher extends Girl{}` 相当于继承
 - 符合子接口的对象也符合父接口

## 10 类的概念和使用


 - 定义
 - 继承
 - 重写
 - super 调用父类中的方法

```typescript
<%- include("demo/demo10.ts") %>
```

## 类的访问类型

 - private      内部用,外部不能用
 - protected    内部用,外部不能用,继承可以用
 - public 默认是public 都可以用

类的内部与外部

```typescript
<%- include("demo/demo11.ts") %>
```

## 12 类的构造函数


```typescript
<%- include("demo/demo12.ts") %>
```
## 13 类的getter setter static 只读


```typescript
<%- include("demo/demo13.ts") %>
```


## 14 抽象类

 - 含有抽象方法的类叫做抽象类
 - 继承抽象类的类必须实现抽象方法


```typescript
<%- include("demo/demo14.ts") %>
```


## 15 16 17 tsconfig.json 配置文件

- tsc -init 生成
- tsc 不加名字,会调用tsconfig.json
- "include":["demo.ts"], 可以是目录及文件,可以正则,可以glob
- "exclude":["demo.ts"], 可以排除include 里文件
- "files":["demo.ts"], 和include一样,但只能是文件,不会被exclude排除

compileOptions
 - strict 严格ts
 - noImplicitAny 充许你的注解类型any不用特意标明
 - strictNullChecks 不充许有null值出现
 - ts-node 也会用tsconfig.json
 - rootdir  源代码根目录
 - outDir 编译输出的文件
 - sourceMap 生成.map文件 debug用
 - noUnsedLocal 不能出现没有使用的本地变量
 

## 18 类型保护与联合类型

 - 不单一的类型 `number | boolean`
 - 只有在联合类型的时候需要 类型保护
 - 类型断言` person as Waiter`
 - `skill in person`
 - `typeof person ==='string'`
 - `first instanceof NumberOBJ` instanceof 只能用在类上

```typescript
<%- include("demo/demo18.cpp") %>
```

## 19 enum 类型 typescript 独有



```typescript
<%- include("demo/demo19.cpp") %>
```

 - enum 可以反查 `log(Status[1])`

## 20 泛型

```typescript
<%- include("demo/demo20.cpp") %>
```
## 21 类中使用泛型

```typescript

 - 泛型在类中的使用 `class C<T>`

为了约束传入的参数

 - 泛型继承
 - 泛型约束

<%- include("demo/demo21.cpp") %>

## 22 23 命名空间

在浏览器中运行与看效果 

 - vscode -> file -> openFloder
 - vscode->terminal `npm init`
 - `tsc -init`
 - `mkdir src && mkdir build && touch index.html`

 - 命名空间可以嵌套
```
namespace fater {
    namespace child {
    }
}

```

tsconfig.json
 - outFile ->生成一个单独的文件
 - moduble coomjs ->'amd'

## 24 import

需要引用 require.js 来使用 amd 的模块

```
require(["page"],function(){
})
```

## 25 parcel

```
yarn add --dev parcel
```

## 26 ts 使用jquery

```
yarn add @types/jquery
```

or

```
declare var $:any;
```

## 资料

 - [ruan一峰 es6]()
 - [TypeScript 入门教程](https://ts.xcatliu.com/)
 - [TypeScript Handbook（中文版）](https://zhongsp.gitbooks.io/typescript-handbook/content/)
 - [技术胖-TypeScript 从入门到精通图文视频教程-免费教程](http://jspang.com/detailed?id=63)
