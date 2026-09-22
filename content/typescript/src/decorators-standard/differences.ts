// legacy 与标准装饰器的语义差异（同一场景两种写法）

// ============ 差异 1：装饰器函数签名 ============
// legacy: (target, propertyKey, descriptor)
// 标准:   (value, context)
// context 里有 name / kind / static / private / metadata / addInitializer

// ============ 差异 2：this 的处理 ============
// 标准装饰器里 this 是 unknown，必须显式声明

// ============ 差异 3：字段装饰器返回值含义 ============
// legacy 字段装饰器无返回值（不能改初始值）
// 标准字段装饰器返回一个初始化函数，可以改初始值
function legacyStyle(target: object, key: string): void {
  void target; void key;
}
function standardStyle(_v: undefined, ctx: ClassFieldDecoratorContext) {
  return function (initial: string) {
    return `${initial}!`;   // 可以改初始值
  };
}

// ============ 差异 4：addInitializer 的执行时机（关键差异）============
// 实测结论：
//   - 类装饰器里的 addInitializer：在【类定义时】执行一次，this 是类本身
//   - 字段/方法装饰器里的 addInitializer：在【每个实例构造时】执行，this 是实例
function withInit<T extends new (...args: any[]) => object>(
  value: T,
  ctx: ClassDecoratorContext,
): T {
  ctx.addInitializer(function (this: unknown) {
    // 注意：这里 this 是类，不是实例！所以下面这样写没用
    console.log(`[class initializer] ${String(ctx.name)}, this === 类: ${this === value}`);
  });
  return value;
}

// 要给每个实例加属性，得用字段装饰器的 addInitializer
function perInstance(_v: undefined, ctx: ClassFieldDecoratorContext) {
  ctx.addInitializer(function (this: unknown) {
    (this as { ready?: boolean }).ready = true;   // 这里 this 才是实例
  });
}

// legacy 要这样写（对比）：
function legacyWithInit<T extends new (...args: any[]) => object>(ctor: T): T {
  const orig = ctor;
  return class extends orig {
    constructor(...args: any[]) {
      super(...args);
      (this as { ready?: boolean }).ready = true;
    }
  };
}

// ============ 差异 5：元数据 ============
// legacy + emitDecoratorMetadata 可拿到类型（依赖 reflect-metadata）
// 标准装饰器没有元数据机制，要自己实现

@withInit
class App {
  @standardStyle
  name = "app";

  @perInstance
  ready = false;
}

const a = new App();
console.log(a.name, (a as { ready?: boolean }).ready);

// ============ 差异 6：tsconfig ============
// legacy: "experimentalDecorators": true（可加 emitDecoratorMetadata）
// 标准:   什么都不用配；两者不能同时用于同一个类
console.log("legacyStyle/legacyWithInit 仅作对比，未使用:", typeof legacyStyle, typeof legacyWithInit);
