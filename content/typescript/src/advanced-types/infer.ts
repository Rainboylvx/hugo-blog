// infer：在条件类型里声明待推断的类型变量

// 提取函数返回类型
type MyReturnType<T> = T extends (...args: never[]) => infer R ? R : never;
type A = MyReturnType<() => string>;              // string
type B = MyReturnType<(x: number) => boolean>;    // boolean

// 提取参数类型
type MyParameters<T> = T extends (...args: infer P) => unknown ? P : never;
type C = MyParameters<(a: string, b: number) => void>;   // [string, number]

// 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never;
type D = ElementOf<string[]>;        // string
type E2 = ElementOf<[1, 2, 3]>;      // 1 | 2 | 3

// 提取 Promise 内部类型
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type F = Unwrap<Promise<string>>;    // string
type G = Unwrap<number>;             // number

// 多个 infer 与位置对应
type Swap<T> = T extends [infer A, infer B] ? [B, A] : never;
type H = Swap<[string, number]>;     // [number, string]

// infer 加约束（TS 4.7+）：infer U extends ...
type FirstString<T> = T extends [infer S extends string, ...unknown[]] ? S : never;
type I = FirstString<["a", 1]>;      // "a"
type J = FirstString<[1, 2]>;        // never

// 递归提取嵌套 Promise
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;
type K = DeepUnwrap<Promise<Promise<string>>>;   // string

// 提取函数 this 类型
type ThisOf<T> = T extends (this: infer U, ...args: never[]) => unknown ? U : never;
type L = ThisOf<(this: { id: number }) => void>;   // { id: number }

// 提取构造函数实例类型
type InstanceOf<T> = T extends new (...args: never[]) => infer R ? R : never;
type M = InstanceOf<typeof Date>;    // Date

const a: A = "s";
const b: B = true;
const c: C = ["s", 1];
const d: D = "s";
const e: E2 = 1;
const f: F = "s";
const g: G = 1;
const h: H = [1, "s"];
const i: I = "a";
const j: J = undefined as never;
const k: K = "s";
const l: L = { id: 1 };
const m: M = new Date();

console.log(a, b, c, d, e, f, g, h, i, j, k, l, m instanceof Date);
