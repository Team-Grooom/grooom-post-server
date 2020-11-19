var express  = require('express');
const request = require('request');
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



/**
 * @swagger
 * /towns/getTownName:
 *   get:
 *     description: 인근 동 조회 /towns/getTownName?lon=&lat=
 *     tags: [Town]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "lon"
 *       in: "query"
 *       description: "lon"
 *       type: "string"
 *     - name: "lat"
 *       in: "query"
 *       description: "lat"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "success"
*/
router.get('/getTownName', (req, res) => {
    const lon = req.query.lon;
    const lat = req.query.lat;
    if(!lon || !lat) {
        return res.status(400).json({success:false, err:"lon or lat is empty"});
    }
    const uri = encodeURI(`https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?request=coordsToaddr&coords=${lon},${lat}&sourcecrs=epsg:4326&output=json&orders=admcode`);
    var options = {
        "uri" : uri,
        "headers" :  {
            "X-NCP-APIGW-API-KEY-ID" : process.env.CLIENT_ID,
            "X-NCP-APIGW-API-KEY" : process.env.CLIENT_SECRET
        },
    }

    request.get(options, (err, _res, body ) => {
        if(err) return res.send(err);
	try {
		const obj = JSON.parse(body).results[0];
        	const regions = obj.region;
        	let result = regions.area1.name + ' ' + regions.area2.name + ' ' + regions.area3.name;
        	result = result.replace(/\./g, '·');
        	res.status(200).json({success:true, result:result});
	} catch(exception) {
		return res.status(400).json({success:false, err:"empty region error"});
	}
    })
});

module.exports = router;
