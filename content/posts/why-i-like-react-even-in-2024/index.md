---
title: "Why I Like React (even in 2024)"
date: 2024-03-12T23:50:40-04:00
draft: true
image: DALL·E_react_watercolor.webp
---
I recently read a post about React being antiquated. I have liked React for a long time (here is a local meetup talk I gave in 2015?! https://ejosh.co/de/2015/08/my-talk-on-react/ ). I am not really posting this as a rebuttal to the other post, but to shine a light on the core paradigms of React which are still valuable in 2024 and beyond.

Before getting to the thesis of my post there is a great article (https://joshcollinsworth.com/blog/tailwind-is-smart-steering) about Tailwind, music, and Mario Kart by the same author. I have excerpted the relevant part, although I recommend reading the entire post:

> We could’ve dissected Bon Jovi and Sufjan Stevens all we wanted. But it didn’t matter, because our disagreement ultimately started before either one of us ever pressed the play button.
>
> We just never agreed on what was a feature, and what was a bug.
>
> Likewise, I suspect most people on opposing sides of the Tailwind debate actually completely agree on Tailwind itself. I don’t think our divide centers on atomic CSS, or utility classes; I think the contention comes from valuations we made long before we ever chose our tools. Where one of us sees a selling point, the other sees a flaw.
>
> Tailwind _is_ great.
>
> Tailwind is _also_ a bad idea.

This idea is great. Different people value tools and the decisions of those tools differently. I agree with this sentiment wholeheartedly. 

Using this context of different people valuing tools differently let's look at the orignal post:  https://joshcollinsworth.com/blog/antiquated-react aka (Things you forgot (or never knew) because of React). I recommend reading this post in its entirety as well.

The author makes many points as to why React is antiquated and why you should choose some other technology. Unfortunately, React is not afforded the same respect as Tailwind. The author sees flaws in React without taking the time to see why someone else would see a selling point. The most valuable features of React are just classified as flaws and determines you should use something other than React. Josh, not me the other Josh, admits the following quote lead to writing the article.

> Someone asked me today if there was a case for using React in a new app that doesn’t need to support IE.
> 
> I could not come up with a single reason…
> 
> It’s astonishing how antiquated React is.

---
On a side note, I have noticed that there are more and more articles with the core idea of "Why would anyone choose React?" And much like this post they see flaws which actually are the most valuable features of React.

---
There are two major flaws/features of React referenced in the post that I will cover.
## Two Way Data Binding or the lack thereof
React famously recommends one way data binding. I am talking about the idiomatic way to use state in React with `useState` or something like Redux. What both of these have in common is that state is immutable (either literally or effectively) and state changes occur through explicit functions to update the state (actions or `setState`).  

In the original post, two way data binding is seen as something that has been forgotten in favor of one way data binding. https://joshcollinsworth.com/blog/antiquated-react#two-way-data-binding-isnt-hard-and-it-isnt-a-bad-idea

In response to the specific section, I will admit that forms have had a checkered past (meaning they have stunk) in React. Although right now I would guess most development with React is either using React Hook Form or just grabbing the data from the form `onSubmit` event. 

Unfortunately there are no other examples of the power of two way data binding. Forms are important and a key part of the web. But they are usually the smallest bit of state that is being tracked in a web application. If a form is the largest state object in an application, then you do not really need React. Or any JavaScript library for that matter. You really just need modern HTML input validation and a form.

I see anything that does two way data binding as a flaw. It introduces the two biggest hidden problems in any project; **complexity** and **mutability**. These two things are related. Once you start building more of the application you get more variables that can change in any way at any time. This makes it very difficult to keep a model of the application that will fit in your head[^1].

One way data binding that is immutable and has explicit functions for each state transition is a major feature. It is one of the most powerful React paradigms. This seems so simple, yet do not underestimate it. 

Two way data binding *is* great. 

Two way data binding is *also* a bad idea.

## JSX and HTML templating
This next quote from the post was the catalyst for everything I wrote here. It clearly demonstrated to me that there is a value mismatch. 

> But Vue uses a templating language closer to default HTML than to JSX, which makes it much easier to write conditionals and loops in template files, without having to reach for workarounds like `map` and ternaries.

Ternaries and maps are not workarounds. These are powerful and expressive tools for building a UI. I will be honest, I am having trouble finding the best words to express myself here as it seems self-evident to me that conditionals and looping in HTML template files is the workaround and limits what you can do.

Here is a Reddit [comment](https://www.reddit.com/r/webdev/comments/15w6smz/comment/jx0phfw/) by __versus that sums up my base assertion about JSX.

> JSX is a really good innovation because it takes everything you know about JavaScript and embeds HTML in it which as it turns out can be fully expressed within JS grammar. This is opposed to every other path other libraries take to reach the same goal where they instead slap a custom DSL on top of HTML that sometimes looks like JS but is nowhere near as expressive or complete as JS actually is because the grammar of HTML cannot allow it to be.
> 
> So in summary React is excellent because there are almost no compromises to expressiveness within its language and allows you to use every feature of regular JS to render your components while other template languages have to sacrifice expressiveness to fit within the bounds of HTML.

JSX is not HTML and it is also not trying to be HTML. Treating it like HTML will limit what you can build. JSX is just a function call. That's it. The expressiveness of HTML is minuscule compared to the expressiveness of calling a function in JavaScript.

[dmitriid](https://news.ycombinator.com/item?id=19199423) on Hacker News builds on this idea. This next section is a quote, but I am going to render it as part of the post to take advantage of markdown rendering here.

---
Yes. However, one thing you fail to see is that it directly compiles to function calls.

```jsx
   <Tag a="b" x={y+z}>{valid JS expression}</Tag>
```

is

```javascript
   React.createElement(Tag, { a: "b", x: y + z }, [<valid JS expression>])
```

Which means:

- you have access to JS variable in scope
- you can use JS facilities (proper if/switch statements, for loops, functional programming, you name it)
- you need no additional scripting or templating features. It's, well, just Javascript.
---

React rendering is a just a pile of function calls and expressions. That is powerful. Do not underestimate this. This is a core value proposition of React which is backed up by every functional programming language. 

HTML templating *is* great. 

HTML templating is *also* a bad idea.

## What is a feature and what is a bug
Getting back to the theme of this post, we will never agree on what is a feature and what is a bug. We actually completely agree on Vue, Svelte, Solid, or any other frontend framework. You see features and I see flaws[^2].

Essentially this post can be summed up by the following theoretical conversation. 

> React is antiquated. It recommends immutable data and forces you to render with composed function calls and expressions that look nothing like HTML.
> 
> What? That is literally what I am seeking. I can apply functional paradigms to the frontend.
> 
> That doesn't matter to me. I want something that does two-way data binding and uses HTML templated files.
> 
> What? That is literally what I am trying to avoid.
>
> We just never agreed on what was a feature, and what was a bug.

Everyone writing a rebuttal in the comments, please read the first article by Josh Collingsworth. There is nothing wrong with Vue (or any other frontend framework). Vue is NOT antiquated. I know I used the "X is *also* a bad idea" rhetorical device, and I do stand behind the statements, but do not take those as assaults to your character. Vue has value and I understand why people choose it over React. I felt that the opposite is not always true. This post is to highlight the features of React that people value and why many businesses choose React, even in 2024.

[^1]: Code that fits in your head by Mark Seemann pg 259 section 13.1.1
[^2]: Mind you, I am using flaw in the scope defined here. Flaw does not mean that there is a problem or that the framework has no value or is limited. Flaw means I do not apply the same value as you do.