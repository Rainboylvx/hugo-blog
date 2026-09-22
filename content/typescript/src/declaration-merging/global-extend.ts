// 扩展全局作用域：必须是模块文件（有 import/export）
export {};

declare global {
  interface Array<T> {
    first(): T | undefined;
  }
  interface String {
    isBlank(): boolean;
  }
}
