node/redis autocomplete
=======================

I'm just trying to get a handle on node and redis.  Please don't expect this to
be worth much more than a learning example.

Summary
-------

Antirez posted this [nice gist](http://gist.github.com/574044), which shows how to
make search tries in redis.

I found j4mie's [translation of the same to
python](https://gist.github.com/577852), which I extended to [allows for
multi-word searches](https://gist.github.com/925979).

After that, I put together this little node.js app, which has the following
components:

- A front-end with backbone models for searching and displaying results
- A `completer.js` that provides multi-word completion via redis
- An app that lets the front-end communicate with completer via now.js

In the `data` directory is a file containing a little over 1000 tweets.  (These
tweets are mashups of Kanye West + Victor Medvedev and Martha Stewart + Lady
Gaga, provided by my [markov-tweeter](https://github.com/jedp/markov-tweeter).)

When you run `app.js`, it will make sure these have been processed and shoved
into redis.  This may take a few moments.

On the web page, start typing, and hopefully we'll see a real-time search for
tweets.  





