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
var userRoute = require('./routes/user');
var http = require('http');
var path = require('path');
var db = require('./db');

var app = express();
var router = express.Router();

// console.log('are routers the same?', express.Router() === express.Router())

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

// todo: implement not found route
app.use('/api', router);
app.use('/api/users', userRoute(express.Router())); // initilize users router

db.connect(function (err) {
  if (err) {
    console.error('Express server cannot start. mongodb connection error:', err);
    return;
  }

  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });   
});
