// 分布式条件类型：裸类型参数遇联合会分发

// 裸类型参数 T → 分发
type ToArray<T> = T extends unknown ? T[] : never;
type A = ToArray<string | number>;        // string[] | number[]  ← 分发了

// 用 [] 包裹阻止分发
type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never;
type B = ToArrayNoDist<string | number>;  // (string | number)[]  ← 没分发

// never 在分发时的特殊性
type C = ToArray<never>;                  // never（空联合，没有成员可分发）

// 只有"裸"类型参数才分发：被包裹或经过运算就不分发
type Wrapped<T> = [T] extends [unknown] ? T : never;
type D = Wrapped<string | number>;        // string | number（不分发）

type InTuple<T> = [T] extends [string] ? T[] : never;
type E = InTuple<string | number>;        // never（联合不满足 [string]）

// 实际应用：内置工具类型都靠分发
type MyExclude<T, U> = T extends U ? never : T;
type F = MyExclude<"a" | "b" | "c", "a">;   // "b" | "c"

type MyExtract<T, U> = T extends U ? T : never;
type G = MyExtract<"a" | "b" | "c", "a" | "b">;   // "a" | "b"

type MyNonNullable<T> = T extends null | undefined ? never : T;
type H = MyNonNullable<string | null | undefined>;   // string

// 分发在联合的每个成员上独立求值
type IsString<T> = T extends string ? "yes" : "no";
type I = IsString<string | number>;       // "yes" | "no"  ← 两个结果合并

// 不分发版本
type IsStringNoDist<T> = [T] extends [string] ? "yes" : "no";
type J = IsStringNoDist<string | number>; // "no"（整个联合不满足 string）

// 探测技巧
// 探测 any：any 同时匹配 1 和 0
type IsAny<T> = 0 extends 1 & T ? true : false;
type K = IsAny<any>;                      // true
type L = IsAny<string>;                   // false

// 探测 never：必须用 [] 阻止分发
type IsNever<T> = [T] extends [never] ? true : false;
type M = IsNever<never>;                  // true
// 不加 [] 时：T extends never ? true : false，传入 never 会直接返回 never
type IsNeverBad<T> = T extends never ? true : false;
type N = IsNeverBad<never>;               // never（不是 true！）

// 探测 unknown
type IsUnknown<T> = [unknown] extends [T] ? ([T] extends [unknown] ? true : false) : false;
type O = IsUnknown<unknown>;              // true
type P = IsUnknown<string>;               // false

const a: A = [1];
const b: B = [1, "a"];
const c: C = undefined as never;
const d: D = "x";
const e: E = undefined as never;
const f: F = "b";
const g: G = "a";
const h: H = "s";
const i: I = "yes";
const j: J = "no";
const k: K = true;
const l: L = false;
const m: M = true;
const n: N = undefined as never;
const o: O = true;
const p: P = false;

console.log(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
