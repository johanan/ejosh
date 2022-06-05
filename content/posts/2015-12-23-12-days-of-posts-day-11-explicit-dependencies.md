---
id: 1204
title: '12 Days of Posts: Day 11 – explicit dependencies'
date: '2015-12-23T21:38:24-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1204'
permalink: /2015/12/12-days-of-posts-day-11-explicit-dependencies/
dsq_thread_id:
    - '4450508363'
categories:
    - Uncategorized
---

Today we are going to talk about a subject that relates to Docker and how projects are setup. A few years ago, managing a software project was more difficult. Every piece of software that is not a few lines of code relies on other software usually written by someone else. Managing the versions (if the software was even versioned!) was very difficult. In .NET things went into the GAC so that you had to prep your environment before deployment. PHP was whatever you downloaded and threw in your project. JavaScript was essentially the same. I remember many times downloading jQuery for a project. I will cede that many of these methods were not the best ways at the time.

Things started to get better. Python has virtualenv. This allows developers to virtualize entire dependency stacks. You can work on the same project with different dependencies on the same machine. .NET has NuGet. In addition to embracing NuGet Microsoft has started to break large monolithic dependencies into small packages. Look no further than ASP.NET 5 to see this in action.

Software projects are now composable. This is a key concept that I felt the entire industry forgot about for a long time. Unix has a philosophy of small sharp tools. This means creating some small tool that does one thing and does it well. We seem to have come full circle back to this idea. We do not want large libraries that try to do everything, we want one tool that does something well.

I have one aside to this. Pin your dependencies! I see many projects, I am looking toward Node.js projects, where dependencies are loosely defined. For example a dependency referencing anything over version 2 when the latest version is 4. If you built your project with version 2.2.0 then explicitly define that in your dependencies. Small rant over.

One of the reasons why I have been doing so much Docker stuff is that I feel this is the current step of this idea. Docker is a virtualenv that is a little larger in scope. I know that the idea of containerization is not new. The tooling and by extension, the ease, is new though. We have made development environments a commodity. We can wrap an entire production stack, download it to a new system, and then just start it up. I am excited to see where we as a community will go next.