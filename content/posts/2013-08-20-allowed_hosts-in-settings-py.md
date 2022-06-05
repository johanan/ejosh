---
id: 624
title: 'ALLOWED_HOSTS in settings.py'
date: '2013-08-20T22:53:33-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=624'
permalink: /2013/08/allowed_hosts-in-settings-py/
dsq_thread_id:
    - '1693291344'
image: /wp-content/uploads/2013/08/django.png
categories:
    - django
tags:
    - django
    - python
---

This is going to be a short post. It deals with a specific issue I just ran into.

I had an old project that I had started. I made the decision to start up development on it again. The project was running Django 1.4.3. There were some sites I had done in 1.5, but I had not migrated a site yet. I jumped into my requirements.txt and changed the line to 1.5.2 the most current stable version of Django.

The migration was not too difficult and I decide to push it to Heroku. After pip installs the updated version of Django I load up the app and I get a 500 status code. I double check my local version and I don’t get the error. I push out a change to make Heroku run DEBUG=True (running the local as DEBUG=False would have been too easy). The site works.

I had not setup any logging as there was not much code, so I setup a quick log to console. I notice that it is complaining about the [ALLOWED\_HOSTS setting](https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts).

Django released a [security update](https://www.djangoproject.com/weblog/2013/feb/19/security/) in February 2013 for 1.4.4 (just missed it) that requires the ALLOWED\_HOSTS to be set if DEBUG=False. All you have to do is set it to your FQDN. I went ahead and set it for my local development site and Heroku.

Hopefully this will save someone some time.