---
title: "MongoDB 练习 2"
date: 2025-09-04
tags: ["MongoDB", "Exercises"]
toc: true
---

## 21

Write a MongoDB query to find the restaurant Id, name, borough and cuisine for those restaurants which prepared dish except 'American' and 'Chinees' or restaurant's name begins with letter 'Wil'.


```js
db.restaurants.find({
    $or : [
      {"name": /^Wil/},
      {"cuisine" : { $nin :["American ","Chinees"] }}
    ]
  })
```

这两个写法是一样的

```js
db.restaurants.find(
{$or: [
  {name: /^Wil/},
  {"$and": [
       {"cuisine" : {$ne :"American "}},
       {"cuisine" : {$ne :"Chinees"}}
   ]}
]}
,{"restaurant_id" : 1,"name":1,"borough":1,"cuisine" :1}
);
```

## 22

22. Write a MongoDB query to find the restaurant Id, name, and grades for those restaurants which achieved a grade of "A" and scored 11 on an ISODate "2014-08-11T00:00:00Z" among many of survey dates.

达到了 grade A 且 scored 11. 首先,我们要理解这里的意思到底是什么意思?

有三个条件:

- 时间: ISODate "2014-08-11T00:00:00Z
- 分值: 11
- grade: A

这里的关键在于,数组`grades`其中的一条满足这3个条件.那么里这里要用到的`$elemMatch`


```js
db.restaurants.find({
    grades:{ $elemMatch : { grade:'A',date:ISODate("2014-08-11T00:00:00Z"), scored: 11}}
  })

```

但是给出的答案是,理解我写在注释里

```js
db.restaurants.find(
    { // 这里是and
      "grades.date": ISODate("2014-08-11T00:00:00Z"), // 这里只要有一个数组的元素成立
      "grades.grade":"A" , // 这里只要有一个数组的元素成立
      "grades.score" : 11// 这里只要有一个数组的元素成立
    },
      {"restaurant_id" : 1,"name":1,"grades":1}
    );
```

这里怎么用数学描述: 设集合A为`A = [{},{},{},{}]`, 满足条件$a \in A \land b \in A \land c \in A$


## 23

Write a MongoDB query to find the restaurant Id, name and grades for those restaurants where the 2nd element of grades array contains a grade of "A" and score 9 on an ISODate "2014-08-11T00:00:00Z".


arrayElemAt（如果你需要明确选择数组中的特定元素）

如果你明确只想要查询数组的第二个元素，elemMatch 不能直接做这件事。不过，你可以结合 $arrayElemAt 来选择数组中的第二个元素进行条件匹配：

```js
db.collection.find({
  "$expr": {
    "$eq": [
      { "$arrayElemAt": ["$grades", 1] },  // 获取第二个元素
      { "grade": "A", "score": 9, "date": ISODate("2014-08-11T00:00:00Z") }  // 条件
    ]
  }
})
```

那么还是官方给的答案比较简单:

```js
db.restaurants.find(
                      { "grades.1.date": ISODate("2014-08-11T00:00:00Z"),
                        "grades.1.grade":"A" ,
                        "grades.1.score" : 9
                      },
                       {"restaurant_id" : 1,"name":1,"grades":1}
                   );

```

## 24

Write a MongoDB query to find the restaurant Id, name, address and geographical location for those restaurants where 2nd element of coord array contains a value which is more than 42 and upto 52.

没有争议
```js
db.restaurants.find(
                      {
                        "address.coord.1": {$gt : 42, $lte : 52}
                      },
                        {"restaurant_id" : 1,"name":1,"address":1,"coord":1}
                   );
```



## 25,26

> - Write a MongoDB query to arrange the name of the restaurants in ascending order along with all the columns.
> - Write a MongoDB query to arrange the name of the restaurants in descending along with all the columns.

就是排序而已

```js
db.restaurants.find().sort({"name":1});
db.restaurants.find().sort( {"name":-1});
```


## 27

> Write a MongoDB query to arranged the name of the cuisine in ascending order and for that same cuisine borough should be in descending order.

还是排序,不过同时要排序两个元素


```js
db.restaurants.find().sort(
                           {"cuisine":1,"borough" : -1,}
                          );
```


## 28

>  Write a MongoDB query to know whether all the addresses contains the street or not.

查询元素的存在性

```js
db.restaurants.find( {"address.street" : { $exists : true } } );
```

## 29

> Write a MongoDB query which will select all documents in the restaurants collection where the coord field value is Double.


查询元素的类型


对于 field 为数组的文档，`$type` 返回的文档中至少有一个数组元素与传递给 `$type` 的类型匹配。

对 $type: "array" 的查询会返回字段本身为数组的文档。

[$type — MongoDB 手册 v8.0](https://www.mongodb.com/zh-cn/docs/manual/reference/operator/query/type/)


```js
db.restaurants.find( {"address.coord" : {$type : 1} });
```


## 30

> Write a MongoDB query which will select the restaurant Id, name and grades for those restaurants which returns 0 as a remainder after dividing the score by 7.

这里用到了 [$mod - MongoDB 手册 v8.0](https://www.mongodb.com/zh-cn/docs/manual/reference/operator/query/mod/)


```js
db.restaurants.find(
                      {"grades.score" :
                         {$mod : [7,0]}
                      },
                         {"restaurant_id" : 1,"name":1,"grades":1}
                    );

```

## 31

> Write a MongoDB query to find the restaurant name, borough, longitude and attitude and cuisine for those restaurants which contains 'mon' as three letters somewhere in its name.

正则查询

```js
db.restaurants.find(
                   { name :
                     { $regex : "mon.*", $options: "i" }
                   },
                       {
                         "name":1,
                         "borough":1,
                         "address.coord":1,
                         "cuisine" :1
                        }
                   );

```

## 32

> Write a MongoDB query to find the restaurant name, borough, longitude and latitude and cuisine for those restaurants which contain 'Mad' as first three letters of its name.

正则查询

```js
db.restaurants.find(
                   { name :
                     { $regex : /^Mad/i, }
                   },
                       {
                         "name":1,
                         "borough":1,
                         "address.coord":1,
                         "cuisine" :1
                        }
                   );
```


## 33

> Write a MongoDB query to find the restaurants that have at least one grade with a score of less than 5.

数组查询


```js
db.restaurants.find({ "grades.score": { $lt: 5 } })
```

## 34

> Write a MongoDB query to find the restaurants that have at least one grade with a score of less than 5 and that are located in the borough of Manhattan.

怎么变简单了?

```js
db.restaurants.find({ "grades.score": { $lt: 5 }, "borough": "Manhattan" })
```


## 35

> Write a MongoDB query to find the restaurants that have at least one grade with a score of less than 5 and that are located in the borough of Manhattan or Brooklyn.

还是简单


```js
db.restaurants.find({
  $and: [
    {
      $or: [ // 可以用$in
        {borough: "Manhattan"},
        {borough: "Brooklyn"}
      ]
    },
    {
      "grades.score": { $lt: 5 }
    }
  ]
})

```


## 36


> Write a MongoDB query to find the restaurants that have at least one grade with a score of less than 5 and that are located in the borough of Manhattan or Brooklyn, and their cuisine is not American.

官方给的这个答案,可以不用最外层的`$and`

```js
db.restaurants.find({
  $and: [
{ $or: [{ borough: "Manhattan" }, { borough: "Brooklyn" }] },
{ "grades.score": { $lt: 5 } },
{ cuisine: { $ne: "American" } }
  ]
})
```

## 37

> Write a MongoDB query to find the restaurants that have at least one grade with a score of less than 5 and that are located in the borough of Manhattan or Brooklyn, and their cuisine is not American or Chinese.


这里用到了`不是...,也不是....`这个也语法

[$nor - MongoDB 手册 v8.0](https://www.mongodb.com/zh-cn/docs/manual/reference/operator/query/nor/)

选择数组中所有查询谓词均未通过的文档

```
$nor :[ expr1 ,expr2...]
```

那么查询的文档满足的条件是：

```
expr1(doc1) == false and expr2(doc2) == false
```

## 38

> Write a MongoDB query to find the restaurants that have a grade with a score of 2 and a grade with a score of 6.

grades 含有2，和6


我写的
```js
db.restaurants.find({
    "grades.score": 2,
    "grades.score": 6,
  })
```

效果一样的官方答案。
```js
db.restaurants.find({
  $and: [
    {"grades.score": 2},
    {"grades.score": 6}
  ]
})
```

## 39


> Write a MongoDB query to find the restaurants that have a grade with a score of 2 and a grade with a score of 6 and are located in the borough of Manhattan.

没有什么难度


```js
db.restaurants.find({
  $and: [
    {"grades.score": 2},
    {"grades.score": 6},
    {"borough": "Manhattan"}
  ]
})
```

## 40

> Write a MongoDB query to find the restaurants that have a grade with a score of 2 and a grade with a score of 6 and are located in the borough of Manhattan or Brooklyn.

```js
db.restaurants.find({
  $and: [
    {"grades.score": 2},
    {"grades.score": 6},
    {"borough": {"$in": ["Manhattan", "Brooklyn"]}}
  ]
})
```

