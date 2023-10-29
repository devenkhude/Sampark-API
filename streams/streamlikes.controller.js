const express = require('express');
const router = express.Router();
const streamService = require('./stream.service');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function getAll(req, res, next) {
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
    
    streamService.getAllbyDepartmentSubject(departmentname, subjectname)
        .then(streams => res.json(streams))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    streamService.getById(req.stream.sub)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    streamService.getById(req.params.id)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    streamService.likeit(req.body)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    streamService.update(req.params.id, req.body)
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
