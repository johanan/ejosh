---
id: 1200
title: '12 Days of Posts: Day 10 – functional state with Redux'
date: '2015-12-22T23:29:21-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1200'
permalink: /2015/12/12-days-of-posts-day-10-functional-state-with-redux/
dsq_thread_id:
    - '4427029940'
categories:
    - Uncategorized
---

Yesterday we finished the post with questions about how to store and use state. All applications have state and have to manage state otherwise they would be static documents. This becomes even more difficult if we try to make our application functional. Functional applications try to minimize state changes as much as possible. How do we do this in a functional application like React?

The best way to visualize what functional state looks like is to imagine a series of actions with facts. Each fact is a small immutable piece of data. We had a simple example last post about a list of items. An action with a fact would be, “here is a new item”. The action would be add an item and the fact being the actual item. An application then is just a stream of actions with facts.

This idea allows us to reason about state using the idea of a reducer function. A reducer function is a way to summarize or aggregate a list of data. In our example each action will be run through a reducer which will then summarize what the state should be. This means that the list is being built as the application runs.

A great benefit of this is that we can now store each action with its data and have a complete picture of what happened. We can easily create an exact state we want to test or even playback errors.

When using React there is a great library that we can use that implements state in this way. It is called [Redux](https://github.com/rackt/redux).

My hope is that I have explained this enough. If not here is a great [video series](https://egghead.io/series/getting-started-with-redux) that goes more in-depth with creator of Redux.