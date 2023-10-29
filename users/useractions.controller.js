const express = require('express');
const router = express.Router();
const userActionService = require('./useraction.service');

// routes
router.get('/', uploads);
router.get('/scertuploads', scertuploads);
router.get('/likes', likes);
//router.get('/comments', comments);
router.get('/uploads', uploads);
router.get('/edit/:id', edit);
router.get('/leadership', getLeaderShip);
router.get('/:id', getById);
router.post('/sendcertificate', sendcertificate);
router.post('/upload', upload);
router.post('/uploadnew', uploadnew);
router.post('/postaction', postaction);
router.post('/uploadscert', uploadscert);
router.post('/uploadnewtest', uploadnewtest);
router.post('/updatehours', updatehours);
router.post('/followunfollow', followunfollow);
router.post('/followers', followers);
router.post('/otherProfile', otherProfile);
router.post('/recordPostShare', recordPostShare);
router.post('/sendPushForDDLesson', sendPushForDDLesson);

//router.post('/comment', comment);
//router.post('/like', like);
//router.post('/played', played);
//router.post('/resourceviewed', resourceviewed);
router.post('/offlinesyncing', offlinesyncing);
//router.post('/lessonunlocked', lessonunlocked);

module.exports = router;


function sendcertificate(req, res, next) {
    userActionService.sendcertificate(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function updatehours(req, res, next) {
    userActionService.updatehours(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function edit(req, res, next) {
    userActionService.edit(req.params.id)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        .catch(err => next(err));
}

function uploads(req, res, next) {
    userActionService.getAll()
        .then(useruploads => res.json(useruploads))
        .catch(err => next(err));
}

function scertuploads(req, res, next) {
    userActionService.getScertUploads()
        .then(scertuploads => res.json(scertuploads))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userActionService.getById(req.params.id)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        .catch(err => next(err));
}

function getLeaderShip(req, res, next) {
    userActionService.getLeaderShip(req)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        .catch(err => next(err));
}

function upload(req, res, next) {
    userActionService.upload(req)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function uploadnew(req, res, next) {
    userActionService.uploadnew(req)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function postaction(req, res, next) {
    userActionService.postaction(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function uploadscert(req, res, next) {
    userActionService.uploadscert(req)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function uploadnewtest(req, res, next) {
    userActionService.uploadnewtest(req)
        .then(userupload => userupload ? res.json(userupload) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function comments(req, res, next) {
    userActionService.comments(req)
        .then(usercomments => usercomments ? res.json(usercomments) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function comment(req, res, next) {
    userActionService.comment(req)
        .then(usercomment => usercomment ? res.json(usercomment) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function likes(req, res, next) {
    userActionService.likes(req)
        .then(userlikes => userlikes ? res.json(userlikes) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function like(req, res, next) {
    userActionService.like(req)
        .then(userlike => userlike ? res.json(userlike) : res.status(400).json({ message: 'Username or password is incorrect' }))
        //res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function played(req, res, next) {
    userActionService.played(req)
        .then(videoplayed => videoplayed ? res.json(videoplayed) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function resourceviewed(req, res, next) {
    userActionService.resourceviewed(req)
        .then(videoplayed => videoplayed ? res.json(videoplayed) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function lessonunlocked(req, res, next) {
    userActionService.lessonunlocked(req)
        .then(videoplayed => videoplayed ? res.json(videoplayed) : res.sendStatus(404))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function offlinesyncing(req, res, next) {
    userActionService.offlinesyncing(req)
        .then(offlinesyncing => res.json(offlinesyncing))
        //.then(() => res.json({}))
        .catch(err => next(err));
}

function followunfollow(req, res, next) {
    userActionService.followunfollow(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function followers(req, res, next) {
    userActionService.followers(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function otherProfile(req, res, next) {
    userActionService.otherProfile(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function recordPostShare(req, res, next) {
    userActionService.recordPostShare(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}

function sendPushForDDLesson(req, res, next) {
    userActionService.sendPushForDDLesson(req.body)
        .then(user => res.json(user))
        .catch(err => next(err));
}