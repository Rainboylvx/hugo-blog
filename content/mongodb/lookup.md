---
title: "MongoDB - Lookup 操作详解"
date: 2025-09-04
tags: ["MongoDB", "Aggregation"]
toc: true
---

## FAQ

如果实现类似的sql的 join 功能呢?

查看官方文档

- [$lookup（聚合）— MongoDB 手册 v8.0](https://www.mongodb.com/zh-cn/docs/manual/reference/operator/aggregation/lookup/)


## ask

- ask : 我在写在mongodb的相关内容, 有一个user collection  ,还有一个comment collection,commment通过 userid 与user 进行了关联,,我在查询comment ,如何得到每个comment 里的user 的相关属性?


## Answser


在 MongoDB 中，如果 `comment` 集合中的每个文档通过 `userId` 字段与 `user` 集合中的用户进行关联，并且你希望在查询 `comment` 时获取每个评论对应的 `user` 的相关属性，你可以使用 **`$lookup`** 聚合操作来实现联表查询。

### 示例数据结构

- **user** 集合:
  ```json
  {
    "_id": ObjectId("user1"),
    "name": "Alice",
    "email": "alice@example.com",
    "age": 30
  }
  ```

- **comment** 集合:
  ```json
  {
    "_id": ObjectId("comment1"),
    "content": "This is a comment",
    "userId": ObjectId("user1"),
    "timestamp": ISODate("2024-12-09T10:00:00Z")
  }
  ```

### 使用 `$lookup` 进行联表查询

你可以使用聚合框架（`aggregate()`）结合 `$lookup` 来连接 `comment` 和 `user` 集合，并将每个评论对应的用户信息合并到评论数据中。

#### 聚合查询示例

```javascript
db.comment.aggregate([
  {
    $lookup: {
      from: "user",              // 关联的集合是 "user"
      localField: "userId",       // 当前集合中关联字段是 "userId"
      foreignField: "_id",       // 关联到 "user" 集合中的 "_id" 字段
      as: "userDetails"          // 结果会放入 "userDetails" 数组字段
    }
  },
  {
    $unwind: "$userDetails"       // 将 "userDetails" 数组展开成单个对象（如果每个评论只能有一个用户的话）
  }
])
```

#### 查询结果

假设 `comment` 集合有一个文档，如下所示：

```json
{
  "_id": ObjectId("comment1"),
  "content": "This is a comment",
  "userId": ObjectId("user1"),
  "timestamp": ISODate("2024-12-09T10:00:00Z"),
  "userDetails": {
    "_id": ObjectId("user1"),
    "name": "Alice",
    "email": "alice@example.com",
    "age": 30
  }
}
```

### 解析说明

1. **`$lookup`**: 在 `comment` 集合中的 `userId` 字段和 `user` 集合中的 `_id` 字段之间建立连接，将匹配到的用户信息加入到每个评论中，并存储在 `userDetails` 字段中。

2. **`$unwind`**: 如果你确定每个评论只有一个对应的用户（即 `userId` 字段指向的是唯一用户），使用 `$unwind` 将 `userDetails` 数组拆解成单个对象。这样，你就可以直接在每个评论文档中获取到用户的属性。

如果一个评论可能有多个用户（例如评论可能有多个作者），你可以跳过 `$unwind`，这样每个评论的 `userDetails` 会是一个数组，包含匹配的所有用户。

### 其他改进

如果你只关心某些特定的用户字段，可以通过 `$project` 对返回的字段进行过滤，减少数据传输量。例如：

```javascript
db.comment.aggregate([
  {
    $lookup: {
      from: "user",
      localField: "userId",
      foreignField: "_id",
      as: "userDetails"
    }
  },
  {
    $unwind: "$userDetails"
  },
  {
    $project: {
      content: 1,                      // 只保留评论的内容
      "userDetails.name": 1,            // 只返回用户的名字
      "userDetails.email": 1            // 只返回用户的邮箱
    }
  }
])
```

这样，结果将只包含评论内容以及用户的名字和邮箱。

### 总结

使用 `aggregate()` 方法结合 `$lookup` 可以轻松地在查询评论时获取每个评论对应用户的详细信息。如果你只关心部分用户字段，可以使用 `$project` 来限制返回的字段，优化查询效率。
