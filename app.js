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

// todo: use module nconf for configuration

// all environments

app.set('port', process.env.PORT || 3000);

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
});

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var router = express.Router();
router.route('/')
  .get(function (req, res) {
    res.send('Yay!..');
  })
  .post(multipartMiddleware, function (req, res) {
    console.log(req.body, req.files);
    res.send({successfull: 'OK', message: 'files uploaded to router endpoint'});
  });

// todo: implement not found route
app.use('/api', router);

var router = express.Router();

router.use(function (req, res, next) {
  res.apiJson = function (err, data, code) {
    if (err) {
      console.log('error requesting', req.path, 'error:', err, data || '');
      code = code || 400;
      if (code == 500) {
        data = {error: 'Something is wrong'};
      }
    } else {
      code = 200;
    }
    res.json(data, code);
  };
  next();
});

app.use('/api/users', userRoute(router)); // initilize users router

db.connect(function (err) {
  if (err) {
    console.error('Express server cannot start. mongodb connection error:', err);
    return;
  }

  console.log('connected to mongodb');
  if (process.argv[2] == '--import') {
    var userImport = require('./user-import');
    userImport(startServer);
  } else {
    startServer();
  }
});  

function startServer () {
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
}