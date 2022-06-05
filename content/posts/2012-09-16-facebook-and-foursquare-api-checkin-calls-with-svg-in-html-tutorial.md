---
id: 464
title: 'Facebook and FourSquare API checkin calls with SVG in HTML tutorial'
date: '2012-09-16T17:56:32-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=464'
permalink: /2012/09/facebook-and-foursquare-api-checkin-calls-with-svg-in-html-tutorial/
dsq_thread_id:
    - '846941499'
categories:
    - Javascript
tags:
    - HTML5
    - javascript
    - SVG
---

<div class="action-button">[Download](https://github.com/johanan/Which-States) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/usmap/) the demo</div>This has been an idea in my head for awhile now. The app will get your checkins from Facebook and FourSquare and will show you on a map which states you have been to. It is very similar to the other apps I have created. Although I do use a new skill, manipulating SVGs.

I want to give a quick thanks to Theshibboleth who created the SVG of the US. I downloaded it from [Wikipedia](http://en.wikipedia.org/wiki/File:Blank_US_Map.svg).

## The SVG

SVG stands for Scalable Vector Graphics. The simplest definition is that it is an XML file that describes how to build an image. If you would like to know more as always you can use [Wikipedia](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics) or do a quick Google search. SVG has support in HTML5 for inline and loading. I am using inline SVG for this project. To do that all you have to do is copy out all the XML from the SVG file and paste it into your page. This lets you treat the SVG just like HTML. By that I mean that you can apply CSS classes to change the look and use javascript to attach event listeners and/or modify attributes on the fly.

The original SVG had the styles for each state inline. I removed all of those attributes and just applied CSS. You can target the CSS just like it was HTML. For example to give all the states the same look I target the svg element and applied the same fill and stroke (a light grey with a white stroke).

```
<pre class="brush: css; title: ; notranslate" title="">
svg {fill: #d3d3d3;fill-opacity:1;stroke:#ffffff;stroke-opacity:1;stroke-width:0.75;stroke-miterlimit:4;stroke-dasharray:none;}
```

Now all I have to do is create a css class with a different look and then apply the class to the state.

### How do I change the attributes of each state?

This is actually very easy as each state has an id. We can use jQuery to an id selection ($(‘#IN’), for example) and apply the class attribute. SVG elements are not the same as your average div. You can just run the addClass method from jQuery on it. You have to use the add attribute method to give it a class attribute with the value of the CSS class you want.

```js
$svg.children('#' + state).attr('class', 'white-state');
```

In this line of code $svg is a cached jquery object of the svg element. It finds the state based on id and then adds a class of white-state (a hold over from my original testing when I was making the states white instead of dark grey). To remove the class just use removeAttr and it the original css style gets applied. Because we are doing this in javascript you can do this in response to an event.

That is all that I do with SVG in this app. I just use it to easily change the look of a state of my choosing.

## Facebook and FourSquare

These two services serve as the source of the data for the model of this application. We just have to get the data out and standardize it so we can build off of it. Let’s first look at Facebook.

### Facebook

We are going to use the Facebook js SDK because it becomes very easy to get data out of Facebook. I have written tutorials about using it before (with [Zend Framework](http://ejosh.co/de/2012/06/facebook-sdk-login-for-zend-framework/) and [just javascript](http://ejosh.co/de/2011/11/facebook-sdk-using-only-javascript-pt-1/)). I will quickly cover the basics and then talk about the specifics of getting checkin data from Facebook.

I include the Facebook js SDK in the head as it is a major part of this app. The next thing you do is initialize it. If you look inside the Josh.FB object I do this in initialization. Next you have to make sure that the user has authorized your application. One thing to remember here is that if you want to read a users checkins you need to ask fro user\_status permissions. If you do not your responses will not have any checkins. Finally we can make a call to the Facebook API for checkins. I make a call for up to 750 checkins. I then loop through the checkins and use a Place object to standardize the checkin info. This Place object is sent through the addCheckin method of the model that was passed into the object.

I want to highlight how I tell the rest of the application that this object is done processing checkins. The FB object triggers a checkinDone event. The app controller is listening for this event. When the app controller sees this event it will then process map data. The event is very important as everything that happens with Facebook is asynchronous. We do not know when it will return, but we know we have to do something when it does.

### FourSquare

The FourSquare API is a little harder to work with as it does not have a nice javascript SDK like Facebook. The first obstacle is getting an Oauth token from FourSquare so we can query checkins. Facebook does this in it’s login methods for us, but with FourSquare we have to do it manually. I wanted to do this as cleanly as possible. I did not want to redirect the current browser window as that takes people out of the application. I decided to do this by creating a pop-up window that sends you to FourSquare’s servers so you can login and then authorize the app. This creates an issue though.

How do you get the Oauth token back to the original window?

I do this using events. The opened window has a link back to the window that opened it (window.opener). I can then trigger an event on the original window and pass the Oauth token (which was in the URL of the returned authorization). Here is the token page:

```js

	var access_token = window.location.hash.split('=');
		if(access_token[0] === '#access_token'){
			window.opener.$('body').trigger('login', access_token[1]);
			window.close();
		}
```

This code finds the token then sends back to the opener and closes itself. It is all happens very cleanly. The user clicks on the FourSquare login, it asks them to authorize, and finally the popup window goes away and there checkin data is loaded.

Let us now look at the opener side code.

```js
			$(window).on('login', function(e, d){
				oauth = d;
				This.getFourSquare(0, 1);
			});
```

That’s it. We listen for the login event and set a private variable to the Oauth token that was passed. The getFourSquare method makes an ajax call to the API to load the checkins. Which we will look at next.

### getFourSquare

Now that we have an Oauth token we can make a call to self/checkins. One difference between the Facebook API and FourSquare’s is that we can only ask for 250 checkins from FourSquare. To get all the checkins we will recursively call this method with the offset being increased by 250 each time. If a person has 700 checkins (like I do) here is how it will step through the method calls.

- First – count = 1, offset = 0; check count = 700 and offset = 0 + 250; We don’t know at first how many total but we find out after the call returns
- Second – count = 700, offset = 250; check count = 700 and offset = 250 + 250; Because the count is still larger than the offset plus 250 we make another call
- Third – count = 700, offset = 500; check count = 700 and offset = 500 + 250; We are now done. We know we have them all because the next call will have a higher offset than the total amount of checkins

Each response is looped through and sent the the model just like the Facebook checkins. The model now has checkins from two different services. The data is standardized so we can see what stated you have been to and which year you went.

I want to highlight again the use of the checkinDone event. The use of it here is more important than the use with the Facebook as there could be an unknown amount of ajax calls. Each one is asynchronous (that’s what the a stands for in ajax), so we have no idea when all the calls will return. We have the app controller object listening so that when the checkinDone event is fired we can act on the data it just loaded.

## The Model

Josh.US is the model for this application. It keeps track of all the checkins and sorts them by both state and year. It does this be creating objects for each state and also for each year. I use objects as you can use them like hash tables (I know this is not exactly correct, but it works here). When a Place is added the first thing the object does is check to see if the state exists. If it does not create the state and add the checkin. If the state does exist add a checkin. Next it tests to see if the year is created. Then it either creates or adds just like the state. Eventually you end up with an object that has a list of all the states and which states you have been to on which years. Here is the addCheckin function.

```js
		addCheckin: function(place){
			checkins.push(place);
			years[place.year] = (years[place.year] !== undefined) ? years[place.year] : {};
			
			if(states[place.state] === undefined){
					states[place.state] = new Josh.State(place.state);
					years[place.year][place.state] = new Josh.State(place.state);
				}else{
					states[place.state].checkins++;
					if(years[place.year][place.state] === undefined){
						years[place.year][place.state] = new Josh.State(place.state);
					}else{
						years[place.year][place.state].checkins++;
					}
				}
			$this.trigger('checkin', [place, checkins.length]);
		},
```

This makes getting the states out easy. The object creates an array and then adds each state into the array. The array is sorted to have the most visited state first, but I do not do anything with this as of yet (I was thinking of doing a heat map or a statistics view).

## The App Controller

This is the glue for the entire application. It creates and keeps track of the model, each of the Facebook and FourSquare objects, listens for most events, and does any view changes. I want to highlight the listening for the event checkinDone. Here is the listening code for FourSquare:

```js
		$(this.fs).on('checkinDone', function(){
			This.checkinDone();
		});
```

jQuery makes the firing and listening easy (trigger to fire and on to listen). The checkinDone method just gets an array from the model of all the states and loops through it adding classes to the states in the array.

## Summary

This application was not very big, but I did get to play around with modifying SVGs. I think it is a good skill to have because it is very easy and can give you great results. The other thing I did in this project is use events to properly deal with asynchronous calls. I think the project I did with node.js helped me think about the structure of javascript apps a little differently.