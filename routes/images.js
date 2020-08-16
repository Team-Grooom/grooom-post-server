const router = require('express').Router();
const multer = require('multer');
const sharp = require('sharp');
const s3 = require('../config/s3');
const multerS3 = require('multer-s3');
const authMiddleware = require('../middlewares/auth');
const request = require('request');

/*
const upload = multer({
    storage : multer.diskStorage({
        destination : function(req, file, cb) {
            cb(null, imageDir);
        },
        filename : function(req, file, cb) {
            var filename = req.params.imageName;
            var ext = file.mimetype.split('/')[1];
            if(!['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
                return cb(new Error('Only images are allowed'))
            }
            cb(null, filename + '.jpg');
        }
    })
});
*/
const upload = multer({
    storage : multerS3({
        s3:s3,
        bucket:'grooom-market',
        key : function(req, file, cb) {
            var filename = req.params.imageName;
            var ext = file.mimetype.split('/')[1];
            if(!['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
                return cb(new Error('Only images are allowed'));
            }
            cb(null, filename + '.jpg');
        }
    }),
    acl : 'public-read-write'
});

router.post('/:imageName', authMiddleware, upload.single('file'), function(req, res) {
    res.status(200).json({message : "success"});
});

router.get('/:imageName', function(req, res) {
    var size = req.query.size;
    var imageUrl = process.env.AWS_S3_URL + req.params.imageName + '.jpg';
    var requestSettings = {
        url : imageUrl,
        method : 'GET',
        encoding : null
    }
    request(requestSettings, async function(err, response, body) {
        if(err) return;
        if(size) {
            size = size.split('x');
            res.status(200).set('Content-Type', 'image/jpg').send(await sharp(body).resize({width:parseInt(size[0]), height:parseInt(size[1]), fit: sharp.fit.contain}).toBuffer());
        }  else {
            res.status(200).set('Content-Type', 'image/jpg').send(body);
        }
    });
});

module.exports = router;