// 内置工具类型完整目录（行为均经实测验证）

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// ==================== 对象变换 ====================
type P = Partial<User>;                        // 全部可选
type R = Required<P>;                          // 全部必需
type RO = Readonly<User>;                      // 全部只读
type Picked = Pick<User, "id" | "name">;       // 只保留指定键
type Omitted = Omit<User, "email">;            // 排除指定键
type Rec = Record<"a" | "b", number>;          // { a: number; b: number }

// ==================== 联合变换 ====================
type U = Exclude<"a" | "b" | "c", "a">;        // "b" | "c"
type I = Extract<"a" | "b" | "c", "a" | "b">;  // "a" | "b"
type NN = NonNullable<string | null | undefined>;   // string

// ==================== 函数变换 ====================
type Fn = (this: { id: number }, a: string, b: number) => boolean;

type Ret = ReturnType<Fn>;                     // boolean
type Params = Parameters<Fn>;                  // [string, number]
type ThisT = ThisParameterType<Fn>;            // { id: number }
type NoThis = OmitThisParameter<Fn>;           // (a: string, b: number) => boolean

// 构造函数相关
class Point { constructor(public x: number, public y: number) {} }
type CtorParams = ConstructorParameters<typeof Point>;   // [number, number]
type Inst = InstanceType<typeof Point>;                  // Point

// ==================== Promise ====================
type A1 = Awaited<Promise<string>>;                  // string
type A2 = Awaited<Promise<Promise<number>>>;         // number（递归）
type A3 = Awaited<string | Promise<number>>;         // string | number

// ==================== 字符串 ====================
type S1 = Uppercase<"a">;      // "A"
type S2 = Lowercase<"A">;      // "a"
type S3 = Capitalize<"ab">;    // "Ab"
type S4 = Uncapitalize<"Ab">;  // "ab"

// ==================== 组合出项目专用工具 ====================

// 把某个键变成可选
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 把某个键变成必需
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// 只改一个键的类型
type Override<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };

// 深度 Partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// 深度 Readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// 至少一个键必需（互斥或）
type AtLeastOne<T, K extends keyof T = keyof T> = Omit<T, K> &
  { [P in K]: Required<Pick<T, P>> & Partial<Record<Exclude<K, P>, never>> }[K];

// 从联合里挑出函数的返回类型
type UnionReturn<T> = T extends (...args: never[]) => infer R ? R : never;

// 把联合转成交叉
type UnionToIntersection<U> =
  (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

// 取出值为某类型的键
type KeysOfType<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];

// ==================== 验证 ====================

const partial: P = { id: 1 };
const required: R = { id: 1, name: "a", email: "b", age: 1 };
const picked: Picked = { id: 1, name: "a" };
const omitted: Omitted = { id: 1, name: "a", age: 1 };
const rec: Rec = { a: 1, b: 2 };
const excl: U = "b";
const extr: I = "a";
const nonNull: NN = "s";
const ret: Ret = true;
const params: Params = ["s", 1];
const thisT: ThisT = { id: 1 };
const noThis: NoThis = (a: string, b: number) => a.length > b;
const ctorParams: CtorParams = [1, 2];
const inst: Inst = new Point(1, 2);
const a1: A1 = "s";
const a2: A2 = 1;
const a3: A3 = "s";
const s1: S1 = "A";
const s2: S2 = "a";
const s3: S3 = "Ab";
const s4: S4 = "ab";

const optEmail: PartialBy<User, "email"> = { id: 1, name: "a", age: 1 };
const reqEmail: RequiredBy<P, "email"> = { id: 1, email: "b" };
const strId: Override<User, "id", string> = { id: "1", name: "a", email: "b", age: 1 };
const deep: DeepPartial<{ a: { b: { c: number } } }> = { a: { b: {} } };
const deepRo: DeepReadonly<{ a: { b: number } }> = { a: { b: 1 } };
const atLeast: AtLeastOne<{ a: number; b: string }> = { a: 1 };
const unionRet: UnionReturn<() => string> = "s";
const unionInter: UnionToIntersection<{ a: 1 } | { b: 2 }> = { a: 1, b: 2 };
const keysOfType: KeysOfType<User, string> = "name";   // "name" | "email"

console.log(partial, required, picked, omitted, rec, excl, extr, nonNull, ret, params);
console.log(thisT, noThis, ctorParams, inst, a1, a2, a3, s1, s2, s3, s4);
console.log(optEmail, reqEmail, strId, deep, deepRo, atLeast, unionRet, unionInter, keysOfType);
