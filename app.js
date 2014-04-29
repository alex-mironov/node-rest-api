/**
 * Module dependencies.
 */

var express = require('express');
var morgan = require('morgan');
var favicon = require('static-favicon');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var routes = require('./routes');
// var user = require('./routes/user');
var http = require('http');
var path = require('path');
var db = require('./db');

var app = express();
var router = express.Router();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan());
app.use(methodOverride());
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

router.route('/')
  .get(function (req, res) {
    res.send('Yay!..');
  });

router.route('/users')
  .get(function (req, res) {
    res.send({response: 'OK'});
  });

app.use('/api', router);

db.connect(function (err) {
  if (err) {
    console.error.bind(console, 'mongodb connection error:');
    console.error('Express server cannot be started');
    return;
  }

  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });   
});
