// 标准装饰器（TC39 stage-3，TS 5.0+）
// 不需要 experimentalDecorators

// 方法装饰器：(value, context)
function logged<T extends (...args: any[]) => any>(
  fn: T,
  ctx: ClassMethodDecoratorContext,
): T {
  return function (this: unknown, ...args: unknown[]) {
    console.log(`call ${String(ctx.name)}`);
    return fn.apply(this, args);
  } as T;
}

// 装饰器工厂
function withRetry(times: number) {
  return function <T extends (...args: any[]) => any>(
    fn: T,
    ctx: ClassMethodDecoratorContext,
  ): T {
    return function (this: unknown, ...args: unknown[]) {
      let last: unknown;
      for (let i = 0; i < times; i++) {
        try {
          return fn.apply(this, args);
        } catch (e) {
          last = e;
        }
      }
      throw last;
    } as T;
  };
}

class Calc {
  @logged
  add(a: number, b: number): number {
    return a + b;
  }

  @withRetry(3)
  flaky(failTimes: number): string {
    // 用一个计数器模拟不稳定
    if (this.attempts++ < failTimes) throw new Error("fail");
    return "ok";
  }

  attempts = 0;
}

const c = new Calc();
console.log(c.add(1, 2));
console.log(c.flaky(2));
console.log("context 提供的字段:", Calc.name);
