---
id: 599
title: 'Facebook App ID in Django'
date: '2013-08-01T18:23:45-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=599'
permalink: /2013/08/facebook-app-id-in-django/
dsq_thread_id:
    - '1558181846'
image: /wp-content/uploads/2013/08/django.png
categories:
    - django
tags:
    - django
    - Facebook
    - python
---

<div class="action-button">[Download](https://github.com/johanan/django_contexts) the src(github)</div>This is a tale of two app IDs. These app IDs are, more than likely, the ones that you use often. Facebook App ID and Google Analytics. If you have created a site in the last five years or so, you have used these on your site. A common problem with these App IDs is that, you need to have separate IDs based on the environment. Facebook requires a callback domain and will block requests that do not match. I have a localhost app id and then the production app id. So with Google analytics, most likely, you will not track any development traffic.

I will walk you through on how to set them up so they change between environments, without changing any settings. Also, on the two different ways to add variables to the context in Django.

## Different Environments, One settings.py

This idea comes from the [12 Factor App](http://www.12factor.net/config) config. The 12 factor app is a way of developing an application to minimize differences in deployment. If you have developed a Django app for [Heroku](http://www.heroku.com), you have followed some of these rules already.

The way to accomplish this is to store the changing settings in the environment. Locally, you can throw the list of variables into your activate script in your [virtualenv](https://pypi.python.org/pypi/virtualenv). You are using virtualenvs, are you not? If not, use them. Stop right now and read up on them. In production (and staging, and whatever other steps you have), create the environment variables as well. Again, if you have used Heroku, you have done this already.

Now, you need to get them into your application. Django has settings.py for site wide config. Define a function at the top of this file to get the environment variables.

```python
import os

from django.core.exceptions import ImproperlyConfigured

def get_env_variable(var_name):
    """
    Get environment variable or return exception
    """

    try:
        return os.environ[var_name]
    except KeyError:
        error_msg = "Set the %s environment variable" % var_name
        raise ImproperlyConfigured(error_msg)
```

This is straight out of the book [Two Scoops of Django](https://django.2scoops.org/). Read this book if you have not. It is a simple function, but it will make your life easier. If you have added the env var, it will return it, if not, an error is thrown.

This is how you use it:

```python
MIXIN_APP_ID = get_env_variable('MIXIN_APP_ID')
GOOGLE_UA = get_env_variable('GOOGLE_UA')
```

This code is in the github repo as changed\_settings.py. Just paste in the different parts into your own settings.py.

## Get it to the Views

We now have these environment dependent config variables in our settings object, but how do we use them? Two ways, creating a [context processor](https://docs.djangoproject.com/en/1.5/ref/templates/api/#subclassing-context-requestcontext) and creating a view mixin. Each one has a specific use case. A context processor is used for every request. This would be a great spot to store your Google Analytics as you will want to track every request. A view mixin can be targeted to specific views. Perfect for the Facebook App ID.

### Context Processor

This is actually really easy. Create a file with your processor, return your variable, and add it to the TEMPLATE\_CONTEXT\_PROCESSORS tuple in settings.py.

The processor:

```python
from django.conf import settings

def google_ua(request):
    my_context = {
        'GOOGLE_UA': settings.GOOGLE_UA,
        }

    return my_context
```

settings.py:

```python
TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.static",
    "django.core.context_processors.tz",
    "django.contrib.messages.context_processors.messages",
    'mixin.base.context_processors.google_ua',
)
```

You can now reference the config var in your template as {{ GOOGLE\_UA }}. The TEMPLATE\_CONTEXT\_PROCESSORS has all of the defaults. Both of these are in the github repo.

### View Mixin

Django has been moving towards class-based-views for a couple of versions now. It is a little different from the function based views, but it makes the views more reusable. One of the reusability feature is [mixins](https://docs.djangoproject.com/en/1.5/topics/class-based-views/mixins/). A mixin is simply inserting another class to inherit from your view. Here is the context mixin and the home view:

```python
class TokenMixin(object):

    def get_context_data(self, **kwargs):
        context = super(TokenMixin, self).get_context_data(**kwargs)
        context['MIXIN_SECRET'] = settings.MIXIN_SECRET
        context['MIXIN_APP_ID'] = settings.MIXIN_APP_ID

        return context
```

HomeView:

```python
class HomeView(TokenMixin, TemplateView):
    template_name = 'home.html'
```

Just like the context processor, your variables are now in the context. You can reference either one with curly braces ({{ MIXIN\_APP\_ID }}).

At this point, you should know how to add different config variables that are environment dependent, and how to easily add them to a view.