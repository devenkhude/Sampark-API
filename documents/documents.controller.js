const express = require('express');
const router = express.Router();
const documentService = require('./document.service');

// routes
router.post('/create', create);
router.post('/upload', upload);
router.get('/all', getAll);
router.get('/', getAllDocuments);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function upload(req, res, next) {
    documentService.upload(req)
        .then(document => document ? res.json(document) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function create(req, res, next) {
    documentService.create(req)
        .then(document => document ? res.json(document) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    documentService.getAll()
        .then(documents => res.json(documents))
        .catch(err => next(err));
}

function getAllDocuments(req, res, next) {
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
    if (userid == "undefined") {
      userid = "";
    }
        
    documentService.getAll(userid)
        .then(documents => res.json(documents))
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
    documentService.getById(req.document.sub, userid)
        .then(document => document ? res.json(document) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    documentService.edit(req.params.id)
        .then(document => document ? res.json(document) : res.sendStatus(404))
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
    documentService.getById(req.params.id, userid)
        .then(document => document ? res.json(document) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    documentService.update(req.params.id, req)
        .then(document => document ? res.json(document) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    documentService.delete(req.params.id)
        .then(document => document ? res.json(document) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
