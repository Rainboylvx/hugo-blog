// 扩展全局接口（必须写在模块文件里，见 global-extend.ts）
// 这里只演示非 DOM 的全局扩展
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production";
    API_URL?: string;
  }
}
