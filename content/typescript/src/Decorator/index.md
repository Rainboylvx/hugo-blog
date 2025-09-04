---
title: "装饰器"
date: 2025-09-04
draft: false
---

装饰器（Decorator）是一种语法结构，用来在定义时修改类（class）的行为。

我的结构

装饰器是一个函数,本质是对类进行**修改**(Decorator),然后得到一个新的类,使这个类,有新的功能.


[index]("./1.ts" ":include")

要使用这个代码,需要配置tsconfig.json 

```json
"experimentalDecorators": true,                   /* Enable experimental support for legacy experimental decorators. */
```
