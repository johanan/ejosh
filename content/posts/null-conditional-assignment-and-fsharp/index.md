---
title: "Null Conditional Assignment and Fsharp"
date: 2025-06-29T20:51:22-04:00
tags:
    - FSharp
    - CSharp
categories:
    - Why FSharp
---

My team has fully moved to F# and it has been wonderful. The unfortunate part of changing languages is that there are very few roadmaps on how. We are on the other side of this change and at this point F# code feels more natural than C#. I say all of this to give a background that there is not enough F# content out there. My goal here is just a short post that adds to the greater knowledge around the thinking when moving from C# to F#.

I like Nick Chapsas videos. I am always watching for videos that cover something that I do not know. This is a response (🙌 not really), to this video, which gives me a chance to contrast differences in C# and F#.

{{< lite-youtube HMSfIkYI5ls >}}

## C# Null Conditional Assignment
This video covers a new feature coming to C# 14 which is null conditional assignment. Meaning you can easily set the property of an object only if it is not null. Here is the the example from the video showing how it works:

```csharp
public static class UpdateCustomer
{
	public static void UpdateAge(Customer? customer, int newAge)
	{
		customer?.Age = newAge;
	}
}
```

I know this is completely arbitrary code to highlight the new feature, but my first thought is **What?** This is not questioning the code. It is is questioning the feature. If there is no customer, what are you doing? Why are we trying to update a value of something that might not exist?

At this point I think more in F# and in F# there is not a need for a feature like this. F# does not have nulls and instead has Options. An Option either has a value as `Some<'t>` or no value as `None`. The first thing to understand is that `None` is a separate value than having the value, meaning you cannot write a function that can try to set the property of an object or record without checking that there is a value.

Not only does the core of this already exist in F# it is also more explicit. In C# what do you do if customer is null? I mean the code wants set the age, but if there is no customer it just silently does nothing. In F# you have to handle both cases. Is this more code and logic? Yes. Does it make the code more resilient and clear? Yes.

## F# example
Let's make another contrived example to show the F# approach to this problem. We will do this through a simple API. This gives context around what to do if there is not a customer, which is return a 404.

First let's create a simple minimal API.
```bash
dotnet new web -lang F# -n null-assignment
```

Next here is the full `Program.fs`. It simulates having saved customers with an array and an endpoint named birthday that increments the customers age by one.

```fsharp
open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Hosting
open FsToolkit.ErrorHandling

type Customer = {
    Name: string
    mutable Age: int
}

let customers = [|
    { Name = "Grogu"; Age = 50 }
    { Name = "Josh"; Age = 30 }
|]

let incrementAge (customer: Customer) =
    customer.Age <- customer.Age + 1

let findCustomerByName (name: string) =
    Array.tryFind (fun c -> c.Name.ToLower() = name.ToLower()) customers

[<EntryPoint>]
let main args =
    let builder = WebApplication.CreateBuilder(args)
    let app = builder.Build()

    app.MapPost("/birthday/{name}", Func<string, IResult>(fun name ->
        let customerResult =
            result {
                let! customer = findCustomerByName name |> Result.requireSome "Customer not found"
                incrementAge customer
                return customer
            }

        match customerResult with
        | Ok customer -> Results.Ok(customer)
        | Error msg -> Results.NotFound(msg)
    )) |> ignore

    app.Run()
    0 // Exit code
```

Quick run down of the points of interest:
- `mutable` keyword. In F# data is immutable by default. Mutable allows the variable to be changed in place. Idiomatic F# prefers immutablity, but F# is equally at home with paradigms from Functional and Object Oriented programming.
- `incrementAge` function is the corollary to `UpdateAge`.
	- F# does not need a class to create a function. Functions can exist as variables.
	- The function is not concerned if the customer is null or not. In F# we can guard that at a higher level so the code is only the golden happy path.
- `result {}` is a [computational expression](https://fsharpforfunandprofit.com/posts/computation-expressions-intro/). This allows us to easily map this process as a success `Ok` or a failure `Error`. In this case `Result.requireSome` means that if the array lookup did not find a customer, stop executing this path and return `Error`. Finally we check the success or failure and return the appropriate HTTP response.

Granted there is more going on here, but this illustrates a very common pattern in F#. When looking up a customer from a database there may or may not be a customer, which is perfectly modeled with an `Option<Customer>`. This can easily be changed to a failure as in this context, we need a user. In another context, maybe the answer is to create a user. The most important part of this is that the `incrementAge` function does not determine what to do if a customer does not exist.

Let's test this now.
```bash
dotnet run
```

Then make some calls and see everything works as expected.
```bash
curl -X POST http://localhost:5001/birthday/grogu
curl -X POST http://localhost:5001/birthday/doesnotexist -i
```

Wrapping up, this post extrapolates on the original video and message and I hope this is helpful for anyone that is curious about F# and how it is used to solve problems. In the case of this new feature (it is more of syntactic sugar than a feature) for C#; F# handles this differently. In other words, if a function needs a value (most do), F# at a language level will enforce that for you. And it enforces that you define what to do when the there is not a value. That is one of the reasons I and my team have chosen F#.
