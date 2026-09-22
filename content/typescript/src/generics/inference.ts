// 泛型的推断位置：类型参数从哪些地方被推断出来

// 1. 从参数推断（最常见）
function fromParam<T>(x: T): T { return x; }
const r1 = fromParam("a");          // T = string

// 2. 从参数的结构推断
function fromProp<T>(obj: { value: T }): T { return obj.value; }
const r2 = fromProp({ value: 1 });  // T = number

// 3. 从数组元素推断
function fromArray<T>(arr: T[]): T | undefined { return arr[0]; }
const r3 = fromArray([1, 2]);       // T = number

// 4. 从回调参数推断（参数位置逆变，推断较弱）
function fromCallback<T>(cb: () => T): T { return cb(); }
const r4 = fromCallback(() => 1);   // T = number

// 5. 推断不出来的情况：类型参数只出现在返回位置
function make<T>(): T {
  return undefined as T;
}
// 不指定类型参数时，T 推断为 unknown（不是 any，也不是报错）
const uninferred = make();
// @ts-expect-error TS2322: unknown 不能赋给 string
const probe: string = uninferred;
const r5 = make<string>();          // 必须显式指定才能拿到具体类型

// 6. 从多个位置推断，取"最佳公共类型"
function combine<T>(a: T, b: T): T { return a; }
const r6 = combine(1, 2);           // T = number
const r7 = combine("a", "b");       // T = string
// const r8 = combine(1, "b");      // 报错：推断成 string | number 后仍不匹配

// 7. 默认类型参数：推断失败时使用
function withDefault<T = string>(x?: T): T | undefined { return x; }
const r9 = withDefault();           // T = string
const r10 = withDefault(1);         // T = number

// 8. NoInfer（TS 5.4+）：阻止从某位置推断
function withNoInfer<T>(items: T[], fallback: NoInfer<T>): T {
  return items.length ? items[0]! : fallback;
}
// fallback 不参与推断，T 由 items 决定
const r11 = withNoInfer([1, 2], 0);   // T = number

console.log(r1, r2, r3, r4, r5, r6, r7, r9, r10, r11);
