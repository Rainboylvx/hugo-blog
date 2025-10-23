---
title: "元表及元方法"
date: 2025-10-22
draft: false
toc: true
tags: [""]
categories: [""]
---


## 元表概念

> **Lua 中的每个值都可以有一个元表**。此元表是一个普通的 Lua 表，它定义了原始值在特定事件下的行为。您可以通过设置其元表中的特定字段来更改值的多个行为方面。例如，当非数字值是加法的操作数时，Lua 会在该值的元表的 __add 字段中查找一个函数。如果找到一个，Lua 会调用此函数来执行加法

详细参见 [2.4 – 元表及元方法](https://cloudwu.github.io/lua53doc/manual.html#2.4)


举一个例子,类似于 c++的运算符重载,这里我们重载`+`

```Lua
foo = {a = 1}
print(foo.a)

smt = {
    __add = function(a,b)
        return a.a + b;
    end
}

-- 设定 foo 的元表,
-- 当你对非数字值做加操作时， Lua 会检查该值的元表中的 "__add" 域下的函数
setmetatable(foo, smt)

b = foo + 1
print(string.format("foo + 1 = %d", b))
```

## __index

> **`__index`:** 索引 `table[key]`。 当 `table` 不是表或是表 `table` 中不存在 `key` 这个键时，这个事件被触发。 此时，会读出 `table` 相应的元方法。
> 尽管名字取成这样， 这个事件的元方法其实可以是一个函数也可以是一张表。 如果它是一个函数，则以 `table` 和 `key` 作为参数调用它。 如果它是一张表，最终的结果就是以 `key` 取索引这张表的结果。 （这个索引过程是走常规的流程，而不是直接索引， 所以这次索引有可能引发另一次元方法。）

```lua
foo = {a = 1}
print(foo.a)

smt = {
    __index = function(table,key)
        return string.format("not found key : %s",key)
    end
}

setmetatable(foo, smt)
print(foo["mykey"])
print(foo[123])
```

## __newindex

> **`__newindex`:** 索引赋值 `table[key] = value` 。 和索引事件类似，它发生在 `table` 不是表或是表 `table` 中不存在 `key` 这个键的时候。 此时，会读出 `table` 相应的元方法。

> 同索引过程那样， 这个事件的元方法即可以是函数，也可以是一张表。 如果是一个函数， 则以 `table`、 `key`、以及 `value` 为参数传入。 如果是一张表， Lua 对这张表做索引赋值操作。 （这个索引过程是走常规的流程，而不是直接索引赋值， 所以这次索引赋值有可能引发另一次元方法。）

> 一旦有了 “newindex” 元方法， Lua 就不再做最初的赋值操作。 （如果有必要，在元方法内部可以调用 `rawset` 来做赋值。）

```lua
foo = {a = 1}
print(foo.a)

smt = {
    __newindex = function(table,key,value)
        --print(key,value)
        rawset(table,key,value)
    end
}

setmetatable(foo, smt)
foo["abc"] = 123
print(foo["abc"])
```

## 语法糖

> 这是 Lua 支持的一种语法糖。 像 `v:name(args)` 这个样子， 被解释成 `v.name(v,args)`， 这里的 v 只会被求值一次

> 冒号 语法可以用来定义 方法， 就是说，函数可以有一个隐式的形参 self。 因此，如下语句

```
function foo:new(a,b)
    -- ....
end

foo.new = function (self,a,b)
    -- ....
end
```

```lua
foo = {
    a = 1,
    add = function(table,value)
        table.a = table.a + value
    end
}

foo:add(1)
-- eq: foo.add(foo,1)
print(foo["a"])
```


这种语法糖实现了`c++`的`this`指针的类似功能,可以操作对象本身,而不需要传入对象本身.

## 面向对象

`matetable` 非常类似于javascript 的`prototype`，可以用来实现面向对象

代码1实现: 

- 类的构造函数
- 类的方法

```lua
local fooClass = {}

function fooClass:new(name) {
    local t = { name = name}
    local t_smt = {
        __add = function(a,b) ... end
        -- 添加各种能力

        -- 添加基础属
        "default_name" = "bar" 
    }
    -- 当 t['no-key'] 时候 回去找 t_smt 里面的元素
    t_smt["__index"] = t_smt
    setmetatable(t,t_smt)
    return t
}

```

代码2实现: 类的继承 原理: `__index` 可以指向一个表,当访问的key不存在时,会去`__index`指向的表中查找

```lua
function newObject(value)
    return setmetatable({}, {__index = value})
end

function createClass(...)
    local c = {} -- a new class instance
    setmetatable(c, {__index = ...})
    c.__index = c
    function c:new (o)
        o = o or {}
        setmetatable(o, c)
        return o
    end
    return c
end

local animal = createClass()
function animal:new(name)
    local o = {name = name}
    self.__index = self
    setmetatable(o, self)
    return o
end

function animal:printName()
    print(self.name)
end

local dog = animal:new("dog")
dog:printName()
```


## 一个例子 

```lua
print("<-- learning class -->")
local Animal = {}
Animal.__index = Animal

function Animal.new(name)
    local self = setmetatable({}, {__index = Animal})
    self.name = name
    return self
end

function Animal:count()
    print(self.name .. "Animal kingdom is large!")
end

function Animal:speak()
    print(self.name .. " says: I'm an animal!")
end

function Animal:move()
    print(self.name .. " is moving.")
end


--- use Animal class
local dog = Animal.new("Dog")
dog:speak()  -- Output: Dog says: I'm an animal!
dog:move()   -- Output: Dog is moving.

--- li sh


-- class inherit
local Dog = {}
Dog.__index = Dog --  为了后面可以继承 Dog
-- setmetatable(Dog,{__index = Animal}) -- 指向父类
setmetatable(Dog,{__index = Animal}) -- 指向父类


function Dog.new(name)
    local self = Animal.new(name) -- 调用父类的构造函数
    setmetatable(self, Dog) -- 设置元表为 Dog
    -- 可以认为创建了一个 Dog 的实例
    return self
end

function Dog:speak()
    print(self.name .. " says: Woof!")
end

local myDog = Dog.new("Buddy")
myDog:speak()  -- Output: Buddy says: Woof!
myDog:move()   -- Output: Buddy is moving.

myDog.count(myDog) -- Output: Buddy Animal kingdom is large!
 
```

## `__index` 只读取特性

> 答案很简单：`__index` 只会影响“读取”操作，不会影响“写入”（赋值）操作。

```lua
local obj = {
    num  = 0;
}

function obj:add1()
    self.num = self.num + 1
end

function obj.new(start)
    local t = {}
    setmetatable(t, {__index = obj})
    -- t.num = start
    return t;
end

local o1 = obj.new(10)
o1:add1()
print(o1.num)

local o2 = obj.new(100)
o2:add1()
print(o2.num)
```


`__index` 只在**读取**（查找）时生效，**写入**（赋值）时无效。

`o1:add1()` 和 `o2:add1()` 都是：
1.  **读取** `obj.num` (值是 `0`)。
2.  计算 `0 + 1 = 1`。
3.  **写入**到**自己**身上 (`o1.num = 1`, `o2.num = 1`)。

`obj.num` 永远是 `0`，`o1` 和 `o2` 互不影响。