const express = require('express');
const router = express.Router();
const userService = require('../users/user.service');
const cronService = require('./cron.service');

// routes
router.get('/streamstates', streamstates);
router.get('/streampriority', streampriority);
router.get('/updateuserprogress', updateuserprogress);
router.get('/currentlessonorder', currentlessonorder);
router.get('/updateuserlocations', updateuserlocations);
router.get('/updatelessonprogress', updatelessonprogress);
router.get('/updatedistrictstates', updatedistrictstates);
router.get('/streamcontent', streamcontent);
router.get('/imagedimensions', imagedimensions);
router.get('/videodurations', videodurations);
router.get('/lessonnos', lessonnos);
router.get('/badges', badges);
router.get('/updateviewcounts', updateviewcounts);
router.get('/testfirebase', testfirebase);
router.get('/certificatehours', certificatehours);

module.exports = router;

function certificatehours(req, res, next) {
    cronService.certificatehours(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function updateuserprogress(req, res, next) {
    cronService.updateuserprogress(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function currentlessonorder(req, res, next) {
    cronService.currentlessonorder(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function testfirebase(req, res, next) {
    cronService.testfirebase(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function updatedistrictstates(req, res, next) {
    cronService.updatedistrictstates(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function updateviewcounts(req, res, next) {
    cronService.updateviewcounts(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function streamcontent(req, res, next) {
    cronService.streamcontent(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function streamstates(req, res, next) {
    cronService.streamstates(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function streampriority(req, res, next) {
    cronService.streampriority(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function updatelessonprogress(req, res, next) {
    cronService.updatelessonprogress(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function updateuserlocations(req, res, next) {
    cronService.updateuserlocations(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function imagedimensions(req, res, next) {
    cronService.imagedimensions(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function videodurations(req, res, next) {
    cronService.videodurations(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function lessonnos(req, res, next) {
    cronService.lessonnos(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function badges(req, res, next) {
    cronService.badges(req)
        .then(stream => stream ? res.json(stream) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}
