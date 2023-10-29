const express = require('express');
const router = express.Router();
const ddTopicService = require('./ddtopic.service');
const ddProgressService = require('./ddprogress.service');
const ddlessonstopicService = require('./ddlessonstopic.service');

// routes
router.post('/addTopic', addTopic);
router.post('/setTopicDate', setTopicDate);
router.get('/getddLessonsTopics', getddLessonsTopics);
router.get('/getTopicsForLesson', getTopicsForLesson);

module.exports = router;

function addTopic(req, res, next) {
    ddTopicService
        .addTopic(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}


function setTopicDate(req, res, next) {
    ddProgressService
        .setTopicDate(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function getddLessonsTopics(req, res, next) {
    ddlessonstopicService
        .getddLessonsTopics(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}

function getTopicsForLesson(req, res, next) {
    ddlessonstopicService
        .getTopicsForLesson(req.query)
        .then((data) => res.json(data))
        .catch((err) => next(err));
}