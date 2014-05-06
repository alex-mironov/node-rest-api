var User = require('./../db').User;
var pageSize = 50; // todo: move to config?


// it can be a separate route object
module.exports = function (router) {

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
    .get(getUsers)
    .post(createUser);

  router.route('/:id')
    .get(function (req, res, next) {
      User.findById(req.params.id, res.apiJson);
    })
    .put(function (req, res) {
      User.findById(req.params.id, function (err, user) {

      });
    });

  return router;
}

function getUsers (req, res) {
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

function createUser (req, res) {
  var body = req.body;

  var user = new User({
    displayName: body.displayName,
    profileImage: body.profileImage,
    reputation: body.reputation,
    acceptRate: body.acceptRate,
    isEmployee: body.isEmployee
  });

  user.save(function (err, data) {
    if (!err) {
      res.apiJson(false, data, 201);
    } else {
      if (err.name == 'ValidationError') {
        res.apiJson(err, {error: composeValidationMessage(err)});
      } else {
        res.apiJson(err, null, 500);
      }
    }
  });
}

function composeValidationMessage (validationErr) {
  var errors = validationErr.errors,
    msg = validationErr.message + ':';
  for (var e in errors) {
    msg += ' ' + errors[e].message;
  }
  return msg;
}