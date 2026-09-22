// 声明 Array.prototype / String.prototype 上的新方法
interface Array<T> {
  first(): T | undefined;
}
interface String {
  isBlank(): boolean;
}
