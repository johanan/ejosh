---
id: 1191
title: '12 Days of Posts: Day 9 – thinking in React'
date: '2015-12-21T21:36:54-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1191'
permalink: /2015/12/12-days-of-posts-day-9-thinking-in-react/
dsq_thread_id:
    - '4448910280'
categories:
    - Javascript
---

We are going to continue our journey into the functional paradigm. In many posts I have made it clear that I like React. Which leads us to the question, why?

In the simplest terms, React is functional. It is best utilized when functional ideas are used to design and build components. This forces most programmers to have to think differently. Think in React, as it were.

What makes React functional? Functional programming gets its name from Mathematics. The definition of a function in Mathematics is:

> a function is a relation between a set of inputs and a set of permissible outputs with the property that each input is related to exactly one output.
> 
> –[Wikipedia](https://en.wikipedia.org/wiki/Function_(mathematics))

This means that we should build React components in such a way that they will only have one output for each input. This may seem simple, but becomes harder the more we think about it.

Image a few years ago and we are programming in jQuery (not that there’s anything wrong with that). We have a list of items and a few different ways that someone can add to the list of items. Someone adds a new item, what is the output of the list? It depends. It depends on what has happened before. Application state is held in the list. We cannot state with any certainty that an input will map to one output.

With React we will just build a component that renders a list. The component will not worry about where the data comes from or how someone can modify the list. If 3 items are passed in, that is what will be rendered. This is functional.

The core idea of React is to build composable components. This means that we start with very simple components which can then be put together to build larger and larger components until we have an entire application. Each one of these components should be functional in nature. They should not hold state and only render what is handed to them. This breaks down how large of a mental model is needed to work on each separate component.

There is a good question to be asked. If all components do not hold state, how do we have an actual application? Does state not have to be changed? If no state is changed, did we not just create a static HTML page? All good questions. We will look at them tomorrow.

Here is a presentation I gave at a local meetup where I cover thinking in React. 

{{< lite-youtube GY0bsYM_zRs>}}