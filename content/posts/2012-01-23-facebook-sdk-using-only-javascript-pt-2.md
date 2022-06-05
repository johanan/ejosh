---
id: 139
title: 'Facebook SDK using only javascript – pt 2'
date: '2012-01-23T22:27:17-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=139'
permalink: /2012/01/facebook-sdk-using-only-javascript-pt-2/
dsq_thread_id:
    - '847807453'
categories:
    - Javascript
tags:
    - Facebook
    - javascript
---

<div class="action-button">[Download](https://github.com/johanan/8-bit-Facebook) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/f8/) the demo</div>I know it has been awhile. Christmas came and proceeded to fill up a lot of my time. I am back, though, to finish this tutorial. We left off at the HTML skeleton. Remember this is just an outline of where we are going to put our real content. This content we will fetch from Facebook through Facebook’s SDK and then throw it up on the screen. Let’s get on to using the Facebook JavaScript SDK.

> This part will cover setting up the Facebook SDK, initializing the SDK, and getting users authenticated.

## Facebook SDK setup

We covered this in the last post, but I will touch on it again. We are going to use [XFBML](http://developers.facebook.com/docs/reference/javascript/FB.XFBML.parse/). Facebook used to have [FBML](http://developers.facebook.com/docs/reference/fbml/), but they have deprecated this. We use XFBML to create the login button. If you look at Facebook’s [Social Plugins](http://developers.facebook.com/docs/plugins/) you will see that you can implement many of them through the javascript SDK and XFBML. The last post had the old way of doing it, but here is the new updated way (it’s not much different):

```
<pre class="brush: xml; title: ; notranslate" title="">
<html xmlns:fb="http://ogp.me/ns/fb#">
```

  
We can now load the [Facebook JavasScript SDK](http://developers.facebook.com/docs/reference/javascript/). You should jump over to their developer site and read their documentation. Everything I have learned and done came from reading their docs. I will explain everything I have used here, but this library can do so much more. Facebook recommends loading this asynchronously, but I do not here because there is no content without the Facebook SDK loading. I load it here on line 12 of index.html.

```
<pre class="brush: xml; title: ; notranslate" title="">
<script src="http://connect.facebook.net/en_US/all.js"></script>
```

This is it for loading the SDK. Pretty easy, huh?

## Initializing Facebook

At this point if you load your page there will no difference if you had the Facebook SDK loaded or not. We need to initialize the Facebook object so we can use it. You will need your app ID but here is how:

```js
    FB.init({
	    appId  : 'YOUR_APP_ID',
	    status : true, // check login status
	    cookie : true, // enable cookies to allow the server to access the session
	    oauth  : true, // enable OAuth 2.0
		xfbml   : true
	  });
```

I have noted in the comments what each option does. I technically did not have to use the <span class="code-snip">xfbml: true</span>, but most likely you will for most of your apps. This just tells javascript to parse and xfbml tags in the document. We now have a FB object that we can use.

## Use our new FB object

Again at this point our page is not different in any way. Our next step is to see if the person is logged into Facebook, and more importantly, has authorized our app. We can check this with the [getLoginStatus()](http://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus/) function. This will let us know if the user has authorized our app. Here’s the code:

```js
	FB.getLoginStatus(function(response) {
	  if (response.authResponse) {		
	  	startThis();	
	  } else {
		FB.Event.subscribe('auth.login', function(response) {
			startThis();
		   });
		var notloggedinView = new lofNotLoggedInView();
	  }
  	});
```

We call getLoginStatus and it has an anonymous callback function for response. We then check to see if there is an authResponse in this response object. If that is true we then run the startThis() function (I will get into this when I talk about backbone). At this point I know I have a logged in Facebook user who has authorized my app. If not I use the [Event.subscribe](http://developers.facebook.com/docs/reference/javascript/FB.Event.subscribe/) function to latch onto a successful authentication. Inside of this we call the startThis() function.

I want to stop here and cover one quick concept before we proceed. People are used to navigating through websites by clicking links. Click a link it takes you to another page. We are building this website differently. Everything will happen on one page. If you look at the project on github you will see that it is one HTML page and a half dozen JavaScript files. The JavaScript will asynchronously load information from Facebook and put into the HTML. There will be no links to click (in the classic sense). How do we navigate then? Events. We will attach listeners to the events, the main event being the click event. You mave have done this before with onclick attribute in the tag. This is a bad way to do this. We will be doing it unobtrusively. This means that we attach the event listeners in JavaScript by targeting it in the DOM. This is very similar to CSS. In the example I just showed we are latching onto the auth.login event which comes from the FB object. Now back to the code.

We are now going to load a view from the backbone framework. I won’t go into how these work in this post ( next part I will), but I will highlight one thing that is important. Again we have no content on this page, but we need to show a Facebook login button. Do we create the non-logged in page with the button as string of HTML then add it to the page? We could, but we aren’t. We will create a Facebook login button and then add it to the page:

```js
    		var logButt = document.createElement('fb:login-button');
    		logButt.setAttribute('scope', 'user_photos, user_about_me, user_status, friends_photos, friends_about_me, friends_status, read_stream');
		this.jQel.append(logButt);
		FB.XFBML.parse();
```

We first create a variable called logButt(for login button; although that is a better name than buttLog). We use the [createElement()](https://developer.mozilla.org/en/DOM/document.createElement) function. This gives a Facebook login button element that we can manipulate. We then add the scope settings to give us the permissions needed (it seems like a lot, but this will allow us to see what we need to). We then append it to the div (held in this.jQel which I will get to next post). The final thing we need to do is to tell the Facebook object to parse the XFBML (fb:login-button). If we did not do this the Facebook login button would not show up on our page.

We now have a page that can authorize someone to your app solely through javascript. The next part will put this all together and show you how to query the Facebook API.

Stay tuned for the final part!