const authMiddleware = function(req, res, next) {
    console.log('로그인확인');
    next();
}

module.exports = authMiddleware;