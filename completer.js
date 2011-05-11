var _ = require('underscore');

var fs = require('fs');
var r = require('redis').createClient();

var ZKEY_COMPL = 'compl';
var SKEY_DOCS_PREFIX = 'docs:';

function deleteAll() {
  // clear all data
  r.zremrangebyrank(ZKEY_COMPL, 0, -1);
}

exports.addCompletions = addCompletions = function (originalText) {
  var text = originalText.trim().toLowerCase();
  if (! text) {
    return null, null;
  }

  _.each(text.split(/\s+/), function(word) {
    for (var end_index=1; end_index <= word.length; end_index++) {
      var prefix = word.slice(0, end_index);
      r.zadd(ZKEY_COMPL, 0, prefix);
    }
    r.zadd(ZKEY_COMPL, 0, word+'*');
    r.sadd(SKEY_DOCS_PREFIX + word, originalText);
  });
}

exports.addFromFile = addFromFile = function(filename) {
  // reads the whole file at once
  // no error-checking. just cross your fingers.
  fs.readFile(filename, function(err, buf) {
    if (err) {
      return console.log("ERROR: reading " + filename + ": " + err), null;
    }
    _.each(buf.toString().split(/\n/), addCompletions);
  });
}

exports.getWordCompletions = getWordCompletions = function(word, count, callback) {
  // get up to count completions for the given word
  // if prefix ends with '*', get the next exact completion
  rangelen = 50;
 
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

  getPhraseCompletions(phrase, 10, function(err, completions) {
    if (err) {
      callback(err, null);
    } else {
      var keys = _.map(completions, function(key) { return SKEY_DOCS_PREFIX+key });
      if (keys.length) { 
        r.sunion(keys, function(err, results) {
          if (err) {
            callback(err, null);
          } else {
            // convert results like "@foo i like pie" to ("@foo", "i like pie")
            var tuples = _.map(results.slice(0, count), function(tweet) {
              return tweet.split(/(@\w+)/).slice(1,3);
            });
            callback(null, tuples);
          }
        });
      } else {
        callback(null, []);
      }
    }
  });
}

