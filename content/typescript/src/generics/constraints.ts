// 泛型约束的各种形态

// 1. 对象形状约束
function getName<T extends { name: string }>(x: T): string {
  return x.name;
}

// 2. keyof 约束
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

// 3. 联合约束
function toId<T extends string | number>(v: T): string {
  return `id_${v}`;
}

// 4. 构造函数约束：new (...args) => T
function create<T>(Ctor: new () => T): T {
  return new Ctor();
}

class Widget {
  kind = "widget";
}

// 5. 带参数的构造函数约束
function createWith<T, A extends unknown[]>(
  Ctor: new (...args: A) => T,
  ...args: A
): T {
  return new Ctor(...args);
}

class Point {
  constructor(public x: number, public y: number) {}
}

// 6. 用约束保留参数的具体类型（避免推断成宽类型）
function firstElement<T>(arr: [T, ...T[]]): T {
  return arr[0];
}

// 7. const 类型参数（TS 5.0+）：保留字面量类型
function tuple<T extends readonly unknown[]>(items: T): T {
  return items;
}

// 没有 const：推断成 string[]
const t1 = tuple(["a", "b"]);
const probe1: string[] = t1;              // 通过，证明是 string[]

// 加 const 后保留字面量元组
function tupleConst<const T extends readonly unknown[]>(items: T): T {
  return items;
}
const t2 = tupleConst(["a", "b"]);        // readonly ["a", "b"]
// @ts-expect-error TS4104: readonly 不能赋给可变类型，证明 t2 是字面量元组
const probe2: string[] = t2;

console.log(getName({ name: "a" }), pluck([{ n: 1 }, { n: 2 }], "n"));
console.log(toId(1), create(Widget).kind, createWith(Point, 1, 2).x);
console.log(firstElement([1, 2, 3]), t1, t2);
