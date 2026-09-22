// typeof 收窄
function pad(value: string | number, width: number): string {
  if (typeof value === "string") {
    return value.padStart(width);   // 这里是 string
  }
  return value.toFixed(2).padStart(width);   // 这里是 number
}

// typeof 能识别的结果
function describe(x: string | number | boolean | bigint | symbol | null | undefined | object) {
  switch (typeof x) {
    case "string": return `string: ${x.toUpperCase()}`;
    case "number": return `number: ${x.toFixed(1)}`;
    case "boolean": return `boolean: ${x}`;
    case "bigint": return `bigint: ${x + 1n}`;
    case "symbol": return `symbol: ${x.description}`;
    case "undefined": return "undefined";
    case "object": return x === null ? "null" : "object";
    case "function": return "function";
  }
}

console.log(pad("a", 3), pad(1.5, 6));
console.log(describe("x"), describe(1), describe(null), describe(undefined));
