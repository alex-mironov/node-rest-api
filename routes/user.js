var db = require('./../db'),
  User = db.User,
  Track = db.Track;

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({uploadDir: 'uploads'});

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
      res.send(req.user);
    })
    .put(function (req, res) {
      var body = req.body, 
        user = req.user;

      if (body.creationDate) {
        res.apiJson({error: '\'creationDate\' is readonly field'});
        return;
      }

      User.findOne({accountId: body.accountId}, function (err, existUser) {
        if (err) {
          res.apiJson(err);
          return;
        }
        if (existUser && user.accountId != existUser.accountId) {
          res.apiJson(true, {error: 'Specified \'accountId\' already in use'});
          return;
        }

        user.accountId = body.accountId;
        user.displayName = body.displayName;
        user.isEmployee = body.isEmployee;
        user.profileImage = body.profileImage;
        user.websiteUrl = body.websiteUrl;
        user.userType = body.userType;
        user.location = body.location;
        user.url = body.url;
        user.bages = body.bages;

        user.save(function (err, updatedUser, n) {
          if (err) {
            if (err.name == 'ValidationError') {
              res.apiJson(err, {error: composeValidationMessage(err)});
            } else {
              res.apiJson(err);
            }
            return;
          }
          res.send(updatedUser);
        });
      });

    })
    .delete(function (req, res) {
      var user = req.user;
      user.remove(function (err) {
        if (err) {
          res.apiJson(err);
          return;
        }
        res.send(204);
      });
    });

  router.route('/:id/tracks')
    .get(function (req, res) {
      var user = req.user;
      res.apiJson(false, user.tracks);
    })
    .post(multipartMiddleware, function (req, res) {
      var user = req.user,
        body = req.body,
        trackFile = req.files.volume;

      var track = new Track({
        title: body.title,
        tags: body.tags,
        path: trackFile.path,
        releaseYear: body.releaseYear,
        artist: body.artist
      });

      user.tracks.push(track);
      user.save(function (err, trackCreated) {
        if (err) {
          res.apiJson(err);
          return;
        }
        res.send(201, trackCreated); 
      });
    });

    router.route('/:id/tracks/:trackId')
      .get(function (req, res) {
        var user = req.user,
          trackId = req.params.trackId,
          track = user.tracks.id(trackId);
        res.send(track);
      })
      .put(function (req, res) {
        var user = req.user,
          body = req.body,
          trackId = req.params.trackId,
          track = user.tracks.id(trackId);
        
        if (body.path) {
          res.apiJson({error: '\'path\' field is readonly'});
          return;
        }

        track.title = body.title;
        track.artist = body.artist;
        track.releaseYear = body.releaseYear;
        track.tags = body.tags;

        user.save(function (err, u) {
          if (err) {
            var data;
            if (err.name == 'ValidationError') {
              data = {error: composeValidationMessage(err)};
            } 
            res.apiJson(err, data);
            return;
          }
          
          res.apiJson(false, u.tracks.id(trackId));
        });

      })
      .delete(function (req, res) {
        var user = req.user;
        user.tracks.id(req.params.trackId).remove();
        user.save(function (err) {
          if (err) {
            res.apiJson(err);
            return;
          }
          res.send(204);
        });
      });

  return router;
}

function getUsers (req, res) {
  var query = req.query,
    since = query.since || 0;

  User.find({ }, null, { skip: since, limit: pageSize }, res.apiJson);
}

function createUser (req, res) {
  var body = req.body;

  var user = new User({
    accountId: body.accountId,
    displayName: body.displayName,
    profileImage: body.profileImage,
    isEmployee: body.isEmployee,
    creationDate: new Date().getTime(),
    bages: body.bages
  });

  if (body.reputation) {
    user.reputation = body.reputation;
  }
  if (body.acceptRate) {
    user.acceptRate = body.acceptRate;
  }

  user.save(function (err, data) {
    if(err) {
      if (err.name == 'ValidationError') {
        res.apiJson(err, {error: composeValidationMessage(err)});
      } else if (err.name == 'MongoError' && err.code == 11000) { 
        res.apiJson(err, {error: 'User with the same \'accountId\' already exists'});
      } else {
        res.apiJson(err, null, 500);
      }
      return;
    }

    res.send(201, data);
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