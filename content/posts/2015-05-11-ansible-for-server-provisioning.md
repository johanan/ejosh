---
id: 931
title: 'Ansible for Server Provisioning'
date: '2015-05-11T21:30:05-04:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=931'
permalink: /2015/05/ansible-for-server-provisioning/
dsq_thread_id:
    - '3756349900'
image: /wp-content/uploads/2015/04/ansible_logo_black_square.png
categories:
    - Uncategorized
tags:
    - Ansible
    - docker
---

<div class="action-button">[Download](https://github.com/johanan/Ansible-and-Docker) the src(github).</div>#### Blog Post Series

<div class="action-button">[Ansible for Server Provisioning](https://ejosh.co/de/2015/05/ansible-for-server-provisioning/)</div><div class="action-button">[WordPress and Docker the correct way](https://ejosh.co/de/2015/08/wordpress-and-docker-the-correct-way/)</div><div class="action-button">[How to link Docker containers together](https://ejosh.co/de/2015/09/how-to-link-docker-containers-together/)</div>The first thing we are going to cover is Ansible. This is not a “Welcome to Ansible” post. This will be specifically how I used Ansible to deploy my blog using Docker. If Ansible is new to you and would like some introductory material you can watch some [videos](http://www.ansible.com/resources) supplied by Ansible and/or read [this](https://serversforhackers.com/an-ansible-tutorial) short, but thorough walk-through of Ansible.

This post became much longer than I had anticipated. There was going to be a section that covered the changes to WordPress that will make it get its configuration from the environment. That will now be in the next post. This means that you may have issues if you deploy a brand new install of WordPress following this post. It is a [chicken and the egg situation](https://www.youtube.com/watch?v=eNPyY6q4mTA&t=75). Ansible sets up docker, but the changes to WordPress rely on the docker configuration which is not setup yet, so either way steps would be missing. I feel that Ansible is a better starting point.

## Why Ansible

Ansible is just one of many tools in the provisioning space. The other major ones are [Chef](https://www.chef.io/chef/), [Puppet](https://puppetlabs.com/), and [SaltStack](http://saltstack.com/). This is not a comparison of all these technologies. I have chosen Ansible. Here is why.

- Ansible has repeatable builds. Technically this is what all provisioning tools are trying to do. Ansible allows you to define what you need installed or configured. You can run Ansible against a new server and make a multitude of changes or you can run it against a configured server and make no changes. The end state of your server will always be the same.
- Ansible is Python. I like Python. I like Ansible. Coincidence?
- Ansible has no client. Ansible only uses SSH to connect to the clients. You do not need any prebuilt machine images or to install anything on the client.
- Ansible is simple. Ansible is Python, but you do not need to know any Python to use it. Instead you use [YAML](http://yaml.org/). This allows for simple and clear definitions. Here is an example: ```
    <pre class="brush: plain; title: ; notranslate" title="">
    - name: Install ufw
      apt: name=ufw state=present
    ```
    
    This states that the apt package ufw should be present. There is no code parsing to determine what is going to happen. I feel this is the feature that trumps all the others. Ansible is simple so I don’t have to spend a considerable amount of time tweaking my playbooks. This means more time writing code.

That is why I chose Ansible.

## Ansible Roles

We will use Ansible roles to configure our server. Roles allow us to group tasks, files, handlers, variables, and templates that relate to one task. If you have never used an Ansible role before either check out the previously mentioned [article](https://serversforhackers.com/an-ansible-tutorial) or the Ansible documentation on [roles](https://docs.ansible.com/playbooks_roles.html). All of the roles are in repository under [ansible/roles/](https://github.com/johanan/Ansible-and-Docker/tree/master/ansible/roles). Let’s get started on building our roles.

### basic\_server\_setup

This is the first role that should be executed against a new server. It will make sure we have a user, install an SSH public key, setup a firewall, and configure sshd. We want to create a basic foundation for all the other roles. First we will look at the tasks, which is in the file `ansible/roles/basic_server_setup/tasks/main.yml`.

```
<pre class="brush: plain; title: ; notranslate" title="">
---
  - name: Install ufw
    apt: name=ufw state=present

  - name: create a new user
    user: name={{ newuser }}
          state=present
          shell=/bin/bash

  - authorized_key: user="{{ newuser }}"
                    key="{{ lookup('file', ssh_key ) }}"

  - name: Make sure we can sudo
    template: src=newuser_sudoer dest=/etc/sudoers.d/{{ newuser }}_sudoer mode=0440

  - name: Configure ufw
    ufw: rule=allow port=22 proto=tcp

  - name: Default deny
    ufw: state=enabled direction=incoming policy=deny

  - name: Disable root SSH
    copy: src=sshd_config dest=/etc/ssh/sshd_config

  - name: Restart SSH
    service: name=ssh state=restarted enabled=yes
```

First thing we do is make sure ufw is installed through apt. This means this must be run against a Debian based distro (the two most used are Debian and Ubuntu). Then we make sure a user is created. This requires us to set the `newuser` and `ssh_key` variables before running this role (we will cover how this occurs later). `newuser` should be the username of the user we want to create and `ssh_key` is the path to our key. Using variables like this allows us to easily change the user and key without having to write more tasks. Next we use a template to create a file dynamically. Here is the template at `ansible/roles/basic_server_setup/templates/newuser_sudoer`

```
<pre class="brush: plain; title: ; notranslate" title="">
{{ newuser }} ALL=(ALL:ALL) NOPASSWD:ALL
```

The template module allows us to add values into a file. We do not have to reference the full path to the template because Ansible will be able to find it within our role.

The next two tasks just make sure that all ports are denied except for 22. Finally the last two tasks make sshd more secure. The `sshd_config` file that is copied over is basically the default Ubuntu config except for the lines `PermitRootLogin no` and `PasswordAuthentication no`. The final task is to restart ssh.

At this point we have a firewalled server that we can ssh into.

### swap

I am using [Digital Ocean](https://www.digitalocean.com/?refcode=e79d0d2b5fce)(this is a referral link) droplets which do not have swap enable by default. This role ensures that a swap file is created and in use. This is the contents of `ansible/roles/swap/tasks/main.yml`.

```
<pre class="brush: plain; title: ; notranslate" title="">
---
  - name: register swap var
    stat: path=/mnt/swap
    register: swap_file

  - name: create the file to be used for swap
    command: fallocate -l 512M /mnt/swap
    when: swap_file.stat.exists == False

  - name: format the file for swap
    command: mkswap /mnt/swap
    when: swap_file.stat.exists == False

  - name: change swap file permissions
    file: path=/mnt/swap owner=root group=root mode=0600
    when: swap_file.stat.exists == False

  - name: add the file to the system as a swap file
    command: swapon /mnt/swap
    when: swap_file.stat.exists == False
```

The tasks here are conditional. The first task gets the facts about the directory `/mnt/swap`. The rest of the tasks will only run if the directory does not exist. This is a great recipe to use for tasks in Ansible.

### docker

We need to install docker if we want to use it. Here is how to install docker from the file `ansible/roles/docker/tasks/main.yml`

```
<pre class="brush: plain; title: ; notranslate" title="">
---
  - name: Add repo from Docker
    shell: curl -sSL https://get.docker.com/ubuntu/ | sudo sh creates=/usr/bin/docker

  - name: Install docker
    apt: name=lxc-docker update-cache=yes

  - name: get setuptools
    apt: name=python-setuptools state=present

  - name: make sure pip works
    shell: easy_install -U pip creates=/usr/local/bin/pip

  - name: install docker-py
    pip: name=docker-py state=present

  - name: install docker-compose
    pip: name=docker-compose state=present
```

This role installs the latest version of docker from the official docker repository. We do this because the version in the distribution’s repository is an older version and we want the newest. We also install docker-py and docker-compose which are both Python packages. I was having issues with pip from the repository so I used easy\_install.

I do want to highlight the use of `creates` in the first task. This allows us to skip the execution of this step if the file or directory already exists. We do this for pip as well.

### blog\_site

This role is designed to lay the foundation for our docker containers. It is mainly a collection of house keeping tasks for the site, i.e. making sure directories exist, opening ports in the firewall, setting up a backup process, and other tasks. Here is `ansible/roles/blog_site/tasks/main.yml`.

```
<pre class="brush: plain; title: ; notranslate" title="">
---
  - name: Create Docker base directory
    file: path={{ work_dir }} state=directory

  - name: Copy docker-compose file
    template: src=docker-compose.j2 dest={{ work_dir }}/docker-compose.yml

  - name: Setup ufw
    ufw: rule=allow port=80 proto=tcp

  - name: Open up SSL ufw
    ufw: rule=allow port=443 proto=tcp

  - name: create the logrotate conf for docker
    copy: src=logrotate_docker dest=/etc/logrotate.d/docker

  - name: copy the backup script
    copy: src=site-backup dest={{ work_dir }}/site-backup mode=755
    tags:
      - prod

  - name: install s3cmd
    apt: name=s3cmd state=present update_cache=yes
    tags:
      - prod

  - name: install s3cfg
    template: src=s3cfg dest=/root/.s3cfg
    tags:
      - prod

  - name: schedule backup to run weekly
    cron: name="site backup" minute="0" hour="2" weekday="1" job="{{ work_dir }}/site-backup" user="root"
    tags:
      - prod

  - name: Copy over site-upgrade
    copy: src=site-upgrade dest={{ work_dir }}/ mode=755

  - name: Copy over site-normal
    copy: src=site-normal dest={{ work_dir }}/ mode=755
```

There are only a few new things here. The first is tags which we will cover later in this post. Next is the cron module. It does exactly what you think it would do, creates a cron job. The site-backup, site-upgrade, and site-normal scripts that are copied are more closely tied to docker than Ansible so we will cover what those files do in a future post. You can, of course, check them out now in the repository.

### service\_build

The `service_build` role is designed to be reused. We hand it a remote directory(`work_dir`) and a directory from the role(`service`) and it will synchronize everything to the remote server. We are going to build our docker containers on the fly so we need everything moved. This includes our full WordPress install and database backup.

We need all the docker files in the Ansible role, but the docker directory is in the root of the project. To get access for the role we have linked the docker directory in the role as files. I did this because I did not want all the docker files 4+ directories deep.

Here is `ansible/roles/service_build/tasks/main.yml`.

```
<pre class="brush: plain; title: ; notranslate" title="">
---
  - name: Create {{ service }} directory
    file: path={{ work_dir }} state=directory owner=root group=root 

  - name: Load {{ service }}
    synchronize: src={{ service }} dest={{ work_dir }} group=no owner=no rsync_path='sudo rsync'

  - name: Make files executable
    file: path={{ work_dir }}/{{ service }}/{{ item }} mode=755
    with_items:
      - "{{ exec_files }}"
```

We can quickly see that this is primarily built from variables. This creates a directory, synchronizes the files, and makes sure specific files are executable. We don’t worry very much about the permissions here as all of our data should only be writable by root. This even includes our WordPress directory. We will setup a script to make it writable for updates.

There are two notable things in this role, `synchronize` and `with_items`. We are using synchronize because it is much faster to copy large directories over Ansible’s copy module. I really want to highlight the difference in speed here. I was using copy before and it took over 20 minutes (it may be even more as I did not let it finish) to move WordPress. Synchronize will do it in a dozen seconds or so. In addition to this it will also copy permissions. In our example we have the command exclude the owner and group so everything will be root:root.

The last task will make sure that all the files that need to be executable are. We could run into an issue where our docker containers exit for seemingly no reason. That reason could be that we have the docker container trying to execute a file that is not executable. This step ensures that the files we define are executable. We do this by using `with_items`. `with_items` allows us to loop over an array and run a module with each item. When using `with_items` the module will be executed each time replacing the variable `{{ item }}`.

## Tasks

Tasks is another way we can use Ansible to create reusable actions. Tasks are essentially a role that only executes tasks. If you find yourself with a role that only has a task directory, you can easily make this a task. We could have done this with the `docker` and `swap` roles. Let’s look at one of the tasks in the project.

### docker-compose\_rebuild.yml

[Docker Compose](https://docs.docker.com/compose/) is a tool for running a group of containers in a defined way. We will not cover its use here, but we will look at it in the docker post that is coming soon. Here is the file `ansible/tasks/docker-compose_rebuild.yml`.

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

We can see that this looks a lot like our role task files. Ansible views a task the same no matter where it is defined. We have used multiple variables to make this reusable.

This brings us the next major Ansible concept.

## Playbooks

Playbooks allow us to define roles that apply to hosts using a specific user and variables. Hopefully that last sentence makes sense. Ansible has good analogy of what a [playbook](http://docs.ansible.com/playbooks.html) is.

> If Ansible modules are the tools in your workshop, playbooks are your design plans.

Remember that a role is just a list of modules to be executed in a specific order. Let’s look at some playbooks, which all are located in the ansible directory.

### digital\_ocean.yml

This is the playbook that is executed against a new server. This playbook is very simple and straight forward.

```
<pre class="brush: plain; title: ; notranslate" title="">
- hosts: all
  remote_user: root
  vars_files:
    - vars.yml
  roles:
    - basic_server_setup
```

A playbook is an explicit definition of what hosts, which user, what variables, and what role to use. This is one of the reasons I like YAML and Ansible’s use of YAML. It is very clear when looking at a file what it will do. We haven’t covered `vars_files` so here is `vars.yml`.

```
<pre class="brush: plain; title: ; notranslate" title="">
newuser: jjohanan
work_dir: /var/lib/blog
ssh_key: /Users/jjohanan/.ssh/id_rsa.pub
```

This file controls how our tasks will execute. Modify it to suit your needs.

### build\_wp.yml

At this point we should have a baseline system. We are now ready to install everything else that is needed for our WordPress site. This is going to be a more complex playbook.

```
<pre class="brush: plain; title: ; notranslate" title="">
- hosts: all
  remote_user: jjohanan
  sudo: yes
  vars_files:
    - vars.yml
  roles:
    - { role: swap, tags: [] }
    - { role: docker, tags: [] }
    - { role: blog_site, tags: [] }
    - { role: service_build, service: mysql, tags: [], exec_files: ['backup.sh', 'load_db.sh'] }
    - { role: service_build, service: backend, tags: [], exec_files: ['site-normal', 'site-upgrade', 'site-upgrade', 'start-nginx.sh'] }
    - { role: service_build, service: php, tags: [], exec_files: [] }
    - { role: service_build, service: varnish, tags: [], exec_files: ['start-varnish.sh'] }
    - { role: service_build, service: frontnginx, tags: ['web'], exec_files: ['start-nginx.sh'] }
    - { role: service_build, service: ejosh, work_dir: /var/www/html, tags: [], exec_files: [] }

  tasks:
    - { include: tasks/docker-compose_rebuild.yml, service: frontnginx, tags: ['web'] }
    - { include: tasks/docker-compose_rebuild.yml, service: cadvisor, tags: ['web'] }
    - { include: tasks/docker-compose_rebuild.yml, service: varnish, tags: [] }
    - { include: tasks/docker-compose_rebuild.yml, service: backend, tags: [] }
    - { include: tasks/docker-compose_rebuild.yml, service: php, tags: [] }
    - { include: tasks/docker-compose_rebuild.yml, service: mysql, tags: [] }

    - name: bring it all up
      command: chdir={{ work_dir }} docker-compose up -d --no-recreate
      tags:
        - web
    - name: make sure mysql comes up
      pause: seconds=15
    - name: Load blog backup database
      command: docker exec blog_mysql_1 /load_db.sh
    - include: tasks/docker_clean.yml
```

This playbook starts off the same way as the other. One difference is that we are now using jjohanan instead of root because we set ssh to not allow root logins. We also are telling it to run each task with sudo. That brings us to roles.

We built the roles to be reusable and as you can tell the `service_build` role is being reused quite a few times. Each role can be viewed as function to be executed. In the line for mysql:

```
<pre class="brush: plain; title: ; notranslate" title="">
    - { role: service_build, service: mysql, tags: [], exec_files: ['backup.sh', 'load_db.sh'] }
```

We are setting the variable service to mysql, exec\_files to an array with two file names, and we are not tagging this role. As we can see not every role needs all of these set. I wanted to be explicit with what is being defined for each role.

The one other role I wanted to highlight is the last iteration. Here is the line.

```
<pre class="brush: plain; title: ; notranslate" title="">
    - { role: service_build, service: ejosh, work_dir: /var/www/html, tags: [], exec_files: [] }
```

This line has one more variable set, `work_dir`. All the other executions of role had `work_dir` set from the vars.yml file. We are overriding it for just this specific execution.

Finally we are setting (or not setting) tags for each tags for each role execution. We will see why shortly.

#### Reusable Tasks

We are reusing our task we created before. We just include the YAML and set any variables, very similar to roles. Each of these will make sure that the docker containers we need exist (we will cover everything docker in a future post).

## Tags

Tags allow us to tag commands (should have guessed!). We can then target only specific commands to execute when running the playbook or in the exact opposite way we can tell Ansible to skip certain commands. Here is an example of only running web tags and skipping prod tags.

```
<pre class="brush: plain; title: ; notranslate" title="">
$ ansible-playbook -i inventory build_wp.yml --tags="web"
$ ansible-playbook -i inventory build_wp.yml --skip-tags="prod"
```

The first command will only run the following role and task from the playbook, because they were tagged with web:

```
<pre class="brush: plain; title: ; notranslate" title="">
    - { role: service_build, service: frontnginx, tags: ['web'], exec_files: ['start-nginx.sh'] }
    - { include: tasks/docker-compose_rebuild.yml, service: frontnginx, tags: ['web'] }
    - { include: tasks/docker-compose_rebuild.yml, service: cadvisor, tags: ['web'] }
```

The second will execute everything but these commands from the blog\_site role, because they have the prod tag:

```
<pre class="brush: plain; title: ; notranslate" title="">
- name: copy the backup script
    copy: src=site-backup dest={{ work_dir }}/site-backup mode=755
    tags:
      - prod

  - name: install s3cmd
    apt: name=s3cmd state=present update_cache=yes
    tags:
      - prod

  - name: install s3cfg
    template: src=s3cfg dest=/root/.s3cfg
    tags:
      - prod

  - name: schedule backup to run weekly
    cron: name="site backup" minute="0" hour="2" weekday="1" job="{{ work_dir }}/site-backup" user="root"
    tags:
      - prod
```

We don’t want to have a backup script running on a test site.

## Inventory

We have not given Ansible a list of hosts to run the playbook against yet. This is where [inventory](http://docs.ansible.com/intro_inventory.html) comes in. We can create a document that list out all the IP addresses (or DNS names) of the servers we want to run this against. Or we could use the script Ansible has created to dynamically get all of our hosts for different services. Ansible has many scripts that will work with popular cloud and hosting services. We could even write our own if needed. All the script needs to do is return a JSON object with an array of your servers (it can be a little more complex and Ansible has some [documentation](http://docs.ansible.com/developing_inventory.html) on what you need to do).

I used Digital Ocean so I have the script in repository. To use it you must get a Digital Ocean CLIENT\_ID and API\_KEY. The script uses the deprecated Digital Ocean APIv1 so at anytime this script may not work. If you are having troubling finding your Digital Ocean Api key it is at the [APIv1 page](https://cloud.digitalocean.com/api_access).

## Vagrant

We have a `Vagrantfile` so we can test this locally before testing anything in the cloud. Vagrant has an Ansible provisioner so it is fully supported. We can run a playbook immediately after a virtual machine has been created. The `digital_ocean.yml`(in hind sight this can should be renamed) playbook that runs our `basic_server_setup` role is perfect. Here is the relevant lines in the `Vagrantfile`:

```
<pre class="brush: ruby; title: ; notranslate" title="">
  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "../ansible/digital_ocean.yml"
    ansible.sudo = true
    ansible.extra_vars = { ansible_ssh_user: 'vagrant' }
    ansible.host_key_checking = false
  end
```

At this point our virtual machine is ready to have the other playbook executed against it. Vagrant will create an inventory file if you use Ansible as a provisoner so we will use that. Here is the command to install everything else in the new virtual machine.

```
<pre class="brush: plain; title: ; notranslate" title="">
ansible-playbook -i ./.vagrant/provisioners/ansible/inventory/vagrant_ansible_inventory ../ansible/build_wp.yml --skip-tags="prod"
```

There is nothing new in this command. We do not want to install any of the backup scripts or cron jobs so we use `--skip-tags="prod"`

Vagrant gives us a great way to test any changes in our deployment. In fact I discovered that docker 1.6.1 has an [issue](https://github.com/docker/docker/issues/13097) with one of the containers. This stopped the playbook from completely executing. I was able to test a solution and create a work around without having to take my site down.

The only downside to using Vagrant is that unless you modify the site name in WordPress we will only see the front page. Two things are working against us. The first issue is all the links on the site will point to the production DNS name. In my example all links point to ejosh.co/de. This can be fixed by updating the hosts file on your machine. If you are unsure how, just google hosts file and your OS. The other is that Vagrant has issues binding to ports under 1024. This is an issue because WordPress will redirect a different port to the port the WordPress site is running on. For example if you load http://localhost:8080/about-me (or any url for the site) in your browser, WordPress will redirect you to http://localhost/about-me. Most likely we are running our site on port 80 and this will fail because we do not have port 80 forwarded on our machine.

## Digital Ocean

We can now deploy this to the cloud. I have chosen Digital Ocean, but you can use any service that allows you to SSH into your server (this should be any of them). There are two things you will need to deploy. The first is a back up of your current WordPress install and the second is a MySQL dump of your WordPress database. If you are using the project as-is you will need to copy the WordPress directory structure into the `docker/ejosh` directory and the database backup to `docker/mysql/wp_backup.sql`.

We can run these two commands in the ansible directory to deploy to Digital Ocean.

```
<pre class="brush: plain; title: ; notranslate" title="">
ansible-playbook -i digital_ocean.py digital_ocean.yml
ansible-playbook -i digital_ocean.py build_wp.yml
```

## Summary

Hopefully this post demonstrates the power and simplicity of Ansible. We have a declarative plan of what we need configure and copied and we can keep it with the project in source control.