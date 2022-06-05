---
id: 652
title: 'Paranoid WordPress'
date: '2014-02-09T19:35:05-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=652'
permalink: /2014/02/paranoid-wordpress/
dsq_thread_id:
    - '2311167017'
categories:
    - Tips
---

This is just going to be a quick post.

This blog is hosted on WordPress. I am making this post as I just updated WordPress just the other day. It’s nice to be able to do it right in the admin site. To do this you will need to change the file permissions of the WordPress install. Many times in the forum any questions regarding file permissions will have some responses to set the folders to 755 or even worse 777 with the webserver user being the owner. This will allow the person who has taken over your site to do whatever they want inside your wordpress install.

If you have ssh access to your site you can create a little script which will allow you to switch back and forth easily. First set the owner of all the files to some user who has no access. Then make www-data (or whatever your webserver user is) the group. Then change the permissions to 640 or 644 on all the folders. I even do this on my uploads folder, so I have to run this script every time I add any media. The webserver user will only have read access, so if you are compromised they should not be able to add/edit anything on your server. You can then use these two scripts:

site-upgrade

```
<pre class="brush: bash; title: ; notranslate" title="">
sudo chown -R www-data:www-data /www/wordpress/ #where ever wordpress is
```

site-normal

```
<pre class="brush: bash; title: ; notranslate" title="">
sudo chown -R user:www-data /www/wordpress/ #set it back to the original user
```

What’s nice about this is that you just change the owner. Run site-upgrade, upgrade the site, upgrade your plugins, and then run site-normal. It is one extra step, but it gives peace of mind to any paranoid WordPress admins.