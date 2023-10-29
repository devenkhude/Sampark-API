const express = require('express');
const router = express.Router();
const kitService = require('./kit.service');

// routes
router.post('/create', create);
router.post('/upload', upload);
router.get('/all', getAll);
router.get('/', getAllKits);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

module.exports = router;

function upload(req, res, next) {
    kitService.upload(req)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function create(req, res, next) {
    kitService.create(req)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    kitService.getAll()
        .then(kits => res.json(kits))
        .catch(err => next(err));
}

function getAllKits(req, res, next) {
    if (!req.query.user) {
      userid = "";
    }
    else {
      userid = req.query.user;
    }
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
    if (userid == "undefined") {
      userid = "";
    }
        
    kitService.getAllKits(userid, departmentname, subjectname)
        .then(kits => res.json(kits))
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
    kitService.getById(req.kit.sub, userid)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
        .catch(err => next(err));
}

function edit(req, res, next) {
    kitService.edit(req.params.id)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
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
    kitService.getById(req.params.id, userid)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    kitService.update(req.params.id, req)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    kitService.delete(req.params.id)
        .then(kit => kit ? res.json(kit) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
