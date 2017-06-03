var express = require('express');
var router = express.Router();
var basicAuth = require('basic-auth-connect')
var config = require('../config/admin.json');
router.use(basicAuth(config.user, config.pass));
/* GET home page. */
router.get('/admin', function(req, res, next) {
    res.render('index', {mode: "admin"});
});

module.exports = router;
