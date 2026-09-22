// 为什么不推荐用 enum：四种替代方案

// ---- 问题 1：数字枚举失去类型检查 ----
enum Status {
  Idle,
  Loading,
}
const n: number = 1;
const s: Status = n;        // 允许！任意 number 都能赋给数字枚举

// ---- 问题 2：enum 是不可擦除语法，Node 原生跑不了 ----
// 见 non-erasable 说明：node 直接跑含 enum 的文件会报
// ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX

// ---- 问题 3：运行时产物有成本 ----
// 每个非 const enum 都生成一个 IIFE + 双向映射对象

// ============ 替代方案 1：字面量联合（最推荐）============
type Status2 = "idle" | "loading" | "done";
const s2: Status2 = "idle";
// @ts-expect-error TS2322: 不在联合里
const bad2: Status2 = "unknown";
// 优点：可擦除、可序列化、类型严格、没有运行时产物

// ============ 替代方案 2：as const 对象 ============
const STATUS = {
  Idle: "idle",
  Loading: "loading",
  Done: "done",
} as const;

type Status3 = (typeof STATUS)[keyof typeof STATUS];   // "idle" | "loading" | "done"
const s3: Status3 = STATUS.Idle;
// 优点：既有命名空间式的访问（STATUS.Idle），又有联合类型的严格性

// ============ 替代方案 3：declare 对象 + 同名类型 ============
const STATUS4 = {
  Idle: 0,
  Loading: 1,
} as const;

type Status4 = (typeof STATUS4)[keyof typeof STATUS4];   // 0 | 1
const s4: Status4 = STATUS4.Idle;
// @ts-expect-error TS2322: 2 不是 0 | 1
const bad4: Status4 = 2;

// ============ 替代方案 4：真的需要数字枚举时 ============
// 如果必须和数字打交道（如协议字段），用 as const + 显式联合
const CODES = [200, 404, 500] as const;
type Code = (typeof CODES)[number];    // 200 | 404 | 500
const c: Code = 200;
// @ts-expect-error TS2322: 201 不在联合里
const badC: Code = 201;

// ---- 什么时候 enum 仍然合理 ----
// 1. 已有大量代码在用（迁移成本 > 收益）
// 2. 需要反向映射（数字 → 名字），且确实用得到
// 3. 项目必须用 tsc 编译（不能改用 tsx/Node 原生）

function describe(s: Status2): string {
  switch (s) {
    case "idle": return "空闲";
    case "loading": return "加载中";
    case "done": return "完成";
  }
}

console.log(s, s2, s3, s4, c, describe("idle"), STATUS.Done, STATUS4.Loading, bad2, bad4, badC);
