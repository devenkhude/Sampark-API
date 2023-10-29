const express = require("express");
const router = express.Router();
const conceptmasterService = require("./conceptmaster.service");

// routes
router.post("/create", create);
router.get("/", getAll);
router.get("/withdepartmentsubject", getAllbyDepartmentSubject);
router.get("/current", getCurrent);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;

function create(req, res, next) {
  conceptmasterService
    .create(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function getAllbyDepartmentSubject(req, res, next) {
  let subjectName = req.query.subject ? req.query.subject : "";
  let departmentName = req.query.department ? req.query.department : "";

  conceptmasterService
    .getAllbyDepartmentSubject(departmentName, subjectName)
    .then((concepts) => res.json(concepts))
    .catch((err) => next(err));
}

function getAll(req, res, next) {
  conceptmasterService
    .getAll()
    .then((conceptmasters) => res.json(conceptmasters))
    .catch((err) => next(err));
}

function getCurrent(req, res, next) {
  conceptmasterService
    .getById(req.conceptmaster.sub)
    .then((conceptmaster) =>
      conceptmaster ? res.json(conceptmaster) : res.sendStatus(404)
    )
    .catch((err) => next(err));
}

function getById(req, res, next) {
  conceptmasterService
    .getById(req.params.id)
    .then((conceptmaster) =>
      conceptmaster ? res.json(conceptmaster) : res.sendStatus(404)
    )
    .catch((err) => next(err));
}

function update(req, res, next) {
  conceptmasterService
    .update(req.params.id, req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function _delete(req, res, next) {
  conceptmasterService
    .delete(req.params.id)
    .then(() => res.json({}))
    .catch((err) => next(err));
}
