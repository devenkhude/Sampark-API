const { parentPort } = require("worker_threads");
const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;

async function performApiLogic() {
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

parentPort.on("message", async (message) => {
  console.log("Message from Worker: ", message);
  if (message.api === "getAllWithDepartments") {
    try {
      const result = await performApiLogic();
      parentPort.postMessage(JSON.stringify(result));
    } catch (error) {
      console.error("Worker Error: ", error);
      parentPort.postMessage({ error: error.message });
    }
  }
});
