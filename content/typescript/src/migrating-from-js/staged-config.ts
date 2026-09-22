// 从 JS 迁移的分阶段配置（这里用注释演示，实际写在 tsconfig.json 里）
//
// 阶段 0：先让项目跑起来
// {
//   "compilerOptions": {
//     "allowJs": true,
//     "checkJs": false,
//     "noEmit": true,
//     "strict": false
//   }
// }
//
// 阶段 1：逐文件改后缀（.js → .ts），一次一个
//
// 阶段 2：收紧配置（按模块逐步开，不要全局一次开）
// {
//   "compilerOptions": {
//     "strict": true,
//     "noImplicitAny": true,
//     "strictNullChecks": true
//   }
// }
//
// 阶段 3：治理 any

// ---- 这个文件演示迁移中的常见模式 ----

// ---- 模式 1：any → unknown，强制调用方收窄 ----
// 改前：function parse(json: string): any { return JSON.parse(json) }
function parse(json: string): unknown {
  return JSON.parse(json);
}

// 调用方必须收窄
function parseUser(json: string): { name: string } {
  const raw = parse(json);
  if (typeof raw === "object" && raw !== null && "name" in raw) {
    const name = (raw as { name: unknown }).name;
    if (typeof name === "string") return { name };
  }
  throw new Error("invalid user");
}

// ---- 模式 2：边界处做运行时校验 ----
function readEnv(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === "string" ? v : undefined;
}

// ---- 模式 3：用类型谓词收窄外部数据 ----
interface ApiResponse { id: number; name: string }

function isApiResponse(v: unknown): v is ApiResponse {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as ApiResponse).id === "number" &&
    typeof (v as ApiResponse).name === "string"
  );
}

// ---- 模式 4：逐步替换 any 为具体类型 ----
// 改前：function process(data: any) { return data.items.map((x: any) => x.id) }
interface Data { items: { id: number }[] }
// 注意：不要用 process 当函数名，它会遮蔽 Node 的全局 process
function extractIds(data: Data): number[] {
  return data.items.map((x) => x.id);
}

// ---- 模式 5：CommonJS → ESM ----
// 改前（老 JS 代码）
//   const fs = require("fs");
//   module.exports = { run };
// 改后
import fs from "node:fs";
export function run(): string {
  return fs.existsSync(".") ? "ok" : "no";
}

// ---- 模式 6：类字段初始化的语义差异 ----
// useDefineForClassFields 默认为 true（target es2022+）时，
// 子类字段会覆盖父类访问器（报 TS2610）
class Base {
  set value(v: number) { void v; }
}
class Derived extends Base {
  // 如果依赖老行为（走 setter），需要声明成访问器或设 useDefineForClassFields: false
  private _value = 0;
  override set value(v: number) { this._value = v; }
  get value(): number { return this._value; }
}

const d = new Derived();
d.value = 1;

console.log(parseUser('{"name":"a"}'), readEnv("PATH") !== undefined, isApiResponse({ id: 1, name: "a" }));
console.log(extractIds({ items: [{ id: 1 }, { id: 2 }] }), run(), d.value);
