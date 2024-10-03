---
title: "A Few More Thoughts on React"
date: 2024-04-23T23:23:40-04:00
image: DALL·E_abstract_colors.webp
tags:
    - react
---
I had a few more thoughts after I made my last post. 

## Simple Made Easy
I realized after posting that my thesis is along the lines of "Simple Made Easy" by Rich Hickey. If you have not seen the talk watch it now.  The titular idea is that `simple <> easy`. 

{{< lite-youtube SxdOUGdseq4 >}}

Expanding on this:
- **Simple** - not complicated
	- Simple is only having to track a few things in your mind.
	- State is *never* simple
	- State complicates everything that touches it. Which usually is the entire program
	- Immutable data flow is simple.
- **Easy** - means near, familiar, close to our capabilities
	- Only means we understand or the concept is familiar, not that it is simple.

One of the best quotes from the video:
> In addition, we're fixated on, oh, I can't; I can't read that. Now I can't read German. Does that mean German is unreadable? No. I don't know German. So, you know, this sort of approach is definitely not helpful. In particular, if you want everything to be familiar, you will never learn anything new because it can't be significantly different from what you already know and not drift away from the familiarity.

Going back to the context of the previous post, when a framework makes sense immediately, that only means it is easy. Or rather it is close to something that you already understand. This does **not** mean it is simple. It does not preclude it either, but `simple <> easy`.

React is not easy to for most people as the core concepts, Immutable data flow and function/expression based rendering, are not concepts most developers are familiar with. Crucially these core concepts are simple, but not easy. 

The simplicity of React outweighs any other features of other frameworks.

## Regression to the mean
There is an infamous /r/nfl post about regressing Patrick Mahomes' outlier statistics to the mean, which then proves he is just average: 
https://www.reddit.com/r/nfl/comments/d5maow/oc_after_adjusting_patrick_mahomes_stats_removing/

This comment is the post distilled down:
> If you take away everything that makes Mahomes good, he's not so good anymore.

I felt like this is the logic in the intial post I was responding to that asked "Why do people still use React?"

> If you take away everything that makes React good, it's not so good anymore.

## Do not fight React
Finally, this recent Jack Herrington video has a couple of important and applicable ideas.

{{< lite-youtube 74q1vURXvlY >}}

First, at https://youtu.be/74q1vURXvlY?si=F0X8eCjOX2ldDreM&t=546

> That's not the way the react works. That's the way solid works actually, but don't try to turn react into solid. If you want to do that just use solid. Don't fight the react framework, write react the way it was meant to be written

If you do not like how React works, do not use React. Do not fight React and determine that it does not work.

Second, at https://youtu.be/74q1vURXvlY?si=sTzB209sOnNRJ4_4&t=681

> How to have a healthy engineering mindset and all of these react Cults are people that don't have healthy engineering mindsets. The never spreaders they are absolutist thinkers they think in black and white terms and software just doesn't work that way it's always about tradeoffs

This gets into the weeds of specific ideas from the video, but the greater point is important. Engineering and software are not black and white. You should use React when it makes sense for you and your team. There are many teams out there that are using React for the wrong reasons. 

React being popular is a **horrible** reason to use React. React allowing your team to approach complicated applications because it is simple is a great reason to use React. Understanding what makes React powerful and what the tradeoffs are should be done before deciding to use React for a project.

I really am not a React apologist. I am only trying to make two points. **1.** It seems in vogue to suggestively pontificate "Why does anyone still use React anymore?" and **2.** I have found that if you are building a web application, I mean a real application; full permission model, dozens of API endpoint calls, lines of code being measured in tens of thousands, etc, then there is no better framework to tame the complexity than React.