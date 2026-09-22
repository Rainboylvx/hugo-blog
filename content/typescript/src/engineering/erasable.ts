// 纯可擦除语法：Node 原生可以直接运行
//   node content/typescript/src/engineering/erasable.ts

interface User {
  name: string;
  age: number;
}

type ID = string | number;

type Mapper<T> = (item: T) => string;

class Greeter {
  // 注意：这里不能用参数属性（constructor(public name: string)），那是不可擦除的
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  greet(): string {
    return `hi ${this.name}`;
  }
}

const u: User = { name: "rainboy", age: 18 };
const id: ID = 1;
const mapper: Mapper<User> = (x) => x.name;

// 类型断言、泛型调用都是可擦除的
const asUser = u as User;
const list: Array<number> = [1, 2, 3];

console.log(new Greeter(u.name).greet(), mapper(asUser), id, list.length);
