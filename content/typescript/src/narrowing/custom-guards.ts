// 自定义类型谓词：value is T
interface Cat { meow: () => void }
interface Dog { bark: () => void }

function isCat(a: Cat | Dog): a is Cat {
  return "meow" in a;
}

function speak(a: Cat | Dog): string {
  if (isCat(a)) {
    a.meow();        // 收窄为 Cat
    return "meow";
  }
  a.bark();          // 收窄为 Dog
  return "bark";
}

// 断言函数：asserts value is T
function assertIsString(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new Error("not a string");
}

function upper(v: unknown): string {
  assertIsString(v);
  return v.toUpperCase();   // 断言后收窄为 string
}

// 断言函数（无类型）：asserts condition
function assert(cond: unknown, msg = "assertion failed"): asserts cond {
  if (!cond) throw new Error(msg);
}

// 数组过滤时用类型谓词，让返回类型收窄
const items: (string | null)[] = ["a", null, "b"];
const nonNull = items.filter((x): x is string => x !== null);
// 不用类型谓词的话，nonNull 会是 (string | null)[]

console.log(speak({ meow: () => {} }), speak({ bark: () => {} }));
console.log(upper("abc"), nonNull);
try { assert(1 + 1 === 3, "nope"); } catch (e) { console.log((e as Error).message); }
