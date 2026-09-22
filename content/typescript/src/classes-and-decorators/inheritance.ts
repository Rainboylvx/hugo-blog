// 继承、抽象类、implements

abstract class Shape {
  // 抽象方法：子类必须实现
  abstract area(): number;
  abstract readonly kind: string;

  // 普通方法：子类继承
  describe(): string {
    return `${this.kind} area=${this.area().toFixed(2)}`;
  }

  // 模板方法：定义流程，子类填细节
  report(): string {
    return `[${this.describe()}]`;
  }
}

class Circle extends Shape {
  readonly kind = "circle";
  constructor(private radius: number) { super(); }
  area(): number { return Math.PI * this.radius ** 2; }
}

class Square extends Shape {
  readonly kind = "square";
  constructor(private side: number) { super(); }
  area(): number { return this.side ** 2; }
}

// 不能实例化抽象类
// @ts-expect-error TS2511: 不能创建抽象类的实例
new Shape();

// implements：只检查实例侧的形状，不继承实现
interface Serializable {
  serialize(): string;
}

interface Comparable<T> {
  compareTo(other: T): number;
}

class Version implements Serializable, Comparable<Version> {
  constructor(private major: number, private minor: number) {}

  serialize(): string {
    return `${this.major}.${this.minor}`;
  }

  compareTo(other: Version): number {
    return this.major - other.major || this.minor - other.minor;
  }
}

// 类可以同时 extends 和 implements
class NamedCircle extends Circle implements Serializable {
  constructor(radius: number, private name: string) { super(radius); }
  serialize(): string { return `${this.name}:${this.area().toFixed(2)}`; }
}

// implements 只检查形状：私有字段会导致"名义化"检查
class HasPrivate {
  private secret = "s";
}
// 下面这个类虽然结构相同，但因为 private 不同源，不能互相赋值
class OtherPrivate {
  private secret = "s";
}
// @ts-expect-error TS2322: 私有字段来源不同
const hp: HasPrivate = new OtherPrivate();

// override 关键字：显式标记覆写
class Base {
  greet(): string { return "base"; }
}
class Derived extends Base {
  override greet(): string { return "derived"; }
}

const shapes: Shape[] = [new Circle(1), new Square(2)];
console.log(shapes.map((s) => s.report()));
console.log(new Version(1, 2).serialize(), new NamedCircle(1, "c").serialize());
console.log(new Derived().greet());
