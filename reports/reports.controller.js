const express = require('express');
const router = express.Router();
const reportService = require('./report.service');

// routes

router.post('/video_played_users_count', video_played_users_count);
router.post('/users', users);
router.post('/unregisteredusers', unregisteredusers);
router.get('/teachers', teachers);
router.get('/sparks', sparks);

module.exports = router;

function video_played_users_count(req, res, next) {
    reportService.video_played_users_count(req)
        .then(videos => res.json(videos))
        .catch(err => next(err));
}

function users(req, res, next) {
    reportService.users(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function unregisteredusers(req, res, next) {
    reportService.unregisteredusers(req)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function teachers(req, res, next) {
    reportService.teachers(req)
        .then(teachers => res.json(teachers))
        .catch(err => next(err));
}

function sparks(req, res, next) {
    reportService.sparks(req)
        .then(sparks => res.json(sparks))
        .catch(err => next(err));
}
