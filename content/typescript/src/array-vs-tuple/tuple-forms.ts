// 元组的各种形态

// 1. 基本元组
const pair: [string, number] = ["a", 1];

// 2. 可选元素：必须放在最后
const optional: [string, number?] = ["a"];
const optional2: [string, number?] = ["a", 1];

// 3. 剩余元素：定义最小长度
const atLeastOne: [string, ...string[]] = ["a"];
const atLeastOne2: [string, ...string[]] = ["a", "b", "c"];
// @ts-expect-error TS2322: 至少需要一个元素
const empty: [string, ...string[]] = [];

// 4. 混合：前面固定，后面不定
const mixed: [number, boolean, ...string[]] = [1, true, "a", "b"];

// 5. 只读元组
const roTuple: readonly [string, number] = ["a", 1];
// @ts-expect-error TS2540: Cannot assign to '0' because it is a read-only property.
roTuple[0] = "b";

// 6. 元组数组
const pairs: [string, number][] = [["a", 1], ["b", 2]];

// 7. 可选元素的等价写法
// [number, number?] 等价于 [number, number] | [number]
type A = [number, number?];
type B = [number, number] | [number];
const a1: A = [1];
const b1: B = [1];

// 8. 命名元组元素（TS 4.0+）：只是文档作用，不改变类型
type Range = [start: number, end: number];
const range: Range = [1, 10];
// 命名会显示在类型提示里

// 9. 嵌套元组
const matrix: [[number, number], [number, number]] = [[1, 2], [3, 4]];

// 10. 解构
const [first, second] = pair;
const [head, ...tail] = atLeastOne2;

// 元组的 length 是字面量类型
type Len = typeof pair["length"];    // 2
const len: Len = 2;

console.log(pair, optional, optional2, atLeastOne, atLeastOne2, mixed, roTuple, pairs);
console.log(a1, b1, range, matrix, first, second, head, tail, len);
