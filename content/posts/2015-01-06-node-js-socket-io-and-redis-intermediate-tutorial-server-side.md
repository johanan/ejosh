---
id: 692
title: 'Node.js, Socket.io, and Redis: Intermediate Tutorial – Server side'
date: '2015-01-06T00:39:14-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=692'
permalink: /2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/
dsq_thread_id:
    - '3394398344'
image: /wp-content/uploads/2012/07/Nodejs_logo_light.png
categories:
    - Javascript
tags:
    - javascript
    - node.js
---

<div class="action-button">[Download](https://github.com/johanan/Where-to-eat) the src(github)</div><div class="action-button">[View](http://thawing-cliffs-6040.herokuapp.com/) the demo</div><div class="action-button">[Screencast](https://www.youtube.com/watch?v=-_u0NjmSKgI)</div>#### Blog Post Series

<div class="action-button">[Client side covering Bower, Grunt, Socket.IO, and Leaflet](http://ejosh.co/de/2015/02/node-js-socket-io-and-redis-intermediate-tutorial-client-side/)</div><div class="action-button">[Client side covering React and testing React](http://ejosh.co/de/2015/02/node-js-socket-io-and-redis-intermediate-tutorial-react/)</div>This post has been a long time coming, about a year in fact. Although I have not been lazy. As you can probably tell from my other posts and the little blurb at the end of each post, is that I have written a [book](https://www.packtpub.com/web-development/building-scalable-apps-redis-and-nodejs). It focuses on Node.js,Express, Passport, Socket.IO, Redis, RabbitMQ, React, Backbone, Grunt, and Ansible. All in one book! Which brings us to this post in a round about way.

One of my most popular posts is about using [Node.js, Socket.IO, and Redis](http://ejosh.co/de/2012/07/node-js-socket-io-and-redis-beginners-tutorial-server-side/) to build a small voting application. It is also my most forked repo on Github. After finishing the book I decided to revisit this codebase and see how it has held up over time. Unfortunately it needed some improvement. There is a law of programming that states any code that is more than three months old will be viewed as crap. Some of the improvements are upgrades to libraries (Express 4.2, Socket.IO 1.2) and [React](http://facebook.github.io/react/) for client side rendering (I am currently working on the client side and should be ready soon). Other improvements are just better code. An example of this is using promises for data retrieval and much better testing.

You will not need to read the previous post as I will take you through the all of the code and explain what it all does. This is my longest post to date, but it does cover everything you will need to know about the server side of this project. Here is what we will cover:

- Configuration and environment variables
- Express 4.2+
- Socket.IO 1.2+
- Redis and building a Redis data structure
- Repository pattern using dependency injection
- Testing the repository
- Testing Socket.IO

Let’s start at the beginning with the package.json.

## package.json

The package.json file for a Node.js project is the best place to start. This defines the main file, dependencies, any scripts that can be run, and many other things. Here is the package.json for this project.

```js
{
  "name": "Where-to-eat",
  "version": "0.8.0",
  "description": "Where to Eat",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "test": "./node_modules/.bin/mocha tests",
    "coverage": "./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- tests/*.js"
  },
  "dependencies": {
    "bower": "1.3.12",
    "express": "4.2.0",
    "q": "1.0.1",
    "redis": "0.10.0",
    "socket.io": "1.2.1",
    "url": "0.10.1"
  },
  "devDependencies": {
    "fakeredis": "0.2.1",
    "grunt": "0.4.2",
    "grunt-contrib-concat": "0.5.0",
    "grunt-contrib-jshint": "0.8.0",
    "grunt-contrib-uglify": "0.5.1",
    "grunt-contrib-watch": "0.5.3",
    "istanbul": "0.3.2",
    "mocha": "2.0.1",
    "socket.io-client": "1.2.1"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/johanan/Where-to-eat.git"
  },
  "author": "Joshua Johanan",
  "license": "BSD",
  "readmeFilename": "README.md",
}
```

First I want to highlight the versions for our dependencies. I am a strong proponent of pinned versions. This means that if I am building my app with Express 4.2.0, then that is the version I always want until I explicitly change it. I do not want 4.2.1 or 4.2.2. Next we will look at configuring our application.

## Config.js

The config file follows the advice from the [twelve factor app](http://12factor.net/config). The twelve factor app states that configuration values should be set in the environment. This ensures that the \*exact\* same code runs in every environment. You do not want to keep changing values every time you need to test something. You also do not need to keep an increasing number of environment settings. For example REDIS\_PROD, REDIS\_LOCAL, REDIS\_STAGING, etc. Let’s now look at the config.js file.

```js
var config = {
  REDISURL: getEnv('REDISURL'),
  PORT: getEnv('PORT'),
  FOURSQUAREID: getEnv('FOURSQUAREID'),
  FOURSQUARESECRET: getEnv('FOURSQUARESECRET')
};

function getEnv(variable){
  if (process.env[variable] === undefined){
    throw new Error('You must create an environment variable for ' + variable);
  }

  return process.env[variable];
};

module.exports = config;
```

We are going to export a simple javascript object with the values of our environment variables. We have a function getEnv that will throw an error if any variable does not exist. This is exactly what we want. This will save us from having to track down why FourSquare does not return any data. The earlier we can detect a major problem, the better. Missing a configuration value is a major problem so we throw an error which will kill our application. Here is an example of the environment variables you will need to use.

```
<pre class="brush: plain; title: ; notranslate" title="">
export REDISURL=redis://localhost:6379
export PORT=3000
export FOURSQUAREID=YOUR_FS_ID
export FOURSQUARESECRET=YOUR_FS_SECRET
```

We can now go to the next file which will use these values, app.js.

## Express for static assets

App.js is the entry point of our application. We will use this to grab most of our dependencies and make them work together. At the very top of app.js we want to put all of our require statements.

```js
var https = require('https'),
		express = require('express'),
		config = require('./config'),
		client = require('./redis'),
		socketio = require('./data/socket');
```

Now that we have all of our requirements we can start setting up the server. We want to create an Express app add some middleware to serve our static assets. These assets will be the HTML, JavaScript, and CSS for the client. We will look at all of these files in depth in the next post where we cover the client side. Next we set the port that the server will listen on. Here are the lines to do all of this.

```js
var app = express();

app.use(express.static(__dirname + '/static'));
app.set('port', config.PORT);
```

### Making a request in Node.js

Our next step is to setup a proxy for the FourSquare API. We do not require the user to log into FourSquare to search so we must use a FourSquare app key. This means we will proxy the requests so as to not leave our API key and secret on the client.

We will add a route in Express to listen for a GET request on the URL /foursquare. We then simply pipe back to the client FourSquare’s response. Here is the code for that.

```js
app.get('/foursquare', function(req, res){
	var clientRequest = https.request({
		host: 'api.foursquare.com',
		path: '/v2/venues/search?ll=' + req.query.lat + ',' + req.query.lon + '&client_id=' + config.FOURSQUAREID + '&client_secret=' + config.FOURSQUARESECRET +'&v=20140128&query=' + req.query.query
	}, function(httpResponse){
		res.setHeader('content-type', 'application/json');
		httpResponse.pipe(res);
	}).end();
});
```

The function definition for https.request (we want to make an HTTPS request) takes an options object, which has the host and path, and a function to handle the response. Inside of the function we set the header to make sure the browser processes the response as JSON and then we pipe the response. This takes a readable stream (httpResponse) and sends all the data to a writable stream (res). The final step, .end() on the HTTPS request, needs to be executed as this actually sends the HTTPS request. Without end() nothing would happen.

The next step is to actually have express create an HTTP server and start listening.

```js
var server = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + server.address().port);
});
```

## Adding in Socket.IO

We are now ready to see how Socket.IO integrates. All of the Socket.IO functions are in the file data/socket.js, so we will start there. First off we need to add our requirements.

```js
var socketio = require('socket.io'),
    repo = require('./repository'),
    User = require('./User');
```

Socket.IO is self expantory, repository is an abstraction for getting and setting data in Redis, and User is a class for tracking the user.

Next we export out the single function in the file initSockets.

```js
module.exports = initSockets;
```

This function takes an HTTP server object and a connection to Redis to map all the events for Socket.IO. First thing we do is have Socket.IO listen and then create a namespace.

```js
function initSockets(server, client){
  var io = socketio.listen(server);

  var users = io.of('/users').on('connection', function (socket) {
  var user;

    function serverError(err, message){
      console.log(err);
      socket.emit('serverError', {message: message});
    };
  //the rest of our code here
  });
}
```

We get a socket variable out of this that is our connection to the client. We now listen for specific events from the client. Socket.IO makes this really easy. ’emits’ sends a message and ‘on’ catches the message.

The user variable is used to track who the user is. This is defined in the connection event which means that this will not scale. Only the initial server will have access to how the user is. To make this scalable we would put this information in Redis and then use a cookie to tie the request to the user. The serverError function is a utility function. Anytime an error occurs on the server we want to alert the client.

We can now map all of our events that we want Socket.IO to respond to: add, addVote, and getVotes. First up is add. This is called when a new user joins the area.

```js
socket.on('add', function(username, area, ack){
      user = new User(username, area, socket.id);
      repo.setUser(username, area, 7200, client)
        .done(function(){
          socket.join(area);
          ack();
        }, function(err){
          serverError(err, 'Something went wrong when adding your user!');
        });
    });
```

Here we are making the setUser call to the repository. This returns a promise. If you have never used promises you can [read up on them](http://strongloop.com/strongblog/promises-in-node-js-with-q-an-alternative-to-callbacks/). If you have or you do not want to read that article the simple explanation is that a promise is a ‘promise’ to run a function asynchronously. It abstracts out passing in a callback to a function. This allows us to add multiple callbacks and add different callbacks that run whether the function was successful or not. Here we set two callbacks through the done function.

The done function takes a function for a resolved and a rejected outcome. On resolution (the first function) we join an area in Socket.IO then we execute the acknowledgement with ack(). This allows us to segment the users and the acknowledgement lets the client know that the server was successful. When the promise is rejected we use serverError. We will look at resolving and rejecting promises when we look at the repository and returning promises.

Next is the addVote event. This is called when a user creates a vote.

```js
    socket.on('addVote', function(fs){
      if(user !== undefined){
        repo.setVote(user.username, user.area, fs, 7200, client)
        .done(function(){
          io.of('/users').in(user.area).emit('vote', {username: user.username, fs: fs});
        }, function(err){
          serverError(err, 'Something went wrong when adding your vote!');
        });
      }
    });
```

This is very similar to the add event. We execute a repository command and then add our functions for the promise. The only new thing is the line in the resolved promise. First it gets the namespace ‘/users’, then it gets all the connections in the area, and finally it emits the vote. This is a demonstration of using both namespaces and areas in Socket.IO.

Next is the getVotes function. This is called when a new user joins the area. It sends back all of the current votes.

```js
    socket.on('getVotes', function(){
      var area = user.area;
      repo.getVotes(user.area, client).done(function(votes){
        votes.forEach(function(vote){
          socket.emit('vote', vote);
        })
      }, function(err){
        serverError(err, 'Something went wrong when getting the votes!');
      })
    });
```

Again this is very similar to the other two events. One thing to note is that there is a forEach in the resolved promise. This is one of the few times a foreach works. Foreach is a synchronous action and can cause issues in Node.js. Here it is not a big deal as each loop in the foreach runs an asynchronous process, which is an emit on the socket. Here Socket.IO will send back each vote to the client that asked for the votes.

Finally we are at the disconnect event. This is called automatically by Socket.IO when a client closes their browser tab.

```js
    socket.on('disconnect', function(){
      if(user !== undefined){
        socket.leave(user.area);
        repo.removeUser(user.username, user.area, client).done(null,
        function(err){
          serverError(err, 'Something went wrong when leaving!');
        });
      }
      user = null;
    });
```

This is just some housekeeping. We make sure the user leaves the area and is removed from Redis.

### Socket.IO Summary

Our use of Socket.IO is very straight forward here. We create a namespace and listen for four events. Inside of each event we call a method on the repository and then deal with the promise that comes back. This is why we have made the design decision of a repository and promises. It makes our code very clean and easy to understand.

## Redis and the Repository

First thing we will look at is how to use Redis and build a data structure.

### Redis

[Redis](http://redis.io) is a self described “open source, advanced key-value store”. This is a very different concept from relational databases. The easiest way to think about is that in a RDBS you create rows which can have mulitple fields, compared to redis where each row is a field. For example in a RDBS if you want to hold the URL for an image you would add a text/varchar field in your row. In redis you would create a user:userid:img key which would hold the data. You could also use a hash to add columns to a key.

### Redis data structure

The data structure really just breaks down to users and votes. Each user is part of an area (the area is set on the client side by adding a hash to the URL) and gets a vote in each area. That’s it. Here is what an area would look like if you collected all the keys.

- id – \[area\]:users:\[username\]
- vote – \[area\]:users:\[username\]:vote
- set of users – \[area\]:users
- set of votes = \[area\]:votes

The id is stored in a set with a key of \[area\]:users. If given an area you would be able to list all the users. The id is also stored in a another set that tracks the votes with a key of \[area\]:votes. Again if given an area you can list all the votes along with the user that gave the vote. That is it, the entire data structure.

The only other thing we do is expire the keys. The votes will expire in two hours and the users in four hours. This is because a vote references a user and I want to make sure that the user exists if it is looked up. This is not the best way as there are some edge cases where a vote or user would not exist, but it is very simple and straight forward.

### Redis in our Application

We are now ready to look at connecting to Redis and using our repository. The file redis/index.js is where we make a connection to Redis.

```js
var config = require('../config'),
    redis = require('redis'),
    url = require('url');

var redisConfig = url.parse(config.REDISURL);
var client = redis.createClient(redisConfig.port, redisConfig.hostname);

if (redisConfig.auth !== null)
  client.auth(redisConfig.auth.split(':')[1]);

client.on('error', function(e){
  console.log(e);
});

module.exports = client;
```

This file pulls in our Redis client, parses a URL with the Redis connection information, and adds an error handler. This is just a simple abstraction of the Redis connection so that we can inject it into our repository. This injection makes testing much easier as we will see later.

We are using ‘THE’ Redis client for Node.js. It is really simple in that each Redis command is the name of the function. For example the [GET command](http://redis.io/commands/get) is client.get(). Each function then takes a callback in the form of function(err, data). Low complexity makes for ease of use.

### The Repository

The repository is a group of functions that make adding and removing data from Redis easy. Each function will have the Redis client injected and return a promise. Here are the requirements and exports. The only new thing to note is that [q](https://github.com/kriskowal/q) is the promise library we are using.

```js
var q = require('q');

module.exports.getVote = getVote;
module.exports.getVotes = getVotes;
module.exports.removeUser = removeUser;
module.exports.setUser = setUser;
module.exports.setVote = setVote;
```

Now we will look at the simplest function removeUser.

```js
function removeUser(username, area, client){
  return q.Promise(function(resolve, reject, notify){
    client.srem(area+':users', area+':users:' + username, function(err){
      if(err)
        reject(err);
      resolve();
    });
  });
};
```

Here we see the opposite side of promises, the creation and resolution. We wrap our entire function in the promise. This essentially creates a try/catch around anything we do. If something throws an error the promise will be rejected. The two most important things in a promise are the functions resolve and reject. They do exactly what you think they do. In removeUser we create a Redis key from the arguments and then run the srem (set remove member) function. If an error occurs reject the promise, if not resolve the promise.

I want to quickly highlight this design pattern. Many libraries in Node.js will use the error callback pattern. This is where an error will be the first argument and if there is no error it will be null. It becomes very easy to just ignore this error. Promises allow us to immediately reject the promise and add a handler for the rejected state. This pattern is in all the other functions and I will not spend time covering this over and over.

Next is the setUser function.

```js
function setUser(username, area, expire, client){
  return q.Promise(function(resolve, reject, notify){
    client.multi()
      .setex(area+':users:' + username, expire, username)
      .sadd(area+':users', area+':users:' + username)
      .expire(area+':users', expire)
      .exec(function(err){
        if(err === null){
          resolve();
        }else{
          reject(err);
        }
      })
  });
};
```

This function uses the Redis command multi. It creates a transaction that all the commands will be executed in. Like RDBMS transactions this is atomic and either happens or is rolled back. Here we add each new command to the transaction, but we do not add a callback. Finally we use the exec function which will return an error and an array of all the data returned from commands. Because all of our commands do not return any data we will just want to watch for the error. The last thing to notice is that each key, the username key and the user set, has expire used on it (the setex command sets the key and expire).

Next is the setVote function.

```js
function setVote(username, area, fs, expire, client){
  return q.Promise(function(resolve, reject, notify){
    client.multi()
      .setex(area+':users:' + username + ':vote', expire, JSON.stringify(fs))
      .sadd(area+':votes', area+':users:' + username)
      .expire(area+':votes', expire)
      .exec(function(err){
        if(err === null){
          resolve();
        }else{
          reject(err);
        }
      });
  });
};
```

This is exactly like setUsers except we use different keys.

Next is getVote.

```js
function getVote(key, client){
  return q.Promise(function(resolve, reject, notify){
    client.get(key, function(err, username){
      if(err)
        reject(err);
      if(username === null)
        reject('Username is null');

      client.get(key + ':vote', function(err, vote){
        if(err)
          reject(err);
        if(vote === null)
          reject('Vote is null');
          resolve({username: username, fs: JSON.parse(vote)});
      })
    });
  });
};
```

This function is straight forward except for it runs one Redis get command inside of the response of another. This is because you must first get the username and then the vote. This highlights the use of promises as we reject the promise the exact same way no matter which function’s callback we are in. The other new addition is that resolve returns data. This is done just like returning data in a callback.

Finally we have getVotes, the most complex function in the repository.

```js
function getVotes(area, client){
  return q.Promise(function(resolve, reject, notify){
    client.smembers(area+':votes', function(err, votes){
      if(err)
        reject(err);
      if(votes.length > 0){
        var length = votes.length;
        var returnVotes = [];
        votes.forEach(function(key){
          getVote(key, client).done(function(vote){
            returnVotes.push(vote);
            length--;
            if(length === 0)
              resolve(returnVotes);
          }, function(err){
            reject(err);
          });
        });
      }else{
        resolve([]);
      }
    });
  });
};
```

We start off by getting all votes in an area. This data structure will be an array. The next step is to look up each vote using the getVote function and add it to our returnVotes array. getVotes returns a promise, so we must add our resolved and rejected functions to done. One more important detail is how we loop through the array. We cannot just resolve the promise until we have processed each array member. We do this be getting the length of the array and decrementing it each time we process a vote. When it is zero we resolve the promise.

## Testing

Testing was missing from the previous project, so this is a major addition. The testing framework we will use is [mocha](http://mochajs.org/) and the coverage framework is [istanbul](http://gotwarlost.github.io/istanbul/). Both of these are in the package.json. I will not go into every test as you can look them up in the github repo. I will show how to test Redis and Socket.IO code as it is not exactly straight forward.

We also will not add any tests for the core functionality of Redis or Socket.IO. We trust (or can look at the code) that each project has a full set of tests that will test all the functionality for us. We just want to test the functions in our repository and Socket.IO modules.

### Testing Redis

To test Redis we will use [fakeredis](https://github.com/hdachev/fakeredis). It simulates connecting to and using Redis. This is so we do not need a Redis instance running when testing. This is important because we want tests to be easy to setup and execute. Using fakeredis we can even create mutliple different instances and run tests in parallel without data leaking.

Our test of the repository is in test/repositoryTest.js. Here is what we require.

```js
var assert = require('assert'),
    client = require('fakeredis').createClient('test'),
    repo = require('../data/repository');
```

Assert is what we will use to to actually test, client is a connection to a fakeredis instance, and repo is our repository. Next we will look at the setup of a test block.

```js
describe('Repository Test', function(){

  beforeEach(function(){
    client.flushdb();
  });

  afterEach(function(){
    client.flushdb();
  });
  
  //all the tests go here
});
```

Describe is a test block that will wrap all of our tests. beforeEach and afterEach run before and after each test respectively (aptly named!). We are running client.flushdb to make sure that the Redis instance is clean before we add or remove data.

Now we will look at one test as all the other tests follow this design.

```js
  it('setUser should set username', function(done){
    var user = repo.setUser('josh', 'default', 7200, client);
    user.done(function(){
      client.get('default:users:josh', function(e, d){
        assert.equal(d, 'josh');
        done();
      });
    });
  });
```

it (the function) is how we create a test. The test executes repo.setUser and checks to see if the correct Redis keys are created. This is where our dependency injection pays off. We inject our fakeredis instance into the repository. Our test does not rely on Redis running, environment variables being set, config.js, or redis/index.js. Again this is very important. A unit test should only test the smallest possible scope. If we cannot test a function without needing a lot of external requirements, then we should redesign the function. In the resolution of the promise we can then just query our fakeredis instance for the keys we expect. Finally we call done() which lets mocha know that this test is done.

Some tests do require that we prep the data. For example in getVote, we will need a vote so that the function can return it. All we have to do is create the keys before we run the function.

### Testing Socket.IO

Our Socket.IO implementation is strongly tied to Socket.IO unlike our repository. This means we will run integration tests instead of unit tests. Let us look at the requirements for our tests.

```js
var assert = require('assert'),
    fakeRedis = require('fakeredis'),
    http = require('http'),
    socketio = require('../data/socket'),
    io = require('socket.io-client');
```

Here we are using fakeredis and http to create different servers that will work with our Socket.IO function (remember it takes an HTTP server and Redis client). We then include the Socket.IO client. One of the great things about Node.js is that it is all JavaScript. If we need a client side library we can usually just include it and use it.

Now let’s setup the server and prep the tests.

```js
var options ={
  transports: ['websocket'],
  'force new connection': true
};

describe('Socket.io Test', function(){
  var ioClient,
      ioClient2,
      client = fakeRedis.createClient('test'),
      server = http.createServer().listen(0);

  socketio(server, client);

  beforeEach(function(done){
    ioClient = io('http://localhost:' + server.address().port + '/users', options);
    ioClient2 = io('http://localhost:' + server.address().port + '/users', options);
    //all tests require a user created
    ioClient.on('connect', function(){
      ioClient2.on('connect', function(){
        ioClient.emit('add', 'josh', 'area', function(){
          ioClient2.emit('add', 'josh2', 'area', function(){
            done();
          });
        });
      });
    });
  });

  afterEach(function(){
    client.flushdb();
    ioClient.disconnect();
    ioClient2.disconnect();
  });

  //all the tests go here
});
```

We create our HTTP server on a random port. We then connect to it before each test. After connecting we create a user so that we can vote if needed. The beforeEach is acting like a browser client here. After each test we clean up by clearing Redis and disconnecting each Socket.IO client.

Here is a test that would run.

```js
  it('should add a vote', function(done){
    ioClient.on('vote', function(vote){
      assert.strictEqual(vote.username, 'josh');
      assert.strictEqual(vote.fs, 'fs');
      done();
    });
    ioClient.emit('addVote', 'fs');
  });
```

We add a listener for the vote event and make sure that the data is what we expect it to be. We then trigger that event with an emit. Another thing we can do is add an event listener to the other Socket.IO client to make sure events are broadcast. In addition we still have a reference to the fakeredis instance, so we can also check that it runs the correct repo command.

We now want to test when things go wrong. All of our Socket.IO functions have a function for a rejected promise. We want to test those functions. We are going to connect and then quit the fakeredis connection. Here is the setup for that.

```js
describe('Socket.io failure Test', function(){
  var ioClient,
      ioClient2,
      client,
      server;

  beforeEach(function(done){
    client = fakeRedis.createClient();
    server = http.createServer().listen(0);

    socketio(server, client);
    ioClient2 = io('http://localhost:' + server.address().port + '/users', options);
    ioClient = io('http://localhost:' + server.address().port + '/users', options);
    ioClient.emit('add', 'josh', 'area', function(){
      client.quit();
      done();
    });
  });

  afterEach(function(){
    ioClient.disconnect()
    ioClient2.disconnect();
  });

  //all the tests go here
});
```

The difference here is we create each client and server for each test. This is so that we can create failures at different points in the process. To create the failure we quit the fakeredis connection after adding a user. Now every call should return a serverError event. Here is an example test.

```js
  it('should send an add user error', function(done){
    ioClient.on('serverError', function(m){
      assert.strictEqual(m.message, 'Something went wrong when adding your user!');
      done();
    });

    ioClient.emit('add', 'josh', 'area', function(){} );
  });
```

We emit an event and make sure that correct serverError is returned.

### Running the Tests

Npm has the ability to run arbitrary commands that we create. We do this by adding them to the scripts property in package.json. This allows us to execute npm run \[command\] at any command line. We have two commands: test and coverage. To run the test we can type npm test at a command prompt (test is a special keyword, although npm run test will work). We can also run npm run coverage to get a coverage report.

Here is the output of npm test:

[![npm test](http://ejosh.co/de/wp-content/uploads/2015/01/npm_test.png)](http://ejosh.co/de/2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/npm_test/#main)

Here is an example of npm run coverage:

[![npm run coverage](http://ejosh.co/de/wp-content/uploads/2015/01/npm_run_coverage.png)](http://ejosh.co/de/2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/npm_run_coverage/#main)

We can see that it is currently at 91%. The missing lines and branches are from errors that we have not created.

### Testing Summary

Testing gives you the confidence that your application is running how you expect it to. It also allows you to refactor freely because you can make sure that you are not introducing new bugs. We covered unit testing our repository by dependency injection and testing Socket.IO with integration tests.

## Summary

This project is much better now. First off it has much better test coverage. All the major logic points, data functions, and Socket.IO events have tests. We can be confident this will work exactly how we expect it to. Second the use of promises makes sure we are responding to errors that happen and not just quietly swallowing them. For example if the Redis server goes down the client will let the user know that an action did not occur on the server side. Third we have flattened the logic. This means that we do not have massive monolithic functions anymore. For example our Socket.IO events all are very similar and simple, run a repo command then if it succeeds respond with success or if it does not then let the user know. We can easily look at the 3-5 lines of each function and know exactly what is happening. Fourth and lastly we have upgraded all the libraries to their newest version. The biggest jump is with Socket.IO. Socket.IO had some issues in it’s 0.9 state. Many of those have been fixed in 1.2 and that is the version we are using.

Stay tuned as I have the client side coming soon!