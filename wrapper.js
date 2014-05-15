var _ = require('underscore');

module.exports = function (results, links) {
	links = links || {};
	var resData;

	if (Array.isArray(results)) {
		resData = _.extend({items: results}, {links: links});
	} else {
		resData = _.extend(results, {links: links});
	}
	return resData;
};