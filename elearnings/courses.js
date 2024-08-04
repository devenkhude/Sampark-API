//'use strict'
const courseService = require("./course.service");

module.exports = function (app) {
  /**
   * Below API will send all courses data according to the parameters passed in query parameters.
   */
  app.get("/courses", async function (req, response) {
    const userid =
      req?.query?.user && req?.query?.user !== "undefined" ? req?.query?.user : "";

    const courses = await courseService.getAllCourses(userid).catch((e) => {
      let status_code = e.error_status ? e?.error_status : 400;
      let message = e.message ? e?.message : e;
      response.status(status_code).send({ message: message });
    });
    response.send(courses);
  });

  /**
   * Below API will send all questions of a assessment
   */
  app.get("/courses/quizquestions", async function (req, response) {
    const quizid =
      req?.query?.quiz && req?.query?.quiz !== "undefined" ? req?.query?.quiz : "";

    const questions = await courseService
      .getQuizQuestions(quizid)
      .catch((e) => {
        let status_code = e?.error_status ? e?.error_status : 400;
        let message = e?.message ? e?.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(questions);
  });

  /**
   * Below API will send all modules data for a course according to the parameters passed in query parameters.
   */
  app.get("/courses/modules", async function (req, response) {
    const userid =
      req?.query?.user && req?.query?.user !== "undefined" ? req?.query?.user : "";
    const course =
      req?.query?.course && req?.query?.course !== "undefined"
        ? req?.query?.course
        : "";
    const modules = await courseService
      .getCourseModules(userid, course)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(modules);
  });

  /**
   * Below API will update the progress of the course
   */
  app.post("/courses/enrollment/cancel", async function (req, response) {
    let request_body = req?.body;
    const enroll = await courseService
      .cancelEnrollment(request_body)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(enroll);
  });

  /**
   * Below API will enroll the user in the course
   */
  app.post("/courses/enroll", async function (req, response) {
    let request_body = req?.body;
    const enroll = await courseService.enroll(request_body).catch((e) => {
      let status_code = e?.error_status ? e.error_status : 400;
      let message = e?.message ? e.message : e;
      response.status(status_code).send({ message: message });
    });
    response.send(enroll);
  });

  /**
   * Below API will update the progress of the course
   */
  app.post("/courses/progress_update", async function (req, response) {
    let request_body = req?.body;
    const progress = await courseService
      .progressUpdate(request_body)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(progress);
  });

  /**
   * Below API will save the feedback of the user for the course
   */
  app.post("/courses/feedback", async function (req, response) {
    let request_body = req?.body;
    const feedback = await courseService
      .saveFeedback(request_body)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(feedback);
  });

  /**
   * Below API will send all feedbacks of a course
   */
  app.get("/courses/feedbacks", async function (req, response) {
    const userid = req?.query?.user || "";
    const course = req?.query?.course || "";
    const pageNo = req?.query?.pageNo || "";

    try {
      const feedbacks = await courseService.feedbacks(course, userid, pageNo);
      response.send(feedbacks);
    } catch (e) {
      const status_code = e?.error_status || 400;
      const message = e?.message || e;
      response.status(status_code).send({ message: message });
    }
  });

  /**
   * Below API will save the feedback like of the user
   */
  app.post("/courses/likeafeedback", async function (req, response) {
    let request_body = req?.body;
    const feedbacklike = await courseService
      .likeFeedback(request_body)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(feedbacklike);
  });

  /**
   * Below API will accept or reject the live session
   */
  app.post("/courses/livesessionrequest", async function (req, response) {
    let request_body = req?.body;
    const livesession = await courseService
      .liveSessionRequest(request_body)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(livesession);
  });

  /**
   * Below API will enroll the user in the course
   */
  app.post("/courses/uploadVideo", async function (req, response) {
    let requestdata = req;
    const video = await courseService.uploadVideo(requestdata).catch((e) => {
      let status_code = e?.error_status ? e.error_status : 400;
      let message = e?.message ? e.message : e;
      response.status(status_code).send({ message: message });
    });
    response.send(video);
  });

  /**
   * Below API will enroll the user in the course
   */
  app.post("/courses/saveQuizResults", async function (req, response) {
    let requestdata = req?.body;
    const quizResults = await courseService
      .saveQuizResults(requestdata)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(quizResults);
  });

  /**
   * Below API will enroll the user in the course
   */
  app.post("/courses/getQuizResults", async function (req, response) {
    let requestdata = req?.body;
    const quizResult = await courseService
      .getQuizResults(requestdata)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(quizResult);
  });

  /**
   * Below API will give the certificate
   */
  app.post("/courses/getCertificate", async function (req, response) {
    let requestdata = req?.body;
    const certificate = await courseService
      .getCertificate(requestdata)
      .catch((e) => {
        let status_code = e?.error_status ? e.error_status : 400;
        let message = e?.message ? e.message : e;
        response.status(status_code).send({ message: message });
      });
    response.send(certificate);
  });
};
