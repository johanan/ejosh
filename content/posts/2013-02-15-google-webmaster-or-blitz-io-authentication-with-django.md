---
id: 518
title: 'Google Webmaster or Blitz.io Authentication with Django'
date: '2013-02-15T07:48:30-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=518'
permalink: /2013/02/google-webmaster-or-blitz-io-authentication-with-django/
dsq_thread_id:
    - '1090788547'
categories:
    - django
tags:
    - django
    - python
---

This will be just a quick post. Sometimes you have to prove your ownership of a domain. This is true when you sign up for [Google Web Master Tools](https://www.google.com/webmasters/tools) or want to run a test with [Blitz.io](https://www.blitz.io). Google and Blitz.io give you a long hexadecimal string that you have to respond to from your site.

In the case of Blitz.io they give you a string that needs to respond with ’42’. If you are running django you can do this very quickly and easily. In the main project folder in the urls.py file:

```python
#import HttpResponse
from django.http import HttpResponse

#in the url list add
url(r'^mu-your_hexadecimal_number', lambda r: HttpResponse('42')),
```

That’s it. I know this kind of breaks separating out views, but this is usually a one time thing. After verifying you can remove this line. I do not really see any sense in creating a view to return two characters.