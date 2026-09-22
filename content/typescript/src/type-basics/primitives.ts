// 原始类型：注解与推断的对照
const s = "hello";              // string
const n = 42;                   // number
const b = true;                 // boolean
const big = 9007199254740993n;  // bigint
const sym = Symbol("id");       // symbol
const u = undefined;            // undefined
const nul = null;               // null

// 显式注解
const s2: string = "hello";
const n2: number = 42;

// 数字分隔符，只是书写形式，值相同
const million: number = 1_000_000;

// NaN 和 Infinity 都属于 number
const notANumber: number = NaN;
const infinity: number = Infinity;

console.log(s, n, b, big, sym.toString(), u, nul);
console.log(s2, n2, million, notANumber, infinity);
