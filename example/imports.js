var Importer = require('../lib/Importer');

var importer_gps = new Importer('gps');

// importer_gps.addCompletions("Surgery for humans", 1);
// importer_gps.addCompletions("Surgery for pets", 2);
// importer_gps.addCompletions("Surgery for bears", 3);

importer_gps.addFromFile(`${__dirname}/epraccur.csv`);