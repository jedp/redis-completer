
/**
 * Module dependencies.
 */

var express = require('express');
var nowjs = require('now');
var completer = require('../completer');

var app = module.exports = express.createServer();

var everyone = nowjs.initialize(app);

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
