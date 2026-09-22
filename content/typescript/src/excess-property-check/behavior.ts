// 多余属性检查：对象字面量的特殊规则

interface Point { x: number; y: number }

// ---- 直接赋字面量：检查多余属性 ----
// @ts-expect-error TS2353: Object literal may only specify known properties
const p1: Point = { x: 1, y: 2, z: 3 };

// ---- 先存变量再赋值：不检查 ----
const raw = { x: 1, y: 2, z: 3 };
const p2: Point = raw;        // ✓ 通过！z 被忽略

// 为什么？因为 raw 的类型是 { x: number; y: number; z: number }，
// 它结构上满足 Point（多出的属性不影响赋值兼容性）

// ---- 函数参数：同样规则 ----
function draw(p: Point): string { return `${p.x},${p.y}`; }

draw({ x: 1, y: 2 });         // ✓
// @ts-expect-error TS2353: 字面量直接传，会检查
draw({ x: 1, y: 2, z: 3 });

const withZ = { x: 1, y: 2, z: 3 };
draw(withZ);                  // ✓ 通过变量传，不检查

// ---- 中间变量类型注解能"洗掉"多余属性 ----
const typed: Point = { x: 1, y: 2 };
draw(typed);                  // ✓

// ---- 索引签名会关闭多余属性检查 ----
interface WithIndex {
  x: number;
  [key: string]: unknown;
}
const p3: WithIndex = { x: 1, anything: "ok" };   // ✓ 索引签名允许

// ---- 联合类型的多余属性检查 ----
type A = { kind: "a"; a: number };
type B = { kind: "b"; b: number };

// @ts-expect-error TS2353: kind 匹配 A，但 a/b 混了
const mixed: A | B = { kind: "a", b: 1 };

// 正确写法
const okA: A = { kind: "a", a: 1 };
const okB: B = { kind: "b", b: 1 };

// ---- 空对象类型 {} 不检查 ----
const anyObj: {} = { anything: 1, more: "x" };    // ✓ 因为 {} 没有已知属性

// ---- 数组与元组 ----
interface Item { id: number }
// @ts-expect-error TS2353: 数组元素是字面量，会检查
const items: Item[] = [{ id: 1, extra: true }];
const itemsRaw = [{ id: 1, extra: true }];
const items2: Item[] = itemsRaw;    // ✓ 通过变量

console.log(p1, p2, draw(withZ), typed, p3, okA, okB, anyObj, items, items2, mixed);
