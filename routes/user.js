var User = require('./../db').User;
var pageSize = 50; // todo: move to config?

// it can be a separate route object
module.exports = function (router) {

  // router.param('user', function (req, res, next, login) {
  //   console.log('request with user param', login);
  //   // todo: check if user with provided login exists in db
  //   next();
  // });

  var t = router.route('/')
    .get(get)
    .post(create);

  return router;
}

// find one should be implemented base on the login as a key
function get (req, res) {
  var query = req.query,
    since = query.since || 0;

  User.find({ }, null, { skip: since, limit: pageSize }, function (err, users) {
    if (err) { // todo: implement apiJson
      console.log('error retrieving users', err);
      res.send(500, {error: 'Something was wrong'});
      return;
    }
    res.send(users);
  });
}

function create (req, res) {
  
  res.send("respond with a resource");
}