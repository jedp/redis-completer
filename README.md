node/redis autocomplete
=======================

I'm just trying to get a handle on node and redis.  Please don't expect this to
be worth much more than a learning example.

Overview
--------

In the `data` directory is a file containing a little over 1000 tweets.  (These
tweets are mashups of Kanye West + Victor Medvedev and Martha Stewart + Lady
Gaga.)

When you run `app.js`, it will make sure these have been processed and shoved
into redis.  This may take a few moments.

On the web page, start typing, and hopefully we'll see a real-time search for
tweets.  



