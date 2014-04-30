var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  accountId: Number, 
  creationDate: Number, // how is it stored ???
  userType: String, 
  location: String,
  url: String,
  displayName: String,
  profileImage: String,
  bages: [
  // {
		// title: String,
		// count: Number  	
  // }
  ]
});

var bageSchema = mongoose.Schema({
	title: String,
	count: Number
});

var User = mongoose.model('User', userSchema);

// todo: track model
// todo: make login field indexed

module.exports = {
	connect: connect,
	User: User
};

function connect (callback) {
  var db = mongoose.connection;
	db.on('error', callback); // todo: is chaining possible?
	db.once('open', callback);	
  mongoose.connect('mongodb://localhost/contacts');
}