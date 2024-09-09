---
title: "ORMs Are the Wrong Abstraction"
date: 2024-08-13T22:06:16-04:00
github: https://github.com/johanan/no-orm-api
draft: true
---

If I had to sum up the last few years of this blog and work is that abstractions matter. Finding the correct abstraction makes all the other concerns around software development and platform building easier to handle. The main problem is that it is difficult to see what really matters when starting a project. It is very easy to focus on features and all the things you *can* do without really trying to determine if those things are important to solving the problem. It is rarely clear what the abstractions are and how to apply them to what you are building.

This is just a long way round of saying ORMs are the wrong abstraction. 

I am not the first person to make a post about this. Many more influential people have written about this. There is a well-know article about the problems with ORMs: https://web.archive.org/web/20220823105749/http://blogs.tedneward.com/post/the-vietnam-of-computer-science/. It is an older article, but I think many of the issues around the core abstraction of what an ORM is doing still apply today.

I am not saying that ORMs are always bad and should never be used. My recommendation is to not roll your own quasi-ORM. This just mutliplies the problem because this new quasi-ORM will not have fully explored the full problem domain and there will refactors and issues in the future.[^1] 

## Better Abstractions
These are the abstractions that I have found that are simpler than using an ORM.

**Immutable Data**. The first key point is to treat the data as the starting point of a process that has the side effect of being persisted back to a database. The data in memory should not be viewed as a mutable extension of the database row. Most ORMs are in the mutation business. They are trying to be idiomatic to the language they are written in. Most object oriented languages encourage mutation to update objects, so this makes sense ORMs do this. This also ties everything back to **that** object. This might be very EF Core specific, but I know that many issues around identity and attachment to the correct context can arise. Even when you know about these problems.[^2]

Instead, map the data coming out of the database to a readonly struct, an object with private setters, a record, or whatever type fits this space. Technically this does not have to be immutable, just that it is not a tracked object back to the database. 

The goal here is to have data completely processed in memory and then it just happens to be saved to a database. The data processing functions should be unit testable without a database. I do not mean a mocked database, I mean no database at all. 

**Relations are mapped in SQL**. We have discussed objects and mapping, but how do we map all the relationships between what is in the application and what is in the database? Use SQL. SQL is a powerful and expressive language that allows the modeling of any relationships needed. Whatever the application is, it will not outgrow SQL. Using an ORM to not have to write SQL is a poor reason to use an ORM.

The hardest part is finding the lines of what objects to model and how to model them. There is a spectrum between each table being mapped one to one to objects and an indefinite amount of tables mapping to one object. There is no secret here. It takes an understanding of the problem and how it is modeled to find the correct path. This mapping issue exists whether or not an ORM is involved. Although ORMs usually lean towards the former and then replicate SQL in their own way to define relationships and query.

**Thin Mapping Layer**. This idea is an extension of both abstractions above. Almost every language should have something in the standard library or a package to take a SQL statement and turn it into an object or array of objects and run a statement that does not return anything/returns the number of rows updated. Honestly that is all that is needed. A library that gets out of the way and runs queries.

**Inserts/Updates as a side effect**.

This works both ways. Updating a property should not automatically equal that column being updated in the database. And running a database operation should not update the object. Think of getting an id from the database after inserting. Here is a Mark Seamann post around this: https://blog.ploeh.dk/2014/08/11/cqs-versus-server-generated-ids/.





- Most ORMs build to the same abstractions
    - Queries expressed in the syntax of the language. Linq in EF Core or django's ORM
    - Mapping of tables and relations to objects and data types.
    - Because RDBMS are very robust even these two abstractions require an immense amount of code and modeling. Meaning you write to the ORM and the complexities of that ORM.
- ORMs are great and EF Core is one of the best. Use it, but here are the abstractions we use that have moved us away from EF Core.
- Better abstractions
    - immmutable data. Many ORMs utilize mutability to track changes and allow updates. Getting data will return an immutable record that includes identifying columns (if needed). Sometimes you just need the data to read
    - https://blog.ploeh.dk/2014/08/11/cqs-versus-server-generated-ids/
    - SQL is a great abstraction already. It is declarative and expressive. You can query and model anything you would ever need in SQL. Anything else is less than SQL. It is another language to learn, but so is the ORM's query syntax. I do concede that ORM's are more idiomatic to the language you are using.
    - Thin mapping layer. Mapping always needs to be solved. Find something that quickly and simply turns a row of data into an object or record. For .NET this is Dapper. I am not sure about other languages, but you want something that needs minimal configuration. SQL Query -> Record.
    - Simple abstraction on how to execute queries. You really only need something that allows you to get data or execute a command. Implicit in this is the ability to bind parameters to the query. Not string replacement, actual parameterized queries. This in .NET is again Dapper. This also presents as a db connection.
    - Functions that insert data without returning anything or binding data back to the object. Think of saving to the database as a side effect of processing the data. This means no server gernerated ids. Or at least ids that are not needed.

You are building a simple data pipeline:
HTTP endpoint with a lookup value -> get data and map to immutable record -> functions that take the record and return a new updated immutable record -> return this new record from the endpoint*

*(Save to db before returning)

Here are examples in F# on how to build this.

Implementation details
Connection string is in the config/envrionment. Function that returns an db connection or transaction.

## Testing
So how do you test if you don't abstract.  EF Core has in memory or sqlite versions. 

Spin up a specific instance of your actual db and run tests against that. 

Remember the pipeline. You can test your logic with functions that take and return immutable data. Then you can easily test the SQL logic with a couple of full loop API calls.

[^1]: If you know the limitations of the ORM you are using and what your application needs, then create a new ORM. Think Dapper built by Stack Overflow to solve their specific problems. https://samsaffron.com/archive/2011/03/30/How+I+learned+to+stop+worrying+and+write+my+own+ORM
[^2]: Is the problem that I don't fully understand EF Core? Probably. It is a massive library that does a lot of things. And that is kinda the point I am making here.