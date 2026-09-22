// 环境声明：给"只有运行时、没有类型"的模块补类型
// 这类文件不需要 import/export，是全局脚本文件
declare module "virtual-module" {
  export function run(): void;
  export const version: string;
}
