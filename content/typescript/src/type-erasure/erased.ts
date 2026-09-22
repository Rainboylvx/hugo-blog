// 这些类型注解在编译后完全消失
const n: number = 1;
const s: string = "hello";

interface User {
  name: string;
  age: number;
}

type ID = string | number;

function greet(user: User): string {
  return `hi ${user.name}`;
}

console.log(greet({ name: "rainboy", age: 18 }), n, s);
