// 使用第三方类型：三种情况的处理

// ---- 情况一：库自带类型 ----
// 看 package.json 的 types / typings 字段
// 例如 zod、axios 都自带类型，直接 import 即可

// ---- 情况二：有 @types/xxx 包 ----
// npm i -D @types/node
// 然后就能用 Node 的全局类型
const timer: NodeJS.Timeout = setTimeout(() => {}, 0);
clearTimeout(timer);

// Node 的类型
const buf: Buffer = Buffer.from("hello");
const platform: NodeJS.Platform = process.platform;

// ---- 情况三：都没有，自己声明 ----
// 见同目录的 ambient.d.ts
// 注意：用 import type 只能拿类型，不能当值用
import type { doSomething } from "some-legacy-lib";
const typeOnly: typeof doSomething = (s: string) => s.length;

// ---- 用 import type 导入纯类型 ----
// verbatimModuleSyntax 下必须区分
import type { Helper } from "./helper";

const h: Helper = { run: () => "ok" };

// ---- 常见：给全局对象加类型 ----
// 见 global.d.ts

// ---- 检查类型是否安装成功 ----
// tsc --noEmit 会报 TS2688 如果找不到类型包
//   error TS2688: Cannot find type definition file for 'xxx'.

// ---- skipLibCheck 的影响 ----
// 开启后，.d.ts 文件里的类型错误不会被检查
// 好处：编译快、避免第三方类型冲突
// 代价：自己写的 .d.ts 里的错误也会被跳过

console.log(buf.toString(), platform, h.run(), typeOnly("abc"), typeof timer);
