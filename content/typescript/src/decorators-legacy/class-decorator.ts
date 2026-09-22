// legacy 装饰器：类装饰器

// 类装饰器接收构造函数，可以返回一个新类替换它
function sealed<T extends new (...args: any[]) => object>(ctor: T): T {
  Object.seal(ctor);
  Object.seal(ctor.prototype);
  return ctor;
}

// 不替换，只做副作用（常见于注册）
function register(ctor: new (...args: any[]) => object): void {
  console.log(`register: ${ctor.name}`);
}

@sealed
@register
class BugReport {
  type = "report";
  title: string;

  constructor(t: string) {
    this.title = t;
  }
}

// 返回新类：替换原类
function withTimestamp<T extends new (...args: any[]) => object>(ctor: T) {
  return class extends ctor {
    createdAt = new Date("2020-01-01");
  };
}

@withTimestamp
class Post {
  title = "p";
}

const p = new Post();
// 装饰器顺序：靠近类的先执行（register 先，然后 sealed）
// 但工厂函数的求值顺序相反（从上到下）

console.log(new BugReport("bug").title, p.title, (p as Post & { createdAt: Date }).createdAt.toISOString());
