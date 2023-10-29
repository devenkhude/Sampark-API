const express = require('express');
const router = express.Router();
const userService = require('./user.service');

// routes
//router.post('/applogin', applogin);
router.post('/authenticate', authenticate);
//router.post('/register', register);
router.post('/verify', verify);
//router.post('/verify_login', verify_login);
//router.post('/update_usertype', update_usertype);
router.post('/resend_otp', resend_otp);
router.post('/profilepicupload', profilepicupload);
router.get('/listall', getAll);
router.get('/authors/:id', getAuthors);
router.get('/', getAll);
router.get('/current', getCurrent);
router.post('/detail', getDetail);
router.get('/:id', getById);
//router.put('/:id', update);
router.put('/fcmtoken/:id', update_fcmtoken);
router.delete('/:id', _delete);

module.exports = router;

function authenticate(req, res, next) {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
}

function profilepicupload(req, res, next) {
    userService.profilepicupload(req)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is' }))
        .catch(err => next(err));
}

function applogin(req, res, next) {
    userService.login(req.body)
        .then(user => user ? res.json(user) : res.sendStatus(400))
        .catch(err => next(err));
}

function resend_otp(req, res, next) {
    userService.resend_otp(req.body)
        .then(user => user ? res.json(user) : res.sendStatus(400))
        .catch(err => next(err));
}

function verify(req, res, next) {
    userService.verify(req.body)
        .then(user => user ? res.json(user) : res.sendStatus(400))
        .catch(err => next(err));
}

function verify_login(req, res, next) {
    userService.verify_login(req.body)
        .then(user => user ? res.json(user) : res.sendStatus(400))
        .catch(err => next(err));
}

function update_usertype(req, res, next) {
    userService.update_usertype(req.body)
        .then(user => user ? res.json(user) : res.sendStatus(400))
        .catch(err => next(err));
}

function register(req, res, next) {
    userService.create(req.body)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getAuthors(req, res, next) {
    userService.getAuthors(req.params.id)
        .then(users => res.json(users))
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getDetail(req, res, next) {
    userService.getDetail(req.body.id)
       	.then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update_fcmtoken(req, res, next) {
    userService.update_fcmtoken(req.params.id, req.body)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}
