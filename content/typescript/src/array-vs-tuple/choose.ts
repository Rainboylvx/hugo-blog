// 数组 vs 元组：怎么选

// 数组：长度不定，所有元素同类型
const ids: number[] = [1, 2, 3];

// 元组：定长，每个位置的类型固定
const point: [number, number] = [1, 2];
const entry: [string, number] = ["age", 18];

// 反例：用数组表达"位置有意义"的数据，会丢失约束
const badPoint: number[] = [1, 2];
badPoint.push(3);        // 允许，但 3 个坐标没有意义
badPoint[0] = 0;         // 允许

const goodPoint: [number, number] = [1, 2];
// 注意：定长元组仍然允许 push！length 类型只是"至少"信息
goodPoint.push(3);
// 只有 readonly 元组才真的阻止修改
const roPoint: readonly [number, number] = [1, 2];
// @ts-expect-error TS2339: readonly 元组没有 push
roPoint.push(3);

// 反例：用元组表达"同质列表"，超过 3 个元素就很难读
const badList: [string, string, string, string] = ["a", "b", "c", "d"];
// goodList 更合适
const goodList: string[] = ["a", "b", "c", "d"];

// 元组最适合的场景：函数返回多个值
function minMax(nums: number[]): [number, number] {
  return [Math.min(...nums), Math.max(...nums)];
}
const [min, max] = minMax([1, 2, 3]);

// 以及固定形状的键值对
const entries: [string, number][] = Object.entries({ a: 1, b: 2 });

// 元组超过 3 个元素时，对象更可读
type BadUser = [string, number, string, boolean];
type GoodUser = { name: string; age: number; city: string; active: boolean };

const badUser: BadUser = ["a", 1, "b", true];
const goodUser: GoodUser = { name: "a", age: 1, city: "b", active: true };
// goodUser.age 比 badUser[1] 可读得多

console.log(ids, point, entry, badPoint, goodPoint, roPoint, badList, goodList, min, max, entries, badUser, goodUser);
