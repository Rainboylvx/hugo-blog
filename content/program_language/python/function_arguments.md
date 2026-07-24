---
title: "Python 函数传参：对象引用绑定与参数排布"
date: 2026-07-18
draft: true
toc: true
tags: ["Python", "函数", "传参", "内存模型"]
---

Python 函数传参的本质，是一场「将变量名绑定到内存对象」的游戏。与 C/C++ 不同，Python 没有显式的传值或传引用，而是**对象引用传递**。

理解底层的绑定逻辑和排布规则，不仅能少写 bug，也能更从容地阅读开源库里复杂的接口签名。

## 1. 基础绑定：位置与关键字

调用函数时，实参如何找到对应的形参？Python 提供两条最基础的匹配原则。

```python
def connect_db(host, port, timeout=30):
    print(f"连接 {host}:{port}，超时时间: {timeout}s")

# 1. 纯位置传参：严格按顺序绑定
connect_db("127.0.0.1", 3306)

# 2. 纯关键字传参：指名道姓，打破顺序限制
connect_db(port=6379, host="localhost")

# 3. 混合传参：位置参数必须在关键字参数之前
connect_db("192.168.1.1", port=8080, timeout=10)
```

> [!IMPORTANT] 核心规则
> 一旦在函数调用里出现了关键字参数，它后面的所有参数**全都必须**以关键字形式传递，否则会抛出 `SyntaxError`。

## 2. 默认参数与「可变对象陷阱」

为参数设置默认值可以简化接口调用，但这里藏着 Python 最经典的内存陷阱。

### 为什么默认参数必须在非默认参数之后？

如果写成 `def func(a=10, b):`，当你调用 `func(5)` 时，解释器无法判断这个 `5` 是要覆盖默认的 `a`，还是传给没有默认值的 `b`。因此，**有默认值的参数必须往后放**。

### 经典雷区：不要用列表/字典当默认值

```python
# 错误的写法
def add_item(item, target_list=[]):
    target_list.append(item)
    return target_list

print(add_item(1))  # [1]
print(add_item(2))  # [1, 2]  为什么不是 [2]？
```

**陷阱解密：**

Python 的默认参数是在**函数定义时**（代码加载到内存那一刻）求值并创建的，而不是每次调用时创建。当使用可变对象（`list`、`dict`、`set`）作为默认值时，所有未传该参数的调用都在**共享同一块内存里的列表**。

**正确写法：** 用不可变的 `None` 作占位，在函数体内动态初始化：

```python
def add_item(item, target_list=None):
    if target_list is None:
        target_list = []  # 每次调用新建独立列表
    target_list.append(item)
    return target_list
```

## 3. 动态拓展：`*args`、`**kwargs` 与解包

当函数需要接收不定长度的实参时，变长参数和解包就派上用场。

### 打包接收：函数定义阶段

- `*args`：把多余的**位置实参**打包成 **tuple**
- `**kwargs`：把多余的**关键字实参**打包成 **dict**

```python
def log_event(event_name, *args, **kwargs):
    print(f"事件: {event_name}")
    print(f"匿名详情(tuple): {args}")
    print(f"标记详情(dict): {kwargs}")

log_event("登录失败", "IP异常", "密码错误", user_id=1001, retry_count=3)
# 事件: 登录失败
# 匿名详情(tuple): ('IP异常', '密码错误')
# 标记详情(dict): {'user_id': 1001, 'retry_count': 3}
```

### 拆解发送：函数调用阶段

调用时也可以用 `*` / `**` 把集合解包成独立参数：

```python
def calc_sum(a, b, c):
    return a + b + c

nums = [10, 20, 30]
print(calc_sum(*nums))  # 等价于 calc_sum(10, 20, 30)

params = {"a": 1, "b": 2, "c": 3}
print(calc_sum(**params))  # 等价于 calc_sum(a=1, b=2, c=3)
```

更系统的解包用法见 [Python 解包操作符 * 和 **](./unpacking_operator.md)。

## 4. 现代 Python 的「交通管制」：`/` 与 `*`

为了让 API 更严谨，避免调用者滥用关键字传参（库作者改个形参名就会破坏兼容），Python 3.8 完善了参数传递方式的强制限制。

```text
def func(pos_only1, pos_only2, /, std1, std2, *, kw_only1, kw_only2):
         |-------------------|    |--------|     |------------------|
            仅限位置传递           两种皆可        仅限关键字传递
```

- **斜杠 `/`（仅限位置）：** `/` 左侧的参数调用时**不能**写 `参数名=值`，只能靠位置对应。内置 `len()` 就是这种限制（`len(obj=my_list)` 会报错）。
- **星号 `*`（仅限关键字）：** 单独的 `*`（或 `*args`）右侧的参数，调用时**必须**显式写关键字，不能靠位置数过去。

```python
def create_user(username, /, age, *, is_admin=False):
    pass

# 正确
create_user("alice", 25, is_admin=True)
create_user("bob", age=30)

# 错误
create_user(username="charlie", age=20)  # username 在 / 左侧，不能用关键字
create_user("david", 22, True)           # is_admin 在 * 右侧，必须 is_admin=True
```

## 5. 终极排布与底层逻辑

### 终极黄金顺序

把上面所有语法揉进同一个函数，定义时的合法顺序是：

$$
\text{位置仅限 }(/) \to \text{标准参数} \to *\text{args} \to \text{关键字仅限} \to **\text{kwargs}
$$

```python
def complex_op(
    a: int,
    /,
    b: int = 0,
    *args: str,
    option: bool = False,
    **kwargs: float,
) -> None:
    pass
```

### 为什么改列表会影响外面，改数字就不行？

最后看传参的底层机制——**对象引用传递（Pass by Object Reference）**。

在 Python 里，传参传递的既不是「值拷贝」，也不是「变量地址拷贝」，而是**对目标对象本身的引用**（把一个新标签贴到那个内存对象上）。

- **不可变对象（`int`、`str`、`tuple`）：**  
  函数里写 `num = num + 1` 时，因为整数不可变，Python 会新建数字对象，把局部标签贴过去；外部标签仍指向原来的值。

- **可变对象（`list`、`dict`）：**  
  函数内外的变量指向**同一块内存**。若在函数里**原地修改**（`lst.append("new")`、`lst[0] = 99`），外部自然能看到变化。  
  若对局部变量**重新赋值**（`lst = [1, 2]`），只是改了局部标签的指向，不会影响外面的对象。

理解这套「标签与对象」的映射关系后，函数行为就不再神秘。
