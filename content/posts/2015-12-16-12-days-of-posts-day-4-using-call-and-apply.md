---
id: 1163
title: '12 Days of Posts: Day 4 – using call and apply'
date: '2015-12-16T21:54:58-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1163'
permalink: /2015/12/12-days-of-posts-day-4-using-call-and-apply/
dsq_thread_id:
    - '4410645734'
categories:
    - Javascript
---

We have seen some ways that we can take advantage of JavaScript’s functional roots. This theme will continue for this post as we will look at `call` and `apply`.

`Call` and `apply` are very similar. Both methods will execute the function, set the `this` value and pass in parameters. `Call` does this by having the parameters each explicitly defined while `apply` takes an array of parameters. Here is an example using our trusty `add` function and `whatIsThis`.

```js
function add(x, y){
  return x + y;
}

function whatIsThis() {
  console.log(this);
}

console.log(add.call(undefined, 1, 2));
//returns 3
console.log(add.apply(undefined, [1, 2]));
//returns 3
console.log(whatIsThis.call({prop: 'test'}, null));
//returns Object {prop="test"}
console.log(whatIsThis.apply({prop: 'test'}, null));
//returns Object {prop="test"}
```

We can see the differences in execution, but the result will be exactly the same.

These examples are arbitrary so let’s build a little less arbitrary example. Let’s imagine that we have a comparing object that has a function to make a comparison. We want to make it so that the comparison function can be changed at a later point in time. We can use `apply` to make this easy. Here is that example.

```js
var newCompare = function(a,b) {return a>b;}

var comparer = {
  compareFunc: function() {
    return false;
  },
  compare: function compare(a, b) {
    return this.compareFunc.apply(this, [a, b]);
  }
}

console.log(comparer.compare(5,1));
//returns false
comparer.compareFunc = newCompare;
console.log(comparer.compare(5,1));
//returns true
```

The compare function just executes another function. This means that we can change it out whenever we need to. The best part is that the new function does not need to know about the current object as it will all of its context passed to it by `apply`.

I have a real world example of this in my Webcam library. The library has a draw function, but we can change it out whenever we want. The new function will have access to a canvas, the 2d context, the 3d context, and the video stream. We can see the code on [line 130 in video.js](https://github.com/johanan/WebCamVidja/blob/master/src/video.js#L130).

Here are all the examples in jsFiddle.  
<iframe allowfullscreen="allowfullscreen" frameborder="0" height="300" loading="lazy" src="//jsfiddle.net/jjohanan/qnq4vnn0/embedded/" width="100%"></iframe>