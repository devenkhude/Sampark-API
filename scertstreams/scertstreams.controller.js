const express = require('express');
const router = express.Router();
const userService = require('../users/user.service');
const scertstreamService = require('./scertstream.service');

// routes
router.post('/create', create);
router.get('/videos', getVideos);
router.get('/all', getAll);
router.get('/search', search);
//router.get('/', getAllScertstreams);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/activation/:id', activation);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    scertstreamService.create(req)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getVideos(req, res, next) {
    scertstreamService.getVideos()
        .then(scertstreams => res.json(scertstreams))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    scertstreamService.getAll()
        .then(scertstreams => res.json(scertstreams))
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
    scertstreamService.search(searchstring,device_id,userid,social_hours,updatetime)
        .then(scertstreams => res.json(scertstreams))
        .catch(err => next(err));
}

function getAllScertstreams(req, res, next) {
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
    if (!req.query.searchstring) {
      searchstring = "";
    }
    else {
      searchstring = req.query.searchstring;
    }
    if (userid == "undefined") {
      userid = "";
    }    
    scertstreamService.getAllScertstreams(device_id,userid,pull,timestamp,social_hours,updatetime,searchstring)
        .then(scertstreams => res.json(scertstreams))
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
    scertstreamService.getById(req.scertstream.sub, userid)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    scertstreamService.edit(req.params.id)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
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
    scertstreamService.getById(req.params.id, userid)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    scertstreamService.update(req.params.id, req)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function activation(req, res, next) {
    scertstreamService.activation(req.params.id, req)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    scertstreamService.delete(req.params.id)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
