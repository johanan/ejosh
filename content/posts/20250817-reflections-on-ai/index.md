---
title: "Reflections on AI"
date: 2025-08-17T10:25:30-04:00
draft: true
---

- Recently added a new feature to ldrs
  - ldrs is a data loading library that simplifies processes that always seem to complex and did not focus on just doing 1:1 data type mapping
  - added a feature to load Lua functions that control the loading process and used Claude code to help with writing the code
  - Did not do vibe coding, but just this side of vibe coding. Essentially, let's talk out the plan and then I let it write the code once I felt comfortable with the plan.
  - Short summary is AI helped in a few places, but overall I think it slowed me down from implementing the feature. I eventually became to disconnected from the code. Because I wrote this over multiple days it was easy for me to allow the AI to add duplicative code or have multiple functions doing similar things in different ways. I was able to finally release the feature after editing the code down and just executing what I needed.
- Where AI helped
  - AI helped with using nom (https://github.com/rust-bakery/nom)
  - I never had used a parser combinator library before, but I did understand the concept and the math of the combinator is very similar to monadic pipelines.
  - Claude helped me get a working example without having to go through a lot of documentation.
- Where AI hurt productivity
  - Stated easily, once an sort of complexity is introduced. I would categorize the complexity into 2 items.
   - complexity related to the core problem. The library targets Postgres and Snowflake and there are multiple ways that you can ingest data into those systems. The AI was very eager to jump into that complexity before I even had a great idea. It muddied the waters to many times in many ways.
  - complexity from architecture. Claude had trouble adding the Lua feature as it ultimately depended on or was a dependency for every other part. I had a lot of trouble with circular dependencies and reminding Claude about the module order.
    - I am not sure how strict Rust is with circular dependencies as I spend a lot of time in F# which is very strict about it. So I maintain the same strictness in Rust.
  - here are few things related to the same complexity but I want to call out specifically:
    - Mistakes or unfinished code. Claude always would point out something that was not done or was wrong. I would even state do not worry about that code and focus on this part of the code. Many times that would work for a few prompts and then it would say, "Hey here's an issue and how to fix it."
    - Telling me that was a great idea and then immediately changing the code of my idea. Apparently, it was not a great idea.
