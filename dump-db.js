var http = require('http');
var User = require('./db').User;

module.exports = {
  dump: dump
};

var options = {
  hostname: 'api.stackexchange.com'
};

function getUsers (page, callback) {
  options.path = '/2.2/users?page=' + page + '&pagesize=5&order=desc&sort=reputation&site=stackoverflow'; 
  console.log('loading users', options.path);
  http.get(options, function (res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // res.setEncoding('utf8');
    
    var dataStr = '';
    res.on('data', function (chunk) {
      dataStr += chunk.toString();  // todo: check if status is not 200
      console.log(dataStr);
      throw 'first chunk has been read';
    });

    res.on('end', function () {
      console.log('page:', dataStr.toString());
      var users = JSON.parse(dataStr);
      callback(null, users);
    });
  })
  .on('errror', callback);
}

// allows to dump users from StackExchange (StackOverflow)
function dump () {
  for (var i = 10; i > 0; i--) {
    getUsers(i, function (err, users) {
      if (err) {
        console.log('error retrieving users', err);
        return;
      }
      console.log('users received');

      users.forEach(function (u) {
        // inserting or updating existing users
        // todo: change id to githubId
        User.update({id: u.id}, {gitHubId: u.id, login: u.login, url: u.url, type: u.type}, 
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

dump();