
module.exports = function (req, res) {
	res.render('index', {url: req.url});
};
