---
title: "Dont throw exceptions in CSharp use Monads"
date: 2022-07-14T18:08:38-04:00
draft: true
---
Nick Chapsas recently released a great video "Don't throw exceptions in C#. Do this instead". The quick summary is to not throw the exceptions, but to use the `Result` type from [LangExt](https://github.com/louthy/language-ext). Nick makes great videos, but there are a few things I want to correct/add to and respond to concerns from the comments.

Before we go any further, I **LOVE** LangExt. I consider it a must install in any project. It literally is an extension of C#.

{{< lite-youtube a1ye9eGTB98 >}}

## Misunderstanding Monads
The main reason Nick presents to use `Result` over throwing exceptions is about performance. I am not going argue that it isn't important, I am going to argue that there is much more value in using an explicit return type vs relying on exceptions. That value is in using a monad as the return. Nick does [mention](https://youtu.be/a1ye9eGTB98?t=341) that `Result` is a monad, but that is technically incorrect in the case of this type in LangExt. LangExt does utilize monads, unfortunately this is not one. I will clarify all of this shortly.

We need to talke about the M-word, Monad. Monad has attained this mythical status as an esoteric type that is only used by Functional programming gurus in Haskell. I will hopefully present monads in a very practical way that focuses on how to use them.

Further, explaining how monads work actually responds to the main concerns seen in the comments. Here is a selection of comments.

> I've tried this approach in a production system. The code rapidly becomes unwieldy because you have to check the result at every exit and if the return type of the calling method is different you have to transform that result as well

> Am I the only one that finds the exception based approach easier to read and understand what is happening?[...]Once the call stack gets pretty deep, with nested object calls, it seems like you’ll have a lot of code needing to check the Result.Success to determine if it should move forward. 

>Most of the times I've seen this pattern, it had the unfortunate side effect of hiding errors and exceptions because calling code almost never does anything useful with the Result object if the result is not Success.

These are the top comments (the top voted comment is a joke about Monads, so it can be excluded). I only say this to show that these are concerns shared by many people.

I will start by saying that the comments aren't *wrong*, they just are missing/ignorant of how types like this (monads) should be used. They are absolutely correct that having to unwrap the type at every function call boundary is annoying and, even worse, a maintaince nightmare. I would immediately reject a pull request that unwraps code like the comments reference in a code base. 

The one thing I will disagree with is preferring throwing exceptions over an explicit type that accounts for errors. Exceptions should be *exceptional*. Which means something that you cannot account for or something that cannot be recovered from. The database being down is an exceptional condition. A validation exception is a routine occurence and should be accounted for.

## You Already Understand Monads - And Love Them!
If you use and love LINQ, then you know and love monads. LINQ works as well as it does because it builds on how monads work. It brings monadic patterns to a language that doesn't have them built in. You already use monads almost every day. The monads I **know** you have used are `IEnumerable<T>` and `Task<T>`.

### IEnumerable is a Monad
Let's get to the practical definition of what a monad is. This will be directly applicable to `IEnumerable`. Before we get to far, this should not be taken as completely correct. Definitions and terms will be abused to fit inside of the scope and concept of LINQ. 

First concept is that monads are **functors**. Keeping this in the context of LINQ, all this means is that it has `.Select()`. That's it. Select can also be thought of as `Map`. What this means is that you can use a function that maps over the data contained in the functor. Every `Select` call is a functor call.

```csharp
var list = new List<int>() { 1, 2, 3 };
var mapped = list.Select(i => i * 2);
// this will be [ 2, 4, 6 ]
```

Simple and arbitrary example, but I will highlight the most important part. Which is that the lambda function has no idea that it is operating on an `IEnumerable<int>`. You don't have to worry about what's in the list; you can focus completely on what you will do with the value. Functions are usually small and do one thing.

>The golden path and error path are written at the same time.

The second concept is that monads are, well, **monads**. Keeping this in the context of LINQ, all this means is that it has `.SelectMany()`. This function is also known as `FlatMap` and `Bind`. All this means is that if the return type of a function is the same as this type, think returing another `IEnumerable`, then you can flatten the type. Instead of getting an `IEnumerable<IEnumerable<int>>` back you will get a `IEnumerable<int>`.

```csharp
var words = new List<string>() { "one", "two", "three" };
var mapped = words.Select(w => w.ToCharArray());
// this will be [ ['o','n','e'], ['t','w','o'], ['t','h','r','e','e'] ]
// not what we wanted
var flattened = words.SelectMany(w => w.ToCharArray());
// this will be [ 'o','n','e','t','w','o','t','h','r','e','e' ]
// what we wanted
```

Without having `SelectMany` the types would continue to start stacking up. `IEnumerable` of `IEnumerable` of etc. The important concept to take out of this is this makes composition easier. When you have a Monadic type and you need to execute a function that also returns a monad you can join them together into just one. 

That's it! Those are the only things to understand to utilize monads effectively. Let's move on to actually utliziing monads in code.

## How to Use Monads
Earlier I said that `Result` is not a monad, so let's use an actual monad from LangExt and that is the `Either` type. It takes two types and will either return `Left` or `Right`. The types here are not equal in that `Right` is consider the correct or right return type. This is important. This type will utilize `Map` and `Bind`, but it has two types, so how does it know what to map over? It will **only** map over the `Right`. This means that we don't have to unwrap the type everytime we want to use it. We can map over the type knowing that the function will only execute if an error or exception occured. The golden path and error path are written at the same time.

Let's look at a simple example using `Either`.

```csharp
var valid = Either<Exception, int>.Right(1);
var doubled = valid.Map(i => i * 2);
var notValid = Either<Exception, int>.Left(new Exception("This will not run"));
var notDoubled = notValid.Map(i => i * 2);
```

Every variable has the same type. The difference is that only `doubled` will have executed the map and have a value of 2. The other Either would not have executed the double function. We have now created parallel tracks that will handle any problems that arise while **also** handling the processing of the data. Without unwrapping the monad at all. Leave the value in the wrapper(monad).

### WeatherForecast Api
The default Api that dotnet builds when using `dotnet new webapi` is the Weather Forecast Api. We will extend that to have a couple of domain rules, call an external weather Api, and introduce random errors. All through monads.

The first thing we have to take inventory of is all the rules and ways that we can invalidate the request. Which in our case will just be a zip code.
1. Blank or null string.
2. Zip Code for the center of South Bend (46601). Shows we can build rules however we want.
3. 50% chance to throw an exception for no reason.
4. External Api cannot complete.
5. External Api response is null or not something we expect.

I tried to include enough different problems that the examples really demonstrate the design pattern. Let's jump into code.

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

Next, we will make the external Api calls. [WeatherApi.com](https://www.weatherapi.com/) will be used to get the data to return. It's simple to sign up and get an Api key.

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
A little more going on, but still straight forward. Essentially take the `HttpResponseMessage` and deserialize it. If the result is null, a 400 status code, or any exception then wrap it up in the `Either` and return that. Note that exceptions are fully utilized here. The exceptions are handled with enough context to make a descision about what to do. Letting Exceptions bubble up is an anti-pattern. What are you supposed to do with an Exception that is caught four layers deep? Here we handle all cases and returned with the same type.

>Every change becomes an extension of the code and not a modification. 

### Building Handlers
Finally, using the monads. The repo has an implementation of what not to do. The code unwraps each monad and then uses the value. Don't worry, I won't put it here in this post. I will share a few different ways to compose a handler for this request.

The first composition will utilize `Bind` and `BindAsync` explicitly. `BindAsync` is `Bind` using a `Task`. It isn't a 'real' monadic function, it is syntactic sugar for C#. `Task`s are everywhere and they throw a wrench into the return type so LangExt has methods to help.

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

And lastly, we will compose our monads, the type is now `EitherAsync` which fits better as the process is a `Task`, using LINQ!

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
LINQ operates on monads. We have built functions that all return monads. Ipso facto, we can use LINQ to compose.

Look at all the functions we use here, they are all `static`. This is a true composition of functions that are concerned with doing one thing. They can all be composed at the end because they all return a **monad**. Remember, a monad can map and it can bind. Those two rules allow the code here.

**Hold On!**

The return types between these two are not the same. The first returns `WeatherForecast` and the other returns `WeatherApiData`. Good catch. Let's look at the controller to glean more.

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

The important part to note here is that `Map` is added at controller endpoint. The monad can continue to be composed over the entire pipeline. 

Let's say we have another endpoint that requires the data to be a different output type. We can utilize the same handler and then `Map` to the other type. 

Let's say that we have a special validation on one endpoint (please don't do this. This is bad design.), we can compose the call to the handler with the other validation. 

Every change becomes an extension of the code and not a modification. This is the cleanest way to implement Open/Closed Principle from SOLID.