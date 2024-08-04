const express = require("express");
const router = express.Router();
const lessonService = require("./lesson.service");

// routes
router.post("/create", create);
router.post("/all", getAll);
router.post("/vocabularyviewed", vocabularyviewed);
router.get("/", getAllLessons);
router.get("/list", getList);
router.get("/search", search);
router.get("/current", getCurrent);
router.get("/edit/:id", edit);
router.get("/:id", getById);
router.put("/:id", update);
router.delete("/:id", _delete);

module.exports = router;

function search(req, res, next) {
  const device_id = req?.query?.device_id || "";
  const userid = req?.query?.user || "";
  const searchstring = req?.query?.searchstring || "";

  // Ensure userid is not the string "undefined"
  const sanitizedUserId = userid === "undefined" ? "" : userid;

  lessonService
    .search(searchstring, device_id, sanitizedUserId)
    .then((streams) => res.json(streams))
    .catch((err) => next(err));
}

function create(req, res, next) {
  lessonService
    .create(req)
    .then((lesson) => (lesson ? res.json(lesson) : res.sendStatus(404)))
    //.then(() => res.json({}))
    .catch((err) => next(err));
}

function getList(req, res, next) {
  const userid = req?.query?.user || "";
  const device_id = req?.query?.device_id || "";
  const apk_version = req?.query?.apk_version || "";

  lessonService
    .getList(userid, device_id, apk_version)
    .then((lessons) => res.json(lessons))
    .catch((err) => next(err));
}

function getAll(req, res, next) {
  lessonService
    .getAll(req)
    .then((lessons) => res.json(lessons))
    .catch((err) => next(err));
}

function vocabularyviewed(req, res, next) {
  lessonService
    .vocabularyviewed(req)
    .then((lessons) => res.json(lessons))
    .catch((err) => next(err));
}

function getAllLessons(req, res, next) {
  const subjectname = req?.query?.subject || "";
  const departmentname = req?.query?.department || "";
  const userid = req?.query?.user || "";
  const category = req?.query?.category || "";

  // Ensure userid is not the string "undefined"
  const sanitizedUserId = userid === "undefined" ? "" : userid;

  lessonService
    .getAllbyDepartmentSubject(
      departmentname,
      subjectname,
      sanitizedUserId,
      category
    )
    .then((lessons) => res.json(lessons))
    .catch((err) => next(err));
}

function getCurrent(req, res, next) {
  const userid = req?.query?.user || "";
  const device_id = req?.query?.device_id || "";

  // Ensure userid and device_id are not the string "undefined"
  const sanitizedUserId = userid === "undefined" ? "" : userid;
  const sanitizedDeviceId = device_id === "undefined" ? "" : device_id;

  lessonService
    .getById(req.lesson.sub, sanitizedUserId, sanitizedDeviceId)
    .then((lesson) => (lesson ? res.json(lesson) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function edit(req, res, next) {
  lessonService
    .edit(req.params.id)
    .then((lesson) => (lesson ? res.json(lesson) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function getById(req, res, next) {
  const userid = req?.query?.user || "";

  // Ensure userid is not the string "undefined"
  const sanitizedUserId = userid === "undefined" ? "" : userid;

  lessonService
    .getById(req?.params?.id, sanitizedUserId)
    .then((lesson) => (lesson ? res.json(lesson) : res.sendStatus(404)))
    .catch((err) => next(err));
}

function update(req, res, next) {
  lessonService
    .update(req?.params?.id, req)
    .then((lesson) => (lesson ? res.json(lesson) : res.sendStatus(404)))
    //.then(() => res.json({}))
    .catch((err) => next(err));
}

function _delete(req, res, next) {
  lessonService
    .delete(req.params.id)
    .then((lesson) => (lesson ? res.json(lesson) : res.sendStatus(404)))
    //.then(() => res.json({}))
    .catch((err) => next(err));
}
