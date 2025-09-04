---
title: "MongoDB 学习笔记"
date: 2025-09-04
toc: true
---

## 安装

docker 安装,根据文档来: https://www.mongodb.com/zh-cn/docs/manual/tutorial/install-mongodb-community-with-docker/

安装完后,我根据 https://www.w3resource.com/mongodb-exercises/ 做练习

这里的客户端选择了mongodb compass: https://www.mongodb.com/try/download/compass

最重要的就是mongodb的官方文档: https://www.mongodb.com/zh-cn/docs/manual/

## 一些概念

```
数据 --> 集合-> 文档
```

## 学习路线

我认为学习的路线为

1. 增删改查
  - 注意数组上查询的反直觉行为
  - 注意`$ne`在数组的查询问题
2. 聚合
3. 索引
