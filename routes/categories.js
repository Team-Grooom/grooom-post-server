var express  = require('express');
var router = express.Router();
var Categories = require('../models/Categories');

router.get('/', function(req, res) {
    Categories.find()
    .exec(function(err, categories) {
        if(err) return res.json(err);
        res.status(200).json(categories);
    })
});

module.exports = router;