// 真值收窄：过滤 null / undefined / 空字符串 / 0
function greet(name: string | null | undefined): string {
  if (!name) return "anonymous";
  return name.toUpperCase();   // 这里是 string
}

// 可选链与空值合并
type Config = { debug?: boolean; level?: number };
const c: Config = {};
const debug = c.debug ?? false;     // ?? 只在 null/undefined 时取默认值
const level = c.level ?? 1;

// 注意 ?? 与 || 的区别：0 和 "" 是 falsy 但不是 nullish
const zero = 0;
console.log(zero || 1, zero ?? 1);   // 1 0

// 明确排除 null
function assertDefined<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) throw new Error("not defined");
  return v;
}

console.log(greet("a"), greet(null), debug, level, assertDefined(1));
