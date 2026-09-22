// 联合类型
type ID = string | number;

// 交叉类型
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

const p: Person = { name: "rainboy", age: 18 };

// 可辨识联合（判别联合）
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;
    case "square":
      return s.side ** 2;
    case "rect":
      return s.w * s.h;
  }
}

// 联合上的属性访问：只有公共成员可用
function describe(id: ID): string {
  // 两个类型都有 toString
  return id.toString();
}

console.log(p, area({ kind: "circle", radius: 1 }), area({ kind: "rect", w: 2, h: 3 }));
console.log(describe("a"), describe(1));
