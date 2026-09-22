// 这些语法 Node 原生 type stripping 无法执行，
// 每个都会报 ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX。
//
// 用注释形式列出，避免这个文件本身跑不起来。

// 1. enum（非 const）
//    enum E { A, B }
//    error: TypeScript enum is not supported in strip-only mode

// 2. const enum
//    const enum E { A = 1 }

// 3. namespace（带成员）
//    namespace N { export const a = 1 }

// 4. 构造函数参数属性
//    class C { constructor(public x: number) {} }

// 5. 装饰器（连解析都失败）
//    class C { @d m() {} }
//    error: SyntaxError: Invalid or unexpected token

// 6. import x = require("...")
//    import fs = require("fs")

// 可擦除的（Node 原生能跑）：
// - 类型注解、interface、type
// - 泛型参数与泛型调用
// - 类型断言 as
// - implements / declare
// - import type / export type
// - 可选参数、readonly、可见性修饰符（不带参数属性）

// 这个文件本身是可擦除的，能跑
const note = "见文件注释里的不可擦除语法列表";
console.log(note);
