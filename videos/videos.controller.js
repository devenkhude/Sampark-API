const express = require('express');
const router = express.Router();
const videoService = require('./video.service');

// routes
router.post('/create', create);
router.get('/all', getAll);
//router.get('/', getAllVideos);
router.get('/current', getCurrent);
//router.get('/getByQRCode/:id', getByQRCode);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    videoService.create(req)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    if (!req.query.module) {
      module = "";
    }
    else {
      module = req.query.module;
    }
    videoService.getAll(module)
        .then(videos => res.json(videos))
        .catch(err => next(err));
}

function getAllVideos(req, res, next) {
    if (!req.query.subject) {
      subjectname = "";
    }
    else {
      subjectname = req.query.subject;
    }
    if (!req.query.department) {
      departmentname = "";
    }
    else {
      departmentname = req.query.department;
    }
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (userid == "undefined") {
      userid = "";
    }
    if (!req.query.category) {
      category = "";
    }
    else {
      category = req.query.category;
    }
        
    videoService.getAllbyDepartmentSubject(departmentname, subjectname, userid, category)
        .then(videos => res.json(videos))
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
    videoService.getById(req.video.sub, userid)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    videoService.edit(req.params.id)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        .catch(err => next(err));
}

function getByQRCode(req, res, next) {
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (userid == "undefined") {
      userid = "";
    }
    videoService.getByQRCode(req.params.id, userid)
        .then(video => video ? res.json(video) : res.sendStatus(404))
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
    videoService.getById(req.params.id, userid)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    videoService.update(req.params.id, req)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    videoService.delete(req.params.id)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
