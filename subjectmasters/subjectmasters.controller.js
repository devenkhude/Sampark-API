const { Worker, isMainThread, parentPort } = require('worker_threads');
const express = require("express");
const workerFile = require('./worker');
const router = express.Router();
const subjectmasterService = require("./subjectmaster.service");

// routes
router.post("/create", create);
router.get("/", getAll);
router.get("/withdepartments", getAllWithDepartments);
router.get("/current", getCurrent);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", _delete);

function create(req, res, next) {
  subjectmasterService
    .create(req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function getAllWithDepartments(req, res, next) {
  if (isMainThread) {
    const worker = new Worker(workerFile, { workerData: { api: 'getAllWithDepartments' } });

    worker.on('message', (result) => {
      res.json(result);
    });
  }
  // subjectmasterService
  //   .getAllWithDepartments()
  //   .then((subjectmasters) => res.json(subjectmasters))
  //   .catch((err) => next(err));
}

function getAll(req, res, next) {
  subjectmasterService
    .getAll()
    .then((subjectmasters) => res.json(subjectmasters))
    .catch((err) => next(err));
}

function getCurrent(req, res, next) {
  subjectmasterService
    .getById(req.subjectmaster.sub)
    .then((subjectmaster) =>
      subjectmaster ? res.json(subjectmaster) : res.sendStatus(404)
    )
    .catch((err) => next(err));
}

function getById(req, res, next) {
  subjectmasterService
    .getById(req.params.id)
    .then((subjectmaster) =>
      subjectmaster ? res.json(subjectmaster) : res.sendStatus(404)
    )
    .catch((err) => next(err));
}

function update(req, res, next) {
  subjectmasterService
    .update(req.params.id, req)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

function _delete(req, res, next) {
  subjectmasterService
    .delete(req.params.id)
    .then(() => res.json({}))
    .catch((err) => next(err));
}

module.exports = router;
