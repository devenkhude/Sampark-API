const express = require('express');
const router = express.Router();
const activityService = require('./activity.service');

// routes
router.post('/create', create);
router.post('/upload', upload);
router.get('/all', getAll);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function upload(req, res, next) {
    activityService.upload(req)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function create(req, res, next) {
    activityService.create(req)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    activityService.getAll()
        .then(activities => res.json(activities))
        .catch(err => next(err));
}

function getAllActivities(req, res, next) {
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
    if (!req.query.category) {
      category = "";
    }
    else {
      category = req.query.category;
    }
    if (userid == "undefined") {
      userid = "";
    }
        
    activityService.getAllbyDepartmentSubject(departmentname, subjectname, userid, category)
        .then(activities => res.json(activities))
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
    activityService.getById(req.activity.sub, userid)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    activityService.edit(req.params.id)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
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
    activityService.getById(req.params.id, userid)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    activityService.update(req.params.id, req)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    activityService.delete(req.params.id)
        .then(activity => activity ? res.json(activity) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
