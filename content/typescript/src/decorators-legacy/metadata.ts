// emitDecoratorMetadata：装饰器能拿到类型元信息
//
// 重要：tsx / esbuild 不实现 emitDecoratorMetadata，所以这个文件必须用 tsc 编译再运行：
//   npx tsc -p content/typescript/src/decorators-legacy --outDir content/typescript/src/decorators-legacy/.emit --noEmit false
//   node content/typescript/src/decorators-legacy/.emit/metadata.js
// 实测输出：find: params=[Number,String] return=Boolean
// 用 tsx 跑同一文件：params=[] return=undefined（元数据没生成）
//
// 依赖 reflect-metadata（提供 Reflect.getMetadata / Reflect.metadata）

import "reflect-metadata";

function describe(target: object, propertyKey: string): void {
  const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
  const returnType = Reflect.getMetadata("design:returntype", target, propertyKey);
  const names = paramTypes?.map((t: { name: string }) => t.name) ?? [];
  console.log(`${propertyKey}: params=[${names}] return=${returnType?.name}`);
}

class Service {
  @describe
  find(id: number, name: string): boolean {
    void id;
    void name;
    return true;
  }
}

console.log(new Service().find(1, "a"));
