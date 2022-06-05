---
id: 311
title: 'Google Event Tracking'
date: '2012-05-14T20:41:25-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=311'
permalink: /2012/05/google-event-tracking/
dsq_thread_id:
    - '851018496'
categories:
    - Javascript
tags:
    - 'Google Analytics'
    - javascript
---

I will talk about event tracking in [Google Analytics](http://www.google.com/analytics/) today. Almost everyone has heard of Google Analytics and I am guessing you are currently using it to track page views. All you have to do is pop a little javascript on your page and you have hundreds of ways to view the traffic your site receives. If you are not using event tracking though, you are missing out on quite a few data points. For a quick primer look at [Google’s documentation](https://developers.google.com/analytics/devguides/collection/gajs/eventTrackerGuide).

## Events

I won’t go into the general idea of tracking events. You have to decide what constitutes an ‘event’ that you want to track. A quick search turns of thousands of blogs that will give you ideas. I want to specifically talk about specific use cases. The first is a one page javascript application. When you are only tracking page views you will miss 90% of the interaction on the page. You have to piggyback on events to see what is happening in the app. The other case is errors. Javascript is client side so if it breaks you do not see it. Event tracking can track these for you.

### App Interactions

I will use [RunBrowser](http://runbrowser.appspot.com) as my example app. It is a single HTML page javascript app. I used the event listeners on buttons to log events to Google. I did this inside of my [AppController](http://ejosh.co/de/2012/04/html-5-run-tracking-application/) object. You can specify the category, action, label, and value for each event. I mainly just used category and action as it was a small app. I tied the main Start button to a Runbrowse category and Start action. Then I tied the save or clear button presses to the Runbrowse category and Save or Clear actions respectively. At this point I can view how many people started runs and then eventually saved them. This data would be lost without event tracking.

Here is a report called Events Flow:  
[![Events Flow](http://ejosh.co/de/wp-content/uploads/2012/05/event_flow-300x197.png "Events Flow")](http://ejosh.co/de/wp-content/uploads/2012/05/event_flow.png)

You see that 35 people from the US viewed the page during the selected dates. 4 of them viewed a saved run and 31 started a new run. 20 of those 31 paused it to hit clear or save, I did not extend the image past that, but you would be able to see how many people eventually saved their run (not the actual run and the data associated just the event of saving it). Out the 11 that did not pause 3 had errors. Without event tracking I would have only seen 35 visits from the US and missed out on all this other data.

### Errors!

Tracking errors with events is a great way to see what is happening out in the wild. As we saw in the events flow report I had some errors come up. In my error handler for GPS I track the category as Error and the action as the error code. The error codes match what is returned from the location object according to the [API](http://dev.w3.org/geo/api/spec-source.html#position_error_interface). The three values map to 1= PERMISSION\_DENIED, 2 = POSITION\_UNAVAILABLE, and 3 = TIMEOUT. I can view my Error category and get a rundown of all the errors on my page.  
[![Errors](http://ejosh.co/de/wp-content/uploads/2012/05/errors-300x38.png "Errors")](http://ejosh.co/de/wp-content/uploads/2012/05/errors.png)

This report shows I had 12 events where permission was not given to track the location and 4 timeouts. The other event is the clear modal after the error. You could have client side issues and errors and most people will not send a bug report back to you. With event tracking of errors you can see exactly how many errors and hopefully why. You can also tie in other information like browser and OS version to see if you have a specific bug that only affects a subset of users.

## Unobtrusive Event Tracking

I found a great jQuery plugin to do [Google Event tracking](http://blog.building-blocks.com/how-to-use-building-blocks-jquery-unobtrusive-google-analytics-event-tracking-plugin). Because it is jQuery you don’t have to worry about cross browser issues. It allows you to easily add event tracking to an existing page or to on a new page. It attaches right to the click event handler so you don’t have to muddy up your HTML with a lot of onclick attributes. It has the ability to use HTML5 data-\* attributes to set category, action, label, and value. It has many options that should be able to suit your needs. It is also hosted on [GitHub](https://github.com/rsleggett/Quick-Event-Tracking).