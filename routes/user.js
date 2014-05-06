var db = require('./../db'),
  User = db.User,
  Track = db.Track;
var pageSize = 50; // todo: move to config?


// it can be a separate route object
module.exports = function (router) {

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
      req.user = user;
      next();
    });
  });

  router.route('/')
    .get(getUsers)
    .post(createUser);

  router.route('/:id')
    .get(function (req, res, next) {
      res.apiJson(false, user);
    })
    .put(function (req, res) {
      var user = req.user;

    })
    .delete(function (req, res) {
      user.remove(res.apiJson);
    });

  router.route('/:id/tracks')
    .get(function (req, res) {
      var user = req.user;
      res.apiJson(false, user.tracks);
    })
    .post(function (req, res) {
      var user = req.user,
        body = req.body;


      var track = new Track({
        title: body.title,
        tags: body.tags
      });
      user.tracks.push(track);
      user.save(res.apiJson);
    });

    router.route('/:id/tracks/:trackId')
      .get(function (req, res) {
        var user = req.user;

        var trackId = req.params.trackId;

        var track = user.tracks.id(trackId);
        res.send(track);
      })
      .delete(function (req, res) {
        var user = req.user;
        user.tracks.id(req.params.trackId).remove();
        user.save(res.apiJson);
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