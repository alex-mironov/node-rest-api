var async = require('async');
var userService = require('./user-service');
var User = require('./db').User;

module.exports = importUsers;

// allows to import users from StackExchange (StackOverflow)
function importUsers (callback) {

  async.times(10, function (n, next) {
    var page = 100 * (n + 1);

    userService.getUsers(page, function (err, users) {
      if (err) {
        console.log('error retrieving users', err);
        next(err);
        return;
      }

      async.each(users, function (u, callback) {
        // inserting or updating existing users
        var userUpd = {
          accountId: u.account_id, 
          userType: u.user_type,  
          // location: u.location,
          url: u.link,
          displayName: u.display_name,
          profileImage: u.profile_image,
          reputation: u.reputation,
          isEmployee: u.is_employee,
          $addToSet: {bages: { $each: []}}
        };

        var d = new Date(0);
        var timestamp = d.setUTCSeconds(u.creation_date);
        userUpd.creationDate = timestamp;

        if (u.accept_rate) {
          userUpd.acceptRate = u.accept_rate;
        }

        var bages = u.badge_counts,
          updBagesList = userUpd.$addToSet.bages.$each;
        for (var b in bages) {
          var bage = {};
          bage.title = b;
          bage.count = bages[b];
          updBagesList.push(bage);
        }

        User.update({accountId: u.account_id}, userUpd, {upsert: true}, function (err, n) {
          callback(err);
          // console.log('affected', n)
        });

      }, next);
    });

  }, function (err, users) {
    if (err) {
      console.error('users cannot be imported from StackOverflow', err);
      callback(err);
      return;
    }
    console.log('users were successfully imported from StackOverflow');
    callback();
  });

}
