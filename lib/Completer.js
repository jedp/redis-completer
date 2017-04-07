'use strict';

const fs = require('fs');

const redis = require('redis').createClient();
const _ = require('underscore');

// Prefixes for redis sets. This is used in order to namespace
// the keys in redis and not conflict with other autocomplete
// features.
class Completer {
  constructor(namespace) {
    this.namespace = namespace;
    this.zkey_autocomplete = 'autocomplete';
    this.zkey_docs_prefix = 'docs:';

    if (this.namespace) {
      this.zkey_autocomplete = `${this.namespace}:autocomplete`;
      this.zkey_docs_prefix = `${this.namespace}:docs:`;
    }
  }

  // @todo: review the delete all
  // deleteAll(callback) {
  //   redis.zremrangebyrank(this.zkey_autocomplete, 0, -1, callback);
  // }

  // get up to count completions for the given word
  // if prefix ends with '*', get the next exact completion
  getWordCompletions(word, count, callback) {
    const rangelen = 50;

    const termToSearch = word.toLowerCase().trim();
    const getExact = word[word.length - 1] === '*';
    const results = [];

    if (!termToSearch) {
      return callback(null, results);
    }

    redis.zrank(this.zkey_autocomplete, termToSearch, (err, start) => {
      if (err) {
        return callback(err);
      } else if (!start && typeof start !== 'number') {
        return callback(null, results);
      }

      redis.zrange(this.zkey_autocomplete, start, start + rangelen - 1, (err, entries) => {
        // Return there are no entries at all
        if (!entries || entries.length === 0) {
          return callback(null, results);
        }

        entries.forEach((entry) => {
          const minLen = Math.min(entry.length, termToSearch.length);

          if (entry.slice(0, minLen) !== termToSearch.slice(0, minLen)) {
            return callback(null, results);
          }

          if (entry[entry.length - 1] === '*') {
            results.push(entry.slice(0, -1));
            if (getExact) {
              return callback(null, results);
            }
          } else if (results.length >= count) {
            return callback(null, results);
          }
        });

        return callback(null, results);
      });
    });
  }

  // when getting phrase completions, we should find a fuzzy match for the last
  // word, but treat the words before it as what the user intends.  So for
  // instance, if we get "more pie", treat that as "more* pie"
  getPhraseCompletions(phrase, count, callback) {
    phrase = phrase.toLowerCase().trim();

    // tag all words but last as 'exact' matches
    phrase = phrase.replace(/(\w)\s+/g, "$1\* ");

    const prefixes = phrase.split(/\s+/);
    const resultSet = {};
    let semaphore = 0;

    prefixes.forEach((prefix) => {
      this.getWordCompletions(prefix, count, (err, results) => {
        if (err) {
          return callback(err, []);
        }

        results.forEach((result) => {
          // intending this to be a set, so we only
          // add each result once
          resultSet[result] = result;
        });

        semaphore++;
        if (semaphore === prefixes.length) {
          // map set back to list
          const resultList = _.map(resultSet, (val, key) => {
            return key;
          });

          return callback(null, resultList);
        }

      });
    });
  }

  search(phrase, count, callback) {
    // @callback with up to @count matches for @phrase
    count = count || 10;

    callback = callback || function() {};

    this.getPhraseCompletions(phrase, count, (err, completions) => {
      if (err) {
        return callback(err, null);
      }

      const keys = _.map(completions, (key) => {
        return this.zkey_docs_prefix + key
      });

      if (!keys.length) {
        return callback(null, []);
      }

      const results = {};
      let semaphore = 0;

      // accumulate docs and the scores for each key
      keys.forEach((key) => {
        redis.zrevrangebyscore(key, 'inf', 0, 'withscores', (err, docs) => {
          // returns a list of [doc, score, doc, score ...]
          semaphore++;
          if (err) {
            return callback(err, {});
          } else {
            let doc;
            while (docs.length > 0) {
              doc = docs.shift();

              const score = parseFloat(docs.shift());
              const prevScore = typeof results[doc] !== 'undefined' && results[doc] || 0;

              results[doc] = score + prevScore;
            }
            // credit for more overall matches
            results[doc] += count * keys.length;
          }

          if (semaphore === keys.length) {
            // it's annoying to deal with dictionaries in js
            // turn it into a sorted list for the client's convenience
            let key;
            const ret = [];

            for (key in results) {
              ret.push(key);
            }

            ret.sort((a, b) => {
              return results[b] - results[a]
            });

            return callback(null, ret);
          }

        });
      });

    });
  }
}

module.exports = Completer;
