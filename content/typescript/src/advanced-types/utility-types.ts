// 内置工具类型：逐个验证行为

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// ---- 对象变换 ----
type P = Partial<User>;       // 全部可选
type R = Required<P>;         // 全部必需
type RO = Readonly<User>;     // 全部只读
type Picked = Pick<User, "id" | "name">;      // 只保留指定键
type Omitted = Omit<User, "email">;           // 排除指定键
type Rec = Record<"a" | "b", number>;         // { a: number; b: number }

// ---- 联合变换 ----
type U = Exclude<"a" | "b" | "c", "a">;       // "b" | "c"
type I = Extract<"a" | "b" | "c", "a" | "b">; // "a" | "b"
type NN = NonNullable<string | null | undefined>;  // string

// ---- 函数变换 ----
type Fn = (a: string, b: number) => boolean;
type Ret = ReturnType<Fn>;        // boolean
type Params = Parameters<Fn>;     // [string, number]
type ThisT = ThisParameterType<Fn>;   // unknown
type NoThis = OmitThisParameter<Fn>;  // 去掉 this 的函数类型
type Constr = abstract new () => User;
type Inst = InstanceType<new () => User>;   // User

// ---- Promise ----
type A1 = Awaited<Promise<string>>;                 // string
type A2 = Awaited<Promise<Promise<number>>>;        // number
type A3 = Awaited<string | Promise<number>>;        // string | number

// ---- 字符串（TS 4.1+）----
type S1 = Uppercase<"a">;     // "A"
type S2 = Lowercase<"A">;     // "a"
type S3 = Capitalize<"ab">;   // "Ab"
type S4 = Uncapitalize<"Ab">; // "ab"

// ---- 组合使用 ----
// 把某个键变成可选
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type WithOptionalEmail = PartialBy<User, "email">;

// 把某个键变成必需
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// 只改一个键的类型
type Override<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: V };
type UserWithStringId = Override<User, "id", string>;

// 深度 Partial（递归）
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// ---- 验证 ----
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
const inst: Inst = { id: 1, name: "a", email: "b", age: 1 };
const a1: A1 = "s";
const a2: A2 = 1;
const a3: A3 = "s";
const s1: S1 = "A";
const s2: S2 = "a";
const s3: S3 = "Ab";
const s4: S4 = "ab";
const optEmail: WithOptionalEmail = { id: 1, name: "a", age: 1 };
const strId: UserWithStringId = { id: "1", name: "a", email: "b", age: 1 };
const deep: DeepPartial<{ a: { b: { c: number } } }> = { a: { b: {} } };

console.log(partial, required, picked, omitted, rec, excl, extr, nonNull, ret, params);
console.log(inst, a1, a2, a3, s1, s2, s3, s4, optEmail, strId, deep);
