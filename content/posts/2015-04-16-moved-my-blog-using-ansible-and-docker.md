---
id: 904
title: 'Moved my blog using Ansible and Docker'
date: '2015-04-16T22:16:54-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=904'
permalink: /2015/04/moved-my-blog-using-ansible-and-docker/
dsq_thread_id:
    - '3688267284'
image: /wp-content/uploads/2015/04/docker.png
categories:
    - Uncategorized
---

This blog has had a long and generally boring history. It started off on an old computer in my basement. This was in late 2011. I then needed to upgrade Ubuntu. This lead me to move the site into the cloud on Amazon EC2. It was a standard LAMP server running Ubuntu 12.04. That was three years ago and I needed to upgrade to the next Ubuntu LTS. To move to the new server I created an Ansible playbook to setup the server and Docker to run the site. I will be writing this up over the next few weeks.

In addition to moving to Docker, I will also cover WordPress performance. Previously I did not worry about performance that much. WordPress makes it easy to run a blog, but you must do all optimizations yourself. I did not spend much time optimizing as I had other projects and this was and still is a personal side project.