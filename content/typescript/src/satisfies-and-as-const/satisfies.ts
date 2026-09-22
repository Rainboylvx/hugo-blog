// satisfies：既检查又保留推断

type Route = { path: string; method: "GET" | "POST" };

// ---- 问题：注解丢失推断 ----
const routes1: Route[] = [{ path: "/a", method: "GET" }];
// routes1[0].method 的类型是 "GET" | "POST"，丢了具体值

// ---- 问题：不注解丢失检查 ----
const routes2 = [{ path: "/a", method: "GETT" }];   // 拼错了也不报错

// ---- satisfies 同时解决两者 ----
const routes3 = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] satisfies Route[];

// 数组 satisfies 后，索引访问得到元素类型的联合
type Route3Method = (typeof routes3)[number]["method"];   // "GET" | "POST"

// 单个对象才保留具体字面量
const single = { path: "/a", method: "GET" } satisfies Route;
const r3: "GET" = single.method;      // ✓ 保留字面量 "GET"

// 数组要保留每个位置的字面量，用 as const satisfies
const tuple = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] as const satisfies readonly Route[];
const t0: "GET" = tuple[0].method;    // ✓ 元组保留位置信息

// ---- 检查对象键完整 ----
type Env = "dev" | "prod";
const urls = {
  dev: "http://localhost",
  prod: "https://example.com",
} satisfies Record<Env, string>;
// 少写一个键会报错

// satisfies 保留具体键
type K = keyof typeof urls;           // "dev" | "prod"
// 对比：注解会退化成 Env
const urls2: Record<Env, string> = { dev: "a", prod: "b" };
type K2 = keyof typeof urls2;         // Env

// ---- 检查值符合约束 ----
type Color = "red" | "green" | "blue";
const palette = {
  primary: "red",
  secondary: "green",
} satisfies Record<string, Color>;

// ---- 对比四种写法的差异 ----
// 1. 注解：有检查，丢推断
const a1: Route = { path: "/a", method: "GET" };
type T1 = typeof a1.method;           // "GET" | "POST"

// 2. 无注解：有推断，无检查
const a2 = { path: "/a", method: "GET" as const };
type T2 = typeof a2.method;           // "GET"

// 3. satisfies：有检查 + 有推断
const a3 = { path: "/a", method: "GET" } satisfies Route;
type T3 = typeof a3.method;           // "GET"

// 4. as const satisfies：最严格
const a4 = { path: "/a", method: "GET" } as const satisfies Route;
type T4 = typeof a4.method;           // "GET"，且只读

const methodUnion: Route3Method = "GET";
console.log(routes1, routes2, routes3, single, tuple, urls, urls2, palette, a1, a2, a3, a4, methodUnion, r3, t0);
