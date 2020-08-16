var mongoose = require('mongoose');
var categorySchema = require('./Category').schema;

var categoriesSchema = new mongoose.Schema({
  type:{type:String, required:true},
  categories:{type:[categorySchema]}
});

var Categories = mongoose.model('Categories', categoriesSchema);
module.exports = Categories;