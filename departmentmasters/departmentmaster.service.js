const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const get_current_user = commonmethods.get_current_user;
const Video = db.Video;
const Departmentmaster = db.Departmentmaster;
const Subjectmaster = db.Subjectmaster;

module.exports = {
  getAll,
  getById,
  getAllWithSubjects: getAllWithSubjects,
  create,
  update,
  delete: _delete,
};

async function getAllWithSubjects() {
  const defer = require("q").defer();
  try {
    const subject_masters = await Subjectmaster.find()
      .sort({ sort_order: 1 })
      .select("-hash");
    console.log("Subject Masters: ", subject_masters, "getAllWithSubjects");
    const department_masters = await Departmentmaster.find()
      .sort({ sort_order: 1 })
      .select("-hash");
      console.log("Department Masters: ", department_masters, "getAllWithSubjects");
    const subjects = subject_masters.reduce((acc, subjectMaster) => {
      acc[subjectMaster.id] = {
        id: subjectMaster?.id,
        name: subjectMaster?.name,
        is_default: subjectMaster?.is_default,
        for_registration: subjectMaster?.for_registration || false,
        registration_name:
          subjectMaster?.registration_name || subjectMaster?.name,
      };
      return acc;
    }, {});

    const final_data = {
      sss: [],
      sst: [],
      ssh: [],
      sa: [],
      elearning: [],
      dd: [],
    };

    let default_subject = true;

    department_masters.forEach((departmentMaster) => {
      const department_subjects = departmentMaster?.subjects;
      const department_subject_details = [];

      department_subjects.forEach(async (departmentSubject) => {
        const video_count = await Video.find({
          department: departmentMaster?.id,
          subject: departmentSubject,
        }).countDocuments();

        const curSubject = {
          name: subjects[departmentSubject]?.name,
          for_registration: subjects[departmentSubject]?.for_registration,
          registration_name: subjects[departmentSubject]?.registration_name,
          id: subjects[departmentSubject]?.id,
          is_default: default_subject,
          videos: video_count,
        };

        department_subject_details.push(curSubject);
        default_subject = false;
      });

      const department_master = {
        subjects: department_subject_details,
        name: departmentMaster?.name,
        for_registration: departmentMaster?.for_registration || false,
        registration_name:
          departmentMaster?.registration_name || departmentMaster?.name,
        is_default: final_data[departmentMaster.module].length === 0,
        id: departmentMaster?.id,
      };

      final_data[departmentMaster.module].push(department_master);
    });
    console.log("Final Data: ", final_data, "getAllWithSubjects");
    defer.resolve(final_data);
  } catch (err) {
    console.log("Error in: ", err, "getAllWithSubjects");
    defer.reject(err);
  }

  return defer.promise;
}

/**
 * To retrieve all departments
 * @returns departments list
 */
async function getAll() {
  try {
    return await Departmentmaster.find().select("-hash");
  } catch (error) {
    console.log("Error in: ", error, "getAllDepartments");
  }
}

/**
 * To retrieve departments by id
 * @returns department object
 */
async function getById(id) {
  try {
    return await Departmentmaster.findById(id).select("-hash");
  } catch(error) {
    console.log("Error in: ", error, "getAllDepartmentsByID");
  }
}

async function create(req) {
  var departmentmasterParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  // validate

  if (
    await Departmentmaster.findOne({
      name: departmentmasterParam.name,
      module: departmentmasterParam.module,
    })
  ) {
    throw (
      'Department "' +
      departmentmasterParam.name +
      '" is already taken for ' +
      config.modules[departmentmasterParam.module]
    );
  }

  departmentmasterParam.createdBy = current_user;
  departmentmasterParam.updatedBy = current_user;
  //departmentmasterParam.subjects = departmentmasterParam.selectedSubjects;
  const departmentmaster = new Departmentmaster(departmentmasterParam);
  oldDefault = new Departmentmaster();

  // save departmentmaster
  if (departmentmasterParam.is_default == true) {
    oldDefault = await Departmentmaster.findOne({ is_default: true });
  }
  await departmentmaster.save();
  if (departmentmasterParam.is_default == true) {
    await Departmentmaster.update(
      { _id: oldDefault.id },
      { is_default: false }
    );
  }
}

async function update(id, req) {
  var departmentmasterParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  const departmentmaster = await Departmentmaster.findById(id);
  const oldDefault = await Departmentmaster.findOne({ is_default: true });

  departmentmasterParam.updatedBy = current_user;
  departmentmasterParam.updatedDate = updatedAt;
  // validate
  if (!departmentmaster) throw "Department not found";
  if (
    departmentmaster.name !== departmentmasterParam.name &&
    (await Departmentmaster.findOne({ name: departmentmasterParam.name }))
  ) {
    throw 'Department "' + departmentmasterParam.name + '" is already taken';
  }

  if (departmentmaster.is_default == true) {
    departmentmasterParam.is_default = true;
  }

  //departmentmasterParam.subjects = departmentmasterParam.selectedSubjects;
  // copy departmentmasterParam properties to departmentmaster
  Object.assign(departmentmaster, departmentmasterParam);

  await departmentmaster.save();
  if (
    departmentmasterParam.is_default == true &&
    departmentmaster.id != oldDefault.id
  ) {
    await Departmentmaster.update(
      { _id: oldDefault.id },
      { is_default: false }
    );
  }
}

async function _delete(id) {
  const departmentvideo = await Video.find({ department: id }).countDocuments();
  if (departmentvideo == 0) {
    const departmentmaster = await Departmentmaster.findById(id);
    if (departmentmaster.is_default == true) {
      throw "Default department cannot be deleted";
    } else {
      await Departmentmaster.findByIdAndRemove(id);
    }
  } else {
    throw "Department cannot be deleted, as it was mapped to some videos";
  }
}
