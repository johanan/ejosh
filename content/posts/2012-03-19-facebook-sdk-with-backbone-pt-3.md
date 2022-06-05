---
id: 168
title: 'Facebook SDK with Backbone &#8211; pt 3'
date: '2012-03-19T15:54:53-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=168'
permalink: /2012/03/facebook-sdk-with-backbone-pt-3/
dsq_thread_id:
    - '847804722'
categories:
    - Javascript
tags:
    - Facebook
    - javascript
---

<div class="action-button">[Download](https://github.com/johanan/8-bit-Facebook) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/f8/) the demo</div>I am back to finally finish this off. We are going to dive into Backbone and how we use it to create this application. I want to note up front that this is not a great tutorial for Backbone. The reason being is that I don’t use any of the model aspects of Backbone. I use it for event binding and creating views. In this context it makes sense as our model is Facebook. Another thing to note is that this uses Backbone version 0.5.3 when as of right now it is at version 0.9. It looks like it should work after being upgraded, but I haven’t tested it yet. Well let’s get started.

> Finally we are getting to the backbone of this app

## Backbone

[Backbone](http://documentcloud.github.com/backbone/) is a javascript library that creates an MVC(Model, View, Controller) structure. Earlier I said this was not a great tutorial and that is because we are only using the view and controller portions of backbone. The model is coming from Facebook. We probably could abstract this out and create a backbone model for Facebook, but I chose just to use the Facebook API directly. In this application I do things a few different ways. I would like to say that it is for instructional purposes, but honestly it was me testing out a few ways to do things in backbone. I would recommend picking one specific way and implementing that. Let’s get started.

## Our First View

At this point we have a black HTML page with the Facebook javascript SDK loaded. If a person has not authorized our app we throw a listener on the Facebook login event and show our first view.

```js
FB.Event.subscribe('auth.login', function(response) {
	startThis();
	});
var notloggedinView = new lofNotLoggedInView();
```

We create a new lofNotLoggedInView. lof stands for legend of facebook as I have tried to create a Legend of Zelda feel to the site. This view extends the backbone view object. Here is the code. I will talk about each function after this.

```js
var lofNotLoggedInView = Backbone.View.extend({
		el: $('#lofHeader'),

		initialize: function(){
		this.jQel = $(this.el);

      	_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
       
       this.render(); // not all views are self-rendering. This one is.
    	},
    	
    	render: function(){
    		this.jQel.empty();
    		var htmlText = &quot;A FEW MONTHS AGO A WEB DEVELOPER <;span class=\&quot;red_highlight\&quot;>;\&quot; JOSHUA \&quot;<;/span>; HAD STARTED TO COLLECT NES GAMES. THIS LED <;span class=\&quot;red_highlight\&quot;>;\&quot; JOSHUA \&quot;<;/span>; TO WONDER WHAT WOULD A BROWSER LOOK LIKE ON THE NES.\
    		HE THEN DEVELOPED THE LEGEND OF FACEBOOK AS AN INTELLECTUAL EXERCISE TO WHAT A BROWSER WOULD LOOK LIKE ON THE NES.&quot;;
    		this.jQel.append(htmlText);
    		
    		var danger = &quot;<;p>;IT'S DANGEROUS TO GO ALONE! USE THIS.<;/p>;&quot;;
    		this.jQel.append(danger);
    		
    		var logButt = document.createElement('fb:login-button');
    		logButt.setAttribute('scope', 'user_photos, user_about_me, user_status, friends_photos, friends_about_me, friends_status, read_stream');
			this.jQel.append(logButt);
			FB.XFBML.parse();
    	}

	});	
```

The first part grabs the element we are going to be manipulating. This is where our ids come in. We target the div with the id lofHeader. The next function is an initialization function. It lets us setup the use of this, we can list out the events we want to listen for, and we can automatically run functions. In this view we self-render meaning we put it in our initialize function so that it does not need to be called later. The render function is straight forward. First it clears out the element of anything that was there. We then put a little HTML add a fb:login-button and then tell Facebook to parse the XFBML so that the fb:login-button will show up.

That is it for this view. When we call a new lofNotLoggedInView it will automatically show up in the lofHeader div.

## Backbone Router and startThis

This application is only on one HTML page. When you click a link through to different parts of the application you lose the ability to hit the back button. This is to be expected. As far as the browser knows we are still on the same page. Backbone can help here. We can setup a router to help route us through the application. It allows us to read information out the URL and use it show different views. This is all setup when the Facebook login event is fired. It calls the function startThis();

```js
function startThis() {
		var ac = new AppController();

		var ws = new Workspace({ac: ac});
		Backbone.history.start();
		if(window.location.hash == &quot;&quot;){
			ws.navigate('fbid/me', true);
		}
};
```

The first thing it calls is a new AppController object. This is not needed for backbone, but you can use to keep track of state of the application as you call different views. The original idea for this type of object in backbone came from [Derick Bailey](http://lostechies.com/derickbailey/2011/09/15/zombies-run-managing-page-transitions-in-backbone-apps/). He has a great blog with a lot of great ideas and code. I ended up not using it how I first envisioned, but I use it to unbind all my events and to store the currUser object. This is a [Facebook User object](http://developers.facebook.com/docs/reference/api/user/) that we get from the Facebook API. It is cached in this AppController so we don’t have to requery the API when we need user info.

We now create a new Workspace which is the [backbone router](http://documentcloud.github.com/backbone/#Router) object. We pass the AppController to this object as ac. You can grab the options you pass in the initialize function. Here is the first part of this object.

```js
var Workspace = Backbone.Router.extend({

	  routes: {
	    "fbid/:fbid": "index",
	    "albums/:albumid/photos" : "albumPhotos",
	    "albums/:fbid": "albums",
	    "photos/:fbid" : "photo",
	    "posts/:fbid" : "posts",
	    "post/:postid" : "post",
	    "friends/:fbid" : "friends"

	  },

	initialize: function(options){
    this.ac = options.ac;
    this.currUser = null;
    this.body = $('#lofBody');
    this.header = $('#lofHeader');
  	},
```

The first thing we do is create a hash of routes (the first is fbid/:fbid) that map to functions in the object. I have not shown you the functions yet, but this is how we know what view to show based on the URL. The route matches the URL and can pull out variables which are passed to it. For example we use the navigate function to tell the workspace object to browse to fbid/me and then call the function that matches that route with this command:

```js
ws.navigate('fbid/me', true);
```

We can see that this would match the first route and call the index function and pass the string ‘me’. Here is the index function in our router:

```js
index: function(fbid) {
	  	this.body.unbind();
	  	this.body.empty();
	  	this.header.unbind();
	  	var This = this;
		this.ac.id = fbid;
		var test = fbUser('/' + fbid, function(model){
	    	This.ac.menuView(model, This);
		});	
	  },
```

The first few things we do is unbind all the events in the body and header. We then clear the body as the view we will call will create the content for us. If we do not do this events will start to stack up and our content will just be added to the page in addition to what was already there. If you read Derick Bailey’s post you see that he does the same thing inside of his AppView object. The next thing I do is add a closure for <span class="code-snip">this</span>. If I don’t set it to a variable outside of my anonymous function later in the code I lose the reference to the workspace object which I want to pass to the view. After doing this I make a call to the Facebook API through my fbUser object. The fbUser object was going to do more, but it ended up just being a wrapper for the Facebook API call. You can easily exchange all calls to fbUser to <span class="code-snip">FB.api(apiURL, function(response){});</span>. It eventually calls the AppController method menuView with the data returned from Facebook’s API and a reference to the workspace object. Here is the menuView code:

```js
this.menuView = function(model, router){
		//reset everything
		this.currUser = model;
		var menu = new lofMainMenuView({model: model, router: router});
		menu.render();
		this.header = true;
	}
```

First we grab the model (Facbook User object) and store it as the current user. We can now reuse this without having to requery the Facebook API. The next step is to create a new lofMainMenuView view and pass our model and workspace router object to it. Here is the lofMainMenuView object:

```js
var lofMainMenuView = Backbone.View.extend({
		el: $('#lofHeader'),

		initialize: function(){
		this.jQel = $(this.el);
		this.jQel.empty();

      	_.bindAll(this, 'render', 'photos', 'remove', 'posts', 'friends'); // fixes loss of context for 'this' within methods
       
       //this.render(); // not all views are self-rendering. This one is.
    	},
    	
    	events: {
			'click li#photos': 'photos',
			'click li#albums': 'albums',
			'click li#posts' : 'posts',
			'click li#friends' : 'friends'
		},
    	
    	render: function(){
    		var firstView = new firstFBView({model: this.model});
    		this.jQel.append("<div>MENU SELECT</div><ul><li id=\"photos\">PHOTOS</li><li id=\"albums\">ALBUMS</li><li id=\"posts\">POSTS</li><li id=\"friends\">FRIENDS</li></ul><span></span>" );	
    	},
    	
    	photos: function(){
    		this.options.router.navigate('photos/' + this.model.id, true);
    	},
    	
    	albums: function(){
    		this.options.router.navigate('albums/' + this.model.id, true);
    	},
    	
    	posts: function(){
    		this.options.router.navigate('posts/' + this.model.id, true);
    	},
    	
    	friends: function(){
    		this.options.router.navigate('friends/' + this.model.id, true);
    	},
    	
    	remove: function(){
    		$(this.el).unbind();
    		$('#lofBody').empty();
    	}
	});
```

This view starts out similar to the last one. We initialize some variables. Earlier I had said I do things a few different ways, well this is one of the objects that has that. You can see I empty the lofHeader div here in the view, whereas I had emptied the body from the router object. Hopefully you have noticed that we are binding more functions. The events we want to bind to are set by a hash. We specify what event (click) and on what element (li#photos) and then what function to run on that event. In the render function we add the list items with the correct ids for the events to target. The navigation functions here are pretty simple. We use the reference to the router object we have and tell it to navigate to specific URLs. For photos we will go to photos/yourFacebookID and then execute the function for that path.

At this point everything starts again. The router calls the photo function as it matches the URL. It then calls the photoView function of the AppController which now loads with the information returned about a user’s photos from Facebook. It also passed the currUser object that we cached earlier. If we did not cache this object we would had to make two API calls.

In the next and final post I will show how to deal with paged information (like photos) and some other gotchas that I have worked through.