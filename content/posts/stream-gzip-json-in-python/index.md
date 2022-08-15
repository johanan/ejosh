---
title: "Stream a Massive Gzipped Json File in Python"
date: 2022-08-14T20:27:14-04:00
tags:
    - python
---
I found myself with the problem of having to process massive JSON files that were gzipped. The files were 6.8GB gzipped and over 50GB un-gzipped (de-gzipped?).

I found myself here because a new regulatory requirement called "Transparency in Coverage" that took effect on [July 1, 2022](https://www.cms.gov/healthplan-price-transparency) for Insurance companies to post pricing information that is machine readable. There is a guide with examples out on [GitHub](https://github.com/CMSgov/price-transparency-guide). Unfortunately the examples in no way reflect the actual size of the data.

## .NET JsonConverter
I primarily develop with C# so the first crack I took at parsing the file was with .NET. I had hoped to just use a custom JsonCoverter using `System.Text.Json`. I already knew you could pass a stream into converters and I was hoping to piggyback off of that.

This did **not** work. Before looking into this I had not needed to really dive into the guts of how the JsonConverters worked. While a stream can be passed in, the actual parsing isn't done by reading in a chunk at a time and processing. In my searches I found this [StackOverflow](https://stackoverflow.com/questions/58572524/asynchonously-deserializing-a-list-using-system-text-json) question and this [GitHub issue](https://github.com/dotnet/runtime/issues/30328) that made clear this wasn't possible with `System.Text.Json`.

To be clear, I was not expecting to just call a method and get the data out. I did expect to have write something that processes the tokens coming out of the file and spit out a parsed object. I just did not expect that I would have to implement the stream reader to do that. Quoting the StackOverflow answer:

>**TL;DR** It's not trivial
>
>-Panagiotis Kanavos

Quick Note: I am aware of [JsonSerializer.DeserializeAsyncEnumerable](https://docs.microsoft.com/en-us/dotnet/api/system.text.json.jsonserializer.deserializeasyncenumerable?view=net-6.0). This would do what I needed in one method call, except it can only process an array at the root of JSON. It cannot parse an array when it is a property of an object. Which the schema necessitates. 

## Python
My next thought was to check out Python to see if there was anything I could use. I do not work in Python on a daily basis so I had to do some digging and understanding of what I was trying to do. I was able to find a solution that involved a small tweak to get working. Here is what I was able to put together.

First I was able to find a library that parsed a JSON file as it read it. Even more than that you can point it at an array in the middle of the schema and asynchronously get each item out. Exactly what I needed!. The library is [ijson](https://pypi.org/project/ijson/). Specifically you can do this: `async for item in ijson.items(f, 'earth.europe.item')`. Where `f` is a file-like asynchronous object. Which you can do with [aiofiles](https://pypi.org/project/aiofiles/).

Now the tricky part. This will work great with a JSON file, but what about a gzipped JSON file? Essentially you need a pipeline. Read a chunk of the raw gzipped data > Decompress it > give it to ijson to parse. This may be my inexperience with Python as I could not find an idiomatic way to do this. So I made a way to do it.

I essentially overrode the read method of the asyncronous file and decompressed the data there. Here are some snippets of what I did:

```python
def decompress(self, bytes):
    decompressed = self.d.decompress(bytes)
    data = b''
    while self.d.unused_data != b'':
        buf = self.d.unused_data
        self.d = zlib.decompressobj(zlib.MAX_WBITS|16)
        data = self.d.decompress(buf)
    return decompressed + data

def read(self, self_read):
    self.d = zlib.decompressobj(zlib.MAX_WBITS|16)
    async def wrapped(__size: int = ...):
        compressed = await self_read(__size)
        data = decompress(self, compressed)
        return data
    return wrapped

async def read_gzip(file_name):
    f = await aiofiles.open(file_name, mode='rb')
    f.read = read(f, f.read)
    return f
```

Let's walk through this. First open the file in binary mode then immediately overwrite the `read` method with our own `read` method. That method will save the current `read`, so we can use it to actually get the data, and run it through `decompress`. This uses the builtin `zlib` to decompress the data. At this point we should now have a string. This file can be directly given to ijson to start parsing. 

The check for unused data is also key as gzipped files can have multiple files concatenated all together in one gzip. If you do not check for this ijson will complain about an unexpected EOF. 

At this point you can write scripts and functions to parse the data in the files. You do not even have to unzip the file as it will be done on the fly as the file is read.
