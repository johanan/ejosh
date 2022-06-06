---
id: 986
title: 'WordPress and Docker the correct way'
date: '2015-08-30T18:16:54-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=986'
permalink: /2015/08/wordpress-and-docker-the-correct-way/
dsq_thread_id:
    - '4082010535'
image: /wp-content/uploads/2015/04/docker.png
categories:
    - Docker
tags:
    - Ansible
    - docker
---

<div class="action-button">[Download](https://github.com/johanan/Ansible-and-Docker) the src(github).</div>#### Blog Post Series

<div class="action-button">[Ansible for Server Provisioning](https://ejosh.co/de/2015/05/ansible-for-server-provisioning/)</div><div class="action-button">[WordPress and Docker the correct way](https://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/)</div><div class="action-button">[How to link Docker containers together](https://ejosh.co/de/2015/09/how-to-link-docker-containers-together/)</div>

We now have a good foundation to build our WordPress site off of. Docker is installed and ready. We will quickly cover why Docker, some best practices, and finally the actual how of our Docker containers. Much like the previous post, this is not designed to be an introduction to Docker. There are literally thousands of intro to Docker articles and by the time I publish this that number will have doubled. Sign up to any tech newsletter and you will easily see five “Intro to Docker” articles every week. If you want an introduction, go to the official Docker site and you there is an [interactive tutorial](https://www.docker.com/tryit/).

I would also like to point out that if you have followed along or forked my Github repo, you will have a Vagrant machine that has Docker on it by running:

```shell
$ vagrant up
$ ansible-playbook -i ./.vagrant/provisioners/ansible/inventory/vagrant_ansible_inventory ../ansible/docker.yml
```

You can then run `vagrant ssh` and have a completely disposable Docker virtual machine.

## Why Docker

The most honest answer I can give to this is that I needed to upgrade my Linux server. I was running Ubuntu 12.04 which is three years old and one LTS release behind. The server was working and I did not want to setup a new one. I had been using Ansible, so I knew I was going to use that. In fact in the beginning I was just going to create an Ansible playbook to install my WordPress stack. I, of course, had heard about Docker and wanted to build something with it. After reading about Docker I decided it would be the most extensible option.

We will discover why in this post. Docker allows us to easily rethink and rebuild our stack from the ground up. Want Apache instead of nginx? Swap it. New version of nginx? Swap it. MariaDB instead of MySQL? You get the idea. This would be very difficult to do without provisioning a brand new server. We also will have a test site that we can run locally that is almost \*literally\* the exact same as production.

### The CORRECT way to use Docker

There are some strong opinions on how a Docker container should be built. I am in the “As few processes as needed, ideally one process” camp. Doing this comes with difficulties and I will list out the issues and what we can do about the issues.

First we will look at what Docker has to say about containers. Docker themselves recommend only running one process per container.

> In almost all cases, you should only run a single process in a single container. Decoupling applications into multiple containers makes it much easier to scale horizontally and reuse containers. If that service depends on another service, make use of container linking.
> 
> [Best practices for writing Dockerfiles](https://docs.docker.com/articles/dockerfile_best-practices/)

Next, please read [If you run SSHD in your Docker containers, you’re doing it wrong!](http://jpetazzo.github.io/2014/06/23/docker-ssh-considered-evil/). The article is a little dated, but the sentiment is still valid. It is written by Jérôme Petazzoni, who works for Docker and has the title Tinkerer Extraordinaire. I completely agree with this. There is not a reason to SSH into a container.

If you have the opposite view of this, you may actually just need disposable hosts that are under configuration management. By the time you have setup all the things you expect in a system, why not just spin up another instance on EC2 and set it up with Ansible?

Here are some objections and why they don’t matter (these are similar objections to the ones listed in Jérôme’s post).

#### Backup data?

There are a couple of ways. The first is to mount the data in a volume from the host and run the backup from the host. The other is to fire up a container that shares volumes and backups the data. We will cover the latter in this post.

#### Logging

If we truly only have one process running this makes logging much easier. Log to STDOUT and STDERR. Docker will collect all the logs for a container that is built this way. The logs are then ready to be logrotated or more. We can use something like [Fluentd](http://www.fluentd.org/) to collect all the logs across many hosts. The more processes that run per container, the harder this becomes.

You can also use log drivers as of Docker 1.7 which make logging to syslog incredibly simple.

#### Getting into my container

Use Docker [exec](https://docs.docker.com/reference/commandline/cli/#exec). Exec was designed to allow you to enter a running container. It is as easy as: `docker exec -it <em>container</em> bash`. After running that command you will be in your container.

#### Edit my configuration?

You can either enter your container and edit the config, mount the config file in a volume, or change your configuration and rebuild the container. I have found using a volume great for making many major configuration changes.

#### Debugging

Enter the container and run any debug tools. One of the containers I am using is varnish. When troubleshooting the configuration I would jump in the container and run `varnishlog`.

#### Updating a dependency

Rebuild the container. Each container should be viewed as ephemeral. If the container currently does not have the correct versions of dependencies, update the Dockerfile and rebuild.

Let us now look at actually building Docker containers.

## My Docker setup

We will have quite a few containers because we are trying to run only one process per container. I think the best way to convey this is in an image.

[![Graphic of all the docker containers.](http://ejosh.co/de/wp-content/uploads/2015/05/Wordpress-Docker-1.png)](http://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/wordpress-docker-1/#main)

As we can see there are six separate containers. We will use [docker-compose](https://docs.docker.com/compose/) to link all the containers together. Almost all of these containers are built from the official containers with very small additions, so we do not need to create our own repository.

First we will look at how each container is built and then how to link them together.

### Docker Containers

We will look at the Dockerfiles for each container and the files that are referenced. Most of these are simple in that they reference an official image and then just add configuration.

#### MySQL

This is based on the official [MySQL container](https://registry.hub.docker.com/_/mysql/). We are going to create a new database and user each time it is launched by setting the environment variables, `MYSQL_DATABASE` and `MYSQL_USER` respectively. Then we will copy in a backup of the database and load it into the new database. We will now look at all the files required.

Here is the Dockerfile

```dockerfile
FROM mysql:5.6

COPY wp_backup.sql /tmp/
COPY load_db.sh /
COPY backup.sh /
```

This makes sure we have our database backup in the container, `load_db.sh` to load the backup, and `backup.sh` to create more backups.

Here is load\_db.sh

```bash
#!/bin/bash
echo "use $MYSQL_DATABASE;" | cat - /tmp/wp_backup.sql > temp && mv temp /tmp/wp_backup.sql
mysql -uroot -p$MYSQL_ROOT_PASSWORD < /tmp/wp_backup.sql && rm /tmp/wp_backup.sql
```

This file creates a use statement at the top of the backup, so it will have the correct database at runtime. It will then import everything in the backup back into this database.

Here is backup.sh

```bash
#!/bin/bash
MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysqldump -hlocalhost -uroot $MYSQL_DATABASE
```

Simple one-liner. Dump the database that we set with `$MYSQL_DATABASE` using the root password at `$MYSQL_ROOT_PASSWORD`.

#### Data container

This container does not have a Dockerfile. Its only purpose is to have a spot where data can be shared between containers. The data we are going to share is the WordPress install. This has all the HTML and PHP that runs the site. The PHP container and backend Nginx container will both have access. What is great about this is that for each of these containers the files will be in the same place. This is very import when running PHP as a service for Nginx. We will see how this is done when we cover docker-compose.

The only thing we really need to cover here is the changes to `wp-config.php` in the WordPress install. This process is dependent on WordPress already being installed. We will make WordPress look to the environment to get its connection information. Here are the changes to `wp-config.php`.

```php
/** The name of the database for WordPress */
define('DB_NAME', getenv('DB_ENV_MYSQL_DATABASE'));

/** MySQL database username */
define('DB_USER', getenv('DB_ENV_MYSQL_USER'));

/** MySQL database password */
define('DB_PASSWORD', getenv('DB_ENV_MYSQL_PASSWORD'));

/** MySQL hostname */
define('DB_HOST', getenv('DB_PORT_3306_TCP_ADDR'));
```

Here we are just telling WordPress that all the connection information is in the environment. How does it get in the environment? The next container will show us.

#### PHP

This container will be the process that actually runs PHP. We will use PHP-fpm and set it to listen on a port. The requests will come in from Nginx and this will send back the output of the process. Let’s look at all the files needed.

Dockerfile

```dockerfile
FROM debian:jessie

RUN apt-get update && \
    apt-get install -y php5-fpm php5-mysql php5-memcache php5-curl memcached supervisor

COPY www.conf /etc/php5/fpm/pool.d/
COPY supervisord.conf /etc/supervisor/conf.d/
COPY php.ini /etc/php5/fpm/php.ini
COPY php-fpm.conf /etc/php5/fpm/php-fpm.conf

VOLUME /var/www/html

EXPOSE 9000
CMD ["/usr/bin/supervisord"]
```

We are using Debian as the base. We install all the needed php5 packages along with memcached and supervisor. This means we are going to break our one process per container rule here. Next we copy in the config files we need to have PHP work correctly. Then we let the container know that our path `/var/www/html` will be set up as a volume, which will come from our data container. Finally expose port 9000 and run supervisord, which will track our multiple processes for us.

For the next few files I will highlight the differences between the default files and what is in the repo.

www.conf

```php
...
listen = 9000
...
env[DB_PORT_3306_TCP_ADDR] = $DB_PORT_3306_TCP_ADDR
env[DB_ENV_MYSQL_USER] = $DB_ENV_MYSQL_USER
env[DB_ENV_MYSQL_DATABASE] = $DB_ENV_MYSQL_DATABASE
env[DB_ENV_MYSQL_PASSWORD] = $DB_ENV_MYSQL_PASSWORD
...
php_flag[display_errors] = off
php_admin_value[error_log] = /dev/stderr
```

Listen should be explanatory. Then we are filling the environment for PHP with connection information to our database. These will be created by docker when we link our MySQL container to this container. We can randomly assign a user, password and database and this will all work as expected. Finally we make sure errors do not display and log to `stderr` so docker can log them.

php-fpm.conf

```text
...
error_log = /dev/stderr
```

Make sure that logging goes to `stderr` for docker.

supvisord.conf

```text
[supervisord]
nodaemon=true

[program:php5-fpm]
command=php5-fpm -F -c /etc/php5/fpm/
redirect_stderr=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:memcached]
command=memcached -m 64 -u nobody -p 11211 -l 127.0.0.1
redirect_stderr=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
```

Supvisord allows us to run multiple processes in one container without a lot of overhead. Here we are not running supervisord as a daemon. We need the main supervisord process to not fork. This is important as docker only tracks one process. In this container that will be supervisord. Supervisord will then kick off php5-fpm redirecting stdout and stderr. This will allow docker to log everything coming from PHP. Next we run memcache. This is an ease of use decision. Running memcache locally makes it very easing to setup caching with [W3 Total Cache](https://wordpress.org/plugins/w3-total-cache/). If you needed to share this cache then it would make sense to put it in its own container. Here we just want the cache for PHP.

As I mentioned before this does break my rule about only one process per container. I will admit that this is not a good reason as to why I broke the rule. There are other much better reasons. For example using a service discovery tool like Consul or Serf. This allows a container to be created and then notify the other containers what services that container has. This makes a lot of sense to run that process in the container along with the serving process (MySQL, nginx, etc). I would say that if you find your self running more than 2-3 processes then you should probably split that container up into separate containers.

#### Backend Nginx

We are running two Nginx servers in this chain. The backend container will be the origin server for WordPress. It will serve any files from our data container and send any PHP files to be processed by the PHP container. Here are the files to make this work.

Dockerfile

```dockerfile
FROM nginx:1.9

COPY default.templ /etc/nginx/conf.d/default.templ
COPY start-nginx.sh /start-nginx.sh
COPY nginx.conf /etc/nginx/nginx.conf
COPY site-normal /site-normal
COPY site-upgrade /site-upgrade

VOLUME /var/www/html

CMD ["/start-nginx.sh"]
```

Hopefully this is very clear what this file is doing. We start from the official Nginx container (based of off Debian, so it is only downloaded once!). Then we just copy the config files that are needed. That’s it.

default.templ

```text
server {
  listen 80 default_server;
  listen [::]:80 default_server ipv6only=on;

  root /var/www/html/ejosh;
  index index.php index.html index.htm;

  #server_name localhost;

	location @de {
		rewrite ^/de(.*) /de/index.php?q=$1;
	}

  location /de/ {
    try_files $uri $uri/ @de;
  }

  error_page 404 /404.html;

  error_page 500 502 503 504 /50x.html;
  location = /50x.html {
          root /usr/share/nginx/html;
  }

  location ~ \.php$ {
          try_files $uri =404;
          include fastcgi_params;
          fastcgi_split_path_info ^(.+\.php)(/.+)$;
          fastcgi_pass ${PHP_PORT_9000_TCP_ADDR}:9000;
          fastcgi_index index.php;
          fastcgi_param SCRIPT_FILENAME $document_root/$fastcgi_script_name;
  }
}
```

This file is the actual config for the site. There are a few things that you may need to modify as this is very specific to my site. The root directive and location /de/ directive are a few. The php handling you can keep. We are putting in a variable here, `${PHP_PORT_9000_TCP_ADDR}`, that will have to be swapped out for the real value. We will do that in `start-nginx.sh`.

The nginx.conf file is very straight forward. In fact you should be able to just use the one in the container. I am just being explicit by making sure the container uses mine.

start-nginx.sh

```bash
#!/bin/bash

for name in PHP_PORT_9000_TCP_ADDR
do
	eval value=\$$name
	sed "s|\${${name}}|${value}|g" /etc/nginx/conf.d/default.templ > /etc/nginx/conf.d/default.conf
done

nginx -g 'daemon off;'
```

This takes a environment variable loads the value of it and then replaces any reference to it in default.templ creating default.conf. It then starts nginx making sure it does not run in daemon mode. Previously I was modifying the conf file in place, but this is better if you have to restart the docker containers as the conf will update to any changes in the environment.

site-normal and site-upgrade respectively.

```bash
#!/bin/bash
chown -R root:www-data /var/www/html/ejosh/
```

```bash
#!/bin/bash
chown -R www-data:www-data /var/www/html/ejosh/
```

These scripts change the owner of the website’s root directory. site-normal makes it so that the webserver cannot modify any files at all. When I upgrade or even add photos I need to run site-upgrade to give write permissions. I then change it back to normal.

#### Varnish

Varnish is a caching HTTP reverse proxy. It will look at requests and return cached copies of the responses if they exist. This means that WordPress does not even have to get involved for most requests. This is a huge speed increase. Here are some results from my blog using Blitz.io.

[![Lots of Errors!](http://ejosh.co/de/wp-content/uploads/2015/08/Without_varnish.png)](http://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/without_varnish/#main)

At about 40 seconds into the test the site just quit working. That is where the 35% error rate comes from. The response time is misleading as the server did not respond which brought this value down.

[![Not so many errors](http://ejosh.co/de/wp-content/uploads/2015/08/With_varnish.png)](http://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/with_varnish/#main)

The site was able to handle the load as every request after the first were just cache calls. Let’s look at the setup for this.

Dockerfile

```dockerfile
FROM debian:jessie

RUN apt-get update && \
  apt-get install -y apt-transport-https && \
  apt-get install -y curl && \
  curl https://repo.varnish-cache.org/GPG-key.txt | apt-key add - && \
  echo "deb https://repo.varnish-cache.org/debian/ jessie varnish-4.0" >> /etc/apt/sources.list.d/varnish-cache.list && \
  apt-get update && \
  apt-get install -y varnish

COPY start-varnish.sh /start-varnish.sh
COPY default.templ /etc/varnish/default.templ

ENV CACHE_SIZE=128m

EXPOSE 80

CMD ["/start-varnish.sh"]
```

This starts with plain old Debian and installs varnish. It then pulls in the config and starts it up.

I am not going to show the entire default.templ file as it is large and most of it is not related to what we are doing with Docker. It is, for the most part, a common varnish config for WordPress. WordPress needs a complicated config file as it is a dynamic application. Certain things we will want to cache and others we will not. You can view the file in [github](https://github.com/johanan/Ansible-and-Docker/blob/master/docker/varnish/default.templ). Here is just the docker related portion.

```text
...
backend default {
    .host = "${BACKEND_PORT_80_TCP_ADDR}";
    .port = "80";
    .connect_timeout = 600s;
    .first_byte_timeout = 600s;
    .between_bytes_timeout = 600s;
    .max_connections = 800;
}

# Only allow purging from specific IPs
acl purge {
    "localhost";
    "${BACKEND_PORT_80_TCP_ADDR}";
}
...
```

Here we are setting our backend Nginx server as the backend default. This is the content that Varnish will cache. It also sets the server as the only IP address along with localhost that can purge the cache.

start-varnish.sh

```bash
#!/bin/bash

for name in BACKEND_PORT_80_TCP_ADDR
do
	eval value=\$$name
	sed "s|\${${name}}|${value}|g" /etc/varnish/default.templ > /etc/varnish/default.vcl
done

varnishd -F -f /etc/varnish/default.vcl -s malloc,$CACHE_SIZE -a 0.0.0.0:80
```

This script is doing exactly what the backend Nginx script was doing. Replace values in the config template and start the server to run in the foreground. The size of the cache is set in the Dockerfile from the environment. All we have to do is change that value and restart.

#### Frontend Nginx

This container is going to be the actual container that serves the Internet. Having an Nginx container up front allows us to do a lot of great things. These include, but are not limited to, terminate SSL (important as Varnish does not do SSL), load balance, set up other sites, and gzip all the responses.

Dockerfile

```dockerfile
FROM nginx:1.9

COPY nginx.crt /etc/nginx/ssl/nginx.crt
COPY nginx.key /etc/nginx/ssl/nginx.key
COPY default.templ /etc/nginx/conf.d/default.templ
COPY start-nginx.sh /start-nginx.sh
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/start-nginx.sh"]
```

We are keeping it simple. Use Nginx, copy our config, and start it up.

We are going to have three different server blocks in our default.templ. The first is to terminate SSL for the blog. I currently am only running a self-signed certificate which I only use when logging in. My plan is to add a trusted certificate at some point. Second we listen on port 80 for the blog. The third we listen over SSL for anything to cadvisor.ejosh.co. We will cover cadvisor later.

Here are the lines that are docker related in default.templ.

```text
server {
        ...
	location / {
		proxy_pass http://${VARNISH_PORT_80_TCP_ADDR}:80;
		...
	}
}

server {
	listen 80 default_server;

	location / {
		proxy_pass http://${VARNISH_PORT_80_TCP_ADDR}:80;
		...
	}
}

server {
	...
	location / {
		proxy_pass http://${CADVISOR_PORT_8080_TCP_ADDR}:8080;
		...
	}
}
```

We are just proxying the requests to the other containers.

nginx.conf is a basic Nginx config file. There is nothing new or interesting there. We will finish off looking at start-nginx.sh.

```bash
#!/bin/bash

cp /etc/nginx/conf.d/default.templ /etc/nginx/conf.d/default.conf

for name in VARNISH_PORT_80_TCP_ADDR CADVISOR_PORT_8080_TCP_ADDR
do
	eval value=\$$name
	sed -i "s|\${${name}}|${value}|g" /etc/nginx/conf.d/default.conf
done

nginx -g 'daemon off;'
```

This start up script is a little different than the others. Because there are two different variables to replace we cannot just replace the values. If we did that it would only have the last variable’s value in the config file. We copy the template first and then modify the values in place.

## Summary

This post is getting long so I will stop here. In this post we covered why we used Docker and the correct way to use Docker. Finally we looked at how each docker container will be built. In the next post we will actually bring them all up in the correct order linking them all together.