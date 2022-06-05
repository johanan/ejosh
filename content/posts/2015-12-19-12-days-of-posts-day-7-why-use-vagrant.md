---
id: 1182
title: '12 Days of Posts: Day 7 – why use Vagrant'
date: '2015-12-19T19:33:21-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1182'
permalink: /2015/12/12-days-of-posts-day-7-why-use-vagrant/
dsq_thread_id:
    - '4420234459'
categories:
    - Uncategorized
---

We will continue in this post covering system related content. Not that long ago it was very difficult to have a development system match a production system. The task of making your local system match any other build was essentially impossible. There were steps you could take, but there was always a small amount of differences. These differences could introduce issues. Those issues would then be very difficult to track down. The cliche, “it works for me”, comes from this.

Docker is a great start at mitigating this. In fact, I would say a properly designed Docker setup goes almost all of the way toward fixing those differences. The next step past Docker is using something like Vagrant.

Vagrant is just a wrapper around VirtualBox that can automate the creation and provisioning of virtual machines. Vagrant allows us to have, for all intents and purposes, a version of production on our local machine.

Are you using Ubuntu 14.04 for production? Use Ubuntu 14.04 for Vagrant. Provision it with the same tools and configurations. At this point, to your application it is exactly the same. You will never run into any new or strange bugs because of a difference between environments.

If you look over my post history (pushing 5 years already!), hopefully you will see a growth in my projects. This is something that I have really tried to embrace because I personally have been bitten by these issues. My last project included a way to completely run it locally in Vagrant, in addition to be being able to push to the cloud. I also plan on updating some of the more popular projects to utilize Vagrant as well.