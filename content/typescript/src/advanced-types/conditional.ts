// 条件类型：T extends U ? X : Y

type IsString<T> = T extends string ? true : false;

type A = IsString<"a">;    // true
type B = IsString<1>;      // false
type C = IsString<string>; // true

// 分布式条件类型：裸类型参数遇到联合会分发
type ToArray<T> = T extends unknown ? T[] : never;

// string | number 会分发给每个成员
type D = ToArray<string | number>;   // string[] | number[]

// 用 [] 包裹可以阻止分发
type ToArrayNoDist<T> = [T] extends [unknown] ? T[] : never;
type E = ToArrayNoDist<string | number>;   // (string | number)[]

// 实用例子：排除 null 和 undefined
type NonNullable2<T> = T extends null | undefined ? never : T;
type F = NonNullable2<string | null | undefined>;   // string

// never 在分布式条件类型中的特殊性
type G = ToArray<never>;   // never（不是 never[]）

// 探测类型是否为 any（any 会同时匹配两个分支）
type IsAny<T> = 0 extends 1 & T ? true : false;
type H = IsAny<any>;       // true
type I = IsAny<string>;    // false

// 探测是否为 never
type IsNever<T> = [T] extends [never] ? true : false;
type J = IsNever<never>;   // true
type K = IsNever<string>;  // false

// 用 satisfies 之外的探测手段验证推断结果
const a: A = true;
const b: B = false;
const d: D = [1];
const e: E = [1, "a"];
const f: F = "x";
const h: H = true;
const i: I = false;
const j: J = true;
const k: K = false;

console.log(a, b, d, e, f, h, i, j, k);
