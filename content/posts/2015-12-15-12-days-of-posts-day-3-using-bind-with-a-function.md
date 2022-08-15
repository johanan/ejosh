---
id: 1158
title: '12 Days of Posts: Day 3 – using bind with a function'
date: '2015-12-15T21:57:11-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1158'
permalink: /2015/12/12-days-of-posts-day-3-using-bind-with-a-function/
dsq_thread_id:
    - '4505170309'
categories:
    - Javascript
---

We are already at day 3. We are continuing with JavaScript and building on what we have already covered. We are going to cover the bind method of the function object.

Bind is used to define what `this` is inside of a function. It will return a new function (there is that ‘functions are a first class object’ idea again!) and not modify the current function. Let’s look at an example. Here is a simple function:

```js
function whatIsThis(){
  console.log(this);
}
whatIsThis()
//this will return the window object
```

The default `this` value for an anonymous function will be the `window` object. We will now bind a new value for `this` using bind:

```js
var newBoundWhatIsThis = whatIsThis.bind({property: 'Test'});
newBoundWhatIsThis();
//this will return Object {property: "Test"}
```

We have changed the value of `this` with bind. This will allow us to build functions that can operate on many different objects as long as the objects all have the same properties. Here is an example.

```js
var josh = {name: 'Josh'};
var brian = {name: 'Brian'};
function outputName(){
  console.log(this.name);
}

outputName.bind(josh)();
outputName.bind(brian)();
```

Here `outputName` can operate on both objects.

Finally we will use bind to partially apply parameters. This is the same concept as the last post. Any other parameters passed into bind will be prepended to the list of arguments when executed later. Here are the examples from the last post, but this time with bind.

```js
var boundAddOne = add.bind(window, 1);
boundAddOne(5);
//will return 6

var boundAddTen = add.bind(undefined, 10);
boundAddTen(5);
//will return 15
```

The `add` function does not do anything with `this` so it does not really matter what we use. We then pass in the first parameter so that a new function will be returned that will accept one parameter.