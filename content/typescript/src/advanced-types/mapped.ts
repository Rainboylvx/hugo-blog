// 映射类型：把旧类型的每个键变换成新类型

interface User {
  id: number;
  name: string;
  email: string;
}

// 基础映射：遍历所有键
type Partial2<T> = { [K in keyof T]?: T[K] };
type Required2<T> = { [K in keyof T]-?: T[K] };      // -? 去掉可选
type Readonly2<T> = { readonly [K in keyof T]: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // -readonly 去掉只读

// 值类型变换
type Stringify<T> = { [K in keyof T]: string };

// 键重映射 as（TS 4.1+）：改名或过滤
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type GetterUser = Getters<User>;
// { getId: () => number; getName: () => string; getEmail: () => string }

// 用 as 过滤键：只保留特定类型
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};
type OnlyStrings = PickByType<User, string>;   // { name: string; email: string }

// 用 as 排除键
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};
type WithoutStrings = OmitByType<User, string>;  // { id: number }

// 从联合生成对象
type Flags = "a" | "b";
type FlagMap = { [K in Flags]: boolean };   // { a: boolean; b: boolean }

// 同态映射：{ [K in keyof T]: ... } 会保留修饰符
// 非同态映射（用条件类型变换 keyof T）会丢失修饰符
type Homomorphic<T> = { [K in keyof T]: T[K] };   // 保留 readonly / ?

// 验证结果
const getters: GetterUser = {
  getId: () => 1,
  getName: () => "a",
  getEmail: () => "b",
};

const onlyStr: OnlyStrings = { name: "a", email: "b" };
const withoutStr: WithoutStrings = { id: 1 };
const flags: FlagMap = { a: true, b: false };
const p: Partial2<User> = { name: "a" };
const r: Required2<Partial2<User>> = { id: 1, name: "a", email: "b" };
const str: Stringify<User> = { id: "1", name: "a", email: "b" };

console.log(getters.getId(), onlyStr.name, withoutStr.id, flags.a, p.name, r.id, str.id);
