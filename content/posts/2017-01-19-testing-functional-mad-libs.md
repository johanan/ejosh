---
id: 1373
title: 'Testing Functional Mad Libs'
date: '2017-01-19T23:10:28-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1373'
permalink: /2017/01/testing-functional-mad-libs/
dsq_thread_id:
    - '5477756611'
image: /wp-content/uploads/2017/01/Functional_testing_ouput.png
categories:
    - Javascript
    - node.js
tags:
    - functional
---

<div class="action-button">[Download](https://github.com/johanan/Functional-Mad-Libs) the src(github)</div><div class="action-button">[View](https://johanan.github.io/Functional-Mad-Libs/) the demo</div>This is the final post in a three-part series. The [first post](https://ejosh.co/de/2017/01/functional-mad-libs/) dealt with building a functional foundation and the [second post](https://ejosh.co/de/2017/01/functional-front-end-react-redux/) was about building a functional UI. This post will be about testing everything.

## Testing

Testing is very important, but sometimes it gets left behind. This can be because it is not clear how or even what to test. Tightly coupled code is a testing nightmare. It is very hard to unwind specific units of code to test. In addition to this mocking can become a huge task where you have to recreate all the resources the application needs.

This is where functional design comes in. By definition, it should be easy to test. There will be many functions that should only rely on what is passed into them. Mocking becomes trivial. Deciding what to test becomes trivial. Overall testing becomes trivial.

In this post, I will not bore you with the details about every test. Testing can be repetitive. I will highlight how I tested, how I mocked, and highlight any interesting parts.

### How to test

There are three mostly agreed upon ways to test, unit, integration, and end to end. The definitions for these will change depending on who you ask, but they are as follows. Unit tests are built to test one specific function. This means that no dependencies or mocking should be used. These tests are the simplest. Next up is integration testing. At this point, pieces are starting to be put together, integrated if you will. Integration tests will include unit tested pieces and some mocking. Although mocking is not always required. Then the final testing is end to end. This is where the entire application is built and tests are run. The previous tests usually do not need more than a test runner. End to end will involve more tooling.

Does this sound familiar? It should because this is exactly the same approach to writing functionally. First, you write simple functions. Those functions are then combined to create larger pieces. Then everything is put together to create the application. Each step maps to unit, integration, and end to end.

This means we start with the simplest functions and run them through their paces. Because these are simple functions the tests pretty much write themselves. Here is an excerpt from `basic_functions_test.js`.

```js
const assert = require('assert');
const {filterFunc, addField, filterMadLib} = require('../src/basic_functions.js');

describe('filterFunc test for pos', () => {
  let verb = {pos: {Verb: true}};
  let noun = {pos: {Noun: true}};
  let adjective = {pos: {Adjective: true}};
  let adverb = {pos: {Adverb: true}};
  it('should match each word type', (done) => {
    assert.equal(filterFunc('Verb', verb), true);
    assert.equal(filterFunc('Noun', noun), true);
    assert.equal(filterFunc('Adjective', adjective), true);
    assert.equal(filterFunc('Adverb', adverb), true);
    done();
  });
  it('should not match different word types', (done) => {
    assert.equal(filterFunc('Verb', noun), false);
    assert.equal(filterFunc('Verb', adjective), false);
    assert.equal(filterFunc('Verb', adverb), false);

    assert.equal(filterFunc('Noun', verb), false);
    assert.equal(filterFunc('Noun', adjective), false);
    assert.equal(filterFunc('Noun', adverb), false);

    assert.equal(filterFunc('Adjective', noun), false);
    assert.equal(filterFunc('Adjective', verb), false);
    assert.equal(filterFunc('Adjective', adverb), false);

    assert.equal(filterFunc('Adverb', noun), false);
    assert.equal(filterFunc('Adverb', adjective), false);
    assert.equal(filterFunc('Adverb', verb), false);
    done();
  });
});
```

The tests are clear and very simple. The function only does one thing so we know what to test.

## Integration testing

We can move to the next step, integration testing. The great part about this is that we have already integrated the functions by composing them. We can see an example of this kind of test in `render_functions_test.js`.

```js
const assert = require('assert');
const {createRenderElements, enterRenderElements, doneRenderElements} = require('../src/render_functions.js');

let text = "Somebody once told me the world is gonna roll me. I aint the sharpest tool in the shed.";

describe('createRenderElements test', () => {
  it('should should have MadLib on the indexed', (done) => {
    let create = createRenderElements([], text);
    let icreate = createRenderElements([1,3,5], text);

    assert.equal(create.length, 19);
    assert.equal(create[0].text, 'Somebody');
    assert.equal(icreate.length, 19);
    assert.equal(icreate[0].text, 'Somebody');
    assert.equal(icreate[0].MadLib, undefined);
    assert.equal(icreate[1].MadLib, true);
    assert.equal(icreate[3].MadLib, true);
    assert.equal(icreate[5].MadLib, true);
    done();
  });
})
```

This excerpt makes it clear that these tests are just as easy to write as our unit tests. Remember that each one of the `*renderElements` functions is composed of up to six different functions. Now some of these are Ramda functions, but the point still stands that this is an integrated test of functionality.

### Mocking

Mocking can be trivial if we have built our functions correctly. If our functions only do one thing then it is clear what we need to mock for that function. In our application, the only thing we need to mock is the document object. And even that only needs a few things mocked to work. Looking at what methods are used on document we see we only need to add some child manipulation tools (`appendChild`, `removeChild`, and `firstChild`) and some properties. Here is the document mock object, it is only 17 lines total.

```js
function Element(node) {
  this.nodeName = node;
  this.dataset = {};
  this.children = [];
  this.appendChild = (el) => { this.children.push(el);},
  this.removeChild = (el) => { this.children.splice(this.children.indexOf(el), 1)},
  Object.defineProperties(this, {
    'firstChild': {
      'get': () => { return this.children[0]}
    }
  });
}

module.exports.createElement = (node) => {
  return new Element(node);
}
```

This was easily done because we kept each function simple and we could then compile what we need the mock object to do. Now here is some code to test our IO functions. The document mock object will need to be used here. We are testing if this function will remove all children and then add our elements back.

```js
const assert = require('assert');
const {render, setAttribute} = require('../src/io_functions.js');
const document = require('./document_mock.js');

describe('render test', () => {
  it('should remove all current elements', (done) => {
    let root = document.createElement('root');
    root.children = [1,2,3,4,5];
    render(root, []).run();
    assert.equal(root.children.length, 0);
    done();
  });

  it('should add new elements in', (done) => {
    let root = document.createElement('root');
    root.children = [1,2,3,4,5];
    render(root, [1,2,3]).run();
    assert.equal(root.children.length, 3);
    assert.equal(root.children[0], 1);
    assert.equal(root.children[1], 2);
    assert.equal(root.children[2], 3);
    done();
  });
})
```

We can now trust that this code will execute the correct methods on the real document object when it is used in the browser. Now let’s look at using it to create specific elements.

We have two functions that create elements to go in the DOM, `spanMap` and `inputMap`. To test these functions we need to pass in the document mock object and then inspect some of the properties. These are not wrapped in an IO monad because it is a simple map. One object to another. Creating an element is a pure function and adding them to the DOM is an impure function. Here is the code.

```js
const assert = require('assert');
const document = require('./document_mock.js');
const {spanMap, inputMap} = require('../src/dom_element_map_functions.js');
const getTerms = require('../src/text_functions.js').getTerms;

let terms = getTerms(" dog eats ");
terms[0].Index = 0;
terms[1].Index = 1;
terms[1].MadLib = true;

describe('spanMap test', () => {
  it('should create spans based on term', (done) => {
    let span = spanMap(document, terms[0]);
    let madSpan = spanMap(document, terms[1]);

    assert.equal(span.nodeName, 'span');
    assert.equal(span.className, 'Noun');
    assert.equal(span.dataset.index, 0);
    assert.equal(span.title, 'Noun');
    assert.equal(span.innerHTML, ' dog ');

    assert.equal(madSpan.className, 'Verb PresentTense MadLib');
    assert.equal(madSpan.dataset.index, 1);
    assert.equal(madSpan.title, 'Verb PresentTense');
    assert.equal(madSpan.innerHTML, 'eats ');
    done();
  });
});
```

First, we create the element, then look at the properties. I want to highlight the fact that we have tested DOM manipulation and element creation without using a headless browser like PhantomJS. The testing was accomplished with a 17 line mock. I make this point because many times I see way too much mocking because of bad design.

## End to End Testing

Well, I don’t have any end to end testing. The only file that needs this is the final `index.js`. The tests needed for that would mainly fall in the category of making sure events were wired up correctly.

Two paragraphs ago I railed against over mocking for integration testing, but things are different when discussing end to end testing. We want to create an environment as close to what the real world will be. Now it is fine to pull in headless browsers to do testing. Why is it wrong for integration testing? In short, it is code design. Why not use a headless browser for unit tests? If the code requires this level of mocking, then it can be simplified. Again there are always exceptions, but we should be creating simple and pure functions from the start.

## Summary

We have looked all the different methods of testing. I think the most important point is that functional code is easy to test. The tenets of functional design fit with testing perfectly. Start off with simple functions that can be easily unit tested. Then combine those functions with higher order functions. The results of the combination can then be used in integration testing. The final step is to test everything assembled with end to end testing. It is easy to know what and how to test everything this way.