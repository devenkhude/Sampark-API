//'use strict'
const discussionService = require('./discussion.service');
 
module.exports = function (app) {

    /**
     * Below API will send all feedbacks of a course
     */
    app.get("/discussions", async function (req, response) {
        let course = (!req.query.course || req.query.course === "undefined") ? "" : req.query.course;
        let discussionId = (!req.query.discussionId || req.query.discussionId === "undefined") ? "" : req.query.discussionId;
        let pageNo = (!req.query.pageNo || req.query.pageNo === "undefined") ? "" : req.query.pageNo;
        const discussions = await discussionService.discussions(course, discussionId, pageNo).catch(e => {
            let status_code = (e.error_status) ? e.error_status : 400
            let message = (e.message) ? e.message : e
            response.status(status_code).send({"message": message});
        });
        response.send(discussions);
    });

    /**
     * Below API will save the feedback of the user for the course
     */
    app.post("/discussions/comment", async function (req, response) {
        let request_body = req.body;
        const comment = await discussionService.saveComment(request_body).catch(e => {
            let status_code = (e.error_status) ? e.error_status : 400
            let message = (e.message) ? e.message : e
            response.status(status_code).send({"message": message});
        });
        response.send(comment);
    });
}
