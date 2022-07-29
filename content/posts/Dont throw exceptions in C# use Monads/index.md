---
title: "Dont throw exceptions in CSharp use Monads"
date: 2022-07-14T18:08:38-04:00
github: https://github.com/johanan/EitherWeather
categories:
    - C#
tags:
    - functional
---
Nick Chapsas recently released a great video "Don't throw exceptions in C#. Do this instead". The quick summary is to not throw exceptions but to use the `Result` type from [LangExt](https://github.com/louthy/language-ext). Nick makes great videos, but there are a few things I want to correct/add to and respond to concerns from the comments.

Before we go any further, I **LOVE** LangExt. I consider it a must-install in any project.

{{< lite-youtube a1ye9eGTB98 >}}

## Misunderstanding Monads
The main reason Nick presents to use `Result` over throwing exceptions is about performance. I am not going to argue that it isn't important, I am going to argue that there is much more value in using an explicit return type vs relying on exceptions. That return type is a monad. Nick does [mention](https://youtu.be/a1ye9eGTB98?t=341) that `Result` is a monad, but that is technically incorrect in the case of this type in LangExt. LangExt does utilize monads, unfortunately, `Result` is not one. I will clarify all of this shortly.

We need to talk about the M-word, Monad. Monad has attained this mythical status as an esoteric type that is only used by Functional programming gurus in Haskell. I will hopefully present monads in a very practical way that focuses on how to use them.

Further, explaining how monads work will respond to the main concerns seen in the comments. Here is a selection of comments.

> I've tried this approach in a production system. The code rapidly becomes unwieldy because you have to check the result at every exit and if the return type of the calling method is different you have to transform that result as well

> Am I the only one that finds the exception based approach easier to read and understand what is happening?[...]Once the call stack gets pretty deep, with nested object calls, it seems like you’ll have a lot of code needing to check the Result.Success to determine if it should move forward. 

>Most of the times I've seen this pattern, it had the unfortunate side effect of hiding errors and exceptions because calling code almost never does anything useful with the Result object if the result is not Success.

These are the top comments (the top voted comment is a joke about Monads, so it can be excluded). I only say this to show that these are concerns shared by many people.

I will start by saying that the comments aren't *wrong*, they just are missing/ignorant of how types like this (monads) should be used. They are absolutely correct that having to unwrap the type at every function call boundary is annoying and, even worse, a maintenance nightmare. I would immediately reject a pull request that unwraps code like the comments reference in a code base. 

The one thing I will disagree with is preferring throwing exceptions over an explicit type that accounts for errors. Exceptions should be *exceptional*. Which means something that you cannot account for or something that cannot be recovered from. The database being down is an exceptional condition. A validation exception is a routine occurrence and should be accounted for. Exceptions should **not** be used for flow control.

I want to be clear before we jump into monads. This is not a rebuttal of Nick or the commenters. This is an addendum to the video and comments. All of this highlighted that there is a misunderstanding of what monads are and how to utilize them. 

## You Already Understand Monads - And Love Them!
If you use and love LINQ, then you use and love monads. LINQ works as well as it does because it builds on how monads work. It brings monadic patterns to a language that doesn't have them built in. You already use monads almost every day. The monads I **know** you have used are `IEnumerable<T>` and `Task<T>`.

### IEnumerable is a Monad
Let's get to the practical definition of what a monad is. This will be directly applicable to `IEnumerable`. Before we get too far, this should not be taken as completely correct. Definitions and terms will be abused to fit inside of the scope of practical application and LINQ. Names have been changed to protect the innocent.

The first concept is that monads are **functors**. Keeping this in the context of LINQ, all this means is that it has `.Select()`. Select is also known as `Map`. What this means is that you can use a function to map over the data contained in the functor. Every `Select` call is a functor call.

```csharp
var list = new List<int>() { 1, 2, 3 };
var mapped = list.Select(i => i * 2);
// this will be [ 2, 4, 6 ]
```

The most important concept here is that the lambda function has no idea that it is operating on an `IEnumerable<int>`. You don't have to worry about what's in the list; you can focus completely on what you will do with the value. Mapping functions are usually small and only do one thing.

>The golden path and error path are written at the same time.

The second concept is that monads are, well, **monads**. Keeping this in the context of LINQ, all this means is that it has `.SelectMany()`. This function is also known as `FlatMap` and `Bind`. All this means is that if multiple functions have the same return type, returning another `IEnumerable` inside of an `IEnumerable`, then you can flatten the type. Instead of getting an `IEnumerable<IEnumerable<T>>` back, you will get a `IEnumerable<T>`.

```csharp
var words = new List<string>() { "one", "two", "three" };
var mapped = words.Select(w => w.ToCharArray());
// this will be [ ['o','n','e'], ['t','w','o'], ['t','h','r','e','e'] ]
// not what we wanted
var flattened = words.SelectMany(w => w.ToCharArray());
// this will be [ 'o','n','e','t','w','o','t','h','r','e','e' ]
// what we wanted
```

Without having `SelectMany` the types would continue to start stacking up. `IEnumerable` of `IEnumerable` of etc. The important concept to take out of `SelectMany` is this makes composition easier. When you have a monadic type and you need to execute a function that also returns a monad you can join them together into just one. 

That's it! Those are the only things you need to understand to utilize monads effectively. Let's move on to actually utilizing monads in code.

## How to Use Monads
Earlier I said that `Result` is not a monad, so let's use an actual monad from LangExt; the `Either` type. It takes two types and will either return `Left` or `Right`. The types here are not equal in that `Right` is considered the correct or 'right' return type. This is important. 

This type will utilize `Map` and `Bind`, but it has two types, so how does it know what to map over? It will **only** map over the `Right`. This means that we don't have to unwrap the type every time we want to use it. We can map over the type knowing that the function will only execute if an error or exception has not occured. The golden path and error path are written at the same time.

Let's look at a simple example using `Either`.

```csharp
var valid = Either<Exception, int>.Right(1);
var doubled = valid.Map(i => i * 2);
var notValid = Either<Exception, int>.Left(new Exception("This will not run"));
var notDoubled = notValid.Map(i => i * 2);
```

Every variable here has the same type. The difference is that only `doubled` will have executed the map and have a value of `Right(2)`. The other Either would not have executed the function. We have now created parallel tracks that will handle any problems that arise while **also** handling the processing of the data. 

The key is to not unwrap the monad at all. Leave the value in the wrapper(monad).

### WeatherForecast Api
The default Api that dotnet builds when using `dotnet new webapi` is the Weather Forecast Api. We will extend that to have a couple of domain rules, call an external weather Api, and introduce random errors. We will compose this entire process, all through monads.

Let's take inventory of all the rules and ways that we can invalidate the request. Which in our case will just be a zip code.

1. Blank or null string.
2. Zip Code for the center of South Bend (46601). Example domain rule.
3. 50% chance to throw an exception for no reason.
4. External Api cannot complete.
5. External Api response is null or not something we expect.

I tried to include enough different problems that the examples demonstrate the design pattern. Let's jump into code.

First let's look at the validation functions.

```csharp
public static class ZipCodeValidation
{
    public static Either<Exception, string> NotEmpty(string zipCode) => string.IsNullOrWhiteSpace(zipCode) 
        ? Either<Exception, string>.Left(new ArgumentException("Zip Code is blank", "ZipCode"))
        : Either<Exception, string>.Right(zipCode);
    
    public static Either<Exception, string> ValidateZipCode(string zipCode) => zipCode == "46601"
            ? Either<Exception, string>.Left(new ArgumentException("Zip Code cannot be South Bend", "ZipCode"))
            : Either<Exception, string>.Right(zipCode);
    
    public static Either<Exception, string> IntroduceProblems(string zipCode)
    {
        Random rand = new Random();
        bool introduceProblems = rand.Next(2) == 1;
        return introduceProblems
            ? Either<Exception, string>.Left(new Exception("Just not your time"))
            : Either<Exception, string>.Right(zipCode);
    }
}
```
All of them are simple. The key point here is that each function can be written separately as we will compose them later. We don't have to worry about how they work together now. 

Next, we will look at the code making the external Api calls. [WeatherApi.com](https://www.weatherapi.com/) will be used to get the weather data. WeatherApi has a simple process to sign up and get an api key so that you can test this code yourself.

```csharp
public static class WeatherApiExtensions
{
    public static Task<HttpResponseMessage> GetWeather(this HttpClient client, string apiKey, string zipCode) => 
        client.GetAsync($"https://api.weatherapi.com/v1/current.json?key={apiKey}&q={zipCode}");

    public static async Task<Either<Exception, T>> Deserialize<T>(this HttpResponseMessage message)
    {
        try
        {
            message.EnsureSuccessStatusCode();
            var response = await JsonSerializer.DeserializeAsync<T>(await message.Content.ReadAsStreamAsync());
            return response == null 
                ? Either<Exception, T>.Left(new NullReferenceException("Response was null"))
                : Either<Exception, T>.Right(response);
        }
        catch (HttpRequestException e) when ( e.StatusCode == HttpStatusCode.BadRequest)
        {
            var error = await JsonSerializer.DeserializeAsync<ApiError>(await message.Content.ReadAsStreamAsync());
            return Either<Exception, T>.Left(new Exception(error?.error.message));
        }
        catch (Exception e)
        {
            return Either<Exception, T>.Left(e);
        }
    }
}
```
The Api call is just GetAsync then we need to deserialize it. If the result is null, a 400 status code or any exception then wrap it up in the `Either` and return that. There is one case if the response is a 400. The response should contain an error message which we can propagate back to the caller. Note that exceptions are fully utilized here. The exceptions are handled with enough context to decide what to do. Letting Exceptions bubble up is an anti-pattern. What are you supposed to do with an Exception that is caught four layers deep? Here we handle all cases and returned them with the same type.

#### EitherAsync
`EitherAsync` is another monad type in LangExt. It makes working with `Either` and `Task` easy. Without this type, we would have to unwrap both types to utilize the value. With this type, we can easily compose asynchronous actions together. Langext has many helper functions and implicit operators to jump between `Either`, `Task`, and `EitherAsync`.

Here is a refactor of the above Api call to use `EitherAsync`.

```csharp
public static EitherAsync<Exception, T> DeserializeAsync<T>(this HttpResponseMessage message)
{
    try
    {
        message.EnsureSuccessStatusCode();
        return message.Content.ReadAsStreamAsync()
            .Bind(stream => JsonSerializer.DeserializeAsync<T>(stream))
            .Map(response => response == null
                ? throw new NullReferenceException("Response was null")
                : response);
    }
    catch (HttpRequestException e) when ( e.StatusCode == HttpStatusCode.BadRequest)
    {
        return EitherAsync<Exception, T>.LeftAsync(message.Content.ReadAsStreamAsync()
            .Bind(async stream => await JsonSerializer.DeserializeAsync<ApiError>(stream))
            .Map(error => new Exception(error?.error.message)));
    }
    catch (Exception e)
    {
        return EitherAsync<Exception, T>.Left(e);
    }
}
```

Essentially the same code as above, except the return type isn't a `Task`. We have to use composition to return the same data versus awaiting everything in the previous version. LangExt adds extension methods for `Task` so that we can treat it as a monad and use `Bind` and `Map`. The flow of the composition is: 

1. Get a stream from the Content(`Task<Stream>`) 
2. Deserialization of the Stream(`Task<T?>`). This is a task inside another task so we must Bind here. 
3. Make sure the type is not null(`Task<T>`). This is not a task so we can Map over the task. 
4. Implicit operator in LangExt to turn the task into `EitherAsync<Exception, T>`.

Not having a Task wrapping our return type will allow us to compose this function easily. This will become clear shortly.

>Every change becomes an extension of the code and not a modification. 

### Building Handlers
Finally, using the monads. The repo has an implementation of what not to do. The code unwraps each monad and then uses the value. Don't worry, I won't put it here in this post. I will share a few different ways to compose a handler for this request.

The first composition will utilize `Bind` and `BindAsync` explicitly. `BindAsync` is `Bind` using a `Task`. It isn't a 'real' monadic function, it is syntactic sugar for C#. Tasks are everywhere and they throw a wrench into the return type so LangExt has methods to help.

```csharp
public async Task<WeatherForecast> HandleBindAsync(string zipCode)
{
    return (await NotEmpty(zipCode)
            .Bind(notEmpty => ValidateZipCode(notEmpty))
            .BindAsync(async validZip =>
            {
                var apiResponse = await _client.GetWeather(_apiKey, validZip);
                return await apiResponse.Deserialize<WeatherApiData>();
            }))
        .Map(WeatherApiData.MapToForecast);
}
```
Let's step through this. The first step is to call `NotEmpty`. At this point, we have entered into monad land so we can now use the two concepts we just learned; `Map` and `Bind`. The next call is to `ValidateZipCode`. It returns an `Either`, so we will use `Bind` to make sure we have a flattened type and not an `Either<Either>`. We have a validated zip code so we make the call to the Api. This is asynchronous so we will use `BindAsync` to account for the `Task`. The final step is to map the data to another type, which we use `Map`! 

Now we will execute the same actions but we will compose our monads using LINQ! We will switch to `EitherAsync` to help with composition.

```csharp
// an implicit cast to help compose
private EitherAsync<Exception, T> CastToAsync<T>(Task<T> source) => source;

public async Task<Either<Exception, WeatherApiData>> HandleProblemsAsync(string zipCode)
{
    return await (
        from _ in IntroduceProblems(zipCode).ToAsync()
        from notEmpty in NotEmpty(zipCode).ToAsync()
        from validZip in ValidateZipCode(notEmpty).ToAsync()
        from message in CastToAsync(_client.GetWeather(_apiKey, validZip))
        from data in message.DeserializeAsync<WeatherApiData>()
        select data);
}
```

In LINQ query syntax, `from` which is `SelectMany` which is `Bind`. In addition to this `select` which is `Select` which is `Map`. LINQ operates on monads. We have built functions that return monads. Ipso facto, we can use LINQ to compose.

Look at all the functions we created and use, they are all `static`. This is a true composition of functions. Each function can be written with no knowledge of any of the others. They can all be composed at the end because they all return a **monad**. Remember, a monad can map and it can bind. Those two concepts enabled everything.

**Hold On!**

The return types between these two are not the same. The first returns `WeatherForecast` and the other returns `WeatherApiData`. *Good catch.* Let's look at the controller to glean more.

```csharp
// controller extension to turn the Either into an ActionResult
public static IActionResult ToActionResult<T>(this Either<Exception, T> result)
{
    return result
        .Match<IActionResult>(
            Right: r => new OkObjectResult(r),
            Left: e =>
            {
                var details = new ProblemDetails();
                details.Extensions.Add("errors", new[] { e.Message });
                return new BadRequestObjectResult(details);
            });
}

// in the controller
[HttpGet("WeatherBind/{zipCode}")]
public async Task<IActionResult> GetWeatherBind([FromRoute] string zipCode, [FromServices] WeatherHandler handler)
{
    return (await handler.HandleBindAsync(zipCode)).ToActionResult();
}

[HttpGet("WeatherProblems/{zipCode}")]
public async Task<IActionResult> GetWeatherProblems([FromRoute] string zipCode, [FromServices] WeatherHandler handler)
{
    return (await handler.HandleProblemsAsync(zipCode))
        .Map(WeatherApiData.MapToForecast)
        .ToActionResult();
}
```

The important part to note here is that `Map` is added in the controller endpoint. The monad can continue to be composed over the entire pipeline. We have 5 functions to compose. We can do that through 1 composition of 5 functions, or 2 compositions of 2 and 3 functions; or any combination. Monads are composable like Legos. Each one can be used separately or as part of a larger composition. 

Let's say we have another endpoint that requires the data to be a different output type. We can utilize the same handler and then `Map` to the other type. 

Let's say that we have a special validation on one endpoint (please don't do this. This is bad design.), we can compose the call to the handler with the other validation. 

Every change becomes an extension of the code and not a modification. This is the cleanest way to implement Open/Closed Principle from SOLID.

## Summary
Monads are just a compositional tool. They are a way to take a value and operate on that value with functions. Each function can either have no idea it is being used with a monad (`Map`) or it knows about the monad and returns that specific monad(`Bind`). There is more to this, but understanding this will allow you to use monads to write clear, extensible, maintainable, and less code.