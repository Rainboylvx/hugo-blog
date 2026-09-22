// typeof 的两种含义：值位置 vs 类型位置

const config = { debug: true, level: 1 };

// ---- 值位置：JavaScript 的 typeof 运算符，返回字符串 ----
const t1 = typeof config;              // "object"（运行时字符串）
const t2 = typeof 42;                  // "number"
const t3 = typeof undefined;           // "undefined"
const t4 = typeof null;                // "object" ← 历史遗留 bug

// 用于类型收窄（值位置，但影响类型）
function pad(x: string | number): string {
  if (typeof x === "string") return x.padStart(2);   // 收窄为 string
  return x.toFixed(1);
}

// ---- 类型位置：TypeScript 的类型查询运算符，返回类型 ----
type Config = typeof config;           // { debug: boolean; level: number }
type T1 = typeof t1;                   // string（因为 t1 是字符串）

// 常用于从已有值推导类型
const DEFAULT = { retries: 3, timeout: 1000 };
type Options = typeof DEFAULT;         // { retries: number; timeout: number }

// 配合 keyof
type OptionKey = keyof typeof DEFAULT; // "retries" | "timeout"

// 配合 as const 保留字面量
const LIMITS = { min: 0, max: 100 } as const;
type Limits = typeof LIMITS;           // { readonly min: 0; readonly max: 100 }

// ---- 关键区别：typeof 后面是"值"还是"类型" ----

// 类型位置：typeof 后面必须是值（变量、属性、函数）
class Point { x = 0 }
type PointCtor = typeof Point;         // 构造函数类型 new () => Point
type PointInstance = Point;            // 实例类型（不用 typeof）

// 类型位置：typeof 只能用于"值"，不能用于纯类型
// @ts-expect-error TS2693: 'string' only refers to a type, but is being used as a value here.
type Bad2 = typeof string;

type MyType = { a: number };
// @ts-expect-error TS2693: 'MyType' only refers to a type, but is being used as a value here.
type Bad3 = typeof MyType;

// ---- 常见组合 ----
// 1. 从常量推导联合类型
const COLORS = ["red", "green"] as const;
type Color = (typeof COLORS)[number];  // "red" | "green"

// 2. 从函数推导类型
function createUser(name: string, age: number) {
  return { name, age, createdAt: new Date() };
}
type User = ReturnType<typeof createUser>;
type UserParams = Parameters<typeof createUser>;

// 3. 从模块推导类型
const api = {
  getUser: (id: string) => ({ id }),
  listUsers: () => [],
};
type Api = typeof api;
type ApiKeys = keyof Api;              // "getUser" | "listUsers"

// 4. 类的静态侧与实例侧
class Factory {
  static create() { return new Factory(); }
  value = 1;
}
type FactoryStatic = typeof Factory;   // 有 create
type FactoryInstance = Factory;        // 有 value

const f1: FactoryStatic = Factory;
const f2: FactoryInstance = new Factory();

// ---- 陷阱：typeof 在类型位置不能用于表达式 ----
// 下面这行是语法错误（typeof 后面只接受标识符/属性访问）：
//   type Bad6 = typeof getValue();
// error TS1005: ';' expected.

function getValue() { return 1; }
type OkType = typeof getValue;         // ✓ 不加括号，取函数类型
type Ret = ReturnType<typeof getValue>;  // ✓ 用 ReturnType 拿返回类型

console.log(t1, t2, t3, t4, pad("a"), pad(1));
console.log(config, DEFAULT, LIMITS, COLORS, f1.create().value, f2.value);
const check: Config = { debug: false, level: 2 };
console.log(check, new Point().x);
const u: User = createUser("a", 1);
const p: UserParams = ["a", 1];
console.log(u.name, p, api.getUser("1"), api.listUsers(), getValue(), 0 as Ret);
