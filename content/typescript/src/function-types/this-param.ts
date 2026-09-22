// this 参数：显式声明 this 的类型

// 普通函数里的 this 默认是 any（noImplicitThis 下报错）
function bad() {
  // @ts-expect-error TS2683: 'this' 隐式具有 any 类型
  return this.value;
}

// 用 this 参数显式声明（必须是第一个参数，只是类型声明不占实参位）
function good(this: { value: number }): number {
  return this.value;
}

// 调用时用 call/apply 绑定
const result = good.call({ value: 1 });

// 对象方法里的 this：TS 能推断出来
const obj = {
  value: 42,
  get() {
    return this.value;   // this 推断为 obj 的类型
  },
};

// 类里的 this 是实例类型
class Counter {
  value = 0;
  inc(): number {
    return ++this.value;
  }
}

// this 参数与泛型结合：链式调用
interface Chainable {
  add(this: Chainable, n: number): this;
}

// 事件处理器风格的 this
interface Widget {
  el: string;
  onClick(this: Widget, e: { type: string }): void;
}

const widget: Widget = {
  el: "div",
  onClick(e) { console.log(this.el, e.type); },
};
widget.onClick({ type: "click" });

// 显式排除 this 的使用：this: void
function standalone(this: void, x: number): number {
  return x * 2;
}

// 类型工具：ThisParameterType / OmitThisParameter
type ThisType = ThisParameterType<typeof good>;      // { value: number }
type NoThis = OmitThisParameter<typeof good>;        // () => number
const noThis: NoThis = good.bind({ value: 1 });

const thisTypeCheck: ThisType = { value: 1 };

console.log(result, obj.get(), new Counter().inc(), standalone(2), noThis(), thisTypeCheck.value, bad.call({ value: 3 }));
