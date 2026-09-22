interface User {
  name: string;
  age: number;
  email?: string;            // 可选属性
  readonly id: string;       // 只读属性
  [key: string]: unknown;    // 索引签名：允许任意其他字符串键
}

const u: User = {
  name: "rainboy",
  age: 18,
  id: "u_1",
  extra: true,               // 索引签名允许额外键
};

// u.id = "u_2";  // 错误：只读
u.name = "rainboylvx";

console.log(u.name, u.age, u.id, u.extra);
