---
title: "MongoDB - 在数组上查询"
date: 2025-09-04
tags: ["MongoDB", "Querying"]
toc: true
---

[查询数组 - MongoDB 手册 v8.0](https://www.mongodb.com/zh-cn/docs/manual/tutorial/query-arrays/#additional-query-tutorials)


`$ne`操作在数组的查询与我想的不一样

如果你希望能够匹配数组中有部分元素与 "red" 不匹配的文档，可以使用 $elemMatch 来精确匹配数组中的单个元素：

```js
db.newdb.find({
  tags: { $elemMatch: { $ne: "red" } }
})
```

查询数组元素

多个条件


```js
const cursor = db.collection('inventory').find({
  dim_cm: { $gt: 15, $lt: 20 }
});
```

数学描述

$$
\exists x \in A( x>=15) \land \exists x \in A (x <=20)
$$

```js
const cursor = db.collection('inventory').find({
  dim_cm: { $elemMatch: { $gt: 22, $lt: 30 } }
});
```

$$
\exists x \in A( x>=15 \land x <=20)
$$



```js
const cursor = db.collection('inventory').find({
  dim_cm: {$eq:20}
});
```

$$
\exists x \in A( x=20)
$$



```js
const cursor = db.collection('inventory').find({
  dim_cm: {$ne:20}
});
```


!!!注意这个查询是上面的查询的反面

$$
\begin{matrix}
\neg \exists x \in A(x = 20) \\
\forall \neg (x = 20) \\
\forall (x != 20)
\end{matrix}
$$
