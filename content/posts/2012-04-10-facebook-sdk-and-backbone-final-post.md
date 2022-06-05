---
id: 206
title: 'Facebook SDK and Backbone &#8211; Final Post'
date: '2012-04-10T23:15:53-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=206'
permalink: /2012/04/facebook-sdk-and-backbone-final-post/
dsq_thread_id:
    - '847677499'
categories:
    - Javascript
tags:
    - Backbone
    - Facebook
    - javascript
---

<div class="action-button">[Download](https://github.com/johanan/8-bit-Facebook) the src(github)</div><div class="action-button">[View](http://ejosh.co/demos/f8/) the demo</div>This really is the final installment of this. I have shown how to use the router and views to make a site that is only one page of HTML, but still has back button functionality. Each view is tied to a Facebook API query in which I load different elements on to the page. I have a few different ways in the code that you can do this. I would like to say it is for instructional purposes, but it is actually because I was trying different methods and I did not want to go back through and update all the other views and routes.

> I will show how to deal with paged data and some other tricks

## Paged Facebook Data

Let’s use photos for example. To see what would be returned for an API call to /me/photos we will use the [Graph API explorer](http://developers.facebook.com/tools/explorer/?method=GET&path=me%2Fphotos). You will see that there are two top level keys data and paging. Inside of data is all the information about each photo. In the lofPictureView I loop through the photos adding them to the page

```js
         for (photo in this.model.data)
    		{
    			var test = "<li>";
    			test += "<img src=\"" + this.model.data[photo].source + "\" class=\"fb-pics\">";
    			if(this.model.data[photo].comments){
    				test += "COMMENTS: " + this.model.data[photo].comments.data.length;
    			}
    			test += "</li>";

    			this.jQel.children('ul').append(test);
    		}
```

I create a list item that has an img tag and then I check for comments and let you know how many there are. If you wanted to add different information you can look through the object in the Graph API explorer and see what is available to use. Now let’s look at the paging data. This is pretty straight forward. The previous attribute has the URL for previous photos and the next has the URL for the next photos. First thing I do is see if these attributes are present and then I create a button for them.

```js 		
    		if(this.model.paging.previous)
    		{
	    		var prevButton = document.createElement('button');
	    		prevButton.innerHTML = 'PREVIOUS';
	    		prevButton.id = 'prevPage';
	    		this.jQel.children('div').append(prevButton);
    		}
    		
    		if(this.model.paging.next)
    		{
	    		var nextButton = document.createElement('button');
	    		nextButton.innerHTML = 'NEXT';
	    		nextButton.id = 'nextPage';
	    		this.jQel.children('div').append(nextButton);
    		}
```

Earlier in the Backbone view object we created click events for a button that has the id of prevPage and a button that has the id of nextPage that call functions with the same name as each id.

```js
		events: {
			'click button#nextPage' : 'nextPage',
			'click button#prevPage'	: 'prevPage'
		},
```

Inside of these functions is the first gotcha. I am using [jQuery’s getJson](http://api.jquery.com/jQuery.getJSON/) function. We want this to be JSONP and not plain old JSON. Why JSONP? [Remy Sharp explains](http://remysharp.com/2007/10/08/what-is-jsonp/) it best, “JSONP is script tag injection, passing the response from the server in to a user specified function”. We want to use this data in an anonymous function call and we need it to be JSONP. Using jQuery’s documentation we see that if we add <span class="code-snip">callback=?</span> the request will be treated as JSONP. In my functions we add callback=? and we get an object back that we can use.

```js
    	nextPage: function(){
    		var This = this;
			$.getJSON(this.model.paging.next + '&callback=?', function(response){
				loadPhoto(response, This.options.currUser);
			});
    	},
    	
    	prevPage: function(){
    		var This = this;
			$.getJSON(this.model.paging.previous + '&callback=?', function(response){
				loadPhoto(response, This.options.currUser);
			});
    	}
```

You can see that we use the data returned to load another lofPhotoView of new pictures. We also pass the cached user object through the closure This.options.currUser.

## Backbone Event Target

In the lofPostView I have a list of a person’s last posts. I put an attribute of data-post-id equal to the post id so that I can retrieve it. The issue comes in when you want to have access to that element and retrieve the data-post-id attribute. Backbone passes the event as a parameter so that you can pull into your function and use it. This [Stackoverflow question](http://stackoverflow.com/questions/5680807/backbone-js-events-knowing-what-was-clicked) shows how to use it. Once you have the target you can ask for the data-post-id attribute. There is one issue with this particular setup, sometimes the click will be on a div inside the li. The div does not have the attribute so we cannot grab the data from there as it does not have the attribute. We can either put this attribute on all child elements or we can test to see if the attribute is present and if not grab it from the parent. Here is the code in the lofPostView where I do that.

```js
    	post: function(ev){
    		if(!$(ev.target).attr('data-post-id')){
    			var postid = $(ev.target).parent('li').attr('data-post-id')
    		}else{
    			var postid = $(ev.target).attr('data-post-id');
    		}
    		window.location.hash = '/post/' + postid;
    	},
```

I am sure there are better ways to do what I did. If you know of one of the ways let me know. You can leave a comment or even fork the project on github.