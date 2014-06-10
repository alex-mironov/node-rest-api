var _ = require('underscore');

module.exports = {
	wrap: wrap,
	wrapUser: wrapUser,
	wrapUsers: wrapUsers,
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

function wrapUser (user, route) {
  var userClone = _.clone(user._doc);
  delete userClone.tracks;
  return wrap(userClone, {self: route + '/' + user._id});
}

function wrapUsers (users, route, since, perPage) {
	// todo: add per_page param to user links

	var usersSinceRoute = route + '?since=';

  var results = users.map(function (user) {
    return wrapUser(user, route);
  });

  var links = { self: usersSinceRoute + since };
  if (since) {
    links.prev = usersSinceRoute + (since - perPage); 
  }
  if (users.length == perPage) {
    links.next = usersSinceRoute + (since + perPage);
  }

  return wrap(results, links);
}

function wrapTrack (track, route) {
  return wrap(track._doc, {self: route + '/' + track._id});
}

function wrapTracks (tracks, route) {
  var results = tracks.map(function (track) {
    return wrapTrack(track, route);
  });
  return wrap(results, {self: route});
}
