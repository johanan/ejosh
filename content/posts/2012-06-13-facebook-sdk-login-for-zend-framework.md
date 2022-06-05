---
id: 337
title: 'Facebook SDK Login for Zend Framework Tutorial'
date: '2012-06-13T20:26:28-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=337'
permalink: /2012/06/facebook-sdk-login-for-zend-framework/
dsq_thread_id:
    - '847143875'
categories:
    - PHP
tags:
    - javascript
    - 'Zend Framework'
---

<div class="action-button">[Download](https://github.com/johanan/Zend-Framework-Ajax-Login) the src(github)</div><div class="action-button">[View](https://zfajax.herokuapp.com/) the demo</div>I previously had written about using the Facebook SDK inside of Zend Framework. It did not go very deep into actually using the Facebook SDK. In this post I will show you how to use it as a login system. But wait there is more. I will also show you how to use Twitter, Google, and essentially any other service you want. I use the abstraction that Zend Framework gives you for authentication and add one more layer to that so that you can easily plug in new services to authenticate to.

<figure aria-describedby="caption-attachment-343" class="wp-caption aligncenter" id="attachment_343" style="width: 300px">[![Zend Framework Authentication](http://ejosh.co/de/wp-content/uploads/2012/06/zf-goog-auth-300x60.png "Zend Framework Authentication")](http://ejosh.co/de/wp-content/uploads/2012/06/zf-goog-auth.png)<figcaption class="wp-caption-text" id="caption-attachment-343">A successful login.</figcaption></figure>

## Zend Framework Setup

This is a basic Zend Framework 1.11 install. I did make a few modifications to it. Because one of the authentication methods is OpenId using Google you have to patch the Zend\_Openid\_Consumer. You can see this why in the [Zend Framework issue browser](http://framework.zend.com/issues/browse/ZF-6905). The other is a way to read attributes from OpenID. This was written by [Chris Bisnett](http://framework.zend.com/issues/browse/ZF-7328). That is the only modifications to the core of Zend Framework. You will want to make sure that you have the most current version of the [Facebook SDK](https://github.com/facebook/php-sdk). The included Facebook SDK is 3.1.1.

## High Level Overview

I will first walk you through how it authenticates any provider and then specifically discuss each that I have. Basically this is what the application does:

- When you click on a login button, attributes tied to the button tell javascript what URL and what action to take.
- The URL will tell the controller what Zend\_Auth\_Adapter to load. The auth adapter has all the logic about how to tell if someone is properly authenticated.
- Zend\_Auth is set(after a positive authentication, of course).
- Depending on the response the controller will respond back in the proper way.

## Button Setup

The buttons get their config options from the application.ini. I have included a sample application.ini that you can plug in your Facebook app settings and also Twitter app settings. There are other config options to set, so let’s look at an example.

```
<pre class="brush: plain; title: ; notranslate" title="">
userpass.endpoint = "/ajax/userpass"
userpass.method = "data-ajax"
```

Endpoint tells javascript what URL to use for this authentication. This route passes the authentication type to the controller. If you look at the bootstrap there are two routes defined which map to ‘ajax/:type/:method’ and ‘oauth/:type/:method’. This URL will pass a type of userpass and the default method. The method attribute is to explicitly tell javascript what method to use.

> Let stop for an aside here. You may ask, Why set a method on the URL and then set the method again? One of the hurdles to making this work is getting information from the server(PHP) to javascript. PHP will change what it does based on the method and the same is true for javascript. I could have used a regular expression to pull out the type in javascript, but I decided to definitely set it in a data- attribute on the element. The userpass.method is for javascript and the userpass.endpoint is used to tell PHP the type and method. Ok, back to the article.

The data-ajax method is true ajax. I call is made asynchronously to the server and login indicators will update without a page load. I will show how this works when we get to this type’s explanation. Let’s see how the button is created with this information.

```php
<?php $config = Zend_Registry::get('config'); ?>

<li><form class="form-inline" id="userpass">
		<input type="text" class="input-small" name="email" placeholder="Email">
		<input type="password" class="input-small" name="password" placeholder="Password">
		<button type="submit" class="btn login-btn" name="submit" data-auth-type="userpass" <?php echo $config->userpass->method . '=' . $config->userpass->endpoint; ?>>Go</button>
	</form></li>
```

The $config variable is so that accessing the variables is easy for each button. The userpass login method requires information from the user, so we have a login form. The button has a class login-btn that we use to capture the click. We echo out the settings, in this case it would be data-ajax=’/ajax/userpass’. This is done for each different button.

Here are the current methods and example endpoints.

| Methods | Example Endpoints |
|---|---|
| data-ajax | /ajax/fb |
| data-endpoint | /oauth/fb |
| data-popup | /oauth/fb/popup |

This is what javascript does with each method.

- data-ajax makes an ajax call with optional form inputs
- data-endpoint redirects the page to (most likely) an oauth endpoint
- data-popup creates a javascript popup which will go to the endpoint and reload the main page when done

One thing to remember – if you use a popup you have to set the method at the end of the endpoint (for example /oauth/google/popup). If you do not do this the application will reload the page in the popup instead of the main page. The user is still authenticated as the session is set, but you will not get the user experience you are expecting.

## Zend Auth Adapters

This is easily extended as it uses Zend’s abstraction for authentication. A factory is used to find return the correct auth adapter and then the authenticate method is run against it. The factory is very straight forward.

```php
class Josh_Auth_Adapter_Factory
{
	public static function factory($type, $options = null)
	{
		if($type == 'fb' || $type == 'fb-oauth')
			return new Josh_Auth_Adapter_Facebook();
		elseif($type == 'twitter')
			return new Josh_Auth_Adapter_Twitter();
		elseif($type == 'userpass')
			return new Josh_Auth_Adapter_Db($options['email']);
		elseif($type == 'google')
			return new Josh_Auth_Adapter_Google();
		else
			return new Josh_Auth_Adapter_None();
	}
}
```

The factory call from AuthController

```php
$this->_adapter = Josh_Auth_Adapter_Factory::factory($this->_type, $this->getRequest()->getParams());
```

You will notice that with the type userpass it sends the email that was POSTed. The factory is called with the full list of parameters in the request, so if you need info that was sent it is there.

Each auth adapter is going to be different. This is the abstraction that Zend Framework gives you. You take whatever measures you need to take to ensure that the user was authenticated by the service (checking Facebook, checking Twitter, or checking a database for username and password). Once you have determined whether or not the user is valid you just return a Zend\_Auth\_Result::SUCCESS or a Zend\_Auth\_Result::FAILURE and the controller will take care of sending the JSON or redirecting the page. That’s it. I will go into further detail about each adapter as an example later.

## Javascript

The demo currently uses the Facebook javascript SDK, jQuery, and a couple of Bootstrap javascript files. If you do not want to have Facebook users login through ajax you can drop the js SDK. jQuery is setup so that you can run it in [no conflict mode](http://api.jquery.com/jQuery.noConflict/). Any use of the $ object is contained in a self executing function so that other libraries can use it.

### Event Bindings

I am going to use the example of the userpass button from before. I will run through what is happening in javascript when you click the login button. First thing is to bind to the click buttons. This is done right after we initialize the Facebook js SDK.

```js
window.jQuery(document).ready(function() {
	window.jQuery('.login-btn').click(function(ev){
		zfAjax.loginEvents(ev);
	});
});
```

### loginEvents click

We use window.jQuery in case $ does not map to jQuery. We then run zfAjax.loginEvents on click. Let’s take a look at that function.

```js
ev.preventDefault();
ev.stopPropagation();
target = $(ev.target);
if(target.attr("data-auth-type"))
{
    //get the auth type from the button
    authType = target.attr("data-auth-type");
}
```

First we we grab the auth type from the data-auth-type attribute. This value should be set on the button in view. Our example will be userpass.

```js

    	if(authType == "fb")
    	{
    		//Facebook is a special case
    		//use it's js SDK to login
    		FB.getLoginStatus(function(response){
    			if(response.status === "connected"){
    				zfAjax.checkLogin(authType, target.attr('data-ajax'));
    			}else{
    				FB.login(function(response){
			    		zfAjax.checkLogin(authType, target.attr('data-ajax'));
    				}, {scope: 'email'});
    			}
    		});
```

Next we are going to check the authtype to see if it is fb. This is important as it is a special case. We will use Facebook’s SDK to login and then send to our server to check. The first method, FB.getLoginStatus, will tell us if the user is logged in and has approved our app. If it returns connected we can check the login. If not we then ask them to login and connect with FB.login. We then check against the server to see if it passes on our side. If you are connected you will get a successful response and if not it will be a failure response. Let’s look at the other methods now.

```js

    	}else if(target.attr('data-ajax')){
    		//these attributes tell us to do this through ajax
    		zfAjax.checkLogin(authType, target.attr('data-ajax'));
    	}else if(typeof target.attr('data-endpoint') !== 'undefined' && target.attr('data-endpoint') !== false){
    		//this attribute tells us to redirect
    		window.location = target.attr('data-endpoint');
    	}else if(target.attr('data-popup')){
    		window.open(target.attr('data-popup'), "Oauth Popup", "width=400,height=400");
    	}else{
    		//let's just try and see if there is a way to login
    		zfAjax.checkLogin(authType, target.attr('data-endpoint'));
    	}
```

These are all the other checks for the other types. The actions are a lot simpler than the Facebook ajax action. Boiling them all down what they do is get the data-endpoint(or data-popup) which will be a URL and then either make an ajax call (checkLogin), reload the page, or create a popup. Now let’s look at the checkLogin function.

### checkLogin

```js
zfAjax.checkLogin = function(type, url){
	//see if there is a form for this
	//the form should have an id that is the  auth type
	formTest = $('#' + type);

	data = {};
	if(formTest.length)
	{
		//auto grab all the fields to send
		//the find selector allows you to have
		//many different layouts in the form and still
		//get the inputs
		formTest.find('input').each(function(){
			data[$(this).attr('name')] = $(this).val();
		});
	}

	var request = $.ajax({
    	type: "POST",
    	url: url,
    	data: data
    });
```

First thing this does is see if there is a form with an id of the type. In this example it will be ‘#userpass’. There is a form so we will go over each input and add the name and value to an empty object. We should end up with two attributes, one for email and one for password. This data is passed in the post to the url given to it. Remember this URL came from the data-endpoint attribute. This will be /ajax/userpass. It can get confusing, but what we are doing is making sure that PHP and javascript both know what type and what URL to send to. It is important to get the method correct for javascript (data-ajax, data-endpoint, or data-popup) as it will affect how we deal with the method. For example if we were using oauth and put data-ajax it would always fail as we cannot redirect to the second oauth page on the authenticating side. At this point we should receive a response back from the server. Depending on where it was a success or failure will change the status code.

Here are two requests. One was without an email address and the other did have an email address supplied. The response is returned as JSON.  
[![Firebug XHR](http://ejosh.co/de/wp-content/uploads/2012/06/firebug_xhr.png "Firebug XHR")](http://ejosh.co/de/wp-content/uploads/2012/06/firebug_xhr.png)  
One of the great features of jQuery’s ajax function is that you can handle successes and failures differently. The ajax function determines this by the HTTP status. A 200 OK is a success and a 401 is a failure. Here is how we deal with them.

```js
request.done(function(res){
    	//loop through the html array
    	//and add it to the page
    	for(html in res.html)
    	{
    		if(html == 'alert')
    		{
    			//special case
    			zfAjax.addAlert(res.html);
    		}else
    		{
    			//the ajax html is passed by id
    			$(html).html(res.html);
    		}
    	}
    });

    request.fail(function(jqXHR, textStatus) {
    	try{
			var error = JSON.parse(jqXHR.responseText);
		}catch(err){
			zfAjax.errorAlert('There was an issue');
			return;
		}
		for(html in error.html)
    	{
    		if(html == 'alert')
    		{
    			//special case
    			zfAjax.addAlert(error.html);
    		}else
    		{
    			//the ajax html is passed by id
    			$(html).html(error.html);
    		}
    	}
	});

```

If you pull the JSON response apart you will see that there is an html attribute that we loop through. If the key is alert it is a special case and we append it the div with id of messages by using zfAjax.addAlert. This alert was created by rendering a partial view in Zend Framework and adding it to the response. Next if it is anything else it will be passed by the id of the element it should be in. For example on a successful userpass login we pass the new button and menu for a logged in user. This is changed without a page reload. If you wanted to add any other content to the page you will want to add the logic to the AuthController before it returns the JSON response. The same is done when a failure status code is returned.

### Partials

I use a few partials to make it easy to break up a page when rendering. It doesn’t matter that much when you first load the page, but when you are preparing the JSON ajax response it comes in handy. I will use the alerts as an example. Here is the alert.phtml.

```php
<div class="alert <?php echo $this->alertClass; ?>">
  <a class="close" data-dismiss="alert" href="#">x</a>
  <p>
    <?php echo $this->alert; ?>
  </p>
</div>
```

It’s very simple. You pass it an alertClass and an alert and it will return you a nice html string that you can put into your response. Here it is being called in the AuthController.

```php
$alert = $this->view->partial('partials/alert.phtml', array('alert'=>'Successful Login', 'alertClass'=>'alert-success'));
```

The $alert variable is then added to the response. This partial is also used with flashMessenger to echo out any messages adding during the previous request. If you chop up your page into partials you can easily reuse them many different times.

### To be Continued

I was hoping to fit this into one post, but it become a very long post. I will discuss the AuthController and how each auth adapter works in the next post.