// 函数重载：多个调用签名 + 一个实现签名

// 重载签名（对调用方可见）
function format(value: string): string;
function format(value: number): string;
function format(value: Date): string;
// 实现签名（对调用方不可见，必须兼容所有重载）
function format(value: string | number | Date): string {
  if (typeof value === "string") return value.toUpperCase();
  if (typeof value === "number") return value.toFixed(2);
  return value.toISOString();
}

// 重载顺序很重要：先匹配到的优先
function pick(x: string): "string";
function pick(x: number): "number";
function pick(x: string | number): "string" | "number" {
  return typeof x === "string" ? "string" : "number";
}

// 顺序反了会导致宽签名先匹配，窄签名永远用不上
function badPick(x: string | number): "wide";
function badPick(x: string): "narrow";
function badPick(x: string | number): "wide" | "narrow" {
  return typeof x === "string" ? "narrow" : "wide";
}
const badResult = badPick("a");   // 推断为 "wide"，不是 "narrow"

// 对象方法的重载
interface Parser {
  parse(text: string): number;
  parse(text: number): string;
}

const parser: Parser = {
  parse(text: string | number): any {
    return typeof text === "string" ? Number(text) : String(text);
  },
};

// 用箭头函数实现重载：需要用类型断言或接口
type Overloaded = {
  (x: string): string;
  (x: number): number;
};
const impl: Overloaded = ((x: string | number) => x) as Overloaded;

// 重载 vs 联合类型：什么时候用重载
// 用重载：返回值类型依赖入参类型
function firstOrNull(arr: []): null;
function firstOrNull<T>(arr: T[]): T;
function firstOrNull<T>(arr: T[]): T | null {
  return arr.length ? arr[0]! : null;
}
const r1 = firstOrNull([]);          // null
const r2 = firstOrNull([1, 2]);      // number

// 用联合更简单：返回值不依赖入参
function simple(x: string | number): string {
  return String(x);
}

console.log(format("a"), format(1), format(new Date("2020-01-01")));
console.log(pick("a"), pick(1), badResult);
console.log(parser.parse("1"), parser.parse(1), impl("a"), impl(1));
console.log(r1, r2, simple("x"));
