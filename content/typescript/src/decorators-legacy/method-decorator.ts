// legacy 方法/属性/参数装饰器

// 方法装饰器：三个参数 (target, propertyKey, descriptor)
function log(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const original = descriptor.value as (...args: unknown[]) => unknown;
  descriptor.value = function (this: unknown, ...args: unknown[]) {
    console.log(`call ${propertyKey}(${args.join(",")})`);
    return original.apply(this, args);
  };
}

// 属性装饰器：只有 (target, propertyKey)，没有 descriptor
function readonly(target: object, propertyKey: string): void {
  Object.defineProperty(target, propertyKey, { writable: false });
}

// 参数装饰器：(target, propertyKey, parameterIndex)
function inject(
  target: object,
  propertyKey: string | undefined,
  parameterIndex: number,
): void {
  console.log(`inject into ${String(propertyKey)}[${parameterIndex}]`);
}

class Calculator {
  @readonly
  version = "1.0";

  @log
  add(a: number, b: number): number {
    return a + b;
  }

  @log
  greet(@inject name: string): string {
    return `hi ${name}`;
  }
}

const c = new Calculator();
console.log(c.add(1, 2));
console.log(c.greet("rainboy"));
console.log(c.version);

// 验证 readonly：属性装饰器用 defineProperty 让字段不可写
// 注意：严格模式下赋值会抛错，非严格模式静默失败
try {
  (c as unknown as { version: string }).version = "2.0";
  console.log("赋值后:", c.version);
} catch (e) {
  console.log("赋值被拦截:", (e as Error).message);
}
