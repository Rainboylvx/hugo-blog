// 类的 this 类型、泛型类、类与接口的关系

// this 类型：返回 this 实现链式调用
class QueryBuilder {
  private parts: string[] = [];

  select(cols: string): this {
    this.parts.push(`select ${cols}`);
    return this;
  }

  from(table: string): this {
    this.parts.push(`from ${table}`);
    return this;
  }

  build(): string {
    return this.parts.join(" ");
  }
}

class FilterBuilder extends QueryBuilder {
  where(cond: string): this {
    // 只能通过 public 方法访问 parts，这里用 build 演示
    void cond;
    return this;
  }
}

const q = new QueryBuilder().select("*").from("users").build();
// 继承链上 this 依然正确：FilterBuilder 的方法可链式调用父类方法
const f = new FilterBuilder().select("*").where("id=1").build();

// 泛型类 + 泛型约束
interface Entity {
  id: string;
}

class Repository<T extends Entity> {
  private items = new Map<string, T>();

  save(item: T): void {
    this.items.set(item.id, item);
  }

  find(id: string): T | undefined {
    return this.items.get(id);
  }

  all(): T[] {
    return [...this.items.values()];
  }
}

interface User extends Entity {
  name: string;
}

const repo = new Repository<User>();
repo.save({ id: "1", name: "rainboy" });

// 泛型静态方法（静态方法不能用类的类型参数）
class Box<T> {
  constructor(private value: T) {}
  get(): T { return this.value; }

  // 静态方法必须自己声明类型参数
  static of<U>(v: U): Box<U> {
    return new Box(v);
  }

  // 下面这样写会报错：静态成员不能引用类类型参数
  // static bad(v: T): Box<T> { return new Box(v); }
}

const box = Box.of(1);

// 类实现接口时的可见性：implements 只要求 public 部分
interface Readable {
  read(): string;
}
class File implements Readable {
  private content = "data";
  read(): string { return this.content; }   // 这个方法必须是 public
}

console.log(q, f);
console.log(repo.find("1")?.name, repo.all().length, box.get(), new File().read());
