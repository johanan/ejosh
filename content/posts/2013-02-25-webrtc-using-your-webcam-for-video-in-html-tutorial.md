---
id: 538
title: 'WebRTC  Using your Webcam for video in HTML Tutorial'
date: '2013-02-25T23:09:58-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=538'
permalink: /2013/02/webrtc-using-your-webcam-for-video-in-html-tutorial/
dsq_thread_id:
    - '1105472176'
categories:
    - Javascript
tags:
    - HTML5
    - javascript
    - webRTC
---

<div class="action-button">[Download](https://github.com/johanan/WebCamVidja) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/webcamvidja/) the demo</div>[WebRTC](http://www.webrtc.org/) is project to bring Real Time Communications to the browser. It is designed to allow video/voice chat with the browser without plugins. Because you technically have to have access to the webcam to do video chat, WebRTC gives you a javascript API to the webcam. This is what I am going to show you how to use. I am not going to go into the audio portion or how to create a real time communication link. WebRTC is still very much in beta and most browsers use a vendor prefix to get access to the webcam. I will show you what I did to create my webcam javascript abstraction library.

## Create a Webcam Library

I created a small shim/abstraction library to make getting and using the webcam easier. I used what I learned from creating [CreateMyPhotobooth](http://www.createmyphotobooth.com) (this is a small plug, but I am relaying what I learned from this). I have the project on [github](https://github.com/johanan/WebCamVidja) with a demo, grunt build info, and tests.

## Use of the Library

When you include the library you will have access to the wcvj (WebCamVidJa) object. The first function is videoIsSupported. It is a boolean function that let’s you know if your browser supports accessing the webcam.

```js
if(wcvj.videoIsSupported()){
  var v = wcvj.webcam('video');
}
```

This function works by testing for the [navigator.getUserMedia](https://developer.mozilla.org/en-US/docs/WebRTC/navigator.getUserMedia) function. getUserMedia is the function that allows you to ask for access to the webcam. Right now it is a shim that tests for different browser prefixes.

So now you know that your browser supports video you need to give it somewhere to play.

### Video Elements

The success callback of getUserMedia gives you a video stream from your webcam. You can hook that up to a video element and display that on your page. This step needs a shim as well, because each vendor does it a little differently. WebcamVidja makes this a simple two line affair.

```js
//this will give you webcam access
var v = wcvj.webcam('video');
document.body.appendChild(v.video);
```

This is where the first parameter is used in the webcam function. It will first try to find an element with the id of the parameter passed in. If that video element does not exist it will create one.

```js
<video id="video"></video>

//selects an element
var v = wcvj.webcam('video');
//creates an element
var a = wcvj.webcam('a');
```

The v variable will contain a reference to the video#video element. The a variable will have a reference to a newly created video element with the id of a. You can then add these elements to the DOM, listen for events, or do whatever else you want with them.

### Canvas Access

We can use the video element as a source for a canvas. This gives us the ability to manipulate the image data. WebcamVidja makes this easy. The second parameter is an options object. Just add a canvas property and set it to true.

```js
var c = wcvj.webcam('a', {canvas: true});
```

The returned object will have a reference to the canvas object.

### Canvas Drawing

Access to a canvas does not do much unless there is a draw method associated with it. If you do not specify a method the library will use a default 2d context draw method.

```js
		var defaultDraw = function(){
			ctx.drawImage(video, 0, 0);
		};
```

ctx is the reference to the 2d context of the canvas. You can specify your own draw method if you want.

```js
		var newDraw = function(c2,c3, v){
			/*
			 * this is mapped to the canvas object
			 * c2 is the 2d canvas context
			 * c3 is the webgl context
			 * v is the video element
			 */
			c2.drawImage(v, 0,0, this.width / 2, this.height / 2);
		};
```

This draw method will create a half size feed of the video. You will have access to the canvas (this), each context (c2 and c3), and the video element. You will able to write any 2d or 3d (browser support willing) draw methods you can think of. You can pass it in the options object or user the setDraw function.

```js
//using the setDraw function
var c = wcvj.webcam('a', {canvas: true, draw: newDraw});

//or
c.setDraw(newDraw);
```

### What is the framerate on this?

Well, it depends. It uses the [requestAnimFrame shim](http://paulirish.com/2011/requestanimationframe-for-smart-animating/) from Paul Irish. Instead of using a javascript timer, requestAnimFrame tells the browser that it needs to update the screen because it changed something. If you have a nice fast function you should get 60fps. If your function takes 500ms then you will get 2fps. It allows the browser to determine how and when it should draw a new frame.

### WebGL and glfx.js

I do not have much knowledge in writing anything in webgl, so I do not have any demos that use the 3d context. What I do have though is knowledge of great webGL library called [glfx.js](http://evanw.github.com/glfx.js/) by Evan Wallace. You can pass a glfx: true property to webcam and it will create a glfx canvas.

Now before we get to much farther, I know that coupling like this is bad. But this coupling allows people who have very little knowledge of webGL, like me, to create filters that use the GPU. The library does test and if the glfx is not loaded or the browser does not support webgl it will fall back to a plain old canvas.

You will be able to use any of the filters that glfx supports. All you have to do is pass an array of an array of the filter name and an array of the parameters. This explanation is more confusing than it is actually is. Here is an example:

```js

var v = wcvj.webcam('video', {canvas: true, glfx: true});
//default filter, nothing
v.setFilter([]);

//an ink filter
v.setFilter([['ink',[0.4]]]);

//a chain of filters
v.setFilter([['sepia',[1]],['vignette',[0.5,0.7]]]);
```

All the arrays allow you to chain filters to create more complex filters. The glfx.js has quite a few filters that you can try out on their demo site.

### Events

You can get a reference to the video element and listen for all the events that a video element throws (play, pause, canplay, etc). WebcamVidja adds one more event to the video element, UserMediaError. This is the error that is thrown when you try to get access to the webcam and it fails. This most likely due to the user actively denying access. You will be able to pull the code out of the UserMediaError property of the event.

### Return Object

When you run the webcam function you get an object back. This object has references to the video element, canvas element, setDraw, setFilter, and update functions.

```js
var v = wcvj.webcam('video', {canvas: true, glfx: true});
v.video;
v.canvas;
v.setDraw(newDraw);
v.setFilter([]);
v.update();
```

You can use the references to the elements just like grabbing them from the DOM. Pause the video? v.video.pause().

The only function we haven’t discussed is update. This is specific to glfx. It is used when you want to do a screen grab from the canvas. Depending on when you try the grab, it may be blank. If you run the update method right before the screen grab you will not have this problem.

That’s it