// 这些语法在编译后留下运行时产物，因此 Node 原生 type stripping 无法执行

// 1. 非 const enum → IIFE + 双向映射对象
enum Direction {
  Up,
  Down,
}

// 2. namespace → IIFE
namespace Geometry {
  export const PI = 3.14;
}

// 3. 参数属性 → 构造函数里的赋值语句
class Point {
  constructor(
    public x: number,
    private label: string,
  ) {}

  get name(): string {
    return this.label;
  }
}

// 4. 类字段初始化 → 构造函数里的赋值语句
class Counter {
  count = 0;
}

const p = new Point(1, "origin");
console.log(Direction.Up, Direction[0]);
console.log(Geometry.PI);
console.log(p.x, p.name);
console.log(new Counter().count);
