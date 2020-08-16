var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var {stream} = require('./config/winston');
var morgan = require('morgan');
var util = require('./util');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// DB 설정
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB);
var db = mongoose.connection;
db.once('open', function() {
    console.log('DB connected');
});
db.on('error', function(err) {
    console.log('DB ERROR : ', err);
});

var Categories = require('./models/Categories');
require('./models/User');
require('./models/Post');
require('./models/Comment');
require('./models/Category');
require('./models/Image');

var express = require('express');
var app = express();

// 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan('combined', {stream}));

// custom middleware
app.use(function(req, res, next) {
    res.locals.util = util;
    next();
})


// DB schema 초기화 middleware
app.use(async function(req, res, next) {
    var count = await Categories.countDocuments({});
    if(count != 0) {
        next();
        return;
    }
    categories = {'중고거래' :
    ['인기매물', '디지털/가전', '가구/인테리어', '유아동/유아도서', '생활/가공식품',
    '스포츠/레저', '여성잡화', '여성의류', '남성패션/잡화', '게임/취미', '뷰티/미용',
    '반려동물용품', '도서/티켓/음반', '기타 중고물품', '삽니다'],
    '동네홍보' :
    ['중고차/오토바이', '동네 구인구직', '부동산', '농수산물',
    '지역업체 소개', '과외/클래스 모집', '전시/공연/행사'] };

    var catObjs = [];
    for(var key in categories) {
        var cat = {type:key};
        var items = []
        for(var category of categories[key]) {
            items.push({name:category});
        }
        cat.categories = items;
        catObjs.push(cat);
    }
    var cats = await Categories.create(catObjs);
    console.log(cats, "\ncategories created");
    next();
});

// swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(require('./config/swaggerDoc')));

// routes
app.use('/', require('./routes/home'));
app.use('/posts', require('./routes/posts'));
app.use('/categories', require('./routes/categories'));
app.use('/comments', require('./routes/comments'));
app.use('/images', require('./routes/images'));
app.use('/towns', require('./routes/towns'));

// port
var port = 3000;
app.listen(port, function() {
    console.log('server start!');
});
