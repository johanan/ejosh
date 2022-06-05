---
id: 1312
title: 'Functional Mad Libs'
date: '2017-01-07T12:35:29-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1312'
permalink: /2017/01/functional-mad-libs/
dsq_thread_id:
    - '5444070136'
categories:
    - Javascript
tags:
    - functional
---

<div class="action-button">[Download](https://github.com/johanan/Functional-Mad-Libs) the src(github)</div><div class="action-button">[View](https://johanan.github.io/Functional-Mad-Libs/) the demo</div>I am continuing my path towards functional programming that I have been dabbling with the last year or so. This usually meant I would build things object-oriented for the most part, but then anytime an Array popped up I would transform it using functional patterns. This is pretty easy and does not force me to get uncomfortable. Although it is still very useful as there are many times collections come up. I just finished a great book called Functional Programming in JavaScript which I have [reviewed](https://ejosh.co/de/2016/12/secret-functional-programming-javascript/). I learned new ways of writing code and I want to try them out.

Which leads me to the focus of this post. I have built a functional Mad Libs site. This came from a joke filled conversation at work about Mad Libs. The great thing about Mad Libs is that it is a perfect functional problem. There is a list of words. Some of the words need to be replaced. Get new words. Then replace the old with the new. This is an easy computational problem. I wanted to make the entire process as functional as I could. Let’s get started.

This is not an intro to functional programming. Many blog posts have been written and I do not think that I would add much to what has already been said. The purpose of this is to show an application written in a functional manner. If functional programming is new to you, either read [Functional Programming in JavaScript](https://www.manning.com/books/functional-programming-in-javascript), watch the first few videos by [Mattias Petter Johansson(funfunfunction)](https://www.youtube.com/channel/UCO1cgjhGzsSYb1rsB4bFe4Q/videos), or choose any of the top articles on [Medium about Functional Programming](https://medium.com/tag/functional-programming).

## Ramda

I want to start with [Ramda](http://ramdajs.com/). The Mad Libs site could not have been built without Ramda. It is the most used tool/utility/glue/peanut butter of the site. Ramda is usually pulled in as the variable `R` and if you look at the code you will see `R` everywhere. I don’t think I will write JavaScript without Ramda again, it’s that good. Ramda should have the type of ubiquitousness of jQuery.

So, what is Ramda? It is a function toolkit. Ramda will make every function you write more powerful. There is similar functionality to Lodash or underscore. The difference is that Ramda is more tightly focused on functional composition. Here is a quote from the official Ramda site.

> There are already several excellent libraries with a functional flavor. Typically, they are meant to be general-purpose toolkits, suitable for working in multiple paradigms. Ramda has a more focused goal. We wanted a library designed specifically for a functional programming style, one that makes it easy to create functional pipelines, one that never mutates user data.

A core example that will become clear as the post goes on is the fact that Ramda has the collection as the last parameter of map whereas Lodash has the collection first. A simple, almost meaningless difference on the face of it, but it makes a huge difference in composition.

I would be remiss if I did not note that Lodash has a functional FP module that is similar to Ramda. This is not a “Lodash sucks” post. I recommend Ramda and the rest of the post will explicitly use Ramda, but either of these libraries will orient you in the correct direction when writing functional JavaScript code.

## The code

Let’s jump into the actual code. First, we will start at the lowest level with some basic functions that are the core building blocks. Then we will add in some helper functions. Finally, we will have compositions of compositions of functions.

### The basic functions

The functions we will look at next really are the most basic building blocks of the application. Despite the fact that the are really important, the functions are actually really simple. This is one of the greatest advantages when building functionally. Let’s take a look at these functions.

```
<pre class="brush: jscript; title: basic_functions.js; notranslate" title="basic_functions.js">
module.exports.filterFunc = (type, term) =&amp;amp;amp;gt; term.pos[type] !== undefined;
module.exports.addField = (field, term, value) =&amp;amp;amp;gt; {
  return Object.assign({}, term, {[field]: value})
};
module.exports.filterMadLib = (term) =&amp;amp;amp;gt; term.MadLib;
```

There are three functions here. Two are functions that will fit right into filters and the other creates a new object based on another object with a property name and value of our choice. This is it. Almost quite literally, everything else is just functions composed together.

### Splitting functions

There are two other functions that I needed to create. They filled the need of splitting an array, applying a function to a part of it, and then recombining the array back. This happens when marking certain words as Mad Libs and also when replacing the words. Here are the functions.

```
<pre class="brush: jscript; title: higher_order_functions.js; notranslate" title="higher_order_functions.js">
const R = require('ramda');

module.exports.splitArray = R.curry((func, a) =&amp;amp;amp;gt; {
  return [R.filter(func, a), R.filter(R.complement(func), a) ];
});
module.exports.applyCombine = R.curry((func, a) =&amp;amp;amp;gt; {
  return [func(a[0]), a[1]];
});
```

We are using Ramda here so we require it. We will go into curry in the next section, so we will not waste any space here. Both of these functions are really simple. We filter an array and then use `R.complement` which will return the opposite of the boolean value. This means that we split the array exactly in two based on one function. Then we have a function that will execute something against the first element of an array. These are designed to be used together. First split the array with `splitArray` then apply a function to the ‘matched’ items. All without filtering out the unmatched items.

## Combine, Combine, Combine!

At this point, we can start making some more useful functions. The functions we have covered have value, but it may be hard to see. We will create functions that are technically just a string of functions executed in a certain order. Then we will take those and combine them into another function. Which then will be combined with another, and so on. Until we have one function that kicks off the entire application.

### R.compose

There is one thing that we have to have a complete understanding on and that is `compose` in the Ramda toolkit. This is a function we will use many times from here out. The purpose of the function is to take a number of functions and execute them in order. `compose` will take the return value of each function and then pass it in as a parameter to the next function. Long story short it takes this: `function3(function2(function1(x)))` and turns it into this: `R.compose(function3, function2, function1)(x)`.

Some people may be thrown by the fact that the order of the functions is the opposite of the execution order. Although hopefully my example shows an easy way to think about the order. `compose` takes the functions in the same order as you would normally write a chain of functions. A key thing to note is that we could have stored the function returned as the output of `compose` in a variable. This allows us to easily pass that set of functions around as a contained block. Let’s start combining.

### Curry

It is very important to note that composing functions in this way only allows you to pass into the next function the output of the previous. So how do we get other parameters into functions? This is where currying comes in. Currying a function means turning a function that takes `n` parameters into `n` functions that take one parameter.

Personally, I have found the most productive way to think of currying as incrementally executing a function over time. There are times when we know what to do, but we do not have all the variables to use. We can then store the curried function and use it later.

Using code we have already looked at we will examine `filterFunc`. This function takes two parameters, type and term. We will know what type we will want to filter on right away so we can curry the function and pass that parameter in now. Then we will need to store the new curried function and use it in a filter. Remember that filter will only pass in one parameter, the current item. This allows us to build a generic function and then make it more specific by adding different parameters.

If you are still a little unclear, you can watch this video by [Mattias Petter Johansson](https://www.youtube.com/watch?v=iZLP4qOwY8I)

### Processing Text

The first problem we will tackle is getting a string of text into a format that we can use. This means turning the string of text into an array of words along with what form of speech they are. Then taking that array and determining which ones are selected to be used in the Mad Lib. Finally replacing the words flagged as Mad Libs with the new words. Here is the first function in the file text\_functions.js. I will present each function with variables that are needed.

```js
const R = require('ramda');
const nlp_compromise = require('nlp_compromise');

//Actual functional steps
module.exports.getTerms = R.compose(
  R.flatten,
  R.curry(R.map)(R.prop('terms')),
  R.prop('sentences'),
  nlp_compromise.text
);
```

We will be using the library [nlp compromise](http://nlp-compromise.github.io/website/). It will do natural language processing on any text. This will be used to determine what part of speech each word is. This is the first function used. `text` will turn a string of text into an array of objects that map to each sentence with each sentence have an array of terms. This is what the next functions do, take just the array of sentences and then map over each one get the array of terms. We now have an array of arrays which we will flatten into just one array. We have a function that turns a string into an array of nlp compromise objects.

Next, we want to flag certain words as Mad Libs based on an array of indexes.

```js
const R = require('ramda');
const nlp_compromise = require('nlp_compromise');
const {splitArray, applyCombine} = require('./higher_order_functions.js');
const {filterFunc, addField, filterMadLib} = require('./basic_functions.js');

//these are all needed for text functions
let addIndexField = R.partial(addField)(['Index']);
let mapIndexed = R.curry(R.addIndex(R.map));
let addIndex = mapIndexed(addIndexField);
let addMadLib = R.flip(R.curry(addField)('MadLib'))(true);
let matchMadLib = R.curry((field, madLibArray, term) =&amp;amp;amp;gt; {
  return madLibArray.indexOf(term[field]) !== -1;
})('Index');

module.exports.processText = R.curry((madIndexes, terms) =&amp;amp;amp;gt; {
  return R.compose(
    R.curry(R.sortBy)(R.prop('Index')),
    R.flatten,
    applyCombine(R.map(addMadLib)),
    splitArray(matchMadLib(madIndexes)),
    addIndex
  )(terms);
});
```

This function is a little more complex. First off there are five functions that are created before the definition. This is so that we can easily call them.

`addIndex` is the first and maybe the most unclear. We see that it just calls `mapIndexed` with `addIndexField`. Well what are each of these? `mapIndexed` is just map but it is called with the item and index of the array. `addIndexField` calls `addField` (one of our basic functions) that has the first parameter applied with the string Index. This means that it is expecting two more values, term and value. Well, guess what `mapIndexed` does? It calls the function with a term and the index which is then added to the object. Here is a breakdown of what is happening.

```js
let terms = []; //this is the array of all the terms nlp compromise found
//imagine it has a bunch of terms
terms.map((term, i) =&amp;amp;amp;gt; {
  return addField('Index', term, i);
}); //the builtin map has the index already defined
```

The only difference in the way it is defined in the project is that each step of that process is incrementally defined.

Next, we split the array in two between any terms that have an index in our array of Mad Libs indexes. If we had the first and third word, then the array would be `[0,2]`. This would split out the zero and second indexed word. After that, we add a field to the matched items named MadLib with a value of true. The final steps are to flatten the array and then sort it by the index we added in the beginning. To reiterate a functional concept, simple functions are composed together to create complex behaviors. This is true even if none of the functions are complex.

Finally, we can replace the text.

```js
const R = require('ramda');
const nlp_compromise = require('nlp_compromise');
const {splitArray, applyCombine} = require('./higher_order_functions.js');
const {filterFunc, addField, filterMadLib} = require('./basic_functions.js');

let findMadLibWord = R.curry((wordArray, mapFunc, term, idx) =&amp;amp;amp;gt; {
  let w = wordArray[idx];
  return mapFunc(term, w);
});

module.exports.replaceText = R.curry((madIndexes, madWords, terms) =&amp;amp;amp;gt; {
  //prep before running replace
  //needs to be computed each run
  let fixedWords = R.compose(
    R.map(R.last),
    R.sortBy(R.nth(0))
  )(R.zip(madIndexes, madWords));

  let updateText = findMadLibWord(fixedWords, R.curry(addField)('text'));
  return R.compose(
    R.curry(R.sortBy)(R.prop('Index')),
    R.flatten,
    applyCombine(mapIndexed(updateText)),
    splitArray(filterMadLib)
  )(terms);
});
```

This one is a little more complex. We have to prep two functions each time this runs as the inputs will be different. The inputs will be three arrays, the indexes of the Mad Lib words, another of the words to use to replace, and then the terms.

The first step is to fix the order of the words to replace. We zip it together with indexes and words and then sort them based on the index. This is because when we replace the text we will do it in order of the words in the text.

The next function is `updateText`. This will create a new function that will use the array of words and an index, lookup that word at the index, and replace the text property on the object. This is the actual replace action. I want to draw attention to the fact that this done without modifying the current object. We are using our basic function `addField` which creates a new object based on the old one.

The final step is to compose everything together. Much like `processText`, we split the array, run a function on one side, and then put it back together again.

Hopefully, that makes sense and did not scare anyone away. From here on out the composition is easier and clearer. Some of these functions have three and four parameters that are being bound at different times. This means that a function may be used three times before it is actually executed. That can be difficult to follow.

### Text into elements

The next step is to compose the functions we just built. The end result will be functions that take a string of text and turn it into an array of words. Here is the code.

```js
const R = require('ramda');
const {getTerms, processText, replaceText} = require('./text_functions.js');
const filterMadLib = require('./basic_functions.js').filterMadLib;

//render functions
module.exports.createRenderElements = (indexes, text) =&amp;amp;amp;gt; {
  return R.compose(
    processText(indexes),
    getTerms
  )(text);
};

module.exports.enterRenderElements = (indexes, words, text) =&amp;amp;amp;gt; {
  return R.compose(
    R.zip(words),
    R.map((p) =&amp;amp;amp;gt; Object.keys(p).join(' ')),
    R.map(R.prop('pos')),
    R.filter(filterMadLib),
    processText(indexes),
    getTerms
  )(text);
};

module.exports.doneRenderElements = (indexes, words, text) =&amp;amp;amp;gt; {
  return R.compose(
    replaceText(indexes, words),
    processText(indexes),
    getTerms
  )(text);
};
```

`createRenderElements` and `doneRenderElements` are the simplest. These functions just get the terms using nlp compromise, process the text to flag Mad Libs, and in `doneRenderElements` replace the text. `enterRenderElements` has one detour. Because this function is going to create the input elements for the new words we want the type of speech and the current value. We do this by getting the type of speech from the property pos and zip it with the current words. The output of these functions is perfect for mapping straight to the DOM.

## Wrapping up

That brings us to the end of this post. First of all, this post is getting quite long so I need to break it into two. Secondly, we will change focus in the next post. The goal of this post was to introduce the idea of building a functional application along with a little code. The code shown is the backend engine for this application. We can take text and run it through the three steps of Mad Libs, the creation of the words to use, entering in new words, and replacing those words. The problem is that we have no way to show this to a user.

That is where we will start in the next post. We will see how to turn this array of words into a user interface. In the process of doing this, we will cover the basics of React and Redux. The core paradigm of these libraries are functional in nature and I will show what this means and how it is accomplished.

Stay tuned as I will update this post with next article.