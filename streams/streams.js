//'use strict'
const userService = require("../users/user.service");
const streamService = require("./stream.service");

module.exports = function (app) {
  /**
   * Below API will send all streams data according to the parameters passed in query parameters.
   */
  app.get("/streams", async function (req, response) {
    const {
      stream_for = "",
      apk_version = 1,
      device_id = "",
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
      social_hours = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getAllStreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime,
        stream_for,
        apk_version
      )
      .catch((e) => {
        response.send({ message: "Some error occured. Try again later" });
      });
    response.send(streams);
  });

  app.get("/streams/getAllStateStreams", async function (req, response) {
    const {
      apk_version = 1,
      device_id = "",
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
      social_hours = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getAllStateStreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime,
        apk_version
      )
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });
    response.send(streams);
  });

  app.get("/streams/getMyStateStreams", async function (req, response) {
    const {
      apk_version = 1,
      device_id = "",
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
      social_hours = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getMyStateStreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime,
        apk_version
      )
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });
    response.send(streams);
  });

  app.get("/streams/getMyDistrictStreams", async function (req, response) {
    const {
      apk_version = 1,
      device_id = "",
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
      social_hours = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getMyDistrictStreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime,
        apk_version
      )
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });
    response.send(streams);
  });

  app.get("/streams/getSamparkDidiStreams", async function (req, response) {
    const {
      apk_version = 1,
      device_id = "",
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
      social_hours = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getSamparkDidiStreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime,
        apk_version
      )
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });
    response.send(streams);
  });
  app.get("/streams/getPodcastStreams", async function (req, response) {
    const {
      apk_version = 1,
      device_id = "",
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
      social_hours = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getPodcastStreams(
        device_id,
        userid,
        pull,
        timestamp,
        social_hours,
        updatetime,
        apk_version
      )
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });
    response.send(streams);
  });

  app.get("/streams/getUsersStreams", async function (req, response) {
    let userid =
      !req.query.user || req.query.user === "undefined" ? "" : req.query.user;
    const streams = await streamService.getUsersStreams(userid).catch((e) => {
      response.send({ message: "Some error occurred. Try again later" });
    });
    response.send(streams);
  });

  app.get("/streams/getUsersStreamsFromBackup", async function (req, response) {
    let userid =
      !req.query.user || req.query.user === "undefined" ? "" : req.query.user;

    const streams = await streamService
      .getUsersStreamsFromBackup(userid)
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });
    response.send(streams);
  });

  app.get("/streams/getmyClassroomVideos", async function (req, response) {
    const {
      apk_version = 1,
      user = "",
      pull = "",
      timestamp = "",
      updatetime = "",
    } = req.query;

    const userid = user && user !== "undefined" ? user : "";

    const streams = await streamService
      .getmyClassroomVideos(userid, pull, timestamp, updatetime, apk_version)
      .catch((e) => {
        response.send({ message: "Some error occurred. Try again later" });
      });

    response.send(streams);
  });
};
