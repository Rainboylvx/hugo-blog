// 抽象类与 interface 的分工

// ---- interface：纯类型契约，无实现 ----
interface Serializable {
  serialize(): string;
}

// interface 可以有可选成员和只读成员
interface Config {
  readonly name: string;
  debug?: boolean;
}

// ---- 抽象类：部分实现 + 强制子类实现部分 ----
abstract class Shape {
  // 抽象成员：子类必须实现
  abstract area(): number;
  abstract readonly kind: string;

  // 已实现成员：子类继承
  describe(): string {
    return `${this.kind}: ${this.area().toFixed(2)}`;
  }

  // 模板方法：定义流程，子类填细节
  report(): string {
    return `[${this.describe()}]`;
  }

  // 抽象类可以有构造函数和状态
  protected label: string;
  constructor(label: string) {
    this.label = label;
  }
}

class Circle extends Shape {
  readonly kind = "circle";
  constructor(private radius: number) { super("circle"); }
  area(): number { return Math.PI * this.radius ** 2; }
}

// ---- 一个类可以 implements 多个 interface，但只能 extends 一个类 ----
interface Named { name: string }
interface Aged { age: number }

class Person implements Named, Aged {
  constructor(public name: string, public age: number) {}
}

// ---- implements 只检查形状，不继承实现 ----
class Version implements Serializable {
  constructor(private major: number) {}
  serialize(): string { return String(this.major); }
}
// 必须自己实现 serialize，implements 不给任何实现

// ---- 抽象类也可以 implements interface ----
abstract class BaseEntity implements Serializable {
  abstract serialize(): string;      // 声明为抽象，交给子类
  id = 0;
}

class UserEntity extends BaseEntity {
  serialize(): string { return JSON.stringify({ id: this.id }); }
}

// ---- 抽象类的实例侧与静态侧 ----
abstract class Factory {
  abstract create(): string;
  static registry: string[] = [];
}
// 静态成员可以正常访问
Factory.registry.push("a");
// @ts-expect-error TS2511: Cannot create an instance of an abstract class.
new Factory();

// ---- 选择标准 ----
// 用 interface：只要契约，多个类要共享形状，需要多实现
// 用抽象类：需要共享实现、需要 protected 成员、需要模板方法

// ---- 混合：抽象类 + interface 组合 ----
interface Drawable { draw(): string }
abstract class Renderer {
  abstract render(target: Drawable): string;
  log(msg: string): string { return `[log] ${msg}`; }
}
class SvgRenderer extends Renderer {
  render(target: Drawable): string {
    return this.log(target.draw());
  }
}

// ---- 抽象类的 protected 成员不能被外部访问 ----
class Sub extends Shape {
  readonly kind = "sub";
  area(): number { return 1; }
  readLabel(): string { return this.label; }    // ✓ protected 可被子类访问
}

const shapes: Shape[] = [new Circle(1), new Sub("s")];
console.log(shapes.map((s) => s.report()));
console.log(new Person("a", 1), new Version(1).serialize(), new UserEntity().serialize());
console.log(new SvgRenderer().render({ draw: () => "svg" }), new Sub("x").readLabel());
console.log(Factory.registry);
