var mongoose = require('mongoose');
mongoose.set('debug', true); // todo: 


var trackSchema = mongoose.Schema({
  title: {type: String, required: true} ,
  artist: String,
  path: String,
  tags: [String],
  releaseYear: Number
});

var Track = mongoose.model('Track', trackSchema); 


var userSchema = mongoose.Schema({
  accountId: {type: Number, unique: true, sparse: true},
  displayName: {type: String, required: true},  
  userType: String, 
  location: String,
  url: String,
  creationDate: Number,
  reputation: {type: Number, default: 0},
  isEmployee: {type: Boolean, default: false},
  acceptRate: {type: Number, default: 0},
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
// to get uts seconds from JavaScript time stamp Math.floor(d.getTime() / 1000)

var User = mongoose.model('User', userSchema);

// User.ensureIndexes(function (err) {
//   if (err) return console.error('error creating indexes', err);
// });
User.on('index', function (err) {
  if (err) {
    console.error('error creating indexes', err);
    return;
  }
  console.log('index on User collection has been created');
});

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