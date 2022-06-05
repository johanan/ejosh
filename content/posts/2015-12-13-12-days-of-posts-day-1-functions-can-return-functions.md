---
id: 1138
title: '12 Days of Posts: Day 1 Functions can return functions'
date: '2015-12-13T19:28:28-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1138'
permalink: /2015/12/12-days-of-posts-day-1-functions-can-return-functions/
dsq_thread_id:
    - '4401536614'
categories:
    - Javascript
---

I am attempting to do something a little different. Right now everywhere you go there is something related to Christmas. This inspired me to challenge myself to write 12 short posts before Christmas. Here is the first.

## Functions can return functions

In JavaScript functions are [first class objects](http://stackoverflow.com/questions/705173/what-is-meant-by-first-class-object). For our purposes here that means that functions can be returned from other functions, used as parameters for other functions, and the value stored in a variable.

This means we can take a simple function like this:

```js
function add(x, y){
  return x + y;
}
```

This is a completely arbitrary function but we will build another function to return this one.

```js
function returnAFunction(){
  console.log('In returnAFunction');
  return add;
}
```

This just has a console call to let us know when we execute it and then it returns our `add` function.

Here are some things that we can do with this now:

```js
var returnedAdd = returnAFunction();
//console logs In returnAFunction
returnedAdd(1,2)
//the output would be 3
returnAFunction()(2,2)
//console logs In returnAFunction
//the output would be 4
```

First we capture the returned function as `returnedAdd`. We can then use that as if it was our `add` function. Next we execute `returnAFunction` and then immediately execute the returned function. This demonstrates the first class nature of functions. Functions are not some special type that must be defined first and then executed. We can pass functions around just like we would any other object.

Why would we do this? The post tomorrow will build on this idea and answer why would we do this.