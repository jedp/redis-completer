var redis = require('redis').createClient();
var _ = require('underscore');
var fs = require('fs');

// prefixes for redis sets
// use applicationPrefix() to set the initial prefix
function Completer(prefix) {
  this.prefix = prefix;
  this.ZKEY_COMPL = 'compl';
  this.ZKEY_DOCS_PREFIX = 'docs:';

  if (this.prefix) {
    this.ZKEY_COMPL = this.prefix + ':' + 'compl';
    this.ZKEY_DOCS_PREFIX = this.prefix + ':' + 'docs:';
  }
}

Completer.prototype.deleteAll = function(cb) {
  // clear all data
  redis.zremrangebyrank(this.ZKEY_COMPL, 0, -1, cb);
}

Completer.prototype.addCompletions = function(phrase, id, score, cb) {
  // Add completions for originalText to the completions trie.
  // Store the original text, prefixed by the optional 'key'
  if (typeof score === 'function') {
    cb = score;
    score = null;
  }

  var self = this;

  var text = phrase.trim().toLowerCase();
  if (!text) {
    return null, null;
  }

  if (id !== null) {
    phraseToStore = id + ':' + phrase;
  } else {
    phraseToStore = phrase;
  }

  _.each(text.split(/\s+/), function(word) {
    for (var end_index = 1; end_index <= word.length; end_index++) {
      var prefix = word.slice(0, end_index);
      redis.zadd(self.ZKEY_COMPL, score || 0, prefix, cb);
    }
    redis.zadd(self.ZKEY_COMPL, score || 0, word + '*', cb);
    redis.zadd(self.ZKEY_DOCS_PREFIX + word, score || 0, phraseToStore, cb);
  });
}

Completer.prototype.addFromFile = function(filename) {
  var self = this;

  // reads the whole file at once
  // no error-checking. just cross your fingers.
  fs.readFile(filename, function(err, buf) {
    if (err) {
      return console.log("ERROR: reading " + filename + ": " + err), null;
    }
    _.each(buf.toString().split(/\n/), function(s) {
      self.addCompletions(s);
    });
  });
}

// get up to count completions for the given word
// if prefix ends with '*', get the next exact completion
Completer.prototype.getWordCompletions = function(word, count, callback) {
  var self = this;

  var rangelen = 50;

  var termToSearch = word.toLowerCase().trim();
  var getExact = word[word.length - 1] === '*';
  var results = [];

  if (!termToSearch) {
    return callback(null, results);
  }

  redis.zrank(self.ZKEY_COMPL, termToSearch, function(err, start) {
    if (!start) {
      return callback(null, results);
    }

    redis.zrange(self.ZKEY_COMPL, start, start + rangelen - 1, function(err, entries) {
      while (results.length <= count) {

        // Break the iteration if there are no entries at all
        if (!entries || entries.length === 0) {
          break;
        }

        entries.forEach(function(entry) {
          var minlen = Math.min(entry.length, termToSearch.length);

          if (entry.slice(0, minlen) !== termToSearch.slice(0, minlen)) {
            return callback(null, results);
          }

          if (entry[entry.length - 1] === '*' && results.length <= count) {
            results.push(entry.slice(0, -1));
            if (getExact) {
              return callback(null, results);
            }
          }
        });
      }

      return callback(null, results);
    });
  });
}

// when getting phrase completions, we should find a fuzzy match for the last
// word, but treat the words before it as what the user intends.  So for
// instance, if we get "more pie", treat that as "more* pie"
Completer.prototype.getPhraseCompletions = function(phrase, count, callback) {
  var self = this;

  phrase = phrase.toLowerCase().trim();

  // tag all words but last as 'exact' matches
  phrase = phrase.replace(/(\w)\s+/g, "$1\* ");

  var prefixes = phrase.split(/\s+/);
  var resultSet = {};
  var iter = 0;

  _.each(prefixes, function(prefix) {
    self.getWordCompletions(prefix, count, function(err, results) {
      if (err) {
        callback(err, []);
      } else {
        _.each(results, function(result) {
          // intending this to be a set, so we only
          // add each result once
          resultSet[result] = result;
        });
      }
      iter++;

      if (iter === prefixes.length) {
        // map set back to list
        var resultList = _.map(resultSet, function(val, key) {
          return key;
        });
        callback(null, resultList);
      }

    });
  });
}

Completer.prototype.search = function(phrase, count, callback) {
  var self = this;

  // @callback with up to @count matches for @phrase
  var count = count || 10;
  var callback = callback || function() {};

  self.getPhraseCompletions(phrase, count, function(err, completions) {
    if (err) {
      callback(err, null);
    } else {
      var keys = _.map(completions, function(key) {
        return self.ZKEY_DOCS_PREFIX + key
      });

      if (keys.length) {
        var results = {};
        var semaphore = 0;

        // accumulate docs and the scores for each key

        _.each(keys, function(key) {
          redis.zrevrangebyscore(key, 'inf', 0, 'withscores', function(err, docs) {
            // returns a list of [doc, score, doc, score ...]
            semaphore++;
            if (err) {
              return callback(err, {});
            } else {
              while (docs.length > 0) {
                var doc = docs.shift();
                var score = parseFloat(docs.shift());
                var prevScore = typeof results[doc] !== 'undefined' && results[doc] || 0;
                results[doc] = score + prevScore;
              }
              // credit for more overall matches
              results[doc] += count * keys.length;
            }

            if (semaphore == keys.length) {
              // it's annoying to deal with dictionaries in js
              // turn it into a sorted list for the client's convenience
              var ret = [];
              for (var key in results) {
                ret.push(key);
              }
              ret.sort(function(a, b) {
                return results[b] - results[a]
              });
              return callback(null, ret);
            }

          });
        });
      } else {
        callback(null, []);
      }
    }
  });
}

module.exports = Completer;
