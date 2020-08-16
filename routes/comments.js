var express = require('express');
var router = express.Router();
var Post = require('../models/Post');
const authMiddleware = require('../middlewares/auth');

// 댓글 작성
router.post('/:id', authMiddleware, async function(req, res) {
    var postId = req.params.id;
    var post = await Post.findOneAndUpdate({_id:postId}, {
        $push : {comments : req.body}
    }, {
        new : true
    });
    res.status(200).json(post);
});

// 댓글 삭제
router.delete('/:id/:commentId', authMiddleware, async function(req, res) {
    var postId = req.params.id;
    var commentId = req.params.commentId;
    var post = await Post.findOne({_id:postId}, {comments:true});
    var delComment = post.comments.filter(comment => comment._id.toString() === commentId)[0];
    var numOfChildComments = post.comments.filter(comment => comment.parentComment && comment.parentComment.toString() === commentId).length;
    var queryParam1, queryParam2;

    if(numOfChildComments != 0) {
        // 자식 댓글 있으면 isDeleted = true
        queryParam1 = { _id:postId, "comments._id":commentId };
        queryParam2 = { $set : {"comments.$.isDeleted":true} };
    } else {
        // 자식 댓글 없으면 삭제
        // 부모 댓글의 isDeleted == true이고,
        // 같은 부모댓글을 공유하는 것이 더 없으면 부모 댓글도 삭제
        queryParam1 = { _id:postId};
        queryParam2 = { $pull : {"comments":{_id:commentId}}};
        var parentCommentId = delComment.parentComment; // 부모댓글ID
        if(parentCommentId) {
            var numOfSameParentComment = post.comments.filter(comment => comment.parentComment && comment.parentComment.toString() === parentCommentId.toString()).length;
            var isDeleted = await Post.countDocuments({_id:postId, "comments._id":parentCommentId, "comments.isDeleted":true});
            if(isDeleted === 1 && numOfSameParentComment === 1) {
                queryParam2 = {$pull : {"comments" : {$or : [{_id:parentCommentId}, {_id:commentId}]}}};
            }
        }
    }
    post = await Post.findOneAndUpdate(queryParam1,queryParam2, {
        new : true
    });
    res.status(200).json(post);
});

module.exports = router;