// 什么时候必须写注解

// 1. 函数参数：必须注解（无初始化表达式可推断）
function add(a: number, b: number): number { return a + b; }

// 2. 声明后延迟赋值：必须注解
let pending: string;
pending = "later";

// 3. 空数组/空对象：建议注解
// 空数组推断为 evolving any[]（TS7034），push 后收窄，但没 push 就是 any[]
const arrNoAnn = [];
arrNoAnn.push(1);
const narrowed: number[] = arrNoAnn;      // 收窄为 number[]

// 不注解且没用到时，类型是 any[]，会带出 TS7034
const emptyArr: number[] = [];            // 显式注解更清楚
const emptyObj: Record<string, number> = {};

// 4. 需要收窄联合类型时：必须注解
let id: string | number = "a";
id = 1;

// 5. 函数返回类型：可选，但公开 API 建议写
export function parse(text: string): number { return Number(text); }

// 6. 推断失败时：必须注解
function make(): string { return "x"; }
const made: string = make();

// ---- 以下情况注解是噪音 ----

// 有初始化表达式且类型显而易见
const n = 1;              // 不需要 : number
const s = "a";            // 不需要 : string
const arr = [1, 2, 3];    // 不需要 : number[]
const obj = { a: 1 };     // 不需要 : { a: number }

// 回调参数能从上下文推断
[1, 2, 3].map((x) => x * 2);      // x 自动推断为 number
const nums: number[] = [1];
nums.filter((x) => x > 0);        // x 自动推断为 number

// 类的字段有初始化
class C {
  count = 0;              // 不需要 : number
}

console.log(add(1, 2), pending, emptyArr, emptyObj, id, parse("3"), made, n, s, arr, obj, new C().count);
console.log(narrowed, arrNoAnn);
