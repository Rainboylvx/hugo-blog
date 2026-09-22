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


```typescript

function getTotal(one:number,two:number) : number {
    //return one + two + '';
    return one + two ;
}

//let total  = getTotal(1, '2');
let total  = getTotal(1, 2);

// nerver 永远执行不完
function error_function () : never{
    //return 1;
    throw new Error();
    console.log("Hello world! nerver run")
}

function forNever(): never{
    while(true){}
    console.log("function never end!")
}

// 解析赋值型参数 设置类型
function add({one ,two} : { one:number,two:number}){
    return one +two;
}
const total1 = add({one:1,two:1});

```

## 06数组类型的定义

 - 类型别名

```typescript
const numberArr : number[]  = [1,2,3];

const arr : (string | number)[]  = [1,'str',2];

const xiaojiejies : {
    name:string,
    age:number
} []  = [
    {name:'liuying',age:18}
]

//类型别名
type Lady = {    
    name:string,
    age:number
};

const xiaojie2:Lady[] = [
    {name:'liuying',age:18}
];

class Madam { 
    name:string;
    age:number;
};

const xiaojie3 : Madam[]  = [
    {name:'liuying',age:18}
]

```

## 07 元组的使用


```typescript
//const xiaojiejie : (string | number)[] = ['dajaio','teacher',28];

//这就是元组了,每个元素的类型顺序是固定 的
const xiaojiejie : [string,string ,number] = ['dajaio','teacher',28];

const xiaojiejies : [string,string ,number][] = [
    ['dajaio','teacher',28],
    ['dajaio','teacher',28],
    ['dajaio','teacher',28]
];



```

元组现在用的少了,因为可以用对象的形式来代替

## 08 09 interface 接口

```typescript
//const screenResume = (name:string ,age:number,bust:number) =>{
    //age < 24 && bust >= 90 && console.log(name +'进入面试');
    //(age >= 24 || bust < 90 )&& console.log(name +'被淘汰');
//}

//const getResume = (name:string,age:number,bust:number)=>{
    //console.log(name)
    //console.log(age)
    //console.log(bust)
//}


//screenResume('dajiao',18,99);
//getResume('dajiao',18,90)
//

interface Girl {
    name:        string;
    age:         number;
    bust:        number;
    waistline ?: number ; // 可有 可没有
}

const girl = {
    name:'dajiao',
    age:18,
    bust:95
}

const screenResume = (girl:Girl) => {
    girl.age < 24 && girl.bust >= 90 && console.log(girl.name +'进入面试');
    (girl.age >= 24 || girl.bust < 90 )&& console.log(girl.name +'被淘汰');
}

type Girl1 = string
// interface 和类型别名很像 
// 但 interface 必须 是像 对象这种类型
// type 可以 是单类型

```

```typescript
//const screenResume = (name:string ,age:number,bust:number) =>{
    //age < 24 && bust >= 90 && console.log(name +'进入面试');
    //(age >= 24 || bust < 90 )&& console.log(name +'被淘汰');
//}

//const getResume = (name:string,age:number,bust:number)=>{
    //console.log(name)
    //console.log(age)
    //console.log(bust)
//}


//screenResume('dajiao',18,99);
//getResume('dajiao',18,90)
//

interface Girl {
    name:        string;
    age:         number;
    bust:        number;
    waistline ?: number ; // 可有 可没有
    [propname:string] : any;
    // key 是string ,value 是 any
    say():string; //定义了一个方法,必须有
}

class XiaoJiejie implements Girl {
    name:string;
    age:number;
    bust:number = 90;
    say() : string{
        return "helo"
    }
}

interface Teacher extends Girl {
    teach():string;

}

const girl = {
    name:'dajiao',
    age:18,
    bust:95
}

const screenResume = (girl:Girl) => {
    girl.age < 24 && girl.bust >= 90 && console.log(girl.name +'进入面试');
    (girl.age >= 24 || girl.bust < 90 )&& console.log(girl.name +'被淘汰');
}

type Girl1 = string
// interface 和类型别名很像 
// 但 interface 必须 是像 对象这种类型
// type 可以 是单类型



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
1234

```

## 类的访问类型

 - private      内部用,外部不能用
 - protected    内部用,外部不能用,继承可以用
 - public 默认是public 都可以用

类的内部与外部

```typescript
class Person {
    public p_name :string = '1';
    protected name2 :string= '1';
    private name3 :string= '1';
}

let p = new Person()

//p.name2 = "this.name"
//p.name3 = "this.name";
p.p_name = "this.name"

class Teacher extends Person {
    sayHello(){
        console.log(this.p_name,"hello")
        console.log(this.name2,"hello")
    }
}

var teach = new Teacher()
teach.p_name = "Tom"
teach.sayHello()

```

## 12 类的构造函数


```typescript
class Person {
    public name :string;
    constructor(name:string){
        this.name = name;
    }
}

const person = new Person("Tom");

console.log(person.name)

class Person2 {
    constructor(public name:string){ //同样的功能
    }
}

const person2 = new Person2("TOm")
console.log(person2.name)

class Teacher extends Person{
    constructor(public age:number){
        super('Tom'); //必须调用父类的constructor
        //父类只要有constructor,就必须调用super()
    }
}

console.log("===")
const teach = new Teacher(19)
console.log(teach.age)
console.log(teach.name)

```
## 13 类的getter setter static 只读


```typescript
class person{
    private _age:number = 18;
    public readonly _name:string;
    constructor( name:string){
        this._name = name;
    }

    //getter
    get age(){
        return this._age + 20;
    }

    set age(age:number){
        this._age = age+3; //玄妙
    }

    static sayLove(){ //不用实例化
        console.log('I L U')
    }
}


const diaojao = new person("diaojao");
console.log(diaojao.age)

diaojao.age = 28;
console.log(diaojao.age)

person.sayLove()

//diaojao._name = "Tom:" // wrong

```


## 14 抽象类

 - 含有抽象方法的类叫做抽象类
 - 继承抽象类的类必须实现抽象方法


```typescript
abstract class Girl{
    abstract skill() //抽象方法
    notskill(){ // 非抽象

    }
}



class waiter extends Girl{
    skill(){
        console.log("daoshui")
    }
}

class senior extends Girl{
    skill(){
        console.log("gaoji daoshui") // 实现
    }
}

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

interface Waiter {
    anjao:boolean;
    say:()=>{};

}
interface Teacher {
    anjao:boolean;
    skill: ()=>{};
}

function judgeWho ( person : Waiter | Teacher){
    if(person.anjao){
        (person as Teacher).skill()
    }
    else{
        (person as Waiter).say()
    }
    //person.say();
}
function judgeWho2 ( person : Waiter | Teacher){
    if('skill' in person){
        person.skill()
    }
    else{
        person.say()
    }
    //person.say();
}

function add( first: string | number , second : string | number){
    if( typeof first === "string" || typeof second === "string")
        return `${first} ${second}`
    return first + second;
}

class NumberObj{
    count : number;
}

function addObj(first : Object | NumberObj,second: Object | NumberObj  ){
    if( first instanceof NumberObj && second instanceof NumberObj ){
        return first.count + second.count;
    }
    return 0;
}

```

## 19 enum 类型 typescript 独有



```typescript
enum Status {
    MASSAGE,
        SPA,
        DABAOJIAN
}

function getServr(status : any){
    if( status === Status.MASSAGE )
        return "MASSAGE";
    else if ( status === Status.SPA)
        return "SPA";
    else if( status === Status.DABAOJIAN )
        return "DABAOJIAN"
}

console.log(getServr(Status.MASSAGE))

console.log(Status.MASSAGE,Status[1])
//反查

```

 - enum 可以反查 `log(Status[1])`

## 20 泛型

```typescript

// 函数泛型
function join<T>(first: T , second: T){
    return `${first}${second}`
}

join<string>("baidu",".com")

//泛型 数组的使用
function myFUnc<T>(params : T[]){

}

function myFUnc2<T>(params : Array<T> ){

}

//泛型类型推断，最好不要这么用，不好理解
join(1,2)

```
## 21 类中使用泛型


 - 泛型在类中的使用 `class C<T>`

为了约束传入的参数

 - 泛型继承
 - 泛型约束

```typescript
class SelectGirl{
    constructor(private girls:string[]){
    }

    getGirl(index:number):string{
        return this.girls[index];
    }
}

const selectGirl = new SelectGirl(['1','2','dajiao'])

// 使用下标 来得到数据
console.log( selectGirl.getGirl(1) )

//泛型重构
class SelectGirl2<T> {
    constructor (private girls : T[]){}

    getGirl(index:number) : T{
        return this.girls[index];
    }
}

const selectgirl2 = new SelectGirl2<string>(['1','2','dajiao'])

// 使用下标 来得到数据
console.log( selectgirl2.getGirl(1) )

//泛型中的继承
interface Girl{
    name: string;
}

// T是一个泛型，但是它之中必需有一个name属性
class selectGirl3<T extends Girl>{ 
    constructor (private girls : T[]){}

    getGirl(index:number) : string {
        return this.girls[index].name;
    }
}

const selectgirl3 = new selectGirl3([
    {name:'1'},
    {name:'2'},
    {name:'3'}
])
console.log( selectgirl3.getGirl(1) )

const a:string  =1

// 泛型约束
// 只能是 number 或 string
//
class SelectGirl4< T extends number | string > {
    constructor(i){}
}

```

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
