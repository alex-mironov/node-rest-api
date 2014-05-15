var mongoose = require('mongoose');
// mongoose.set('debug', true); // todo: 


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

// var bageSchema = mongoose.Schema({
// 	title: String,
// 	count: Number
// });

userSchema.path('displayName').validate(function (val) {
  return val && val.length > 2;
}, '\'displayName\' should contain at least 3 symbols') ;

var User = mongoose.model('User', userSchema);

module.exports = {
	connect: connect,
	User: User,
  Track: Track
};

function connect (callback) {
  var db = mongoose.connection;
	db.on('error', callback);
	db.once('open', callback);	
  mongoose.connect('mongodb://localhost/contacts');
}