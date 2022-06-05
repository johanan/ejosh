---
id: 397
title: 'node.js, socket.io, and redis: Beginners Tutorial  Server side'
date: '2012-07-15T21:00:52-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=397'
permalink: /2012/07/node-js-socket-io-and-redis-beginners-tutorial-server-side/
dsq_thread_id:
    - '846942939'
image: /wp-content/uploads/2012/07/Nodejs_logo_light.png
categories:
    - Javascript
tags:
    - javascript
    - node.js
    - redis
    - socket.io
---

<div class="action-button">[Download](https://github.com/johanan/Where-to-eat) the src(github)</div><div class="action-button">[View](http://thawing-cliffs-6040.herokuapp.com/) the demo</div>> This project has been updated since this was published. The project now includes Express 4.2, Socket.IO 1.2, newer version of Redis, promises, and testing. It is all around better and more up to date. You can read the new post [here](http://ejosh.co/de/2015/01/node-js-socket-io-and-redis-intermediate-tutorial-server-side/).

This is a simple application that I have used to try my hand at node.js, socket.io, and redis. The idea came from a co-worker who asked me if I could build an application to collect the votes of our other co-workers to determine where to eat. An initial inspiration came from geoloqi through a [game](https://geoloqi.com/blog/2011/09/building-a-real-time-location-based-urban-geofencing-game-with-socket-io-redis-node-js-and-sinatra-synchrony/) they created. It introduced me to using node.js, socket.io, and redis together to keep multiple browsers in sync.

I had a period of rethinking the entire app design as node.js and redis are both new and different concepts. Node.js requires you to think about how and when(Fenn Bailey has a great post about how ifs and loops work completely different in node (or not at all depending on your point of view). You can get a lot of nulls out of loops if you do not plan out correctly. Redis is a simple and fast key-value store. It has some useful built-in types, but what it doesn’t have is a schema. You cannot map out a row with an id and multiple fields. You have to map your data to keys and sets. I will cover all of my node and redis issues and solutions in this post.

## node.js

I am not really doing a lot with node.js here. Node is filling in the server role to give me a platform that I can build from. Although technically that’s what every node.js application does. My node.js parts just listen on 8080 and returns “Hello Socket” on any request. I could have pulled in the HTML to serve from node, but I am just letting Apache serve it. All the good parts are in socket.io which connects through javascript.

One thing you will run into is that node doesn’t have a daemon. When you are debugging this is not an issue as you just run it from the command line and let go. You can run the process in the background, but that is prone to issues. I have found [forever](http://blog.nodejitsu.com/keep-a-nodejs-server-up-with-forever) as a great way to keep a node.js app running.

The only ‘true node.js’ code in my app.js:

```js
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app, {origins: '*:*'});

var redis = require("redis");
client = redis.createClient();

app.listen(8080);

function handler (req, res) {
	//I don't know if I need this
    res.writeHead(200);
    res.end("Hello Socket");
  
}
```

## Redis

I am first going to cover redis and my data design and then move on to socket.io. [Redis](http://redis.io) is a self described “open source, advanced key-value store”. This is a very different concept from relational databases. The easiest way to think about is that in a RDBS you create rows which can have mulitple fields, compared to redis where each row is a field. For example in a RDBS if you want to hold the URL for an image you would add a text/varchar field in your row. In redis you would create a user:userid:img key which would hold the data. The use of no schema key value store was one reason I wanted to use redis, as I have never used something like this to store application data. Another reason was speed. Redis is an in memory store. Simple value calls are fast. This application does not have a lot of data and that is a good use case for redis. If I had bigger datasets I would probably use something else.

### Data Structure

The data structure really just breaks down to users and votes. Each user is part of an area (the area is set on the client side by adding a hash to the URL) and gets a vote in each area. That’s it. Here is what a user would look like if you collected all the keys.

- id – \[area\]:users:\[username\]
- image URL – \[area\]:users:\[username\]:img
- vote – \[area\]:users:\[username\]:vote

The id is stored in a set with a key of \[area\]:users. If given an area you would be able to list all the users including an image, and that users vote. The id is also stored in a another set that tracks the votes with a key of \[area\]:votes. Again if given an area you can list all the votes along with the user that gave the vote. That is it, the entire data structure.

I also use the expiration method of redis to expire all the keys. Each value is set to expire two hours later. This allows the application to reuse areas for different meals (lunch and dinner). It also stops the store from growing too large. This works great for all the user values. It does not work so great for sets. When I try to expire a set, redis turns the set into a value key. I would only have one of the values in the set and it would overwrite the current value when I tried to set anything to it. This is not what I wanted.

> I will note that I am using redis 1.2 which is the version in the default repos of my version of Ubuntu. I know that I can download and compile a new version or use a ppa, but I did find a way to make it work how I wanted.

To ensure that the sets did not live on forever is that I created another key called timer for each area (\[area\]:votes:timer) and set an expiration on that. That key was then put into a set called expireKeys that is looped through every 10 minutes to see if the timers have expired and then delete the matching sets. It is not a lot of overhead as it only runs every ten minutes and it makes sure that the redis store stays clean.

Let’s look at some code on how to save a user to redis in node.js. The client variable is created and set earlier in the script as <span class="code-snip">var client = redis.createClient();</span>

```js
function setUser(username, img, area, expire){
	client.set(area+':users:' + username, username);
	client.expire(area+':users:' + username, expire);
	client.set(area+':users:' + username + ':img', img);
	client.expire(area+':users:' + username + ':img', expire);
	//set a timer
	client.set(area+':users:timer', expire);
	client.expire(area+':users:timer', expire);
	client.sadd(area+':users', area+':users:' + username);
	//add the set to the expire set
	client.sadd('expireKeys', area+':users');
};
```

This is pulled out into a function and is called when a user addition event is fired. It is very straightforward, key is created with set and then expired with expire. The identity (area:users:username) is then added to the set area:users with sadd.

Setting a vote is very similar.

```js
function setVote(username, area, fs, expire){
	client.set(area+':users:' + username + ':vote', JSON.stringify(fs));
	client.sadd(area+':votes', area+':users:' + username);
	//add the set to the expire set
	client.sadd('expireKeys', area+':votes');
	//set a timer
	client.set(area+':votes:timer', expire);
	client.expire(area+':votes:timer', expire);
};
```

There is not history with this implementation. If you voted before your vote is overwritten in the set as each voter can only be in the set once. The same is true with users. This does open up impersonation and vote tampering, but with this application I view that as more of a people problem than a technical problem. I also do not think it is a serious issue as all votes and users are gone in a couple of hours.

I will cover the function that checks for expired keys now. This demonstrates how things flow in node.js.

```js
function checkExpires(){
	//grab the expire set
	client.smembers('expireKeys', function(err, keys){
		if(keys != null){
			keys.forEach(function(key){
				console.log(key);
				client.get(key+':timer', function(err, timer){
					//grab the timer
					if(timer != null){
						//timer exists check the ttl on it
						client.ttl(key+':timer', function(err, ttl){
							//the ttl is two hours and if it is under an hour
							//and a half we delete it
							if(ttl < 5400){
								console.log(ttl);
								client.del(key);
								client.srem('expireKeys', key);
							}
						});
					}else{
						//the timer is gone delete the key
						client.del(key);
						client.srem('expireKeys', key);
					}
				})
			});
		}
	});
};
```

There are a lot of brackets. This is because in node everything is done in a callback. You make a request or in this case a redis call and the value is returned in a callback. You do not write <span class="code-snip">var ttl = client.ttl(key+’:timer’);</span>, you write <span class="code-snip">client.ttl(key+’:timer’, function(err, ttl){//use ttl here});</span>. In the function above all the tabs and brackets are there because it is running a callback inside of a callback inside of a callback. When we first we get the keys, this will be returned as an array. If we try to set a variable to this in the current scope it will always return null. This is different from writing javascript on the client side. The data you want only lives in the callback, so everything happens in the callback. Callbacks are not anything new to javascript and if you can adjust to this thinking, writing node apps becomes a whole lot easier.

## Socket.io

[Socket.io](http://socket.io) makes it trivial to connect multiple browsers and have them react in realtime with each other. There are many chat demos out there that show how to take a message from one browser and send it to all the others immediately. That is all this application is doing. When someone votes it is broadcast out to everyone else in the same area. In the context of node.js, socket.io is where all the events are created and handled. Socket.io has all the wiring to respond to the clients requests.

First thing to do is listen for connections. Because this is node everything else happens in the callback from this. This application is listen on the /users path.

```js
var users = io.of('/users').on('connection', function (socket) { //everything here });
```

We get a socket variable out of this that should be our connection to the client. We now listen for specific events from the client. Socket.io makes this really easy. Emits send a message and ‘on’ catches the message. In this application we have three events we created and one built-in event; add, addVote, getVotes, and disconnect. Socket.io also has support for rooms. This allows you to group your connections into specific, um… well, groups. You can then send a broadcast to just connections in that room. Just like everything else socket.io does this is very easy.

Here is the add event.

```js
	socket.on('add', function(username, img, area){
	if(!usernameExists(area, username)){
		setUser(username, img, area, 7200);
	}
		//var test = new User(username, img, area, socket.id);
		socket.join(area);
		user = new User(username, img, area, socket.id);
		socket.set('user', user);

		});
```

The socket.on method is where you specify the event name and what parameters it is expecting. In this method we store the username and img URL in redis with the setUser function and then socket.join the area which was specified.

Here is addVote.

```js
	socket.on('addVote', function(fs){
		if(user !== null){
				setVote(user.username, user.area, fs, 7200);
				io.of('/users').in(user.area).emit('vote', {username: user.username, img: user.img, fs: fs});
				//socket.emit('vote', {username: user.username, img: user.img, fs: fs});
		}
	});
```

The fs parameter is a FourSquare venue object. We store the vote in redis with the current users information (which was set in the add event). We then broadcast it to everyone in the current area. With socket.io it is one line of code. This will emit an event to everyone that has added a user in this area.

Here is getVotes.

```js
	socket.on('getVotes', function(){
		var area = user.area;
			client.smembers(area+':votes', function(err, votes){
				if(votes != null){
					votes.forEach(function(key){
						client.get(key, function(err, username){
							client.get(key + ':vote', function(err, vote){
								client.get(key + ':img', function(err, img){
									socket.emit('vote', {username: username, img: img, fs: JSON.parse(vote)});
								});
							});
						});
					});
				}
			});
	});
```

Notice all the brackets. We are calling callbacks inside of callbacks. It will grab one bit of info (for example the img of the user that made the vote) and send it to a callback. When we get 5 callbacks in we finally emit the info back to the asking client. My first iteration through when writing this I was trying to populate an array with all this info and make one emit call. I kept getting nulls everytime. I finally quit trying to fight node.js and work with how it was architected by using callbacks.

## Summary

I am sure there are better ways to do this, but it does work. This application has helped me think differently about how to design an app. Key value stores and evented I/O is something I have never worked with before. Hopefully I can jumpstart someone down these paths by solving a problem. I will cover the client side in the next post.