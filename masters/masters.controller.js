const express = require("express");
const router = express.Router();
const masterService = require("./master.service");

// routes
router.post("/states", createState);
router.post("/districts", createDistrict);
router.post("/blocks", createBlock);
router.post("/clusters", createCluster);
router.post("/create", createBulk);
router.get("/statelist", getStates);
router.get("/districtlist", getDistricts);
router.get("/blocklist", getBlocks);
router.get("/clusterlist", getClusters);
router.get("/designationlist", getDesignations);
router.get("/getHashtags", getHashtags);
router.get("/getCaricatures", getCaricatures);

module.exports = router;

function getDesignations(req, res, next) {
  masterService
    .getDesignations()
    .then((designations) => res.json(designations))
    .catch((err) => next(err));
}

function getStates(req, res, next) {
  masterService
    .getStates()
    .then((states) => res.json(states))
    .catch((err) => next(err));
}

function getDistricts(req, res, next) {
  let stateid =
    req.query.state && req.query.state != "undefined" ? req.query.state : "";
  masterService
    .getDistricts(stateid)
    .then((districts) =>
      districts ? res.json(districts) : res.sendStatus(404)
    )
    .catch((err) => next(err));
}

function getBlocks(req, res, next) {
  let districtid =
    req.query.district && req.query.district != "undefined"
      ? req.query.district
      : "";
  masterService
    .getBlocks(districtid)
    .then((blocks) => (blocks ? res.json(blocks) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function getClusters(req, res, next) {
  let blockid =
    req.query.block && req.query.block != "undefined" ? req.query.block : "";
  masterService
    .getClusters(blockid)
    .then((clusters) => (clusters ? res.json(clusters) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function createState(req, res, next) {
  masterService
    .createState(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function createDistrict(req, res, next) {
  masterService
    .createDistrict(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function createBlock(req, res, next) {
  masterService
    .createBlock(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function createCluster(req, res, next) {
  masterService
    .createCluster(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function createBulk(req, res, next) {
  masterService
    .createBulk(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function getHashtags(req, res, next) {
  masterService
    .getHashtags()
    .then((hashtags) => (hashtags ? res.json(hashtags) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function getCaricatures(req, res, next) {
  masterService
    .getCaricatures()
    .then((caricatures) =>
      caricatures ? res.json(caricatures) : res.sendStatus(404)
    )
    .catch((err) => next(err));
}
