//'use strict'
const userService = require("../users/user.service");
const scertstreamService = require("./scertstream.service");

module.exports = function (app) {
  /**
   * Below API will send all streams data according to the parameters passed in query parameters.
   */
  app.get("/scertstreams", async function (req, response) {
    const device_id = req.query.device_id || "";
    const userid =
      req.query.user && req.query.user !== "undefined" ? req.query.user : "";
    const pull = req.query.pull || "";
    const timestamp = req.query.timestamp || "";
    const updatetime = req.query.updatetime || "";
    const social_hours = req.query.social_hours || "";

    const scertstreams = await scertstreamService
      .getAllScertstreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime
      )
      .catch((e) => {
        response.send({ message: "Some error occured. Try again later" });
      });
    response.send(scertstreams);
  });
};
