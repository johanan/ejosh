---
id: 627
title: 'FormView is Broken (kinda)'
date: '2013-09-03T12:06:05-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=627'
permalink: /2013/09/formview-is-broken-kinda/
dsq_thread_id:
    - '1697633217'
image: /wp-content/uploads/2013/08/django.png
categories:
    - django
tags:
    - django
    - python
---

Have I dropped enough praise of [Two Scoops of Django](https://django.2scoops.org/)? You really should buy the book.

I started with Django by going through the tutorial. It is a great tutorial, but I do have one issue with it. It focuses on function based views (FBV). I understand why. It is easier to understand these then the newer class based views (CBV). Because of this I had been using FBV in my projects.

Chapter 7 of Two Scoops of Django really breaks down the difference and the pros and cons of each approach. I have firmly fell into the CBV camp. There are two reason why.

The first is the fact that you write less code. This brings the added benefit of having less code to test. Here is a great example:

```python
 class MyTemplateView(TemplateView):
    template_name = 'template.html'
```

That is all you need to render a template. It takes one test that checks for the template used and you can move on.

The other benefit I see is the HTTP verbs being broke out. This means no more writing if request.method == ‘POST’. You now have a get, post, put, patch, delete, head, options, and trace. The verb is also the name of the method. This post isn’t about CBVs though.

## A Broken FormView

This brings me to my point. The default CBV FormView is broken in Django. FormView throws away all your kwargs that were passed into it. The offending line is [161 in django.views.generic.edit.py](https://github.com/django/django/blob/master/django/views/generic/edit.py#L161):

```python
 return self.render_to_response(self.get_context_data(form=form))
```

It uses the hook get\_context\_data, which accepts kwargs, and just passes the form kwarg. If you have overridden get\_context\_data, FormView will just throw them away. This is not a huge thing, but sometimes you pass in an id of something you need to look up in a kwarg.

I just create a simple class that inherits from FormView and adds back in the kwargs. I feel it is the cleanest, most Django way to get them back. I just override the get and the form\_invalid methods.

<script src="https://gist.github.com/johanan/6419254.js"></script>