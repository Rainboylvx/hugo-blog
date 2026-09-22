// 模板字面量类型（TS 4.1+）：在类型层面做字符串模式匹配

type EventName = "click" | "focus";
type Handler = `on${Capitalize<EventName>}`;   // "onClick" | "onFocus"

// 内置的字符串操作类型
type A = Uppercase<"abc">;    // "ABC"
type B = Lowercase<"ABC">;    // "abc"
type C = Capitalize<"abc">;   // "Abc"
type D = Uncapitalize<"Abc">; // "abc"

// 与泛型结合：从字符串提取部分
type ExtractRoute<T> = T extends `/${infer Rest}` ? Rest : never;
type E = ExtractRoute<"/users/1">;    // "users/1"

// 提取两段
type Split<T> = T extends `${infer Head}/${infer Tail}` ? [Head, Tail] : never;
type F = Split<"a/b/c">;   // ["a", "b/c"]（只切第一段）

// 解析键值对
type ParseKV<T> = T extends `${infer K}=${infer V}` ? { key: K; value: V } : never;
type G = ParseKV<"name=rainboy">;   // { key: "name"; value: "rainboy" }

// 把蛇形转驼峰（组合递归 + 映射）
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

type H = SnakeToCamel<"user_first_name">;   // "userFirstName"

// 与映射类型组合：批量改键名
interface ApiResponse {
  user_id: number;
  user_name: string;
}
type CamelKeys<T> = {
  [K in keyof T as SnakeToCamel<string & K>]: T[K];
};
type I = CamelKeys<ApiResponse>;
// { userId: number; userName: string }

// 模板字面量的联合分发
type Size = "sm" | "md";
type Color = "red" | "blue";
type Variant = `${Size}-${Color}`;   // 4 个成员的联合

// 数字也能用，但 ${number} 只匹配合法的数字字面量
type SemverMajor = `v${number}`;
const v1: SemverMajor = "v1";
const v1_5: SemverMajor = "v1.5";
// @ts-expect-error TS2322: "v1.2.3" 不是单个 number 字面量
const v1_2_3: SemverMajor = "v1.2.3";

// 需要任意字符串时用 ${string}
type Version = `v${string}`;
const vAny: Version = "v1.2.3";

const a: A = "ABC";
const b: B = "abc";
const c: C = "Abc";
const d: D = "abc";
const e: E = "users/1";
const f: F = ["a", "b/c"];
const g: G = { key: "name", value: "rainboy" };
const h: H = "userFirstName";
const i: I = { userId: 1, userName: "a" };
const variant: Variant = "sm-red";

console.log(a, b, c, d, e, f, g, h, i, variant, v1, v1_5, vAny);
