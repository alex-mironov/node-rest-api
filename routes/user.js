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
      res.apiJson(false, req.user);
    })
    .put(function (req, res) {
      var body = req.body, 
        user = req.user;

      var userUpd = {
        isEmployee: body.isEmployee,
        displayName: body.displayName,
      };

        userUpd.url = body.url;
        userUpd.accountId = body.accountId;
        userUpd.profileImage = body.profileImage || '';
        userUpd.websiteUrl = body.websiteUrl || '';
        userUpd.acceptRate = body.acceptRate || 0;
        userUpd.reputation = body.reputation || 0;
        userUpd.userType = body.userType;


      User.findByIdAndUpdate(user._id, userUpd, function (err, u) {
        if (err) {
          console.log('error updating user document', err);
          res.apiJson(err);
        }
        res.apiJson(false, u);
      });

  // creationDate: Number, // how is it stored ???
  // bages: [
  // // {
  //   // title: String,
  //   // count: Number    
  // // }
  // ],
  // tracks: [trackSchema]


    })
    .delete(function (req, res) {
      user.remove(res.apiJson);
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

//  todo: track validation
      console.log('file', trackFile);

      var track = new Track({
        title: body.title,
        tags: body.tags,
        path: trackFile.path,
        releaseYear: body.releaseYear,
        artist: body.artist
      });

      user.tracks.push(track);
      user.save(res.apiJson);
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
        user.save(res.apiJson);
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
    displayName: body.displayName,
    profileImage: body.profileImage,
    reputation: body.reputation,
    acceptRate: body.acceptRate,
    isEmployee: body.isEmployee,
    creationDate: new Date().getTime()
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