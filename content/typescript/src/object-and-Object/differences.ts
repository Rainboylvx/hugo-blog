// object、Object、{} 的区别（三者都容易误用）

// ---- object（小写）：任何非原始类型 ----
let obj1: object = { a: 1 };       // ✓
obj1 = [1, 2];                     // ✓ 数组也是 object
obj1 = () => {};                   // ✓ 函数也是 object
// @ts-expect-error TS2322: 原始类型不行
obj1 = 42;
// @ts-expect-error TS2322: 字符串是原始类型
obj1 = "hello";
// @ts-expect-error TS2322: 布尔也是原始类型
obj1 = true;
obj1 = null as unknown as object;  // 需要断言才过

// 但 object 不描述结构，访问属性会报错
// 注意：这行是运行时真会崩的（obj1 此时是 null），所以只做类型验证，不执行
function accessOnObject(o: object) {
  // @ts-expect-error TS2339: Property 'a' does not exist on type 'object'.
  return o.a;
}
void accessOnObject;

// ---- Object（大写）：除 null/undefined 外的一切 ----
let obj2: Object = { a: 1 };       // ✓
obj2 = [1, 2];                     // ✓
obj2 = "hello";                    // ✓ 字符串也算！
obj2 = 42;                         // ✓ 数字也算！
obj2 = true;                       // ✓
// @ts-expect-error TS2322: null 不行
obj2 = null;

// 注意：Object 接受原始类型，这几乎从不是你想要的

// ---- {}（空对象字面量类型）：除 null/undefined 外的一切 ----
let obj3: {} = { a: 1 };           // ✓
obj3 = [1, 2];                     // ✓
obj3 = "hello";                    // ✓ 字符串也算！
obj3 = 42;                         // ✓
obj3 = true;                       // ✓
// @ts-expect-error TS2322: null 不行
obj3 = null;

// {} 与 Object 行为一致，但写法更容易误解为"空对象"

// ---- 对比：真正表达"任意对象"的写法 ----
// 用 Record<string, unknown> 或具体结构
let obj4: Record<string, unknown> = { a: 1 };
// @ts-expect-error TS2322: 数组不是 Record<string, unknown>
obj4 = [1, 2];

// 或者明确不关心结构时用 unknown
let obj5: unknown = { a: 1 };
obj5 = 42;                         // unknown 接受一切

// ---- 实践：函数参数该用哪个 ----
// 想要"任何对象但不要原始类型" → object
function keysOf(o: object): string[] {
  return Object.keys(o);
}
keysOf({ a: 1 });
keysOf([1, 2]);
// @ts-expect-error TS2345: 原始类型不能传给 object
keysOf("hello");

// 想接受任何值 → unknown（最安全）
function stringify(v: unknown): string {
  return JSON.stringify(v);
}

console.log(obj1, obj2, obj3, obj4, obj5, keysOf({ a: 1 }), stringify({ a: 1 }));
