const express = require('express');
const router = express.Router();
const categoryService = require('./category.service');

// routes
router.post('/create', create);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function create(req, res, next) {
    categoryService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    categoryService.getAll()
        .then(categories => res.json(categories))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    categoryService.getById(req.category.sub)
        .then(category => category ? res.json(category) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    categoryService.getById(req.params.id)
        .then(category => category ? res.json(category) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    categoryService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    categoryService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
