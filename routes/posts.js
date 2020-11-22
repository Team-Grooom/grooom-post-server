var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var ObjectId = require('mongodb').ObjectId;
var client = require('../elasticsearch/client');
const Categories = require('../models/Categories');
const authMiddleware = require('../middlewares/auth');
const s3 = require('../config/s3');

/**
 * @swagger
 * tags:
 *   name: Post
 *   description: 게시글 처리
 * definitions:
 *   Post:
 *     type: "object"
 *     properties:
 *       title:
 *         type: "string"
 *       description:
 *         type: "string"
 *       writer:
 *         type: "string"
 *       category:
 *         type: "string"
 *       price:
 *         type: "integer"
 *         format: "int64"
 *       state:
 *         type: "integer"
 *         format: "int64"
 *       images:
 *         type: "array"
 *         items:
 *           type: "string"
 *       town:
 *         type: "string"
 *       townRange:
 *         type: "integer"
 *         format: "int64"
 *       isSuggestable:
 *         type: "boolean"
*/


/**
 * @swagger
 * /posts/report/{id}/{userId}:
 *   post:
 *     description: 게시글 신고
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       required: true
 *       type: "string"
 *     - name: "userId"
 *       in: "path"
 *       description: "유저 id"
 *       required: true
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful reporting"
 *     
*/
router.post('/report/:id/:userId', authMiddleware, async function(req, res) {
  var id = req.params.id;
  var userId = req.params.userId;
  var post = await Post.findOne({_id:new ObjectId(id), reports:new ObjectId(userId)});
  if(post) {
    res.json({message:"already reported!"});
  } else {
    post = await Post.findOneAndUpdate({_id:new ObjectId(id)}, {
      $push : {reports : new ObjectId(userId)}, 
    }, {
      new : true
    })
    .populate({path:'writer', select:['nickName', 'place']})
    .populate({path:'comments.writer', select:'nickName'});
    res.status(200).json(post);
  }
  // 신고 후의 처리?
});


/**
 * @swagger
 * /posts/like/{id}/{userId}:
 *   post:
 *     description: 게시글 관심상품 등록
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       required: true
 *       type: "string"
 *     - name: "userId"
 *       in: "path"
 *       description: "유저 id"
 *       required: true
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.post('/like/:id/:userId', authMiddleware, async function(req, res) {
  var id = req.params.id;
  var userId = req.params.userId;
  var queryParam = {};
  var post = await Post.findOne({_id:new ObjectId(id), likes:new ObjectId(userId)});
  if(post) {
    queryParam.$pull = {likes:new ObjectId(userId)};
  } else {
    queryParam.$push = {likes:new ObjectId(userId)};
  }
  post = await Post.findOneAndUpdate({_id:new ObjectId(id)}, queryParam, {
    new : true
  });
  res.status(200).json({likes : post.likes});
})

/**
 * @swagger
 * /posts/ranking:
 *   get:
 *     description: 인기검색어 조회
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.get('/ranking', async function(req, res) {
  var numOfQuery = 10; // 조회할 인기검색어 개수
  var items = [];
  var result = await client.search({
    index : 'search_logs',
    type : 'search_log',
    body : {
      "aggs" : {
        "byCount" : {
            "terms" : {
                "field" : "log.raw",
                "order" : {"_count" : "desc"},
                "size":numOfQuery
            }
        }
      },
    "size" : 0
    }
  });
  items = result.body.aggregations.byCount.buckets.map(x => x.key);
  res.status(200).json({result : items});
});

/**
 * @swagger
 * /posts/autocomplete:
 *   get:
 *     description: 게시글 자동완성 검색어
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "query"
 *       in: "query"
 *       description: "검색어"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.get('/autocomplete', async function(req, res) {
  var query = req.query.query;
  var items = [];
  if(query) {
    var result = await client.search({
      index : 'search_logs',
      type : 'search_log',
      body : {
        "query" : {
            "match" : {"log" : query}
        },
        "aggs" : {
          "byCount" : {
              "terms" : {
                  "field" : "log.raw",
                  "size" : 15,
                  "order" : { "_count" : "desc" }
              }
          }
        },
        "size" : 0
      }
    });
    items = result.body.aggregations.byCount.buckets.map(x => x.key);
  }
  res.status(200).json({result:items});
});

/**
 * @swagger
 * /posts/relation/{id}:
 *   get:
 *     description: 게시글 연관상품 조회
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "카테고리 id"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.get('/relation/:id', async function(req, res) {
  var categoryId = req.params.id;
  var posts = await Post.aggregate([
    {$match : {
      category : new ObjectId(categoryId),
      state : {$in : [-1,0]}
    } },
    { $sample : {size : 8}}
  ]);
  res.status(200).json(posts);
});

/**
 * @swagger
 * /posts/state/{id}:
 *   post:
 *     description: 게시글 상태 변경 -1(판매중), 0(예약), 1(판매완료)
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       type: "string"
 *     - name: "state"
 *       in: "query"
 *       description: "게시글 상태 -1(판매중), 0(예약), 1(판매완료)"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.post('/state/:id', authMiddleware, function(req, res) {
  Post.findOneAndUpdate(
    {_id : new ObjectId(req.params.id)},
    {$set : {state : parseInt(req.query.state)} }
  ).exec(function(err, post) {
     if(err) {
       return res.status(400).json(err);
     } 
     res.status(200).json({message : "success"});
  });
});

/**
 * @swagger
 * /posts/buyer/{id}/{userId}:
 *   post:
 *     description: 게시글 구매자 등록
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       type: "string"
 *     - name: "userId"
 *       in: "path"
 *       description: "유저 id"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.post('/buyer/:id/:userId', authMiddleware, function(req, res) {
  Post.findOneAndUpdate(
    {_id : new ObjectId(req.params.id)},
    {$set : {buyer : new ObjectId(req.params.userId)} }
  ).exec(function(err, post) {
     if(err) {
       return res.status(400).json(err);
     } 
     res.status(200).json({message : "success"});
  });
});


/**
 * @swagger
 * /posts:
 *   get:
 *     description: 게시글 조회
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "town"
 *       in: "query"
 *       description: "조회 동네"
 *       type: "string"
 *     - name: "townRange"
 *       in: "query"
 *       description: "조회 동네 범위"
 *       type: "string"
 *     - name: "category"
 *       in: "query"
 *       description: "조회할 카테고리 id, 중첩 가능. ex) category=1,2,3,4"
 *       type: "string"
 *     - name: "scroll"
 *       in: "query"
 *       description: "스크롤 횟수. 0부터 시작. 1, 2, 3, ..."
 *       type: "string"
 *     - name: "maxNum"
 *       in: "query"
 *       description: "초기에 불러온 게시물 갯수. 맨 처음엔 0. 그 뒤엔 불러온 갯수 고정.(무한스크롤하면서 새로올라오는 중복게시물 skip하기 위함)"
 *       type: "string"
 *     - name: "query"
 *       in: "query"
 *       description: "검색어"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.get('/', async function(req, res){
  
  var town = req.query.town;
  var townRange = parseInt(req.query.townRange);
  var categorys = req.query.category.trim().split(',');
  var scroll = parseInt(req.query.scroll); 
  var maxNum = parseInt(req.query.maxNum); // 초기의 전체 게시물개수 skip에 사용
  var query = req.query.query;
  var townData = res.locals.util.loadJSON('./data/dong_data.json');
  var towns = res.locals.util.getNeighborhoodTownsBFS(townData, town, townRange);

  var matchQuery = {
    category:{$in : categorys.map(x => new ObjectId(x))},
    town : {$in : towns}
  };

  if(query) {
    var cats = {};
    var categoryIDs = await Categories.find({});
    categoryIDs.forEach(x => {cats[x.type] = x.categories.map(xx=>xx._id.toString())} );
    client.index({
      index : "search_logs",
      type : "search_log",
      body : {
        "log" : query,
        "category" : res.locals.util.intersect(cats['중고거래'], categorys).length != 0 ? "중고거래" : "동네홍보",
        "timestamp" : res.locals.util.getCurrentTime()
      }
    });
    queryArray = query.split(' ').map(x => new RegExp(x));
    matchQuery.$or = [{title : {$in : queryArray}}, {description : {$in : queryArray}}]
  }
  
  var limit = 15; // limit 개수씩 조회
  var curMaxNum = await Post.countDocuments(matchQuery);
  var skip = (scroll * limit) + (maxNum != 0 ? curMaxNum - maxNum : 0);

  var posts = await Post.aggregate([
    {$match : matchQuery},
    { $sort : {regDate : -1}},
    { $skip : skip},
    { $limit : limit},
    { $project : {
      title : 1,
      town : 1,
      regDate : 1,
      images : 1,
      price : 1,
      likeCount : {$size:'$likes'},
      chattingUserCount : {$size:'$chattingUsers'},
      commentCount : {$size:'$comments'}
    }}
  ]).exec();
  res.status(200).json({posts:posts, maxNum:curMaxNum});
});


/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     description: 게시글 상세 조회
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.get('/:id', async function(req, res) {
  var post = await Post.findOne({_id:new ObjectId(req.params.id)})
  .populate({path:'writer', select:['nickName', 'place']})
  .populate({path:'comments.writer', select:'nickName'})
  .sort('regDate, comments.regDate');
  if(!post) {
    res.status(404).json({message:"404 error"});
    return;
  }

  post.views++;
  post.save();
  var clonedPost = res.locals.util.cloneObject(post);
  clonedPost.comments = res.locals.util.convertTo2HeightTrees(clonedPost.comments);
  res.status(200).json(clonedPost);
});

/**
 * @swagger
 * /posts:
 *   post:
 *     description: 게시물 생성
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "body"
 *       in: "body"
 *       description: "게시글 json"
 *       required: true
 *       schema:
 *         $ref: "#/definitions/Post"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.post('/', authMiddleware, async function(req, res) {
  images = req.body.images;
  if(images) {
    req.body.images = images.map(x => ({imageName:x}))
  }
  var post = await Post.create(req.body);
  res.status(200).json(post);
});


/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     description: 게시물 수정
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       type: "string"
 *     - name: "body"
 *       in: "body"
 *       description: "게시글 json"
 *       required: true
 *       schema:
 *         $ref: "#/definitions/Post"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.put('/:id', authMiddleware, async function(req, res) {
  if(req.body.images) {
    req.body.images = req.body.images.map(x => ({imageName:x}));
  }
  
  var post = await Post.findOneAndUpdate({
    _id:new ObjectId(req.params.id)
  }, req.body, {
    runValidators:true
  });
  if(req.body.images) {
    var originalImages = post.images.map(x => x.imageName.toString());
    var updateImages = req.body.images.map(x => x.imageName.toString());
    //var newImages = res.locals.util.difference(updateImages, originalImages);
    var deletedImages = res.locals.util.difference(originalImages, updateImages);
    console.log(deletedImages);
    for(var i=0; i<deletedImages.length; i++) {
      s3.deleteObject({
        Bucket : 'grooom-market',
        Key: deletedImages[i] + '.jpg'
      }, function(err, data) {});
    }
  }
  post = await Post.findOne({_id:new ObjectId(req.params.id)})
  .populate({path:'writer', select:['nickName', 'place']})
  .populate({path:'comments.writer', select:'nickName'});
  res.status(200).json(post);
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     description: 게시물 삭제
 *     tags: [Post]
 *     produces:
 *     - "application/json"
 *     parameters:
 *     - name: "id"
 *       in: "path"
 *       description: "게시글 id"
 *       type: "string"
 *     responses:
 *       "200":
 *         description: "successful operation"
 *     
*/
router.delete('/:id', authMiddleware, async function(req, res) {

  var id = req.params.id;
  var post = await Post.findOneAndDelete({_id:new ObjectId(id)});
  var deletedImages = post.images.map(x => x.imageName.toString());

  for(var i=0; i<deletedImages.length; i++) {
    console.log(deletedImages[i]);
    s3.deleteObject({
      Bucket : 'grooom-market',
      Key: deletedImages[i] + '.jpg'
    }, function(err, data){});
  }
  res.status(200).json({message:"success"});  
});


module.exports = router;
