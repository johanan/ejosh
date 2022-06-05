---
id: 1036
title: 'How to link Docker containers together'
date: '2015-09-30T21:46:51-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=1036'
permalink: /2015/09/how-to-link-docker-containers-together/
dsq_thread_id:
    - '4182134375'
image: /wp-content/uploads/2015/04/docker.png
categories:
    - Docker
tags:
    - Ansible
    - docker
---

This is the third post in a series about moving my WordPress blog into the cloud using Docker.

<div class="action-button">[Download](https://github.com/johanan/Ansible-and-Docker) the src(github).</div>#### Blog Post Series

<div class="action-button">[Ansible for Server Provisioning](https://ejosh.co/de/2015/05/ansible-for-server-provisioning/)</div><div class="action-button">[WordPress and Docker the correct way](https://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/)</div><div class="action-button">[How to link Docker containers together](https://ejosh.co/de/2015/09/how-to-link-docker-containers-together/)</div>At this point we have a bunch of docker images, but no docker containers running. We will fix that in this post. We will look at [docker-compose](https://docs.docker.com/compose/) and how it orchestrates bringing up all of our docker containers. Then we will look at some administrative tasks in docker. This includes backing up the site and keeping logs.

## Bringing up Docker containers with docker-compose

[Docker-compose](https://docs.docker.com/compose/) is a tool from Docker that allows us to define how each container will fit in our application. It makes for a single command to get everything up and running. Docker-compose should already be installed on our target machine by Ansible. First thing we will do is look at our `docker-compose.yml` which configures everything.

```
<pre class="brush: plain; title: ; notranslate" title="">
mysql:
  build: ./mysql
  environment:
    - MYSQL_ROOT_PASSWORD={{ lookup('env', 'MYSQL_ROOT_PASSWORD') }}
    - MYSQL_USER={{ lookup('env', 'MYSQL_USER') }}
    - MYSQL_PASSWORD={{ lookup('env', 'MYSQL_PASSWORD') }}
    - MYSQL_DATABASE={{ lookup('env', 'MYSQL_DATABASE') }}
  mem_limit: 128m

data:
  image: debian:wheezy
  volumes:
    - /var/www/html/:/var/www/html/

php:
  build: ./php
  volumes_from:
    - data
  links:
    - mysql:db

backend:
  build: ./backend
  volumes_from:
    - data
  links:
    - php:php
  ports:
    - "8000:80"

varnish:
  build: ./varnish
  environment:
    CACHE_SIZE: 64m
  ports:
    - "8001:80"
  links:
    - backend:backend

frontnginx:
  build: ./frontnginx
  ports:
    - "443:443"
    - "80:80"
  links:
    - varnish:varnish
```

This may look a little weird as it is a template for Ansible. When Ansible copies this over it will look into the client environment to find all the MySQL variables needed. We should have an environment file that is not checked into git that has these values. Remember that the actual MySQL user and password really do not matter. In fact they could be randomly created before each run. If we need to change the password we just restart the MySQL container and everything is ready to go.

Let’s look at each section. The first is MySQL. docker-compose.yml will be at the root of all of our folders that contain Dockerfiles. Each of these folders will be named after the Docker container we want to build. [![Directory listing of Docker containers folders](http://ejosh.co/de/wp-content/uploads/2015/09/directory_list.png)](https://ejosh.co/de/2015/09/how-to-link-docker-containers-together/directory_list/#main)

### The containers

We are going to build the MySQL container based on the Dockerfile in the mysql directory. The Dockerfile is pretty basic and we will not cover it in depth as all the Dockerfiles were covered in the [previous post](https://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/) in this series.

It will then load all of its runtime information from the environment. We could create a completely random username, password, and database and everything would work how we expect.

Next is the data container that will hold all of the site’s data. It will then share that data through a volume to both the backend Nginx container and the PHP container. This container will not actually run. This is a really cool feature of Docker that is sometimes ignored. Volumes will stick around until all the containers that are using them are destroyed. This container shares a volume with two other containers, so the volume will be available as long as we have not destroyed the other containers.

Now we have the PHP container. It will use the data from our data container. Also the mysql container will be linked as ‘db’. This is important because it will create environment variables inside the container that allow us to configure WordPress on the fly. The first set of variables created will map to the IP address of the mysql container. For example the variable `DB_PORT_3306_TCP_ADDR` will contain the IP address of the container. Next the PHP container will also get all the environment variables of the linked container. This includes the username, password, and database values. We can use `DB_ENV_MYSQL_USER` and `DB_ENV_MYSQL_PASSWORD` to get the username and password. These variables are needed because we configure WordPress to connect to the database using these values.

We can now define our backend origin server. This will use the same data as the PHP container. This is very important because of how PHP-FPM works. Nginx will send a full PHP path that must exist for it to be processed. Because both containers share the same volume it is literally the same data, even though these are different containers. We will map the port 8000 to the container’s port of 80. This means that we can circumvent the varnish container to directly view the response.

Next we bring up a varnish container. It has a link to the backend Nginx server. Finally the varnish container is connected to the frontend Nginx server that is running as a reverse proxy. The frontend container is the actual public listening interface. It terminates SSL and can route traffic to different containers based on hostname if needed. This is a solid setup from front to back for running WordPress.

### Bringing the containers up

The docker-compose.yml file is a definition of which containers and how they work together. This is great as it makes building, removing, and bringing up these containers scriptable and repeatable. In our Ansible directory we have a directory named tasks. An Ansible task is similar to a role except it only has commands. One of the tasks is `docker_compose_rebuild.yml`. Here is the file:

```
<pre class="brush: plain; title: ; notranslate" title="">
---
  - name: Stop {{ service }}
    command: chdir={{ work_dir }} docker-compose stop {{ service }}

  - name: Remove {{ service }}
    command: chdir={{ work_dir }} docker-compose rm --force {{ service }}

  - name: Build {{ service }}
    command: chdir={{ work_dir }} docker-compose build {{ service }}
```

It runs three docker-compose commands. This task is executed by the `build_wp.yml` playbook for each container we defined in the `docker-compose.yml`. This means it will run for mysql, php, backend, varnish, and frontnginx. First it will make sure that all containers for that service are stopped. It will then remove the container. Finally it will build the container again.

The order of the tasks are important as it will ensure any changes to a container are picked up. If you stop a container and restart it, the container will pick up where it left off. We must remove the container and rebuild it to avoid this. I also feel like this emphasizes the point that any specific Docker container should be viewed as disposable. If your container changes, destroy it and rebuild it. Do not enter back into the container and make changes. This is a Docker anti-pattern. If there is an issue and you fix it by changing the container, how do you replicate that? Iterate by recreating containers.

There is one final command for docker-compose. It is near the end of `build-wp.yml`. Here is the Ansible command: `chdir={{ work_dir }} docker-compose up -d --no-recreate`. This tells docker-compose to bring up all of our containers according to our docker-compose.yml file. The `-d` runs everything in detached mode and `--no-recreate` makes sure that containers are not rebuilt. Not recreating the containers is important as without it we would get containers that are not linked correctly. Our setup is dependent on only one of each container being up and linked together. Recreating containers could mess this up.

In the simplest case it will create a new container for each as none of them exist yet. But we may only want to replace one container. A great example of this is the frontend container. We only want to stop, remove, and rebuild that container while leaving everything else up. Specifying no recreate allows us to remove one container from the chain and rebuild it. It should be noted that if you have to rebuild multiple containers, they should be stopped and removed from the front to back. The front would be frontend and the back being mysql.

At this point we should have a working copy of our WordPress.

## Managing our Docker containers

We now will look at some administrative tasks. The tasks are more difficult because they have to be done inside of Docker containers. The tasks are rotating logs and backing up our data.

### Rotating logs

We will use logrotate to rotate our Docker logs. No one would have guessed! We use Ansible to copy our logrotate configuration file to `/etc/logrotate.d/docker`. Here is the Ansible task:

```
<pre class="brush: plain; title: ; notranslate" title="">
  - name: create the logrotate conf for docker
    copy: src=logrotate_docker dest=/etc/logrotate.d/docker
```

Here is the file logrotate-docker:

```
<pre class="brush: plain; title: ; notranslate" title="">
/var/lib/docker/containers/*/*-json.log {
  size 5120k
  rotate 5
  copytruncate
}
```

This will find all the log files that Docker is making for each container. It will then keep five copies of the logs. The most important option here is copytruncate. Without copytruncate Docker would lose its handle on the log file.

I would like to note that with Docker [log drivers](https://docs.docker.com/reference/logging/overview/) there are much more options for logging than just a json file. For example you can send the logs to syslog without a bunch of workarounds inside of the container. Our setup would work great with log drivers because we are currently logging to STDOUT and STDERR.

### Backing up data inside a Docker container

We will look at how to get a backup of the database and our site’s directory out of the container. Technically our data is on the host, but I want to show ways of getting data out of containers. Here is the backup script that is copied to the host:

```
<pre class="brush: bash; title: ; notranslate" title="">
#!/bin/bash
WEEK=$((($(date +%e)-1)/7+1))
docker exec -t blog_mysql_1 /backup.sh > /tmp/wp_backup.sql && tar -zcvf /tmp/wp_backup$WEEK.sql.tar.gz /tmp/wp_backup.sql
docker run --rm --volumes-from blog_php_1 -v /tmp:/backup debian:jessie tar -zcvf /backup/ejosh_site.bak.tar.gz /var/www/html/ejosh/

s3cmd put /tmp/wp_backup$WEEK.sql.tar.gz s3://s3-bucket/weekly/wp_backup$WEEK.sql.tar.gz && rm /tmp/wp_backup$WEEK.sql.tar.gz
s3cmd put /tmp/ejosh_site.bak.tar.gz s3://s3-bucket/weekly/ejosh_site$WEEK.bak.tar.gz && rm /tmp/ejosh_site.bak.tar.gz
```

The first line gets the week of the month (1-5) as I only run weekly backups (if I wrote more posts I would backup even more). The next line executes a shell script that we have already on the MySQL container. We are using the name of the container that docker-compose gives it. Our setup is designed to only run one MySQL server, so this name should always be correct. We then write that to a file in the tmp directory and tar it up.

The first step demonstrates that we can enter a running docker container, execute a command, and have it output to STDOUT. The output of our backup command is just a standard `mysqldump`. This command runs in the context of the container, so we do not have to pass it a username, password, or even a database as that is all set on the server. If you remember from the previous post we populate the database with an SQL dump. This means that once we have a backup, we can rebuild MySQL from scratch at any time. The container is completely disposable. I mean it still needs to be running at any point in time, but any specific container is not important.

Next we want a backup of all the files for our blog. We do this by creating a new container on the fly. This container will use `debian:jessie` as the base container. This is great because we should already have this container downloaded as it is used for all our other containers. This container will remove itself once it is done because of the `--rm` option. This container needs access to our files, so we add the volumes from our PHP container. In addition to this we add one more volume that is mapped to the tmp directory. We tar up our site directory. This will put it in our tmp directory on the host.

The final step is to move the backups into the cloud. This uses the tool [s3cmd](http://s3tools.org/s3cmd). We used Ansible to upload the .s3cfg which has our S3 credentials. This script is set to run weekly so we will always have 4-5 weeks of backups always ready.

The two files this backup script creates are designed to be used in the build script for the site. This makes it really easy to move the site to another provider or look at an old version of the site locally with vagrant. Each build will almost literally be the same because of Docker.

## Summary

This three part post series covered my journey of moving my site to run on Docker. You will probably not be able to just use my code as is, but hopefully it is instructive of the patterns that are needed. We looked at Ansible and how it easily allows us to set up the host with everything that is needed. Then we covered how to set up Docker containers the correct way. This means that each container is disposable and really easy to recreate. Finally there is this post which covers linking the containers together and some administrative tasks.