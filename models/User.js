var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  id:{type:String, required:true},
  nickName:{type:String, required:true},
  phoneNumber:{type:String},
  place:{type:String, required:true},
  rating:{type:Number}
});

var User = mongoose.model('User', userSchema);
module.exports = User;
