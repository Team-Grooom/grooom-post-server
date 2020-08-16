var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
    writer:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
    parentComment:{type:mongoose.Schema.Types.ObjectId, ref:'Comment'},
    description:{type:String},
    isDeleted:{type:Boolean, default:false},
    regDate:{type:Date, default:Date.now}
  });

var Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;