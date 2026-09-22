// 以下语法在编译后留下运行时产物

// 1. 非 const enum → IIFE，双向映射
enum Direction {
  Up,
  Down,
}

// 2. namespace → IIFE
namespace Geometry {
  export const PI = 3.14;
}

// 3. 参数属性 → 构造函数里的赋值
class Point {
  constructor(
    public x: number,
    private label: string,
  ) {}

  get name(): string {
    return this.label;
  }
}

// 4. 类字段 → 构造函数里的赋值
class Counter {
  count = 0;
}

console.log(Direction.Up, Direction[0]);
console.log(Geometry.PI);
console.log(new Point(1, "origin").x, new Point(1, "origin").name);
console.log(new Counter().count);
