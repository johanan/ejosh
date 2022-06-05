---
id: 776
title: 'Node.js, Socket.io, and Redis: Intermediate Tutorial – React'
date: '2015-02-26T22:55:44-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=776'
permalink: /2015/02/node-js-socket-io-and-redis-intermediate-tutorial-react/
dsq_thread_id:
    - '3674064533'
image: /wp-content/uploads/2015/02/imgres.png
categories:
    - Javascript
tags:
    - react
    - testing
---

<div class="action-button">[Download](https://github.com/johanan/Where-to-eat) the src(github)</div><div class="action-button">[View](http://thawing-cliffs-6040.herokuapp.com/) the demo</div>#### Blog Post Series

<div class="action-button">[Server side covering node.js, Express, Socket.IO, Redis, and testing](http://ejosh.co/de/2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/)</div><div class="action-button">[Client side covering Bower, Grunt, Socket.IO, and Leaflet](http://ejosh.co/de/2015/02/node-js-socket-io-and-redis-intermediate-tutorial-client-side/)</div>I want to spend a little time going into [React](http://facebook.github.io/react/) and I felt that this would make the previous a little too long and meandering (almost like this sentence). In this post we will cover what React is, how it is different, what it excels at, how to implement it into a current application, and how to test React views. There is a lot of ground to cover so let’s get started.

## What is React

[React](http://facebook.github.io/react/) is a new library for building user interfaces (to steal it directly from their site) developed by Facebook. React is not a full featured JavaScript application framework. This means it is not competing in the same space as [Angular](https://angularjs.org/), [Ember](http://emberjs.com/), [Backbone](http://backbonejs.org/) or `<insert your favorite framework that I am not mentioning here>`. It also means it does not care how you route, where you get your data, or any application plumbing. It will render HTML.

## Why use React?

Why use React if all it does is render HTML?  First is the neat idea of a virtual DOM. What this means is that React keeps a representation of what the DOM is and what it should be. This allows the framework to do a diff and make the smallest possible DOM changes. A lot of DOM changes is bad for performance. It forces the browser to reflow. This is when there are new elements on the page and the browser has to determine what happens to all the other elements. For example, re-rendering 60% of the page every time a new list item is added. It may not be noticeable on a laptop, but it could cause issues on a mobile device. Google themselves recommends [minimizing browser reflows](https://developers.google.com/speed/articles/reflow) for performance.

Next is the idea of composable components. React components should be built so that they can be reused in another component. Later in this post we will see a component, `UserImage`, that will be used in four other components. This is possible because React nudges in the direction of building components that are complete and self contained. Continuing our example, `UserImage` contains all the code it needs to initialize and render itself. It does not have events, but if it did we could have those compartmentalized to just `UserImage`.

Extending the thought on events leads us to another reason to use React. React uses [event delegation](http://davidwalsh.name/event-delegate) for all its events. When we create a click event on a button, the button does not have the handler directly attached to it. The event is listened for and handled at the highest level. This is important when there are a lot of elements as one event listener is better than 500 listeners. This is a great design pattern to handle events and should be used anytime event handling is needed and React has it baked in.

Next in the list is that React is declarative. We can look at any of the React components and know exactly how and what it will render. This is a serious upgrade compared to updating a div using jQuery.

Finally, but not exhaustively, React is designed for the data to go one way, down through the hierarchy. As the counter point to this, events should only go up. To achieve this we have to build our React components as loosely coupled, the holy grail of programming paradigms. Components will have children that data is passed down to, but components should not have any dependencies on their parents. We will cover all these ideas as we build out our React interface.

### JSX

Any introduction to React would not be complete without mentioning [JSX](http://facebook.github.io/react/docs/jsx-in-depth.html). React’s definiton is, “JSX is a XML-like syntax extension to ECMAScript”. All this means is that if we have a component, `UserImage`, we can render it by using `<UserImage></UserImage>` right in our JavaScript. This is, without a doubt, the most off-putting thing about using React. In fact, I personally do not like using JSX at all and I do not use it in this tutorial. We will be building the DOM in JavaScript with React’s builtin DOM methods. The JavaScript we create is what the JSX compiler would produce. I may be getting old fashioned, but in my day we did not have to transform our JavaScript before we used it! I do recommend that you at least try JSX and see if you like it. Before we build any components we will cover the way that data flows through a React view.

## Props vs State

React has two approved ways of using data in a component, props and state. It is very easy to get confused about when to use each. From a practical standpoint there is not much difference. We can use props or state to render data as each are just common JavaScript objects, but this would be a mistake. The best way I have discovered to look at this is that almost all components should use props. Very, very few components should have state.

Props are immutable data to render a component. Our first component we will look at, `UserImage`, is a perfect example of using props. Props being immutable does not mean that the component can never change or re-render. It just means that the component will not do this internally. Another component or object will pass in new props and the component will render. This is great as each component should be [deterministic](http://en.wikipedia.org/wiki/Deterministic_system). This means that with the same props, we will get the same output. This is great for building composable components.

State is the change of data over time. We do need to use state at some point because we want our interface to be dynamic. This should be contained in as few of components as possible. Out of the eight components in the project only two use state. We want to put these components at the very root so that they can distribute the data down.

The main take away of props vs state is that most of the time we just want to use props. When we do use state, put it all the way at the top and let it roll the data down the hierarchy as props. This makes our user interface easy to test and implement.

> This is a really quick overview of props vs state, so if you want more reading check out these articles: [Thinking in React (Facebook)](http://facebook.github.io/react/docs/thinking-in-react.html) and [Props vs State](https://github.com/uberVU/react-guide/blob/master/props-vs-state.md).

## Building our React components

This is an update of an older project that did not use React. It mainly used jQuery to keep a reference to elements and then replaced the HTML when they needed updated. For the most part we are keeping most of the plumbing the same and replacing any DOM manipulations with React. This is a good study in how adaptable React is and how to slowly work React into a project. All of our React components are in the file `js_src/react_components.js`. Let’s look at the first one.

### UserImage

This component takes a username and will output a span that will include an image and the possibly the username. The image will either be from Facebook or [Gravatar](https://en.gravatar.com/). Here is the code for the component.

```js
var UserImage = React.createClass({
  usernameToImg: function (user) {
    var re = new RegExp("^(fb:)?"),
      userSplit = user.split(re),
      type, src, username;

    if (userSplit.length > 1) {
      //we have a match
      //grab the end piece
      type = userSplit[userSplit.length - 2];
      username = userSplit[userSplit.length - 1];
    } else {
      username = user;
      type = 'gravatar';
    }

    if (type && type === 'fb:') {
      src = 'https://graph.facebook.com/' + username + '/picture?type=square';
    } else {
      var emailhash = md5(username.toLowerCase());
      src = 'http://www.gravatar.com/avatar/' + emailhash + '?d=retro&s=18';
    }

    return {
      src: src,
      username: username
    };
  },
  render: function () {
    var imgOutput = this.usernameToImg(this.props.username);
    var name = this.props.useName ? imgOutput.username + ': ' : null;
    return React.DOM.span(null,
      [React.DOM.img({src: imgOutput.src, className: 'userimg', title: imgOutput.username, ref: 'userImage'}, null),
        name]);
  }
});
```

This is a very simple component. The first prop it needs is `username` which will be a string. We then take the string and turn it into a URL that will either point to Facebook or Gravatar. Notice that this function is broken out so that we can easily test the functionality of it. Next we use the prop `useName` to determine if we should render just an image or an image and the username. We use the `name` variable to either hold the username or null. If we try to render null React will not render anything.

Finally we can return our DOM structure. As I noted before I like to build React without JSX. It is actually easy to do. If we want to render a `img` then we use `React.DOM.img`. This holds true for any other element. The first parameter into `React.DOM.img` is where we would pass in any props and HTML attributes. In `UserImage` we call `React.DOM.img({src: image_source})`. The next parameter is the children of the element. We do not want any children so we pass null. If we wanted to render multiple children then we just pass them in as an array. The image and username are in an array wrapped by a `span` element. This is because all React render functions must return only one element.

That is our first component. We only use props because the username should not be mutable. It should only change from events that will trigger at a higher level than this component. We can easily test this and know that if we give it the same username we will get out the same output.

### UserDisplay and UserLogin

These two components will not be rendered at the same time. `UserDisplay` is used when a user is logged in and `UserLogin` will be the login form for when a user is not logged in. Here is the code.

```js
var UserDisplay = React.createClass({
  signoutUser: function () {
    $(window).trigger('SignoutUser');
  },
  handleClick: function (event) {
    event.preventDefault();
    this.signoutUser();
  },
  render: function () {

    return React.DOM.div(null,
      [React.createElement(UserImage, {username: this.props.username, useName: true}),
        React.DOM.a({href: '#', onClick: this.handleClick}, 'Sign out')]);
  }
});

var UserLogin = React.createClass({
  addUser: function (user) {
    $(window).trigger('AddUser', user);
  },
  handleBlur: function (event) {
    var val = event.target.value;
    if (val !== '') {
      this.addUser(val);
    }
  },
  render: function () {
    return React.DOM.input({
      id: 'login',
      type: 'text',
      placeholder: 'fb:username or gravatar',
      onBlur: this.handleBlur
    }, null);
  }
});
```

Both of these components utilize a powerful design paradigm, which is separating out handling an event from the action that is taken. This allows us to test the action without needing to having to call the event.

`UserDisplay` is the first component that renders another component. We use `React.createElement` to do this. This takes a reference to the class and a props object. Next we render an anchor element. This has an event handler, `onClick` which calls `handleClick`. Do not mistake `onClick` for the archaic inline JavaScript of the old web. Remember React has its own event system. This is how we register a handler. We just give it a function and that’s it.

Lastly we will now look at `signoutUser`. This is, what I would like to call, a ‘Poor man’s event bus’. Here we are creating an event telling another object, that ‘Hey the user wants to sign out!’. Notice that this component does not try to do anything. It sends an event and lets higher level components track state. This component is very loosely coupled.

This brings us to another idea that is gaining traction because of React, [Flux](http://facebook.github.io/flux/docs/overview.html). Flux is not a new idea nor is it a library like React. It just means, to quote a [Medium article](https://medium.com/@garychambers108/understanding-flux-f93e9f650af7):

> “The core idea behind Flux is that data should flow unilaterally through an application: that is to say, actions and data transformations can go through one or more dispatchers and propagate out to the views, but never in the opposite direction. The view layer is not permitted to modify state directly — it must send a fire-and-forget instruction to a dispatcher, thereby triggering a state change that can then propagate outwards.”

At a very basic level that is what we are doing here. This component is sending an event to our controller object, `Josh.Map`, which will then take some actions. In our examples here of SignoutUser and AddUser, `Josh.Map` either adds or deletes cookies and sends another event back out. This will definitely become a problem as the number of events grow, but it works for just a few events. We have, at a lack of a better term, a ‘Poor man’s Flux’ (to go along with our ‘Poor man’s bus’). The controller works as the dispatcher and store and jQuery events are the transport method.

We can now look at a component that will have state and responds to events.

### LoginForm

This may be a misnomer, but it either renders `UserDisplay` or `UserLogin` based on whether or not a user is logged in. A prop is used to create the initial value of the state. After this, though everything is done through events. Here is the code:

```js
var LoginForm = React.createClass({
  componentWillMount: function(){
    this.boundNewUser = this.newUser.bind(this);
    $(window).on('NewUser.React', this.boundNewUser);
  },
  getInitialState: function(){
    return {
      user: this.props.user
    };
  },
  processUser: function (user) {
    var loggedIn = (user !== undefined && user !== null),
      newUser = null;

    if (loggedIn) {
      newUser = user;
    }

    return {
      loggedIn: loggedIn,
      user: newUser
    };
  },
  newUser: function(e, user){
    this.setState({user: user});
  },
  componentWillUnmount: function () {
    $(window).off('NewUser.React', this.boundNewUser);
  },
  render: function () {
    var processState = this.processUser(this.state.user);
    var userComponent = processState.loggedIn ? React.createElement(UserDisplay, {username: this.state.user.username})
      : React.createElement(UserLogin, null);
    return React.DOM.div(null,
      [userComponent]);
  }
});
```

We have a few new lifecycle functions here (here’s the full [lifecycle](http://facebook.github.io/react/docs/component-specs.html) for a component). The first is `componentWillMount`, which runs before the component is rendered. We use this to set up our event listener. On the reverse `componentWillUnmount`, executes right before the component is unmounted and removed.

`getInitialState` is used the first time the component is rendered to create the initial state object. We just use whatever was passed in as a prop. The only other state function is `newUser`. This uses the React function `setState`. It is very straight forward, we pass in the object that we want the new state to be. React will take over from there. It will determine what DOM elements need to be updated based on the virtual DOM.

This is how our ‘Poor man’s Flux’ works. We have a controller(`Josh.Map`) that listens for all state changes through events. These events are `AddUser`, `NewUser`, and `SignoutUser`. `AddUser` and `SignoutUser` are fired by components and the controller will listen and respond to these. This involves setting or removing cookies and firing the `NewUser` event back to our component. The `NewUser` event will either have a null user if no one is logged in or the username of user. In this way data only flows from components to the controller, which then decides what to do and sends an event back to the component. The components never directly communicate with each other and only one component actually listens. If we needed to create another component that reacted to a user logging in we could easily do this and attach it to the `NewUser` event.

### VoteDisplay

The last four components we looked at (`UserImage, UserDisplay, UserLogin, and LoginForm`) are representative of the other components. I will not bore you with the specifics of the other components. Some of them have very complex DOM structures or do more processing of props, but they do not introduce anything new. Except for one, `VoteDisplay`. We will not look at this entire component, but rather only the interesting parts. First let’s describe the problem we need to overcome.

When handling functions we get a function definition similar to jQuery’s. That is when we bind a listeners it is called with an event object as the first parameter. We have done this already. This works great when there is just one element in the component and we know where the event came from. This breaks down when there is a list of elements that the event could have come from and we need to know which element (we could always abstract each element into its own component). We can get an index of where we are when using the `map` function. Facebook shows how to bind the index to the function call in its [docs](http://facebook.github.io/react/tips/communicate-between-components.html). This is done by binding over the event with the index. We do this in the component `ActivityDisplay`.

```js
React.DOM.div({onClick: this.handleClick.bind(this, index)}, //more elements
```

There is one problem with this. What if we want both the event and index? We cannot have both in the previous example as we bind over the event parameter with the index. We can use partial application though. Partial application is where we take a function, bind one of the parameters, and return a new function that will then accept the other parameters. Ben Alman has a great article on [partial application](http://benalman.com/news/2012/09/partial-application-in-javascript/). Here is our definition of partial application which is in the `VoteDisplay render` function.

```js
    var partialHandle = function (fn, index) {
      return function (e) {
        return fn(e, index);
      };
    };
```

`partialHandle` takes a function and the index of the element as the parameters. It then returns a function that takes one parameter named `e`. Then that function will return the outcome of executing the original function that was passed in. Alright, so it may be hard to follow so let’s look at the code with a break down of what will happen.

```js
//using partialHandle
React.DOM.div({onClick: partialHandle(this.handleClick, index)}, //more elements

//here is the definition of partialHandle with these values
var partialHandle = function (this.handleClick, 3) {
//this function is what is bound to the click event
//it accepts the parameter which will be the event as e
    return function (e) {
    //it passes the event to this.handleClick
      return this.handleClick(e, 3);
    };
  };
```

We are creating a new version of `handleClick` that has already bound the index parameter. We can then use this new function to bind the event parameter.

## Rendering React

Now that we have all of our components we can render them. This is actually very easy. We just call `React.render` Here are all the renders in the file `js_src/JoshNS.js`

```js
    //lines 251
    //render user login
    React.render(React.createElement(LoginForm, null), $(loginDiv)[0]);

    //lines 260
    //render React and get location
    React.render(React.createElement(RestaurantWell, null), restaurantDiv);
    React.render(React.createElement(ActivityDisplay, null), tab2);

    //line 388 in showRest
    React.render(React.createElement(RestaurantDisplay, {fs: fs}), markerDiv);

    //line 409 in showVotes
    React.render(React.createElement(VoteDisplay, {votes: voteArray}), tab1);
```

That’s it. The first parameter is the React component we want to render and the second is a reference to an element that it will be rendered into. The first three renders are done on initialization. `LoginForm` and `ActivityDisplay` both use state so they will change as the application’s state changes. The last two renders happen in response to events. When someone clicks on a restaurant we render it. React will determine what it has to do if you render the same component in the same spot. In this way we letting the controller determine the state and React determine how to render.

This is a good example of slowing working in React components. All I did was take out the previous DOM manipulation and stick in a `React.render`. If I rewrite the controller I would probably make a component that would track this state, but for now I just simply replace all the old view changes with React.

## Testing React

We are going to test React with [QUnit](http://qunitjs.com/) as the test runner, [Blanket](http://blanketjs.org/) for code coverage, and React’s own [test utilities](http://facebook.github.io/react/docs/test-utils.html) to help. The test page is at `static/jstest/index.html` and the actual React tests are in `static/jstest/React.js`.

QUnit can organize the tests into modules that can have a setup and tear down for each test. QUnit is also very good and handling asynchronous testing as well. This is very important because we have an event bus we will need to utilize. Here is the output of testing the React Components module.

[![React testing](http://ejosh.co/de/wp-content/uploads/2015/02/React-testing-580x749.png)](http://ejosh.co/de/2015/02/node-js-socket-io-and-redis-intermediate-tutorial-react/react-testing/#main)

We are only going to look at a few of the tests that are demonstrative of how to test React components. First we will look at the test for rendering the `UserDisplay`.

```js
test('UserDisplay', function () {
  var r = React.render(React.createElement(UserDisplay, {username: 'josh'}), this.react[0]);
  var $img = $(r.getDOMNode()).find('img')[0];
  equal($img.title, 'josh', 'The username should be the same');
  equal($img.src, 'http://www.gravatar.com/avatar/f94adcc3ddda04a8f34928d862f404b4?d=retro&s=18', 'This is based on a MD5 hash');
  React.unmountComponentAtNode(this.react[0]);
  var f = React.render(React.createElement(UserDisplay, {username: 'fb:josh'}), this.react[0]);
  $img = $(f.getDOMNode()).find('img')[0];
  equal($img.title, 'josh', 'The fb: should be removed');
  equal($img.src, 'https://graph.facebook.com/josh/picture?type=square', 'Should be a Facebook url');

  //test event
  stop();
  $(window).on('SignoutUser.test', function (e) {
    $(window).off('SignoutUser.test');
    start();
    equal(true, true, 'signoutUser should fire off SignoutUser event');
  });

  f.signoutUser();
});
```

The first part of this test ensures that the DOM is correct. When React renders we can get a reference to the component from the `render` function. We can then check state, props, handlers, or anything else that is public on the object. The first thing we do is get the DOM element by calling `getDOMNode`. This element is then wrapped with jQuery so we easily use jQuery’s DOM traversal engine.

The next part tests if the component is using our poor man’s event bus. This is an asynchronous action so first thing we do is stop the the test. This is done with `stop()`. We then listen on the event bus for the event that should be fired. Then the function `signoutUser` is called to create the event on the event bus. Finally inside of the event listener we restart the test and run our final test. This is great for testing because we do not have to initialize our controller object. We can fully test our component in isolation.

Next we will test actual DOM events on our component, like a click event.

```js
test('UserDisplay clickHandler', function () {
  var r = React.render(React.createElement(UserDisplay, {username: 'josh'}), this.react[0]);
  //test event
  stop();
  $(window).on('SignoutUser.test', function (e) {
    $(window).off('SignoutUser.test');
    start();
    equal(true, true, 'click should fire off SignoutUser event');
  });

  ReactTestUtils.Simulate.click($(r.getDOMNode()).find('a')[0]);
});
```

This test is similar because our click handler calls `signoutUser`. We use React’s test utilities to simulate a click event. We just have to supply the function with the element that the click should fire on. One thing to remember is to remove the listeners from the event bus otherwise they may fire in tests that they should not. The rest of the tests are very similar in how they operate. You are more than welcome to look at all the tests for components. You will see that they are all very simple. I think this is a great endorsement of React. Once you render a component it is just HTML elements and plain old JavaScript functions. Easy to write, easy to understand, and easy to test.

## Summary

This project is good example of slowly rolling React into a project. Essentially we have pulled out any code that interacts with DOM and replaced it with a React component. React requires us to think about the view and data a little differently. We built some simple ways of implementing the idea of Flux to keep data only flowing one way. This includes the idea that data should only go down the component hierarchy. State is defined at the highest level and then props get passed down to child components. Finally we looked at how to test React components.