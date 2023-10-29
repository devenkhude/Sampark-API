//'use strict'
const userService = require('../users/user.service');

module.exports = function (app) {

    /**
     * Below API will send all streams data according to the parameters passed in query parameters.
     */

    app.put("/users/password", async function (req, response) {

        let request_query = req.body;

        let user = await userService.changePassword(request_query).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });

    app.post("/users/register", async function (req, response) {

        let request_query = req.body;

        let user = await userService.create(request_query).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });

    app.post("/users/applogin", async function (req, response) {

        let request_query = req.body;

        var user = await userService.login(request_query).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });

    app.post("/users/update_usertype", async function (req, response) {

        let request_query = req.body;

        let user = await userService.update_usertype(request_query).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });

    app.post("/users/verify_login", async function (req, response) {

        let request_query = req.body;

        let user = await userService.verify_login(request_query).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });

    app.put("/users/:id", async function (req, response) {

        let request_body = req.body;
        let userid = req.params.id;

        let user = await userService.update(userid, request_body).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });

    app.get("/users/badges", async function (req, response) {

        let userid = (!req.query.user || req.query.user === "undefined") ? "" : req.query.user;
        userid = (userid) ? userid : "";

        var badges = await userService.getBadgesCount(userid).catch(e => {
            response.send({ "message": "Some error occured. Try again later" });
        });
        response.send(badges);
    });
    
    app.post("/users/avasar", async function (req, response) {

        let request_query = req.body;

        let user = await userService.avasar(request_query).catch(e => {
            response.status(400).send({ "message": e });
        });

        response.send(user);
    });
}
