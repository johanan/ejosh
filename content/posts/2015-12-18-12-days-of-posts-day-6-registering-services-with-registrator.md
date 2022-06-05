---
id: 1180
title: '12 Days of Posts: Day 6 – registering services with Registrator'
date: '2015-12-18T22:27:24-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1180'
permalink: /2015/12/12-days-of-posts-day-6-registering-services-with-registrator/
dsq_thread_id:
    - '4484881257'
categories:
    - Uncategorized
---

Today we will are continuing the topic of system orchestration. When using service discovery you need to be able to register your services for them to be discovered. This is difficult in any case, but even more so with Docker.

For the most part I subscribe to the one process per container paradigm. If we need a service registration process that runs along side the container’s main process then that immediately breaks one process per container. In addition to this every container you spin up will need to be a custom container. You won’t be able to just grab the official Docker image of anything.

This is where [Registrator](https://github.com/gliderlabs/registrator) comes in. Registrator automatically registers your container as a service with a few service registries, Consul being one. Registrator does this by listening for container start and stop events. It allows us to bring up containers and have them automatically added to Consul.

I recommend going through the [quickstart](http://gliderlabs.com/registrator/latest/user/quickstart/). You can have this going in just a few minutes.