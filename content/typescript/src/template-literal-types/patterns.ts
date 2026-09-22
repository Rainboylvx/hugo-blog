// 模板字面量类型的模式匹配

// ---- 基础拼接 ----
type EventName = "click" | "focus";
type Handler = `on${Capitalize<EventName>}`;   // "onClick" | "onFocus"

// 联合会做笛卡尔积
type Size = "sm" | "md";
type Color = "red" | "blue";
type Variant = `${Size}-${Color}`;             // 4 个成员

// ---- 四个内置字符串操作类型 ----
type A = Uppercase<"abc">;      // "ABC"
type B = Lowercase<"ABC">;      // "abc"
type C = Capitalize<"abc">;     // "Abc"
type D = Uncapitalize<"Abc">;   // "abc"

// ---- infer 提取 ----
// 提取路径剩余部分
type StripLeadingSlash<T> = T extends `/${infer Rest}` ? Rest : never;
type E = StripLeadingSlash<"/users/1">;        // "users/1"

// 只切第一段
type SplitFirst<T> = T extends `${infer Head}/${infer Tail}` ? [Head, Tail] : never;
type F = SplitFirst<"a/b/c">;                  // ["a", "b/c"]

// 解析键值对
type ParseKV<T> = T extends `${infer K}=${infer V}` ? { key: K; value: V } : never;
type G = ParseKV<"name=rainboy">;              // { key: "name"; value: "rainboy" }

// 提取路径参数
type PathParams<T> = T extends `${string}:${infer P}/${infer Rest}`
  ? P | PathParams<`/${Rest}`>
  : T extends `${string}:${infer P}`
    ? P
    : never;
type H = PathParams<"/users/:id/posts/:postId">;   // "id" | "postId"

// ---- 递归转换 ----
// 蛇形转驼峰
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;
type I = SnakeToCamel<"user_first_name">;      // "userFirstName"

// 驼峰转蛇形
type CamelToSnake<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends Uppercase<Head>
      ? Head extends Lowercase<Head>
        ? `${Head}${CamelToSnake<Tail>}`
        : `_${Lowercase<Head>}${CamelToSnake<Tail>}`
      : `${Head}${CamelToSnake<Tail>}`
    : S;
type J = CamelToSnake<"userFirstName">;        // "user_first_name"

// 替换字符串
type Replace<S extends string, From extends string, To extends string> =
  S extends `${infer Head}${From}${infer Tail}` ? `${Head}${To}${Tail}` : S;
type K = Replace<"a-b-c", "-", "_">;           // "a_b-c"（只替换第一处）

// 全部替换（递归）
type ReplaceAll<S extends string, From extends string, To extends string> =
  S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;
type L = ReplaceAll<"a-b-c", "-", "_">;        // "a_b_c"

// ---- 与映射类型组合：批量改键名 ----
interface ApiResponse {
  user_id: number;
  user_name: string;
  created_at: string;
}
type CamelKeys<T> = {
  [P in keyof T as SnakeToCamel<string & P>]: T[P];
};
type M = CamelKeys<ApiResponse>;
// { userId: number; userName: string; createdAt: string }

// ---- 数字与 bigint ----
type SemverMajor = `v${number}`;
const v1: SemverMajor = "v1";
const v1_5: SemverMajor = "v1.5";
// @ts-expect-error TS2322: "v1.2.3" 不是单个 number 字面量
const v1_2_3: SemverMajor = "v1.2.3";

// 需要任意字符串时用 string
type Version = `v${string}`;
const vAny: Version = "v1.2.3";

// 布尔也会被转成字符串
type BoolStr = `${boolean}`;                   // "true" | "false"
const bt: BoolStr = "true";

// null / undefined
type NullStr = `${null}`;                      // "null"
const nt: NullStr = "null";

// ---- 过滤：判断是否以某前缀开头 ----
type StartsWith<T, P extends string> = T extends `${P}${string}` ? true : false;
type N = StartsWith<"onClick", "on">;          // true
type O = StartsWith<"click", "on">;            // false

const a: A = "ABC";
const b: B = "abc";
const c: C = "Abc";
const d: D = "abc";
const e: E = "users/1";
const f: F = ["a", "b/c"];
const g: G = { key: "name", value: "rainboy" };
const h: H = "id";
const i: I = "userFirstName";
const j: J = "user_first_name";
const k: K = "a_b-c";
const l: L = "a_b_c";
const m: M = { userId: 1, userName: "a", createdAt: "d" };
const variant: Variant = "sm-red";
const n: N = true;
const o: O = false;

console.log(a, b, c, d, e, f, g, h, i, j, k, l, m, variant, v1, v1_5, vAny, bt, nt, n, o, v1_2_3);
