// interface 与 type 的能力对比

// ---- 都能做的 ----
interface I1 { a: number }
type T1 = { a: number };

// 扩展
interface I2 extends I1 { b: string }
type T2 = T1 & { b: string };

// 函数类型
interface Fn1 { (x: number): string }
type Fn2 = (x: number) => string;

// 泛型
interface G1<T> { value: T }
type G2<T> = { value: T };

// 索引签名
interface Dict1 { [k: string]: number }
type Dict2 = { [k: string]: number };

// ---- 只有 type 能做的 ----

// 1. 联合类型
type Status = "a" | "b";
// interface Status2 = "a" | "b";   // 语法错误

// 2. 元组类型
type Pair = [number, number];
// interface Pair2 extends [number, number] {}  // 不能直接定义元组

// 3. 条件类型
type IsString<T> = T extends string ? true : false;

// 4. 映射类型
type Partial2<T> = { [K in keyof T]?: T[K] };

// 5. 原始类型别名
type ID = string | number;
type Name = string;

// 6. 模板字面量类型
type Event = `on${string}`;

// ---- 只有 interface 能做的 ----

// 1. 声明合并
interface Merged { a: number }
interface Merged { b: string }
const merged: Merged = { a: 1, b: "x" };

// type 不能合并
type TM = { a: number };
// type TM = { b: string };   // error: Duplicate identifier

// 2. extends 继承（比交叉更严格地检查）
interface Base { a: number }
interface Derived extends Base { b: string }

// extends 可以继承多个
interface Multi extends Base, Merged { c: boolean }

// 3. 类可以实现多个 interface，但 implements 一个 type 联合不行
interface A1 { a: number }
interface B1 { b: number }
class Impl implements A1, B1 {
  a = 1;
  b = 2;
}

// ---- extends 与 & 的一个关键差异 ----

// interface extends：不能覆盖不兼容的属性
// @ts-expect-error TS2430: Interface 'Bad' incorrectly extends interface 'Base'.
interface Bad extends Base {
  a: string;
}

// type 交叉：不报错，但结果是 never
type BadType = Base & { a: string };
// a 的类型变成 number & string = never
const bad: BadType = { a: 1 as never };

console.log(merged, new Impl(), bad);
