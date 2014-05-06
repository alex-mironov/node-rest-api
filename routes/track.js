var Track = require('./../db').Track;

module.exports = function (router) {
	router.route('/')
		.get(function (req, res, next) {

		})
		.post(function (req, res) {
			res.send(200, 'user track route');
		})
		.put(function (req, res) {

		});

	return router;
}