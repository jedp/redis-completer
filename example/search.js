var Completer = require('../lib/Completer');

var completer_gps = new Completer('gps');

debugger;

// completer_gps.getWordCompletions("surgery", 15, function (err, res) {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log('getWordCompletions', res);
// });

// completer_gps.getPhraseCompletions("surgery", 15, function (err, res) {
//   if (err) {
//     console.log(err);
//     return;
//   }
//   console.log('getPhraseCompletions', res);
// });


completer_gps.search("sur", 15, function (err, res) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('search', res);
});
