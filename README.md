redis-autosuggest for node.js
===========================

Installation
-------------

`npm install redis-autosuggest`

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

    > importer.addCompletions(text, id, score);
    > importer.addCompletions(text, id, score);

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

Shops example - importer
-------------------------

Assuming a CSV with stores:
- 1,Virgin Active
- 2,Action Store
- 3,Acton Shoes
- 4,Active Boots

The importer will insert into the shops:autocomplete sorted set values like that:
- 0 acton*
- 0 acton
- 0 acto
- 0 active*
- 0 active
- 0 activ
- 0 action*
- 0 action
- 0 actio
- 0 acti
- 0 act

At the same time for each one of the starred values above we are creating another set that will include the exact phrases. For example, the shops:docs:active set will include the phrase:
0 1:Virgin Active
0 4:Active Boots

Shops example - search
-------------------------

Having a term like 'act' the results that we should get back are:
- 1:Virgin Active
- 2:Action Store
- 3:Acton Shoes
- 4:Active Boots

Getting the term 'act' we are getting from shops:autocomplete sorted set the results from the act and the next 50. We will iterate over these results and we will keep only the ones that they end up with a star ( * ). The terms that they end with a star we know that there is another set (e.g. shops:docs:active, shops:docs:acton, shops:docs:action) that will hold all the phrases that matched this starred term. We do this for all the starred terms that we found in the shops:autocomplete and finally we end up with a set of phrases. This is what we give back as a response.
