// 给没有类型的库写声明
// 全局脚本文件（无 import/export）
declare module "some-legacy-lib" {
  export function doSomething(input: string): number;
  export const VERSION: string;
}

// 通配模块：用于 import "./style.css" 这类
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.png" {
  const src: string;
  export default src;
}

// 声明全局常量（运行时由构建工具注入）
declare const __BUILD_TIME__: string;
