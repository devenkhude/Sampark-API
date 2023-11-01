const { parentPort } = require("worker_threads");
const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const get_current_user = commonmethods.get_current_user;
const Subjectmaster = db.Subjectmaster;
const Video = db.Video;
const Departmentmaster = db.Departmentmaster;

async function performApiLogic() {
  try {
    const subjectMasters = await Subjectmaster.find()
      .sort({ sort_order: 1 })
      .select("-hash");

    const departmentMasters = await Departmentmaster.find()
      .sort({ sort_order: 1 })
      .select("-hash");

    if (!subjectMasters.length || !departmentMasters.length) {
      throw new Error("No data found.");
    }

    // const finalData = {
    //   sss: [],
    //   sst: [],
    //   ssh: [],
    //   sa: [],
    //   elearning: [],
    //   dd: [],
    // };

    // const subjects = {};

    // // Create subjects and map departments
    // subjectMasters.forEach((subject) => {
    //   const subjectId = subject.id;
    //   subjects[subjectId] = {
    //     id: subjectId,
    //     name: subject.name,
    //     icon: subject.icon
    //       ? config.repositoryHost + subject.icon
    //       : config.assetHost + subject.name.toLowerCase() + ".png",
    //     icon_active: subject.activeicon
    //       ? config.repositoryHost + subject.activeicon
    //       : config.assetHost + "big-" + subject.name.toLowerCase() + ".png",
    //     module: subject.module,
    //     is_default: subject.is_default,
    //     registration_name: subject.registration_name || subject.name,
    //     for_registration: subject.for_registration || false,
    //     departments: [],
    //   };
    // });

    // // Map departments to subjects
    // departmentMasters.forEach((department) => {
    //   const departmentSubjects = department.subjects;
    //   if (departmentSubjects.length > 0) {
    //     departmentSubjects.forEach((depSubject) => {
    //       const departmentMaster = {
    //         id: department.id,
    //         name: department.name,
    //         is_default: subjects[depSubject].departments.length === 0,
    //       };
    //       subjects[depSubject].departments.push(departmentMaster);
    //     });
    //   }
    // });

    // // Create subjects_with_departments and populate finalData
    // const subjectsWithDepartments = Object.values(subjects);
    // subjectsWithDepartments.forEach((value) => {
    //   if (finalData[value.module].length === 0) {
    //     value.is_default = true;
    //   } else {
    //     value.is_default = false;
    //   }
    //   finalData[value.module].push(value);
    // });

    return subjectMasters;
  } catch (err) {
    console.log("Catch Exception: ", err);
    throw new Error(err.message);
  }
}

performApiLogic().then((data) => {
  console.log("Worker Thread Success: ", data);
  parentPort.postMessage(data);
}).catch((err) => {
  console.log("Worker Thread: ", err);
});

// parentPort.on("message", async (message) => {
//   if (message.api === "getAllWithDepartments") {
//     // Implement logic for API 1
//     console.log("Worker Message: ", message);
//     const result = await performApiLogic();
//     console.log("Worker Result: ", result);
//     parentPort.postMessage(result);
//   }
//   // Add more conditions for other APIs if needed
// });
