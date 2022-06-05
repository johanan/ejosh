---
id: 10
title: 'Facebook SDK inside of Zend Framework Tutorial'
date: '2011-08-13T15:25:12-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://99.89.45.108/wordpress/?p=10'
permalink: /2011/08/facebook-sdk-inside-of-zend-framework/
dsq_thread_id:
    - '847356393'
categories:
    - PHP
tags:
    - php
    - 'Zend Framework'
---

<div class="action-button">[Download](https://github.com/johanan/Zend-Framework-Facebook) the src(github)</div><div class="action-button">[View](https://zendfb.herokuapp.com/) the demo</div>This tutorial should show you how to take a Zend Framework project and easily add the Facebook SDK to it. You will be able easily make calls to either the Javascript or PHP SDK and also use Facebook’s new Graph API. Let’s get started. Don’t worry if you don’t have Zend Framework or don’t want to use it as I will cover how to do this [outside of Zend](#no-zend) as well.

> It doesn’t matter if use Zend or not, you can follow along and use the code in your project as well.

## Setup Zend Framework

First thing to do is [download](http://framework.zend.com/download/latest "download") the latest version of Zend Framework. It is a free download, but you will have to create an account. If you don’t use Zend Framework (ZF from here on out) you really should. It is very extensible and versatile. I won’t continue to try and sell you on ZF (and most likely you already are using it).

Next thing to do is setup a project (of course if you have a project just use that). I won’t go into how to do this, but there is a great [quickstart tutorial](http://framework.zend.com/manual/en/learning.quickstart.intro.html) on Zend’s site that is a great introduction if you haven’t used ZF before.

You should now have the default ZF page if all is working correctly.

<figure aria-describedby="caption-attachment-14" class="wp-caption alignnone" id="attachment_14" style="width: 300px">[![This should be familiar to you.](http://ejosh.co/de/wp-content/uploads/2011/08/default_ZF-300x195.png "default_ZF")](http://ejosh.co/de/wp-content/uploads/2011/08/default_ZF.png)<figcaption class="wp-caption-text" id="caption-attachment-14">This should be familiar to you.</figcaption></figure>

## Download the Facebook SDK

Facebook has a github repo where you can [download their latest SDK for PHP](https://github.com/facebook/php-sdk/). Go ahead and grab the latest version and uncompress it.

We now need to add this to our ZF project.

Create a new folder under your ZF project called ‘Facebook’.

Grab the files out the src folder from the Facebook SDK and add it to ZF’s Facebook folder you just created. Your folder should have three files in it now (at least as of SDK version 3.1.1):

<figure aria-describedby="caption-attachment-17" class="wp-caption alignnone" id="attachment_17" style="width: 300px">[![Your new Facebook Library folder.](http://ejosh.co/de/wp-content/uploads/2011/08/fb_library_folder-300x36.png "fb_library_folder")](http://ejosh.co/de/wp-content/uploads/2011/08/fb_library_folder.png)<figcaption class="wp-caption-text" id="caption-attachment-17">Your new Facebook Library folder.</figcaption></figure>

Now we have to change the name of the Facebook class for it to work with ZF. I am going to use [Aptana Studio](http://www.aptana.com/products/studio3/download) to edit the php files. Just like Zend Framework, if you haven’t checked it out you should. We are going to edit the facebook.php file and change the class name from Facebook to Facebook\_Facebook.

```php
require_once "base_facebook.php";

/**
 * Extends the BaseFacebook class with the intent of using
 * PHP sessions to store user ids and access tokens.
 */
class Facebook_Facebook extends BaseFacebook
{
```

One more thing we have to update is the application.ini file for ZF. This should be located at application/configs/application.ini. We have to tell it that we added a folder in the library.

```text
[production]
phpSettings.display_startup_errors = 0
phpSettings.display_errors = 0
includePaths.library = APPLICATION_PATH "/../library"
bootstrap.path = APPLICATION_PATH "/Bootstrap.php"
bootstrap.class = "Bootstrap"
appnamespace = "Application"
resources.frontController.controllerDirectory = APPLICATION_PATH "/controllers"
resources.frontController.params.displayExceptions = 0
autoloadernamespaces.Facebook = "Facebook_"

[staging : production]

[testing : production]
phpSettings.display_startup_errors = 1
phpSettings.display_errors = 1

[development : production]
phpSettings.display_startup_errors = 1
phpSettings.display_errors = 1
resources.frontController.params.displayExceptions = 1
```

### Why Facebook\_Facebook?

Good question. It is for autoloading in ZF. When you use ZF you don’t need to use a bunch of requires, based on the class names ZF will figure out what class to load. This tells ZF to look in the library for a folder called Facebook with a file called facebook.php and load the class in that file. At this point we have technically added the Facebook SDK to ZF. We can create a new facebook object anywhere in our project by calling:

```php
$fb = New Facebook_Facebook(array(
	'appId' => 'appid',
	'secret' => 'appsecret',
));
```

## Create our new class

We will now create a class to wrap our Facebook objects to only intialize them once, when needed(lazily), centralize all configuration options. We are creating a singleton object for Facebook.

We have to create a folder in the library to hold this new class. I am naming mine Josh, cause that’s my name. After we have that create a new file named facebook.php. Here is the code for that file.

```php
<?php
class Josh_Facebook
{

	private static $fb;

	private static function getFB()
	{
		if(self::$fb)
		{
			return self::$fb;
		}

		$bootstrap = Zend_Controller_Front::getInstance()->getParam('bootstrap');

		$options = $bootstrap->getOptions();

		$fb = New Facebook_Facebook(array(
				'appId' => $options['facebook']['appid'],
				'secret' => $options['facebook']['appsecret'],
				));

		self::$fb = $fb;

		return self::$fb;
	}

	public static function __callStatic ( $name, $args )
	{

        $callback = array ( self::getFB(), $name ) ;
        return call_user_func_array ( $callback , $args ) ;
    }
}
?>
```

Let’s step through this class. The $fb variable is a static variable, this means it can be used without an instance of the class. In fact everything is static so we never will initialize this class. The first time this class is called it will initialize the facebook class for use with our app\_id and app\_secret we have put in our application.ini (I will get to this in a second). After initializing the class it stores it in the static variable $fb, so the next time it is called it will just use the already initialized object.

The function \_\_callStatic will map whatever function you are trying to call with the underlying Facebook function. For example Josh\_Facebook::api(‘/me’) will map to Facebook-&gt;api(‘/me’). It will then return whatever was returned by that function. What is nice about this is that we don’t have to map every function to the facebook functions.

Now let’s tell Zend Framework about our new namespace and facebook details.

```text
[production]
phpSettings.display_startup_errors = 0
phpSettings.display_errors = 0
includePaths.library = APPLICATION_PATH "/../library"
bootstrap.path = APPLICATION_PATH "/Bootstrap.php"
bootstrap.class = "Bootstrap"
appnamespace = "Application"
resources.frontController.controllerDirectory = APPLICATION_PATH "/controllers"
resources.frontController.params.displayExceptions = 0

autoloadernamespaces.Josh = "Josh_"
autoloadernamespaces.Facebook = "Facebook_"

facebook.appid = PRODUCTION_APP_ID
facebook.appsecret = PRODUCTION_APP_SECRET

[staging : production]

[testing : production]
phpSettings.display_startup_errors = 1
phpSettings.display_errors = 1

[development : production]
phpSettings.display_startup_errors = 1
phpSettings.display_errors = 1
resources.frontController.params.displayExceptions = 1

facebook.appid = DEV_APP_ID
facebook.appsecret = DEV_APP_SECRET

```

Exactly like our Facebook\_ namespace we need to add a Josh\_ namespace (or whatever you named your folder). The next things we add are our facebook app\_id and app\_secret (you will get these from Facebook when you create an application). The awesome part about implementing the Facebook SDK this way is that you can seamlessly jump between two applications. When you are developing a Facebook application if you test locally and also have a production server you can’t use the same application as Facebook requires a domain name. If you have setup Zend Framework correctly when you load up you local test copy (remember to set you APPLICATION\_ENV to development) it will load your development app\_id and app\_secret and then on production it will load those.

## Let’s use this in an Example

Inside of the Facebook SDK there is an example of how to use it. We actually will just take that example and modify to work in our ZF installation. It’s honestly deleting a few lines and changing three other lines.

First open up application/views/scripts/index/index.phtml. This is the default file that is loaded when you go to your projects root (or public folder). Ctrl+A it and delete it all. Put in this in it’s place:

```php
<!--?php <br ?-->// See if there is a user from a cookie using our new class
$user = Josh_Facebook::getUser();

if ($user) {
  try {
    // Proceed knowing you have a logged in user who's authenticated. Notice we don't have
	// to initialize an object and we just call the class.
    $user_profile = Josh_Facebook::api('/me');
  } catch (FacebookApiException $e) {
echo '
'.htmlspecialchars(print_r($e, true)).'
';
    $user = null;
  }
}

?>

<!--?php if ($user) { ?-->
Your user profile is
<!--?php } else { ?-->

<!--?php } ?-->
<script type="text/javascript">// <!&#91;CDATA&#91;
	window.fbAsyncInit = function() {
		FB.init({
			appId: '<?php echo Josh_Facebook::getAppID() ?>',
			cookie: true,
			xfbml: true,
			oauth: true
		});
		FB.Event.subscribe('auth.login', function(response) {
			window.location.reload();
		});
		FB.Event.subscribe('auth.logout', function(response) {
			window.location.reload();
		});
		};
		(function() {
			var e = document.createElement('script'); e.async = true;
			e.src = document.location.protocol +
			'//connect.facebook.net/en_US/all.js';
			document.getElementById('fb-root').appendChild(e);
		}());
</script>
```

First thing we do differently from the Facebook example is delete the require as ZF will do all the autoloading for us. We then take out the initialization code for the facebook object as our new class will do that. We then have to change all the references to $facebook to Josh\_Facebook. We also need to change the -&gt; to :: as we are calling static functions. If you have put in correct app settings into your application.ini you should be able to run this.

Another thing to note is that we can call this Facebook class in the view. It’s not correct MVC design as any data should be coming from the model layer (you can easily use this in the model layer), but what is nice is that you can call echo Josh\_Facebook::getAppID() in the view to get the app\_id for the Javascript SDK.

## I don’t use Zend Framework

<a name="no-zend"></a>There is not much modification for this. First thing is that we lose autoload so we have to add requires to the top of our Josh\_Facebook file (of course modify this to work in your installation)

```php
require('.\library\Facebook\facebook.php');
```

and our facebook example page(I renamed this to non\_zend\_facebook.php instead of facebook.php)

```php
require('.\non_zend_facebook.php');
```

Don’t forget to call your functions from the class name Non\_Zend\_Facebook. The final step is to modify your non\_zend\_facebook.php file to have your app\_id and app-secret loaded.

```php
private static function getFB()
	{
		if(self::$fb)
		{
			return self::$<span class="hiddenGrammarError" pre="">fb;
		}

		$fb</span> = New Facebook_Facebook(array(
				'appId' => 'APP_ID',
				'secret' => 'APP_SECRET',
				));

		self::$fb = $fb;

		return self::$fb;
	}
```

We can now use this class anywhere we include our non\_zend\_facebook.php file.

[Download](https://github.com/johanan/Zend-Framework-Facebook) this project (I only have the changes to Zend Framework not an entire install of it and the non Zend Framework files).

[View](http://ejosh.co/demos/zendfb/) the demo of this.