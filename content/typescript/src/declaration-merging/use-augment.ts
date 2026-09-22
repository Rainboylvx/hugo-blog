// 使用声明合并提供的类型
//
// 关键：declare global 只提供**类型**，运行时实现要自己补。
// 所以补实现的代码必须在**使用之前**执行。

// ---- 1. 先补运行时实现 ----
Array.prototype.first = function <T>(this: T[]): T | undefined {
  return this[0];
};
String.prototype.isBlank = function (this: string): boolean {
  return this.trim().length === 0;
};

// ---- 2. 再使用（类型来自 global-extend.ts / use-augment.d.ts）----
const arr: number[] = [1, 2];
const f: number | undefined = arr.first();

const s: string = "x";
const blank: boolean = s.isBlank();

// ---- 3. 模块声明（来自 ambient.d.ts）只做类型验证 ----
// 运行时 legacy-lib 不存在，所以只取类型不调用
import type { doSomething } from "legacy-lib";
const typeCheck: typeof doSomething = (input: string) => input.length;

console.log(arr.first(), "  ".isBlank(), "x".isBlank(), f, blank, typeCheck("abc"));
