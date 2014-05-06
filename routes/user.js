var User = require('./../db').User;
var pageSize = 50; // todo: move to config?


// it can be a separate route object
module.exports = function (router) {

  router.use(function (req, res, next) {
    res.apiJson = function (err, data, code) {
      if (err) {
        code = code || 400;
        if (code == 500) {
          data = {error: 'Something is wrong'};
        }
        console.log('error requesting', req.path, 'error:', err, data || '');
      } else {
        code = 200;
      }
      res.json(data, code);
    };
    next();
  });

  router.param('id', function (req, res, next, userId) {
    User.findById(userId, function (err, user) {
      if (err) {
        res.apiJson(err);
        return;
      }
      if (!user) {
        res.apiJson(true, {error: 'User Not Found'}, 404);
        return;
      }
      console.log('found user', user);
      next();
    });
  });

  router.route('/')
    .get(get)
    .post(create);

  router.route('/:id')
    .get(function (req, res, next) {
      res.send({success: 'OK', login: req.params.id})
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
  var body = req.body;

    console.log('body', body);

  // if (!login) {
  //   res.apiJson(true, {error: 'login is mandatory field'});
  //   return;
  // }

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

    var user = new User({
      displayName: body.displayName,
      profileImage: body.profileImage,
      reputation: body.reputation,
      acceptRate: body.acceptRate,
      isEmployee: body.isEmployee
    });

    user.save(function (err, data) {

      console.log('user saved', data);
      res.apiJson(err, data);
    });

  });

}