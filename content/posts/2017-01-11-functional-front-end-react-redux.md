---
id: 1349
title: 'Functional Front End: Why React and Redux?'
date: '2017-01-11T22:31:41-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1349'
permalink: /2017/01/functional-front-end-react-redux/
dsq_thread_id:
    - '5455765520'
categories:
    - Javascript
tags:
    - functional
---

<div class="action-button">[Download](https://github.com/johanan/Functional-Mad-Libs) the src(github)</div><div class="action-button">[View](https://johanan.github.io/Functional-Mad-Libs/) the demo</div>This is the second post of a two-part series. The [first post](https://ejosh.co/de/2017/01/functional-mad-libs/) covered building a functional back-end for making Mad Libs. We will focus on the front end. React and Redux are not actually used in the code, but they are used in execution. I will show the reason why React and Redux are so powerful. In addition to this, we will look at using IO monads and put everything together. Let’s get started and pick up where we left off.

## So, Why React?

We will start with React as we need to show how to modify the DOM. Here is some simple code that we will discuss.

```js
const R = require('ramda');
const IO = require('monet').IO;

//IO monad stuff
let addChildren = (elements, root) => {
  R.forEach((el) => {
    root.appendChild(el);
  }, elements);
};

module.exports.render = R.curry((root, elements) => {
  return IO(() => {
    while (root.firstChild) {
        root.removeChild(root.firstChild);
    }

  addChildren(elements, root);
  });
});

module.exports.setAttribute = R.curry((attribute, element, value) => {
  return IO(() => {
    element[attribute] = value;
  });
});
```

To not sidetrack this discussion we will not get into monet and the IO monad right now. First look at `render`, all it does is delete everything in a certain root element and then add all the elements from an array as children. This is simple and naive, but I am arguing here that this is the real value of React.

React’s core value is the fact that, when used correctly, React’s render is a pure function of the state passed to it. What is currently in the DOM does not matter. The render function here is the simplest expression of that idea. I am not saying that this should be used for anything else as there are problems. React would be brought in if the UI was any more complex.

I am bringing this up as I have noticed that there are a lot of new front-end frameworks that compare themselves to React. This is usually done by invoking the term Virtual DOM or comparing performance. Remember that the virtual DOM and diffing are actually an implementation detail. React would still be a very useful framework without the Virtual DOM. It would just not be performant.

There are two key questions that need to be asked: can a framework render a stateless component and can components be composed together? These are the two things that allow someone to build a declarative UI that will cut down on cognitive load. This means fewer bugs and easier maintenance and testing.

I would even tack on a requirement that the framework uses nothing from the DOM other than an element to render into. The DOM should have no influence on what you are building in your component. By definition, that is an impure function. What if something changes the DOM that you do not know about? That walks like a global, smells like a global, and looks like a global to me. The DOM should not even be part of what we are building until we render it.

That means this `render` function does not update any elements on the page. It just removes everything and adds what it needs to be there. The same is true from a high level when looking at React. Each component will be rendered in the DOM exactly how it is defined.

### IO monad

Now let’s move on to the IO monad. I will not try to explain what a monad is other than it is a wrapper around something. That is a huge simplification, but I think it works for this example. If you want a little more context you can read [this post on IO monads](https://medium.com/@luijar/the-observable-disguised-as-an-io-monad-c89042aa8f31#.s6fr2tjzi).

What does this wrapper give us? It allows us to define an action that is out of our control in a way that we can control. In this example, we have a change, rewriting all the children of a DOM element. This gives us an impure action that is wrapped up in a function that we can now pass around. We then can execute this action when we want. The DOM is really just one big side effect that we have very limited control over and this monad gives us a little control back.

## Why Redux?

This leads us straight to the next point, Redux. Redux has gained a lot of popularity in a short amount of time. This is because Redux takes a functional approach to state management that resonates with developers. The proof is in two of Redux’s [three principles](http://redux.js.org/docs/introduction/ThreePrinciples.html); the state is read-only and changes are made with pure functions.

This makes creating and reasoning about how the state can change very clear. We should easily be able to tell what we can do in an application and what the effects will be to the state. This is why Redux is used with React; it can create an application that is almost purely functional from top to bottom.

### The state for Mad Libs

In this project, we are not pulling in Redux as it would be overkill. We will, however, build a function that would fit perfectly in Redux, though. This is a small project so the state is small. It just consists of; the original text of the Mad Lib, the indexes of words to replace, the new words that are the replacements, what step in the process, and whether or not to highlight the parts of speech. Let’s look at the function that will modify this state.

```js
const R = require('ramda');

//helper for processStateChange
let addOrRemoveIndex = (array, item) => {
  return R.contains(item, array) ? R.remove(array.indexOf(item), 1, array) : R.insert(array.length, item, array);
}

module.exports = (state, action) => {
  switch(action.type){
    case 'init':
      return Object.assign({}, state, action.value);

    case 'text':
      return Object.assign({}, state, {text: action.value});

    case 'indexes':
      //add or remove index, reset all the words
      //todo fix this by index
      let indexes = R.sortBy(R.identity, addOrRemoveIndex(state.madIndexes, parseInt(action.value)));
      let words = R.repeat('', indexes.length)
      let disable = R.any(R.equals(''), words)
      return Object.assign({}, state, {madIndexes: indexes, madWords: words, step: 'create', disableDone: disable});

    case 'words':
      return Object.assign({}, state, {madWords: action.value, step: 'entering',
        disableDone: R.any(R.equals(''), action.value)});

    case 'stepChange':
      return Object.assign({}, state, {step: action.value});

    case 'highlightChange':
      return Object.assign({}, state, {highlight: state.highlight === '' ? 'Highlight' : ''});

    case 'reset':
      return Object.assign({}, state, {madIndexes: [], madWords: [], step: 'create', disableDone: true});

    default:
      return state;
  }
};
```

If you have built any Redux stores, this will look really similar. It is pretty straight forward. Dependent on what action is taken and the value of that action certain steps are taken. Notice the use of `Object.assign`. This means that every new state returned is a new object. The current state is not modified in place and this is a pure function.

There is one other script that is kind of a mix of React and Redux. It looks like a Redux store but is used to determine what to render. This next code is mainly used because of how simple the `render` function is. If we had React this would fit perfectly into a React component.

```js
const R = require('ramda');

//make this configurable
module.exports = R.curry((changeClass, changeDisabled, createRenderFn,
  enterRenderFn, doneRenderFn, state) => {
  changeClass(`${state.step} ${state.highlight}`).run();
  changeDisabled(state.disableDone).run();

  switch(state.step){
    case 'create':
      createRenderFn(state.madIndexes, state.text).run();
      break;
    case 'enter':
      enterRenderFn(state.madIndexes, state.madWords, state.text).run();
      break;
    case 'done':
      doneRenderFn(state.madIndexes, state.madWords, state.text).run();
      break;
  }
});
```

All it does is execute specific IO monads that are passed in along with the state that they require. IO monads will execute their impure action when `run()` is executed.

## Put it together

Now we have the basic building blocks defined we can start to combine them to create a useful application. One of the main jobs of this file is to wire everything up and register events. This file is not large by any means (85 lines), but we will look at it in related chunks. In addition to this, we will not have the full require list at the top of the file or the registering of six DOM elements. The DOM elements are just pulled in by Id and stored.

First up is events. There are two helper functions for filtering only certain events.

```js
const R = require('ramda');

//event filter functions
module.exports.onlyClass = (filterFn, className) => {
  return R.compose(
    R.any(R.equals(className)),
    R.flatten,
    R.map(R.prop('classList')),
    R.filter(filterFn)
  );
}

module.exports.onlyThese = (classArray) => {
  return R.compose(
    R.lt(0),
    R.prop('length'),
    R.intersection(classArray),
    R.prop('classList')
 );
}
```

These are compositions that focus on looking at the classList of an element to return a boolean. This is done to make sure that events only fire actions when we want them to. The functions are needed because we do not have a full event system like React has. React would make this code unneeded because we could build it directly into a component.

Now we can see how this is integrated into the application.

```js
let getWords = R.map(R.prop('value'));
let onlyBodyCreate = onlyClass((p) => p.nodeName == 'BODY', 'create');
let onlyTheseWords = onlyThese(['Noun', 'Verb', 'Adjective', 'Adverb']);

//events
root.addEventListener('click', (e) => {
  if(e.target.nodeName === "SPAN" &&
  onlyBodyCreate(e.path) &&
  onlyTheseWords(e.target)){
    dispatch({type: 'indexes', value: e.target.dataset.index});
  }
});

root.addEventListener('blur', (e) => {
  if(onlyBodyCreate(e.path))
    dispatch({type: 'text', value: root.innerText});
});

createButton.addEventListener('click', () => dispatch({type: 'stepChange', value: 'create'}));
enterButton.addEventListener('click', () => dispatch({type: 'stepChange', value: 'enter'}));
doneButton.addEventListener('click', () => dispatch({type: 'stepChange', value: 'done'}));
highlightButton.addEventListener('click', () => dispatch({type: 'highlightChange'}));
resetButton.addEventListener('click', () => dispatch({type: 'reset'}));

document.addEventListener('keyup', (e) => {
  if(e.target.nodeName === 'INPUT'){
    dispatch({type: 'words', value: getWords(document.getElementsByTagName('input'))});
  }
});
```

We will get to `dispatch` shortly. Each action is a simple object with a `type` and `value` properties. The events that we listen for just fire off some action to execute.

### Creating DOM elements

At this point, we have discussed adding elements and handling events, but we have not covered how we will actually add elements to the page. We will essentially just create a mapping function to map from our list of words into spans or inputs. Let’s look at the code.

```js
const R = require('ramda');

//DOM mapping functions
module.exports.spanMap = R.curry((document, term) => {
  var span = document.createElement('span');
  span.className = Object.keys(term.pos).join(" ");
  if (term.MadLib)
    span.className = span.className += " MadLib";
  span.dataset.index = term.Index;
  span.title = Object.keys(term.pos).join(" ");
  span.innerHTML = term.whitespace.preceding + term.text + term.whitespace.trailing;
  return span;
});

module.exports.inputMap = R.curry((document, valueAndPlace) => {
  let input = document.createElement('input');
  input.type = 'text';
  input.placeholder = valueAndPlace[1];
  input.value = valueAndPlace[0];
  return input;
});
```

As you can see these are very simple functions. The if in `spanMap` is the only if in the entire application. The number of code paths is very small. At any point in time, we will know what functions are executing with what data. Technically there are two case statements in the Redux portion, but that is more of a contained unit.

## Wire everything together

There are no more building block functions to create so we can finally see how the application actually comes together. We have all the listeners we need to be attached to the correct events. We now need to build the render steps and state management.

First is rendering. We currently have the `render` function which will take a root element and a list of elements then replace everything in the root element with the new elements. That is what we will use to compose.

```js
//curried render to root
let rootRender = render(root);
let createRender = R.compose(rootRender, R.map(spanMap(document)), createRenderElements);
let enterRender = R.compose(rootRender, R.map(inputMap(document)), enterRenderElements);
let doneRender = R.compose(rootRender, R.map(spanMap(document)), doneRenderElements);

//configure renderState
let renderState = renderStateCurry(setAttribute('className', document.getElementsByTagName('body')[0]),
setAttribute('disabled', doneButton),
createRender,
enterRender,
doneRender);
```

This is just more composition. `rootRender` is a curried function that will always render to the element we bind in the beginning. Then we create a composition that will take a string of text, turn it into an array of objects from nlp compromise, map those objects into an array of spans or inputs, and then render to root. Functional programming allows us to build the final steps with very high-level functions. It should almost read like a sentence.

Next, we need somewhere to store state. This is what makes everything work.

```js
//application state stuff
let impureStateActions = (state) => {
  return IO(() => {
    console.log(state);
    s = state;
    oldStates = R.insert(oldStates.length, state, oldStates);
  });
}

//function for state update and render
let dispatchCompose = R.compose(
  R.tap(renderState),
  processStateChange
);

//a hack for global state
let dispatch = (action) => R.compose(impureStateActions, dispatchCompose)(s, action).run()
//hack to show/not sure where to put this
window.s = {};
window.oldStates = [];
window.renderState = renderState;
//init
dispatch({type: 'init', value: {text: root.innerText, madIndexes: [], madWords: [], step: 'create', disableDone: true, highlight: ''}});
```

We have our first impure function, `impureStateActions`. This is considered impure because it relies on two variables that are not passed in as parameters. The goal of this function is to log, save, and stick the state into an array.

Next, we have the core part of dispatch, `dispatchCompose`. This takes the current state and action, processes it, and then renders it. We want to turn this into a function that just takes an action, so we create another impure function that will pull the current state in and apply `dispatchCompose`. This is what allows us to just put a dispatch call with an action into each event.

We use the window to expose a few variables. This is done so that we can open up the console and look at the current state, an old state, or replay an old state. For example we could run `renderState(oldStates[2])` to re-render the third state in our history.

The last line is to kick off the application. `dispatch` is the entry into the application. This function kicks off a composition of a composition of a composition, etc.

## Summary

I will wrap up this post here as it is long enough already without adding in testing. In answer to the questions posed in the title, Why React and Redux? It is because they are functional in design. React allows you to conceptualize the view without worrying about anything in the DOM, just what is in the state which is passed to it. We don’t have React in this application, but we use it in spirit. Redux allows you to build predictable state transitions. Given a specific state and action, the same new state will be returned. We are using Redux without Redux.

Just a final note on storing the state as `window.s`. I was not sure where to put this. I guess I am OK with this as this is the only thing that is leaked and is impure. Everything else does not leak state and for all intents and purposes immutable.

In the next post, we will look at testing.