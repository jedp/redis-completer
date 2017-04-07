var Completer = require('../index');

var completer_gps = new Completer('gps');

// completer_gps.addCompletions("Surgery for humans", 1);
// completer_gps.addCompletions("Surgery for pets", 2);
// completer_gps.addCompletions("Surgery for bears", 3);

completer_gps.addFromFile(`${__dirname}/epraccur.csv`);