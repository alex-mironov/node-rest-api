var mongoose = require('mongoose');
// mongoose.set('debug', true);  

var trackSchema = mongoose.Schema({
    title: {type: String, required: true} ,
    artist: String,
    path: String,
    tags: [String],
    releaseYear: Number
  }),
  
  userSchema = mongoose.Schema({
    accountId: {type: Number, unique: true, sparse: true},
    displayName: {type: String, required: true},  
    userType: String, 
    location: String,
    url: String,
    creationDate: Number,
    reputation: {type: Number, default: 0},
    isEmployee: {type: Boolean, default: false},
    acceptRate: {type: Number, default: 0, max: 100},
    websiteUrl: String,
    profileImage: String,
    bages: [],
    tracks: [trackSchema]
  });

// user schema validation
userSchema.path('displayName').validate(function (val) {
  return val && val.length > 2;
}, '\'displayName\' should contain at least 3 symbols') ;

var Track = mongoose.model('Track', trackSchema),
  User = mongoose.model('User', userSchema);


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
