const express = require('express');
const router = express.Router();
const audioService = require('./audio.service');

// routes
router.post('/create', create);
router.get('/all', getAll);
router.get('/', getAllAudios);
router.get('/current', getCurrent);
router.get('/getByQRCode/:id', getByQRCode);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    audioService.create(req)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
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
    audioService.getAll(module)
        .then(audios => res.json(audios))
        .catch(err => next(err));
}

function getAllAudios(req, res, next) {
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
    
    audioService.getAllbyDepartmentSubject(departmentname, subjectname, userid)
        .then(audios => res.json(audios))
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
    audioService.getById(req.audio.sub, userid)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    audioService.edit(req.params.id)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
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
    audioService.getByQRCode(req.params.id, userid)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
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
    audioService.getById(req.params.id, userid)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    audioService.update(req.params.id, req)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    audioService.delete(req.params.id)
        .then(audio => audio ? res.json(audio) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
