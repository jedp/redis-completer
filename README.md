redis-completer for node.js
===========================

An implementation of antirez's
[http://gist.github.com/574044](http://gist.github.com/574044) for node.js.

Installing
----------

`npm install redis-completer`

Usage
-----

Get a completer and provide a unique namespace for your app:

    $ node
    > completer = require('redis-completer');
    > completer.applicationPrefix('winning');

That prefix prevents key conflics in redis.  Make sure you use a prefix for
each project.

Add completions for a document:

    > completer.addCompletions(text, id, score);

`id` and `score` are optional.  If `id` is `null`, it will be ignored.

If an `id` is provided, it will be concatenated with `text` in the final lookup
table making a compound key of the form `id:text`. The idea here is to give you
a way to stash a database key and a chunk of text together, so you can find
your way back to some document you have stored elsewhere.  E.g., if you're
auto-completing a search by title, you could use the key to help retrieve the
entire document.

Completions are sorted by score, so use that to weight documents you want to
show up first.

Here's an example showing show score is reflected in search results:

    > // adding completions:    text              id  score
    > completer.addCompletions("Have some pie",    1,    42);
    > completer.addCompletions("Have some quiche", 2,     6);
    > completer.addCompletions("I prefer quiche",  3,    99);

    > // convenience to print results
    > function print(err, results) { console.log(results) }

    > completer.search("have", 10, print);
    [ '1:Have some pie', '2:Have some quiche' ]
    > completer.search("quiche", 10, print);
    [ '3:I prefer quiche', '2:Have some quiche' ]

It's up to me to remember that I used a `key` and deal with that when I process
the text.

When multi-word phrases are matched, the scores for matches accumulate.  For
example:

    > completer.addCompletions("something borrowed", 'one',  6);
    > completer.addCompletions("something blue",     'two', 10);

    // most valuable match first
    > completer.search("some", 10, print);
    [ 'two:something blue', 'one:something borrowed' ]

    // most valuable match after accumulating scores first
    > completer.search("something borr", 10, print);
    [ 'one:something borrowed', 'two:something blue' ]


Summary
-------

Sebastian Sanfilippo posted this [really neat gist](http://gist.github.com/574044),
which shows how to make search tries in redis for fast search completers.

I found j4mie's [translation of the same to
python](https://gist.github.com/577852), which I extended to [allows for
multi-word searches](https://gist.github.com/925979).

This is another translation of those examples for node.js.  It has the
following components:

- A front-end with backbone models for searching and displaying results
- A `completer.js` that provides multi-word completion via redis
- An example app that lets the front-end communicate with completer via now.js

In the `example/data` directory is a file containing a little over 1000 tweets.
(These tweets are mashups of Kanye West + Victor Medvedev and Martha Stewart +
Lady Gaga, produced by my 
[markov-tweeter](https://github.com/jedp/markov-tweeter).)

When you run `example/app.js`, it will make sure these have been processed and
shoved into redis.  This may take a few moments to complete, but it happens
asynchronously, so you can start using the app right away.

On the web page, start typing, and hopefully we'll see a real-time search for
tweets.  



