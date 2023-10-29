//'use strict'
const videoService = require("./video.service");

module.exports = function (app) {
  /**
   * Below API will send all streams data according to the parameters passed in query parameters.
   */
  app.get("/videos/getByQRCode/:id", async function (req, response) {
    let userid = !req.query.user ? "" : req.query.user;
    let qrcode = req.params.id;

    let video = await videoService.getByQRCode(qrcode, userid).catch((e) => {
      response.send({ message: "Some error occured. Try again later" });
    });
    response.send(video);
  });

  /**
   * To retrieve videos based on subject and department
   * @param subject and @param department
   * @returns videos list based on parameters
   * */

  app.get("/videos", async function (req, response) {
    let subjectname = !req.query.subject ? "" : req.query.subject;
    let departmentname = !req.query.department ? "" : req.query.department;
    let userid =
      !req.query.user || req.query.user === "undefined" ? "" : req.query.user;

    let videos = await videoService
      .getAllbyDepartmentSubject(departmentname, subjectname, userid)
      .catch((e) => {
        response.send({ message: "Some error occured. Try again later" });
      });
    response.send(videos);
  });
};
