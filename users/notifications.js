//'use strict'
const notificationService = require('../users/notification.service');
 
module.exports = function (app) {
 
    /**
     * Below API will send all streams data according to the parameters passed in query parameters.
     */

    app.get("/notifications", async function (req, response) {
 
        let userid = (!req.query.user || req.query.user === "undefined") ? "" : req.query.user;
        let timestamp = (!req.query.timestamp) ? "" : req.query.timestamp;

        await notificationService.getall(userid, timestamp).then(function (notifications){
            response.send(notifications);
        }).catch(e => {
            response.send({"message": e});
        });   
    });
}
