// 访问器装饰器：装饰 get/set

// 注意：访问器装饰器里改 descriptor.configurable 对 getter 不一定生效，
// 因为 getter 定义在原型上，configurable 默认就是 true。
// 这里演示更实用的场景：包装 getter 的返回值。

function upperCase(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const original = descriptor.get;
  if (original) {
    descriptor.get = function (this: unknown) {
      const v = original.call(this);
      return typeof v === "string" ? v.toUpperCase() : v;
    };
  }
}

// 工厂形式：带参数
function prefix(text: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): void {
    const original = descriptor.get;
    if (original) {
      descriptor.get = function (this: unknown) {
        return `${text}${String(original.call(this))}`;
      };
    }
  };
}

class Person {
  private _name = "rainboy";

  @prefix("Mr. ")
  @upperCase
  get name(): string {
    return this._name;
  }
}

const p = new Person();
// 装饰器从下往上应用：先 upperCase，再 prefix
console.log(p.name);
