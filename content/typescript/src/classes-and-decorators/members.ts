// 类成员与修饰符

class Account {
  // 实例字段：每个实例一份
  balance = 0;

  // 只读字段：只能在声明处或构造函数里赋值
  readonly id: string;

  // 静态字段：挂在类上，不是实例上
  static totalAccounts = 0;

  // 私有字段（TS 修饰符）：只在编译期检查
  private secret = "s";

  // 私有字段（ES 真私有）：运行时也访问不到
  #realSecret = "r";

  // 受保护：子类可以访问
  protected owner: string;

  // 可选字段
  nickname?: string;

  constructor(id: string, owner: string) {
    this.id = id;
    this.owner = owner;
    Account.totalAccounts++;
  }

  // getter / setter
  get label(): string {
    return `${this.id}(${this.owner})`;
  }

  set label(v: string) {
    this.nickname = v;
  }

  // 静态方法
  static reset(): void {
    Account.totalAccounts = 0;
  }

  // 读取私有字段的方法
  reveal(): string {
    return `${this.secret}/${this.#realSecret}`;
  }
}

// 参数属性：构造函数参数前加修饰符，自动成为字段
class Point {
  constructor(
    public x: number,
    private y: number,
    readonly z: number = 0,
  ) {}

  // y 是 private，只能在类内部读
  sum(): number {
    return this.x + this.y + this.z;
  }
}

// 用 # 真私有：运行时也拿不到
class Vault {
  #value = 1;
  get(): number { return this.#value; }
}

const a = new Account("a1", "rainboy");
a.label = "alias";
a.balance = 100;

const p = new Point(1, 2);

console.log(a.label, a.balance, a.nickname, a.reveal(), Account.totalAccounts);
console.log(p.x, p.sum(), new Vault().get());

// 验证 # 真私有：类外访问是语法错误（不是类型错误）
// 下面这行连解析都过不去，所以不能写在源码里：
//   const v = new Vault();
//   console.log(v.#value);   // SyntaxError: Private field '#value' must be declared in an enclosing class
//
// 对比：TS 的 private 只是编译期检查，运行时能绕过
const acc = new Account("a2", "x");
console.log((acc as unknown as { secret: string }).secret);   // "s"，运行时确实能读到
