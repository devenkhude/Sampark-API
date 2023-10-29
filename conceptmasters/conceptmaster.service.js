﻿const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const get_current_user = commonmethods.get_current_user;
const Conceptmaster = db.Conceptmaster;
const Video = db.Video;

module.exports = {
  getAllbyDepartmentSubject,
  getAll,
  getById,
  create,
  update,
  delete: _delete,
};

async function getAllbyDepartmentSubject(departmentName, subjectName) {
  let query = {};
  if (departmentName !== "") {
    query["department"] = departmentName;
  }
  if (subjectName !== "") {
    query["subject"] = subjectName;
  }
  const concepts = await Conceptmaster.find(query);
  let conceptList = [];

  concepts.forEach(async (element) => {
    let concept = {};

    concept["id"] = element["id"];
    concept["name"] = element["name"];
    concept["subject"] = element["subject"];
    concept["department"] = element["department"];

    query["concept"] = element["id"];

    const videos = await Video.find(query).select(
      "id name thumbnail video_code"
    );
    let videoList = [];
    videos.forEach((elem) => {
      let video = {};

      video["id"] = elem["id"];
      video["name"] = elem["name"];
      if (elem["thumbnail"] != "" && elem["thumbnail"] != "null") {
        video["thumbnail"] = config.repositoryHost + elem["thumbnail"];
      } else {
        video["thumbnail"] =
          "https://img.youtube.com/vi/" + elem["video_code"] + "/hqdefault.jpg";
      }
      videoList.push(video);
    });
    concept["videos"] = videoList;
    conceptList.push(concept);
  });

  return conceptList;
}

async function getAll() {
  return await Conceptmaster.find()
    .populate("subject", "name")
    .populate("department", "name")
    .select("-hash");
}

async function getById(id) {
  return await Conceptmaster.findById(id).select("-hash");
}

async function create(req) {
  var conceptmasterParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  // validate
  if (
    await Conceptmaster.findOne({
      name: conceptmasterParam.name,
      module: conceptmasterParam.module,
      department: conceptmasterParam.department,
      subject: conceptmasterParam.subject,
    })
  ) {
    throw 'Concept "' + conceptmasterParam.name + '" is already taken';
  }

  conceptmasterParam.createdBy = current_user;
  conceptmasterParam.updatedBy = current_user;
  const conceptmaster = new Conceptmaster(conceptmasterParam);
  oldDefault = new Conceptmaster();

  // save conceptmaster
  if (conceptmasterParam.is_default == true) {
    oldDefault = await Conceptmaster.findOne({ is_default: true });
  }
  await conceptmaster.save();
  if (conceptmasterParam.is_default == true) {
    await Conceptmaster.update({ _id: oldDefault.id }, { is_default: false });
  }
}

async function update(id, req) {
  var conceptmasterParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  const conceptmaster = await Conceptmaster.findById(id);
  const oldDefault = await Conceptmaster.findOne({ is_default: true });

  conceptmasterParam.updatedBy = current_user;
  conceptmasterParam.updatedDate = updatedAt;
  // validate
  if (!conceptmaster) throw "Concept not found";
  if (
    conceptmaster.name !== conceptmasterParam.name &&
    (await Conceptmaster.findOne({ name: conceptmasterParam.name }))
  ) {
    throw 'Concept "' + conceptmasterParam.name + '" is already taken';
  }

  if (conceptmaster.is_default == true) {
    conceptmasterParam.is_default = true;
  }

  // copy conceptmasterParam properties to conceptmaster
  Object.assign(conceptmaster, conceptmasterParam);

  await conceptmaster.save();
  if (
    conceptmasterParam.is_default == true &&
    conceptmaster.id != oldDefault.id
  ) {
    await Conceptmaster.update({ _id: oldDefault.id }, { is_default: false });
  }
}

async function _delete(id) {
  const conceptmaster = await Conceptmaster.findById(id);
  if (conceptmaster.is_default == true) {
    throw "Default concept cannot be deleted";
  } else {
    await Conceptmaster.findByIdAndRemove(id);
  }
}