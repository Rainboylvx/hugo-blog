---
title: "MongoDB 练习 1"
date: 2025-09-04
tags: ["MongoDB", "Exercises"]
toc: true
---

## 5

5. Write a MongoDB query to display all the restaurant which is in the borough Bronx.

这个简单,本质是查询固定的值

```js
db["restaurants"].find({'borough':'Bronx'})
```
## 8

8. Write a MongoDB query to find the restaurants who achieved a score more than 90.

让我们查询一个数组,数组里面有一个Object的值`>=0`

```js
db["restaurants"].find({'grades.score': {$gt : 90}}).count()
```

```js
db["restaurants"].find({ 'grades' : {$elemMatch : { "score" :{$gt : 90} }  } })
```

这两个的结果是等价的,只不过第二个用到了数组匹配操作符`$elemMatch`

## 9

9. Write a MongoDB query to find the restaurants that achieved a score, more than 80 but less than 100.

这个题目的意思是: `grades`里存在一个分数,这个分数在80与90之间

```js
db["restaurants"].find({ 'grades' : {$elemMatch : { "score" :{$gt : 80,$lt:100} }  } })
```

## 10

10. Write a MongoDB query to find the restaurants which locate in latitude value less than -95.754168.

这里考察我们如何查询数组里某个下标的值

```bash
db.restaurants.find({"address.coord.0":{$lte :  -95.754168} })
```


## 11


11. Write a MongoDB query to find the restaurants that do not prepare any cuisine of 'American' and their grade score more than 70 and latitude less than -65.754168.

```bash
db["restaurants"].count({cuisine:{$not: {$regex: /.*American.*/ } },grades:{$elemMatch : { "score":{$gte:70} }} })
```

这里考查我们有多个条件,同时成立的查询


发现一个问题:

我查询了文档

- mongodb在数组上的查询 https://www.mongodb.com/zh-cn/docs/manual/tutorial/query-arrays/#specify-multiple-conditions-for-array-elements
- [mongodb - mongo $ne query with an array not working as expected - Stack Overflow](https://stackoverflow.com/questions/10907843/mongo-ne-query-with-an-array-not-working-as-expected)

`$ne`操作在数组的查询与我想的不一样

如果你希望能够匹配数组中有部分元素与 "red" 不匹配的文档，可以使用 $elemMatch 来精确匹配数组中的单个元素：

```js
db.newdb.find({
  tags: { $elemMatch: { $ne: "red" } }
})
```

这里官方给出的答案

```json
db.restaurants.find(
               {$and:
                    [
                       {"cuisine" : {$ne :"American "}},
                       {"grades.score" : {$gt : 70}},
                       {"address.coord" : {$lt : -65.754168}}
                    ]
                });
```


## 12


12. Write a MongoDB query to find the restaurants which do not prepare any cuisine of 'American' and achieved a score more than 70 and located in the longitude less than -65.754168.
Note : Do this query without using $and operator.


和上一个问题的问题一样,只是不让我们使用`$and$`符号


```js
db.restaurants.find(
                           {
                             "cuisine" : {$ne : "American "},
                             "grades.score" :{$gt: 70},
                             "address.coord" : {$lt : -65.754168}
                            }
                     );
```

## 13

13. Write a MongoDB query to find the restaurants which do not prepare any cuisine of 'American' and achieved a grade point 'A' not belongs to the borough Brooklyn. The document must be displayed according to the cuisine in descending order.

前面的条件还好,这里只是多了一个排序的要求

```js
db.restaurants.find( {
                             "cuisine" : {$ne : "American"},
                             "grades.grade" :"A",
                             "borough": {$ne : "Brooklyn"}
                       } 
                    ).sort({"cuisine":-1});
```


## 14

14. Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which contain 'Wil' as first three letters for its name.

查询的条件是name的首个三个字母是3个Wil字符.

我这里的写法与官方不一样,因为我不理解官方的第二个参数,为什么这样写,因为我查询的nodejs api 不是这样的.

https://mongodb.github.io/node-mongodb-native/6.11/interfaces/FindOptions.html#projection

```js
db["restaurants"].find ({name:/AWil/}).projection({name:1,restaurant_id:1,borough:1,cuisine:1}})
```

为什么会这样? ,AI 告诉我这是一个差异!!!


你提出的问题涉及到 **MongoDB Node.js Driver** 的 `find` 方法的第二个参数，它实际上是一个 **选项对象（options）**，而 **投影（projection）** 是该选项对象中的一个字段。这是 MongoDB **Node.js Driver** 和 **MongoDB Shell**（`mongosh`）之间的一个差异。

### MongoDB Node.js Driver 的 `find` 方法
根据你提供的链接，在 MongoDB 的 **Node.js Driver** 版本 3.6 中，`find` 方法的第二个参数 **必须是一个选项对象**，该对象中可以包含多个选项，例如 `projection`, `sort`, `limit` 等。

#### `find` 方法的签名（Node.js Driver）
```javascript
find(filter, options)
```
- `filter`: 查询条件。
- `options`: 选项对象，其中包括多个可选的字段，例如 `projection`, `sort`, `limit` 等。

### 投影（Projection）在选项对象中
在 **MongoDB Node.js Driver** 中，**投影（projection）** 是通过选项对象中的 `projection` 字段来指定的。因此，第二个参数的形式通常是一个包含 `projection` 字段的对象，而 **投影（projection）** 本身是一个文档，定义了需要包含或排除的字段。

#### 示例代码：

```javascript
const { MongoClient } = require('mongodb');

async function queryRestaurants() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('test'); // 假设你的数据库名是 'test'
  const collection = db.collection('restaurants');

  // 使用 find 查询并投影
  const cursor = collection.find(
    { name: /^Wil/ },
    {
      projection: {
        "restaurant_id": 1,
        "name": 1,
        "borough": 1,
        "cuisine": 1
      }
    }
  );

  // 获取查询结果并打印
  const results = await cursor.toArray();
  console.log(results);

  await client.close();
}

queryRestaurants().catch(console.error);
```

### 为什么必须使用 `projection` 字段？
在 Node.js MongoDB Driver 的 **`find`** 方法中，第二个参数是一个 **选项对象（options）**，因此你需要明确指定 `projection` 字段来设置查询返回的字段。这是与 **MongoDB Shell（mongosh）** 的差异，后者可以直接将投影文档作为第二个参数。

#### Node.js Driver 的选项对象结构
在 Node.js 中，你可以传递一个包含多个选项字段的对象，例如：

```javascript
{
  projection: { "restaurant_id": 1, "name": 1, "borough": 1, "cuisine": 1 },
  sort: { name: 1 },
  limit: 10
}
```

- `projection`: 指定返回的字段。
- `sort`: 指定排序规则。
- `limit`: 限制返回的文档数量。

### 总结
在 **MongoDB Node.js Driver** 中，第二个参数是一个 **选项对象（options）**，其中包含 `projection` 字段来指定投影。而在 **MongoDB Shell（mongosh）** 中，第二个参数直接是一个投影文档，可以省略 `projection` 字段名。

#### Node.js Driver 使用 `projection`：
```javascript
db.restaurants.find(
  { name: /^Wil/ },
  { projection: { "restaurant_id": 1, "name": 1, "borough": 1, "cuisine": 1 } }
);
```

#### MongoDB Shell 中直接传递投影文档：
```javascript
db.restaurants.find(
  { name: /^Wil/ },
  { "restaurant_id": 1, "name": 1, "borough": 1, "cuisine": 1 }
);
```

好吧,经过我的查询,这真的是一个差异:

- https://stackoverflow.com/questions/67090307/mongodb-projection-syntax
- https://www.mongodb.com/zh-cn/docs/manual/reference/method/db.collection.findOne/

两者确实不一样.


## 15

15. Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which contain 'ces' as last three letters for its name.

和上一个问题一样,但是要查询的值是最后三个字符,还是使用regex


```js
db.restaurants.find(
{name: /ces$/},
{
"restaurant_id" : 1,
"name":1,"borough":1,
"cuisine" :1
}
);

```

```js
db["restaurants"].find ({name:/ces$/}).projection({name:1,
restaurant_id:1,borough:1,cuisine:1})
```

## 16 包含`Reg`+投影

16. Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which contain 'Reg' as three letters somewhere in its name.

改变一下reg就可以了.

```js
db["restaurants"].find({name:/Reg/},{name:1}).count()
db["restaurants"].find({name:/Reg/},{name:1}).count()

db.restaurants.find(
{"name": /.*Reg.*/},
{
"restaurant_id" : 1,
"name":1,"borough":1,
"cuisine" :1
}
);
```

## 17

17. Write a MongoDB query to find the restaurants which belong to the borough Bronx and prepared either American or Chinese dish.

```js
db["restaurants"].find({"cuisine": {$in :['Chinese', 'American ']} ,
  "borough": "Bronx"
},{"cuisine":1}).count()
```


```js
db.restaurants.find(
{
"borough": "Bronx" ,
$or : [
{ "cuisine" : "American " },
{ "cuisine" : "Chinese" }
]
}
);
```

## 18

Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which belong to the borough Staten Island or Queens or Bronxor Brooklyn.

和我的上一个执行`$in`的语法一样


```js
db.restaurants.find(
    {"borough" :{$in :["Staten Island","Queens","Bronx","Brooklyn"]}},
    {
    "restaurant_id" : 1,
    "name":1,"borough":1,
    "cuisine" :1
    }
    );
```

## 19

Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which are not belonging to the borough Staten Island or Queens or Bronxor Brooklyn.

从数理逻辑的角度来看,$a \notin \{\text{borough Staten Island , Queens , Bronxor Brooklyn} \}$ 当这个条件为true的时候,这里使用`$nin`操作


```js
db.restaurants.find(
{"borough" :{$nin :["Staten Island","Queens","Bronx","Brooklyn"]}},
{
"restaurant_id" : 1,
"name":1,"borough":1,
"cuisine" :1
}
);

```


## 20

Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which achieved a score which is not more than 10.


这里的核心就在于 not more than 10 ,数学写法


$$
\neg (grades.score > 10) \Leftrightarrow grades.score <= 10
$$

```js
db["restaurants"].find({"grades.score": {$lte: 10}}).count()

db.restaurants.find( {"grades.score" : { $not: {$gt : 10} } }).count()
```

恩..........., 两者竟然是不一样的.

题目应该问的是: 所有的分都不超过10.

`$lte:10` 应该是只要有一个(存在)`<=10` 就成立


遇到这种事件,应该首先查文档: https://www.mongodb.com/zh-cn/docs/manual/reference/operator/query/not/,但文档上没有说.

`find({ "grades.score": {$gt : 10} })` 表示的意思其实是: $\exists (x > 10)$

`find({ "grades.score": {$not :{ $gt : 10} }})` 表示的意思其实是: $\neg \exists (x > 10) \to \forall (x<=10)$,这样就能理解了

