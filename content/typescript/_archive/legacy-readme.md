---
title: typescript 学习笔记
date: 2022-03-14 14:12:00
tags: ["typescript"]
toc: true
---


## 资料

 - [TypeScript Tutorial](https://www.typescripttutorial.net/)
 - [阮一峰 es6](https://es6.ruanyifeng.com/)
 - [阮一峰 TypeScript 教程](https://typescript.p6p.net/typescript-tutorial/intro.html)
 - [TypeScript Handbook - The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
 - [TypeScript 入门教程](https://ts.xcatliu.com/)
 - [TypeScript Handbook（中文版）](https://zhongsp.gitbooks.io/typescript-handbook/content/)
 - [现代TypeScript高级教程- - linwu-hi - 博客园](https://www.cnblogs.com/linwu-hi/collections/4343)

## 安装

```bash
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
```typescript
 let num:number = null
```
- 对象类型

```typescript
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

## 脚手架

换了一个脚手架 [GitHub - xddqnodejs-typescript-modern-starter Minimal and modern starter template to develop a Node.js project leveraging Typescript](https://github.com/xddq/nodejs-typescript-modern-starter)

## 类型注解 与 类型推断

 - type annotation
 - type inference

工作使用的原则

  - 如果TS能够自动分析变量类型,我们就什么也不需要做了
  - 如果TS无法分析变量类型的话,我们就需要使用类型注解了

## 05 函数参数和返回类型的注解


[demo5](./src/demo/demo5.ts ":include :type=typescript")

## 06数组类型的定义

 - 类型别名

[demo/demo6.ts](./src/demo/demo6.ts ":include :type=typescript")

## 07 元组的使用


[demo/demo7.ts](./src/demo/demo7.ts ":include :type=typescript")

元组现在用的少了,因为可以用对象的形式来代替

## 08 09 interface 接口

[demo/demo8.ts](./src/demo/demo8.ts ":include :type=typescript")

[demo/demo9.ts](./src/demo/demo9.ts ":include :type=typescript")

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

[demo/demo10.ts](./src/demo/demo10.ts ":include")

## 类的访问类型

 - private      内部用,外部不能用
 - protected    内部用,外部不能用,继承可以用
 - public 默认是public 都可以用

类的内部与外部

[demo/demo11.ts](./src/demo/demo11.ts ":include :type=typescript")

## 12 类的构造函数


[demo/demo12.ts](./src/demo/demo12.ts ":include :type=typescript")
## 13 类的getter setter static 只读


[demo/demo13.ts](./src/demo/demo13.ts ":include :type=typescript")


## 14 抽象类

 - 含有抽象方法的类叫做抽象类
 - 继承抽象类的类必须实现抽象方法


[demo/demo14.ts](./src/demo/demo14.ts ":include :type=typescript")


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

[demo/demo18.ts](./src/demo/demo18.ts ":include :type=typescript")

## 19 enum 类型 typescript 独有



[demo/demo19.ts](./src/demo/demo19.ts ":include :type=typescript")

 - enum 可以反查 `log(Status[1])`

## 20 泛型

[demo/demo20.ts](./src/demo/demo20.ts ":include :type=typescript")
## 21 类中使用泛型


 - 泛型在类中的使用 `class C<T>`

为了约束传入的参数

 - 泛型继承
 - 泛型约束

[demo/demo21.ts](./src/demo/demo21.ts ":include :type=typescript")

## 22 23 命名空间

在浏览器中运行与看效果 

 - vscode -> file -> openFloder
 - vscode->terminal `npm init`
 - `tsc -init`
 - `mkdir src && mkdir build && touch index.html`

 - 命名空间可以嵌套

```typescript
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
