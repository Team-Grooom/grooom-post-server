var mongoose = require('mongoose');

var categorySchema = new mongoose.Schema({
  name:{type:String, required:true}
});

var Category = mongoose.model('Category', categorySchema);
module.exports = Category;