// infer 的进阶用法

// ---- 1. infer 的约束（TS 4.7+）----
// 约束不满足时该分支不匹配
type FirstString<T> = T extends [infer S extends string, ...unknown[]] ? S : never;
type A = FirstString<["a", 1]>;      // "a"
type B = FirstString<[1, 2]>;        // never（1 不满足 string）

// 对比：不加约束时需要额外检查
type FirstStringLoose<T> = T extends [infer S, ...unknown[]]
  ? S extends string ? S : never
  : never;
type C = FirstStringLoose<["a", 1]>; // "a"
type D = FirstStringLoose<[1, 2]>;   // never

// ---- 2. 多个 infer 与位置对应 ----
type Swap<T> = T extends [infer A, infer B] ? [B, A] : never;
type E = Swap<[string, number]>;     // [number, string]

// 三个位置
type Rotate<T> = T extends [infer A, infer B, infer C] ? [B, C, A] : never;
type F = Rotate<[1, 2, 3]>;          // [2, 3, 1]

// ---- 3. 同名 infer 多次出现（会推断成"联合"）----
// 实测：SameName<[1, 2]> 的结果是 1 | 2
type SameName<T> = T extends [infer X, infer X] ? X : never;
type SameResult = SameName<[1, 2]>;   // 1 | 2

// 用函数参数位置实现"交集"：逆变位置会做交叉
// 这是 UnionToIntersection 的原理
type UnionToIntersection<U> =
  (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type G = UnionToIntersection<{ a: 1 } | { b: 2 }>;   // { a: 1 } & { b: 2 }

// ---- 4. 递归 infer ----
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;
type H = DeepUnwrap<Promise<Promise<string>>>;       // string

// 递归提取嵌套数组元素
type DeepElement<T> = T extends (infer U)[] ? DeepElement<U> : T;
type I = DeepElement<string[][]>;                    // string

// ---- 5. infer 提取函数各部分 ----
type Fn = (a: string, b: number) => boolean;

type Ret<T> = T extends (...args: never[]) => infer R ? R : never;
type Params<T> = T extends (...args: infer P) => unknown ? P : never;
type FirstParam<T> = T extends (first: infer F, ...rest: never[]) => unknown ? F : never;
type ThisOf<T> = T extends (this: infer U, ...args: never[]) => unknown ? U : never;

type J = Ret<Fn>;          // boolean
type K = Params<Fn>;       // [string, number]
type L = FirstParam<Fn>;   // string

// ---- 6. infer 提取构造函数 ----
type InstanceOf<T> = T extends new (...args: never[]) => infer R ? R : never;
type CtorParams<T> = T extends new (...args: infer P) => unknown ? P : never;

class Point { constructor(public x: number, public y: number) {} }
type M = InstanceOf<typeof Point>;   // Point
type N = CtorParams<typeof Point>;   // [number, number]

// ---- 7. infer 提取对象的值类型 ----
type ValueOf<T> = T extends Record<string, infer V> ? V : never;
type O = ValueOf<{ a: 1; b: 2 }>;    // 1 | 2（Record<string, V> 匹配）

// ---- 8. infer 在模板字面量里 ----
type ParseKV<T> = T extends `${infer K}=${infer V}` ? [K, V] : never;
type P = ParseKV<"name=rainboy">;    // ["name", "rainboy"]

// 提取路径参数
type PathParam<T> = T extends `${string}:${infer P}` ? P : never;
type Q = PathParam<"/users/:id">;    // "id"

const a: A = "a";
const b: B = undefined as never;
const c: C = "a";
const d: D = undefined as never;
const e: E = [1, "a"];
const f: F = [2, 3, 1];
const g: G = { a: 1, b: 2 };
const h: H = "s";
const i: I = "s";
const j: J = true;
const k: K = ["a", 1];
const l: L = "a";
const m: M = new Point(1, 2);
const n: N = [1, 2];
const o: O = 1;
const p: P = ["name", "rainboy"];
const q: Q = "id";

console.log(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
