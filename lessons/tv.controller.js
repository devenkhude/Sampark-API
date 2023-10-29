const express = require('express');
const router = express.Router();
const tvService = require('./tv.service');

// routes
router.post('/create', create);
router.post('/all', getAll);
router.get('/', getAllLessons);
router.get('/list', getList);
router.get('/search', search);
router.get('/current', getCurrent);
router.get('/edit/:id', edit);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);
router.post('/lessonDetails',lessonDetails)
router.post('/syncQRCode', syncQRCode)

module.exports = router;

function syncQRCode(req, res,next) {
  tvService.syncQRCode(req)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function lessonDetails(req, res,next) {

  console.log(req.body)
  tvService.postLessonsDetails(req)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

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
  tvService.search(searchstring, device_id, userid)
    .then(streams => res.json(streams))
    .catch(err => next(err));
}

function create(req, res, next) {
  tvService.create(req)
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
  if (!req.query.state) {
    stateid = "";
  }
  else {
    stateid = req.query.state;
  }
  if (!req.query.department) {
    departmentid = "";
  }
  else {
    departmentid = req.query.department;
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
  tvService.getLessons(stateid, departmentid, userid, device_id, apk_version)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function getAll(req, res, next) {
  tvService.getAll(req)
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

  tvService.getAllbyDepartmentSubject(departmentname, subjectname, userid, category)
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
  tvService.getById(req.lesson.sub, userid, device_id)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    .catch(err => next(err));
}

function edit(req, res, next) {
  tvService.edit(req.params.id)
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
  if (!req.query.page) {
    pageno = "";
  }
  else {
    pageno = req.query.page;
  }
  if (pageno == "undefined") {
    pageno = "1";
  }
  if (!req.query.perpage) {
    perpage = "";
  }
  else {
    perpage = req.query.perpage;
  }
  if (perpage == "undefined") {
    perpage = "1";
  }
  tvService.getById(req.params.id, userid, pageno, perpage)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    .catch(err => next(err));
}


function update(req, res, next) {
  tvService.update(req.params.id, req)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    //.then(() => res.json({}))
    .catch(err => next(err));
}

function _delete(req, res, next) {
  tvService.delete(req.params.id)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    //.then(() => res.json({}))
    .catch(err => next(err));
}
