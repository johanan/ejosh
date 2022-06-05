---
id: 376
title: 'Facebook SDK Login for Zend Framework Tutorial part 2'
date: '2012-06-16T17:04:51-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=376'
permalink: /2012/06/facebook-sdk-login-for-zend-framework-part-2/
dsq_thread_id:
    - '846945139'
categories:
    - PHP
tags:
    - Facebook
    - php
    - 'Zend Framework'
---

<div class="action-button">[Download](https://github.com/johanan/Zend-Framework-Ajax-Login) the src(github)</div><div class="action-button">[View](https://zfajax.herokuapp.com/) the demo</div>This is the second part of using the Facebook SDK as a login mechanism. The first covered how to setup each login button and how that interacted with javascript. This post will cover how the auth adapters work with the controller to verify credentials. At this point you should know how to setup a button in the application.ini.

## AuthController

The controller is called from a route. The path /oauth maps to the oauthAction and /ajax maps to the ajaxAction. The main difference between these two actions is how they respond. Oauth redirects the page and ajax responds in JSON.

### init()

The init() function is run every time the controller loads before any actions. This is a great place to put code that is shared between all actions.

```php

	public function init()
	{
		// Disable the main layout renderer
		$this->_helper->layout->disableLayout();
		// Do not even attempt to render a view
		$this->_helper->viewRenderer->setNoRender(true);
		if($this->getRequest()->getParam('type'))
		{
			$this->_type = $this->getRequest()->getParam('type');

			$this->_auth = Zend_Auth::getInstance();

			$this->_adapter = Josh_Auth_Adapter_Factory::factory($this->_type, $this->getRequest()->getParams());
		}
	}
```

Right off the bat we disable the layout and view because they are not needed (redirects and JSON). Next we grab the type and use our Auth Adapter Factory to return us a valid auth adapter. The second parameter is an options array and we pass in all the parameters from the request. This should give us access to everything that was POSTed or GETed(I am not sure if that is what it is called). Remember that if you add an auth adapter to update the factory to return it. If not it will be a default auth adapter that always returns as a failure.

### Ajax Action

First we will look at the ajax action.

```php

	public function ajaxAction()
	{
		$result = $this->_auth->authenticate($this->_adapter);
		if($result->isValid())
		{
			$this->_auth->getStorage()->write(array("identity"=>$result->getIdentity(), "user"=>new Josh_Auth_User($this->_type, $result->getMessages())));

			$ident = $this->_auth->getIdentity();

			$loggedIn = $this->view->partial('partials/userLoggedIn.phtml', array('userObj'=>$ident['user']));
			$alert = $this->view->partial('partials/alert.phtml', array('alert'=>'Successful Login', 'alertClass'=>'alert-success'));

			$html = array("#userButton"=>$loggedIn, "alert"=>$alert);		
			$this->jsonResponse('success', 200, $html);
		}else{
			$errorMessage = $result->getMessages();
			$alert = $this->view->partial('partials/alert.phtml', array('alert'=>$errorMessage['error'], 'alertClass'=>'alert-error'));

			$html = array("alert"=>$alert);		
			$this->jsonResponse('error', 401, $html, $errorMessage['error']);
		}
	}
```

In this action we jump straight to authenticating because we have already setup the auth instance and the auth adapter. The next step is an if, if authenticated return a valid response if not return an invalid response. At the core this is all this controller does. Initialize auth adapters and return a response. All the heavy lifting is done by the auth adapters.

In both response a render partials that will be put right on the page after returning. If you wanted to change this here is where you would do it. Currently I render the logged in button partial and set it to #userButton. #userButton will be used to find the div that will be replace. The alert will be appended to the page. This is all very extensible and is easily added to or changed with just a few lines of code.

I abstracted out the JSON response.

```php

	protected function jsonResponse($status, $code, $html, $message = null)
	{
		$this->getResponse()
			->setHeader('Content-Type', 'application/json')
			-> setHttpResponseCode($code)
			->setBody(Zend_Json::encode(array("status"=>$status, "html"=>$html, "message"=>$message)))
			->sendResponse();
			exit;
	}
```

It is chained functions that returns our JSON as needed. We set the content-type to the correct format and return a valid response code. This is important as jQuery needs this code to determine if the ajax request was a success or failure. That is it for the ajax action. After a success the session should be set with a valid user.

### oauth Action

This action technically does more than oauth, but I did not want to create another action for each different type. This has become the catchall for any type of authentication that needs to redirect to another server. The two main types that do this is oauth and openId.

```php

	public function oauthAction()
	{
		$oauthNS = new Zend_Session_Namespace('oauthNS');
		if($this->getRequest()->getParam('method') && $this->getRequest()->getParam('method') == 'popup')
		{
			$oauthNS->popup = true;
		}
		$result = $this->_auth->authenticate($this->_adapter);
		if($result->isValid())
		{
			$this->_helper->flashMessenger->addMessage(array('success'=>'Login was successful'));
			$this->_auth->getStorage()->write(array("identity"=>$result->getIdentity(), "user"=>new Josh_Auth_User($this->_type, $result->getMessages())));
		}else{
			$errorMessage = $result->getMessages();
			$this->_helper->flashMessenger->addMessage(array('error'=>$errorMessage['error']));
		}

		if(isset($oauthNS->popup) && $oauthNS->popup == true)
		{
			unset($oauthNS->popup);
			echo $this->view->partial('partials/oauthClose.phtml');
		}else{
			$this->_redirect('/');
		}
	}
```

This is very similar to the ajax action with just a few differences. The first is that it looks for a method. The method is passed as the third parameter in the URL. For example /oauth/google/popup would pass google as the type and popup as the method. If the method is set and it is popup the action will set a session variable. We have to do this as we are going to redirect the page and then come back. After coming back it will close the popup and reload the main window that launched the popup. If you do not set the method as popup, but do set the button config as popup (data-popup in application.ini) javascript and PHP will have different ideas of what is to happen. A popup will be created by javascript, but PHP will just reload the site in the popup instead of the main page. If this happens it is because the method is not being passed in the URL.

Next the action does the same as the ajax action, authenticate and then check to see if the credentials are valid. Then use flashMessenger to add a success or failure message. It doesn’t worry about a response as it will reload the main page.

Finally it takes one more action based on whether it was a popup or not. If the request was a popup it loads a page to close the popup and reload the main site.

```
<pre class="brush: xml; title: ; notranslate" title="">

<html>
	<head>
		<title>ZF Oauth Close</title>
		<script>
			window.opener.document.location.reload(true);
			window.close();
		</script>
	</head>
	<body>
	</body>
</html>
```

This page just has two simple javascript lines in the head.

If it was not a popup just reload the current window.

## User Objects

Before we look at the auth adapters I wanted to talk about the user object. It is a quick hack to work in this situation. You will want create your own user object. The Josh\_Auth\_User just takes an array and spits out an object with methods. You will want to tie these adapters to your user database to add or retrieve the information and then create the user object. Please just view these adapters as a demonstration of how to get to the point of authentication.

## Facebook Auth Adapter

Let us get into the key part of this, the auth adapters. Each one of these contains all the logic needed to verify credentials. Here is the Facebook Auth Adapter.

```php

    public function authenticate()
    {
		//first see if the we have any sort of user
		$user = Josh_Facebook::getUser();

		if($user)
		{
			//now let's get the current user logged into facebook
			$apiMe = Josh_Facebook::api('/me');

			if($apiMe)
			{
				return new Zend_Auth_Result( Zend_Auth_Result::SUCCESS, $apiMe['id'], $apiMe );
			}
		}else{

			return new Zend_Auth_Result( Zend_Auth_Result::FAILURE, null, array('error'=>'You are not authenticated to Facebook') );
		}
        

        
    }
```

Facebook is the easiest. Because Facebook has a PHP SDK we let that take care of the test. If we can make an api call to /me, we know that the person has a valid Facebook oauth token. If you are not sure how Josh\_Facebook works take a look at a [previous post](http://ejosh.co/de/2011/08/facebook-sdk-inside-of-zend-framework/) that has more details. This auth adapter works whether you have used ajax or oauth as they both will give you a valid oauth token.

## Google

In this example we are going to use openID to authenticate to Google. Zend already has an auth adapter for openID, so we are just going to wrap around that.

```php

	public function authenticate()
	{
		$options = Zend_Registry::get('config')->openid->tofetch->toArray();
		$ext = new Cbisnett_AttributeExchange($options);

		if(!$this->_mode)
		{
			$openid = new Zend_Auth_Adapter_OpenId('https://www.google.com/accounts/o8/id');

			$openid->setExtensions($ext);
			$openid->authenticate();
		}elseif($this->_mode == 'id_res'){

			$ext->parseResponse($_GET);
			$props = $ext->getProperties();
			return new Zend_Auth_Result( Zend_Auth_Result::SUCCESS, $_GET['openid_identity'] , array('first_name'=>$props['firstName'], 'last_name'=>$props['lastName'], 'id'=>$_GET['openid_identity'], 'email' => $props['email'], 'gender' => null));

		}elseif($this->_mode == 'cancel'){
			return new Zend_Auth_Result( Zend_Auth_Result::FAILURE, null, array('error'=>'You denied access') );
		}else{
			return new Zend_Auth_Result( Zend_Auth_Result::FAILURE, null, array('error'=>'You denied access') );
		}
	}
```

The first lines of code are to setup the attributes we want to grab. Next we are going to check the openid\_mode in the URL. If it is not set that means this is the initial request. We create the Zend auth adapter with the correct openID endpoint and let it do what it needs to do. The adapter will redirect Google’s end point. Depending on your response, Google’s servers will change what it sets in the openid\_mode parameter. Google will redirect back to the request page (/oauth/google for example) and the adapter will take it from there. If the mode is id\_res it was a success. Parse the attributes and return. Essentially anything else we will return a failure result.

## DB

I don’t have a database backend for this. Any string that you use as your email will return a valid response. This is not a big deal as there is nothing you can do in the application. You, of course, will want to put all your username/password logic in this adapter. This adapter will take the email that was POSTed in the ajax call in the constructor. You will want to have it grab the password as well. After that it makes a simple decision.

```php

    public function authenticate()
    {
    	//you should check in the database here
    	if($this->_email == null)
		{
			return new Zend_Auth_Result( Zend_Auth_Result::FAILURE_IDENTITY_AMBIGUOUS, $this->_email, array('error'=>'No email supplied'));
		}else{
			return new Zend_Auth_Result( Zend_Auth_Result::SUCCESS, $this->_email, array('first_name'=>$this->_email, 
						'last_name'=>'None', 'id'=>null, 'email' => $this->_email, 'gender' => null));
		}
    }
```

Any string is a success and a null string is a failure.

## Add your own

You should be able to create an auth adapter for any service in this framework. You can create a form to collect all the information you need and I have examples for oauth, openid, using an SDK, and custom authentication. You can fork this on [github](https://github.com/johanan/Zend-Framework-Ajax-Login) and if you create any new adapters just send a pull request.

</body></html>