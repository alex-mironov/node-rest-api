/**
 * Module dependencies.
 */

var express = require('express'),
  morgan = require('morgan'),
  favicon = require('static-favicon'),
  methodOverride = require('method-override'),
  bodyParser = require('body-parser'),
  errorHandler = require('errorhandler'),
  confProvider = require('./conf-provider');

var routes = require('./routes');
var userRoute = require('./routes/user');
var fs = require('fs');
var http = require('http');
var path = require('path');
var db = require('./db');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morgan());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    console.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
});

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

var router = express.Router();

router.use(function (req, res, next) {
  res.apiJson = function (err, data, code) {
    if (err) {
      console.log('error requesting', req.path, 'error:', err, data || '');
      code = code || 400;
      if (code == 500) {
        data = {error: 'Something was wrong'};
      } else {
        data = data || {error: err.error || ''};
      }
    } else {
      code = 200;
    }
    res.json(data, code);
  };
  next();
});

app.use('/api/users', userRoute(router)); // initilize users router

app.use(function (req, res) {
  res.status(404);

  if (req.accepts('html')) {
    return res.render('not-found', {url: req.url});  
  } 

  if (req.accepts('json')) {
    return res.send({error: 'Not Found'});
  }

  res.type('txt').send('Not found');
});

db.connect(function (err) {
  if (err) {
    return console.error('Express server cannot start. mongodb connection error:', err);
  }

  createUploadFolder(function () {
    console.log('connected to mongodb');
    if (confProvider.get('--import')) {
      var userImport = require('./user-import');
      userImport(startServer);
    } else {
      startServer();
    }
  });

});  

function startServer () {
  var port = confProvider.get('port');
  http.createServer(app).listen(port, function() {
    console.log('Express server listening on port ' + port);
  });
}

function createUploadFolder (callback) {
  fs.exists(__dirname + '/uploads', function (exists) {
    if (!exists) {
      fs.mkdir('./uploads', function (err) {
        if (err) {
          return console.log('error creating \'uploads\' folder', err);
        }
        callback();
      });
      return;
    }
    callback();
  });
}