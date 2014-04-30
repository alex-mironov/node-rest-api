var http = require('http');
var zlib = require('zlib');
var User = require('./db').User;

module.exports = {
  dump: dump
};

// var options = {
//   hostname: 'api.stackexchange.com'
// };

function getUsers (page, callback) {
  var url = 'http://api.stackexchange.com/2.2/users?page=' + page + '&pagesize=2&order=desc&sort=reputation&site=stackoverflow'; 
  console.log('loading users', url);
  
  http.get(url, function (res) {
    // console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));
    // res.setEncoding('utf8');
    
    var gunzip = zlib.createGunzip();
    res.pipe(gunzip);

    var dataStr = '';
    gunzip.on('data', function (chunk) {
      dataStr += chunk.toString('utf-8');
    });

    gunzip.on('end', function () {
      var users = JSON.parse(dataStr);
      callback(null, users.items);
    });
  })
  .on('errror', callback);
}

// allows to dump users from StackExchange (StackOverflow)
function dump () {
  for (var i = 1; i > 0; i--) {
    getUsers(i, function (err, users) {
      if (err) {
        console.log('error retrieving users', err);
        return;
      }
      // console.log('users received', users);
      users.forEach(function (u) {
        // inserting or updating existing users
        var userUpd = {
          accountId: u.account_id, 
          creationDate: u.creation_date,
          userType: u.user_type,  
          location: u.location,
          url: u.link,
          displayName: u.display_name,
          profileImage: u.profile_image,
          $addToSet: {bages: { $each: []}}
        };

        var bages = u.badge_counts,
          updBagesList = userUpd.$addToSet.bages.$each;
        for (var b in bages) {
          var bage = {};
          bage.title = b;
          bage.count = bages[b];
          updBagesList.push(bage);
        }

        User.update({accountId: u.account_id}, 
          userUpd, 
          {upsert: true},
          function (err, n) {
            if (err) {
              console.error('error upserting', u.account_id);
              return;
            }
            console.log('affected', n, 'times');
          });
      });
    });
  }
}

dump();