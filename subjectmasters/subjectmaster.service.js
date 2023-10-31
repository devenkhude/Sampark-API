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
  let subjects = {};
  let final_data = {};
  final_data["sss"] = [];
  final_data["sst"] = [];
  final_data["ssh"] = [];
  final_data["sa"] = [];
  final_data["elearning"] = [];
  final_data["dd"] = [];
  try {
    const subject_masters = await Subjectmaster.find()
      .sort({ sort_order: 1 })
      .select("-hash");
    const department_masters = await Departmentmaster.find()
      .sort({ sort_order: 1 })
      .select("-hash");
    if (subject_masters && subject_masters.length > 0) {
      subject_masters.forEach((subject) => {
        subjects[subject["id"]] = {};
        subjects[subject["id"]]["id"] = subject["id"];
        subjects[subject["id"]]["name"] = subject["name"];
        if (subject["icon"]) {
          subjects[subject["id"]]["icon"] =
            config.repositoryHost + subject["icon"];
        } else {
          subjects[subject["id"]]["icon"] =
            config.assetHost + subject["name"].toLowerCase() + ".png";
        }
        if (subject["activeicon"]) {
          subjects[subject["id"]]["icon_active"] =
            config.repositoryHost + subject["activeicon"];
        } else {
          subjects[subject["id"]]["icon_active"] =
            config.assetHost + "big-" + subject["name"].toLowerCase() + ".png";
        }
        subjects[subject["id"]]["module"] = subject["module"];
        subjects[subject["id"]]["is_default"] = subject["is_default"];
        subjects[subject["id"]]["registration_name"] = subject[
          "registration_name"
        ]
          ? subject["registration_name"]
          : subject["name"];
        subjects[subject["id"]]["for_registration"] = subject[
          "for_registration"
        ]
          ? subject["for_registration"]
          : false;
        subjects[subject["id"]]["departments"] = [];
      });
    }

    if (department_masters && department_masters > 0) {
      department_masters.forEach((department) => {
        let department_subjects = department["subjects"];
        if (department_subjects && department_subjects.length > 0) {
          department_subjects.forEach((dep_subject) => {
            let department_master = {};
            department_master["id"] = department["id"];
            department_master["name"] = department["name"];
            if (subjects[dep_subject]["departments"].length == 0) {
              department_master["is_default"] = true; //department_masters[i]["is_default"];
            } else {
              department_master["is_default"] = false; //department_masters[i]["is_default"];
            }
            subjects[dep_subject]["departments"].push(department_master);
          });
        }
      });
    }
    let subjects_with_departments = [];
    for (const [key, value] of Object.entries(subjects)) {
      if (final_data[value.module] && final_data[value.module].length == 0) {
        value["is_default"] = true;
      } else {
        value["is_default"] = false;
      }
      if (final_data[value.module]) final_data[value.module].push(value);
      subjects_with_departments.push(value);
    }
    return final_data;
  } catch (err) {
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
