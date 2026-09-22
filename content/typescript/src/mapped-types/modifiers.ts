// 映射类型的修饰符

interface User {
  readonly id: number;
  name: string;
  email?: string;
}

// +? / ? 添加可选；-? 移除可选
type Optional<T> = { [K in keyof T]?: T[K] };
type Required2<T> = { [K in keyof T]-?: T[K] };

// +readonly / readonly 添加只读；-readonly 移除只读
type Immutable<T> = { readonly [K in keyof T]: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// 组合：去掉只读 + 去掉可选
type MutableRequired<T> = { -readonly [K in keyof T]-?: T[K] };

// 验证：Required2 去掉了 ?
type R = Required2<User>;
const r: R = { id: 1, name: "a", email: "b" };   // email 变成必需

// 验证：Mutable 去掉了 readonly
type M = Mutable<User>;
const m: M = { id: 1, name: "a" };
m.id = 2;      // ✓ 不再是只读

// 验证：Optional 全部可选
type O = Optional<User>;
const o: O = {};   // ✓ 全部可选

// ---- 键重映射 as ----
// 加前缀
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type G = Getters<{ id: number; name: string }>;
// { getId: () => number; getName: () => string }

// 去前缀
type RemovePrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]: T[K];
};

// 按值类型过滤
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type OnlyStrings = PickByType<User, string>;    // { name: string; email?: string }

// 排除某些键
type OmitByType<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};

// 按键名过滤
type OnlyKeysStartingWith<T, P extends string> = {
  [K in keyof T as K extends `${P}${string}` ? K : never]: T[K];
};

// 转成 getter/setter 对
type Accessors<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (v: T[K]) => void;
};

// ---- 从联合生成对象 ----
type Flags = "a" | "b";
type FlagMap = { [K in Flags]: boolean };       // { a: boolean; b: boolean }

// 用 Record 等价
type FlagMap2 = Record<Flags, boolean>;

// ---- 同态 vs 非同态（修饰符保留）----
interface U { readonly a: number; b?: string }

// 同态：直接 keyof T，保留修饰符
type Homo<T> = { [K in keyof T]: T[K] };
type H1 = Homo<U>;      // readonly a, b? 都保留

// 同态：as 重映射也保留修饰符（实测）
type HomoAs<T> = { [K in keyof T as K]: T[K] };
type H2 = HomoAs<U>;    // 修饰符也保留

// 非同态：对 keyof T 做运算，修饰符丢失
type NonHomo<T> = { [K in keyof T & string]: T[K] };
type H3 = NonHomo<U>;   // readonly 和 ? 都丢失

// 验证 H1 保留 readonly
const h1: H1 = { a: 1 };
// @ts-expect-error TS2540: H1 保留了 readonly
h1.a = 2;

// 验证 H3 丢失 readonly 和 ?：b 从可选变成必需，a 从只读变成可写
const h3: H3 = { a: 1, b: "x" };   // b 现在必须提供
h3.a = 2;                          // ✓ 不再是只读

const g: G = { getId: () => 1, getName: () => "a" };
const onlyStr: OnlyStrings = { name: "a" };
const withoutStr: OmitByType<User, string> = { id: 1 };
const flags: FlagMap = { a: true, b: false };
const acc: Accessors<{ x: number }> = { getX: () => 1, setX: (v) => { void v; } };
const mp: MutableRequired<User> = { id: 1, name: "a", email: "b" };

console.log(r, m, o, g.getId(), onlyStr.name, withoutStr.id, flags.a, acc.getX(), mp.id, h1.a, h3.a);
