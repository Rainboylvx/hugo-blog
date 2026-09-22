// 泛型推断位置：类型参数从哪些地方被推断出来

// ---- 会被推断的位置 ----

// 1. 参数类型
function fromParam<T>(x: T): T { return x; }
const a = fromParam("a");                    // T = string

// 2. 参数的结构
function fromProp<T>(o: { value: T }): T { return o.value; }
const b = fromProp({ value: 1 });            // T = number

// 3. 数组元素
function fromArray<T>(arr: T[]): T | undefined { return arr[0]; }
const c = fromArray([1, 2]);                 // T = number

// 4. 元组位置
function fromTuple<T, U>(pair: [T, U]): [U, T] { return [pair[1], pair[0]]; }
const d = fromTuple(["a", 1]);               // T = string, U = number

// 5. 回调返回值
function fromCallback<T>(cb: () => T): T { return cb(); }
const e = fromCallback(() => 1);             // T = number

// 6. 嵌套结构
function fromNested<T>(o: { a: { b: T } }): T { return o.a.b; }
const f = fromNested({ a: { b: true } });    // T = boolean

// 7. 索引访问位置
function fromIndex<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }
const g = fromIndex({ x: 1 }, "x");          // T = { x: number }, K = "x"

// ---- 不会被推断的位置 ----

// 1. 只在返回位置出现
function make<T>(): T { return undefined as T; }
const h = make();                            // T = unknown（不是推断出来的）

// 2. 只在约束里出现（U extends T，但 T 由第一个参数推断）
function constrained<T, U extends T>(a: T, b: U): T { return a; }
// 注意：T 被推断为字面量 1，所以 2 不满足 U extends 1
const i = constrained<number, number>(1, 2);

// 3. 只在条件类型里出现
type Unwrap<T> = T extends Promise<infer U> ? U : T;
// 这里的 U 是 infer 声明的，不是函数类型参数

// ---- 多位置推断：取"最佳公共类型" ----

function combine<T>(a: T, b: T): T { return a; }
const j = combine(1, 2);                     // T = number
const k = combine("a", "b");                 // T = string
// combine(1, "a") 会报错：T 推断为 string | number，但参数各自不匹配

// 用元组可以避免"公共类型"问题
function combine2<T, U>(a: T, b: U): [T, U] { return [a, b]; }
const l = combine2(1, "a");                  // T = number, U = string

// ---- 默认类型参数：推断失败时使用 ----
function withDefault<T = string>(): T | undefined { return undefined; }
const m = withDefault();                     // T = string（默认值）
const n = withDefault<number>();             // T = number

// ---- NoInfer：阻止某位置参与推断（TS 5.4+）----
function withNoInfer<T>(items: T[], fallback: NoInfer<T>): T {
  return items.length ? items[0]! : fallback;
}
const o = withNoInfer([1, 2], 0);            // T = number，由 items 决定

// 对比：不加 NoInfer 时 fallback 也参与推断
function withoutNoInfer<T>(items: T[], fallback: T): T {
  return items.length ? items[0]! : fallback;
}
const p = withoutNoInfer([1, 2], 0);         // T = number（这里恰好一致）

// 没有 NoInfer 时，fallback 会影响推断结果：
// 传入不匹配的值会报错，而不是静默扩大 T
// @ts-expect-error TS2345: T 已由 items 确定为 number
const pBad = withoutNoInfer([1, 2], "x");

// 想接受混合类型要显式标注
const pMixed = withoutNoInfer<number | string>([1, 2], "x");

// ---- 推断失败时的行为：unknown，不是 any ----
function onlyReturn<T>(): T { return undefined as T; }
const q = onlyReturn();
// @ts-expect-error TS2322: T 推断为 unknown
const qCheck: string = q;

// 显式指定才能拿到具体类型
const r = onlyReturn<string>();

console.log(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, pBad, pMixed, qCheck, r);
