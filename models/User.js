var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  nickName:{type:String, required:true},
  phoneNum:{type:String},
  location:{type:String, required:true},
  rating:{type:String},
  registerDate:{type:Date, default:Date.now},
  isBlocked : {type:Boolean}
});

var User = mongoose.model('User', userSchema);
module.exports = User;