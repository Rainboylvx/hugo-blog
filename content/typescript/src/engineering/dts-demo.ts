// .d.ts 与 declare：只提供类型，不提供运行时实现
//
// 这个文件演示的是"类型层面成立、运行时不存在"的情况，
// 所以它不能直接运行（会报 Cannot find module 'virtual-lib'）。
// 它的作用是让 tsc --noEmit 验证 ambient.d.ts 里的声明是有效的。

// 1. 全局常量（运行时由构建工具注入，如 vite 的 define）
const v: string = __APP_VERSION__;

// 2. 全局函数（运行时由某个 script 标签提供）
const n: number = parseAmount("1,234");

// 3. 声明过的模块（运行时需要真实存在这个包）
import { helper } from "virtual-lib";

// 4. 通配模块：import "./style.css" 能通过类型检查
import classes from "./style.css";

// 5. 全局接口扩展：给 Array 加方法
const arr: number[] = [1, 2, 3];
const last: number | undefined = arr.last();

// 关键：以上全部只保证类型正确。
// 如果运行时的对应实现不存在，代码会在运行时报错。
// 这正是"类型擦除"的直接后果 —— 见 type-erasure.md

export const demo = { v, n, helper, classes, last };
