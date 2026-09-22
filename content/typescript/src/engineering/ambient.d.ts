// 环境声明文件：只有类型，没有实现
// 这类文件不需要 import/export，是"全局脚本"文件

// 1. 声明一个全局常量（运行时由构建工具注入）
declare const __APP_VERSION__: string;

// 2. 声明一个全局函数
declare function parseAmount(text: string): number;

// 3. 给不存在的模块补类型
declare module "virtual-lib" {
  export function helper(): string;
}

// 4. 声明一个通配模块（用于 import "./style.css" 这类）
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}
