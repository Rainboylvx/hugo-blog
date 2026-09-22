// 参数与返回值
function add(a: number, b: number): number {
  return a + b;
}

// 可选参数必须在末尾
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name;
}

// 默认参数会自动推断类型
function repeat(text: string, times = 2): string {
  return text.repeat(times);
}

// 剩余参数
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

// 解构参数需要整体注解
function dist({ x, y }: { x: number; y: number }): number {
  return Math.hypot(x, y);
}

// 函数类型
type Mapper<T> = (item: T) => string;
const stringify: Mapper<number> = (n) => String(n);

// 箭头函数返回对象字面量要加括号
const make = (n: number) => ({ value: n });

// void：不关心返回值
function log(msg: string): void {
  console.log(msg);
}

// never：永不返回
function fail(msg: string): never {
  throw new Error(msg);
}

console.log(add(1, 2), greet("a"), greet("a", "Dr."), repeat("x"), sum(1, 2, 3));
console.log(dist({ x: 3, y: 4 }), stringify(1), make(1), log("hi"));
try { fail("boom"); } catch (e) { console.log((e as Error).message); }
