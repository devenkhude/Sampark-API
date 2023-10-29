const express = require("express");
const router = express.Router();
const webAssessmentService = require("./webassessments.service");

// routes
router.post('/validateSRNumber', validateSRNumber);
router.post('/saveAssessmentResults', saveAssessmentResults);
router.post('/registerStudent', registerStudent);
router.get('/getAssessmentClass', getAssessmentClass);
router.get('/getValidIdForDeepLink', getValidIdForDeepLink);

module.exports = router;

function validateSRNumber(req, res, next) {
  webAssessmentService
    .validateSRNumber(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function saveAssessmentResults(req, res, next) {
  webAssessmentService
    .saveAssessmentResults(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function registerStudent(req, res, next) {
  webAssessmentService
    .registerStudent(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getAssessmentClass(req, res, next) {
  webAssessmentService
    .getAssessmentClass(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getValidIdForDeepLink(req, res, next) {
  webAssessmentService
    .getValidIdForDeepLink(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}
