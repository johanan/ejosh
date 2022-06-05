---
id: 226
title: 'HTML 5 run tracking application'
date: '2012-04-25T22:25:57-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=226'
permalink: /2012/04/html-5-run-tracking-application/
dsq_thread_id:
    - '847091870'
image: /wp-content/uploads/2014/02/runbrowser114.png
categories:
    - Javascript
tags:
    - HTML5
    - javascript
    - 'Open Layers'
---

<div class="action-button">[Download](https://github.com/johanan/RunBrowser) the src(github)</div><div class="action-button">[View](http://runbrowser.s3-website-us-east-1.amazonaws.com/) the demo</div>> The github repo has been updated. Some of the code will not match what is currently in the repo.

An idea that I have had for awhile is a [RunKeeper](http://runkeeper.com) like application that runs completely in the browser. This is not due to any inherit issues with the RunKeeper application, just more of a proof-of-concept. HTML 5 makes this easy. We can save old runs and run without an Internet connection making it almost a native app.

The only phone I have tested this with is an iPhone 4S as that is the only phone I have access to. It should work with an iPhone 4 and possibly a 3GS, but I cannot say for sure. Android should work as well as it should support everything I am doing with HTML 5 and javascript. Desktops can also try it out if you are using any modern browser: Chrome, FireFox, or Safari. You won’t get a path and possibly get an error if your browser cannot get a location. I have tested it in IE and it does not work. I have no plans to try and make it work as the only place I was trying to make it work was the iPhone. Although not supporting IE has made the code a lot cleaner.

> RunKeeper in the browser: RunBrowser

## HTML 5 – almost a native app

HTML 5 gives us many new methods to make a webpage an application. Before HTML 5 there were many workarounds to make a webpage do what we wanted it to. Now they are built right into the browser. The first thing I am going to cover is [application cache](http://www.html5rocks.com/en/tutorials/appcache/beginner/). This allows us to tell the browser to store certain resources in case we do not have access to the Internet. We also can specify fallback resources if need be. First we specify the cache manifest which tells the browser what to cache.

```
<pre class="brush: xml; title: ; notranslate" title="">
<html manifest="/cache.manifest">
```

One bit of advice is to make sure that your web server is serving the cache manifest as mime-type text/cache-manifest. If not you will run into problems. Please see the resource I linked to for [application cache](http://www.html5rocks.com/en/tutorials/appcache/beginner/) or search the Internet on how to configure your web server. Once it serving correctly we tell it what to cache.

```
<pre class="brush: plain; title: ; notranslate" title="">
CACHE MANIFEST 
#version 3

CACHE:
#css cache
/css/bootstrap.min.css
/css/bootstrap-responsive.min.css
/theme/default/style.css

#image cache
/img/glyphicons-halflings.png
/img/glyphicons-halflings-white.png

#content and js cache
/index.html
/runBrowser.min.js
/OpenLayers.js
/

NETWORK:

FALLBACK:
```

This manifest is very straightforward as this application is only one html file and two javascript files. We tell the browser to cache the CSS, HTML, and javascript. If you load the site once and then turn off your data you will see that it loads fine. The only thing that will not work correctly is the map. Technically the app will still draw your path, but it will not have map tiles behind it (unless you have already cached them).

[LocalStorage](http://diveintohtml5.info/storage.html) is the next HTML 5 feature we will use. It gives us a simple key -&gt; value interface. We set each run’s key as its start based on the first point’s timestamp. We then JSON stringify our runPath object.

```js
localStorage.setItem(this.runPath.startTime, JSON.stringify(this.runPath));
```

We do run into an issue when we get the item out of localStorage, we lose the methods tied to the object. The way I fix this is create a new object of the type you want and then re-hydrate it with the data from localStorage. Here is how I load saved runs

```js
var runp = new runPath();
var old = JSON.parse(localStorage.getItem(datakey));

runp.startTime = old.startTime;
runp.distance = old.distance;
runp.lastUpdateTime = old.lastUpdateTime;
runp.pointArray = old.pointArray;
```

Application Cache and localStorage makes this webpage work like a native app. You can use it without a network connection and it will store information about past uses.

## No jQuery, why?

Another challenge I wanted to try was not using jQuery for this. jQuery is an awesome library and makes many of the things I do in this application easier, but I wanted to keep the javascript down in size. There also is the fact that I am technically just supporting one browser, mobile Safari. jQuery helps with cross browser implementations. I recommend trying to build everything without jQuery first and then pull it in where needed. It makes you understand javascript much better. Besides not using jQuery I did not want to use backbone or any other MVC libraries for the same reason. The one library I did end up using is Open Layers. Open layers is an open source map/vector drawing library. I will get into how I used it later.

## My own small MVC

MVC stands for Model View Controller. It is a pattern to help define what object has what responsibilities. As I stated earlier I did not want to use a current MVC library like backbone so I wrote a poor imitation of one. This application is simple, so I built a simple MVC. I created one namespace RunBrowser with three objects to cover each Model – runPath, View – mapView, Controller – AppController. Ultimately the appController gets a location object from browser. It then sends it to the model – runPath to see if it meets the accuracy and time criteria. If it does it passes it the view – mapView to add a point and redraw the vector line. I will dive into each object later in the post.

When you look through the HTML you see that there are no onclick attributes, only ids and classes. This is to separate out structure(HTML) from look(CSS) and behavior(javascript). Every element that is used in this application has a spot in the HTML. You will see many divs, buttons, and a few spans with ids that should give you an idea of what they are used for. The ids are there to help tie in the behavior. The classes are all part of [Bootstrap](http://twitter.github.com/bootstrap/) a great way to get a nice look for your website, especially if you don’t have the time to create a design from scratch.

To set this all in motion I created an init function which runs on the DOMContentLoaded event. I haven’t muddied up the window object and everything waits until the page is loaded. I then add the events to the elements, show the first view, and hide the top bar in mobile safari. Here is the code:

```js
function init(){
	var ac = new RunBrowser.appController();
	ac.addEvents();
	ac.showHome();
	//hide the top bar in mobile safari
	setTimeout(function(){
    window.scrollTo(0, 0);
    }, 0);
}
```

## RunBrowser.appController

This object is the main part of this application. It keeps track of state and what the user wants to do next. This is pretty easy because there is technically three things a user can do; start a run, view a run, or cancel. It initializes the model (runPath), view (mapView), and location functions as needed. It also gets rid of them when needed. When it is first created it caches all the elements it will need. There is some discussion about whether caching objects is faster or not (short answer: quick lookups like getElementbyId will not save as much time as longer lookups. This also becomes more of a factor if you use jQuery), but I think it makes my code cleaner to look at. Here is everything it will track:

```js
	this.mapView = null;
	this.runPath = null;
	this.watchid = null;

	//cached elements
	this.mapPage = document.getElementById('mapPage');
	this.startPage = document.getElementById('startPage');
	this.showMapButton = document.getElementById('showMap');
	this.stop = document.getElementById('stop');
	this.saveButton = document.getElementById('saveRun');
	this.clearButton = document.getElementById('clearRun');
	this.backButton = document.getElementById('back');
	this.table = document.getElementById('savedRuns');

	//modals
	this.errorModal = document.getElementById('errorModal');
	this.clearError = document.getElementById('clearError');
	this.saveModal = document.getElementById('saveModal');
	this.backdrop = document.getElementById('backdrop');
```

The first three store objects and the others are all elements from the page.

The init function first creates an appController object and then it runs the method addEvents(). This method is where we tie the appController to our button click events. All we have to do is reference which element we want and use the method addEventListener for the click event.

```js
	this.addEvents = function(){
		var This = this;
		this.showMapButton.addEventListener("click", function(){This.showMap()});
		this.stop.addEventListener("click", function(){This.stopMap()});
		this.saveButton.addEventListener("click", function(){This.saveRun()});
		this.clearButton.addEventListener("click", function(){This.clearRun()});
		this.backButton.addEventListener("click", function(){This.clearRun()});
		this.clearError.addEventListener("click", function(){This.clearRun()});
	}
```

You will notice that there is a lot of <span class="code-snip">This</span>. We do this so that the appController will handle the event and not the button. If we were to just use this.showMap(), for example, we would get an error telling us that the button element does not have that method. We have to create a variable that points to the appController object (var This = this;) then we call an anonymous function to handle the click and pass it to the appController. This one function makes the entire application work. Without it we would just have a static page that did nothing.

### Location

[HTML 5](http://dev.w3.org/geo/api/spec-source.html) specifies an interface for getting a devices interface. You can read through the specs or just know these two functions:

```js
navigator.geolocation.getCurrentPosition(showMap);
var watchId = navigator.geolocation.watchPosition(scrollMap);
```

The first one(getCurrentPosition) gets the current position and then passes a location object to the callback(showMap). The second one(watchPosition) will pass a location object anytime it’s location changes. Because this is an ongoing process it returns an id that you can use later to turn off watchPosition. The appController keeps track of whether we have a watchPosition running or not by keeping it in the watchId attribute. We can see the creation, success, and error callbacks in the showMap function:

```js
	this.showMap = function(){
		this.mapPage.classList.remove('none');
		this.startPage.classList.add('none');

		this.stop.classList.remove('none');
		this.backButton.classList.add('none');

		if(this.mapView != null){
			this.mapView.destroy();
		}

		this.mapView = new RunBrowser.mapView();
		this.runPath = new RunBrowser.runPath();
		var This = this;
		this.watchid = navigator.geolocation.watchPosition(function(location){This.GetLocation(location)}, function(error){This.errorHandler(error)}, {enableHighAccuracy:true, maximumAge: 5000, timeout: 12000 });

		setTimeout(function(){
	    window.scrollTo(0, 0);
	    }, 0);
	}
```

The first shows or hides certain divs (hide the home page, show the map page), creates a new view and model, and finally starts tracking our location. If there is a positive result we pass it to the GetLocation method with a location object.

```js
	this.GetLocation = function(location){
		if(ptTest = this.runPath.addPoint(location))
		{
			this.mapView.addPoint(location);
			this.mapView.updateTimeDistance(this.runPath.getElapsedFormat(), this.runPath.getDistance());
			this.mapView.updateSpeeds(this.runPath.getCurrentMph(), this.runPath.getMinMile());
	    }
	}
```

GetLocation passes it to the model(runPath) to see if we should store it and then passes it to the view(mapView) to update the map and other data. If we get an error we pass it to the method errorHandler which just shows a modal and allows you to cancel back to the start. If you want to cancel a watchPosition you pass the id to the clearWatch method.

```js
navigator.geolocation.clearWatch(this.watchid);
```

### localStorage

Let’s store someones run in localStorage. It’s is really easy, one method setItem which takes a key and a value. We do this in the saveRun method of appController.

```js
	this.saveRun = function(){
		localStorage.setItem(this.runPath.startTime, JSON.stringify(this.runPath));

		if(this.mapView != null){
			this.mapView.destroy();
		}

		if(this.watchid != null){
			navigator.geolocation.clearWatch(this.watchid);
			this.watchid = null;
		}

		if(this.runPath != null){
			this.runPath = null;
		}

		this.backdrop.classList.add('none');
		this.saveModal.classList.add('none');

		this.mapPage.classList.add('none');
		this.startPage.classList.remove('none');

		this.showHome();
	}
```

First thing we do is save the run to localStorage with the start timestamp and the value as the object stringified. We clean up our objects by destroying the map and clearing out our model. Finally we set the correct divs show and hide the others.

All the other methods are straight forward. Showing and hiding divs as needed.

## RunBrowser.mapView

This application really only has one view – the map view. We create or destroy it as needed. I use [Open Layers](http://openlayers.org/) to do all the map drawing. It is an open source map and vector drawing library. It can use maps from Open Street Maps, Google, Bing, or even your own if you have created them. I use Open Street Maps in this application, but I did leave references to Google and Bing on the index page.

### Open Layers

I spent a few hours reading forums and the documentation to get this to work. Hopefully I can save someone that trouble. Here is the code to create a map that is ready to have a line drawn.

```js
RunBrowser.mapView = function(){
	this.map = new OpenLayers.Map("map");
	this.proj = new OpenLayers.Projection("EPSG:4326");
	this.line = new OpenLayers.Geometry.LineString([]);
	this.lineLayer = new OpenLayers.Layer.Vector("Line Layer");

	this.timeSpan = document.getElementById('time');
	this.distance = document.getElementById('distance');
	this.mph = document.getElementById('mph');
	this.minMile = document.getElementById('minMile');

	var layer = new OpenLayers.Layer.OSM();

	this.map.addControl(new OpenLayers.Control.DrawFeature(this.lineLayer, OpenLayers.Handler.Path));                                     
    var style = { strokeColor: '#0000ff', strokeOpacity: 0.5, strokeWidth: 5 };

    var lineFeature = new OpenLayers.Feature.Vector(this.line, null, style);
    this.lineLayer.addFeatures([lineFeature]);
     
	this.map.addLayers([layer, this.lineLayer]);
	this.map.zoomTo(15);
}
```

Here is the breakdown of what I am doing. First I create a map on the div with id of map with new OpenLayers.Map(“map”). I then have to set a projection to make sure that our points line up correctly on the map with new OpenLayers.Projection(“EPSG:4326”). You can [learn more](http://docs.openlayers.org/library/spherical_mercator.html) why you need to specify a projection, but just know that if you do not use a projection your coordinates will not match up correctly. I create a blank line by creating it with a blank array using new OpenLayers.Geometry.LineString(\[\]). To make this work we have to add layers, controls, and features. The first layer is an Open Street Map layer. If you wanted to use different providers you would replace this line. Next I tell the lineLayer about the line and let it know to draw this on the map. Finally I let the map know about the layers (the actual map and the vector line) and then zoom to level 15.

At this point you would have a map that is zoomed in over the Atlantic Ocean and a vector line with no points. We need to add some points to this. We need to be able to add points on the fly. Here is how to do this.

```js
		opLonLat = new OpenLayers.LonLat( location.coords.longitude, location.coords.latitude );
		opLonLat.transform(this.proj, this.map.getProjectionObject());
		point = new OpenLayers.Geometry.Point(opLonLat.lon, opLonLat.lat);

		this.line.addComponent(point);
		this.lineLayer.redraw();
		this.map.setCenter(opLonLat);
```

We take the location object given to us from the browser and extract the longitude and latitude from it and create an Open Layers object. We then use the projection we specified earlier to transform this into a format we can use on the map. Finally we add it to the line with addComponent and then redraw the lineLayer and recenter the map. That’s it! I used Open Layers documentation and some examples to figure this out. There is not any demos that show how to draw a line on the fly with javascript.

## RunBrowser.runPath

This is our model object. It has the definitive list of location points and also reports out information about the run. The first thing to do is give it some attributes that we would care about.

```js
		this.distance = 0,
		this.startTime = 0,
		this.lastUpdateTime = 0,
		this.pointArray = [],
```

We have the distance (in miles), the start timestamp, the last updated time stamp, and an array to hold all our points. Everything else we can calculate, for example duration or minutes per mile.

There are two core functions addPoint and computeDistance that do all the heavy lifting. Here is addPoint.

```js
		this.addPoint = function(point) {
			if(point.coords.accuracy <= 25 && (point.timestamp - this.lastUpdateTime)>= 6000 || this.lastUpdateTime == 0)
			{
				var now = new Date().getTime();
				this.pointArray.push(point);
				this.lastUpdateTime = now;

				if(this.startTime == 0){
					this.startTime = now;
				}

				if(this.pointArray.length >= 2){
					var arraylen = this.pointArray.length;
					this.distance += this.computeDistance(this.pointArray[arraylen -2], this.pointArray[arraylen -1]);
				}

				return point;
			}

			return false;
		},
```

AddPoint accepts a location object from the browser. We then test to see if it has a good accuracy (usually anything under 50 will be from a GPS) so we don’t have big jumps in position and that it has been six seconds since the last point was saved. If we saved every point given to the function we could easily have hundreds per minute. This assures us we will have 10 or less per minute. If neither of these are true it looks to see if the last update time has been set, if not we know this is the first point. Then we set the last update time and if there is no start time we set that as well. Finally if the array has more than two points we are going to calculate the distance between the last two points and add it to our current distance. This leads us right to computeDistance.

```js
		this.computeDistance = function(point1, point2){

			var lon1 = point1.coords.longitude;
			var lon2 = point2.coords.longitude;
			var lat1 = point1.coords.latitude;
			var lat2 = point2.coords.latitude;

			var R = 3958.7558657440545; // miles
			var dLat = (lat2-lat1).toRad();
			var dLon = (lon2-lon1).toRad();
			var lat1 = lat1.toRad();
			var lat2 = lat2.toRad();

			var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			var d = R * c;

			return d;
		},
```

I really don’t know the math behind this. This formula is from a [Movable Type script](http://www.movable-type.co.uk/scripts/latlong.html). The only modification I made was to turn it into miles instead of km. The distance comes out really close to what I can measure.

We can compute the elapsed time, current mph(taken from the gps), overall mph, and minutes per mile based on the data we have stored. The only problem we run into with this object is when we stringify it. We lose all of our functions as JSON parses it back as an object. To fix this we create a new runPath object and set all the attributes. At this point we can call all the functions and get our information back.

## Mobile bits

As I have previously stated I only have an iPhone 4S so that is the only phone I have tested on. I am sure though that this will work in Android (if you have Android and have tested it let me know). Using Bootstrap I have designed the page to be responsive. The main thing is that the main heading will drop from an h1 to an h2 and the byline will change as well. Bootstrap makes this super simple, all you have to do is add the class visible-phone and it will show on devices with width at or under 480px. To hide something on a phone just add the class hidden-phone. You can test this between your phone and computer or just resize the width to under 480px.

```
<pre class="brush: xml; title: ; notranslate" title="">
			<h1 class="hidden-phone">RunBrowser!</h1>
			<h2 class="visible-phone">RunBrowser!</h2>
			<p>Are you ready? Let's GO!</p>
			<p class="hidden-phone">This site was designed for a phone, but you are more then welcome to run around with your laptop.</p>
			<p class="visible-phone">Don't forget to set your phone to the highest auto-lock setting.</p>
			<button class="btn btn-success btn-large" id="showMap"><i class="icon-map-marker icon-white"></i>START!</button>
```

### Apple bits

There are a few things other things I added in the head that target Apple devices.

```
<pre class="brush: xml; title: ; notranslate" title="">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="apple-mobile-web-app-capable" content="yes" />

	<!--iDevice iCons-->
	<link rel="apple-touch-icon" href="runbrowser57.png" />
	<link rel="apple-touch-icon" sizes="72x72" href="runbrowser72.png" />
	<link rel="apple-touch-icon" sizes="114x114" href="runbrowser114.png" />
```

The meta viewport helps keep the page from zooming in or out to far. The next meta tag will let the page run in fullscreen mode when added to the home screen. The last three link will be used as icons when the page is added to the home screen. Each one targets a different iOS device and/or retina display. The icon I used is from [Open Clipart](http://openclipart.org/detail/77317/running-pictogram-by-shokunin) and is release under [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/).

## Extending

If you want to add or edit anything you can clone the [github repository](https://github.com/johanan/RunBrowser). If you want to completely rewrite parts of this application you should be able to reuse the mapView object and the runPath object. Rewire up an AppController and you should be on your way.

If you have thoughts or questions let me know.