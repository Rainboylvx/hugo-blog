// 类既是值又是类型

class C {
  a = "123";                    // 实例属性
  static version = "1.0";       // 静态属性

  constructor(public n: number) {}

  method(): string { return this.a; }
  static create(): C { return new C(0); }
}

// ---- 值位置：C 是构造函数 ----
const ctor = C;                  // ✓ C 是值
console.log(typeof C);           // "function"
const instance = new C(1);

// ---- 类型位置：C 是实例类型 ----
let c: C = new C(2);             // ✓ C 也是类型
// 注意：作为类型时，C 表示"实例的类型"，不含静态成员

// ---- 关键区别：C 与 typeof C ----
// C（类型位置）= 实例类型：有 a, n, method
// typeof C      = 构造函数类型：有 version, create, prototype

// 实例类型：能访问实例成员
const inst: C = new C(3);
console.log(inst.a, inst.n, inst.method());

// 构造函数类型：能访问静态成员
const ctorTyped: typeof C = C;
console.log(ctorTyped.version, ctorTyped.create().n);

// ---- 常见错误：把类当实例用 ----
// 原归档笔记里的经典问题：
class D { a = "123" }
const d: D = new D();
console.log(d);        // D { a: '123' }
console.log(D);        // [class D]
// @ts-expect-error TS2339: a 是实例属性，不在类（构造函数）上
console.log(D.a);

// ---- 用 typeof C 表达"传入一个类" ----
function instantiate<T>(Ctor: new (...args: any[]) => T): T {
  return new Ctor();
}
const made = instantiate(C);   // T 推断为 C

// 更精确的构造函数类型
type Ctor<T> = new (...args: any[]) => T;
function make<T>(ctor: Ctor<T>): T { return new ctor(); }

// 静态侧 + 实例侧一起约束
interface WithCreate<T> {
  create(): T;
}
function fromStatic<T, S extends WithCreate<T>>(Static: S): T {
  return Static.create();
}
const fromStaticResult = fromStatic(C);

// ---- 抽象类的类型 ----
abstract class Base {
  abstract run(): string;
  static helper() { return "h"; }
}
// typeof Base 包含静态成员
const baseStatic: typeof Base = Base;
console.log(baseStatic.helper());
// @ts-expect-error TS2511: 抽象类不能实例化
new Base();

// ---- 接口实现类时的类型关系 ----
interface HasA { a: string }
// 实例类型满足接口
const asInterface: HasA = new C(4);
// 但 typeof C 不满足（构造函数没有 a）
// @ts-expect-error TS2741: typeof C 缺少 a
const ctorAsInterface: HasA = C;

console.log(ctor, instance, c, ctorTyped, made, make(C), fromStaticResult, asInterface, ctorAsInterface);
