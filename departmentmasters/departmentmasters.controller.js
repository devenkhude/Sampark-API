const express = require('express');
const router = express.Router();
const departmentmasterService = require('./departmentmaster.service');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/withsubjects', getAllWithSubjects);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

function create(req, res, next) {
    departmentmasterService.create(req)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAllWithSubjects(req, res, next) {
    departmentmasterService.getAllWithSubjects()
        .then(subjectmasters => res.json(subjectmasters))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    departmentmasterService.getAll()
        .then(departmentmasters => res.json(departmentmasters))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    departmentmasterService.getById(req.departmentmaster.sub)
        .then(departmentmaster => departmentmaster ? res.json(departmentmaster) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    departmentmasterService.getById(req.params.id)
        .then(departmentmaster => departmentmaster ? res.json(departmentmaster) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    departmentmasterService.update(req.params.id, req)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    departmentmasterService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

module.exports = router;