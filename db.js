var mongoose = require('mongoose');

var trackSchema = mongoose.Schema({
  title: {type: String, required: true},
  artist: String,
  path: String,
  tags: [String],
  releaseYear: Number
});

var Track = mongoose.model('Track', trackSchema); 


var userSchema = mongoose.Schema({
  accountId: Number, 
  displayName: {type: String, required: true},
  creationDate: Number, // how is it stored ???
  userType: String, 
  location: String,
  url: String,
  isEmployee: Boolean,
  reputation: Number,
  acceptRate: Number,
  websiteUrl: String,
  profileImage: String,
  bages: [
  // {
		// title: String,
		// count: Number  	
  // }
  ],
  tracks: [trackSchema]
});

var bageSchema = mongoose.Schema({
	title: String,
	count: Number
});



// todo: convert StackExchange epoch times to JavaScript dates. Make more readable dates 
// var utcSeconds = 1222430705;
// var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
// d.setUTCSeconds(utcSeconds);

var User = mongoose.model('User', userSchema);

// todo: track model
// todo: make accountId field indexed

module.exports = {
	connect: connect,
	User: User,
  Track: Track
};

function connect (callback) {
  var db = mongoose.connection;
	db.on('error', callback); // todo: is chaining possible?
	db.once('open', callback);	
  mongoose.connect('mongodb://localhost/contacts');
}