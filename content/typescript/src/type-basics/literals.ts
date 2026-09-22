// 字面量类型：只表示一个值的类型

let a = "hello";        // 推断为 string（let 可变）
const c = "hello";      // 推断为 "hello"（const 不可变）

// 显式声明字面量类型
let direction: "left" | "right" = "left";

// 与 const 断言对比
const config = { mode: "dark" } as const;  // mode 的类型是 "dark"，不是 string

// 数字与布尔字面量
let one: 1 = 1;
let yes: true = true;

console.log(a, c, direction, config.mode, one, yes);
