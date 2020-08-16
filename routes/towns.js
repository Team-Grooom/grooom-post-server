var express  = require('express');
var router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Town
 *   description: 인근 동 조회
*/


/**
 * @swagger
 * /towns:
 *   get:
 *     description: 인근 동 조회 /towns?town=서울특별시 녹번동&townRange=2
 *     tags: [Town]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "town"
 *       in: "query"
 *       description: "동이름 ex) 서울특별시 녹번동, xx광역시 xx동, 경기도 xx1동, 경기도 xx1,2,3동, 전라남도 xx2동"
 *       type: "string"
 *     - name: "townRange"
 *       in: "query"
 *       description: "인근 동 조회 범위 ex) 0이상의 정수"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "success"
 *     
*/
router.get('/', function(req, res) {
    var town = req.query.town;
    var townRange = parseInt(req.query.townRange);
    var townData = res.locals.util.loadJSON('./data/dong_data.json');
    var towns = res.locals.util.getNeighborhoodTownsBFS(townData, town, townRange);
    res.status(200).send({towns:towns});
});

module.exports = router;