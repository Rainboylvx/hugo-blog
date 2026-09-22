// 数组
const nums: number[] = [1, 2, 3];
const nums2: Array<number> = [4, 5];       // 等价写法
const mixed: (string | number)[] = [1, "a"];

// 元组：定长、位置类型固定
const pair: [string, number] = ["age", 18];

// 元组可选元素
const optional: [string, number?][] = [["a"], ["b", 1]];

// 元组剩余元素
const atLeastOne: [string, ...string[]] = ["a", "b", "c"];

// 只读数组与元组
const ro: readonly number[] = [1, 2, 3];
const roTuple: readonly [string, number] = ["a", 1];

// 只读数组不可变
// @ts-expect-error 只读数组没有 push
ro.push(4);

console.log(nums, nums2, mixed, pair, optional, atLeastOne);
console.log(ro, roTuple);
