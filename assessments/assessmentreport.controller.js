const express = require("express");
const router = express.Router();
const assessmentReportService = require("./assessmentreport.service");

// routes
router.post("/registerStudent", registerStudent);
router.put('/deActivateStudent/:id', deActivateStudent);
router.get("/getAssessmentClass", getAssessmentClass);
router.get("/getClassStudentRport", getClassStudentRport);
router.get("/getStudentDetail", getStudentDetail);
router.get("/getAssessmentSubjects", getAssessmentSubjects);
router.get('/getClasswiseReport', getClasswiseReport);
router.get('/getAllSubjectReport', getAllSubjectReport);
router.post("/registerStudentForNewAPK", registerStudentForNewAPK);
module.exports = router;

function registerStudent(req, res, next) {
  assessmentReportService
    .registerStudent(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getClassStudentRport(req, res, next) {
  assessmentReportService
    .getClassStudentRport(req)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getAssessmentClass(req, res, next) {
  assessmentReportService
    .getAssessmentClass(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}
function getStudentDetail(req, res, next) {
  assessmentReportService
    .getStudentDetail(req)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}
function getAssessmentSubjects(req, res, next) {
  assessmentReportService
    .getAssessmentSubjects(req)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getClasswiseReport(req, res, next) {
  assessmentReportService
    .getClasswiseReport(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
} 

function getAllSubjectReport(req, res, next) {
  assessmentReportService
    .getAllSubjectReport(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function deActivateStudent(req, res, next) {
  assessmentReportService
    .deActivateStudent(req.params.id, req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function registerStudentForNewAPK(req, res, next) {
  assessmentReportService
    .registerStudentForNewAPK(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}