const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
let q = require("q");
const Assessment = db.Assessment;
const AssessmentQuestion = db.Assessmentquestion;
const AssessmentStudentProgress = db.Assessmentstudentprogress;
const School = db.School;
const Schooldummy = db.Schooldummy;
const Student = db.Student;
const Reward = db.Reward;
const State = db.State;
const District = db.District;
const Block = db.Block;
const User = db.User;
const Cluster = db.Cluster;
const Video = db.Video;
const Departmentmaster = db.Departmentmaster;
const Subjectmaster = db.Subjectmaster;
const Competencymaster = db.Competencymaster;
const savePointsAndCalculateReward = commonmethods.savePointsAndCalculateReward;
const Lesson = db.Lesson;

const csvsync = require("csvsync");
const _ = require("underscore");
const fs = require("fs");
const { ObjectId } = require("mongodb");
const objectId = require("mongoose").Types.ObjectId;

module.exports = {
  importExcel,
  hindiImportExcel,
  importExcelStudents,
  importExcelParents,
  getClassesAndStudents,
  registerStudent,
  getAssessmentClass,
  getAssessments,
  getQuesionwiseReport,
  getQuestions,
  saveAssessmentResults,
  saveAssessmentResultsForPT,
  getAssessmentsForPT,
  getClassStudents,
  getChildrenForParent,
  importExcelSchool,
  getRewardDetails,
  getSSSAssessment,
  rewardOpened,
  getClasses,
  getStudents,
};

async function importExcelSchool(req) {
  //Convert csv data into json
  var csv = fs.readFileSync("assessments/school_data.csv");
  var data = csvsync.parse(csv);

  //Loop through excel data row by row
  for (var i = 1; i < data.length; i++) {
    var studentArr = data[i];

    if (studentArr[1] && studentArr[2] && studentArr[3] && studentArr[4]) {
      try {
        /*let district = "";
				let districtArr = studentArr[4].trim().split(' ');
				if (districtArr) {
				  for (let index = 0; index < districtArr.length; index++) {
					const element = districtArr[index];
					district = district + element.charAt(0).toUpperCase() + element.slice(1).toLowerCase() + (districtArr.length - index > 1 ? ' ' : '');
				  }
				}
				let cluster = "";
				let clusterArr = studentArr[5].trim().split(' ');
				if (clusterArr) {
				  for (let index = 0; index < clusterArr.length; index++) {
					const element = clusterArr[index];
					cluster = cluster + element.charAt(0).toUpperCase() + element.slice(1) + (clusterArr.length - index > 1 ? ' ' : '');
				  }
				}
		
				let block = "";
				let blockArr = studentArr[6].trim().split(' ');
				if (blockArr) {
				  for (let index = 0; index < blockArr.length; index++) {
					const element = blockArr[index];
					block = block + element.charAt(0).toUpperCase() + element.slice(1) + (blockArr.length - index > 1 ? ' ' : '');
				  }
				}
		
				let dbState = await State.find({ short_name: studentArr[3].trim() });
				let stateId = dbState[0] ? new objectId(dbState[0].id) : null;
		
				let dbDistrict = await District.find({ name: district, state_id: stateId });
				let districtId = dbDistrict[0] ? new objectId(dbDistrict[0].id) : null;
		
				let dbBlock = await Block.find({ name: block, district_id: districtId });
				let blockId = dbBlock[0] ? new objectId(dbBlock[0].id) : null;
		
				let dbCluster = await Cluster.find({ name: cluster, block_id: blockId });
				let clusterId = dbCluster[0] ? new objectId(dbCluster[0].id) : null;*/

        let dbState = await State.find({ sf_state_id: studentArr[3] });
        let stateId = dbState[0] ? new objectId(dbState[0].id) : null;

        let dbDistrict = await District.find({
          sf_district_id: studentArr[4],
          state_id: stateId,
        });
        let districtId = dbDistrict[0] ? new objectId(dbDistrict[0].id) : null;

        let dbBlock = await Block.find({
          sf_block_id: studentArr[5],
          district_id: districtId,
        });
        let blockId = dbBlock[0] ? new objectId(dbBlock[0].id) : null;

        let dbCluster = await Cluster.find({
          sf_cluster_id: studentArr[6],
          block_id: blockId,
        });
        let clusterId = dbCluster[0] ? new objectId(dbCluster[0].id) : null;

        createdBy = new objectId("5e4a47b2309e7b815f3f3b5d");
        modifiedBy = new objectId("5e4a47b2309e7b815f3f3b5d");
        let disecode = studentArr[2].trim();
        if (disecode.length == 10) {
          disecode = "0" + disecode;
        }

        if (stateId && districtId && blockId && clusterId) {
          const dbSchool = new School({
            schoolName: studentArr[1],
            diseCode: disecode,
            state: stateId,
            district: districtId,
            block: blockId,
            cluster: clusterId,
            createdDate: new Date(),
            modifiedDate: new Date(),
            createdBy: createdBy,
            modifiedBy: modifiedBy,
          });

          await dbSchool.save();
        } else {
          const dbSchoolDummy = new Schooldummy({
            schoolName: studentArr[1],
            diseCode: disecode,
            state: stateId,
            district: districtId,
            block: blockId,
            cluster: clusterId,
            createdDate: new Date(),
            modifiedDate: new Date(),
            createdBy: createdBy,
            modifiedBy: modifiedBy,
          });

          await dbSchoolDummy.save();
        }
      } catch (ex) {
        console.log(ex);
        throw ex;
      }
    }
  }
  return true;
}

/*
This API is to import assessment excel data into assessments ans assessmentquestions collections

DB Indexes  :

*/
async function importExcel(req) {
  //Convert csv data into json
  var csv = fs.readFileSync("assessments/assessment_collection_db_format.csv");
  var data = csvsync.parse(csv);

  //Loop through excel data row by row

  for (var i = 0; i < data.length; i++) {
    var assessArr = data[i];
    var assessmentId, createdBy, modifiedBy;
    var options = {};
    var answerObj = {};

    //If first columns are not empty it is assessment otherwise its assessment question
    if (assessArr[0] && assessArr[1] && assessArr[2] && assessArr[3]) {
      createdBy = new objectId(assessArr[4].trim());
      modifiedBy = new objectId(assessArr[5].trim());

      const assessment = new Assessment({
        state: new objectId(assessArr[0].trim()),
        department: new objectId(assessArr[1].trim()),
        subject: new objectId(assessArr[2].trim()),
        lesson: assessArr[3],
        //durationType: assessArr[4],
        //duration: assessArr[5],
        //type: assessArr[6],
        //isActive: (/true/i).test(assessArr[7]),
        //competencyCode: assessArr[8],
        //competency: assessArr[9],
        createdDate: new Date(),
        modifiedDate: new Date(),
        createdBy: createdBy,
        modifiedBy: modifiedBy,
      });

      await assessment.save();
      assessmentId = assessment.id;
    } else if (assessArr[7] && assessArr[8] && assessArr[9] && assessArr[10]) {
      options["a"] = assessArr[7];
      options["b"] = assessArr[8];
      options["c"] = assessArr[9];
      options["d"] = assessArr[10];

      for (var key in options) {
        if (
          options[key].trim().toLowerCase() ===
          assessArr[11].trim().toLowerCase()
        )
          answerObj[key] = assessArr[11].trim();
      }
      if (!_.isEmpty(options) && !_.isEmpty(answerObj)) {
        const assessmentQuesion = new AssessmentQuestion({
          assessment: assessmentId,
          question: assessArr[6],
          options: options,
          correctAnswer: answerObj,
          isActive: true,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createdBy: createdBy,
          modifiedBy: modifiedBy,
        });
        await assessmentQuesion.save();
      }
    }
  }
  return true;
}

/*
This API is to import assessment excel data into assessments ans assessmentquestions collections

DB Indexes  :

*/
async function hindiImportExcel(req) {
  const excelToJson = require("convert-excel-to-json");

  const data = excelToJson({
    sourceFile: "assessments/xlsfile.xlsx",
  });

  //return data;

  //Loop through excel data row by row

  for (var key in data) {
    var assessData = data[key];

    for (var index in assessData) {
      assessArr = assessData[index];

      var assessmentId, createdBy, modifiedBy;
      var options = {};
      var answerObj = {};

      createdBy = new objectId("5e4a47b2309e7b815f3f3b5d");
      modifiedBy = new objectId("5e4a47b2309e7b815f3f3b5d");

      //If first columns are not empty it is assessment otherwise its assessment question
      if (assessArr["A"] && assessArr["B"] && assessArr["C"]) {
        //To get subject id
        subjectName = assessArr["A"].trim();
        const subjects = await Subjectmaster.find({
          module: "sa",
          name: subjectName,
        }).select("id name");
        subjectId = new objectId(subjects[0].id);

        //To get department id
        deptName = assessArr["B"].trim();
        const departments = await Departmentmaster.find({
          module: "sa",
          name: deptName,
        }).select("id name");
        deptId = new objectId(departments[0].id);

        const assessment = new Assessment({
          department: deptId,
          subject: subjectId,
          chapterNumber: assessArr["C"],
          lesson: assessArr["D"].trim(),
          createdDate: new Date(),
          modifiedDate: new Date(),
          createdBy: createdBy,
          modifiedBy: modifiedBy,
        });

        await assessment.save();
        assessmentId = assessment.id;
      } else if (
        assessArr["H"] &&
        assessArr["I"] &&
        assessArr["J"] &&
        assessArr["K"]
      ) {
        competencyId = null;

        if (assessArr["F"] && assessArr["G"]) {
          competencyCode = assessArr["F"].trim();
          competencyName = assessArr["G"].trim();
          //stateId = new objectId("5e3954011a2ed23b0ca82b10");

          const competencies = await Competencymaster.find({
            code: competencyCode,
          }).select("id name");

          if (competencies && competencies.length) {
            competencyId = new objectId(competencies[0].id);
          } else {
            const competencymaster = new Competencymaster({
              name: competencyName,
              code: competencyCode,
              //state: stateId,
              createdDate: new Date(),
              modifiedDate: new Date(),
              createdBy: createdBy,
              modifiedBy: modifiedBy,
            });

            await competencymaster.save();
            competencyId = competencymaster.id;
          }
        }

        options["a"] =
          typeof assessArr["H"] === "string"
            ? assessArr["H"].trim()
            : assessArr["H"];
        options["b"] =
          typeof assessArr["I"] === "string"
            ? assessArr["I"].trim()
            : assessArr["I"];
        options["c"] =
          typeof assessArr["J"] === "string"
            ? assessArr["J"].trim()
            : assessArr["J"];
        options["d"] =
          typeof assessArr["K"] === "string"
            ? assessArr["K"].trim()
            : assessArr["K"];

        assessArr["L"] =
          typeof assessArr["L"] === "string"
            ? assessArr["L"].trim()
            : assessArr["L"];

        for (var key2 in options) {
          if (options[key2] === assessArr["L"])
            answerObj[key2] = assessArr["L"];
        }

        if (!_.isEmpty(options) && !_.isEmpty(answerObj)) {
          const assessmentQuesion = new AssessmentQuestion({
            assessment: assessmentId,
            question: assessArr["E"].trim(),
            options: options,
            competency: competencyId,
            correctAnswer: answerObj,
            isActive: true,
            createdDate: new Date(),
            modifiedDate: new Date(),
            createdBy: createdBy,
            modifiedBy: modifiedBy,
          });
          await assessmentQuesion.save();
        }
      }
    }
  }

  return true;
}

/*
This API is to import student excel data into students collection

DB Indexes  : 

*/
async function importExcelStudents(req) {
  //Convert csv data into json
  var csv = fs.readFileSync("assessments/students.csv");
  var data = csvsync.parse(csv);

  //Loop through excel data row by row
  for (var i = 1; i < data.length; i++) {
    var studentArr = data[i];

    if (studentArr[1]) {
      createdBy = new objectId("5e4a47b2309e7b815f3f3b5d");
      modifiedBy = new objectId("5e4a47b2309e7b815f3f3b5d");

      let disecode = studentArr[4].trim();
      if (disecode.length == 10) {
        disecode = "0" + disecode;
      }

      parentMobile = studentArr[0] ? studentArr[0] : 0;

      //To get department id
      deptName = "Class " + studentArr[5];
      const departments = await Departmentmaster.find({
        module: "sa",
        name: deptName,
      }).select("id name");
      deptId = new objectId(departments[0].id);

      const student = new Student({
        parentMobile: parentMobile,
        srnNo: studentArr[1],
        childName: studentArr[2],
        parentName: studentArr[3],
        diseCode: disecode,
        department: deptId,
        createdDate: new Date(),
        modifiedDate: new Date(),
        createdBy: createdBy,
        modifiedBy: modifiedBy,
      });

      await student.save();
    }
  }

  return true;
}

/*
This API is to import parent excel data into users collection

DB Indexes  : 

*/
async function importExcelParents(req) {
  //Convert csv data into json
  var csv = fs.readFileSync("assessments/parents.csv");
  var data = csvsync.parse(csv);

  //Loop through excel data row by row
  for (var i = 1; i < data.length; i++) {
    var parentArr = data[i];

    if (parentArr[0] && parentArr[1] && parentArr[2] && parentArr[3]) {
      createdBy = new objectId(parentArr[10]);
      modifiedBy = new objectId(parentArr[11]);

      const user = new User({
        state: parentArr[0],
        district: parentArr[1],
        block: parentArr[2],
        cluster: parentArr[3],
        school: parentArr[4],
        pincode: parentArr[5],
        diseCode: parentArr[6],
        firstName: parentArr[7],
        lastName: parentArr[8],
        phone_number: parentArr[9],
        usertype: "parent",
        otp: "1111",
        hash: "1111",
        createdDate: new Date(),
        modifiedDate: new Date(),
        createdBy: createdBy,
        modifiedBy: modifiedBy,
      });

      await user.save();
    }
  }

  return true;
}

/*
This API is to get classes and students by the given disecode
*/
async function getClassesAndStudents(userParam) {
  let query = {};
  let queryAssess = {};
  let finalArray = [];
  //return userParam;

  const forReport = userParam.forReport;

  //To get active students based on disecode
  query["isActive"] = true;
  query["diseCode"] = userParam.disecode;

  //To get assessments for logged in teachers state
  queryAssess["isActive"] = true;
  queryAssess["published"] = true;
  queryAssess["startDate"] = { $lte: new Date() };
  queryAssess["endDate"] = { $gte: new Date() };

  queryAssess["type"] = { $in: ["MT"] };
  queryAssess["assessmentType"] = "State";

  if (Boolean(userParam.stateId)) {
    let arrState = [];
    arrState.push(userParam.stateId);
    queryAssess["states"] = { $in: arrState };
  } else {
    //Get state Id based on disecode
    const checkSchool = await School.findOne({ diseCode: userParam.disecode });
    if (checkSchool) {
      let diseStateId = checkSchool.state.toString();
      let arrState = [];
      arrState.push(diseStateId);
      queryAssess["states"] = { $in: arrState };
    }
  }

  const students = await Student.find(query).select("id childName department");
  //To get all claases for this sa module
  const departments = await Departmentmaster.find({ module: "sa" }).select(
    "id name"
  );

  //To do groupby on department of students received
  const studentsGroupByClass = _.groupBy(students, "department");

  //Loop through objects
  for (let deptId in studentsGroupByClass) {
    let classList = {};
    const searchMask = " ";
    const regEx = new RegExp(searchMask, "ig");
    const replaceMask = "";

    //To get class name
    const deptName = _.where(departments, { id: deptId });

    //Assigning required class info to a final object
    classList["id"] = deptId;
    classList["className"] = deptName[0]["name"];
    classList["icon"] =
      config.assetHost +
      deptName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
      ".png";
    classList["icon_active"] =
      config.assetHost +
      "big-" +
      deptName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
      ".png";

    //To get total assessments count for this class
    queryAssess["department"] = deptId;

    const dbAssessments = await Assessment.find(queryAssess).select("id");

    let arrAssessIds = [];

    if (dbAssessments && dbAssessments.length) {
      dbAssessments.forEach((element) => {
        let dbAssessId = new objectId(element.id);
        arrAssessIds.push(dbAssessId);
      });
    }

    const totalTestCnt = arrAssessIds.length;
    classList["total_test_count"] = totalTestCnt;

    //Array of students and ids
    let studentsArr = [];
    let arrStudentIds = [];

    for (let studentIndex in studentsGroupByClass[deptId]) {
      let studentInnerObj = studentsGroupByClass[deptId][studentIndex];
      let dbStudentId = new objectId(studentInnerObj["id"]);
      arrStudentIds.push(dbStudentId);
    }

    //To get count of tests attempted, stars and percentage for all students
    const progressRecords = await AssessmentStudentProgress.aggregate([
      {
        $match: {
          student: { $in: arrStudentIds },
          department: new objectId(deptId),
          assessment: { $in: arrAssessIds },
        },
      },
      {
        $group: {
          _id: "$student",
          testAttemptedCnt: { $sum: 1 },
          totalStars: { $sum: "$countOfStar" },
          totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
          totalQuestionCnt: { $sum: "$totalQuestionCnt" },
        },
      },
    ]);

    //For all students get the required details
    for (let studentIndex in studentsGroupByClass[deptId]) {
      let studentInnerObj = studentsGroupByClass[deptId][studentIndex];

      //Each student as an object
      let studentObj = {};

      studentObj["id"] = studentInnerObj["id"];
      studentObj["name"] = studentInnerObj["childName"];

      let matchingProgress = _.filter(
        progressRecords,
        (item) => String(item._id) === String(studentInnerObj["id"])
      );

      studentObj["test_attempted"] = matchingProgress.length
        ? matchingProgress[0]["testAttemptedCnt"]
        : 0;
      studentObj["test_pending"] = totalTestCnt - studentObj["test_attempted"];

      //If its for childwise report get percentage and count of stars
      if (forReport) {
        if (matchingProgress.length) {
          let calcPercentage =
            (matchingProgress[0]["totalCorrectQuestionCnt"] /
              matchingProgress[0]["totalQuestionCnt"]) *
            100;
          studentObj["totalPercentage"] = Number(calcPercentage.toFixed(2));
          studentObj["totalStars"] = matchingProgress[0]["totalStars"];
        } else {
          studentObj["totalPercentage"] = null;
          studentObj["totalStars"] = null;
        }
      }

      //Push each object to an array
      studentsArr.push(studentObj);
    }

    //Push all students to final object
    classList["students"] = studentsArr;

    //Assign final object to an array
    finalArray.push(classList);
  }

  //Sort final array by class name
  finalArray = _.sortBy(finalArray, "className");

  //return final array
  return finalArray;
}

async function getAssessmentClass(req) {
  const departments = await Departmentmaster.find({ module: "sa" });
  let departmentList = [];
  if (departments && departments.length) {
    const searchMask = " ";
    const regEx = new RegExp(searchMask, "ig");
    const replaceMask = "";
    departments.forEach((element) => {
      let department = {};
      department["icon"] =
        config.assetHost +
        element.name.toLowerCase().replace(regEx, replaceMask) +
        ".png";
      department["icon_active"] =
        config.assetHost +
        "big-" +
        element.name.toLowerCase().replace(regEx, replaceMask) +
        ".png";
      department.id = element.id;
      department.module = element.module;
      department.name = element.name;
      departmentList.push(department);
    });
  }
  return departmentList;
}

async function registerStudent(req) {
  if (req) {
    if (req.diseCode && req.diseCode !== "") {
      //To check if diseCode exists in db
      var diseCodeCnt = await School.find({
        diseCode: req.diseCode,
      }).countDocuments();

      if (!diseCodeCnt) {
        throw "Dise Code does not exists in database";
      }
    }

    try {
      var studentDetail = req;
      // only available disecode can be inserted in the db
      const student = new Student({
        parentMobile: studentDetail.parentMobile,
        srnNo: studentDetail.SRNumber,
        childName: studentDetail.name,
        parentName: studentDetail.parentName,
        diseCode: studentDetail.diseCode,
        department: new objectId(studentDetail.department),
        isActive: true,
        createdDate: new Date(),
        modifiedDate: new Date(),
        createdBy: new objectId(studentDetail.createdBy),
        modifiedBy: new objectId(studentDetail.createdBy),
      });
      await student.save();
      return true;
    } catch (e) {
      return false;
    }
  } else {
    return false;
  }
}

/*
This API is to get assessments by class for the selected student
*/
async function getAssessments(userParam) {
  let query = {};
  let finalArray = [];

  let searchMask = " ";
  let regEx = new RegExp(searchMask, "ig");
  let replaceMask = "";

  let forReport = userParam.forReport;

  //To get active assessments based on class id
  query["isActive"] = true;
  query["published"] = true;
  query["startDate"] = { $lte: new Date() };
  query["endDate"] = { $gte: new Date() };

  if (userParam.userType == "govt teacher" || userParam.userType == "teacher") {
    query["type"] = { $in: ["MT"] };
    query["assessmentType"] = "State";
  } else {
    query["type"] = { $in: ["HT"] };
    query["assessmentType"] = "State";
  }

  let arrState = ["all"]; //'all' added by gagan, so that those assessments should also be included which are for all the states
  if (Boolean(userParam.stateId)) {
    arrState.push(userParam.stateId);
    query["states"] = { $in: arrState };
  }

  query["department"] = userParam.classId;
  let assessments = await Assessment.find(query).sort({ chapterNumber: 1 });

  // Whenever state assessment is not present, show self assessment
  if (assessments.length == 0) {
    query["assessmentType"] = "Self";
    assessments = await Assessment.find(query).sort({ chapterNumber: 1 });
  }

  //To get all claases for this sa module
  const Subjects = await Subjectmaster.find({ module: "sa" }).select("id name");

  //To do groupby on department of assessments received
  let assessmentsGroupByClass = _.groupBy(assessments, "subject");

  //Loop through objects
  for (let subjectId in assessmentsGroupByClass) {
    let assessmentList = {};

    //To get subject name
    let subjectName = _.where(Subjects, { id: subjectId });

    //Assigning required class info to a final object
    assessmentList["id"] = subjectId;
    assessmentList["subjectName"] = subjectName[0]["name"];
    assessmentList["icon"] =
      config.assetHost +
      subjectName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
      ".png";
    assessmentList["icon_active"] =
      config.assetHost +
      "big-" +
      subjectName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
      ".png";

    //Array of assessment
    let assessArr = [];
    let arrAssessIds = [];

    for (let assessIndex in assessmentsGroupByClass[subjectId]) {
      let assessInnerObj = assessmentsGroupByClass[subjectId][assessIndex];
      arrAssessIds.push(assessInnerObj["id"]);
    }

    //To get count of stars and percentage for all assessments
    const progressRecords = await AssessmentStudentProgress.find({
      department: userParam.classId,
      subject: subjectId,
      student: userParam.studentId,
      assessment: { $in: arrAssessIds },
    }).select(
      "assessment correctQuestionCnt totalQuestionCnt countOfStar type"
    );

    for (let assessIndex in assessmentsGroupByClass[subjectId]) {
      let assessInnerObj = assessmentsGroupByClass[subjectId][assessIndex];

      //Each assessment as an object
      let assessObj = {};

      assessObj["id"] = assessInnerObj["id"];
      assessObj["name"] = assessInnerObj["lesson"];
      assessObj["type"] = assessInnerObj["type"];
      //assessObj['suggestedVideos'] = assessInnerObj['suggestedVideos'];
      if (assessInnerObj["suggestedVideos"].length > 0) {
        let suggestedVideosList = await Video.find({
          _id: {
            $in: assessInnerObj["suggestedVideos"],
          },
        });

        if (suggestedVideosList.length > 0) {
          let suggestedVideoArray = [];
          for (const suggestedVideoObject of suggestedVideosList) {
            let suggestedVideo = {};
            suggestedVideo["name"] = suggestedVideoObject["name"];
            suggestedVideo["video_code"] = suggestedVideoObject["video_code"];
            suggestedVideo["url"] = suggestedVideoObject["url"];
            suggestedVideo["description"] = suggestedVideoObject["description"];
            suggestedVideo["thumbnail"] =
              config.repositoryHost + suggestedVideoObject["thumbnail"];
            suggestedVideo["height"] = suggestedVideoObject["height"];
            suggestedVideo["width"] = suggestedVideoObject["width"];

            suggestedVideoArray.push(suggestedVideo);
          }
          assessObj["suggestedVideos"] = suggestedVideoArray;
        }
      } else assessObj["suggestedVideos"] = [];

      assessObj["report"] = {};

      const matchingProgress = _.filter(
        progressRecords,
        (item) => String(item.assessment) === String(assessInnerObj["id"])
      );

      if (matchingProgress.length) {
        let calcPercentage =
          (matchingProgress[0]["correctQuestionCnt"] /
            matchingProgress[0]["totalQuestionCnt"]) *
          100;
        assessObj["report"]["calculatedPercentage"] = Number(
          calcPercentage.toFixed(2)
        );
        assessObj["report"]["correctQuestionCnt"] =
          matchingProgress[0]["correctQuestionCnt"];
        assessObj["report"]["totalQuestionCnt"] =
          matchingProgress[0]["totalQuestionCnt"];
        assessObj["report"]["countOfStar"] = matchingProgress[0]["countOfStar"];
        assessObj["report"]["type"] = matchingProgress[0]["type"];
        assessObj["report"]["attemptedCnt"] = 1;
      }

      assessObj["studentAnswers"] = [];
      let ansObject = {};

      ansObject["question"] = "Q1";
      ansObject["selectedAnswer"] = "A";
      ansObject["correctAnswer"] = "A";

      assessObj["studentAnswers"].push(ansObject);

      //Push each object to an array
      assessArr.push(assessObj);

      //Push all assessments to final object
      assessmentList["assessments"] = assessArr;
    }

    //Assign final object to an array
    finalArray.push(assessmentList);
  }

  //If its for subjectwise report, add all subjects
  if (forReport) {
    if (assessments.length) {
      let assessmentList = {};

      let allSubjectName = "All Subject";

      assessmentList["subjectName"] = allSubjectName;
      assessmentList["icon"] =
        config.assetHost +
        allSubjectName.toLowerCase().replace(regEx, replaceMask) +
        ".png";
      assessmentList["icon_active"] =
        config.assetHost +
        "big-" +
        allSubjectName.toLowerCase().replace(regEx, replaceMask) +
        ".png";

      finalArray.push(assessmentList);
    }
  }

  //return final array
  return finalArray;
}

/*
This API is to get questionwise report for the selected student and assessment
*/
async function getQuesionwiseReport(userParam) {
  let studentId = userParam.studentId;
  let assessmentId = userParam.assessmentId;
  let finalArray = [];

  //To get answers for this assessment
  let studentAnswers = await AssessmentStudentProgress.find({
    student: studentId,
    assessment: assessmentId,
  }).select("answers");

  if (studentAnswers.length) {
    for (let i = 1; i <= studentAnswers.length; i++) {
      let ansObject = {};
      ansObject["question"] = "Q" + i;
      ansObject["selectedAnswer"] = studentAnswers[i - 1]["selectedAnswer"];
      ansObject["correctAnswer"] = studentAnswers[i - 1]["correctAnswer"];
      finalArray.push(ansObject);
    }
  }

  return finalArray;
}

/*
This API is to get questions by assessment ids
*/
async function getQuestions(userParam) {
  try {
    //Get comma separated by assessments
    var assessmentIds = userParam.assessmentIds;
    //var classId = userParam.classId;
    var assessType = userParam.type;
    //Split them into array
    var arrAssessmentIds = assessmentIds.split(",");
    let query = {};
    let finalArray = [];
    //To get active assessments based on class id
    query["isActive"] = true;
    query["assessment"] = { $in: arrAssessmentIds };

    var assessmentQuestions = await AssessmentQuestion.find(query);

    let queryAssess = {};
    //To get active assessments based on class id
    queryAssess["isActive"] = true;
    queryAssess["department"] = userParam.classId;

    const Assessments = await Assessment.find(queryAssess);

    //To do groupby on department of assessments received
    var questionsGroupByAssessment = _.groupBy(
      assessmentQuestions,
      "assessment"
    );

    //Loop through objects
    for (var assessId in questionsGroupByAssessment) {
      let questionList = {};

      //Assigning required class info to a final object
      questionList["id"] = assessId;

      //To get assessment details
      var assessmentName = _.where(Assessments, { id: assessId });

      if (assessmentName && assessmentName[0]) {
        questionList["name"] = assessmentName[0]["lesson"];
        questionList["level"] = assessmentName[0]["level"];
        var level = assessmentName[0]["level"];
        questionList["timeLimit"] = assessmentName[0]["duration"];

        requiredCnt =
          questionsGroupByAssessment[assessId].length >= 21
            ? 21
            : questionsGroupByAssessment[assessId].length;
        questionList["displayQuestionsCnt"] = requiredCnt - 1;

        questionList["instructions"] = [];

        var instruction1 =
          "You will get total " +
          assessmentName[0]["duration"] +
          " minutes to finish the test;" +
          " if you finish in " +
          level["Difficult"] +
          " minutes (Difficult), you will get 3 stars, in " +
          level["Moderate"] +
          " mins (Moderate) you  will get 2 stars and above " +
          level["Easy"] +
          " mins you will get 1 star";

        var instruction2 =
          "For each assessment you will get 3 lifelines from Sampark Didi to help you in the " +
          "test, if you don’t use the lifelines you will get 1 star";

        questionList["instructions"].push(instruction1);
        questionList["instructions"].push(instruction2);

        //Array of questions
        let questionArr = [];

        for (var assessIndex in questionsGroupByAssessment[assessId]) {
          var questionInnerObj =
            questionsGroupByAssessment[assessId][assessIndex];

          //Each question as an object
          let questionObj = {};

          questionObj["id"] = questionInnerObj["id"];
          questionObj["question"] = questionInnerObj["question"];
          questionObj["sentence"] = questionInnerObj["sentence"]
            ? questionInnerObj["sentence"]
            : "";
          questionObj["questionType"] = questionInnerObj["questionType"]
            ? questionInnerObj["questionType"]
            : "objective";
          questionObj["optionType"] = questionInnerObj["optionType"]
            ? questionInnerObj["optionType"]
            : "";
          questionObj["isAudioEnabled"] = questionInnerObj["isAudioEnabled"]
            ? questionInnerObj["isAudioEnabled"]
            : "";

          if (questionObj["questionType"] == "ml-b") {
            let optionKeys = Object.keys(questionInnerObj["options"]);
            let optionValues = Object.values(questionInnerObj["options"]);
            await shuffle(optionValues);
            let newOptions = {};
            for (let i = 0; i < optionKeys.length; i++) {
              newOptions[optionKeys[i]] = optionValues[i];
            }
            questionObj["options"] = newOptions;
          } else {
            questionObj["options"] = questionInnerObj["options"];
          }

          questionObj["question_image"] = questionInnerObj["question_image"]
            ? config.repositoryHost + questionInnerObj["question_image"]
            : "";

          if (!_.isEmpty(questionInnerObj["options_image"])) {
            questionInnerObj["options_image"]["a"]
              ? (questionInnerObj["options_image"]["a"] =
                  config.repositoryHost +
                  questionInnerObj["options_image"]["a"])
              : "";
            questionInnerObj["options_image"]["b"]
              ? (questionInnerObj["options_image"]["b"] =
                  config.repositoryHost +
                  questionInnerObj["options_image"]["b"])
              : "";
            questionInnerObj["options_image"]["c"]
              ? (questionInnerObj["options_image"]["c"] =
                  config.repositoryHost +
                  questionInnerObj["options_image"]["c"])
              : "";
            questionInnerObj["options_image"]["d"]
              ? (questionInnerObj["options_image"]["d"] =
                  config.repositoryHost +
                  questionInnerObj["options_image"]["d"])
              : "";
            questionObj["options_image"] = questionInnerObj["options_image"];
          } else {
            questionObj["options_image"] = {};
          }

          questionOptions = {};
          Object.keys(questionObj["options"]).forEach(function (option) {
            if (questionObj["options"][option] == "") {
              questionOptions[option] = option;
            } else {
              questionOptions[option] = questionObj["options"][option];
            }
          });
          questionObj["options"] = questionOptions;
          let correctAnswerKeys = Object.keys(
            questionInnerObj["correctAnswer"]
          );
          let correctAnswerKey = correctAnswerKeys[0];

          if (questionInnerObj["correctAnswer"][correctAnswerKey] == "") {
            questionInnerObj["correctAnswer"][correctAnswerKey] =
              correctAnswerKey;
          }
          questionObj["correctAnswer"] = questionInnerObj["correctAnswer"];

          //Push each object to an array
          questionArr.push(questionObj);

          //Push all assessments to final object
          questionList["questions"] = questionArr;
        }

        //To send only displayQuestionsCnt number of questions
        if (assessType === "PT") {
          var newQuestionArr = questionArr.slice(
            0,
            questionList["displayQuestionsCnt"]
          );
          questionList["questions"] = newQuestionArr;
        }

        //Assign final object to an array
        finalArray.push(questionList);
      }
    }

    //return final array
    return finalArray;
  } catch (e) {
    console.log(e);
  }
}

async function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

/*
This API is to save assessment results
*/
async function saveAssessmentResults(assessDetails) {
  if (!_.isEmpty(assessDetails)) {
    try {
      //To check if already test has been taken
      let testAttemptedCnt = await AssessmentStudentProgress.find({
        student: new objectId(assessDetails["studentId"]),
        assessment: new objectId(assessDetails["assessmentId"]),
      }).countDocuments();

      //If test has been taken delete exsting records from progress and answers tables
      if (testAttemptedCnt) {
        //Delete progress record
        await AssessmentStudentProgress.deleteMany({
          student: new objectId(assessDetails["studentId"]),
          assessment: new objectId(assessDetails["assessmentId"]),
        });
      }

      let studentAnswers = [];
      //If answers are there fill answers table
      if (assessDetails.questions.length) {
        let questionArr = assessDetails.questions;
        for (i = 0; i < questionArr.length; i++) {
          let studentAnswer = {};
          studentAnswer["question"] = questionArr[i]["id"];
          studentAnswer["selectedAnswer"] = questionArr[i]["enteredAnswer"];
          studentAnswer["correctAnswer"] = questionArr[i]["correctAnswer"];
          studentAnswer["type"] = assessDetails["type"];
          studentAnswers.push(studentAnswer);
        }
      }

      //Insert assessment student progess collection
      const studentAssessProgress = new AssessmentStudentProgress({
        student: assessDetails["studentId"],
        assessment: assessDetails["assessmentId"],
        state: assessDetails["stateId"],
        department: assessDetails["departmentId"],
        subject: assessDetails["subjectId"],
        correctQuestionCnt: assessDetails["correctQuesionCnt"],
        totalQuestionCnt: assessDetails["totalQuesionCnt"],
        entryType: assessDetails["entryType"],
        completionDuration: assessDetails["completionDuration"],
        countOfStar: assessDetails["countOfStar"],
        type: assessDetails["type"],
        answer: studentAnswers,
        createdBy: new objectId(assessDetails["loggedInUserID"]),
        modifiedBy: new objectId(assessDetails["loggedInUserID"]),
      });

      await studentAssessProgress.save();

      // Store reward points & check for new reward gift
      let rewardData = await savePointsAndCalculateReward(
        assessDetails["studentId"],
        assessDetails["loggedInUserID"],
        assessDetails["correctQuesionCnt"],
        "assessment"
      );

      let response = {
        status: true,
        statusCode: 200,
        reward: rewardData,
        pointsEarned: assessDetails["correctQuesionCnt"],
      };

      // If user is not found then dont share points credited back to mobile
      if (rewardData["points"] != undefined && rewardData["points"] == false)
        delete response["pointsEarned"];

      return response;
    } catch (e) {
      console.log(e);
      throw "Exception came while inserting into database";
    }
  } else {
    throw "Assessment results needs to be passed in json format";
  }
}

/*
This API is to save assessment results for PT
*/
async function saveAssessmentResultsForPT(arrAssessDetails) {
  if (arrAssessDetails.length) {
    for (i = 0; i < arrAssessDetails.length; i++) {
      var assessDetails = arrAssessDetails[i];
      if (!_.isEmpty(assessDetails)) {
        try {
          //To check if already test has been taken
          var testAttemptedCnt = await AssessmentStudentProgress.find({
            student: assessDetails["studentId"],
            assessment: assessDetails["assessmentId"],
          }).countDocuments();

          //If test has been taken delete exsting records from progress and answers tables
          if (testAttemptedCnt) {
            //Delete progress record
            await AssessmentStudentProgress.deleteMany({
              student: assessDetails["studentId"],
              assessment: assessDetails["assessmentId"],
            });
          }

          let studentAnswers = [];
          //If answers are there fill answers table
          if (assessDetails.questions.length) {
            let questionArr = assessDetails.questions;
            for (i = 0; i < questionArr.length; i++) {
              let studentAnswer = {};
              studentAnswer["question"] = questionArr[i]["id"];
              studentAnswer["selectedAnswer"] = questionArr[i]["enteredAnswer"];
              studentAnswer["correctAnswer"] = questionArr[i]["correctAnswer"];
              studentAnswer["type"] = assessDetails["type"];
              studentAnswers.push(studentAnswer);
            }
          }
          //Insert assessment student progess collection
          const studentAssessProgress = new AssessmentStudentProgress({
            student: assessDetails["studentId"],
            assessment: assessDetails["assessmentId"],
            state: assessDetails["stateId"],
            department: assessDetails["departmentId"],
            subject: assessDetails["subjectId"],
            correctQuestionCnt: assessDetails["correctQuesionCnt"],
            totalQuestionCnt: assessDetails["totalQuesionCnt"],
            entryType: assessDetails["entryType"],
            completionDuration: assessDetails["completionDuration"],
            countOfStar: assessDetails["countOfStar"],
            type: assessDetails["type"],
            answers: studentAnswers,
            createdBy: new objectId(assessDetails["loggedInUserID"]),
            modifiedBy: new objectId(assessDetails["loggedInUserID"]),
          });

          await studentAssessProgress.save();
        } catch (e) {
          throw "Exception came while inserting into database";
        }
      }
    }
  } else {
    throw "Assessment results needs to be passed in array of json objects";
  }
  return true;
}

/*
This API is to get assessments for Paper Test
*/
async function getAssessmentsForPT(userParam) {
  let query = {};
  let finalArray = [];

  const diseCode = userParam.diseCode;

  //To get active assessments based on class id
  query["isActive"] = true;
  query["published"] = true;
  query["startDate"] = { $lte: new Date() };
  query["endDate"] = { $gte: new Date() };

  query["type"] = { $in: ["PT"] };
  query["assessmentType"] = "State";

  if (Boolean(userParam.stateId)) {
    let arrState = [];
    arrState.push(userParam.stateId);
    query["states"] = { $in: arrState };
  }

  const assessments = await Assessment.find(query).sort({ chapterNumber: 1 });
  //To get all subjects for this sa module
  const Subjects = await Subjectmaster.find({ module: "sa" }).select("id name");
  //To get all classes for this sa module
  const Departments = await Departmentmaster.find({ module: "sa" }).select(
    "id name"
  );

  //To do groupby on department of assessments received
  let assessmentsGroupBySubject = _.groupBy(assessments, "subject");

  let searchMask = "";
  let regEx = new RegExp(searchMask, "ig");
  let replaceMask = "";

  //Loop through subjects
  for (let subjectId in assessmentsGroupBySubject) {
    let assessmentSubjectList = {};

    //To get subject name
    let subjectName = _.where(Subjects, { id: subjectId });

    //Assigning required subject info to a final object
    assessmentSubjectList["subjectId"] = subjectId;
    assessmentSubjectList["subjectName"] = subjectName[0]["name"];
    assessmentSubjectList["icon"] =
      config.assetHost +
      subjectName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
      ".png";
    assessmentSubjectList["icon_active"] =
      config.assetHost +
      "big-" +
      subjectName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
      ".png";

    //Group by class
    let assessmentsGroupByClass = _.groupBy(
      assessmentsGroupBySubject[subjectId],
      "department"
    );

    //To assign class objects
    let assessmentClassArr = [];

    //Loop through departments
    for (let deptId in assessmentsGroupByClass) {
      //Each class as object
      let assessmentClassList = {};

      //To get class name
      let className = _.where(Departments, { id: deptId });

      //Assigning required subject info to a final object
      assessmentClassList["classId"] = deptId;
      assessmentClassList["className"] = className[0]["name"];
      assessmentClassList["icon"] =
        config.assetHost +
        className[0]["name"].toLowerCase().replace(regEx, replaceMask) +
        ".png";
      assessmentClassList["icon_active"] =
        config.assetHost +
        "big-" +
        className[0]["name"].toLowerCase().replace(regEx, replaceMask) +
        ".png";

      //Array of assessment
      let assessArr = [];
      let arrAssessIds = [];

      //Loop through assessments
      for (let assessIndex in assessmentsGroupByClass[deptId]) {
        let assessInnerObj = assessmentsGroupByClass[deptId][assessIndex];

        let assessmentId = assessInnerObj["id"];

        //Each assessment as an object
        let assessObj = {};

        assessObj["id"] = assessmentId;
        assessObj["name"] = assessInnerObj["lesson"];
        assessObj["type"] = assessInnerObj["type"];

        //Push each object to an array
        assessArr.push(assessObj);
        arrAssessIds.push(assessmentId);
      }

      //To check if paper test is completed for this suject, class and assessment

      //To get number of students in this class
      const dbStudents = await Student.find({
        department: deptId,
        diseCode: diseCode,
        isActive: true,
      });

      let arrStudentIds = [];

      if (dbStudents && dbStudents.length) {
        dbStudents.forEach((element) => {
          let dbStudentId = new objectId(element.id);
          arrStudentIds.push(dbStudentId);
        });
      }

      let dbStudentsCnt = arrStudentIds.length;

      const completedCnt = await AssessmentStudentProgress.find({
        type: "PT",
        department: deptId,
        subject: subjectId,
        student: { $in: arrStudentIds },
        assessment: { $in: arrAssessIds },
      }).countDocuments();

      //Pending assessments count
      assessmentClassList["pendingCnt"] =
        dbStudentsCnt * assessArr.length - completedCnt;

      //Push all assessments to class object of assessments
      assessmentClassList["assessments"] = assessArr;

      //Push class info to an array
      assessmentClassArr.push(assessmentClassList);
    }

    //Sort classes array by class name
    assessmentClassArr = _.sortBy(assessmentClassArr, "className");

    //Push all classes info to classes
    assessmentSubjectList["classes"] = assessmentClassArr;

    //Assign final object to an array
    finalArray.push(assessmentSubjectList);
  }

  //return final array
  return finalArray;
}

/*
This API is to get students for the given class and disecode
*/
async function getClassStudents(userParam) {
  let students = [];
  const diseCode = userParam.diseCode;
  const classId = userParam.departmentId;
  const assessId = userParam.assessmentId;
  let arrStudentIds = [];

  const dbStudents = await Student.find({
    department: classId,
    diseCode: diseCode,
    isActive: true,
  });

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach((element) => {
      arrStudentIds.push(new objectId(element.id));
    });
  }

  //To get total number of correct answers for this assessment and student
  const progressRecords = await AssessmentStudentProgress.find({
    student: { $in: arrStudentIds },
    assessment: assessId,
    department: classId,
    type: "PT",
  }).select("student correctQuestionCnt");

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach((element) => {
      let matchingProgress = _.filter(
        progressRecords,
        (item) => String(item.student) === String(element.id)
      );
      let correctQuesionCnt = matchingProgress.length
        ? matchingProgress[0]["correctQuestionCnt"]
        : null;
      let student = {
        id: element.id,
        SRNumber: element.srnNo,
        Name: element.childName,
        diseCode: element.diseCode,
        parentName: element.parentName,
        department: element.department,
        correctQuesionCnt: correctQuesionCnt,
      };
      students.push(student);
    });
  }
  return students;
}

/*
This API is to get children for the given parent mobile and srn number
*/
async function getChildrenForParent(userParam) {
  let students = [];
  let query = {};
  const srnNo = userParam.srnNo;
  const mobile = userParam.mobile;
  const assessmentType = userParam.assessmentType;

  //To get all classes for this sa module
  const Departments = await Departmentmaster.find({ module: "sa" }).select(
    "id name"
  );
  let dbStudents;

  if (srnNo) {
    dbStudents = await Student.find({ srnNo: srnNo, isActive: true });
  } else if (mobile) {
    dbStudents = await Student.find({ parentMobile: mobile, isActive: true });
  } else if (srnNo && mobile) {
    dbStudents = await Student.find({
      srnNo: srnNo,
      parentMobile: mobile,
      isActive: true,
    });
  }

  //To get list of self or state assessment ids
  query["isActive"] = true;
  query["published"] = true;
  query["startDate"] = { $lte: new Date() };
  query["endDate"] = { $gte: new Date() };

  query["type"] = { $in: ["HT"] };

  if (Boolean(assessmentType))
    query["assessmentType"] = userParam.assessmentType;

  if (Boolean(userParam.stateId)) {
    let arrState = [];
    arrState.push(userParam.stateId);
    query["states"] = { $in: arrState };
  }
  const dbAssessments = await Assessment.find(query);

  let arrAssessIds = [];
  let arrStudentIds = [];

  if (dbAssessments && dbAssessments.length) {
    dbAssessments.forEach((element) => {
      let dbAssessId = new objectId(element.id);
      arrAssessIds.push(dbAssessId);
    });
  }

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach((element) => {
      let dbStudentId = new objectId(element.id);
      arrStudentIds.push(dbStudentId);
    });
  }

  //To get count of stars and percentage
  const progressRecords = await AssessmentStudentProgress.aggregate([
    {
      $match: {
        student: { $in: arrStudentIds },
        assessment: { $in: arrAssessIds },
        type: "HT",
      },
    },
    {
      $group: {
        _id: "$student",
        totalStars: { $sum: "$countOfStar" },
        totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
        totalQuestionCnt: { $sum: "$totalQuestionCnt" },
      },
    },
  ]);

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach((element) => {
      let studentObj = {};
      let deptId = element.department.toString();
      studentObj["id"] = element.id;
      studentObj["SRNumber"] = element.srnNo;
      studentObj["Name"] = element.childName;
      studentObj["diseCode"] = element.diseCode;
      studentObj["parentName"] = element.parentName;
      studentObj["department"] = deptId;

      //To get class name
      const className = _.where(Departments, { id: deptId });

      studentObj["className"] = className[0]["name"];
      const matchingProgress = _.filter(
        progressRecords,
        (item) => String(item._id) === String(studentId)
      );
      if (matchingProgress.length) {
        const calcPercentage =
          (matchingProgress[0]["totalCorrectQuestionCnt"] /
            matchingProgress[0]["totalQuestionCnt"]) *
          100;
        studentObj["totalPercentage"] = Number(calcPercentage.toFixed(2));
        studentObj["totalCorrectQuestionCnt"] =
          matchingProgress[0]["totalCorrectQuestionCnt"];
        studentObj["totalQuestionCnt"] =
          matchingProgress[0]["totalQuestionCnt"];
        studentObj["totalStars"] = matchingProgress[0]["totalStars"];
      } else {
        studentObj["totalPercentage"] = 0;
        studentObj["totalCorrectQuestionCnt"] = 0;
        studentObj["totalQuestionCnt"] = 0;
        studentObj["totalStars"] = 0;
      }
      students.push(studentObj);
    });
  }
  return students;
}

/*
This API is to get students wise reward details
*/
async function getRewardDetails(userParam) {
  try {
    let response = {};
    const userId = userParam.user;
    if (userId == null || userId == undefined) throw new Error("Invalid input");

    let rewardList = await Reward.find({
      user: userId,
      isActive: true,
    }).populate("videoStory");

    if (rewardList.length > 0) {
      rewardList.forEach((item) => {
        if (item["videoStory"] != null)
          item["videoStory"]["thumbnail"] =
            config.repositoryHost + item["videoStory"]["thumbnail"];
      });
    }

    let userPoints = await User.findById(userId).select("totalPointsEarned");

    response["rewards"] = rewardList;
    if (userPoints)
      response["totalPointsEarned"] = userPoints["totalPointsEarned"];
    else response["totalPointsEarned"] = 0;
    response["status"] = true;
    response["statusCode"] = 200;

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/*
This API is to get Sampark Smart Shala assessment
*/
async function getSSSAssessment(userparam) {
  let defer = require("q").defer();
  try {
    if (
      userparam.assessmentId == undefined ||
      userparam.assessmentId == null ||
      userparam.assessmentId == ""
    )
      throw "Invalid input";
    //Split them into array
    let arrAssessmentIds = [userparam.assessmentId];

    let query = {};
    let finalArray = [];

    //To get active assessments based on class id
    query["isActive"] = true;

    query["assessment"] = { $in: arrAssessmentIds };

    const assessmentQuestions = await AssessmentQuestion.find(query);

    let queryAssess = {};

    //To get active assessments based on class id
    queryAssess["isActive"] = true;

    const Assessments = await Assessment.find(queryAssess);

    //To do groupby on department of assessments received
    let questionsGroupByAssessment = _.groupBy(
      assessmentQuestions,
      "assessment"
    );
    //Loop through objects
    for (const assessId in questionsGroupByAssessment) {
      let questionList = {};

      //Assigning required class info to a final object
      questionList["id"] = assessId;

      //To get assessment details
      let assessmentName = _.where(Assessments, { id: assessId });

      questionList["name"] = assessmentName[0]["lesson"];
      questionList["level"] = assessmentName[0]["level"];
      let level = assessmentName[0]["level"];
      questionList["timeLimit"] = assessmentName[0]["duration"];

      requiredCnt =
        questionsGroupByAssessment[assessId].length >= 21
          ? 21
          : questionsGroupByAssessment[assessId].length;
      questionList["displayQuestionsCnt"] = requiredCnt - 1;

      questionList["instructions"] = {};
      questionList["instructions"]["rules"] = [];
      questionList["instructions"]["point_system"] = [];

      let maxMarks = assessmentName[0]["maxMarks"]
        ? assessmentName[0]["maxMarks"]
        : assessmentName[0]["displayQuestionsCnt"];
      let perQuestionPoint = (
        parseFloat(maxMarks) / parseFloat(questionList["displayQuestionsCnt"])
      ).toFixed(1);
      let rule1 =
        "You have to score over 80% to complete this module successfully.";
      let rule2 = "You will get 3 Lifelines.";
      let rule3 =
        "Maximum time taken should be " +
        assessmentName[0]["duration"] +
        " minutes.";
      let point1 = "+" + perQuestionPoint + " for each correct answer.";
      let point2 = "Each unused Lifelines earn you  5 points.";
      let point3 =
        "If you complete the quiz within stipulated time, you  earn 5 points.";

      questionList["instructions"]["rules"].push(rule1);
      questionList["instructions"]["rules"].push(rule2);
      questionList["instructions"]["rules"].push(rule3);
      questionList["instructions"]["point_system"].push(point1);
      questionList["instructions"]["point_system"].push(point2);
      questionList["instructions"]["point_system"].push(point3);

      //Array of questions
      let questionArr = [];

      for (const assessIndex in questionsGroupByAssessment[assessId]) {
        let questionInnerObj =
          questionsGroupByAssessment[assessId][assessIndex];

        //Each question as an object
        let questionObj = {};

        questionObj["id"] = questionInnerObj["id"];
        questionObj["question"] = questionInnerObj["question"];
        questionObj["sentence"] = questionInnerObj["sentence"]
          ? questionInnerObj["sentence"]
          : "";
        questionObj["questionType"] = questionInnerObj["questionType"]
          ? questionInnerObj["questionType"]
          : "objective";
        questionObj["optionType"] = questionInnerObj["optionType"]
          ? questionInnerObj["optionType"]
          : "";
        questionObj["isAudioEnabled"] = questionInnerObj["isAudioEnabled"]
          ? questionInnerObj["isAudioEnabled"]
          : "";
        if (
          questionInnerObj["questionType"] == "fbtt" ||
          questionInnerObj["questionType"] == "dd1"
        ) {
          if (questionInnerObj["options"]) {
            let options = Object.values(questionInnerObj["options"]);
            let correctAnswers = Object.values(
              questionInnerObj["correctAnswer"]
            );
            let finalOptions = options.concat(correctAnswers);
            finalOptions = finalOptions.filter(function (elem, pos) {
              return finalOptions.indexOf(elem) == pos;
            });
            let questionOptions = {};
            for (var i = 0; i < finalOptions.length; i++) {
              questionOptions[i] = finalOptions[i];
            }
            questionObj["options"] = questionOptions;
          } else {
            let finalOptions = Object.values(questionInnerObj["correctAnswer"]);
            finalOptions = finalOptions.filter(function (elem, pos) {
              return finalOptions.indexOf(elem) == pos;
            });
            let questionOptions = {};
            for (var i = 0; i < finalOptions.length; i++) {
              questionOptions[i] = finalOptions[i];
            }
            questionObj["options"] = questionOptions;
          }
        } else if (
          questionInnerObj["questionType"] == "dd2" &&
          questionInnerObj["optionType"] == "text"
        ) {
          keys = Object.keys(questionInnerObj["options"]);
          questionInnerObj["options"][keys[0]] = JSON.parse(
            questionInnerObj["options"][keys[0]]
          );
          questionInnerObj["options"][keys[1]] = JSON.parse(
            questionInnerObj["options"][keys[1]]
          );

          keys = Object.keys(questionInnerObj["correctAnswer"]);
          questionInnerObj["correctAnswer"][keys[0]] = JSON.parse(
            questionInnerObj["correctAnswer"][keys[0]]
          );
          questionInnerObj["correctAnswer"][keys[1]] = JSON.parse(
            questionInnerObj["correctAnswer"][keys[1]]
          );
          questionObj["options"] = questionInnerObj["options"];
        } else if (
          questionInnerObj["questionType"] == "dd2" &&
          questionInnerObj["optionType"] == "image"
        ) {
          keys = Object.keys(questionInnerObj["options"]);
          let values_0 = Object.values(questionInnerObj["options"][keys[0]]);
          let values_1 = Object.values(questionInnerObj["options"][keys[1]]);
          for (let v in values_0) {
            values_0[v] = config.repositoryHost + values_0[v];
          }
          for (let v in values_1) {
            values_1[v] = config.repositoryHost + values_1[v];
          }
          questionInnerObj["options"][keys[0]] = values_0;
          questionInnerObj["options"][keys[1]] = values_1;

          keys = Object.keys(questionInnerObj["correctAnswer"]);
          values_0 = Object.values(questionInnerObj["correctAnswer"][keys[0]]);
          values_1 = Object.values(questionInnerObj["correctAnswer"][keys[1]]);
          for (let v in values_0) {
            values_0[v] = config.repositoryHost + values_0[v];
          }
          for (let v in values_1) {
            values_1[v] = config.repositoryHost + values_1[v];
          }
          questionInnerObj["correctAnswer"][keys[0]] = values_0;
          questionInnerObj["correctAnswer"][keys[1]] = values_1;
          questionObj["options"] = questionInnerObj["options"];
        } else {
          questionObj["options"] = questionInnerObj["options"];
        }
        questionObj["question_image"] = questionInnerObj["question_image"]
          ? config.repositoryHost + questionInnerObj["question_image"]
          : "";

        if (!_.isEmpty(questionInnerObj["options_image"])) {
          questionInnerObj["options_image"]["a"]
            ? (questionInnerObj["options_image"]["a"] =
                config.repositoryHost + questionInnerObj["options_image"]["a"])
            : "";
          questionInnerObj["options_image"]["b"]
            ? (questionInnerObj["options_image"]["b"] =
                config.repositoryHost + questionInnerObj["options_image"]["b"])
            : "";
          questionInnerObj["options_image"]["c"]
            ? (questionInnerObj["options_image"]["c"] =
                config.repositoryHost + questionInnerObj["options_image"]["c"])
            : "";
          questionInnerObj["options_image"]["d"]
            ? (questionInnerObj["options_image"]["d"] =
                config.repositoryHost + questionInnerObj["options_image"]["d"])
            : "";
          questionObj["options_image"] = questionInnerObj["options_image"];
        } else {
          questionObj["options_image"] = {};
        }

        questionOptions = {};
        Object.keys(questionObj["options"]).forEach(function (option) {
          if (questionObj["options"][option] == "") {
            questionOptions[option] = option;
          } else {
            questionOptions[option] = questionObj["options"][option];
          }
        });
        questionObj["options"] = questionOptions;
        let correctAnswerKeys = Object.keys(questionInnerObj["correctAnswer"]);
        let correctAnswerKey = correctAnswerKeys[0];

        if (questionInnerObj["correctAnswer"][correctAnswerKey] == "") {
          questionInnerObj["correctAnswer"][correctAnswerKey] =
            correctAnswerKey;
        }
        questionObj["correctAnswer"] = questionInnerObj["correctAnswer"];

        //Push each object to an array
        questionArr.push(questionObj);

        //Push all assessments to final object
        questionList["questions"] = questionArr;
      }

      //Assign final object to an array
      finalArray.push(questionList);
    }

    defer.resolve(finalArray);
  } catch (e) {
    console.log(e);
    defer.reject(e);
  }
  return defer.promise;
}

/*
This API is to save status that reward is opened
*/
async function rewardOpened(req) {
  try {
    if (req && req.rewardId && req.rewardId !== "") {
      await Reward.updateOne({ _id: req.rewardId }, { $set: { opened: true } });
      return true;
    } else throw "Please send valid input";
  } catch (error) {
    console.log(error);
    throw "Getting error. Please try after some time.";
  }
}

/*
This API is to get classes by the given disecode
*/
async function getClasses(userParam) {
  let query = {};
  let finalArray = [];

  //To get active students based on disecode
  query["isActive"] = true;
  query["diseCode"] = userParam.disecode;

  const students = await Student.find(query).select("id childName department");

  //To get all classes for this sa module
  const departments = await Departmentmaster.find({ module: "sa" }).select(
    "id name"
  );

  //To do groupby on department of students received
  let studentsGroupByClass = _.groupBy(students, "department");

  //Loop through objects
  for (let deptId in studentsGroupByClass) {
    let classList = {};
    let searchMask = " ";
    let regEx = new RegExp(searchMask, "ig");
    let replaceMask = "";

    //To get class name
    let deptName = _.where(departments, { id: deptId });

    if (deptName[0]) {
      //Assigning required class info to a final object
      classList["id"] = deptId;
      classList["className"] = deptName[0]["name"];
      classList["icon"] =
        config.assetHost +
        deptName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
        ".png";
      classList["icon_active"] =
        config.assetHost +
        "big-" +
        deptName[0]["name"].toLowerCase().replace(regEx, replaceMask) +
        ".png";
      classList["studentsCnt"] = studentsGroupByClass[deptId].length;

      //Assign object to final array
      finalArray.push(classList);
    }
  }

  //Sort final array by class name
  finalArray = _.sortBy(finalArray, "className");

  //return final array
  return finalArray;
}

/*
This API is to get students by the given class and disecode
*/
async function getStudents(userParam) {
  let query = {};
  let queryAssess = {};
  let finalArray = [];

  //To get active students based on class and disecode
  query["isActive"] = true;
  query["diseCode"] = userParam.disecode;
  query["department"] = userParam.department;

  //To get assessments for logged in teachers state
  queryAssess["isActive"] = true;
  queryAssess["published"] = true;
  queryAssess["startDate"] = { $lte: new Date() };
  queryAssess["endDate"] = { $gte: new Date() };

  queryAssess["type"] = { $in: ["MT"] };
  queryAssess["assessmentType"] = "State";

  if (Boolean(userParam.stateId)) {
    let arrState = [];
    arrState.push(userParam.stateId);
    queryAssess["states"] = { $in: arrState };
  } else {
    //Get state Id based on disecode
    const checkSchool = await School.findOne({ diseCode: userParam.disecode });
    if (checkSchool) {
      diseStateId = checkSchool.state.toString();
      let arrState = [];
      arrState.push(diseStateId);
      queryAssess["states"] = { $in: arrState };
    }
  }

  //To get total assessments count for this class
  queryAssess["department"] = userParam.department;

  const dbStudents = await Student.find(query).select(
    "id childName department"
  );

  const dbAssessments = await Assessment.find(queryAssess).select("id");

  let arrAssessIds = [];

  if (dbAssessments && dbAssessments.length) {
    dbAssessments.forEach((element) => {
      let dbAssessId = new objectId(element.id);
      arrAssessIds.push(dbAssessId);
    });
  }

  const totalTestCnt = arrAssessIds.length;

  let arrStudentIds = [];

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach((element) => {
      let dbStudentId = new objectId(element.id);
      arrStudentIds.push(dbStudentId);
    });
  }

  //To get count of tests attempted for all students
  const progressRecords = await AssessmentStudentProgress.aggregate([
    {
      $match: {
        student: { $in: arrStudentIds },
        department: new objectId(userParam.department),
        assessment: { $in: arrAssessIds },
      },
    },
    {
      $group: {
        _id: "$student",
        testAttemptedCnt: { $sum: 1 },
      },
    },
  ]);

  //For all students get the required details
  if (dbStudents && dbStudents.length) {
    dbStudents.forEach((element) => {
      let studentObj = {};

      studentObj["id"] = element.id;
      studentObj["name"] = element.childName;

      var matchingProgress = _.filter(
        progressRecords,
        (item) => String(item._id) === String(element.id)
      );

      studentObj["test_attempted"] = matchingProgress.length
        ? matchingProgress[0]["testAttemptedCnt"]
        : 0;
      studentObj["test_pending"] = totalTestCnt - studentObj["test_attempted"];

      //Push each object to final array
      finalArray.push(studentObj);
    });
  }

  //return final array
  return finalArray;
}
