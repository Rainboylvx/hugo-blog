// readonly 的深浅边界

interface Config {
  readonly name: string;          // 顶层只读
  nested: {
    readonly value: number;       // 需要显式标记
  };
  list: readonly number[];        // 只读数组
}

const c: Config = { name: "a", nested: { value: 1 }, list: [1, 2] };

// @ts-expect-error TS2540: 顶层只读
c.name = "b";
// @ts-expect-error TS2540: 嵌套里显式标记了 readonly
c.nested.value = 2;
// @ts-expect-error TS2339: 只读数组没有 push
c.list.push(3);

// 但只读是浅层的：没标记的地方可以改
c.nested = { value: 3 };         // 允许！nested 本身不是 readonly
// 只读数组的元素是只读的，但数组引用本身（list）不是

// ---- Readonly<T> 也是浅层的 ----
type ShallowReadonly = Readonly<{ a: { b: number } }>;
const s: ShallowReadonly = { a: { b: 1 } };
// @ts-expect-error TS2540: 顶层只读
s.a = { b: 2 };
s.a.b = 3;                       // 允许！浅层 Readonly 不影响嵌套

// ---- 深度只读需要自己写 ----
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

type Deep = DeepReadonly<{ a: { b: { c: number } } }>;
const d: Deep = { a: { b: { c: 1 } } };
// @ts-expect-error TS2540: 深层只读
d.a.b.c = 2;

// ---- readonly 与可变类型的赋值方向 ----
const mutable: number[] = [1, 2];
const readonlyArr: readonly number[] = mutable;    // ✓ 可变 → 只读
// @ts-expect-error TS4104: 只读不能赋给可变
const back: number[] = readonlyArr;

// ---- 函数参数的 readonly 表达"我不修改它" ----
function sum(nums: readonly number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
sum(mutable);
sum(readonlyArr);

console.log(c.nested.value, c.list, s.a.b, d.a.b.c, sum(mutable), sum(readonlyArr));
