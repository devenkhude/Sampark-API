const { Worker, isMainThread, parentPort } = require('worker_threads');
const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const get_current_user = commonmethods.get_current_user;
const Subjectmaster = db.Subjectmaster;
const Video = db.Video;
const Departmentmaster = db.Departmentmaster;

module.exports = {
  getAll,
  getAllWithDepartments,
  getById,
  create,
  update,
  delete: _delete,
};

/**
 * To get all department subjects
 * @returns department wise subjects list
 * */
function getAllWithDepartments() {
  return new Promise((resolve, reject) => {
    if (isMainThread) {
      const worker = new Worker(require('./worker'), { workerData: { api: 'getAllWithDepartments' } });

      worker.on('message', (result) => {
        console.log("Service Result: ", result);
        resolve(result); // Resolve the promise with the result from the worker
      });

      worker.on('error', (error) => {
        console.log("Service Error: ", error);
        reject(error); // Reject the promise if there's an error in the worker
      });
    } else {
      console.log("Service Else Block: ");
      // This is the worker thread; perform the task here
    }
  });
}

/**
 * To retrieve all subjects
 * @returns subjects list
 * */
async function getAll() {
  return await Subjectmaster.find().select("-hash");
}

/**
 * To retrieve subject by id
 * @returns subject object
 * */
async function getById(id) {
  return await Subjectmaster.findById(id).select("-hash");
}

async function create(req) {
  var subjectmasterParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  // validate
  if (
    await Subjectmaster.findOne({
      name: subjectmasterParam.name,
      module: subjectmasterParam.module,
    })
  ) {
    throw 'Subject "' + subjectmasterParam.name + '" is already taken';
  }

  subjectmasterParam.createdBy = current_user;
  subjectmasterParam.updatedBy = current_user;
  const subjectmaster = new Subjectmaster(subjectmasterParam);
  oldDefault = new Subjectmaster();

  // save subjectmaster
  if (subjectmasterParam.is_default == true) {
    oldDefault = await Subjectmaster.findOne({ is_default: true });
  }
  await subjectmaster.save();
  if (subjectmasterParam.is_default == true) {
    await Subjectmaster.update({ _id: oldDefault.id }, { is_default: false });
  }
}

async function update(id, req) {
  var subjectmasterParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  const subjectmaster = await Subjectmaster.findById(id);
  const oldDefault = await Subjectmaster.findOne({ is_default: true });

  subjectmasterParam.updatedBy = current_user;
  subjectmasterParam.updatedDate = updatedAt;
  // validate
  if (!subjectmaster) throw "Subject not found";
  if (
    subjectmaster.module === subjectmasterParam.module &&
    subjectmaster.name !== subjectmasterParam.name &&
    (await Subjectmaster.findOne({
      name: subjectmasterParam.name,
      module: subjectmasterParam.module,
    }))
  ) {
    throw 'Subject "' + subjectmasterParam.name + '" is already taken';
  }

  if (subjectmaster.is_default == true) {
    subjectmasterParam.is_default = true;
  }

  // copy subjectmasterParam properties to subjectmaster
  Object.assign(subjectmaster, subjectmasterParam);

  await subjectmaster.save();
  if (
    subjectmasterParam.is_default == true &&
    subjectmaster.id != oldDefault.id
  ) {
    await Subjectmaster.update({ _id: oldDefault.id }, { is_default: false });
  }
}

async function _delete(id) {
  const subjectvideo = await Video.find({ subject: id }).countDocuments();
  if (subjectvideo > 0) {
    throw "Subject cannot be deleted, as it was mapped to some videos";
  }
  const subjectdepartment = await Departmentmaster.find({
    subjects: id,
  }).countDocuments();
  if (subjectdepartment > 0) {
    throw "Subject cannot be deleted, as it was mapped to some departments";
  }
  const subjectmaster = await Subjectmaster.findById(id);
  if (subjectmaster.is_default == true) {
    throw "Default subject cannot be deleted";
  } else {
    await Subjectmaster.findByIdAndRemove(id);
  }
}
