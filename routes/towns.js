var express  = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    var town = req.query.town;
    var townRange = parseInt(req.query.townRange);
    var townData = res.locals.util.loadJSON('./data/dong_data.json');
    var towns = res.locals.util.getNeighborhoodTownsBFS(townData, town, townRange);
    res.status(200).send({towns:towns});
});

module.exports = router;