---
title: "Why I Prefer Errors to Exceptions"
date: 2024-09-29T11:30:35-04:00
---

I recently saw a video pop up in my YouTube feed, ["Why I Prefer Exceptions To Errors"](https://www.youtube.com/watch?v=sS6u5UU3t3c) by [ThePrimeTime](https://www.youtube.com/@ThePrimeTimeagen). The title is a little misleading, as it refers to an [article](https://cedardb.com/blog/exceptions_vs_errors/) that Primeagen is reacting to. In the video, he makes a case for preferring Errors over Exceptions.

Before jumping in, I want to talk about Primeagen. I am not a subscriber so I do not see every video, but the videos that I have seen about software and what it means to be a software engineer are clearly based on experience and knowledge. You can tell he thinks about what it means to be a engineer and how to purposefully write good software. I wholeheartedly agree and his approach should be the tagline of my blog, "Deliberately think about how software is written and maintained to be a better developer." 

I really just wanted to highlight one small portion of the video starting at 7:30 to 10:21. I have linked the video below to start at the appropriate place.

{{< lite-youtube videoid=sS6u5UU3t3c t=451 >}}

The whole video is good, so watch the rest. 

I previously discussed this topic in [Don't throw exceptions in C# use Monads.](../../../2022/07/dont-throw-exceptions-in-csharp-use-monads/) Clearly, by the name of the post, my recommendation is to **not** throw an exception and to return an error value (a monad; don't worry, we will dive into this a little here.).

Primeagen perfectly illustrates why an error value should be used.

{{< srcset src=exception-context.webp alt="Drawing of call stack and how it relates to the exception context" caption="Problem occurring in foo()" >}}

> If an exception happens here, where is it caught? Can you, do you even know? You can't know. Because you would have to have the understanding of what came before it.[...] Whereas errors as values you have to make a decision at that point how you want to handle an error. Do you crash the request and go straight to 500? Do you handle that and give some sort of default value out? [...] You have this error object and what do we do with it? [...] I can even do some nice monadic transfers, or else, right, and have these nice little operations that just happen on top of it and transform the error into the thing I want it to be

Exactly. Perfectly stated reasoning on why an error value should be preferred over an exception.

The inversion of thinking about throwing an exception is key. You cannot know where it is caught. *And it is not the concern of `foo()` to know where it is caught or what to do with the error.* Throwing an exception forces the program to figure out what to do with the error **now**. The job of `foo()` is to report back to `c` with the result of the process. And a valid result is the process cannot be completed. Let the caller determine what to do because it has more context about what it was doing in the first place.

## Monadic Transfers
Primagen mentioned, "I can even do some nice monadic transfers". What does that even mean? That means that in a language that fully supports monads you do not have to keep checking if the process failed or not. You can write code that looks completely imperative while also handling 100% of all errors.

Let's do a quick example in my preferred language of F#. F# is essentially OCaml on .NET. Full interoperability with C# and any .NET library. It is functional first that also, in my opinion, does OOP better than C#.

The most important feature for this post is that it has a monadic `Result` type. All you need to know is that the type signature is `Result<'ok, 'error>`. If everything runs as expected it will return the `'ok` type or the `'error` type when something has failed. I am not going to take a lot of time on the syntax as it looks like pseudo code, but it compiles. 

We will use F# interactive to code right in the console. You will need the .NET SDK installed to run fsi.

```bash
dotnet fsi
```

At the cursor paste the following code, including the `;;` as it closes what was pasted in.

```fsharp
let tryParseInt (s: string) =
    match System.Int32.TryParse(s) with
    | true, i -> Ok i
    | _ -> Error "Invalid number"

let notOver100 i = if i > 100 then Error "Cannot be over 100" else Ok i

let notEvenException s = if s % 2 = 0 then failwith "Cannot be even" else s

let wrapException f x =
    try Ok (f x)
    with e -> Error e.Message

let parseAndValidate s =
    s
    |> tryParseInt
    |> Result.bind notOver100
    |> Result.bind (wrapException notEvenException)
;;
```

Here is the crash course on this F# code. 
- `Ok` and `Error` do exactly what you think they do and roll up into the `Result` type. 
- Minimal type annotations are needed as F# can infer the type by the usage. TryParse is overloaded so we need to add the type.
- No return statements. Whatever the last expression is what is returned. Like a one-line lambda in C#.
- Parens are for grouping not function execution.
- The pipe operator `|>` passes the output into the next function. Creating a pipeline that is easy to follow.
- `Result.bind` is the way to flatten two results. In this case three different results (parsing, not over 100, and not even) are flattened into one `Result`.

After pasting in the code you should see the following which shows everything was parsed correctly.

```fsharp
val tryParseInt: s: string -> Result<int,string>
val notOver100: i: int -> Result<int,string>
val notEvenException: s: int -> int
val wrapException: f: ('a -> 'b) -> x: 'a -> Result<'b,string>
val parseAndValidate: s: string -> Result<int,string>
```

Exactly like C#, F# is a strongly typed language. The key thing here is that almost all the functions return `Result<int,string>`.

Now let's test `parseAndValidate`. Run the following or put in whatever your want.

```fsharp
parseAndValidate "definitely not a number";;
parseAndValidate "1";;
parseAndValidate "2";;
parseAndValidate "101";;
parseAndValidate "99";;
```

And you will get, respectively
```fsharp
val it: Result<int,string> = Error "Invalid number"
val it: Result<int,string> = Ok 1
val it: Result<int,string> = Error "Cannot be even"
val it: Result<int,string> = Error "Cannot be over 100"
val it: Result<int,string> = Ok 99
```

*Pretty cool*. We have a type `Result`, that encapsulates a computation that can return the output or what went wrong. Then this is even easier to use with `Result.bind` to compose an entire pipeline of computations into one.

### Where are the Transfers?
At this point we have just built a function that turns a string into an int and will output any issues, but we haven't done anything with that. So let's build an addition function.

Paste this code into the same fsi session.

```fsharp
#r "nuget: FsToolkit.ErrorHandling"
open FsToolkit.ErrorHandling

let parseExpression s =
    result {
        let! i = tryParseInt s
        let! not100 = notOver100 i
        return! (wrapException notEvenException) not100
    }

let parseAdd x y =
    result {
        let! x = parseExpression x |> Result.mapError (fun e -> "x: " + e)
        let! y = parseExpression y |> Result.mapError (fun e -> "y: " + e)
        return x + y
    }

let parseAddSafe x y =
    let x = parseExpression x |> Result.defaultValue 0
    let y = parseExpression y |> Result.defaultValue 0
    x + y
;;
```

Crash course on this code.
- `Fstoolkit.ErrorHandling` is a package that gives us `result { }`. This is called a computation expression in F#. The two things we need to know is that anytime you see `!` it actually executes `Result.bind` and we have to `return` out of the expression when we are done. 
- `parseAdd` adds context to the errors before completing. Notice we did not have to touch our initial functions at all. They can stay laser focused on parsing and validating.
- `parseAddSafe` adds a default of zero. No matter what you give this function it will return a sum of two ints. This does swallow errors, but that is a *conscious* decision.

Notice the types that are returned.

```fsharp
val parseExpression: s: string -> Result<int,string>
val parseAdd: x: string -> y: string -> Result<int,string>
val parseAddSafe: x: string -> y: string -> int
```

These functions that are taking complex actions (`parseAdd` is executing at least 10 functions) are still returning `Result<int,string>` not `Result<Result<Result<int,string>,string>,string>`. 

Let's try these functions out.

```fsharp
parseAdd "1" "2";;
parseAdd "2" "1";;
parseAdd "1" "3";;
parseAddSafe "1" "2";;
parseAddSafe "1" "3";;
```

And the results.

```fsharp
val it: Result<int,string> = Error "y: Cannot be even"
val it: Result<int,string> = Error "x: Cannot be even"
val it: Result<int,string> = Ok 4
val it: int = 1
val it: int = 4
```

This is a trivial example, but hopefully instructive. We can communicate an issue with a parameter or just silently substitute a 0 when the process fails. The key point here is that the calling function can choose what to do cleanly because the error type is a monad.

## Prefer Errors over Exceptions

Here are the key points to remember.

1. The type signature of a function should tell you what the function returns and how the function may fail. This allows the caller to make a decision about what to do. Exceptions throw a massive wrench in that.
2. Well, now don't we have to unwrap or check this value every single time we use it? Not if it is a monad. Monadic transfers are the functions that allow you to combine or map over the `Result` without unwrapping it. All functional languages allow you to do this in increasingly terse syntax. For example, `do` notation in Haskell.
3. F# is a criminally underused language.

For me, I would not want to build anything without something like a `Result` type. There is so much control over what is happening. It is easy to understand what can go wrong, how it goes wrong, and how that is handled by just reading the code.