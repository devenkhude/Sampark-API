const express = require("express");
const router = express.Router();
const assessmentService = require("./assessments.service");

// routes
router.get("/importExcel", importExcel);
router.get("/hindiImportExcel", hindiImportExcel);
router.get("/importExcelStudents", importExcelStudents);
router.get("/importExcelParents", importExcelParents);
router.get("/getClassesAndStudents", getClassesAndStudents);  
router.get('/getAssessments', getAssessments);
router.get('/getQuesionwiseReport', getQuesionwiseReport);
router.get('/getQuestions', getQuestions);
router.post('/saveAssessmentResults', saveAssessmentResults);
router.post('/saveAssessmentResultsForPT', saveAssessmentResultsForPT);
router.get('/getChildrenForParent', getChildrenForParent);
router.post("/registerStudent", registerStudent);
router.get("/getAssessmentClass", getAssessmentClass);
router.get('/getAssessmentsForPT', getAssessmentsForPT);
router.get('/getClassStudents', getClassStudents);
router.get('/importExcelSchool', importExcelSchool);
router.get('/getRewardDetails', getRewardDetails);
router.get('/getSSSAssessment', getSSSAssessment);
router.post("/rewardOpened", rewardOpened);
router.get("/getClasses", getClasses);
router.get("/getStudents", getStudents);

module.exports = router;

function importExcelSchool(req, res, next) {
  assessmentService
    .importExcelSchool(req.body)
    .then((data) => res.json(data))
    .catch((err) => next(err));
}

function importExcel(req, res, next) {
  assessmentService
    .importExcel(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function hindiImportExcel(req, res, next) {
  assessmentService
    .hindiImportExcel(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function importExcelStudents(req, res, next) {
  assessmentService
    .importExcelStudents(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function importExcelParents(req, res, next) {
  assessmentService
    .importExcelParents(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getClassesAndStudents(req, res, next) {
  assessmentService
    .getClassesAndStudents(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getAssessments(req, res, next) {
  assessmentService
    .getAssessments(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getQuesionwiseReport(req, res, next) {
  assessmentService
    .getQuesionwiseReport(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getQuestions(req, res, next) {
  assessmentService
    .getQuestions(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function registerStudent(req, res, next) {
  assessmentService
    .registerStudent(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function rewardOpened(req, res, next) {
  assessmentService
    .rewardOpened(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function saveAssessmentResults(req, res, next) {
  assessmentService
    .saveAssessmentResults(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function saveAssessmentResultsForPT(req, res, next) {
  assessmentService
    .saveAssessmentResultsForPT(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getAssessmentClass(req, res, next) {
  assessmentService
    .getAssessmentClass(req.body)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getAssessmentsForPT(req, res, next) {
  assessmentService
    .getAssessmentsForPT(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getClassStudents(req, res, next) {
  assessmentService
    .getClassStudents(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getRewardDetails(req, res, next) {
  assessmentService
    .getRewardDetails(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}
function getSSSAssessment(req, res, next) {
  assessmentService
    .getSSSAssessment(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getChildrenForParent(req, res, next) {
  assessmentService
    .getChildrenForParent(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getClasses(req, res, next) {
  assessmentService
    .getClasses(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}

function getStudents(req, res, next) {
  assessmentService
    .getStudents(req.query)
    .then((user) => res.json(user))
    .catch((err) => next(err));
}
