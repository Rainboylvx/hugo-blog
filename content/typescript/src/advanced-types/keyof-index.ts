// keyof 与索引访问类型

interface User {
  id: number;
  name: string;
  address: {
    city: string;
    zip: string;
  };
}

type UserKeys = keyof User;            // "id" | "name" | "address"
type IdType = User["id"];              // number
type AddrType = User["address"];       // { city: string; zip: string }
type CityType = User["address"]["city"];  // string

// 联合索引访问会分发
type Values = User["id" | "name"];     // number | string
type AllValues = User[keyof User];     // number | string | { city: string; zip: string }

// keyof 联合类型：取交集
type A = keyof { a: 1; b: 2 };         // "a" | "b"
type B = keyof ({ a: 1 } | { b: 2 });  // never（没有公共键）
type C = keyof ({ a: 1; c: 3 } | { a: 1; b: 2 });  // "a"

// keyof 交叉类型：取并集
type D = keyof ({ a: 1 } & { b: 2 });  // "a" | "b"

// keyof 数组
type E = keyof string[];               // number | "length" | "push" | ... 全部数组方法
type F = keyof readonly string[];      // 去掉可变方法

// keyof any / keyof never / keyof unknown
type G = keyof any;                    // string | number | symbol
type H = keyof never;                  // string | number | symbol
type I = keyof unknown;                // never

// typeof + keyof 组合：从值取键
const config = { debug: true, level: 1 };
type ConfigKey = keyof typeof config;   // "debug" | "level"

// 索引签名下的 keyof
type Dict = { [k: string]: number };
type J = keyof Dict;                    // string | number（数字键也算）

// 数字索引与字符串键的关系
type K = keyof { 0: "a"; name: "b" };   // 0 | "name"

// 用 keyof 做类型安全的取值函数
function pluck<T, K extends keyof T>(obj: T, keys: K[]): T[K][] {
  return keys.map((k) => obj[k]);
}

const u: User = { id: 1, name: "a", address: { city: "bj", zip: "1" } };
const picked = pluck(u, ["id", "name"]);   // (number | string)[]

const a: UserKeys = "id";
const b: Values = 1;
const c: C = "a";
const d: D = "b";
const g: G = "x";
const h: H = 1;
const configKey: ConfigKey = "debug";
const j: J = "any";
const k: K = 0;

console.log(a, b, c, d, g, h, configKey, j, k, picked, u.address.city);
