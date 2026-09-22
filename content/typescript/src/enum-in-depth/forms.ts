// enum 的三种形态

// 1. 数字枚举：默认从 0 递增
enum Status {
  Idle,      // 0
  Loading,   // 1
  Done,      // 2
}

// 手动指定起始值
enum Code {
  Ok = 200,
  NotFound = 404,
  Error = 500,
}

// 中间指定：后面的跟着递增
enum Mixed {
  A,          // 0
  B = 10,     // 10
  C,          // 11
  D,          // 12
}

// 2. 字符串枚举：必须每个都赋值
enum Direction {
  Up = "UP",
  Down = "DOWN",
}

// 3. 异构枚举：数字和字符串混合（不推荐）
enum Mixed2 {
  No = 0,
  Yes = "YES",
}

// const enum：编译时内联，不生成运行时对象
const enum Fast {
  A = 1,
  B = 2,
}

// 反向映射：只有数字枚举有
const a = Status.Idle;      // 0
const b = Status[0];        // "Idle"  ← 反向映射
// 字符串枚举没有反向映射
// const c = Direction["UP"];   // 报错

// const enum 的用法：值被内联
const fastValue = Fast.A;   // 编译后直接是 1

// 枚举成员作为类型
type S = Status.Done;       // 类型是 Status.Done（字面量枚举成员）
const s: S = Status.Done;
// @ts-expect-error TS2322: 不能赋其他成员
const s2: S = Status.Idle;

// 枚举作为联合使用
function handle(status: Status): string {
  switch (status) {
    case Status.Idle: return "idle";
    case Status.Loading: return "loading";
    case Status.Done: return "done";
  }
}

// 数字枚举的类型安全性较弱：
// - 任意 number 变量可以赋给它（这是主要问题）
// - 但不是任意数字字面量
const anyNumber: number = 1;
const fromNumber: Status = anyNumber;      // 允许，失去检查
// @ts-expect-error TS2322: 999 不是 Status 的成员
const fromLiteral: Status = 999;

// 枚举可以赋给 number
const asNumber: number = Status.Idle;

console.log(a, b, Direction.Up, Mixed2.Yes, fastValue, s, handle(Status.Done));
console.log(Code.Ok, Mixed.C, fromNumber, asNumber, fromLiteral);
