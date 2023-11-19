const express = require("express");
const router = express.Router();
const streamService = require("./userstream.service");

// routes
router.get("/", getAllStreams);

function getAllStreams(req, res, next) {
  const stream_for = req.query.stream_for ? req.query.stream_for : "";
  const device_id = req.query.device_id ? req.query.device_id : "";
  let userid = req.query.user ? req.query.user : "";
  const pull = req.query.pull ? req.query.pull : "";
  const timestamp = req.query.timestamp ? req.query.timestamp : "";
  const updatetime = req.query.updatetime ? req.query.updatetime : "";
  const social_hours = req.query.social_hours ? req.query.social_hours : "";
  userid = userid === "undefined" ? "" : userid;
  streamService
    .getAllStreams(
      device_id,
      userid,
      pull,
      timestamp,
      social_hours,
      updatetime,
      stream_for
    )
    .then((streams) => res.json(streams))
    .catch((err) => next(err));
}

module.exports = router;
