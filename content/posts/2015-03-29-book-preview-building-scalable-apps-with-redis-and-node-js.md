---
id: 839
title: 'Book Preview (Building Scalable Apps with Redis and Node.js)'
date: '2015-03-29T18:24:33-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=839'
permalink: /2015/03/book-preview-building-scalable-apps-with-redis-and-node-js/
dsq_thread_id:
    - '3673143655'
image: /wp-content/uploads/2014/08/4480OS_mockupcover.png
categories:
    - Javascript
tags:
    - node.js
    - socket.io
---

<div class="action-button">[Download](http://github.com/johanan/Building-Scalable-Apps-with-Redis-and-Node.js) the src(github). This is all of the code from the book.</div>I am excited to present an excerpt from my book, [Building Scalable Apps with Redis and Node.js](https://www.packtpub.com/web-development/building-scalable-apps-redis-and-nodejs). It is from the second chapter entitled Extending Our Development with Socket.IO. In the first chapter we created a simple Express app and now we are rolling in Socket.IO. This is only the end of the chapter. I, of course, highly recommend the book and hopefully after reading this you will agree.

This has been adapted from the source to better fit my blog’s presentation and has a few typos fixed, which means that there are a few typos in the book :(.

## Using Socket.IO and Express together

We previously created an Express application. This application is just the foundation. We are going to add features until it is a fully usable app. We currently can serve web pages and respond to HTTP, but now we want to add real-time communication. It’s very fortunate that we just spent most of this chapter learning about Socket.IO; it does just that! Let’s see how we are going to integrate Socket.IO with an Express application.

We are going to use Express and Socket.IO side by side. As I mentioned before, Socket.IO does not use HTTP like a web application. It is event based, not request based. This means that Socket.IO will not interfere with Express routes that we have set up, and that’s a good thing. The bad thing is that we will not have access to all the middleware that we set up for Express in Socket.IO. There are some frameworks that combine these two, but it still has to convert the request from Express into something that Socket.IO can use. I am not trying to knock down these frameworks. They simplify a complex problem and most importantly, they do it well (Sails is a great example of this). Our app, though, is going to keep Socket.IO and Express separated as much as possible with the least number of dependencies. We know that Socket.IO does not need Express, as all our examples have not used Express in any way. This has an added benefit in that we can break off our Socket.IO module and run it as its own application at a future point in time. The other great benefit is that we learn how to do it ourselves.

We need to go into the directory where our Express application is. Make sure that our `pacakage.json` has all the additional packages for this chapter and run `npm install`. The first thing we need to do is add our configuration settings.

### Adding Socket.IO to the config

We will use the same config file that we created for our Express app. Open up `config.js` and change the file to what I have done in the following code:

```js
var config = {
     port: 3000,
     secret: 'secret',
     redisPort: 6379,
     redisHost: 'localhost',
     routes: {
       login: '/account/login',
       logout: '/account/logout'
     }
￼};
module.exports = config;
```

We are adding two new attributes, `redisPort` and `redisHost`. This is because of how the `redis` package configures its clients. We also are removing the `redisUrl` attribute. We can configure all our clients with just these two Redis config options.

Next, create a directory under the root of our project named `socket.io`. Then, create a file called `index.js`. This will be where we initialize Socket.IO and wire up all our event listeners and emitters. We are just going to use one namespace for our application. If we were to add multiple namespaces, I would just add them as files underneath the `socket.io` directory.  
Open up app.js and change the following lines in it:

```js
//variable declarations at the top
var io = require('./socket.io');
//after all the middleware and routes
var server = app.listen(config.port);
io.startIo(server);
```

We will define the `startIo` function shortly, but let’s talk about our app.listen change. Previously, we had the `app.listen` execute, and we did not capture it in a variable; now we are. Socket.IO listens using Node’s `http.createServer`. It does this automatically if you pass in a number into its listen function. When Express executes `app.listen`, it returns an instance of the HTTP server. We capture that, and now we can pass the http server to Socket.IO’s listen function. Let’s create that `startIo` function.

Open up `index.js` present in the `socket.io` location and add the following lines of code to it:

```js
var io = require('socket.io');
var config = require('../config');
var socketConnection = function socketConnection(socket){
  socket.emit('message', {message: 'Hey!'});
};
exports.startIo = function startIo(server){
  io = io.listen(server);
  var packtchat = io.of('/packtchat');
  packtchat.on('connection', socketConnection);
￼  return io;
};
```

￼￼  
We are exporting the `startIo` function that expects a server object that goes right into Socket.IO’s `listen` function. This should start Socket.IO serving. Next, we get a reference to our namespace and listen on the connection event, sending a message event back to the client. We also are loading our configuration settings.

Let’s add some code to the layout and see whether our application has real-time communication.

We will need the Socket.IO client library, so link to it from `node_modules` like you have been doing, and put it in our static directory under a newly created `js` directory. Open `layout.ejs` present in the `packtchat\views` location and add the following lines to it:

```
<pre class="brush: xml; title: ; notranslate" title="">
<!-- put these right before the body end tag --><script>// <![CDATA[
   var socket = io.connect("http://localhost:3000/packtchat");
   socket.on('message', function(d){console.log(d);});
// ]]></script>
```

We just listen for a message event and log it to the console. Fire up node and load your application, `http://localhost:3000`. Check to see whether you get a message in your console. You should see your message logged to the console, as seen in the following screenshot:  
[  ](http://ejosh.co/de/2015/02/node-js-socket-io-and-redis-intermediate-tutorial-client-side-screencast/node-js-socket-io-and-redis-intermediate-tutorial-client-side-screencast-2/#main)[![Console output of Hey!](http://ejosh.co/de/wp-content/uploads/2015/03/4480_02_10.png)](http://ejosh.co/de/2015/03/book-preview-building-scalable-apps-with-redis-and-node-js/4480_02_10/#main)

Success! Our application now has real-time communication. We are not done though. We still have to wire up all the events for our app.

## Who are you?

There is one glaring issue. How do we know who is making the requests? Express has middleware that parses the session to see if someone has logged in. Socket.IO does not even know about a session. Socket.IO lets anyone connect that knows the URL. We do not want anonymous connections that can listen to all our events and send events to the server. We only want authenticated users to be able to create a WebSocket. We need to get Socket.IO access to our sessions.  
￼￼￼￼

### Authorization in Socket.IO

We haven’t discussed it yet, but Socket.IO has middleware. Before the connection event gets fired, we can execute a function and either allow the connection or deny it. This is exactly what we need.

#### Using the authorization handler

Authorization can happen at two places, on the default namespace or on a named namespace connection. Both authorizations happen through the handshake. The function’s signature is the same either way. It will pass in the socket server, which has some stuff we need such as the connection’s headers, for example. For now, we will add a simple authorization function to see how it works with Socket.IO.

Open up `index.js`, present at the `packtchat\socket.io` location, and add a new function that will sit next to the `socketConnection` function, as seen in the following code:

```js
var io = require('socket.io');

var socketAuth = function socketAuth(socket, next){
  return next();
  return next(new Error('Nothing Defined'));
};

var socketConnection = function socketConnection(socket){
  socket.emit('message', {message: 'Hey!'});
};

exports.startIo = function startIo(server){
  io = io.listen(server);
  var packtchat = io.of('/packtchat');
  packtchat.use(socketAuth);
  packtchat.on('connection', socketConnection);
  return io;
};
```

￼￼￼  
I know that there are two returns in this function. We are going to comment one out, load the site, and then switch the lines that are commented out. The socket server that is passed in will have a reference to the handshake data that we will use shortly. The next function works just like it does in Express. If we execute it without anything, the middleware chain will continue. If it is executed with an error, it will stop the chain. Let’s load up our site and test both by switching which return gets executed.

We can allow or deny connections as we please now, but how do we know who is trying to connect?

### Cookies and sessions

We will do it the same way Express does. We will look at the cookies that are passed and see if there is a session. If there is a session, then we will load it up and see what is in it. At this point, we should have the same knowledge about the Socket.IO connection that Express does about a request.

The first thing we need to do is get a cookie parser. We will use a very aptly named package called `cookie`. This should already be installed if you updated your `package.json` and install all the packages.

Add a reference to this at the top of `index.js` present in the `packtchat\socket.io` location with all the other variable declarations:

```js
var cookie = require('cookie');
```

And now we can parse our cookies. Socket.IO passes in the cookie with the socket object in our middleware. Here is how we parse it. Add the following code in the `socketAuth` function:

```js
var handshakeData = socket.request;
var parsedCookie = cookie.parse(handshakeData.headers.cookie);
```

At this point, we will have an object that has our `connect.sid` in it. Remember that this is a signed value. We cannot use it as it is right now to get the session ID. We will need to parse this signed cookie.

This is where cookie-parser comes in. We will now create a reference to it, as follows:

```js
var cookieParser = require('cookie-parser');
```

￼￼￼  
We can now parse the signed `connect.sid` cookie to get our session ID. Add the following code right after our parsing code:

```js
var sid = cookieParser.signedCookie (parsedCookie['connect.sid'], config.secret);
```

This will take the value from our `parsedCookie` and using our secret passphrase, will return the unsigned value. We will do a quick check to make sure this was a valid signed cookie by comparing the unsigned value to the original. We will do this in the following way:

```js
if (parsedCookie['connect.sid'] === sid)
return next(new Error('Not Authenticated'));
```

This check will make sure we are only using valid signed session IDs.  
The following screenshot will show you the values of an example Socket.IO authorization with a cookie:

[![An example of a parsed cookie.](http://ejosh.co/de/wp-content/uploads/2015/03/4480_02_11-580x38.png)](http://ejosh.co/de/2015/03/book-preview-building-scalable-apps-with-redis-and-node-js/4480_02_11/#main)

### Getting the session

We now have a session ID so we can query Redis and get the session out.

If you recall in Chapter 1, Backend Development with Express, when we added Redis as our session store, we mentioned that `connect-redis` extends the default session store object of Express. To use `connect-redis`, we use the same session package as we did with Express, `express-session`. The following code is used to create all this in `index.js`, present at `packtchat\socket.io`:

```js
//at the top with the other variable declarations
var expressSession = require('express-session');
var ConnectRedis = require('connect-redis')(expressSession);
var redisSession = new ConnectRedis({host: config.redisHost, port: config.redisPort});
```

The final line is creating the object that will connect to Redis and get our session. This is the same command used with Express when setting the store option for the session. We can now get the session from Redis and see what’s inside of it. What follows is the entire socketAuth function along with all our variable declarations:

```js
var io = require('socket.io'),
  connect = require('connect'),
  cookie = require('cookie'),
  expressSession = require('express-session'),
  ConnectRedis = require('connect-redis')(expressSession),
  redis = require('redis'),
  config = require('../config'),
  redisSession = new ConnectRedis({host: config.redisHost, port: config.redisPort});

var socketAuth = function socketAuth(socket, next){
  var handshakeData = socket.request;
  var parsedCookie = cookie.parse(handshakeData.headers.cookie);
  var sid = connect.utils.parseSignedCookie(parsedCookie['connect.sid'], config.secret);

  if (parsedCookie['connect.sid'] === sid)
    return next(new Error('Not Authenticated'));

  redisSession.get(sid, function(err, session){
  if (session.isAuthenticated) {
    socket.user = session.user;
    socket.sid = sid;
    return next();
  } else
    return next(new Error('Not Authenticated'));
  });
};
```

We can use `redisSession` and `sid` to get the session out of Redis and check its attributes. As far as our packages are concerned, we are just another Express app getting session data. Once we have the session data, we check the `isAuthenticated` attribute. If it’s true, we know the user is logged in. If not, we do not let them connect yet.

We are adding properties to the socket object to store information from the session. Later on, after a connection is made, we can get this information. As an example, we are going to change our `socketConnection` function to send the user object to the client. The following should be our `socketConnection` function:

```js
var socketConnection = function socketConnection(socket){
  socket.emit('message', {message: 'Hey!'});
  socket.emit('message', socket.user);
￼};
```

Now, let’s load up our browser and go to http://localhost:3000. Log in and then check the browser’s console. The following screenshot will show that the client is receiving the messages:

[![Socket.IO messages from the server](http://ejosh.co/de/wp-content/uploads/2015/03/4480_02_12.png)](http://ejosh.co/de/2015/03/book-preview-building-scalable-apps-with-redis-and-node-js/4480_02_12/#main)

## Adding application-specific events

We have extended our Express application we created in Chapter 1, Backend Development with Express, to include real-time communications using Socket.IO.  
The next thing to do is to build out all the real-time events that Socket.IO is going to listen for and respond to. We are just going to create the skeleton for each of these listeners. In Chapter 7, Using Backbone and React for DOM Events, we will add the code to respond to these events, as they are going to retrieve and add data to Redis.

Open up `index.js`, present in `packtchat\socket.io`, and change the entire `socketConnection` function to the following code:

```js
var socketConnection = function socketConnection(socket){
  socket.on('GetMe', function(){});
  socket.on('GetUser', function(room){});
  socket.on('GetChat', function(data){});
  socket.on('AddChat', function(chat){});
  socket.on('GetRoom', function(){});
  socket.on('AddRoom', function(r){});
  socket.on('disconnect', function(){});
};
```

Most of our emit events will happen in response to a listener.

## Using Redis as the store for Socket.IO

The final thing we are going to add is to switch Socket.IO’s internal communication about room participation. By default, Socket.IO will not let other Socket.IO nodes know about room changes. As we know now, we cannot have an application state that is stored only on one server. We need to store it in Redis. Therefore, we add it to `index.js`, present in `packtchat\socket.io`. Add the following code to the variable declarations:

```js
var redisAdapter = require('socket.io-redis');
```

￼￼￼￼

> An application state is a flexible idea. We can store the application state locally. This is done when the state does not need to be shared. A simple example is keeping the path to a local temp file. When the data will be needed by multiple connections, then it must be put into a shared space. Anything with a user’s session will need to be shared, for example.

The next thing we need to do is add some code to our startIo function. The following code is what our `startIo` function should look like:

```js
exports.startIo = function startIo(server){
  io = io.listen(server);
  io.adapter(redisAdapter({host: config.redisHost, port: config.redisPort}));

  var packtchat = io.of('/packtchat');
  packtchat.use(socketAuth);
  packtchat.on('connection', socketConnection);

  return io;
};
```

The first thing is to start the server listening. We create a new `redisStore` and set all the Redis attributes (`redisPub`, `redisSub`, and `redisClient`) to a new Redis client connection. The Redis client takes a port and the hostname.

## Socket.IO inner workings

We are not going to completely dive into everything that Socket.IO does, but we will discuss a few topics.

### WebSockets

This is what makes Socket.IO work. All web servers serve HTTP, that is, what makes them web servers. This works great when all you want to do is serve pages. These pages are served based on requests. The browser must ask for information before receiving it. If you want to have real-time connections, though, it is difficult and requires some workaround. HTTP was not designed to have the server initiate the request. This is where WebSockets come in.

WebSockets allow the server and client to create a connection and keep it open. Inside of this connection, either side can send messages back and forth. This is  
what Socket.IO (technically, Engine.io) leverages to create real-time communication.

Socket.IO even has fallbacks if you are using a browser that does not support WebSockets. The browsers that do support WebSockets at the time of writing include the latest versions of Chrome, Firefox, Safari, Safari on iOS, Opera, and IE 11. This means the browsers that do not support WebSockets are all the older versions of IE. Socket.IO will use different techniques to simulate a WebSocket connection. This involves creating an Ajax request and keeping the connection open for a long time.  
If data needs to be sent, it will send it in an Ajax request. Eventually, that request will close and the client will immediately create another request.

Socket.IO even has an Adobe Flash implementation if you have to support really old browsers (IE 6, for example). It is not enabled by default.

WebSockets also are a little different when scaling our application. Because each WebSocket creates a persistent connection, we may need more servers to handle Socket.IO traffic then regular HTTP. For example, when someone connects and chats for an hour, there will have only been one or two HTTP requests. In contrast, a WebSocket will have to be open for the entire hour. The way our code base is written, we can easily scale up more Socket.IO servers by themselves.

## Ideas to take away from this chapter

The first takeaway is that for every emit, there needs to be an on. This is true whether the sender is the server or the client. It is always best to sit down and map out each event and which direction it is going.

The next idea is that of note, which entails building our app out of loosely coupled modules. Our `app.js` kicks everything that deals with Express off. Then, it fires the `startIo` function. While it does pass over an object, we could easily create one and use that. Socket.IO just wants a basic HTTP server. In fact, you can just pass the port, which is what we used in our first couple of Socket.IO applications (Ping-Pong). If we wanted to create an application layer of Socket.IO servers, we could refactor this code out and have all the Socket.IO servers run on separate servers other than Express.

## Summary

At this point, we should feel comfortable about creating and using real-time events in Socket.IO. We should also know how to namespace our io server and create groups of users. We also learned how to authorize socket connections to only allow logged-in users to connect. We did this in the context of our Express application that we created in the previous chapter.

Our next chapter will demonstrate the correct way to authenticate users using Passport.