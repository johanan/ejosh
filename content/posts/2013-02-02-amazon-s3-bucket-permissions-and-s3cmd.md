---
id: 512
title: 'Amazon S3 Bucket Permissions and s3cmd'
date: '2013-02-02T17:01:22-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=512'
permalink: /2013/02/amazon-s3-bucket-permissions-and-s3cmd/
dsq_thread_id:
    - '1062813045'
categories:
    - Uncategorized
tags:
    - amazon
    - ec2
    - s3
---

I recently moved this website to run in the cloud. It was previously running on an old computer in my basement. I have had plans to play with EC2 machines. I also needed to update my Ubuntu install since it was 10.04. One more mark for moving the server to the cloud column was that I switched ISPs. AT&amp;T was my ISP for the last 3 years, but Comcast had wooed me in with a deal. I was experiencing some intermittent slowness and connection drops with AT&amp;T, so I decided to switch over to Comcast.

One thing that I did not know when I switched was that Comcast does not allow any hosting. I noticed a few days after switching that my site was not up. At first I thought it may have been the router as I replaced that when I changed ISPs. After a little research I discovered Comcast blocks all ports coming in. All of these lead me to the epiphany that now is the perfect time to move the site onto EC2.

> Most of Amazon’s AWS documentation is terse and not definitive in any way.

## Amazon S3 and s3cmd

I am not really going to go into how to setup and run an EC2 instance. There is a lot of information on the internet about how to do this. Another reason is that EC2 instance management does not have any definitive answers as each situation will require different solutions. I will note that for a simple setup (one server) can be done completely with the web interface. Most tutorials will have you use the EC2 command line tools.

I will talk about S3 and backing up your data with s3cmd. Backing up your data is similar to flossing. You are always told you need to do it, but it is very easy to skip. It also does not affect you until you have a teeth cleaning or your server goes down. I did not have this problem as I had good backups that made moving my server to the cloud very easy.

The old server was using Dropbox as a poor man’s cloud sync. I did not run it as a daemon, I would let it run in the background. This was not a huge issue as I only rebooted the server once or twice a year. I decided to change that to syncing to S3.

### Backup Scripts

Linux is really easy to backup. Most configs are text files, so all you have to do is tar them up. All that I backup is:

- sql dump
- tar of the folder that held the website
- tar of etc
- a list of installed packages (dpkg –get-selections)

Cron these up and you have a disaster ready backup plan.

## s3cmd

[S3cmd](http://s3tools.org/s3cmd) is tool that allows you to get and put data on S3. I know that Ubuntu 12.04 does have it in the repository, so installation is easy. Configuring it is a little more difficult. Well I should say that configuring S3 with the correct permissions is more difficult.

You can easily just use your Amazon AWS user and give it full permissions, but you should have a separate user. First thing is to create a user in IAM (AWS dentity and Access Management). Make sure you copy the Access Key ID and secret. If you do not copy this you cannot get the secret again. You can create a new one, but each user can only have two credentials (you can delete old ones).

This is where things get difficult. There is no documentation that clearly states what permissions you should add. Here are the permissions I finally went with that allows s3cmd to work:

```
<pre class="brush: plain; title: ; notranslate" title="">
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": ["arn:aws:s3:::[your bucket]/*"]
    },
    {
       "Effect": "Allow",
       "Action": "s3:ListAllMyBuckets",
       "Resource": "*",
       "Condition": {}
    }
  ]
}
```

Please note that these are attached to the user. There are two permissions here. The first one allows the user to do everything inside of that bucket. The other allows the user to list all the buckets.

S3cmd will now work. You tell it to put your files on S3, s3cmd put s3://\[bucket name\]/file\_name. That’s it. My current backups only cost me around $.10 a month. There’s really no reason to not be backing up your server to the cloud.