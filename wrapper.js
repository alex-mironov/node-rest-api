var _ = require('underscore');

module.exports = {
	wrap: wrap,
	wrapUser: wrapUser,
	wrapTrack: wrapTrack,
	wrapTracks: wrapTracks
};


function wrap (results, links) {
	links = links || {};
	var resData;

	if (Array.isArray(results)) {
		resData = _.extend({items: results}, {links: links});
	} else {
		resData = _.extend(results, {links: links});
	}
	return resData;
}

function wrapUser (userModel) {
  // todo: ?
}

function wrapTrack (track, parentRoute) {
  return wrap(track._doc, {self: parentRoute + '/' + track._id});
}

function wrapTracks (tracks, parentRoute) {
  return tracks.map(function (track) {
    return wrapTrack(track, parentRoute);
  });
}
