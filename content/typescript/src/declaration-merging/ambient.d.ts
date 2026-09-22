// 环境声明：给不存在的模块补类型
// 全局脚本文件（无 import/export）
declare module "legacy-lib" {
  export function doSomething(input: string): number;
  export const VERSION: string;
}
