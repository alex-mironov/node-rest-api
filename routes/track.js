var db = require('./../db'),
  User = db.User,
  Track = db.Track,
  wrapper = require('./../services/response-wrapper'),
  wrap = wrapper.wrap,
  wrapTrack = wrapper.wrapTrack,
  wrapTracks = wrapper.wrapTracks,
  composeValidationMessage = require('./../services/utils').composeValidationMessage;

module.exports = function (router) {

  router.param('trackId', function (req, res, next, trackId) {
    var user = req.user;
    req.track = user.tracks.id(trackId);
    if (!req.track) {
      return res.send(404, {error: 'Track not found'});
    }
    next();
  });

	router.route('/')

		.get(function (req, res) {
      var user = req.user,
        results = wrapTracks(user.tracks, req.links.tracks);
      res.send(wrap(results, {self: req.links.tracks }));
    })

    .post(multipartMiddleware, function (req, res) {
      var user = req.user,
        body = req.body,
        files = req.files;

      if (!files || !files.volume) {
        return res.send(true, {error: 'Track file should be attached to form-data (key: \'volume\')'});
      }
      
      var trackFile = files.volume;
      // todo: add validation. only .mp3 files are acceptable

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
          if (err.name == 'ValidationError' || err.name == 'CastError') {
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


	  router.route('/:trackId')

	    .get(function (req, res) {
	      res.send(wrapTrack(req.track, req.links.tracks));
	    })

	    .put(function (req, res) {
	      var body = req.body,
	        track = req.track;
	      
        track.title = body.title;
        track.artist = body.artist;
        track.releaseYear = body.releaseYear;
        track.tags = body.tags;
	      
        updateTrack(req, res, track)
	    })

      .patch(function (req, res) {
        var body = req.body,
          track = req.track;
        
        track.title = body.title || track.title;
        track.artist = body.artist || track.artist;
        track.releaseYear = body.releaseYear || track.releaseYear;
        track.tags = body.tags || track.tags;
        
        updateTrack(req, res, track)
      })

	    .delete(function (req, res) {
	      var user = req.user;
	      user.tracks.id(req.params.trackId).remove();
	      user.save(function (err) {
	        if (err) return res.apiJson(err);
	        res.send(204);
	      });
	    });

	return router;
};


function updateTrack (req, res, updTrack) {
  if (req.body.path) {
    return res.apiJson(true, {error: 'Track file/path is readonly and cannot be changed'});
  }

  req.user.save(function (err, u) {
    if (err) {
      if (err.name == 'ValidationError' || err.name == 'CastError') {
        res.apiJson(err, {error: composeValidationMessage(err)});
      } else {
        res.apiJson(err);
      }
      return;
    }
    
    res.send(wrapTrack(u.tracks.id(updTrack._id), req.links.tracks));
  });
}
