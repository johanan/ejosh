---
id: 1186
title: '12 Days of Posts: Day 8 – functional vs imperative'
date: '2015-12-20T13:17:16-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1186'
permalink: /2015/12/12-days-of-posts-day-8-functional-vs-imperative/
dsq_thread_id:
    - '4420234178'
categories:
    - Uncategorized
---

I would say that I am like most programmers, in that I have been trained to program in an imperative way. There is nothing wrong with this.

There is another programming paradigm and that is functional. If you have only programmed imperatively, functional programming forces you to reason about your application differently. Functional programming relies on the concepts of immutable data and creating no side effects.

I am not making this post to declare a winner between these two. I feel they both have their places in this world. I do feel very strongly that knowing both is strictly better than just knowing one of them. Especially if the only one you know is imperative.

Let’s look at a short functional vs imperative exercise here. We will use JavaScript, which the language itself is almost a mixture of functional and imperative ideas all thrown together, for this example. The main concept we will look at here is not modifying state.

We will compare JavaScript’s array methods `slice` and `splice`. `slice` is functional in that when executed it does not modify the array. `splice` is not because it modifies the array. This may seem like much, but it is a very important distinction.

Imperatively the thought is that we need to remove an element from the array. That is exactly what `splice` does. Functionally we will create a new array with the elements that we need. There are no side effects by doing this.

Here is the example in code:

```js
function Slice() {
  var array = [1, 2, 3, 4, 5];
  console.log(array.slice(0, 3));
  console.log(array.slice(0, 3));
  console.log(array.slice(0, 3));
}

function Splice() {
  var array = [1, 2, 3, 4, 5];
  console.log(array.splice(0, 3));
  console.log(array.splice(0, 3));
  console.log(array.splice(0, 3));
}

console.log('This is functional');
Slice();
console.log('This is not');
Splice();
```