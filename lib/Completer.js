'use strict';

const fs = require('fs');

const _ = require('underscore');

const helpers = require('./helpers');

// Prefixes for redis sets. This is used in order to namespace
// the keys in redis and not conflict with other autocomplete
// features.
class Completer {
  constructor(namespace, redis) {
    this.redis = redis;
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
  _getWordCompletions(word, count, callback) {
    const rangelen = 50;

    const termToSearch = word.toLowerCase().trim();
    let results = [];

    if (!termToSearch) {
      return callback(null, results);
    }

    this.redis.zrank(this.zkey_autocomplete, termToSearch, (err, start) => {
      if (err) {
        return callback(err);
      } else if (!start && typeof start !== 'number') {
        return callback(null, results);
      }

      this.redis.zrange(this.zkey_autocomplete, start, start + rangelen - 1, (err, entries) => {
        // Return there are no entries at all
        if (!entries || entries.length === 0) {
          return callback(null, results);
        }

        results = helpers.findWordCandidates(termToSearch, entries, count);

        return callback(null, results);
      });
    });
  }

  // when getting phrase completions, we should find a fuzzy match for the last
  // word, but treat the words before it as what the user intends. So for
  // instance, if we get "more pie", treat that as "more* pie"
  _getPhraseCompletions(phrase, count, callback) {
    phrase = phrase.toLowerCase().trim();

    // tag all words but last as 'exact' matches
    phrase = phrase.replace(/(\w)\s+/g, "$1\* ");

    const prefixes = phrase.split(/\s+/);
    let resultList = [];
    let semaphore = 0;

    // Iterate over all the words of the phrase that the user is searching
    prefixes.forEach((prefix) => {
      this._getWordCompletions(prefix, count, (err, results) => {
        if (err) {
          return callback(err, []);
        }

        resultList = [...results, ...resultList];

        semaphore++;
        if (semaphore === prefixes.length) {
          return callback(null, resultList);
        }

      });
    });
  }

  search(phrase, count, callback) {
    count = count || 10;

    callback = callback || function() {};

    this._getPhraseCompletions(phrase, count, (err, completions) => {
      if (err) {
        return callback(err, null);
      }

      const keys = helpers.generateDocNames(this.zkey_docs_prefix, completions);

      if (!keys.length) {
        return callback(null, []);
      }

      let results = [];
      let semaphore = 0;

      keys.forEach((key) => {
        this.redis.zrevrangebyscore(key, 'inf', 0, 'withscores', 'LIMIT', 0, count, (err, docs) => {
          if (err) {
            return callback(err, results);
          }

          // docs is a list of [doc, score, doc, score ...]
          let filteredDocs = helpers.filterOutTheScore(docs);

          results = [...results, ...filteredDocs];

          semaphore++;
          if (semaphore === keys.length) {
            return callback(null, results);
          }
        });
      });

    });
  }
}

module.exports = Completer;
