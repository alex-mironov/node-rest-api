var db = require('./../db'),
  User = db.User,
  Track = db.Track,
  mongoose = require('mongoose'), 
  multipart = require('connect-multiparty'),
  wrap = require('./../wrapper'),
  multipartMiddleware = multipart({uploadDir: 'uploads'});

var pageSize = 5; // todo: move to config?
var root = 'http://localhost:3000',  // todo: move to config
  usersRoute = root + '/api/users';

// it can be a separate route object
module.exports = function (router) {

  router.param('id', function (req, res, next, userId) {
    User.findById(userId, function (err, user) {
      if (err) {
        return res.apiJson(err);
      }
      if (!user) {
        return res.apiJson(true, {error: 'User Not Found'}, 404);
      }

      req.user = user;
      req.links = { 
        self: usersRoute + '/' + user._id
      };
      req.links.tracks = req.links.self + '/tracks';

      next();
    });
  });

  router.route('/')
    .get(function (req, res) {
      var query = req.query,
        since = +query.since || 0,
        usersSinceRoute = usersRoute + '?since=';

      User.find({ }, null, { skip: since, limit: pageSize }, function (err, users) {
        if (err) {
          return res.apiJson(err);
        }

        var results = users.map(function (user) {
          var userDoc = user._doc,
            userRoute = usersRoute + '/' + user._id;
          userDoc.tracks = wrapTracks(userDoc.tracks, userRoute + '/tracks');
          return wrap(userDoc, {self: userRoute});
        });
        
        var links = { self: usersSinceRoute + since };
        if (since) {
          links.prev = usersSinceRoute + (since - pageSize); 
        }
        if (users.length == pageSize) {
          links.next = usersSinceRoute + (since + pageSize);
        }

        res.send(wrap(results, links));
      });
    })
    .post(function (req, res) {
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
    });


  router.route('/:id')
    .get(function (req, res, next) {
      var user = req.user,
        userDoc = user._doc;

      userDoc.tracks = wrapTracks(userDoc.tracks, req.links.self + '/tracks');

      res.send(wrap(userDoc, {self: req.links.self}));
    })
    .put(function (req, res) {
      var body = req.body, 
        user = req.user;

      if (body.creationDate) {
        return res.apiJson({error: '\'creationDate\' is readonly field'});
      }

      User.findOne({accountId: body.accountId}, function (err, existUser) {
        if (err) {
          return res.apiJson(err);
        }
        if (existUser && user.accountId != existUser.accountId) {
          return res.apiJson(true, {error: 'Specified \'accountId\' already in use'});
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
          return res.apiJson(err);
        }
        res.send(204);
      });
    });


  router.route('/:id/tracks')
    .get(function (req, res) {
      var user = req.user,
        results = wrapTracks(user.tracks, req.links.tracks);

      res.send(wrap(results, {self: req.links.tracks }));
    })
    .post(multipartMiddleware, function (req, res) {
      var user = req.user,
        body = req.body,
        trackFile = req.files.volume;

        // todo: validate, only .mp3 files are acceptable

      var track = new Track({
        _id: mongoose.Types.ObjectId(),
        title: body.title,
        tags: body.tags,
        path: trackFile.path,
        releaseYear: body.releaseYear,
        artist: body.artist
      });

      user.tracks.push(track);
      user.save(function (err, userUpdated) {
        if (err) {
          if (err.name == 'ValidationError') {
            res.apiJson(err, {error: composeValidationMessage(err)});
          } else {
            res.apiJson(err);
          }
          return;
        }
        var trackAdded = userUpdated.tracks.id(track._id);
        res.send(201, wrapTrack(trackAdded, req.links.tracks)); 
      });
    });


    router.route('/:id/tracks/:trackId')
      .all(function (req, res, next) {
        var user = req.user,
          trackId = req.params.trackId;

        req.track = user.tracks.id(trackId);
        if (!req.track) {
          return res.apiJson(true, {error: 'Track \'' + trackId + '\' not found'}, 404);
        }
        next();
      })
      .get(function (req, res) {
        res.send(wrapTrack(req.track, req.links.tracks));
      })
      .put(function (req, res) {
        var body = req.body,
          track = req.track;
        
        if (body.path) {
          return res.apiJson({error: '\'path\' field is readonly'});
        }

        track.title = body.title;
        track.artist = body.artist;
        track.releaseYear = body.releaseYear;
        track.tags = body.tags;

        req.user.save(function (err, u) {
          if (err) {
            var data;
            if (err.name == 'ValidationError') {
              data = {error: composeValidationMessage(err)};
            } 
            return res.apiJson(err, data);
          }
          
          res.send(wrapTrack(u.tracks.id(track._id), req.links.tracks));
        });

      })
      .delete(function (req, res) {
        var user = req.user;
        user.tracks.id(req.params.trackId).remove();
        user.save(function (err) {
          if (err) {
            return res.apiJson(err);
          }
          res.send(204);
        });
      });

  return router;
}


function composeValidationMessage (validationErr) {
  var errors = validationErr.errors,
    msg = validationErr.message + ':';
  for (var e in errors) {
    msg += ' ' + errors[e].message;
  }
  return msg;
}

function wrapUser (userModel) {

}

function wrapTrack (track, parentRoute) {
  return wrap(track._doc, {self: parentRoute + '/' + track._id});
}

function wrapTracks (tracks, parentRoute) {
  return tracks.map(function (track) {
    return wrapTrack(track, parentRoute);
  })
}