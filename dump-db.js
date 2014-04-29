var https = require('https');
var User = require('./db').User;

module.exports = {
  getUsers: getUsers,
  fillInUsers: fillInUsers
};

var options = {
  hostname: 'api.github.com',
  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36'
  }
};

function getUsers (since, callback) {
  options.path = '/users?since=' + since; 
  console.log('loading users', options.path);
  https.get(options, function (res) {
    // console.log('STATUS: ' + res.statusCode);
    // console.log('HEADERS: ' + JSON.stringify(res.headers));

    var dataStr = '';
    res.on('data', function (chunk) {
      dataStr += chunk;  // todo: check if status is not 200
    });

    res.on('end', function () {
      var users = JSON.parse(dataStr);
      callback(null, users);
    });
  })
  .on('errror', callback);
}

function fillInUsers () {
  for (var i = 10; i >= 0; i--) {
    getUsers(i * 100, function (err, users) {
      if (err) {
        console.log('error retrieving users');
        return;
      }
      console.log('users received');

      users.forEach(function (u) {
        // inserting or updating existing users
        User.update({id: u.id}, {id: u.id, login: u.login, url: u.url, type: u.type, siteAdmin: u.site_admin}, 
          {upsert: true},
          function (err, n) {
            if (err) {
              console.error('error upserting', u.id);
              return;
            }
            // console.log('affected', u.id, n, 'times');
          });
      });
    });
  }
}
