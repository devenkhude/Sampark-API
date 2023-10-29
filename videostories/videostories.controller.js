const express = require('express');
const router = express.Router();
const videostoryService = require('./videostory.service');

// routes
router.post('/all', getAll);

module.exports = router;

function getAll(req, res, next) {
    videostoryService.getAll(req)
        .then(videos => res.json(videos))
        .catch(err => next(err));
}

