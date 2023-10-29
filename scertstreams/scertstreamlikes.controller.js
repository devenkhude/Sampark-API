const express = require('express');
const router = express.Router();
const scertstreamService = require('./scertstream.service');

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
    
    scertstreamService.getAllbyDepartmentSubject(departmentname, subjectname)
        .then(scertstreams => res.json(scertstreams))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    scertstreamService.getById(req.scertstream.sub)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    scertstreamService.getById(req.params.id)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    scertstreamService.likeit(req.body)
        .then(scertstream => scertstream ? res.json(scertstream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    scertstreamService.update(req.params.id, req.body)
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
