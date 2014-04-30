var http = require('http');
var zlib = require('zlib');

module.exports = {
  getUsers: getUsers
};

function getUsers (page, callback) {
  var url = 'http://api.stackexchange.com/2.2/users?page=' + page + '&pagesize=50&order=desc&sort=reputation&site=stackoverflow'; 
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