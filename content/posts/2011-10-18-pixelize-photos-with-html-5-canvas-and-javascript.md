---
id: 75
title: 'Pixelize photos with HTML 5 canvas and Javascript'
date: '2011-10-18T20:51:46-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=75'
permalink: /2011/10/pixelize-photos-with-html-5-canvas-and-javascript/
dsq_thread_id:
    - '860809153'
categories:
    - Javascript
tags:
    - javascript
---

<div class="action-button">[Download](https://github.com/johanan/pixelize) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/pixelize/index.html) the demo</div>This library came about because of a my purchase of an NES. It lead me to wonder what would a browser look like on the NES? The first thing would be that all the photos would be pixelized. I wanted to use the canvas element of HTML 5. I didn’t want to go through every pixel of the photo to do the pixelization, I just wanted to shrink the image down and then blow it back up to create ‘natural’ pixelization.

> What would a browser look like on the NES?

## The canvas element

[Canvas](http://en.wikipedia.org/wiki/Canvas_element) is a new element that was part of HTML5. Canvas opens a lot of doors in HTML5 and there are a lot of [amazing examples](http://net.tutsplus.com/articles/web-roundups/21-ridiculously-impressive-html5-canvas-experiments/) of what is possible with the canvas element, but we are only using a small portion of it’s capabilities. We can add a canvas to a web page very easily

```
<pre class="brush: xml; title: ; notranslate" title=""><canvas id="myCanvas" width="500" height="500">Fallback content</canvas>
```

We can now manipulate it with Javascript. First thing is to get a reference to the canvas element. We then get a 2D drawing context. Finally we draw the image on the canvas. This is a very simple overview, there are [great tutorials](https://developer.mozilla.org/en/Canvas_tutorial/Using_images) on the web already for this.

```js
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function(){
      ctx.drawImage(img,0,0);
    };
    img.src = 'yourimage.jpg';
```

That was our quick canvas 101 tutorial. We will now move on to how we use it to make pixelized photos.

## Pixelized Photos

The basic idea is that we will take an image, scale it down to a size much smaller than what we started with and then scale it back up. This of course will produce a pixelized photo. Before we get to using the canvases we have to check to see if the browser supports canvas. We then will extend the actual img element so we can call our function right off of the image. This code borrows heavily from [Close Pixelate](https://github.com/desandro/close-pixelate), a great library that does more and has more features than the simple library I have created. Here is the first part of our library:

```js
var pixelate = {};

pixelate.proxyCanvas = document.createElement('canvas');

// checking for canvas support
pixelate.supportsCanvas = !!pixelate.proxyCanvas.getContext &&
  !!pixelate.proxyCanvas.getContext('2d');

if(pixelate.supportsCanvas){
	HTMLImageElement.prototype.pixelize = function (scaleFactor){
		pixelate.imgPixelize(this, scaleFactor);
	}
}
```

The pixelate variable will be our object that attach other variables and functions to. The first thing we do is attach a canvas to pixelate. We then test to see if we can get the context of it. If we can we know that our browser supports the canvas element. If the browser supports the canvas element we will add a pixelize function to every HTMLImageElement. This function takes one parameter scaleFactor. We then pass scaleFactor and a reference to the image this function was called on, this.

Here is where we use canvases to create pixelization.

```js
pixelate.imgPixelize = function(image, scaleFactor)
	{
		var pixelize = function(){
			if(!scaleFactor)
			{
				//determine larger side
				var largerSide = (image.height > image.width) ? image.height : image.width;
				//calculate a scale ratio to match the size with a floor at .35
				scaleFactor = (largerSide > 150) ? 50/largerSide : .35;
			}
				//first canvas to scale down
			 	var newCanvas = document.createElement('canvas');
				newCanvas.height = image.height*scaleFactor;
				newCanvas.width = image.width*scaleFactor;

				//add image to the first canvas
				var context = newCanvas.getContext('2d');
				context.drawImage(image, 0,0,image.width*scaleFactor, image.height*scaleFactor );

				//next canvas to scale up
				var nextCanvas = document.createElement('canvas');
				nextCanvas.height = image.height;
				nextCanvas.width = image.width;

				//use previous canvas as sourcea
				var newCtx = nextCanvas.getContext('2d');
				newCtx.drawImage(newCanvas, 0,0, image.width, image.height);

				delete newCanvas;
				image.parentNode.replaceChild(nextCanvas, image);
			}

			//wait for the image to load then pixelize it
			image.addEventListener( 'load', pixelize, false );
	}
```

We define the imgPixelize function that will be called when we use img.pixelize(). First thing to do is check to see if scaleFactor was passed. If it wasn’t we see if the height or width is larger. If the image is small (150 pixels or smaller) we set the scale factor to 35%. If it is larger we then divide 50 by the larger side. This should set a scale factor that will work even with many different photo sizes. In the demo the image is about 600 pixels wide, which would make the scale factor 8% (8% of original size not 8% smaller).

We now create the first canvas. It takes the current image’s height and width and multiples by our scale factor. In our demo the canvas will be 8% of the original image. We then draw the image on the canvas. The first parameter is the image to use, the next two are the start points (0,0 is the upper left corner), and next two are the size of the image (which we use our scale factor to make it 8%). We then create a second canvas to pixelize the photo. We set it to the original size (which is important because we are going to replace the current image with this canvas). The key to this is that we use the first canvas as the source of the draw method. Because this canvas is small it will blow it back up to the original size and pixelizing the photo in the process. We then find the parent of the image and tell it to replace the image with the second canvas we just created. The final piece is adding an event listener to the image load event. When the load event fires it will call the function we just described. If you don’t call this on the image load you will get a blank canvas.