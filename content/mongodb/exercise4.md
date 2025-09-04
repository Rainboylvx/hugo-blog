---
title: "MongoDB 练习 4"
date: 2025-09-04
tags: ["MongoDB", "Exercises"]
toc: true
---

## 51

> Write a MongoDB query to find the average score for each restaurant.

一个数组的平均值


这里我遇到的第一个 `aggregate`

```js
db.restaurants.aggregate([{
    $unwind: "$grades"
  },
  {
    $group: {
      _id: "$name",
      avgScore: {
        $avg: "$grades.score"
      }
    }
  }
])
```

这里gpt给出的多种求平均值的方法

在 MongoDB 中，要求数组的平均值可以使用 **聚合框架** 来处理。MongoDB 的聚合框架提供了强大的数据操作功能，包括计算数组中元素的平均值。可以通过以下几种方式来实现：

### 假设我们有以下文档集合：

```json
{
  "_id": 1,
  "scores": [90, 80, 70, 85]
},
{
  "_id": 2,
  "scores": [60, 75, 85, 90]
}
```

### 方法 1：使用 `$avg` 操作符

MongoDB 的聚合框架允许在管道中使用 `$avg` 操作符来计算某个数组的平均值。为了计算数组 `scores` 的平均值，我们需要先将数组元素展开（使用 `$unwind`），然后计算平均值。

### 聚合管道示例：

```javascript
db.collection.aggregate([
  {
    $project: {
      averageScore: { $avg: "$scores" }
    }
  }
])
```

### 解释：
1. **`$project`**：用于指定输出的字段，在这里我们指定了一个新字段 `averageScore`。
2. **`$avg`**：用于计算指定字段的平均值。在这里，我们应用 `$avg` 操作符来计算 `scores` 数组的平均值。

### 方法 2：使用 `$unwind` 与 `$group` 来求平均值

如果你想更细粒度地处理数组中的元素，可以使用 `$unwind` 来展平数组，然后使用 `$group` 来求数组的平均值。

#### 聚合管道示例：

```javascript
db.collection.aggregate([
  { $unwind: "$scores" },
  { $group: { _id: null, averageScore: { $avg: "$scores" } } }
])
```

### 解释：
1. **`$unwind`**：将 `scores` 数组中的每个元素展平为单独的文档。每个文档将包含一个数组元素。
2. **`$group`**：将所有展平后的文档组合在一起，并使用 `$avg` 来计算这些文档中 `scores` 字段的平均值。

这个方法适用于当你希望对数组中的所有元素进行处理并计算平均值的情况。

### 方法 3：直接计算字段的平均值

如果数组字段本身已经包含了所有的数值，且你只想计算这个数组字段的平均值，而不是数组中的每个元素，可以直接在 `aggregate` 阶段中计算平均值：

#### 示例：

```javascript
db.collection.aggregate([
  {
    $project: {
      averageScore: { $avg: "$scores" }
    }
  }
])
```

### 总结：
- **`$avg`** 用于计算一个数值字段的平均值，可以直接在聚合管道中对数组字段进行操作。
- **`$unwind` + `$group`** 适用于需要将数组元素分开处理，并求所有元素的平均值。

根据需求选择适合的方法，通常情况下，直接使用 `$avg` 对数组字段求平均值最为简单和高效。

## 52

>　Write a MongoDB query to find the highest score for each restaurant.

这里用到了 `$group`阶段的`$max`操作

```js
db.restaurants.aggregate([{
    $unwind: "$grades"
  },
  {
    $group: {
      _id: "$name",
      highest_score: {
        $max: "$grades.score"
      }
    }
  }
])
```


## 53

> Write a MongoDB query to find the lowest score for each restaurant.

和上一个题目一样，用`$min`

```js
db.restaurants.aggregate([{
    $unwind: "$grades"
  },
  {
    $group: {
      _id: "$name",
      lowest_score: {
        $min: "$grades.score"
      }
    }
  }
])
```

## 54

> Write a MongoDB query to find the count of restaurants in each borough.

用到了count

```js
db.restaurants.aggregate([{
  $group: {
    _id: "$borough",
    count: {
      $sum: 1
    }
  }
}])
```

## 55


> Write a MongoDB query to find the count of restaurants for each cuisine.

只是用到了`$sum`


```js
db.restaurants.aggregate([{
  $group: {
    _id: "$cuisine",
    count: {
      $sum: 1
    }
  }
}])
```

## 56 如何按两个值进行分组


```js
db.restaurants.aggregate([{
  $group: {
    _id: {
      cuisine: "$cuisine",
      borough: "$borough"
    },
    count: {
      $sum: 1
    }
  }
}])
```

## 57 多阶段配合

> Write a MongoDB query to find the count of restaurants that received a grade of 'A' for each cuisine.

多阶段

1. unwind
2. match
3. group

```js
db.restaurants.aggregate([
  {
    $unwind: "$grades"
  },
  {
    $match: { "grades.grade": "A" }
  },
  {
    $group: {
      _id: "$cuisine",
count: { $sum: 1 }
    }
  }
])
```

## 58 同上

> Write a MongoDB query to find the count of restaurants that received a grade of 'A' for each borough.

```js
db.restaurants.aggregate([
  {
    $unwind: "$grades"
  },
  {
    $match: { "grades.grade": "A" }
  },
  {
    $group: {
      _id: "$borough",
count: { $sum: 1 }
    }
  }
])
```

## 59

> Write a MongoDB query to find the count of restaurants that received a grade of 'A' for each cuisine and borough.

聚合确实能达到

这里没有unwind


```js
db.restaurants.aggregate([
  {
    $match: { "grades.grade": "A" }
  },
  {
    $group: {
      _id: { cuisine: "$cuisine", borough: "$borough" },
count: { $sum: 1 }
    }
  },
  {
    $sort: { count: -1 }
  }
]);
```

## 60

> Write a MongoDB query to find the number of restaurants that have been graded in each month of the year.

问一年中，每个月分评级的restaurants分别有多少个,那显然要`$group`

```js
db.restaurants.aggregate([
  {
    $unwind: "$grades"
  },
  {
    $project: {
month: { $month: { $toDate: "$grades.date" } },
year: { $year: { $toDate: "$grades.date" } }
    }
  },
  {
    $group: {
      _id: { month: "$month", year: "$year" },
count: { $sum: 1 }
    }
  },
  {
    $sort: {
      "_id.year": 1,
      "_id.month": 1
    }
  }
]);
```

## 61-66 平均分,最高低分

上面求过了

## 67

> Write a MongoDB query to find the name and address of the restaurants that received a grade of 'A' on a specific date

查询一个array里满足特定条件的。

```js
db.restaurants.find(
  {
    "grades": {
      "$elemMatch": {
        "date": {
          "$eq": ISODate("2013-07-22T00:00:00Z")
        },
        "grade": {
          "$eq": "A"
        }
      }
    }
  },
  {
    "name": 1,
    "address": 1,
    "_id": 0
  }
)
```

## 68

> Write a MongoDB query to find the name and address of the restaurants that received a grade of 'B' or 'C' on a specific date.


```js
db.restaurants.find(
   {
     "grades": {
       $elemMatch: {
         "date": ISODate("2013-04-05"),
         "grade": { $in: [ "B", "C" ] }
       }
     }
   },
   {
     "name": 1,
     "address": 1
   }
)
```

## 69

> Write a MongoDB query to find the name and address of the restaurants that have at least one 'A' grade and one 'B' grade.

啊！ 查询数组里： 至少含有一个A，且至少含有一个B ,`\exits A in arr \and \exits B in arr`


## 70


> Write a MongoDB query to find the name and address of the restaurants that have at least one 'A' grade and no 'B' grades.

`one A no B`.两个条件同时成立

no b -> `not exits b in Arr` -> `{$not : { "grades.score" : 'A'}`


和我想的差不多

```js
db.restaurants.find({
  $and: [
{ "grades.grade": "A" },
{ "grades.grade": { $not: { $eq: "B" } } }
  ]
},
{ name: 1, address: 1, _id: 0 })
```


## 71

> Write a MongoDB query to find the name ,address and grades of the restaurants that have at least one 'A' grade and no 'C' grades.

同上

```js
db.restaurants.find({
  $and: [
{ "grades.grade": "A" },
{ "grades.grade": { $not: { $eq: "C" } } }
  ]
},
{ name: 1, address: 1, "grades.grade":1, _id: 0 })
```

## 72

> Write a MongoDB query to find the name, address, and grades of the restaurants that have at least one 'A' grade, no 'B' grades, and no 'C' grades.

同上

```js
db.restaurants.find({
  $and: [
{ "grades.grade": "A" },
{ "grades.grade": { $not: { $eq: "B" } } },
{ "grades.grade": { $not: { $eq: "C" } } }
  ]
},
{ name: 1, address: 1, "grades.grade":1, _id: 0 })
```

## 73

> Write a MongoDB query to find the name and address of the restaurants that have the word 'coffee' in their name

正则

```js
db.restaurants.find({ name: { $regex: /coffee/i } }, { name: 1, address: 1 })
```


## 74

> Write a MongoDB query to find the name and address of the restaurants that have a zipcode that starts with '10'.

这里我觉得官方给的答案不对。


## 75


> Write a MongoDB query to find the name and address of the restaurants that have a cuisine that starts with the letter 'B'.

```js
db.restaurants.find(
	{ "cuisine": { $regex: /^B/ } },
	{ "name": 1,
	"address": 1,
	"cuisine" : 1,
	"_id": 0 }
)
```

## 76  77 正则

没有什么好写的


## 78


找最大值，那就需要排序


```js
db.restaurants.aggregate([
  {$unwind: "$grades"},
  {$group: {
    _id: "$restaurant_id",
avgScore: {$avg: "$grades.score"}
  }},
  {$sort: {avgScore: -1}},
  {$limit: 1},
  {$project: {_id: 1, avgScore: 1}}
])
```


## 79

找最大的值A的那些restaurants的id，用到聚合


```js
db.restaurants.aggregate([
  {$unwind: "$grades"},
  {$match: {"grades.grade": "A"}},
  {$group: {
    _id: "$restaurant_id",
count: {$sum: 1}
  }},
  {$sort: {count: -1}},
  {$group: {
    _id: "$count",
restaurants: {$push: "$_id"}
  }},
  {$sort: {_id: -1}},
  {$limit: 1},
  {$project: {restaurants: 1}}
])
```

## 80


> Write a MongoDB query to find the cuisine type that is most likely to receive a 'C' grade.

哪个区域的C最多,用到了聚合

```js
db.restaurants.aggregate([
  {$unwind: "$grades"},
  {$match: {"grades.grade": "C"}},
  {$group: {_id: "$cuisine", count: {$sum: 1}}},
  {$sort: {count: -1}}
])
```


## 81


> Write a MongoDB query to find the restaurant that has the highest average score for thecuisine "Turkish".

聚合。

## 82

> Write a MongoDB query to find the restaurants that achieved the highest total score.


连续的聚合,聚合就是一种管道。

```js
db.restaurants.aggregate([
{ $unwind: "$grades" },
{ $group: {
    _id: "$name",
totalScore: { $sum: "$grades.score" }
  }},
{ $sort: { totalScore: -1 } },
{ $group: {
    _id: "$totalScore",
restaurants: { $push: "$_id" }
  }},
{ $sort: { _id: -1 } },
{ $limit: 1 },
{ $unwind: "$restaurants" },
{ $group: {
    _id: "$_id",
restaurants: { $push: "$restaurants" }
  }}
])
```

## 83
