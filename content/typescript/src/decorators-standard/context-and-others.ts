// 标准装饰器的 context 对象与各类装饰器

// 1. 类装饰器：(value, context: ClassDecoratorContext)
function tagged<T extends new (...args: any[]) => object>(
  value: T,
  ctx: ClassDecoratorContext,
): T {
  console.log(`class ${String(ctx.name)}, kind=${ctx.kind}`);
  ctx.addInitializer(function (this: object) {
    (this as { tagged?: boolean }).tagged = true;
  });
  return value;
}

// 2. 字段装饰器：返回初始化函数
function double(_value: undefined, ctx: ClassFieldDecoratorContext) {
  return function (this: unknown, initial: number) {
    console.log(`field ${String(ctx.name)} 初始化`);
    return initial * 2;
  };
}

// 3. 访问器装饰器
function loggedAccessor(
  value: { get: () => unknown; set: (v: unknown) => void },
  ctx: ClassAccessorDecoratorContext,
) {
  console.log(`accessor ${String(ctx.name)}`);
  return {
    get() { return value.get.call(this); },
    set(v: unknown) { value.set.call(this, v); },
  };
}

// 4. getter 装饰器：返回类型必须匹配原 getter
function upper(
  getter: (this: unknown) => string,
  ctx: ClassGetterDecoratorContext,
): (this: unknown) => string {
  void ctx;
  return function (this: unknown) {
    return getter.call(this).toUpperCase();
  };
}

// 5. 静态成员装饰器
function staticLog<T extends (...args: any[]) => any>(
  fn: T,
  ctx: ClassMethodDecoratorContext,
): T {
  console.log(`static method ${String(ctx.name)}, static=${ctx.static}`);
  return fn;
}

@tagged
class Config {
  @double
  level = 1;

  accessor name = "rainboy";

  @upper
  get title(): string {
    return "hello";
  }

  @staticLog
  static create(): Config {
    return new Config();
  }
}

const c = Config.create();
console.log(c.level, c.name, c.title, (c as { tagged?: boolean }).tagged);

// context 对象的字段（实测）
console.log("context 字段: name, kind, static, private, metadata, access");
