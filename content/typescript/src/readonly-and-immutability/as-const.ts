// as const 的深度：递归应用于所有嵌套

const config = {
  mode: "dark",
  level: 1,
  tags: ["a", "b"],
  nested: { deep: { value: 1 } },
} as const;

// 所有属性变成只读字面量类型
const mode: "dark" = config.mode;
const level: 1 = config.level;
const tag: "a" = config.tags[0];        // 元组，不是数组
const deep: 1 = config.nested.deep.value;

// @ts-expect-error TS2540: 全部只读
config.mode = "light";
// @ts-expect-error TS2339: 数组也是 readonly 元组
config.tags.push("c");

// as const 让数组变成只读元组
type Tags = typeof config.tags;         // readonly ["a", "b"]
const tagsCheck: readonly ["a", "b"] = config.tags;

// ---- 对比：不用 as const ----
const loose = {
  mode: "dark",
  tags: ["a", "b"],
};
// mode 的类型是 string，不是 "dark"
const looseMode: string = loose.mode;
// tags 的类型是 string[]，可以 push
loose.tags.push("c");

// ---- as const 与显式 readonly 的区别 ----
// as const：递归 + 字面量类型
const a1 = { x: 1 } as const;
// 显式 readonly：只作用于标记的那一层，且不改变类型宽度
type RO = { readonly x: number };
const a2: RO = { x: 1 };
// a2.x 是 number（不是 1），a1.x 是 1

// ---- 从 as const 的对象推导联合类型 ----
const DIRECTIONS = ["up", "down", "left", "right"] as const;
type Direction = (typeof DIRECTIONS)[number];    // "up" | "down" | "left" | "right"

const d1: Direction = "up";
// @ts-expect-error TS2322: 不在联合里
const d2: Direction = "sideways";

// ---- as const 与 satisfies 组合 ----
// as const 保证只读和字面量，satisfies 保证结构检查
const ROUTES = {
  home: "/",
  about: "/about",
} as const satisfies Record<string, `/${string}`>;

type RouteKey = keyof typeof ROUTES;    // "home" | "about"

console.log(mode, level, tag, deep, tagsCheck, looseMode, loose.tags, a1.x, a2.x, d1, d2);
console.log(ROUTES.home, ROUTES.about);
const routeKey: RouteKey = "home";
console.log(routeKey);
