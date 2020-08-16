var mongoose = require('mongoose');
var imageSchema = require('./Image').schema;
var commentSchema = require('./Comment').schema;

var postSchema = new mongoose.Schema({
  title:{type:String, required:true},
  description:{type:String, required:true},
  writer:{type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
  category:{type:mongoose.Schema.Types.ObjectId, ref:'Category', required:true},
  price:{type:Number, required:true},
  state:{type:Number, required:true},
  buyer:{type:mongoose.Schema.Types.ObjectId},
  images:{type:[imageSchema]},
  likes:{type:[mongoose.Schema.Types.ObjectId], ref:'User'},
  town:{type:String, required:true},
  townRange:{type:Number},
  isSuggestable:{type:Boolean},
  regDate:{type:Date, default:Date.now},
  views:{type:Number, default:0},
  reports:{type:[mongoose.Schema.Types.ObjectId], ref:'User'},
  telphone:{type:String},
  comments:{type:[commentSchema]},
  isTalkable:{type:Boolean},
  chattingUsers:{type:[mongoose.Schema.Types.ObjectId], ref:'User'}
});

var Post = mongoose.model('Post', postSchema);

module.exports = Post;
