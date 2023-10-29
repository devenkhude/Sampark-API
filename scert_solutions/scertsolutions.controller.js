const express = require('express');
const router = express.Router();
const scertsolutionService = require('./scertsolution.service');

// routes
router.post('/create', create);
router.post('/upload', upload);
router.get('/all', getAll);
router.get('/', getAllScertsolutions);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function upload(req, res, next) {
    scertsolutionService.upload(req)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function create(req, res, next) {
    scertsolutionService.create(req)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    scertsolutionService.getAll()
        .then(scertsolutions => res.json(scertsolutions))
        .catch(err => next(err));
}

function getAllScertsolutions(req, res, next) {
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (userid == "undefined") {
      userid = "";
    }
    scertsolutionService.getAll(userid)
        .then(scertsolutions => res.json(scertsolutions))
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
    scertsolutionService.getById(req.scertsolution.sub, userid)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    scertsolutionService.edit(req.params.id)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
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
    scertsolutionService.getById(req.params.id, userid)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    scertsolutionService.update(req.params.id, req)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    scertsolutionService.delete(req.params.id)
        .then(scertsolution => scertsolution ? res.json(scertsolution) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
