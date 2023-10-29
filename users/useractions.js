//'use strict'
const userActionService = require('../users/useraction.service');

module.exports = function (app) {

    /**
     * Below API will send all streams data according to the parameters passed in query parameters.
     */

    app.post("/useractions/like", async function (req, response) {

        let request_body = req.body;

        await userActionService.like(request_body).then(function (userlike) {
            response.send(userlike);
        }).catch(e => {
            response.send({ "message": e });
        });

    });

    app.post("/useractions/comment", async function (req, response) {

        let request_body = req.body;

        await userActionService.comment(request_body).then(function (usercomment) {
            response.send(usercomment);
        }).catch(e => {
            response.send({ "message": e });
        });
    });
    app.post("/useractions/deletecomment", async function (req, response) {

        let request_body = req.body;

        await userActionService.deleteComment(request_body).then(function (data) {
            response.send(data);
        }).catch(e => {
            response.send({ "message": e });
        });
    });
    app.post("/useractions/replyoncomment", async function (req, response) {

        let request_body = req.body;

        await userActionService.replyOnComment(request_body).then(function (usercomment) {
            response.send(usercomment);
        }).catch(e => {
            response.send({ "message": e });
        });
    });

    app.get("/useractions/comments", async function (req, response) {

        let request_query = req.query;

        await userActionService.comments(request_query).then(function (usercomments) {
            response.send(usercomments)
        }).catch(err => {
            response.send({ "message": err });
        });
    });

    app.post("/useractions/lessonunlocked", async function (req, response) {

        let request_body = req.body;

        await userActionService.lessonunlocked(request_body).then(function (lessonunlocked) {
            response.send({ "status": lessonunlocked });
        }).catch(e => {
            response.send({ "message": e });
        });
    });

    app.post("/useractions/played", async function (req, response) {

        let request_body = req.body;

        await userActionService.played(request_body).then(function (videoplayed) {
            response.send({ "status": videoplayed });
        }).catch(e => {
            response.send({ "message": e });
        });
    });

    app.post("/useractions/resourceviewed", async function (req, response) {

        let request_body = req.body;

        await userActionService.resourceviewed(request_body).then(function (resourceviewed) {
            response.send({ "status": resourceviewed });
        }).catch(e => {
            response.send({ "message": e });
        });
    });
}

