---
id: 401
title: 'node.js, socket.io, and redis: Beginners Tutorial – Client side'
date: '2012-07-29T18:26:19-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=401'
permalink: /2012/07/node-js-socket-io-and-redis-beginners-tutorial-client-side/
dsq_thread_id:
    - '848378280'
categories:
    - Javascript
tags:
    - javascript
    - node.js
    - redis
    - socket.io
---

<div class="action-button">[Download](https://github.com/johanan/Where-to-eat) the src(github)</div><div class="action-button">[View](http://thawing-cliffs-6040.herokuapp.com/) the demo</div>This demo has been updated since this was written. The new version uses Express 4.2.0 and Socket.IO 1.1.0. Some of the statements may not match what is currently in github.

In the [previous post](http://ejosh.co/de/2012/07/node-js-socket-io-and-redis-beginners-tutorial-server-side/) I discussed the server side. This post will cover client side. The server side has a lot less code because it only worries about taking the requests and putting them into redis and then sending them back out. The client has the all the display logic. Let’s get started.

## Socket.io

The great thing about [socket.io](http://socket.io) is that the client side is just as easy as the server side. The same three basic actions are there, connect, on, and emit. The basic idea is that one side emits to the on event of the other side. Socket.io will keep track of the connection for you. On the the side that listens you get whatever you passed through the connection.

I put all the socket.io methods into an object so that the rest of the app doesn’t have to worry about the connection, the other objects can just say ‘who voted?’. The first thing to do is to connect. I have an init() method that takes a url and connects (I thought I was going to add more, but it didn’t happen). The url is passed from the Josh.map object.

```js
var init = function(url){
		sock = io.connect(url);
};

//from the Josh.Map object
socket = new Josh.Socket('http://ejosh.co:8080/users');
```

If you look in the app.js code you see that we tell node.js to listen on port 8080 and socket.io has all of it’s events under the /users path.

Most of the other functions are just emits. The addUser function emits the username, image source, and area. On the server side you will find that the server has a method to listen for this.

```js

	Josh.Socket.prototype.addUser = function(username, img, area){
		sock.emit('add', username, img, area);
	};

        //server side app.js
	socket.on('add', function(username, img, area){codeHere;});
```

That is how easy it is to send and receive events with socket.io.

I want to highlight one other method in this object. That is the addEvent method. This allows you to tell this object to listen for a specific event and then pass it back to a defined object. The example I have is the vote event. When you vote or when you ask the server for all the votes, vote events are emited from the server. On the client you need to listen with an on method. The issue is that the client socket object really doesn’t care what is in the vote object. Other objects care. So we take the vote object and relay it over to the defined event. We user jQuery and it’s trigger method to fire the event and pass the data received on. Here is the example in action:

```js
//the socket object's addEvent
Josh.Socket.prototype.addEvent = function(name, obj){
	sock.on(name, function(d){ 
		$(obj).trigger(name, d);
		});
};

//now the object that does care about this event, Josh.Map
socket.addEvent('vote', this);
$(this).on('vote', function(e, d){});
```

If you follow the code you see that socket.io listens on the vote event and then will trigger the vote event on the passed in object (which is this on the Josh.Map side).

### TypeError: Converting circular structure to JSON

This error can be come up if you are using socket.io. It can be a huge pain to deal with. The error tells the issue, you have a circular reference in one of the objects you are trying to emit. I have found that one of the most likely culprits is an HTML element. You need to find it and remove it. In this application it kept popping up when I tried to send the vote to the server. I tied the marker(it has an HTML element in it) to the restaurant object. When I tried to send I would get the error. To fix it I made a copy of the object(I needed to copy it as I kept the object locally) and removed the offending attributes. I hope that this helps someone when using socket.io.

## Leaflet and the map object

[Leaflet](http://leaflet.cloudmade.com/) is a great looking easy to use library. I recommend it highly. The Josh.Map object is the main controller in this application. Most of the events flow through it and the other objects are properties of it. Its inital function sets up the map, the socket connection, the vote object, and all the events. All of the user interaction events flow through the Josh.Map object.

### Searching for Restaurants

The search is powered by [FourSquare](http://foursquare.com). It searches around your location with either the query restaurants or whatever you put in the search box. The one thing I will note though is that you should NOT implement the FourSquare API call like I did. I have my id and secret exposed. I pretty much did this out of ease. A simple call in my javascript and I am done. The other reason is that I wanted an unauthenticated API call. I did not want users to have to login with their FourSquare ids to see the restaurants.

So how should you do it? One thing you can do is implement an authenticated call. FourSquare has a few tutorials on this. It involves getting an Oauth token and using that instead of the API key. The other method you could use is a proxy method. I created a quick and dirty example in the fs.php file. All it does it make a curl call and then pass the info back out. This will hide your information and still allow you to make unauthenticated calls.

### Adding and removing Layers to the map

Leaflet controls all the map interactions. When we add a restaurant we ask Leaflet to create a marker that we can add to the map. If we would like to delete that same marker we need to keep a reference to it. This is done through the searchLayer object or by adding the marker as an attribute of the restaurant object. Votes get the marker added on and a search takes all the markers and adds it to layer group that can be added and removed together.

#### Markers

Both of the restaurant object and search layer needs markers. We want the markers to be smart. The marker needs to use the FourSquare icon if it is there and also have a click event so we can show more info about it. To use a custom icon for the marker we first extend the default icon.

```js
		RestIcon = L.Icon.extend({
			shadowUrl: null,
			iconSize: new L.Point(32, 32)
		});
```

This is set inside the object’s scope so we can call inside of the addMarker function.

```js
		addMarker: function(fs, layeradd){
			layeradd = typeof layeradd !== 'undefined' ? layeradd : true;

			var icon;
			if(fs.categories.length > 0){
				icon = new RestIcon( fs.categories[0].icon);
			}else{
				icon = new L.Icon('images/marker.png');
			}

			var markerLocation = new L.LatLng(fs.location.lat, fs.location.lng);
			var marker = new L.Marker(markerLocation, {icon: icon, title: fs.name});
			marker.fsid = fs.id;
			marker.img = icon.iconUrl;
			var This = this;
			marker.on('click', function(e){ This.showRest(e.target.fsid);});
			if(layeradd){
				this.map.addLayer(marker);
			}

			return marker;
		},
```

Here we do a quick check to see if there is a custom icon or to use the default icon. Then we create a marker using the icon and it’s location. Next we add an fsid that stores the FourSquare id (hence fsid). The FourSquare id is the key for every restaurant and vote. We can see why we did this when we add the click event. We load info to the right based on the fsid. Which we get from the target of the click. It is self contained. Finally we pass back the marker(the layeradd flag tells it to either add to map as a layer right then or to pass it back so it can be put into a layer group).

The reference to the created marker will be put into one of two places. First if it is for a vote on a restaurant it is tied to the restaurant vote object. This is done so we can delete the marker when we determine no one has a kept a vote for the restaurant. The other place is inside of a layer group that will be added as one. This entire layer can be removed as one later. You see this when you clear a search or make another search.

### Handling Votes

The Josh.Map object has the event handler for adding votes. It acts as a traffic cop here. It tells the Josh.Vote object to track the vote and then lets the Josh.Socket pass the vote to the server. After the server receives the vote it emits the vote back out to everyone. If you remember from earlier we registered an event on the Josh.Map to listen for the triggered event from the Josh.Socket event that listened for a vote. At this point it updates the UI by changing the vote counts and adding to the activity tab.

There is one interesting method that Josh.Map uses in regards to votes. The votes are stored as objects that have an array of users. If the array has two users we know that restaurant has two votes. The next question is how do we sort it? The answer is you create another array with the info you need and sort that with a custom sort function. When we create the new array we need to remember to add the user array length as one of the elements.

```js

			for(var r in this.voteFs.votes){
				voteArray.push([this.voteFs.votes[r].name, this.voteFs.votes[r].user.length, this.voteFs.votes[r].id, this.voteFs.votes[r].user]);
			}
```

Now we use our custom sort.

```js
voteArray.sort(function(a, b){return b[1] - a[1];});
```

This sort works because we tell it to compare the length of the user arrays we pulled out earlier. Now we can do a simple for loop and know that what is returned is sorted from high to low.

## Vote Object

The Josh.Vote object is the model for this application. It handles all client side syncing and tracking of votes. The server is kind of a model, but is is dumb in it’s actions. Server side votes are stored in a set. Only one key can exist for each user, so each vote is either a creation or an update to the set. There is no checking on anything before it is saved to the set. This is a design decision due to the fact that nothing in the redis store will last over two hours. Impersonations, bad votes, and everything else will be flushed in just a couple of hours. All of the checks(whether a person has voted already, whether a restaurant needs to be deleted from the map) is all done by the Josh.Map object.

This object is actually very simple. It has a votes object that stores every vote that is made. The vote that comes in will have a marker(usually) and a user tied to it. It then checks this object to see if the restaurant exists and if the user has voted. All of this logic is in the addVote method.

 Josh.Votes.prototype = {  
 addVote: function(vote){  
 //first check to see if this person has voted already  
 var userVote = this.findByUser(vote.user\[0\].username);  
 if(userVote !== undefined){  
 //this person voted, now check to see if this is the only vote  
 if(userVote.user.length === 1){  
 //only this person voted for this restaurant delete it  
 //but first take the marker off the map  
 //after checking to see if the new vote has a marker  
 if(vote.marker === undefined){  
 //it doesn’t so pass the marker  
 vote.marker = userVote.marker;  
 }  
 if(vote.id !== userVote.id){  
 //delete the marker only if the two rests are not the same  
 $(this).trigger(‘removeLayer’, userVote.marker);  
 }  
 }else{  
 //multiple people voted for it, just remove their vote  
 for(var i=0; i Summary

Hopefully I have explained the ideas and concepts correctly. If you have any questions, ask. If you have any code corrections , you can fork and issue a pull request. There are tests so make sure your code passes all the current tests and/or passes a new tests that are needed.

This application was a lot of fun to write. Node.js and socket.io make concurrent javascript programming simple.