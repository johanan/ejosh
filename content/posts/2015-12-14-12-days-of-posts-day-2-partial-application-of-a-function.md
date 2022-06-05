---
id: 1148
title: '12 Days of Posts: Day 2 – Partial application of a function'
date: '2015-12-14T20:04:38-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1148'
permalink: /2015/12/12-days-of-posts-day-2-partial-application-of-a-function/
dsq_thread_id:
    - '4406317155'
categories:
    - Javascript
---

This day’s post is a continuation of the last post. In the last post we covered that a function can return a function, but we did not cover any use cases. This post will discuss a very useful one.

We have an add function:

```js
function add(x, y){
  return x + y;
}
```

We can partially apply one of the parameters and return a new function. To reinforce what this means we will look at an example.

```js
function partiallyApply(param, func){
  return function(nextParam){
    return func(nextParam, param);
  }
}

var addOne = partiallyApply(1, add);
```

The variable `addOne` takes the add function and partially applies one of the parameters (y is now always 1). When we execute `partiallyApply` we bind the first parameter and return a new function which allows us to bind the other parameter later. This means we can do this:

```js
addOne(5);
//returns 6
addOne(10);
//returns 11
var addTen = partiallyApply(10, add);
addTen(5);
//returns 15
```

What good is this? Well we essentially are passing in parameters over two separate points in time. I had a problem where I needed an index for an item in a list and the event object. The issue was that I did not have these two things at the same time. The event object is only created in response to an event. I partially applied the index first which returned a function that would accept the event object. I have the code in the [react\_components.js](https://github.com/johanan/Where-to-eat/blob/master/js_src/react_components.js#L221) file in my [Where to eat repository](https://github.com/johanan/Where-to-eat).

The next post will continue the JavaScript theme.