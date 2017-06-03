var express = require('express');
var router = express.Router();
var basicAuth = require('basic-auth-connect')

router.use(basicAuth('test', 'test'));
/* GET home page. */
router.get('/admin', function(req, res, next) {
    res.render('index', {mode: "admin"});
});

module.exports = router;
