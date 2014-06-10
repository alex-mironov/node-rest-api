var db = require('./../db'),
  User = db.User,
  nconf = require('nconf');
  mongoose = require('mongoose'), 
  multipart = require('connect-multiparty'),
  wrapper = require('./../services/response-wrapper'),

  wrapUser = wrapper.wrapUser,
  wrapUsers = wrapper.wrapUsers,

  utils = require('./../services/utils'),
  configService = require('./../services/config-service'),
  multipartMiddleware = multipart({uploadDir: 'uploads'}),
  pageSize = 5,
  composeValidationMessage = utils.composeValidationMessage,  
  root = configService.get('host') + ':' + configService.get('port'),
  usersRoute = root + '/api/users';


// todo: remove tracks from response in user object
module.exports = function (router) {

  router.param('id', utils.userParamMiddleware);

  // /users route
  router.route('/')

    .get(function (req, res) {
      var query = req.query,
        since = +query.since || 0,
        perPage = query.per_page || pageSize;

      // possible NaN
      var numPerPage = Number(perPage); 
      if (!(numPerPage > 0) || numPerPage > 100) {
        return res.apiJson({error: 'Positive integer expected as \'per_page\' query param (Max: 100)'});
      }

      User.find({ }, null, { skip: since, limit: perPage }, function (err, users) {
        if (err) return res.apiJson(err);
        res.send(wrapUsers(users, usersRoute, since, perPage));
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
        user.acceptRate = body.acceptRate;
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
        res.send(201, wrapUser(userCreated, usersRoute));
      });
    });


  //  /users/:id route
  router.route('/:id')

    .get(function (req, res, next) {
      var user = req.user;
      res.send(wrapUser(user, usersRoute));
    })

    .put(function (req, res) {
      var user = req.user,
        body = req.body,
        prevAccountId = user.accountId;

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

      updatedUser(req, res, user, prevAccountId);
    })

    .patch(function (req, res) {
      var user = req.user,
        body = req.body,
        prevAccountId = user.accountId;

      user.accountId = body.accountId || user.accountId;
      user.displayName = body.displayName || user.displayName;
      user.acceptRate = body.acceptRate || user.acceptRate;
      user.reputation = body.reputation || user.reputation;
      user.isEmployee = body.isEmployee || user.isEmployee;
      user.profileImage = body.profileImage || user.profileImage;
      user.websiteUrl = body.websiteUrl || user.websiteUrl;
      user.userType = body.userType || user.userType;
      user.location = body.location || user.location;
      user.url = body.url || user.url;
      user.bages = body.bages || user.bages;

      updateUser(req, res, user, prevAccountId);
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


function updateUser (req, res, updUser, prevAccountId) {
  var body = req.body;

  if (body.creationDate) {
    return res.apiJson({error: '\'creationDate\' is readonly field'});
  }

  User.findOne({accountId: body.accountId}, function (err, existUser) {
    if (err) return res.apiJson(err);
    
    if (existUser && prevAccountId != existUser.accountId) {
      return res.apiJson(true, {error: 'Specified \'accountId\' already in use'});
    }

    updUser.save(function (err, updatedUser, n) {
      if (err) {
        if (err.name == 'ValidationError' || err.name == 'CastError') {
          res.apiJson(err, {error: composeValidationMessage(err)});
        } else {
          res.apiJson(err);
        }
        return;
      }
      res.send(200, wrapUser(updatedUser, usersRoute));
    });
  });
}  
