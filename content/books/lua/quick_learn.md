---
title: Lua 快速教程
date: 2025-09-09 
toc: true
---

- [Lua 快速教程](https://wiki.luatos.com/luaGuide/introduction.html)

好的，既然你熟悉 C/C++/Python/Node.js，那 Lua 对你来说会非常容易上手。

把它想象成：**一个语法更简洁、核心更小的 Python，其中唯一的复杂数据结构是 `table`（表）。**

**核心要点 (与你熟悉的语言对比):**

1.  **动态类型**: 和 Python/JS 一样。
2.  **`nil`**: 类似 Python 的 `None` 或 JS 的 `null`/`undefined`。在条件判断中，`nil` 和 `false` 为假，其他都为真。
3.  **`table` (表) 是万能的** [table1](https://wiki.luatos.com/luaGuide/introduction.html#table) [lua 5.3 table doc](https://wiki.luatos.com/_static/lua53doc/manual.html#6.6):
    *   可以当数组：`arr = {10, 20, 30}` (索引从 **1** 开始！)
    *   可以当字典/对象：`obj = {name = "Lua", version = 5.4}` 或 `obj.name = "Lua"`
    *   没有单独的类，面向对象通过 `table` + `metatable` (元表) 实现。
4.  **索引从 1 开始**: 这是最大的“坑”！`arr[1]` 是第一个元素。
5.  **变量作用域**: 默认全局。必须用 `local` 声明局部变量 (非常重要！)。
    ```lua
    x = 10        -- 全局
    local y = 20  -- 局部
    ```
6. [for循环](https://wiki.luatos.com/luaGuide/introduction.html#for)

	for循环在某些程度上，和while循环很相似，但是for循环可以更加简洁地表达中间累积的量
	
	我们首先来学习`for`这个循环语法，整体的格式如下：
	```lua
	for 临时变量名=开始值,结束值,步长 do
	    循环的代码
	end
	```
	其中，`步长`可以省略，默认为1
	
	`临时变量名`可以直接在代码区域使用（但不可更改），每次循环会自动加`步长值`，并且在到达`结束值`后停止循环
	
	下面举一个例子，我们计算从1加到100的结果：

	```lua
	
	local result = 0
	
	for i=1,100 do
	    result = result + i
	end
	
	print(result)
	```
7. **函数是一等公民**: 和 Python/JS 一样，可以赋值给变量，作为参数传递，作为返回值。
    ```lua
    local function greet(name)
      print("Hello, " .. name) -- `..` 是字符串连接符
    end
    local say_hi = greet
    say_hi("World")
    ```
8.  **没有 `++`, `--`, `+=`, `-=`**: 需要写 `i = i + 1`。
9.  **代码块由 `end` 结束**: `if ... then ... elseif ... then ... else ... end`, `for ... do ... end`, `while ... do ... end`, `function ... end`。
10.  **注释**: 单行 `--`, 多行 `--[[ ... --]]`。
11. **面向对象 (Metatables)**: 这是 Lua 独特之处。`metatable` 允许你改变 `table` 的行为，比如重载操作符、实现继承。
    ```lua
    local my_table = {}
    local my_metatable = {
      __index = function(table_itself, key)
        return "Key '" .. key .. "' not found"
      end
    }
    setmetatable(my_table, my_metatable)
    print(my_table.non_existent_key) -- 输出: Key 'non_existent_key' not found
    ```
12. **协程 (Coroutines)**: 内建的轻量级线程，用于协作式多任务，类似 Python 的 `generator` 或 JS 的 `async/await` 的一种底层实现。

**一分钟代码示例感受:**

```lua
-- 变量和打印
local name = "Lua User"
local age = 30
print("Hello, " .. name .. "! You are " .. age .. " years old.") -- `..` 字符串连接

-- 表 (数组风格，索引从1开始!)
local fruits = {"apple", "banana", "orange"}
print(fruits[1]) -- 输出: apple

-- 表 (字典/对象风格)
local person = {name = "Alice", age = 25}
print(person.name) -- 输出: Alice
print(person["age"]) -- 输出: 25

-- 条件语句
if age > 18 then
  print("Adult")
else
  print("Minor")
end

-- 循环
for i = 1, 3 do -- 从 1 到 3 (包含3)
  print("Fruit " .. i .. ": " .. fruits[i])
end

for key, value in pairs(person) do
  print(key .. ": " .. value)
end

-- 函数
local function add(a, b)
  return a + b
end
local sum_result = add(5, 3)
print("Sum: " .. sum_result) -- 输出: Sum: 8

-- 记住：默认全局变量，一定要用 local！
```

**关键区别总结：**

*   `table` 是唯一数据结构。
*   索引从 **1** 开始。
*   `local` 声明局部变量。
*   用 `metatable` 实现高级特性 (如 OOP)。

你已经掌握了更复杂的语言，Lua 对你来说就是小菜一碟。直接上手写代码，遇到问题查阅《Programming in Lua》(PIL) 官方文档即可。