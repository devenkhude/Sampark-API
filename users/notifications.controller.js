const express = require('express');
const router = express.Router();
const userService = require('../users/user.service');
const notificationService = require('./notification.service');

// routes
router.get('/', getall);

module.exports = router;

function getall(req, res, next) {
  
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (!req.query.timestamp) {
      timestamp = "";
    }
    else {
      timestamp = req.query.timestamp;
    }
    notificationService.getall(userid, timestamp)
        .then(notifications => res.json(notifications))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
