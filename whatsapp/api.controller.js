const express = require('express');
const router = express.Router();
const apiService = require('./api.service');

// routes
router.post('/checkregistereduser', checkRegisteredUser);
router.post('/register', register);
router.get('/lessonlist', getLessonList);
router.get('/lessondetaillist', getLessonDetailedList);
router.get('/statedata', getStateMaster);
router.get('/assessments', getAssessments);
router.get('/assessmentswithquestions', getAssessmentsWithQuestions);
router.get('/getDepartmentSubjects',getDepartmentSubjects);
router.get('/getAllWithSubjects', getAllWithSubjects);
router.get('/designations',designations)
 
module.exports = router;

function getAllWithSubjects(req, res, next) {
  apiService.getAllWithSubjects(req.body)
      .then(subjectmasters => res.json(subjectmasters))
      .catch(err => next(err));
}

function getDepartmentSubjects(req, res, next){
  apiService.getDepartmentSubjects(req.body)
    .then(user => user ? res.json(user) : res.status(400).json({ "message": e }))
    .catch(err => next(err));
}

function designations(req, res, next){
  apiService.designations(req.body)
    .then(user => user ? res.json(user) : res.status(400).json({ "message": e }))
    .catch(err => next(err));
}

function checkRegisteredUser(req, res, next) {
  apiService.checkRegisteredUser(req.body)
      .then(user => user ? res.json(user) : res.status(400).json({ message: 'User is not registered' }))
      .catch(err => next(err));
}

function register(req, res, next) {
  apiService.register(req.body)
      .then(user => user ? res.json(user) : res.status(400).json({ "message": e }))
      .catch(err => next(err));
}

function getStateMaster(req, res, next) {
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
  apiService.getStateMaster(stateid, userid)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function getLessonList(req, res, next) {
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
  apiService.getLessons(stateid, departmentid)
    .then(lessons => res.json(lessons))
    .catch(err => next(err));
}

function getLessonDetailedList(req, res, next) {
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
  apiService.getLessonDetailedList(stateid, departmentid, pageno, perpage)
    .then(lesson => lesson ? res.json(lesson) : res.sendStatus(404))
    .catch(err => next(err));
}

function getAssessments(req, res, next) {
  if (!req.query.state) {
    stateid = "";
  }
  else {
    stateid = req.query.state;
  }
  apiService
    .getAssessments(stateid)
    .then((assessments) => res.json(assessments))
    .catch((err) => next(err));
}

function getAssessmentsWithQuestions(req, res, next) {
  if (!req.query.state) {
    stateid = "";
  }
  else {
    stateid = req.query.state;
  }  
  apiService
    .getAssessmentsWithQuestions(stateid)
    .then((assessments) => res.json(assessments))
    .catch((err) => next(err));
}

