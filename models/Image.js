var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
  imageName:{type:String, required:true}
});

var Image = mongoose.model('Image', imageSchema);
module.exports = Image;