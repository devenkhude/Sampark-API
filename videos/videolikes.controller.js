const express = require('express');
const router = express.Router();
const videoService = require('./video.service');

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
    
    videoService.getAllbyDepartmentSubject(departmentname, subjectname)
        .then(videos => res.json(videos))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    videoService.getById(req.video.sub)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    videoService.getById(req.params.id)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        .catch(err => next(err));
}

function create(req, res, next) {
    videoService.likeit(req.body)
        .then(video => video ? res.json(video) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function update(req, res, next) {
    videoService.update(req.params.id, req.body)
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
