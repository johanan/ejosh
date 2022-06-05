---
id: 1290
title: 'I found a functional way to build Express&#8217;s middleware'
date: '2016-12-20T08:00:47-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1290'
permalink: /2016/12/found-functional-way-build-expresss-middleware/
dsq_thread_id:
    - '5397932761'
categories:
    - Javascript
    - node.js
---

Using functional design is the new cool thing. This is especially true when talking about JavaScript. Functional programming can make complex code much simpler and much shorter. I am going to highlight some code that I wrote for my Packt Publishing video course, [The Complete Guide to Node.js](https://www.packtpub.com/web-development/complete-guide-nodejs-video).

I want to note first that this is not a perfect apples to apples comparison. It is also not a judgment on the code written for Express. Express was not built to be functional and cannot be faulted for not using functional ideas. I just want to highlight a functional way of accomplishing a similar task.

## The code

We are going to specifically look at middleware in Express. We will focus on the implementation of `next`. Middleware accomplishes the task of taking a bunch of functions that need to run on a request. Some middleware needs to run on every request and others only on specific requests. This means functions that are not the final item in the chain need to continue the chain. This is done with the `next` function. If you have not used Express middleware I recommend [Express’s documentation](http://expressjs.com/en/guide/using-middleware.html).

Let’s look at how Express does this on [Github](https://github.com/expressjs/express/blob/master/lib/router/index.js#L178). The code we will look at is in `lib/router/index.js`. We will look at the handle function and focus at the code starting at line 178. Again I will highlight that the Express version does more than just handle the middleware stack.

Here we can see that there are 12 ifs in the while as it loops over each item in the middleware stack. The good thing is that these ifs are not nested, if they were it would be crazy. This makes it a little difficult to really grok what is happening quickly. Go ahead, jump in and see how long it takes you to determine what is happening.

### My code

This is not production ready code but it shows a different way of approaching the same problem. Let’s look at the code first and then discuss what is happening.

```js
const url = require('url');
var routes = [];
var registerRoute = (method, url, fn) => {
  routes.push({method: method,
  url: url,
  fn: fn});
};

var routeMatch = (route, url) => {
  return route === url || route === undefined;
};

var methodMatch = (routeMethod, method) => {
  return routeMethod === method || routeMethod === undefined;
};

var isError = (fn) => fn.length === 3;
var isNormal = (fn) => fn.length === 2;

var mapToRouteMatch = (reqUrl, reqMethod) => {
  return (route) => {
    return routeMatch(route.url, reqUrl)
    && methodMatch(route.method, reqMethod);
  }
};

var handleRequest = (req, res) => {
  var matchedRoutes = routes
  .filter((route) => isNormal(route.fn))
  .filter(mapToRouteMatch(url.parse(req.url).pathname, req.method));
  try{
    matchedRoutes.some((route) => route.fn(req, res));
  }catch(e){
    let errorRoutes = routes
    .filter((route) => isError(route.fn))
    .filter(mapToRouteMatch(url.parse(req.url).pathname, req.method));
    errorRoutes.some((route) => route.fn(req, res, e));
  }
};

module.exports.registerRoute = registerRoute;
module.exports.handleRequest = handleRequest;
```

This is 42 lines that completely implements a routing middleware much like Express. The `routes` array and `registerRoute` are the core data of this. In fact, if you wanted you could change `registerRoute` to `use` to make it, even more, like Express.

There are then four filtering functions (`routeMatch, methodMatch, isError, and isNormal`). They are all one line of code so I won’t spend time discussing them. Next there is a higher order function `mapToRouteMatch`. This takes a URL and a method and then combines the return of the matching functions. This allows us to make routes that match both/either the method and/or the URL. This gives us the flexibility to run a piece of middleware for every request or just one.

One quick aside, the function `mapToRouteMatch` is really just a partially applied function. The function partially applies the URL and method which returns a new function that will then expect each route. Which the function will get when mapped over the array.

Finally we get to the core handling, `handleRequest`. Thinking functionally, there is a clear way to get which pieces of middleware to run on this request, `filter`! We already have functions that can filter down the array to just the functions that have 2 parameters (req and res) and match the current URL and method. After that we just run `some` over the array. `some` will continue over each item until one of them returns true. This is perfect if any function is the final function in the chain, just return true.

This is wrapped in a try/catch. If there is an error we catch it and then find each error middleware and execute it with the error. Let’s see how to actually use this now.

Here is a simple server with two endpoints and six total middleware.

```js
const http = require('http'),
      routes = require('./routes.js');

//actual responses
var log = (req, res) => {
  console.log(`${req.method} ${req.url}`);
  return false;
};

var poweredBy = (req, res) => {
  res.setHeader('X-Powered-By', 'ejosh.co/de');
  return false;
};

var index = (req, res) => {
  res.write("<html><head><title>Page" +
"</title><head><body><h1>Our Web Application</h1>" +
"</body></html>");
  res.end();
  return true;
};

var createError = (req, res) => {
  throw new Error('this will always throw');
  return false;
}

var defaultRoute = (req, res) => {
  res.end();
  return true;
};

var errorRoute = (req, res, err) => {
  res.write(err.message);
  res.end();
  return true;
}

routes.registerRoute(undefined, undefined, log);
routes.registerRoute(undefined, undefined, poweredBy);
routes.registerRoute('GET', '/', index);
routes.registerRoute('GET', '/error', createError);
routes.registerRoute(undefined, undefined, errorRoute);
routes.registerRoute(undefined, undefined, defaultRoute);

var server = http.createServer();
server.on('request', routes.handleRequest);
server.listen(8081, '127.0.0.1');
```

We are using the built-in HTTP server and including the code we just looked at as `routes.js`. The next six functions should look really familiar if you have ever built an Express middleware. The main difference is that there is no next function. Just return false to continue processing and true to stop processing.

Next is the section where the routes are registered. This is different than Express as it is much more explicit. Every call has to pass all three parameters; method, URL, and function. Passing in `undefined` means that it will match for every request. Remember order matters.

Finally, it is wired up by starting the HTTP server and setting `handleRequest` to handle the requests.

As you can see we now have a functioning Express-like router and application in just 90 lines of code. The router does not have all of the features of Express, but hopefully, it is clear where the features can easily be added. For example regular expressions could be added as another function and used in `routeMatch`. Ultimately the main advantage is that we have simplified finding and running the correct middleware down to two filters and then a map (some is essentially a map). This allows us to use very simple functions for the actual logic portion.

</body></html>