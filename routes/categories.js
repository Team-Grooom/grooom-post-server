var express  = require('express');
var router = express.Router();
var Categories = require('../models/Categories');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: 카테고리 목록 조회
*/


/**
 * @swagger
 * /categories:
 *   get:
 *     description: 카테고리 목록 조회
 *     tags: [Categories]
 *     produces:
 *     - "application/json"
 *     responses:
 *       "200":
 *         description: "success"
*/
router.get('/', function(req, res) {
    Categories.find()
    .exec(function(err, categories) {
        if(err) return res.json(err);
        res.status(200).json(categories);
    })
});

module.exports = router;