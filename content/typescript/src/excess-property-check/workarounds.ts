// 绕过多余属性检查的四种方式

interface Point { x: number; y: number }

// ---- 方式 1：中间变量（最简单，但会丢失字面量检查）----
const raw = { x: 1, y: 2, z: 3 };
const p1: Point = raw;

// ---- 方式 2：类型断言（明确表达"我知道有额外属性"）----
const p2: Point = { x: 1, y: 2, z: 3 } as Point;

// 更精确的断言：保留额外属性的类型信息
const p3 = { x: 1, y: 2, z: 3 } as Point & { z: number };
const zValue = p3.z;           // z 可访问

// ---- 方式 3：索引签名（如果类型本来就允许额外键）----
interface PointWithExtra {
  x: number;
  y: number;
  [key: string]: unknown;
}
const p4: PointWithExtra = { x: 1, y: 2, z: 3 };   // ✓ 无需绕过

// ---- 方式 4：泛型函数（保留具体类型）----
// 常见的"接受更宽输入但返回精确类型"模式
function createPoint<T extends Point>(p: T): T {
  return p;
}
const p5 = createPoint({ x: 1, y: 2, z: 3 });   // T = { x: 1; y: 2; z: 3 }
const p5z = p5.z;                               // ✓ 保留 z

// 对比：不泛型时，返回值丢失额外属性
function createPointPlain(p: Point): Point { return p; }
const p6 = createPointPlain({ x: 1, y: 2, z: 3 } as Point);
// p6.z 报错：Point 上没有 z

// ---- 什么时候该"绕过" ----
// 场景：把更宽的对象传给只需要部分字段的函数
interface User { id: number; name: string; email: string }
function sendEmail(u: Pick<User, "name" | "email">): string {
  return `to ${u.name} <${u.email}>`;
}

const fullUser: User = { id: 1, name: "a", email: "b" };
sendEmail(fullUser);           // ✓ 变量传参，不检查多余属性

// 但直接传字面量会报错
// @ts-expect-error TS2353: id 是多余的
sendEmail({ id: 1, name: "a", email: "b" });

// 正确做法：传变量，或者显式构造需要的形状
sendEmail({ name: "a", email: "b" });

// ---- 一个实用的判断标准 ----
// 多余属性检查是"防止拼写错误"的保护机制
// 如果多余的属性是**有意**的（如展开对象），绕过是对的
// 如果是**拼写错误**，绕过会掩盖 bug

const base = { x: 1, y: 2 };
const withZ = { ...base, z: 3 };     // 展开后的对象
const p7: Point = withZ;             // ✓ 不检查，这是预期的

// @ts-expect-error TS2561: 拼写错误（x 写成了 X），应该被抓住
const typo: Point = { X: 1, y: 2 };

console.log(p1, p2, p3, zValue, p4, p5, p5z, p6, sendEmail(fullUser), p7, typo);
