//'use strict'
const userService = require('../users/user.service');
const scertstreamService = require('./scertstream.service');
 
module.exports = function (app) {
 
    /**
     * Below API will send all streams data according to the parameters passed in query parameters.
     */
    app.get("/scertstreams", async function (req, response) {
 
        let stream_for = (!req.query.stream_for) ? "" : req.query.stream_for;
        let apk_version = (!req.query.apk_version) ? 1 : req.query.apk_version;
        let device_id = (!req.query.device_id) ? "" : req.query.device_id;
        let userid = (!req.query.user || req.query.user === "undefined") ? "" : req.query.user;
        let pull = (!req.query.pull) ? "" : req.query.pull;
        let timestamp = (!req.query.timestamp) ? "" : req.query.timestamp;
        let updatetime = (!req.query.updatetime) ? "" : req.query.updatetime;
        let social_hours = (!req.query.social_hours) ? "" : req.query.social_hours;
        userid = (userid) ? userid : "";
        let request_query = req.query;
        
        var scertstreams = await scertstreamService.getAllScertstreams(device_id,userid,pull,timestamp,social_hours,updatetime).catch(e => {
            response.send({"message": "Some error occured. Try again later"});
        });
        response.send(scertstreams);
    });
}
