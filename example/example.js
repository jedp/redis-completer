
/**
 * Module dependencies.
 */

var express = require('express');
var nowjs = require('now');
var completer = require('../completer');
completer.applicationPrefix('demo');

var app = module.exports = express.createServer();

var everyone = nowjs.initialize(app);

// bootstrap data if necessary

var r = require('redis').createClient();
r.zcard('compl', function(err, card) {
  if (card === 0) {
    console.log("Bootstrapping tweet data.");
    completer.addFromFile('./data/tweets.txt');
    console.log("This is asynchronous, so go ahead and do whatever you want.");
  }
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'node-redis autocomplete'
  });
});

// nowjs methods

everyone.now.search = function(text, count, callback) {
  completer.search(text, count, callback);
}

// Only listen on $ node app.js

if (!module.parent) {
 app.listen(3001);
  console.log("Express server listening on port %d", app.address().port);
}
