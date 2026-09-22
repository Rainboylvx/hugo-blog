// 收窄的边界：哪些情况下 TypeScript 收窄不了

interface A { a: number }
interface B { b: number }

// 1. 联合类型上不能直接访问非公共成员
function f(x: A | B) {
  // @ts-expect-error TS2339: 'a' 不在 A | B 的公共成员里
  return x.a;
}

// 收窄之后才可以
function g(x: A | B) {
  if ("a" in x) return x.a;   // 收窄为 A
  return x.b;                 // 收窄为 B
}

// 2. 赋值会让已收窄的属性失效
function h(o: { v: string | null }): number {
  if (o.v !== null) {
    o.v = null;               // 赋值后收窄被重置
    // @ts-expect-error TS18047: 'o.v' is possibly 'null'
    return o.v.length;
  }
  return 0;
}

// 解法：先取出到局部变量
function h2(o: { v: string | null }) {
  const v = o.v;
  if (v !== null) {
    return v.length;          // v 是 const，收窄稳定
  }
  return 0;
}

// 3. 类型断言绕过检查，但不做运行时验证
function assert(x: A | B) {
  return (x as A).a;          // 编译通过，运行时可能是 undefined
}

// 4. in 对可选属性的窄化：单独用 in 不去掉 undefined
type OptionalFish = { swim?: () => void };
type Bird = { fly: () => void };

function optionalIn(animal: OptionalFish | Bird) {
  if ("swim" in animal) {
    // @ts-expect-error TS2322: swim 仍可能是 undefined
    const probe: () => void = animal.swim;
    return probe;
  }
  // @ts-expect-error TS2339: 负分支不能排除 OptionalFish
  return animal.fly;
}

// 真值检查排除了 undefined
function optionalInFixed(animal: OptionalFish | Bird) {
  if ("swim" in animal && animal.swim) {
    animal.swim();
    return "swim";
  }
  return "unknown";
}

// 属性必需时，负分支可以正确排除
type RequiredFish = { swim: () => void };

function requiredIn(animal: RequiredFish | Bird) {
  if ("swim" in animal) return "swim";
  animal.fly();               // 收窄为 Bird
  return "fly";
}

// 5. 索引访问：默认不检查越界，开启 noUncheckedIndexedAccess 后会
const arr: string[] = ["a"];
const first = arr[0];         // 默认推断为 string
const second = arr[1];        // 同样推断为 string —— 但运行时是 undefined

// h 演示的是编译期不报错的路径，运行时确实会抛错
try {
  h({ v: "x" });
} catch (e) {
  console.log("h 抛错:", (e as Error).message);
}

console.log(f({ a: 1 }), g({ b: 2 }), h2({ v: "x" }));
console.log(assert({ a: 3 }), first, second);
console.log(optionalInFixed({ swim: () => {} }), requiredIn({ fly: () => {} }));
