---
id: 1127
title: 'WordPress on Docker: the videos'
date: '2015-12-09T22:01:30-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1127'
permalink: /2015/12/wordpress-on-docker-the-correct-way/
github: https://github.com/johanan/Dockerized-Wordpress-the-Correct-way
dsq_thread_id:
    - '4390835377'
image: /wp-content/uploads/2015/12/wordpress-on-docker-the-correct.webp
categories:
    - Docker
---
I have created a three video series on running WordPress in Docker. This is different than my previous [posts](https://ejosh.co/de/2015/05/ansible-for-server-provisioning/) on Docker and WordPress. The posts I had written before focused mainly on my journey of moving my site to Docker. This means that many pieces were directly tied to my implementation. These videos and code does not have that requirement. The repository can be used to create a WordPress site from scratch and having running in the cloud in just a few minutes.

## WordPress on Docker the Correct way

I keep using the qualifier “the Correct way”. I have explained this in other posts, but I will reiterate it here succinctly. There are quite a few WordPress on Docker containers out there already that run everything in the same container. These containers will allow you to get a site quickly, but everything is tightly coupled. The way I have built it is that the entire implementation of the containers does not matter. As long as you have a backup you can create your site from scratch again. This makes it really easy to run a test site in Vagrant for example. MySQL has an update, destroy your entire site and rebuild. I read a great comment on Hacker News a few days ago. This is paraphrased.

> Don’t treat your servers like pets. Treat them like cattle.

This means do not get attached and tweak settings. The entire site should be a repeatable build that starts from scratch. This blog is already on it’s sixth or seventh iteration of changes because I can create my blog from a backup in about seven minutes. This opens the freedom to test and tweak as any complete screw up is fixable in just a few minutes.

### Full stack WordPress

The site that is built from my repository can terminate SSL with Nginx and cache your requests with Varnish. This means that you get performance right out of the box. This is important because a WordPress site with many plugins running can be quite slow. When you run my WordPress setup you get a four layer application all built in Docker. The layers are reverse proxy, HTTP caching, a PHP application server, and a database server.

In addition to this you will learn about server provisioning with Ansible. Ansible allows you to take a server in any state and move it to the state you want. This means it makes sure you have the users, packages, and files on the server. Ansible lays the groundwork that you build Docker on.

## The Videos

There are three videos in this playlist.  
{{< lite-youtube vFPOv3zn7eY >}}