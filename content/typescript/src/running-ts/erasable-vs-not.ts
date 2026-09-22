// Node 原生 type stripping：可擦除 vs 不可擦除
//
// 这个文件本身是纯可擦除的，可以直接运行：
//   node content/typescript/src/running-ts/erasable-vs-not.ts

// ---- 可擦除：Node 原生能跑 ----

interface User { name: string; age: number }
type ID = string | number;
type Mapper<T> = (item: T) => string;

class Greeter {
  // 注意：不能用参数属性（constructor(public name: string)），那不可擦除
  name: string;
  constructor(name: string) { this.name = name; }
  greet(): string { return `hi ${this.name}`; }
}

const u: User = { name: "rainboy", age: 18 };
const id: ID = 1;
const mapper: Mapper<User> = (x) => x.name;
const asUser = u as User;              // 类型断言可擦除
const list: Array<number> = [1, 2];    // 泛型可擦除

// implements / declare / import type 都可擦除
class Impl implements User {
  // 注意：这里不能用参数属性，必须显式声明字段 + 构造函数赋值
  name: string;
  age: number;
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}
const impl: User = new Impl("a", 1);

// ---- 不可擦除：Node 原生会报 ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX ----
//
// 下面这些**不能**写进这个文件，否则整个文件跑不起来。
// 每一项都经过实测确认：
//
// 1. enum E { A, B }
//    → TypeScript enum is not supported in strip-only mode
//
// 2. const enum E { A = 1 }
//    → 同样报错
//
// 3. namespace N { export const a = 1 }
//    → 同样报错
//
// 4. class C { constructor(public x: number) {} }
//    → 参数属性，同样报错
//
// 5. class C { @dec m() {} }
//    → 装饰器，连解析都失败：SyntaxError: Invalid or unexpected token
//
// 6. import fs = require("fs")
//    → 同样报错

console.log(new Greeter(u.name).greet(), mapper(asUser), id, list.length, impl.name);
