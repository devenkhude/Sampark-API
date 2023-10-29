const express = require('express');
const router = express.Router();
const lessonService = require('./lesson.service');

// routes
router.post('/create', create);
router.post('/all', getAll);
router.post('/vocabularyviewed', vocabularyviewed);
router.get('/', getAllLessons);
router.get('/list', getList);
router.get('/search', search);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);


module.exports = router;

function search(req, res, next) {
  if (!req.query.device_id) {
    device_id = "";
  }
  else {
    device_id = req.query.device_id;
  }
  if (!req.query.user) {
    userid = "";
  }
  else {
    userid = req.query.user;
  }
  if (!req.query.searchstring) {
    searchstring = "";
  }
  else {
    searchstring = req.query.searchstring;
  }
  if (userid == "undefined") {
    userid = "";
  }
  lessonService.search(searchstring, device_id, userid)
    .then(streams => res.json(streams))
    .catch(err => next(err));
}

function create(req, res, next) {
  lessonService.create(req)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    //.then(() => res.json({}))
    .catch(err => next(err));
}

function getList(req, res, next) {
  if (!req.query.user) {
    userid = "";
  }
  else {
    userid = req.query.user;
  }
  if (userid == "undefined") {
    userid = "";
  }
  if (!req.query.device_id) {
    device_id = "";
  }
  else {
    device_id = req.query.device_id;
  }
  if (!req.query.apk_version) {
    apk_version = "";
  }
  else {
    apk_version = req.query.apk_version;
  }

  if (device_id == "undefined") {
    device_id = "";
  }
  lessonService.getList(userid, device_id, apk_version)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function getAll(req, res, next) {
  lessonService.getAll(req)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function vocabularyviewed(req, res, next) {
  lessonService.vocabularyviewed(req)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function getAllLessons(req, res, next) {
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
  if (!req.query.category) {
    category = "";
  }
  else {
    category = req.query.category;
  }

  lessonService.getAllbyDepartmentSubject(departmentname, subjectname, userid, category)
    .then(lessons => res.json(lessons))
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
  if (!req.query.device_id) {
    device_id = "";
  }
  else {
    device_id = req.query.device_id;
  }
  if (device_id == "undefined") {
    device_id = "";
  }
  lessonService.getById(req.lesson.sub, userid, device_id)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    .catch(err => next(err));
}

function edit(req, res, next) {
  lessonService.edit(req.params.id)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
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
  lessonService.getById(req.params.id, userid)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    .catch(err => next(err));
}


function update(req, res, next) {
  lessonService.update(req.params.id, req)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    //.then(() => res.json({}))
    .catch(err => next(err));
}

function _delete(req, res, next) {
  lessonService.delete(req.params.id)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    //.then(() => res.json({}))
    .catch(err => next(err));
}
