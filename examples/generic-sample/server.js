var express = require('express')
  , b2b = require('../../index');

var app = express.createServer();

app.configure(function() {
  app.use(express.static(__dirname + '/static'));
});

var io = b2b.listen(app); 

app.listen(8080);

