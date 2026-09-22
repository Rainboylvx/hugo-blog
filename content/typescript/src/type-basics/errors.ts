// 常见错误的正确写法：用 @ts-expect-error 锚定
// 每行的错误消息都经 tsc 实测

interface Point { x: number; y: number }

// TS2353: 对象字面量的多余属性检查
// @ts-expect-error z 不在 Point 里
const p1: Point = { x: 1, y: 2, z: 3 };

// TS2741: 缺少必需属性
// @ts-expect-error 缺少 y
const p2: Point = { x: 1 };

// TS2322: 属性类型不匹配
// @ts-expect-error y 应为 number
const p3: Point = { x: 1, y: "2" };

interface WithId { readonly id: string }
const w: WithId = { id: "a" };
// TS2540: 只读属性不可赋值
// @ts-expect-error id 是只读的
w.id = "b";

// TS2339: 访问不存在的属性
// @ts-expect-error WithId 上没有 nickname
console.log(w.nickname);

// TS2493: 元组越界
const t: [string, number] = ["a", 1];
// @ts-expect-error 长度 2 的元组没有下标 2
console.log(t[2]);

// TS2345: 数组元素类型不匹配
const arr: number[] = [1, 2];
// @ts-expect-error 只能 push number
arr.push("3");

console.log(p1, p2, p3, t, arr);
