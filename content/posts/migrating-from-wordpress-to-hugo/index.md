---
title: "Migrating From Wordpress to Hugo"
date: 2022-06-06T21:26:36-04:00
author: "Joshua Johanan"
layout: post
image: DALL-E_hugo.webp
imageAlt: DALL-E created image showing Hugo on a hill
---

I recently migrated this site from Wordpress to Hugo. The site had been on Wordpress since 2011. I had wanted to do something different than Wordpress for a few years, but I never knew what I would migrate to. I looked into static site generators which lead me to [Hugo](https://gohugo.io/). Wordpress made starting a blog easy. I definitely would recommend it to anyone that wants to write their thoughts down, provided that it is through one of the many hosted Wordpress sites. You will trade website performance for easy of use. Once you start taking on any of the technical aspects of a site, switch to Hugo.

## Why I migrated from Wordpress to Hugo

1. Control of output. You can easily trace back every character of HTML to its source.
2. Content experience. I feel very comfortable creating, editing, and tracking text files through git.
3. No complex server setup or mangement. Static files can be hosted anywhere at scale.

The number one reason I choose Hugo was control. I have complete control over every single character of HTML of my site. I always was worried about the amount of extraneous HTML and JavaScript that would be output with every single page in Wordpress. With Hugo, nothing is added to the page unless you have added it.

### Control
Page speed is ultimately why I wanted the control. I have made multiple posts about the *correct* way to run Wordpress. Which meant running Wordpress behind a reverse memory cache, ie Varnish. Unless you use a cache and/or a CDN that caches HTML, Wordpress is not a performant server. That's not to say Wordpress can't be performant, it just needs more than Wordpress. Website performance matters and Wordpress needs plugins, configurations, backend setups, and caching just to be acceptable.

Wordpress plugins are an extension of the problem I have with Wordpress. Plugins are amazing and allow you to add an incredible amount of functionality to a site. The downside is that unless you are ready to learn and write a Wordpress plugin, you don't have any idea of what you have added to the output of your site. I personally was using a plugin named Asset Clean Up to help clean out CSS and JavaScript that I didn't need. It's a great plugin, but the fact I needed to run it is at the core of the problem. Wordpress needs plugins like Asset Clean Up to fix what other plugins and Wordpress itself is injecting into the site.

### Content Experience
My day job is building software. Handling and managing a repository of text files is very comfortable for me. I can just focus on the content. Create a file, write some markdown, add some front matter, and then commit. It removes hurdles and makes it easy to publish content. Hugo brings the same value. 

### No Servers
Static sites are a solved problem. They can easily scale beyond anything that my blog would need. The site is just files. No more server setup. No more tweaking configuration files. No more setting up the environment. Hugo built sites can be [deployed](https://gohugo.io/hosting-and-deployment/) many ways. I personally chose [render](https://render.com/) and I had the site up in minutes after creating an account.

I am incredibly excited to not have to manage the server, containers, and certs.

### Why Hugo may not be for you
1. Wordpress is easy to use.
1. The Wordpress ecosystem is vast.

Hugo requires more technical skill than Wordpress. Fully utilizing the power of Hugo requires understanding Hugo itself, web development, and Go templating. Converserly Wordpress(hosted) only requires a browser. Which leads to the next point.

Extending Hugo will require you to add files to the theme yourself. Everything Hugo serves is due to a specific template. Wordpress has plugins for literally anything you could need. This is not even taking into account the thousands of themes available for Wordpress.

### Hugo probably is for You
All that being said, Hugo is probably still for you. Hugo will do 97% of what you need out of the box along with a feature rich theme. There is an initial technical hurdle to get over vs Wordpress. I personally would not recommend anyone to use Wordpress for anything. Any use case that doesn't need a full backend is completely covered with Hugo. If your site needs a backend there a dozen backends that would be a better choice than Wordpress. 

A final thing to keep in mind is that Hugo sites do not need to just stay simple, there are some complex sites built fully in Hugo.

## How I migrated from Wordpress to Hugo
Here are the actions I took to move all my content, 11 years and 83 posts, to Hugo. This is specific to my instance, but I am hoping that something here could help someone else down the line.

### Export the Content
I used the plugin [Wordpress to Jekyll exporter](https://wordpress.org/plugins/jekyll-exporter/). Hugo has an exporter on their [migration page](https://gohugo.io/tools/migrations/), but I could not get it to work. The Hugo exporter would throw some errors and I have no idea where those errors went. I personally chalked that up to PHP and I didn't want to go down the rabbit hole of trying to figure out where PHP errors go to die. Anyways, we just need the site as a bunch of markdown files.

I did run into some issues with the Jekyll exporter. The exporter could not build the zip file. Here is what I did to get everything to work.

The site is completely built using [docker containers](https://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/), so first get into the correct container.
```shell
docker exec -it container_hash /bin/bash
```

The error that was stopping the export from running was that it was missing the zip library. First we must install `libzip-dev` so we can install the php module.
```shell
apt install libzip-dev
```

We can now install the zip PHP module. The official PHP Docker container has a command that we can run in the running container. Of course, if this is something that is required then it should be put in the Dockerfile. In this case it isn't important as the goal is to not need PHP or Wordpress after exporting. The official PHP container has a great README: https://hub.docker.com/_/php/.

```shell
docker-php-ext-install zip
```

Finally, to make everything work as needed we will need to install WP-CLI. 
```shell
curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
php wp-cli.phar jekyll-export > export.zip
cp export.zip ../../uploads
# download the file in the browser
rm ../../uploads/export.zip
```

### Hugo and Deployment
We are ready for Hugo. Create a new site in Hugo: `hugo new site`. We can now add our content. Unzip the files and place them in our site. The next step is the most difficult and time consuming. Working through all the files and making sure that they render how we want in Hugo. Most likely there are a few tweaks to make for each post. Some pages will almost need to be rewritten depending on how complex the pages were.

Finally we can deploy the site. Hugo has directions to deploy to [Render](https://gohugo.io/hosting-and-deployment/hosting-on-render/). Essentially it is 2 steps, 1. Repo on Github or Gitlab and 2. On commit run `hugo --gc --minify`