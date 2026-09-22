// 模块扩充：扩展全局作用域
// 必须是模块（有 export），才能用 declare global
export {};

declare global {
  interface AppGlobal {
    __APP_VERSION__: string;
  }
  var __app: AppGlobal;
}
