---
id: 1098
title: 'WordPress Docker containers'
date: '2015-10-28T18:42:00-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'https://ejosh.co/de/?p=1098'
permalink: /2015/10/wordpress-docker-containers/
dsq_thread_id:
    - '4269501322'
image: /wp-content/uploads/2015/04/docker.png
categories:
    - Docker
tags:
    - docker
---

This post will cover what each container in our Dockerized WordPress setup does. This should not be viewed as a standalone post as there is a video playlist that covers more. The playlist demonstrates how you can quickly and easily bring up a Dockerized WordPress install.

First we will start with an image that will explain so much with so little.

[![Shows how each container links to the others](https://ejosh.co/de/wp-content/uploads/2015/10/Dockerized_Wordpress.png)](https://ejosh.co/de/2015/10/wordpress-docker-containers/dockerized_wordpress/#main)

Yes, there are six different containers. This is so that we can keep each container with a single purpose and even a single process in most cases. We can easily replace and upgrade each container this way. I have blogged on this [previously](https://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/) and will not iterate everything here. We will look at each container and any interesting things about each. Let’s get started.

## MySQL container

This, of course, is running MySQL. It is not complex as we use the [official MySQL Docker image](https://hub.docker.com/_/mysql/) to start from. We then copy two shell scripts to load a database and backup up a database. The docker-compose section sets some environment variables which will create users and databases (this functionality is from the official MySQL Docker image). Here are the `Dockerfile` and docker-compose (remember that this will be processed by Ansible) section:

```dockerfile
FROM mysql:5.6

COPY load_db.sh /
COPY backup.sh /
```

```yaml
mysql:
  build: ./mysql
  environment:
    - MYSQL_ROOT_PASSWORD={{ lookup('env', 'MYSQL_ROOT_PASSWORD') }}
    - MYSQL_USER={{ lookup('env', 'MYSQL_USER') }}
    - MYSQL_PASSWORD={{ lookup('env', 'MYSQL_PASSWORD') }}
    - MYSQL_DATABASE={{ lookup('env', 'MYSQL_DATABASE') }}
  mem_limit: 128m
```

## Data container

This is an interesting container. It will not actually run anything. It will just have some directories that it will make available to other containers. Here is a [Medium article](https://medium.com/@ramangupta/why-docker-data-containers-are-good-589b3c6c749e#.any195k51) that walks through why a data container (aka data volume container) is useful. I agree with Raman’s mindset in this quote:

> I finally realized I had to shift my mindset from “this data must logically and physically exist on my host” to “this data logically exists within a data-only container and I (probably) don’t care where it physically exists on my host”

That means that this container is very simple. We copy our WordPress install into the directory where the Dockerfile is and then copy that entire directory into the container. We will see other containers then use the docker command `volumes_from` to get their data from this container. Ultimately this makes the entire docker container stack completely contained in and of itself.

Here is the `Dockerfile` and relevant section of `docker-compose.yml`:

```dockerfile
FROM debian:jessie

COPY '{{ site_name }}' '/var/www/html/{{ site_name }}'

VOLUME /var/www/html/
```

```yaml
data:
  build: ./data
```

## PHP container

This container is running Debian and installs the Debian PHP packages. Debian was chosen as it is the base for all the other containers, so it would not be an extra docker image download. The files that are copied are the configuration files for PHP. `php.ini` and `php-fpm.conf` are pretty much the basic config. `www.conf` is where the environment is setup with the needed variables. Here are the relevant lines;

```php
env[DB_PORT_3306_TCP_ADDR] = $DB_PORT_3306_TCP_ADDR
env[DB_ENV_MYSQL_USER] = $DB_ENV_MYSQL_USER
env[DB_ENV_MYSQL_DATABASE] = $DB_ENV_MYSQL_DATABASE
env[DB_ENV_MYSQL_PASSWORD] = $DB_ENV_MYSQL_PASSWORD
```

Before we look at the `Dockerfile` we will discuss using supervisor in this container. I have this container run php-fpm and memcache at the same time. This was for ease of setting up WordPress caching plugins. Depending on which one is installed and how it is configured this could become a huge mess to automatically determine which plugin is actually being used and setup the plugin. Having memcache run locally allows us to easily connect any caching plugin.

This is one of the containers that uses the data only container. The `volumes_from` command will make all the volumes defined on the data container available to this container. The container also is linked to the MySQL container. This is what makes the connection automatic. In fact it makes it possible to create random connection information.

Here is the `Dockerfile` and relevant section in `docker-compose.yml`:

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

```yaml
php:
  build: ./php
  volumes_from:
    - data
  links:
    - mysql:db
```

## Backend container

This is the origin server. The container runs nginx and is linked to the PHP container. The data for this container is provided by the data only container. This means that both the backend and php container have the same exact view of the data. This is very important as nginx essentially tells php-fpm to process a file with the full path. If the path is different or does not exist this would fail.

This is the first container that uses a template for one of its configuration file. We need this template because we do not know what the IP address of the linked PHP container will be until runtime. Here is the relevant part of `default.templ`:

```conf
  location ~ \.php$ {
          try_files $uri =404;
          include fastcgi_params;
          fastcgi_split_path_info ^(.+\.php)(/.+)$;
          fastcgi_pass ${PHP_PORT_9000_TCP_ADDR}:9000;
          fastcgi_index index.php;
          fastcgi_param SCRIPT_FILENAME $document_root/$fastcgi_script_name;
  }
```

`${PHP_PORT_9000_TCP_ADDR}` will be replaced by the value stored in the environment by the `start-nginx.sh` script. Here is that code.

```shell
#!/bin/bash

for name in PHP_PORT_9000_TCP_ADDR
do
	eval value=\$$name
	sed "s|\${${name}}|${value}|g" /etc/nginx/conf.d/default.templ > /etc/nginx/conf.d/default.conf
done

nginx -g 'daemon off;'
```

The `Dockerfile` copies some utility scripts and configuration files into the official nginx container. Here is the `Dockerfile` and relevant section of `docker-compose.yml`:

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

```yaml
backend:
  build: ./backend
  volumes_from:
    - data
  links:
    - php:php
  ports:
    - "8001:80"
```

## Varnish container

This is another straight forward container. It is based on `debian:jessie`, then install varnish, copies a template file for the configuration, and finally the start script. There is nothing really new here. Here is the `Dockerfile` and relevant section of `docker-compose.yml`:

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

ENV CACHE_SIZE=64m

EXPOSE 80

CMD ["/start-varnish.sh"]
```

```yaml
varnish:
  build: ./varnish
  environment:
    CACHE_SIZE: 64m
  ports:
    - "8000:80"
  links:
    - backend:backend
```

## Frontend container

This is the final container. It is very similar to the backend as it is also an nginx container. This container will terminate SSL (just add your certificates) and proxy all requests to the varnish container. Again there is nothing new here. Here is the `Dockerfile` and relevant section of `docker-compose.yml`:

```dockerfile
FROM nginx:1.9

#add your keys here
#COPY public.crt /etc/nginx/ssl/public.crt
#COPY private.key /etc/nginx/ssl/private.key

COPY default.templ /etc/nginx/conf.d/default.templ
COPY start-nginx.sh /start-nginx.sh
COPY nginx.conf /etc/nginx/nginx.conf

CMD ["/start-nginx.sh"]
```

```yaml
frontend:
  build: ./frontend
  ports:
    - "80:80"
    - "443:443"
  links:
    - varnish:varnish
```

## Summary

Each of the containers are designed to be as simple as possible. For most of the containers they are just the official container with our configurations loaded. Bash scripts are used with templates to set IP addresses at runtime.