var r = require('redis').createClient();
var _ = require('underscore');
var fs = require('fs');

// prefixes for redis sets
// use applicationPrefix() to set the initial prefix
var _appPrefix = '';
var ZKEY_COMPL = 'compl';
var ZKEY_DOCS_PREFIX = 'docs:';

exports.applicationPrefix = applicationPrefix = function(prefix) {
  // update key prefixes with user-specified application prefix
  _appPrefix = prefix;
  ZKEY_COMPL = prefix + ':' + 'compl';
  ZKEY_DOCS_PREFIX = prefix + ':' + 'docs:';
};

exports.deleteAll = deleteAll = function(cb) {
  // clear all data
  r.zremrangebyrank(ZKEY_COMPL, 0, -1, cb);
}

exports.counter = 0;

exports.addCompletions = addCompletions = function (phrase, id, score, cb) {
  // Add completions for originalText to the completions trie.
  // Store the original text, prefixed by the optional 'key'
  var id = id || null;
  if (typeof score === 'function') {
      cb = score;
      score = null;
  }

  
  var text = phrase.trim().toLowerCase();
  if (! text) {
    return null, null;
  }

  if (id !== null) {
    phraseToStore = id + ':' + phrase;
  } else {
    phraseToStore = phrase;
  }

  _.each(text.split(/\s+/), function(word) {
    for (var end_index=1; end_index <= word.length; end_index++) {
      var prefix = word.slice(0, end_index);
      exports.counter++;
      r.zadd(ZKEY_COMPL, 0, prefix, cb);
    }
    exports.counter++;
    r.zadd(ZKEY_COMPL, 0, word+'*', cb);
    exports.counter++;
    r.zadd(ZKEY_DOCS_PREFIX + word, score||0, phraseToStore, cb);
  });
}

exports.addFromFile = addFromFile = function(filename) {
  // reads the whole file at once
  // no error-checking. just cross your fingers.
  fs.readFile(filename, function(err, buf) {
    if (err) {
      return console.log("ERROR: reading " + filename + ": " + err), null;
    }
    _.each(buf.toString().split(/\n/), function(s) { addCompletions(s)});
  });
}

exports.getWordCompletions = getWordCompletions = function(word, count, callback) {
  // get up to count completions for the given word
  // if prefix ends with '*', get the next exact completion
  var rangelen = 50;
 
  var prefix = word.toLowerCase().trim();
  var getExact = word[word.length-1] === '*'
  var results = []

  if (! prefix) {
    return callback(null, results);
  }

  r.zrank(ZKEY_COMPL, prefix, function(err, start) {
    if (! start) {
      return callback(null, results);
    }

    r.zrange(ZKEY_COMPL, start, start + rangelen - 1, function(err, entries) {
      while (results.length <= count) {

        if (! entries || entries.length === 0) {
          break;
        }
        
        for (var i=0; i<entries.length; i++) {
          var entry = entries[i];
          var minlen = Math.min(entry.length, prefix.length);

          if (entry.slice(0, minlen) !== prefix.slice(0, minlen)) {
            return callback(null,  results);
          }

          if (entry[entry.length-1] === '*' && results.length <= count) {
            results.push(entry.slice(0, -1));
            if (getExact) {
              return callback(null, results);
            }
          } 
        }
      }
      return callback(null, results);
    });
  });
}

exports.getPhraseCompletions = getPhraseCompletions = function(phrase, count, callback) {

  // when getting phrase completions, we should find a fuzzy match for the last
  // word, but treat the words before it as what the user intends.  So for
  // instance, if we get "more pie", treat that as "more* pie"

  phrase = phrase.toLowerCase().trim();

  // tag all words but last as 'exact' matches
  phrase = phrase.replace(/(\w)\s+/g, "$1\* ");

  var prefixes = phrase.split(/\s+/);
  var resultSet = {};
  var iter = 0;

  _.each(prefixes, function(prefix) {
    getWordCompletions(prefix, count, function(err, results) {
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
        var resultList = _.map(resultSet, function(val, key) { return key; });
        callback(null, resultList);
      }

    });
  });
}

exports.search = search = function(phrase, count, callback) {
  // @callback with up to @count matches for @phrase
  var count = count || 10;
  var callback = callback || function() {};

  getPhraseCompletions(phrase, count, function(err, completions) {
    if (err) {
      callback(err, null);
    } else {
      var keys = _.map(completions, function(key) { 
        return ZKEY_DOCS_PREFIX+key 
      });

      if (keys.length) { 
        var results = {};
        var iter = 0;

        // accumulate docs and the scores for each key
        
        _.each(keys, function(key) {
          r.zrevrangebyscore(key, 'inf', 0, 'withscores', function (err, docs) {
            // returns a list of [doc, score, doc, score ...]
            iter ++;  
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
              results[doc] += 10 * keys.length;
            }

            if (iter == keys.length) {
              // it's annoying to deal with dictionaries in js
              // turn it into a sorted list for the client's convenience
              var ret = [];
              for (var key in results) {
                ret.push(key);
              }
              ret.sort(function(a,b) { return results[b] - results[a] });
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
