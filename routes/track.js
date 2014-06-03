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
        trackFile = req.files.volume || {};

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


	  router.route('/:trackId')

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
	        if (err) return res.apiJson(err);
	        res.send(204);
	      });
	    });

	return router;
};
