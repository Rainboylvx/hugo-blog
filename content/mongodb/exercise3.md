---
title: "MongoDB 练习 3"
date: 2025-09-04
tags: ["MongoDB", "Exercises"]
toc: true
---

## 41


> Write a MongoDB query to find the restaurants that have a grade with a score of 2 and a grade with a score of 6 and are located in the borough of Manhattan or Brooklyn, and their cuisine is not American.

没有什么难度

```js
db.restaurants.find({
    $and: [
        {borough: {$in: ["Manhattan", "Brooklyn"]}},
        {"grades.score": {$all: [2, 6]}},
        {cuisine: {$ne: "American"}}
    ]
})
```

这里用到了`$all`运算符, 表示后面的值`[2,6]`都要单独同时匹配


## 42

> Write a MongoDB query to find the restaurants that have a grade with a score of 2 and a grade with a score of 6 and are located in the borough of Manhattan or Brooklyn, and their cuisine is not American or Chinese.


```js
db.restaurants.find({
  $and: [
{ borough: { $in: ["Manhattan", "Brooklyn"] } },
{ cuisine: { $nin: ["American", "Chinese"] } },
{ grades: { $elemMatch: { score: 2 } } },
{ grades: { $elemMatch: { score: 6 } } }
  ]
})
```


### 43

> Write a MongoDB query to find the restaurants that have a grade with a score of 2 or a grade with a score of 6.

```js
db.restaurants.find({
    $or: [
{ "grades.score": 2 },
{ "grades.score": 6 }
    ]
})
```

## 44

> Write a MongoDB query to find the restaurants that have a grade with a score of 2 or a grade with a score of 6 and are located in the borough of Manhattan.

没有什么难度

```js
db.restaurants.find({
    $and: [
        {
            $or: [
{ "grades.score": 2 },
{ "grades.score": 6 }
            ]
        },
{ "borough": "Manhattan" }
    ]
})
```


## 45



>  Write a MongoDB query to find the restaurants that have a grade with a score of 2 or a grade with a score of 6 and are located in the borough of Manhattan or Brooklyn.


```js
db.restaurants.find({
  $and: [
    {
      $or: [
{ borough: "Manhattan" },
{ borough: "Brooklyn" }
      ]
    },
    {
      $or: [
{ "grades.score": 2 },
{ "grades.score": 6 }
      ]
    }
  ]
})
```


## 48

> Write a MongoDB query to find the restaurants that have all grades with a score greater than 5.


这个是比较有意思的查询: 所有`grade.score`都要大于5

正确的查询数组里的值,都是`存在`,现在要转成`\forall`



```js
db.restaurants.find({
  "grades": {
    "$not": {
      "$elemMatch": {
        "score": {
          "$lte": 5
        }
      }
    }
  }
})
```

## 49

> Write a MongoDB query to find the restaurants that have all grades with a score greater than 5 and are located in the borough of Manhattan.

多个条件,关键就在于这个条件:所有的

## 50

> Write a MongoDB query to find the restaurants that have all grades with a score greater than 5 and are located in the borough of Manhattan or Brooklyn.

不难,这里有一个条件,或者

```js
db.restaurants.find({
  "borough": {
    "$in": ["Manhattan", "Brooklyn"]
  },
  "grades": {
    "$not": {
      "$elemMatch": {
        "score": {
          "$lte": 5
        }
      }
    }
  }
})
```
