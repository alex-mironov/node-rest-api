var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/contacts');
var db = mongoose.connection;

var userSchema = mongoose.Schema({
	id: Number,
	login: String,
	url: String,
	type: String,
	siteAdmin: Boolean
});

var User = mongoose.model('User', userSchema);

// todo: track model

module.exports = {
	connect: connect,
	User: User
};

function connect (callback) {
	db.on('error', callback); // todo: is chaining possible?
	db.once('open', callback);	
}