redis-autosuggest for node.js
===========================

Installation
-------------

`npm install redis-completer`

Usage
-----

There are two subprojects within this project. These are the completer and the importer. The constructor of the Importer and the Completer must get two mandatory parameters. The first parameter ('shops' in the example above) is the namespace that the search terms will save and the second one is the redis connection. 

Importer
---------
Get an importer and provide a unique namespace that the terms will save:

    $ node
    > const Importer = require('redis-autosuggest/lib/Importer');
    > const importer = new Importer('shops', redis);
    > importer.addFromFile(`${__dirname}/shops.csv`);

Add completions for a document:

    > completer.addCompletions(text, id, score);
    > completer.addCompletions(text, id, score);

`id` and `score` are optional.  If `id` is `null`, it will be ignored.

If an `id` is provided, it will be concatenated with `text` in the final lookup
table making a compound key of the form `id:text`. The idea here is to give you
a way to stash a database key and a chunk of text together, so you can find
your way back to some document you have stored elsewhere.  E.g., if you're
auto-completing a search by title, you could use the key to help retrieve the
entire document.

Completer
---------
Get a completer and provide a unique namespace for your app:

    $ node
    > const Completer = require('redis-autosuggest');
    > const completer = new Completer('shops', redis);
    > completer.search('Zara');
    
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
