---
id: 109
title: 'Facebook SDK using only javascript &#8211; pt 1'
date: '2011-11-10T19:52:34-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=109'
permalink: /2011/11/facebook-sdk-using-only-javascript-pt-1/
dsq_thread_id:
    - '848520465'
categories:
    - Javascript
tags:
    - javascript
---

<div class="action-button">[Download](https://github.com/johanan/8-bit-Facebook) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/f8/) the demo</div>This is a continuation of my [last post](http://ejosh.co/de/2011/10/pixelize-photos-with-html-5-canvas-and-javascript/ "Pixelize photos with HTML 5 canvas and Javascript"). My re-immersion into NES games started me down the path of an 8-bit web browser. This project is not a full 8-bit browser, but rather just viewing Facebook. It uses javascript and only javascript. There is a skeleton of HTML elements for javscript to build the content. It uses the Facebook js SDK, [backbone.js](http://backbonejs.org/) is used to build the content, [pixelize](http://ejosh.co/de/2011/10/pixelize-photos-with-html-5-canvas-and-javascript/ "Pixelize photos with HTML 5 canvas and Javascript") to pixelize the photos, and [jquery](http://jquery.com/) for ease.

> It uses javascript and only javascript

## Setup your Facebook App

First thing you will need to do is to create an app through Facebook. Start at the [Facebook Developers](https://developers.facebook.com/apps) site. There will be a button to create a new app. A modal window will popup. Fill this out.[![](http://ejosh.co/de/wp-content/uploads/2011/11/fb-app.png "Create a Facebook App")](http://ejosh.co/de/wp-content/uploads/2011/11/fb-app.png)You may have to play with the App namespace to find something that isn’t taken. You now will have to fill out the App Domain and Site URL. This will be where your site is hosted. This has to be correct or you will get errors when you try to call anything with the Facebook SDK.[![](http://ejosh.co/de/wp-content/uploads/2011/11/fb-app-settings.png "App Settings")](http://ejosh.co/de/wp-content/uploads/2011/11/fb-app-settings.png)You now have a facebook application. Facebook may, and probably will, change this process, but it should be straight forward. We don’t have to download the Facebook javascript SDK as we will load in the browser from Facebook.

## HTML skeleton

All of our content will be coming from Facebook over the Facebook SDK. Because of this we don’t need to create much HTML. We just want certain elements that we can target to put our content in.

```
<pre class="brush: xml; title: ; notranslate" title="">
  
  
<html xmlns:fb="http://www.facebook.com/2008/fbml"> 
    <head>  
        <title>8-BIT FACEBIT</title>  
        <meta charset="utf-8">  
  
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>  
		<script src="underscore.js"></script>
        <script src="backbone.js"></script>
       	<script src="http://connect.facebook.net/en_US/all.js"></script>
       	<script src="pixelize.js"></script>
       	<script src="f8.js"></script>
  		<link rel="stylesheet" type="text/css" href="style.css" />
    </head>  
  
    <body>  
    	<header>
        <span class="f8_icon">f</span>8-BIT - BROWSE FACEBOOK WITH AN 8-BIT BROWSER
        </header>
        <div id="lof">
        	<div class="centerTitle">
				<a href="#fbid/me">- S E L E C T -</a><br/>
				<div class="fb-like" data-href="http://ejosh.co/demos/f8" data-send="false" data-layout="button_count" data-width="100" data-show-faces="false"></div>
        	</div>

        	<div class="centerTitle">
        	
        		<span id="lofTitle" class="red_highlight">THE LEGEND OF FACEBOOK</span>
        	</div>
	        <div id="lofMain">
	        	<div id="bio"></div>
		        <div id="lofHeader"></div>
	        </div>
	        
	        <div id="lofBody"></div>
	        
        </div>
       <div id="fb-root"></div>
      
      <footer>
      	DESIGNED AND BUILT BY JOSHUA JOHANAN<br/>
		FONT BY <a href="http://fontstruct.com/fontstructions/show/nintendo_nes_font">GOATMEAL</a>
      </footer>
      
    </body>  
</html> 
```

47 lines, that’s it. I will highlight a few key parts to make this work.  
First we have to load FBML. This will allow us to easily add the Facebook login button:

```
<pre class="brush: xml; title: ; notranslate" title="">
<html xmlns:fb="http://www.facebook.com/2008/fbml"> 
```

Next we load six javascript files:[ jQuery](http://jquery.com), underscore, [backbone](http://documentcloud.github.com/backbone/), [Facebook javascript SDK](https://github.com/facebook/connect-js),[ pixelize](https://github.com/johanan/pixelize), and finally our application’s main javascript. Normally you would want to load these at the end of your HTML so that if they load slowly it doesn’t slow down your page. Technically we have no page without these libraries, so we try and load them as early as possible in the header. The rest of the HTML are just divs with ids so that we can easily target them with our javascript.

Most of the CSS is designed to invoke the idea of the Legend of Zelda main screen. The CSS is pretty straight forward except for the web font. I am using a font made by Goatmeal called [Nintendo NES font](http://fontstruct.com/fontstructions/show/nintendo_nes_font). I use @font-face to load the web font and font-family to use it in a CSS declaration.

```
<pre class="brush: css; title: ; notranslate" title="">
         @font-face 
         {
		  font-family: 'NintendoNESFontRegular';
		  font-style: normal;
		  font-weight: normal;
		  src: url('http://ejosh.co/nintendo_nes_font-webfont.ttf') format('truetype');
	  }
	  
	  body
	  {
		  font-family: 'NintendoNESFontRegular';
	  }
```

At this point you should have page that is bare and a lot of javascript loaded into the browser. In the next part I will tackle Facebook login events and Facebook api calls. All in javascript.

</body></html>