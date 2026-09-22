// 可辨识联合：共同的字面量字段作为标签
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function unwrap<T>(r: Result<T>): T {
  if (r.ok) {
    return r.value;      // 收窄为 { ok: true; value: T }
  }
  throw new Error(r.error);   // 收窄为 { ok: false; error: string }
}

// 穷尽性检查：用 never 确保所有分支都被处理
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default: {
      // 如果新增了 Shape 成员，这里会报错
      const exhaustive: never = s;
      throw new Error(`unhandled: ${JSON.stringify(exhaustive)}`);
    }
  }
}

console.log(unwrap({ ok: true, value: 1 }));
console.log(area({ kind: "circle", radius: 1 }), area({ kind: "square", side: 2 }));
try { unwrap({ ok: false, error: "failed" }); } catch (e) { console.log((e as Error).message); }
