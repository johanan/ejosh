---
id: 642
title: 'Django Rest Framework and Forms Reusing validation logic'
date: '2014-02-02T14:47:04-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=642'
permalink: /2014/02/django-rest-framework-and-forms/
dsq_thread_id:
    - '2210777371'
image: /wp-content/uploads/2013/08/django.png
categories:
    - django
tags:
    - django
---

Django Rest Framework is great for creating an API. It allows you to quickly create an restful API while still giving you a lot of power. It uses Class based views that you can then extend.

This creates an issue though. You most likely already have an entry point for your data: forms. Your forms probably have validation on them right now. Adding a new entry point will allow users to enter invalid data.

Validators  
Django Rest Framework’s [serializers](http://django-rest-framework.org/api-guide/serializers.html) (the objects that do the bulk of Python to JSON and back) have a form like interface. You fill them with data and then validate them. You can just copy paste your validation logic between the form and serializer, but that’s not very DRY.

Single field  
You can create .validate\_<fieldname> which would work just like form’s .clean\_<fieldname> and call a validation function. You also can append the validator to the field in both classes. As an example say you have a model with a name. You would then create validation logic so that no one can name an event Josh.</fieldname></fieldname>

```python
from django.core.exceptions import ValidationError

def validate_event_name(name):
        nameLower = name.lower()
        if nameLower == 'josh':
            raise ValidationError("You cannot name the event %s" % name)
```

You are only validating one field so the function only takes one parameter. You can then wire it up to both the form and serializer like so.

Serializer:

```python
def init(self, *args, **kwargs):
        super(EventSerializer, self).__init__(*args, **kwargs)
        self.fields['name'].validators.append(validate_event_name)
```

Form:

```python
def init(self, *args, **kwargs):
        super(CreateEvent, self).__init__(*args, **kwargs)
        self.fields['name'].validators.append(validate_event_name)
```

You now have all entry points covered and only one function defined. If you wanted to add the name Brian as an invalid name this would be easy.

Multiple Fields  
You may also need to validate multiple fields together. Let’s say you have a model that has two fields: fbid and email. Your validation logic is that either a fbid or an email has to be added or it is invalid. You cannot do this with a single field validator. You will have to use the final validation on the form and serializer. First let’s look at the validation function.

```python
from django.core.exceptions import ValidationError

def validate_multiple_fields(**kwargs):
    email = kwargs.pop('email')
    fbid = kwargs.pop('fbid')

    if not email and not fbid:
            raise ValidationError("You must enter an email address or Facebook user.")
```

You can now tie it to the form and serializer.

Serializer:

```python
def validate(self, attrs):
        email = attrs['email']
        fbid = attrs['fbid']

        validate_multiple_fields(email=email, fbid=fbid)

        return attrs
```

Form:

```python
def clean(self):
        cleaned = super(SuperOfThisForm, self).clean()
        email = cleaned.get("email").lower()
        fbid = cleaned.get("fbid").lower()

        validate_multiple_fields(email=email, fbid=fbid)

        return cleaned
```

You can see there is a little more plumbing here. It still abstracts out the validation into the same function. The validation function is also the perfect size for a unit test.