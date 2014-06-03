var path = require('path'),
	nconf = require('nconf');

nconf.argv()
  .file({file: path.join(__dirname, 'config.json')});

 
  nconf.defaults({
    'port': 3000,
    'import': false
  });

  console.log('port: ' + nconf.get('port'));
  console.log('import: ' + nconf.get('import'));
  console.log('host: ' + nconf.get('host'));

  module.exports = nconf;
  