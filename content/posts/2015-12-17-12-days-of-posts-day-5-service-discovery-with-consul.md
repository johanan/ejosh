---
id: 1176
title: '12 Days of Posts: Day 5 – Service discovery with Consul'
date: '2015-12-17T22:21:17-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1176'
permalink: /2015/12/12-days-of-posts-day-5-service-discovery-with-consul/
dsq_thread_id:
    - '4415846346'
categories:
    - Uncategorized
---

We are going to move away from JavaScript for a few days. The last few months I have been making quite a few posts about Docker, Ansible, and Vagrant. The main reason for this is because I recently moved my blog from a Linux server that was setup by hand to some Docker containers that are automatically configured.

In this post I will touch on [Consul](https://www.consul.io/). Consul is a service discovery tool. Service discovery allows us to uncouple the creation and linking of Docker containers. In my setup I felt that my containers are too dependent on each other and the Docker-compose definition. This makes scaling horizontally very difficult. In addition to this adding new services, like say another web server for proxying is harder than it should be.

This is where Consul comes in. This means that when a container comes up it can query Consul and find all the web servers it needs to know about. The container can also be alerted when a new container is created and react to it.

Unfortunately I do not have any real examples other than you can play around with Consul in Docker with this command.

```bash
docker run -d --name=consul --net=host gliderlabs/consul-server -bootstrap
```

If you cannot tell I am working on some new posts that will deal with Consul and Docker so stay tuned.