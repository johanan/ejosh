---
id: 634
title: 'A Workflow Story'
date: '2013-11-06T21:36:34-05:00'
author: 'Joshua Johanan'
layout: post
guid: 'http://ejosh.co/de/?p=634'
permalink: /2013/11/a-workflow-story/
dsq_thread_id:
    - '2018375828'
categories:
    - Uncategorized
---

Bad workflows suck.

This post is going to be a little different than my other posts. It is going to be a partially fictional story. I say partially becuase all of the events I describe have happened to me in one form or another.

You open gmail, to check over your email as Aptana is opening. Another Amazon email. You only searched once for some info on a TV that your friend posted about buying on Facebook. Now you have a list of the top selling LED TVs. You feel spammed, intruded upon. Although you did click on two of the TVs. Each were at least 5 inches bigger than his.

An email catches your eye, an error report from your app. You had just added a facebook login. Pushed it out to the prod server yesterday. It just blew up while someone was signing up.

"I logged in through Facebook 20 times before I pushed that out", you say to no one in particular.

You glance over at your notepad. Three lines down you see Facebook Logins crossed off. You were going to start working on rolling some other features in. Underneath that you have written down Selecting friends, Posting to walls, CSS3 transitions. Now you are back to square one.

Your attention comes back to the email. Line 27 in facebook\_login.php the stack trace informs you. You jump into the facebook folder, look for the file name facebook\_login.php.old. Shit, you see facebook\_login.php.old1, old2, and old3. Each a step back through last week. Click sort by date. Same day. You must have added something to them all at the same time. Open each up and compare. Found the function in each file that bombed in prod. Copy it, open Notepad++ and paste each one in a new document creating a function waiting room.

You open up the prod version and start following the call stack.

"Alright, I intialize my FB object here. Grabbing the secret and app id from settings.", again no one is listening very intently.

"Check the access token…it should be valid…now make the api call."

You open up your vendor/facebook folder and open up facebook.php. You are now venturing into code you did not write. At this point you know in the back of your mind that Facebook tests their code. You know there is a small, tiny really, chance that the problem is here. The front of your mind is trying to track the flow through the api call. Maybe if you find a bug, you can create a pull request against the official Facebook SDK.

"That'd go right in my resume", no one nods in agreement.

"Reddit, Hacker News. I could probably get a few hundred thousand hits on my blog on the fix post alone."

You notice you are now looking above and to the right of your monitor. A quick shake of your head and you are back on track.

"I don't see anything here that looks bad". You decide the code here is fine, reserving the right to come back and find that bug you know that is not there.

You jump back to your code. As you walk through each line you compare it to the appropriate line in your function waiting room.

There it is.

You let out a quick, but heavy sigh.

Two lines up from your error, but 100 lines down from your starting point today. You were messing with the permission scope. You probably forgot to remove the application from your account between each change.

"It probably didn't have permissions to make that api call. Why does Facebook have to change their permission scope every two days?"

The issue fell squarely in your code. Facebook does change their api too much, though. The validity of that point does not change your responsibility.

You log into Facebook and remove your app from your privacy settings.

"Why is this seven fucking clicks? Should be two: Apps, delete"

After pasting in the correct permission scope, you open your browser. <http://localhost:8080>. You have a local install of Apache and because you changed the files in place it's already serving your update. You start typing in the rest of the URL: /lo; Chrome pops up with the rest of the URL for you: <http://localhost:8080/login>. You press down and then enter. Technically you saved two key press.

For a tenth of a second you think about all the time you have saved not typing. Today's gain/loss is negative as you have only saved 20/100ths of a second not typing and 1/10th of second thinking about it.

You click the big blue Facebook button on the page. A dialog pops, but there is a red box at the top of the page.

You mouth the words, letting out just a little breath with each word that it is almost loud enough for no one to hear, "What the fuck?".

"What's wrong now?", this time audible.

You remember. The settings.php file has your prod settings. You drill down in a few folders in Aptana and find settings.php.

//prod – make sure these next lines are uncommented  
//dev – uncomment these to test locally

You quickly add the slashes to comment out prod and uncomment dev. A quick ctrl+s, click on Chrome, and finally F5. You have done this so many times that you again think about all your time savings. You now have doubled your time savings hole by wasting another three tenths of a second thinking about it.

You already have your mouse lined up over where the Facebook button would be if the page was rendered already. Right as you see it, you click. No red box on the dialog.

The Facebook dialog is asking for the permissions you have configured. Everything seems in place so you click the Allow button. In what seems like 2 minutes, but is actually about 10 seconds the page refreshes. In the the corner is your familiar Facebook photo. You finally have tracked the bug down and squashed it.

It is now time to push your changes to prod. After clicking your Filezilla icon a window pops up. You are two sub-versions behind. Not today Filezilla. You are on a mission.

You select prod and connect to the server. You browse to the directory and start the upload. 'Target file already exists. Please choose an action'. You want to click overwrite and be done with it, but you cannot. You cancel out.

Right-click 'New Folder'.

'Prod v2.1'

Back to Filezilla to download everything off the server. There are now over a thousand queued files being downloaded.

Back to explorer.

Right-click 'New Folder'.

'Prod v2.1 20130905'.

Ctrl+a, ctrl+c, double-click, ctrl+v.

Your backup is done. You jump back to Filezilla and finally accept the fact, and the dialog box, that you are overwriting everything on the server.

This time you have a version number and a date. You are sure there are no bugs. You do not know what time it as time has been switching between going too fast and dragging. It could be 3PM or 9AM. 11:23AM.

You click the new tab button in Chrome twice. re, reddit.com pops up as the first suggestion. Down and enter. Next tab; hac, news.ycombinator.com. You aren't going to start anything until after lunch.

Here are some of things I will touch on how to make your workflow something you enjoy instead of fight against.

Project Management: Trello, Google Docs, Moqups  
Source Control: Git  
Environment manager: virtualenv, multiple settings.py, and multiple requirements  
Deploy: Heroku, shell scripts  
Dry apps: base  
Testing: django-nose, coverage, grunt using git hooks  
What you have: repeatable, extensible, shareable, deployable, maintainable apps

Not picking on PHP, but depending on the framework/organization there could be horrible workflows.