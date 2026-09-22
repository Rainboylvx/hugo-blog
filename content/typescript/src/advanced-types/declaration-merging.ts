// 声明合并：同名声明的合并规则

// 1. interface 合并：成员累加
interface Box {
  width: number;
}
interface Box {
  height: number;
}
// Box 现在同时有 width 和 height
const box: Box = { width: 1, height: 2 };

// 同名同类型的成员可以重复
interface Dup {
  a: string;
}
interface Dup {
  a: string;      // 类型相同，允许
}
// interface Dup { a: number }   // 类型不同会报错

// 2. 方法重载顺序：后声明的优先
interface Calc {
  add(x: string): string;
}
interface Calc {
  add(x: number): number;
}
// 用真实实现代替 declare，避免运行时未定义
const calc = {
  add(x: string | number) { return x; },
} as Calc;
const added = calc.add(1);      // number（后声明的签名优先）

// 3. namespace 合并
namespace Util {
  export const a = 1;
}
namespace Util {
  export const b = 2;
}
// Util 同时有 a 和 b

// 4. namespace 与 class/function/enum 合并
class Widget {
  render() { return "w"; }
}
namespace Widget {
  export const version = "1.0";
}
// Widget 既是类，也带静态成员 version
const w = new Widget();
const ver = Widget.version;

// 5. function 与 namespace 合并
function greet() { return "hi"; }
namespace greet {
  export const times = 1;
}
greet();
const t = greet.times;

// 6. enum 与 namespace 合并：给枚举加方法
enum Color {
  Red,
  Green,
}
namespace Color {
  export function name(c: Color): string {
    return c === Color.Red ? "red" : "green";
  }
}
const colorName = Color.name(Color.Red);

// 7/8/9. declare global、declare module、模块扩充
// 分别写在同目录的 global-extend.ts 与 ambient.d.ts 里，这里演示消费：
import { base } from "./helper";
const fromHelper: string = base();

// 声明合并后，全局多了 __app（见 global-extend.ts）
// 这里只做类型层面的验证，不实际赋值
type Version = typeof __app.__APP_VERSION__;   // string

// 10. 类型别名不能合并
type T1 = { a: 1 };
// type T1 = { b: 2 };   // 报错：Duplicate identifier 'T1'

// 用 interface 合并替代
interface Merged {
  a: 1;
}
interface Merged {
  b: 2;
}

const merged: Merged = { a: 1, b: 2 };

const versionType: Version = "1.0.0";
console.log(box, added, Util.a, Util.b, w.render(), ver, greet(), t, colorName, merged, fromHelper, versionType);
