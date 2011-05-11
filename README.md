redis-completer for node.js
===========================

An implementation of antirez's
[http://gist.github.com/574044](http://gist.github.com/574044) for node.js.

Installing
----------

`npm install redis-completer`

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

To Do
-----

- use a ZSET to rank results (they're in random order now)


