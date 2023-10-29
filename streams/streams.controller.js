const express = require('express');
const router = express.Router();
const userService = require('../users/user.service');
const streamService = require('./stream.service');

// routes
router.post('/create', create);
router.delete('/rejectuserupload/:id', _rejectuserupload);
router.get('/aapkibaithakvideos', getAapkiBaithakVideos);
router.get('/balbaithakstreams', getBalBaithakStreams);
router.post('/all', getAll);
router.get('/search', search);
//router.get('/', getAllStreams);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/activation/:id', activation);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    streamService.create(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getAapkiBaithakVideos(req, res, next) {
    streamService.getAapkiBaithakVideos()
        .then(streams => res.json(streams))
        .catch(err => next(err));
}

function getBalBaithakStreams(req, res, next) { 
  streamService.getBalBaithakStreams(req)
      .then(streams => res.json(streams))
      .catch(err => next(err));
}

function getAll(req, res, next) {
    streamService.getAll(req)
        .then(streams => res.json(streams))
        .catch(err => next(err));
}

function search(req, res, next) {
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
    if (!req.query.searchstring) {
      searchstring = "";
    }
    else {
      searchstring = req.query.searchstring;
    }
    if (userid == "undefined") {
      userid = "";
    }
    streamService.search(searchstring,device_id,userid,social_hours,updatetime)
        .then(streams => res.json(streams))
        .catch(err => next(err));
}

function getAllStreams(req, res, next) {
    var stream_for = ""
    var device_id = ""
    var userid = ""
    var pull = ""
    var timestamp = ""
    var updatetime = ""
    var social_hours = ""
    var request_query = req.query;
    
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
    streamService.getAllStreams(device_id,userid,pull,timestamp,social_hours,updatetime,stream_for,request_query)
        .then(streams => res.json(streams))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (userid == "undefined") {
      userid = "";
    }
    streamService.getById(req.stream.sub, userid)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    streamService.edit(req.params.id)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (userid == "undefined") {
      userid = "";
    }
    streamService.getById(req.params.id, userid)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    streamService.update(req.params.id, req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function activation(req, res, next) {
    streamService.activation(req.params.id, req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    streamService.delete(req.params.id)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _rejectuserupload(req, res, next) {
    streamService.rejectuserupload(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
