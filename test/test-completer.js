var completer = require('../completer');
var testCase = require('nodeunit').testCase;

completer.applicationPrefix('_test');
completer.addCompletions("I like pie", 'glug', 42);
completer.addCompletions("I like potatoes", 'merg', 17);

module.exports = testCase({
  setUp: function(callback) {
    callback();
  },

  tearDown: function(callback) {
    // so ... someday there will be a remove() function, right?
    callback();
  }, 

  "word completions": function(test) {
    test.expect(1);
    completer.getWordCompletions('pot', 10, function(err, compls) {
      test.ok(compls[0] === 'potatoes');
      test.done();
    });
  },

  "phrase completions": function(test) {
    test.expect(2);
    completer.getPhraseCompletions('like pi', 10, function(err, compls) {
      test.ok(compls[0] === 'like');
      test.ok(compls[1] === 'pie');
      test.done();
    }); 
  }, 

  "search": function(test) {
    test.expect(4);

    completer.search("I like", 10, function(err, compls) {
      if (err) throw err;
      test.ok(compls.length === 2);

      // because of score, glug will come up first
      test.ok(compls[0] === "glug:I like pie");

      completer.search("potatoes", 10, function(err, compls) {
        if (err) throw err;
        test.ok(compls.length === 1);
        test.ok(compls[0] === "merg:I like potatoes")

        test.done();
      });
    });
  }


});
