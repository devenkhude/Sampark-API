const express = require('express');
const router = express.Router();
const userService = require('../users/user.service');
const streamService = require('./userstream.service');

// routes
router.get('/', getAllStreams);

module.exports = router;

function getAllStreams(req, res, next) {
    if (!req.query.stream_for) {
      stream_for = "";
    }
    else {
      stream_for = req.query.stream_for;
    }
    if (!req.query.device_id) {
      device_id = "";
    }
    else {
      device_id = req.query.device_id;
    }
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (!req.query.pull) {
      pull = "";
    }
    else {
      pull = req.query.pull;
    }
    if (!req.query.timestamp) {
      timestamp = "";
    }
    else {
      timestamp = req.query.timestamp;
    }
    if (!req.query.updatetime) {
      updatetime = "";
    }
    else {
      updatetime = req.query.updatetime;
    }
    if (!req.query.social_hours) {
      social_hours = "";
    }
    else {
      social_hours = req.query.social_hours;
    }
    if (userid == "undefined") {
      userid = "";
    }    
    streamService.getAllStreams(device_id,userid,pull,timestamp,social_hours,updatetime,stream_for)
        .then(streams => res.json(streams))
        .catch(err => next(err));
}
