var User = require('./../db').User;
var pageSize = 50; // todo: move to config?


// it can be a separate route object
module.exports = function (router) {

  router.use(function (req, res, next) {
    res.apiJson = function (err, data, code) {
      if (err) {
        console.log('error requesting', req.path, 'error:', err);
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

  router.param('user', function (req, res, next, userName) {
    console.log('request with user param', userName);
    // todo: check if user with provided userName exists in db
    next();
  });

  router.route('/')
    .get(get)
    .post(create);

  router.route('/:user')
    .get(function (req, res, next) {
      console.log('successfull validation. accessing user', req.params.user);
      res.send({success: 'OK', login: req.params.user})
    });

  return router;
}

// find one should be implemented base on the login as a key
function get (req, res) {
  var query = req.query,
    since = query.since || 0;

  User.find({ }, null, { skip: since, limit: pageSize }, function (err, users) {
    if (err) { // todo: implement apiJson
      console.log('error retrieving users', err);
      res.send(500, {error: 'Something was wrong'});
      return;
    }
    res.send(users);
  });
}

function create (req, res) {
  var login = req.body.login;

  if (!login) {
    res.apiJson(true, {error: 'login is mandatory field'});
    return;
  }

  console.log('user login:', login);
  User.findOne({login: login}, function (err, user) {
    if (err) {
      res.apiJson(err, null, 500);
      return;
    }

    if (user) {
      res.apiJson(true, {error: 'user with the same login already exists'});
      return;
    }

    res.send({message: 'user ' + login + ' will be created'});
  });

}