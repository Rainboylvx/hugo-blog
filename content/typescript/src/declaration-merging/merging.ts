// 声明合并的完整规则

// ---- 1. interface 合并：成员累加 ----
interface Box { width: number }
interface Box { height: number }
const box: Box = { width: 1, height: 2 };

// 同名同类型成员可以重复
interface Dup { a: string }
interface Dup { a: string }   // ✓ 类型相同，允许

// 同名不同类型会报错
interface Conflict { b: number }
// @ts-expect-error TS2717: 后续属性声明必须类型相同
interface Conflict { b: string }

// ---- 2. 方法重载：后声明的优先 ----
interface Calc { add(x: string): string }
interface Calc { add(x: number): number }

const calc = { add: (x: string | number) => x } as Calc;
const added = calc.add(1);    // number（后声明的签名优先）

// ---- 3. namespace 合并 ----
namespace Util { export const a = 1 }
namespace Util { export const b = 2 }
// Util 同时有 a 和 b

// ---- 4. namespace 与 class 合并 ----
class Widget { render() { return "w" } }
namespace Widget { export const version = "1.0" }
// Widget 既是类，也带静态成员 version
const w = new Widget();
const ver = Widget.version;

// ---- 5. namespace 与 function 合并 ----
function greet() { return "hi" }
namespace greet { export const times = 1 }
greet();
const t = greet.times;

// ---- 6. namespace 与 enum 合并：给枚举加方法 ----
enum Color { Red, Green }
namespace Color {
  export function name(c: Color): string {
    return c === Color.Red ? "red" : "green";
  }
}
const colorName = Color.name(Color.Red);

// ---- 7. type 不能合并 ----
// 重复的 type 声明会报 TS2300，且错误同时报在**两处**声明上：
//   error TS2300: Duplicate identifier 'T1'.   （两行都报）
// 所以这里用注释演示，不写进代码：
//   type T1 = { a: 1 };
//   type T1 = { b: 2 };    // ← 两行都报 TS2300
type T1 = { a: 1 };        // 只保留一份

// 用 interface 替代
interface Merged { a: 1 }
interface Merged { b: 2 }
const merged: Merged = { a: 1, b: 2 };

// ---- 8. 合并的陷阱：顺序影响重载 ----
interface Order1 { f(x: string): "s" }
interface Order1 { f(x: number): "n" }
// 后声明的（number 版本）优先

// ---- 9. 重复的 const/let 声明不允许 ----
// 重复声明 const 会报 TS2451，错误报在声明处：
//   const dupConst = 1;
//   const dupConst = 2;    // ← error TS2451: Cannot redeclare block-scoped variable
const dupConst = 1;
// 重复声明 const 会报 TS2451，同样报在声明处：
//   const dupConst = 1;
//   const dupConst = 2;    // ← error TS2451: Cannot redeclare block-scoped variable
void dupConst;

// 但 var 可以重复声明
var dupVar = 1;
var dupVar = 2;

console.log(box, added, Util.a, Util.b, w.render(), ver, greet(), t, colorName, merged);
const dupValue: Dup = { a: "x" };
console.log(dupValue, dupVar);
const conflict = { b: 1 } as unknown as Conflict;
console.log(conflict);
const t1: T1 = { a: 1 };
// 重载接口的实现需要用 any 或断言（因为返回类型依赖入参）
const order = {
  f: (x: string | number) => (typeof x === "string" ? "s" : "n"),
} as Order1;
console.log(t1, order.f("a"), order.f(1));
