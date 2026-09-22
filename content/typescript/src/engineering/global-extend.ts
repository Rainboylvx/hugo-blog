// 扩展全局接口必须写在"模块文件"里（有 import/export）
// 所以单独放一个文件，而不是 ambient.d.ts
export {};

declare global {
  interface Array<T> {
    last(): T | undefined;
  }
}
