var db = require('./db'),
  User = db.User;

  
module.exports = {
	userParamMiddleware: userParamMiddleware,
	composeValidationMessage: composeValidationMessage
};

function composeValidationMessage (validationErr) {
  var errors = validationErr.errors,
    msg = validationErr.message + ':';
  for (var e in errors) {
    msg += ' ' + errors[e].message;
  }
  return msg;
}

function userParamMiddleware (req, res, next, userId) {
	User.findById(userId, function (err, user) {
    if (err) return res.apiJson(err);
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
}