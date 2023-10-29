//'use strict'
const userService = require('../users/user.service');
const broadcastService = require('./broadcastmessage.service');
 
module.exports = function (app) {
 
    /**
     * Below API will send all streams data according to the parameters passed in query parameters.
     */
    app.post("/broadcastmessages/create", async function (req, response) {
 
        let request_query = req.body;
        var broadcast = await broadcastService.create(request_query).catch(e => {
            response.send({"message": e});
        });
        response.send(broadcast);
    });
}
