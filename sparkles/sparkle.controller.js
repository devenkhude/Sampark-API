const express = require('express');
const router = express.Router();
const sparkleService = require('./sparkle.service');

// routes
router.post('/awardSparkle', awardSparkle);
router.post('/topTeachers', topTeachers);
router.post('/topSchools', topSchools);
router.post('/topBlocks', topBlocks);
router.post('/topTeachersByState', topTeachersByState);
router.post('/topSchoolsByState', topSchoolsByState);
router.post('/topBlocksByState', topBlocksByState);
router.post('/topDistrictsByState', topDistrictsByState);
router.post('/getMySparkles', getMySparkles);
router.post('/getMySchoolSparkles', getMySchoolSparkles);
router.post('/trainingCompletionSparkleUpdate', trainingCompletionSparkleUpdate);
router.post('/getDistrictWiseTeachersDataToShareinExcel', getDistrictWiseTeachersDataToShareinExcel);

module.exports = router;

function awardSparkle(req, res, next) {
    sparkleService
        .awardSparkle(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topTeachers(req, res, next) {
    sparkleService
        .topTeachers(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topSchools(req, res, next) {
    sparkleService
        .topSchools(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topBlocks(req, res, next) {
    sparkleService
        .topBlocks(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function trainingCompletionSparkleUpdate(req, res, next) {
    sparkleService
        .trainingCompletionSparkleUpdate(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function getMySparkles(req, res, next) {
    sparkleService
        .getMySparkles(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function getMySchoolSparkles(req, res, next) {
    sparkleService
        .getMySchoolSparkles(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function getDistrictWiseTeachersDataToShareinExcel(req, res, next) {
    sparkleService
        .getDistrictWiseTeachersDataToShareinExcel(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topTeachersByState(req, res, next) {
    sparkleService
        .topTeachersByState(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topSchoolsByState(req, res, next) {
    sparkleService
        .topSchoolsByState(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topBlocksByState(req, res, next) {
    sparkleService
        .topBlocksByState(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function topDistrictsByState(req, res, next) {
    sparkleService
        .topDistrictsByState(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}