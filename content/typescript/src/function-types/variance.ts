// 函数参数的逆变（contravariance）
// 参数类型更宽的函数，可以赋值给参数类型更窄的位置

interface BaseEvent { type: string }
interface ClickEvent extends BaseEvent { x: number; y: number }

type Handler = (e: ClickEvent) => void;

// BaseEvent 比 ClickEvent 宽，所以可以当 ClickEvent 的处理器
const wide: Handler = (e: BaseEvent) => { void e; };

// 反过来不行：只接受 ClickEvent 的函数不能处理任意 BaseEvent
// @ts-expect-error TS2322: 参数类型不兼容
const narrow: (e: BaseEvent) => void = (e: ClickEvent) => { void e; };

// 返回值是协变的：返回类型更窄的函数可以赋给更宽的位置
type Factory = () => BaseEvent;
const specific: Factory = () => ({ type: "click", x: 1, y: 2 } as ClickEvent);

// 方法简写 vs 函数属性：bivariance 差异（strictFunctionTypes 只作用于属性写法）
interface WithMethod {
  handle(e: BaseEvent): void;      // 方法简写：双变（bivariant）
}
interface WithProperty {
  handle: (e: BaseEvent) => void;  // 属性写法：逆变（contravariant）
}

// 方法简写更宽松：允许传"更窄参数"的函数（双变的宽松方向）
const m: WithMethod = { handle: (e: ClickEvent) => { void e; } };

// 属性写法在 strictFunctionTypes 下拒绝同样的写法
// @ts-expect-error TS2322: 属性写法要求参数逆变
const p: WithProperty = { handle: (e: ClickEvent) => { void e; } };

// 两种写法都允许"更宽参数"（逆变方向，安全）
const m2: WithMethod = { handle: (e: { type: string }) => { void e; } };
const p2: WithProperty = { handle: (e: { type: string }) => { void e; } };

// 回调场景：参数能宽不能窄
function onClick(cb: (e: ClickEvent) => void): void {
  cb({ type: "click", x: 1, y: 2 });
}
onClick((e) => { void e; });              // e 推断为 ClickEvent
onClick((e: BaseEvent) => { void e; });   // 显式写宽也可以
// onClick((e: ClickEvent & { z: 1 }) => {});   // 更窄不行

console.log(typeof wide, typeof narrow, typeof specific, typeof m, typeof p, typeof m2, typeof p2, typeof onClick);
