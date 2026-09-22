// 泛型函数：类型作为参数
function identity<T>(value: T): T {
  return value;
}

// 显式指定
const a = identity<string>("hello");   // string

// 自动推断
const b = identity(42);                // number

// 多个类型参数
function pair<K, V>(k: K, v: V): [K, V] {
  return [k, v];
}

// 泛型约束：T 必须有 length
function logLength<T extends { length: number }>(x: T): number {
  return x.length;
}

// keyof 约束：K 必须是 T 的键
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 默认类型参数
interface Box<T = string> {
  value: T;
}

const box1: Box = { value: "a" };        // T 默认 string
const box2: Box<number> = { value: 1 };

// 泛型类
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  get size(): number { return this.items.length; }
}

const s = new Stack<number>();
s.push(1);
s.push(2);

console.log(a, b, pair("k", 1), logLength("abc"), logLength([1, 2]));
console.log(get({ x: 1, y: "a" }, "y"), box1.value, box2.value, s.size, s.pop());
