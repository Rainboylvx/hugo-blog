// satisfies（TS 4.9+）与 as const 的分工

// 问题：注解会丢失推断
type Route = { path: string; method: "GET" | "POST" };
const routes1: Route[] = [{ path: "/a", method: "GET" }];
// routes1[0].method 的类型是 "GET" | "POST"，丢失了具体值

// 不注解会丢失检查
const routes2 = [{ path: "/a", method: "GETT" }];   // 拼错了也不报错

// satisfies：既检查又保留推断
const routes3 = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] satisfies Route[];
// 数组元素类型是每个元素类型的联合，所以索引访问得到的是联合
type Route3Method = (typeof routes3)[number]["method"];   // "GET" | "POST"

// 单个对象用 satisfies 才能保留具体字面量
const single = { path: "/a", method: "GET" } satisfies Route;
const r3: "GET" = single.method;      // 通过：保留字面量 "GET"

// 想要数组也保留每个位置的字面量，用 as const satisfies
const tuple = [
  { path: "/a", method: "GET" },
  { path: "/b", method: "POST" },
] as const satisfies readonly Route[];
const t0: "GET" = tuple[0].method;    // 通过：元组保留了位置信息

// as const：让所有属性变成只读字面量
const config1 = { mode: "dark", level: 1 } as const;
// config1.mode 的类型是 "dark"，不是 string
// config1 的每个属性都是 readonly

// satisfies + as const 组合：最严格的写法
const config2 = {
  mode: "dark",
  level: 1,
  tags: ["a", "b"],
} as const satisfies { mode: string; level: number; tags: readonly string[] };

const mode2: "dark" = config2.mode;
const tag2: "a" = config2.tags[0];

// satisfies 用于 Record：检查键完整且值合法
type Env = "dev" | "prod";
const urls = {
  dev: "http://localhost",
  prod: "https://example.com",
} satisfies Record<Env, string>;
// 少写一个键会报错

// 不用 satisfies 时：注解会丢失 key 的精确类型
const urls2: Record<Env, string> = { dev: "a", prod: "b" };
type K2 = keyof typeof urls2;    // Env
type K3 = keyof typeof urls;     // "dev" | "prod"（satisfies 保留具体键）

// as const 的深度：递归应用于所有嵌套
const nested = { a: { b: { c: 1 } } } as const;
// nested.a.b.c 的类型是 1，且全部 readonly

// 对比：as const 与显式 readonly
type RO = { readonly a: 1 };
const ro: RO = { a: 1 };

const r1: "GET" | "POST" = routes1[0]!.method;
const r3m: Route3Method = "GET";
const t0m: "GET" = t0;
const r2: string = routes2[0]!.method;
const c1: "dark" = config1.mode;
const k2: K2 = "dev";
const k3: K3 = "dev";

console.log(r1, r2, r3, r3m, t0m, mode2, tag2, c1, k2, k3, urls.dev, urls2.prod, ro.a, nested.a.b.c);
