// interface：可扩展、可合并
interface Animal {
  name: string;
}
interface Animal {
  age: number;      // 声明合并：Animal 现在有 name 和 age
}

// 继承多个
interface Pet {
  owner: string;
}
interface Dog extends Animal, Pet {
  breed: string;
}

const d: Dog = { name: "wang", age: 3, owner: "rainboy", breed: "corgi" };

// type：可表达联合、元组、条件类型
type Status = "idle" | "loading" | "done";
type Pair = [number, number];
type Maybe<T> = T | null;

// 交叉类型组合对象
type Employee = Animal & Pet & { salary: number };

const e: Employee = { name: "a", age: 1, owner: "b", salary: 100 };

// interface 无法表达联合
// interface Status2 = "idle" | "loading";  // 语法错误

// 两者都能描述函数类型
interface Fn1 { (x: number): string }
type Fn2 = (x: number) => string;

const f1: Fn1 = String;
const f2: Fn2 = String;

console.log(d, e, f1(1), f2(2));
