var db = require('./../db'),
  User = db.User,
  nconf = require('nconf');
  mongoose = require('mongoose'), 
  multipart = require('connect-multiparty'),
  wrapper = require('./../services/response-wrapper'),
  wrap = wrapper.wrap,
  wrapTracks = wrapper.wrapTracks,
  utils = require('./../services/utils'),
  configService = require('./../services/config-service'),
  multipartMiddleware = multipart({uploadDir: 'uploads'}),
  pageSize = 5,
  composeValidationMessage = utils.composeValidationMessage,  
  root = configService.get('host') + ':' + configService.get('port'),
  usersRoute = root + '/api/users';


module.exports = function (router) {

  router.param('id', utils.userParamMiddleware);

  //  /users route
  router.route('/')

    .get(function (req, res) {
      var query = req.query,
        since = +query.since || 0,
        usersSinceRoute = usersRoute + '?since=';

      User.find({ }, null, { skip: since, limit: pageSize }, function (err, users) {
        if (err) return res.apiJson(err);

        var results = users.map(function (user) {
          var userDoc = user._doc,
            userRoute = usersRoute + '/' + user._id;
          userDoc.tracks = wrapTracks(userDoc.tracks, userRoute + '/tracks');
          return wrap(userDoc, {self: userRoute});
        });
        
        var links = { self: usersSinceRoute + since };
        if (since) {
          links.prev = usersSinceRoute + (since - pageSize); 
        }
        if (users.length == pageSize) {
          links.next = usersSinceRoute + (since + pageSize);
        }

        res.send(wrap(results, links));
      });
    })

    .post(function (req, res) {
      var body = req.body,
        user = new User({
          accountId: body.accountId,
          displayName: body.displayName,
          profileImage: body.profileImage,
          isEmployee: body.isEmployee,
          creationDate: new Date().getTime(),
          bages: body.bages
        });

      if (body.reputation) {
        user.reputation = body.reputation;
      }
      if (body.acceptRate) {
        user.acceptRate = body.acceptRate; // todo: validate? not more than 100
      }

      user.save(function (err, userCreated) {
        if(err) {
          if (err.name == 'ValidationError' || err.name == 'CastError') {
            res.apiJson(err, {error: composeValidationMessage(err)});
          } else if (err.name == 'MongoError' && err.code == 11000) { 
            res.apiJson(err, {error: 'User with the same \'accountId\' already exists'});
          } else {
            res.apiJson(err);
          }
          return;
        }
        res.send(201, wrap(userCreated._doc, {self: usersRoute + '/' + userCreated._id}));
      });
    });


  //  /users/:id route
  router.route('/:id')

    .get(function (req, res, next) {
      var user = req.user,
        userDoc = user._doc;

      userDoc.tracks = wrapTracks(userDoc.tracks, req.links.self + '/tracks');
      res.send(wrap(userDoc, {self: req.links.self}));
    })

    .put(function (req, res) {
      var body = req.body, 
        user = req.user;

      if (body.creationDate) {
        return res.apiJson({error: '\'creationDate\' is readonly field'});
      }

      User.findOne({accountId: body.accountId}, function (err, existUser) {
        if (err) return res.apiJson(err);
        if (existUser && user.accountId != existUser.accountId) {
          return res.apiJson(true, {error: 'Specified \'accountId\' already in use'});
        }

        user.accountId = body.accountId;
        user.displayName = body.displayName;
        user.acceptRate = body.acceptRate || 0;
        user.reputation = body.reputation;
        user.isEmployee = body.isEmployee;
        user.profileImage = body.profileImage;
        user.websiteUrl = body.websiteUrl;
        user.userType = body.userType;
        user.location = body.location;
        user.url = body.url;
        user.bages = body.bages;

        user.save(function (err, updatedUser, n) {
          if (err) {
            if (err.name == 'ValidationError' || err.name == 'CastError') {
              res.apiJson(err, {error: composeValidationMessage(err)});
            } else {
              res.apiJson(err);
            }
            return;
          }
          res.send(200, wrap(updatedUser._doc, {self: usersRoute + '/' + updatedUser._id}));
        });
      });
    })

    .delete(function (req, res) {
      var user = req.user;
      user.remove(function (err) {
        if (err) return res.apiJson(err);
        res.send(204);
      });
    });

  return router;
};
