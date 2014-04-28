var http = require('http');

module.exports = {
  getUsers: getUsers
};

function getUsers (callback) {
  http.get('https://api.github.com/users', function (res) {
    var dataStr = '';
    res.on('data', function (chunk) {
      dataStr += chunk;
    });

    res.on('end', function () {
      var users = JSON.parse(dataStr);
      console.log('users received', users);
      callback(null, users);
    });
  })
  .on('errror', callback);
}