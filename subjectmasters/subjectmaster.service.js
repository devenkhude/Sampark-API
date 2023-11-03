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
async function getAllWithDepartments() {
  try {
    // Fetch subject and department data with selective projection
    const [subjectMasters, departmentMasters] = await Promise.all([
      Subjectmaster.find()
        .sort({ sort_order: 1 })
        .select(
          "id name icon activeicon module is_default registration_name for_registration"
        ),
      Departmentmaster.find()
        .sort({ sort_order: 1 })
        .select("id name subjects"),
    ]);

    if (!subjectMasters.length || !departmentMasters.length) {
      throw new Error("No data found.");
    }

    // Assuming subject_masters and department_masters are arrays

    const subjects = {};
    const finalData = {
      sss: [],
      sst: [],
      ssh: [],
      sa: [],
      elearning: [],
      dd: [],
    };

    // Process subject_masters
    subjectMasters.forEach((subject) => {
      const subjectId = subject.id;
      subjects[subjectId] = {
        id: subjectId,
        name: subject.name,
        icon: subject.icon
          ? config.repositoryHost + subject.icon
          : config.assetHost + subject.name.toLowerCase() + ".png",
        icon_active: subject.activeicon
          ? config.repositoryHost + subject.activeicon
          : config.assetHost + "big-" + subject.name.toLowerCase() + ".png",
        module: subject.module,
        is_default: subject.is_default,
        registration_name: subject.registration_name || subject.name,
        for_registration: subject.for_registration || false,
        departments: [],
      };
    });

    // Process department_masters
    departmentMasters.forEach((department) => {
      const departmentSubjects = department.subjects;
      departmentSubjects.forEach((depSubject) => {
        const departmentMaster = {
          id: department.id,
          name: department.name,
          is_default: subjects[depSubject].departments.length === 0,
        };
        subjects[depSubject].departments.push(departmentMaster);
      });
    });

    // Create subjects_with_departments and populate finalData
    const subjectsWithDepartments = Object.values(subjects);
    subjectsWithDepartments.forEach((value) => {
      if (finalData[value.module].length === 0) {
        value.is_default = true;
      } else {
        value.is_default = false;
      }
      finalData[value.module].push(value);
    });

    return finalData;
  } catch (err) {
    console.error("Catch Exception: ", err);
    throw new Error(err.message);
  }
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
