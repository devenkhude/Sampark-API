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
  try {
    let query = {};
    let queryAssess = {};
    let finalArray = [];
  
    const forReport = userParam?.forReport;
  
    //To get active students based on disecode
    query['isActive'] = true;
    query['diseCode'] = userParam?.disecode;
  
    //To get assessments for logged in teachers state
    queryAssess['isActive'] = true;
    queryAssess['published'] = true;
    queryAssess['startDate'] = { $lte: new Date() };
    queryAssess['endDate'] = { $gte: new Date() };
  
    queryAssess['type'] = { '$in': ['MT'] };
    queryAssess['assessmentType'] = 'State';
  
    if (Boolean(userParam.stateId)) {
      let arrState = [];
      arrState.push(userParam.stateId);
      queryAssess['states'] = { '$in': arrState };
    } else {
      //Get state Id based on disecode
      const checkSchool = await School.findOne({ "diseCode": userParam.disecode });
      if (checkSchool) {
        let diseStateId = checkSchool?.state?.toString();
        let arrState = [];
        arrState.push(diseStateId);
        queryAssess['states'] = { '$in': arrState };
      }
    }
    console.log("Query: ", queryAssess, "getClassesAndStudents");
    const students = await Student.find(query).select('id childName department');
    console.log("Students: ", students, "getClassesAndStudents");
    //To get all claases for this sa module
    const departments = await Departmentmaster.find({ module: 'sa' }).select('id name');
    console.log("Departments: ", departments, "getClassesAndStudents");
    //To do groupby on department of students received
    const studentsGroupByClass = _.groupBy(students, 'department');
  
    //return studentsGroupByClass;
  
    //Loop through objects
    for (let deptId in studentsGroupByClass) {
      let classList = {};
      const searchMask = ' ';
      const regEx = new RegExp(searchMask, 'ig');
      const replaceMask = '';
  
      //To get class name
      const deptName = _.where(departments, { id: deptId });
  
      //Assigning required class info to a final object
      classList['id'] = deptId;
      classList['className'] = deptName[0]['name'];
      classList['icon'] = config.assetHost + deptName[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';
      classList['icon_active'] = config.assetHost + 'big-' + deptName[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';
  
      //To get total assessments count for this class
      queryAssess['department'] = deptId;
  
      const dbAssessments = await Assessment.find(queryAssess).select('id');
      console.log("Assessments: ", dbAssessments, "getClassesAndStudents");
  
      let arrAssessIds = [];
  
      if (dbAssessments && dbAssessments.length) {
        dbAssessments.forEach(element => {
          let dbAssessId = new objectId(element.id);
          arrAssessIds.push(dbAssessId);
        });
      }
  
      const totalTestCnt = arrAssessIds.length;
      classList['total_test_count'] = totalTestCnt;
  
      //Array of students and ids
      let studentsArr = [];
      let arrStudentIds = [];
  
      for (let studentIndex in studentsGroupByClass[deptId]) {
        let studentInnerObj = studentsGroupByClass[deptId][studentIndex];
        let dbStudentId = new objectId(studentInnerObj['id']);
        arrStudentIds.push(dbStudentId);
      }
  
      //To get count of tests attempted, stars and percentage for all students
      const progressRecords = await AssessmentStudentProgress.aggregate([
        {
          $match: {
            student: { $in: arrStudentIds },
            department: new objectId(deptId),
            assessment: { $in: arrAssessIds }
          }
        },
        {
          $group: {
            _id: "$student",
            testAttemptedCnt: { $sum: 1 },
            totalStars: { $sum: "$countOfStar" },
            totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
            totalQuestionCnt: { $sum: "$totalQuestionCnt" },
          }
        }]);

        console.log("Progress Records: ", progressRecords, "getClassesAndStudents");
  
      //For all students get the required details
      for (let studentIndex in studentsGroupByClass[deptId]) {
        let studentInnerObj = studentsGroupByClass[deptId][studentIndex];
  
        //Each student as an object
        let studentObj = {};
  
        studentObj['id'] = studentInnerObj['id'];
        studentObj['name'] = studentInnerObj['childName'];
  
        let matchingProgress = _.filter(progressRecords, item => String(item._id) === String(studentInnerObj['id']));
  
        studentObj['test_attempted'] = matchingProgress.length ? matchingProgress[0]['testAttemptedCnt'] : 0;
        studentObj['test_pending'] = totalTestCnt - studentObj['test_attempted'];
  
        //If its for childwise report get percentage and count of stars
        if (forReport) {
          if (matchingProgress.length) {
            let calcPercentage = (matchingProgress[0]['totalCorrectQuestionCnt'] / matchingProgress[0]['totalQuestionCnt']) * 100
            studentObj['totalPercentage'] = Number(calcPercentage.toFixed(2));
            studentObj['totalStars'] = matchingProgress[0]['totalStars'];
          } else {
            studentObj['totalPercentage'] = null;
            studentObj['totalStars'] = null;
          }
        }
  
        //Push each object to an array
        studentsArr.push(studentObj);
      }
  
      //Push all students to final object
      classList['students'] = studentsArr;
  
      //Assign final object to an array
      finalArray.push(classList);
    }
  
    //Sort final array by class name
    finalArray = _.sortBy(finalArray, 'className');
    console.log("Final Array: ", finalArray, "getClassesAndStudents");
    //return final array
    return finalArray;
  } catch (error) {
    console.log("Error in: ", error, "getClassesAndStudents");
    throw error;
  }
}

async function getAssessmentClass(req) {
  try {
    const departments = await Departmentmaster.find({ module: "sa" });
    console.log("Departments: ", departments, "getAssessmentClass");
    if (departments && departments?.length) {
      const departmentList = departments.map((element) => ({
        icon:
          (config?.assetHost || "") +
          element?.name?.toLowerCase().replace(/\s/gi, "") +
          ".png",
        icon_active:
          (config?.assetHost || "") +
          "big-" +
          element?.name?.toLowerCase().replace(/\s/gi, "") +
          ".png",
        id: element?.id,
        module: element?.module,
        name: element?.name,
      }));
      console.log("Department List: ", departmentList, "getAssessmentClass");
      return departmentList;
    } else {
      return [];
    }
  } catch (error) {
    console.log("Error in: ", error, "getAssessmentClass");
  }
}

async function registerStudent(req) {
  try {
    if (req) {
      if (req?.diseCode && req?.diseCode !== "") {
        //To check if diseCode exists in db
        const diseCodeCnt = await School.find({
          diseCode: req?.diseCode,
        }).countDocuments();
  
        if (!diseCodeCnt) {
          throw "Dise Code does not exists in database";
        }
      }
  
      try {
        const studentDetail = req;
        // only available disecode can be inserted in the db
        const student = new Student({
          parentMobile: studentDetail?.parentMobile,
          srnNo: studentDetail?.SRNumber,
          childName: studentDetail?.name,
          parentName: studentDetail?.parentName,
          diseCode: studentDetail?.diseCode,
          department: new objectId(studentDetail?.department),
          isActive: true,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createdBy: new objectId(studentDetail?.createdBy),
          modifiedBy: new objectId(studentDetail?.createdBy),
        });
        console.log("Student: ", student, "student");
        await student.save();
        return true;
      } catch (e) {
        console.log("Error in: ", e, "registerStudent");    
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    console.log("Error in: ", error, "registerStudent");
  }
}

/*
This API is to get assessments by class for the selected student
*/
async function getAssessments(userParam) {
  try {
    let query = {
      isActive: true,
      published: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    };
  
    if (
      userParam?.userType === "govt teacher" ||
      userParam?.userType === "teacher"
    ) {
      query.type = { $in: ["MT"] };
      query.assessmentType = "State";
    } else {
      query.type = { $in: ["HT"] };
      query.assessmentType = "State";
    }
  
    if (userParam?.stateId) {
      query.states = { $in: ["all", userParam.stateId] };
    }
  
    query.department = userParam?.classId;
    console.log("Get Assessments Query: ", query, "getAssessments");
    let assessments = await Assessment.find(query).sort({ chapterNumber: 1 });
  
    console.log("Assessments: ", assessments, "getAssessments");
  
    if (assessments.length === 0) {
      query.assessmentType = "Self";
      assessments = await Assessment.find(query).sort({ chapterNumber: 1 });
      console.log("Assessments: ", assessments, "getAssessments");
    }
  
    const Subjects = await Subjectmaster.find({ module: "sa" }).select("id name");
    console.log("Subjects: ", Subjects, "getAssessments");
    const assessmentsGroupByClass = _.groupBy(assessments, "subject");
  
    let finalArray = [];
  
    for (let subjectId in assessmentsGroupByClass) {
      let assessmentList = {};
      let subjectName = Subjects.find((subject) => subject.id === subjectId);
  
      assessmentList.id = subjectId;
      assessmentList.subjectName = subjectName?.name || "";
      assessmentList.icon =
        config?.assetHost +
        (subjectName?.name || "")?.toLowerCase().replace(/\s/gi, "") +
        ".png";
      assessmentList.icon_active =
        config?.assetHost +
        "big-" +
        (subjectName?.name || "")?.toLowerCase().replace(/\s/gi, "") +
        ".png";
  
      let assessArr = [];
      let arrAssessIds = assessmentsGroupByClass[subjectId].map(
        (assessInnerObj) => assessInnerObj?.id
      );
  
      const progressRecords = await AssessmentStudentProgress.find({
        department: userParam.classId,
        subject: subjectId,
        student: userParam.studentId,
        assessment: { $in: arrAssessIds },
      }).select(
        "assessment correctQuestionCnt totalQuestionCnt countOfStar type"
      );

      console.log("Progress Records: ", progressRecords, "getAssessments");
  
      for (let assessInnerObj of assessmentsGroupByClass[subjectId]) {
        let assessObj = {
          id: assessInnerObj?.id,
          name: assessInnerObj?.lesson,
          type: assessInnerObj?.type,
          suggestedVideos: [],
          report: {},
        };
  
        if (assessInnerObj?.suggestedVideos?.length > 0) {
          let suggestedVideosList = await Video.find({
            _id: { $in: assessInnerObj?.suggestedVideos },
          });
  
          assessObj.suggestedVideos = suggestedVideosList.map(
            (suggestedVideoObject) => ({
              name: suggestedVideoObject?.name,
              video_code: suggestedVideoObject?.video_code,
              url: suggestedVideoObject?.url,
              description: suggestedVideoObject?.description,
              thumbnail: config?.repositoryHost + suggestedVideoObject?.thumbnail,
              height: suggestedVideoObject?.height,
              width: suggestedVideoObject?.width,
            })
          );
        }
        console.log("Assessments Object: ", assessObj, "getAssessments");
  
        let matchingProgress = progressRecords.filter(
          (item) => String(item.assessment) === String(assessInnerObj.id)
        );
  
        if (matchingProgress.length) {
          let calcPercentage =
            (matchingProgress[0].correctQuestionCnt /
              matchingProgress[0].totalQuestionCnt) *
            100;
          assessObj.report.calculatedPercentage = Number(
            calcPercentage.toFixed(2)
          );
          assessObj.report.correctQuestionCnt =
            matchingProgress[0].correctQuestionCnt;
          assessObj.report.totalQuestionCnt =
            matchingProgress[0].totalQuestionCnt;
          assessObj.report.countOfStar = matchingProgress[0].countOfStar;
          assessObj.report.type = matchingProgress[0].type;
          assessObj.report.attemptedCnt = 1;
        }
  
        assessObj.studentAnswers = [
          { question: "Q1", selectedAnswer: "A", correctAnswer: "A" },
        ];
  
        assessArr.push(assessObj);
      }
  
      assessmentList.assessments = assessArr;
      finalArray.push(assessmentList);
    }
  
    if (userParam.forReport && assessments.length) {
      finalArray.push({
        subjectName: "All Subject",
        icon: config.assetHost + "allsubject.png",
        icon_active: config.assetHost + "big-allsubject.png",
      });
    }
  
    console.log("Get Assessments final array: ", finalArray, "getAssessments");
  
    return finalArray;
  } catch (error) {
    console.log("Error in: ", error, "getAssessments");
  }
}

/*
This API is to get questionwise report for the selected student and assessment
*/
async function getQuesionwiseReport(userParam) {
  try {
    const studentId = userParam?.studentId;
    const assessmentId = userParam?.assessmentId;
  
    const studentAnswers = await AssessmentStudentProgress.find({
      student: studentId,
      assessment: assessmentId,
    }).select("answers");
    console.log("Student Answers: ", studentAnswers, "getQuesionwiseReport");
    const finalArray = studentAnswers.map((answer, index) => ({
      question: `Q${index + 1}`,
      selectedAnswer: answer?.selectedAnswer,
      correctAnswer: answer?.correctAnswer,
    }));
    console.log("Get final array: ", finalArray, "getQuesionwiseReport");
  
    return finalArray;
  } catch (error) {
    console.log("Error in: ", error, "getQuesionwiseReport");
  }
}

/*
This API is to get questions by assessment ids
*/
async function getQuestions(userParam) {
  try {
    const assessmentIds = userParam?.assessmentIds?.split(",");
    const arrAssessmentIds = assessmentIds.map(id => id.trim());
    console.log("Array Assessment ID's: ", arrAssessmentIds, "getQuestions");
    const query = {
      isActive: true,
      assessment: { $in: arrAssessmentIds }
    };
    console.log("Query: ", query, "getQuestions");
    const assessmentQuestions = await AssessmentQuestion.find(query);
    console.log("Assessments Questions: ", assessmentQuestions, "getQuestions");
  
    const queryAssess = {
      isActive: true,
      department: userParam?.classId
    };
  
    const Assessments = await Assessment.find(queryAssess);
  
    const questionsGroupByAssessment = _.groupBy(assessmentQuestions, "assessment");
  
    const finalArray = [];
  
    for (const assessId in questionsGroupByAssessment) {
      const questionList = {};
      questionList.id = assessId;
  
      const assessmentName = _.find(Assessments, { id: assessId });
  
      if (assessmentName) {
        questionList.name = assessmentName?.lesson;
        questionList.level = assessmentName?.level;
        questionList.timeLimit = assessmentName?.duration;
  
        const level = assessmentName?.level;
  
        const requiredCnt = Math.min(questionsGroupByAssessment[assessId].length, 21);
        questionList.displayQuestionsCnt = requiredCnt - 1;
  
        questionList.instructions = [
          `You will get total ${assessmentName.duration} minutes to finish the test; if you finish in ${level.Difficult} minutes (Difficult), you will get 3 stars, in ${level.Moderate} mins (Moderate) you will get 2 stars and above ${level.Easy} mins you will get 1 star`,
          "For each assessment, you will get 3 lifelines from Sampark Didi to help you in the test; if you don’t use the lifelines you will get 1 star"
        ];
  
        const questionArr = [];
  
        for (const questionInnerObj of questionsGroupByAssessment[assessId]) {
          const questionObj = {
            id: questionInnerObj?.id,
            question: questionInnerObj?.question,
            sentence: questionInnerObj?.sentence || "",
            questionType: questionInnerObj?.questionType || "objective",
            optionType: questionInnerObj?.optionType || "",
            isAudioEnabled: questionInnerObj?.isAudioEnabled || "",
            options: questionInnerObj?.options,
            question_image: questionInnerObj?.question_image
              ? config.repositoryHost + questionInnerObj?.question_image
              : "",
            options_image: _.mapValues(questionInnerObj?.options_image || {}, img =>
              img ? config?.repositoryHost + img : ""
            ),
            correctAnswer: questionInnerObj?.correctAnswer
          };
  
          if (questionObj.questionType === "ml-b") {
            const optionValues = _.shuffle(Object.values(questionInnerObj.options));
            const newOptions = _.zipObject(Object.keys(questionInnerObj.options), optionValues);
            questionObj.options = newOptions;
          }
  
          questionArr.push(questionObj);
        }
        console.log("Questions Array: ", questionArr, "getQuestions");
        if (userParam?.type === "PT") {
          questionList.questions = questionArr.slice(0, questionList.displayQuestionsCnt);
        } else {
          questionList.questions = questionArr;
        }
  
        finalArray.push(questionList);
      }
    }
    console.log("Final Array: ", finalArray, "getQuestions");
    return finalArray;
  } catch (e) {
    console.log("Error in: ", e, "getQuestions");
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
  try {
    const query = {
      isActive: true,
      published: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      type: { $in: ["PT"] },
      assessmentType: "State",
    };
    
    if (userParam?.stateId) {
      query.states = { $in: ["all", userParam?.stateId] };
    }

    console.log("Query: ", query, "getAssessmentsForPT");
  
    const assessments = await Assessment.find(query).sort({ chapterNumber: 1 });
    console.log("Assessments: ", assessments, "getAssessmentsForPT");
  
    const Subjects = await Subjectmaster.find({ module: "sa" }).select("id name");
    console.log("Subject: ", Subjects, "getAssessmentsForPT");
    const Departments = await Departmentmaster.find({ module: "sa" }).select(
      "id name"
    );
    console.log("Departments: ", Departments, "getAssessmentsForPT");
    const regEx = new RegExp("", "ig");
    const replaceMask = "";
  
    const finalArray = [];
  
    for (let subjectId in _.groupBy(assessments, "subject")) {
      const assessmentSubjectList = {};
      const subjectName = _.find(Subjects, { id: subjectId });
  
      assessmentSubjectList.subjectId = subjectId;
      assessmentSubjectList.subjectName = subjectName?.name || "";
      assessmentSubjectList.icon =
        config?.assetHost +
        (subjectName?.name || "").toLowerCase().replace(regEx, replaceMask) +
        ".png";
      assessmentSubjectList.icon_active =
        config?.assetHost +
        "big-" +
        (subjectName?.name || "").toLowerCase().replace(regEx, replaceMask) +
        ".png";
  
      const assessmentsGroupByClass = _.groupBy(
        assessments.filter((assess) => assess?.subject === subjectId),
        "department"
      );
  
      const assessmentClassArr = [];
  
      for (let deptId in assessmentsGroupByClass) {
        const assessmentClassList = {};
        const className = _.find(Departments, { id: deptId });
  
        assessmentClassList.classId = deptId;
        assessmentClassList.className = className?.name || "";
        assessmentClassList.icon =
          config?.assetHost +
          (className?.name || "").toLowerCase().replace(regEx, replaceMask) +
          ".png";
        assessmentClassList.icon_active =
          config?.assetHost +
          "big-" +
          (className?.name || "").toLowerCase().replace(regEx, replaceMask) +
          ".png";
  
        const assessArr = assessmentsGroupByClass[deptId].map(
          (assessInnerObj) => ({
            id: assessInnerObj?.id,
            name: assessInnerObj?.lesson,
            type: assessInnerObj?.type,
          })
        );
  
        const arrAssessIds = assessArr.map((assessObj) => assessObj?.id);
  
        const dbStudents = await Student.find({
          department: deptId,
          diseCode: userParam?.diseCode,
          isActive: true,
        });
  
        const arrStudentIds = dbStudents.map(
          (element) => new objectId(element?.id)
        );
  
        const dbStudentsCnt = arrStudentIds?.length;
  
        const completedCnt = await AssessmentStudentProgress.find({
          type: "PT",
          department: deptId,
          subject: subjectId,
          student: { $in: arrStudentIds },
          assessment: { $in: arrAssessIds },
        }).countDocuments();
  
        assessmentClassList.pendingCnt =
          dbStudentsCnt * assessArr.length - completedCnt;
        assessmentClassList.assessments = assessArr;
  
        assessmentClassArr.push(assessmentClassList);
      }
  
      assessmentClassArr.sort((a, b) => a.className.localeCompare(b.className));
  
      assessmentSubjectList.classes = assessmentClassArr;
      finalArray.push(assessmentSubjectList);
    }
    console.log("Final Array: ", finalArray, "getAssessmentsForPT");
    return finalArray;
  } catch (error) {
    console.log("Error in: ", error, "getAssessmentsForPT");
  }
}

/*
This API is to get students for the given class and disecode
*/
async function getClassStudents(userParam) {
  try {
    const diseCode = userParam?.diseCode;
    const classId = userParam?.departmentId;
    const assessId = userParam?.assessmentId;
  
    const dbStudents = await Student.find({
      department: classId,
      diseCode: diseCode,
      isActive: true,
    });
  
    console.log("DB Students: ", dbStudents, "getClassStudents");
    const arrStudentIds = dbStudents.map((element) => new objectId(element?.id));
  
    const progressRecords = await AssessmentStudentProgress.find({
      student: { $in: arrStudentIds },
      assessment: assessId,
      department: classId,
      type: "PT",
    }).select("student correctQuestionCnt");
    console.log("Progress Records: ", progressRecords, "getClassStudents");
  
    const students = dbStudents.map((element) => {
      const matchingProgress = progressRecords.find(
        (item) => String(item.student) === String(element.id)
      );
      const correctQuestionCnt = matchingProgress
        ? matchingProgress?.correctQuestionCnt
        : null;
  
      return {
        id: element?.id,
        SRNumber: element?.srnNo,
        Name: element?.childName,
        diseCode: element?.diseCode,
        parentName: element?.parentName,
        department: element?.department,
        correctQuestionCnt: correctQuestionCnt,
      };
    });
    console.log("Students: ", students, "getClassStudents")
    return students;
  } catch (error) {
    console.log("Error in: ", error, "getClassStudents");
  }
}

/*
This API is to get children for the given parent mobile and srn number
*/
async function getChildrenForParent(userParam) {
  try {
    const students = [];
    const query = {};
    const srnNo = userParam?.srnNo;
    const mobile = userParam?.mobile;
    const assessmentType = userParam?.assessmentType;
  
    const Departments = await Departmentmaster.find({ module: "sa" }).select(
      "id name"
    );

    console.log("Departments: ", Departments, "getChildrenForParent");
  
    let dbStudents;
  
    if (srnNo) {
      dbStudents = await Student.find({ srnNo, isActive: true });
    } else if (mobile) {
      dbStudents = await Student.find({ parentMobile: mobile, isActive: true });
    } else if (srnNo && mobile) {
      dbStudents = await Student.find({
        srnNo,
        parentMobile: mobile,
        isActive: true,
      });
    }

    console.log("DB Students: ", dbStudents, "getChildrenForParent");
  
    query.isActive = true;
    query.published = true;
    query.startDate = { $lte: new Date() };
    query.endDate = { $gte: new Date() };
    query.type = { $in: ["HT"] };
  
    if (assessmentType) query.assessmentType = assessmentType;
  
    if (userParam.stateId) {
      query.states = { $in: [userParam.stateId] };
    }

    console.log("Query: ", query, "getChildrenForParent");
  
    const dbAssessments = await Assessment.find(query);

    console.log("Db Assessments: ", dbAssessments, "getChildrenForParent");
  
    const arrAssessIds = dbAssessments.map((element) => new objectId(element.id));
    const arrStudentIds = dbStudents.map((element) => new objectId(element.id));
  
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

    console.log("Progress Records: ", progressRecords, "getChildrenForParent");
  
    if (dbStudents && dbStudents?.length) {
      dbStudents.forEach((element) => {
        const studentObj = {};
        const deptId = element?.department?.toString();
        studentObj.id = element?.id;
        studentObj.SRNumber = element?.srnNo;
        studentObj.Name = element?.childName;
        studentObj.diseCode = element?.diseCode;
        studentObj.parentName = element?.parentName;
        studentObj.department = deptId;
  
        const className = Departments.find((dept) => dept.id === deptId);
        studentObj.className = className?.name || "";
  
        const matchingProgress = progressRecords.find(
          (item) => String(item._id) === String(element?.id)
        );
  
        if (matchingProgress) {
          const calcPercentage =
            (matchingProgress.totalCorrectQuestionCnt /
              matchingProgress.totalQuestionCnt) *
            100;
          studentObj.totalPercentage = Number(calcPercentage.toFixed(2));
          studentObj.totalCorrectQuestionCnt =
            matchingProgress.totalCorrectQuestionCnt;
          studentObj.totalQuestionCnt = matchingProgress.totalQuestionCnt;
          studentObj.totalStars = matchingProgress.totalStars;
        } else {
          studentObj.totalPercentage = 0;
          studentObj.totalCorrectQuestionCnt = 0;
          studentObj.totalQuestionCnt = 0;
          studentObj.totalStars = 0;
        }
  
        students.push(studentObj);
      });
    }
    console.log("Students: ", students, "getChildrenForParent");
    return students;
  } catch (error) {
    console.log("Error in: ", error, "getChildrenForParent");
  }
}

/*
This API is to get students wise reward details
*/
async function getRewardDetails(userParam) {
  try {
    const userId = userParam?.user;
  
    if (!userId) {
      throw new Error("Invalid input");
    }
  
    const rewardList = await Reward.find({ user: userId, isActive: true }).populate("videoStory");
    console.log("Reward List: ", rewardList, "getRewardDetails");
    rewardList.forEach(item => {
      if (item?.videoStory) {
        item.videoStory.thumbnail = config?.repositoryHost + item?.videoStory?.thumbnail;
      }
    });
  
    const userPoints = await User.findById(userId).select("totalPointsEarned");
    console.log("User Points: ", userPoints, "getRewardDetails");
    const totalPointsEarned = userPoints ? userPoints.totalPointsEarned : 0;
  
    return {
      rewards: rewardList,
      totalPointsEarned,
      status: true,
      statusCode: 200
    };
  } catch (error) {
    console.log("Error in: ", error, "getRewardDetails");
    throw error;
  }  
}

/*
This API is to get Sampark Smart Shala assessment
*/
async function getSSSAssessment(userparam) {
  try {
    if (!userparam?.assessmentId) {
      throw new Error("Invalid input");
    }
  
    const arrAssessmentIds = [userparam?.assessmentId];
    const query = {
      isActive: true,
      assessment: { $in: arrAssessmentIds }
    };
    console.log("Query: ", query, "getSSSAssessment");
    const assessmentQuestions = await AssessmentQuestion.find(query);
    console.log("Questions: ", assessmentQuestions, "getSSSAssessment");
    const Assessments = await Assessment.find({ isActive: true });
    console.log("Assessments: ", Assessments, "getSSSAssessment");
    const questionsGroupByAssessment = _.groupBy(assessmentQuestions, "assessment");
  
    const finalArray = Object.entries(questionsGroupByAssessment).map(([assessId, questionsGroup]) => {
      const assessmentName = Assessments.find(assessment => assessment?.id === assessId);
  
      const questionList = {
        id: assessId,
        name: assessmentName?.lesson,
        level: assessmentName?.level,
        timeLimit: assessmentName?.duration,
        displayQuestionsCnt: Math.min(questionsGroup?.length, 21) - 1,
        instructions: {
          rules: [
            "You have to score over 80% to complete this module successfully.",
            "You will get 3 Lifelines.",
            `Maximum time taken should be ${assessmentName?.duration} minutes.`
          ],
          point_system: [
            `+${(assessmentName.maxMarks || assessmentName?.displayQuestionsCnt) / questionList?.displayQuestionsCnt?.toFixed(1)} for each correct answer.`,
            "Each unused Lifelines earn you 5 points.",
            "If you complete the quiz within stipulated time, you earn 5 points."
          ]
        },
        questions: questionsGroup?.slice(0, questionList?.displayQuestionsCnt).map(questionInnerObj => {
          const questionObj = {
            id: questionInnerObj?.id,
            question: questionInnerObj?.question,
            sentence: questionInnerObj?.sentence || "",
            questionType: questionInnerObj?.questionType || "objective",
            optionType: questionInnerObj?.optionType || "",
            isAudioEnabled: questionInnerObj?.isAudioEnabled || "",
            options: {},
            question_image: questionInnerObj?.question_image
              ? config?.repositoryHost + questionInnerObj?.question_image
              : "",
            options_image: {}
          };
  
          if (
            questionInnerObj.questionType === "fbtt" ||
            questionInnerObj.questionType === "dd1"
          ) {
            const options = Object.values(questionInnerObj?.options || {});
            const correctAnswers = Object.values(questionInnerObj?.correctAnswer || {});
            const finalOptions = options.concat(correctAnswers).filter((elem, pos, arr) => arr.indexOf(elem) === pos);
  
            finalOptions.forEach((option, i) => {
              questionObj.options[i] = option;
            });
          } else if (
            questionInnerObj.questionType === "dd2" &&
            questionInnerObj.optionType === "text"
          ) {
            Object.entries(questionInnerObj.options).forEach(([key, value]) => {
              questionInnerObj.options[key] = JSON.parse(value);
            });
  
            Object.entries(questionInnerObj.options).forEach(([key, value]) => {
              questionObj.options[key] = value;
            });
          } else if (
            questionInnerObj.questionType === "dd2" &&
            questionInnerObj.optionType === "image"
          ) {
            Object.entries(questionInnerObj.options).forEach(([key, values]) => {
              const updatedValues = values.map(value => config.repositoryHost + value);
              questionInnerObj.options[key] = updatedValues;
            });
  
            Object.entries(questionInnerObj.options).forEach(([key, values]) => {
              questionObj.options[key] = values;
            });
          } else {
            questionObj.options = questionInnerObj.options;
          }
  
          if (!_.isEmpty(questionInnerObj.options_image)) {
            Object.entries(questionInnerObj.options_image).forEach(([optionKey, optionValue]) => {
              if (optionValue) {
                questionInnerObj.options_image[optionKey] = config.repositoryHost + optionValue;
              }
            });
  
            questionObj.options_image = questionInnerObj.options_image;
          } else {
            questionObj.options_image = {};
          }
  
          const questionOptions = {};
          Object.entries(questionObj.options).forEach(([option, value]) => {
            questionOptions[option] = value || option;
          });
          questionObj.options = questionOptions;
  
          const correctAnswerKeys = Object.keys(questionInnerObj.correctAnswer || {});
          const correctAnswerKey = correctAnswerKeys[0];
  
          if (questionInnerObj.correctAnswer[correctAnswerKey] === "") {
            questionInnerObj.correctAnswer[correctAnswerKey] = correctAnswerKey;
          }
          questionObj.correctAnswer = questionInnerObj.correctAnswer;
          console.log("Question Object: ", questionObj, "getSSSAssessment");
  
          return questionObj;
        })
      };
      console.log("Question List: ", questionList, "getSSSAssessment");
      return questionList;
    });
  
    return finalArray;
  } catch (e) {
    console.log("Error in: ", e, "getSSSAssessment");
    throw e;
  }    
}

/*
This API is to save status that reward is opened
*/
async function rewardOpened(req) {
  try {
    if (req && req?.rewardId && req?.rewardId !== "") {
      await Reward.updateOne({ _id: req?.rewardId }, { $set: { opened: true } });
      return true;
    } else throw "Please send valid input";
  } catch (error) {
    console.log("Error in: ", error, "rewardOpened");
    throw "Getting error. Please try after some time.";
  }
}

/*
This API is to get classes by the given disecode
*/
async function getClasses(userParam) {
  try {
    let query = {};
    let finalArray = [];
  
    //To get active students based on disecode
    query['isActive'] = true;
    query['diseCode'] = userParam?.disecode;
    console.log("Query: ", query, "getClasses");
  
    const students = await Student.find(query).select('id childName department');
    console.log("Students: ", students, "getClasses");
    //To get all classes for this sa module
    const departments = await Departmentmaster.find({ module: 'sa' }).select('id name');
    console.log("Department: ", departments, "getClasses");
    //To do groupby on department of students received
    const studentsGroupByClass = _.groupBy(students, 'department');
  
    //Loop through objects
    for (const deptId in studentsGroupByClass) {
      let classList = {};
      const searchMask = ' ';
      const regEx = new RegExp(searchMask, 'ig');
      const replaceMask = '';
  
      //To get class name
      const deptName = _.where(departments, { id: deptId });
  
      if (deptName[0]) {
        //Assigning required class info to a final object
        classList['id'] = deptId;
        classList['className'] = deptName[0]['name'];
        classList['icon'] = config.assetHost + deptName[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';
        classList['icon_active'] = config.assetHost + 'big-' + deptName[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';
        classList['studentsCnt'] = studentsGroupByClass[deptId].length;
    
        //Assign object to final array
        finalArray.push(classList);
      }
    }
  
    //Sort final array by class name
    finalArray = _.sortBy(finalArray, 'className');
    console.log("Sorted Final Array: ", finalArray, "getClasses");
  
    //return final array
    return finalArray;
  } catch(error) {
    console.log("Error in: ", error, "getClasses");
    throw error;
  }
}

/*
This API is to get students by the given class and disecode
*/
async function getStudents(userParam) {
  try {
    const query = {
      isActive: true,
      diseCode: userParam?.disecode,
      department: userParam?.department,
    };

    console.log("Query: ", query, "getStudents");
  
    const queryAssess = {
      isActive: true,
      published: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      type: { $in: ["MT"] },
      assessmentType: "State",
    };
  
    if (Boolean(userParam?.stateId)) {
      queryAssess.states = { $in: [userParam?.stateId] };
    } else {
      const checkSchool = await School.findOne({ diseCode: userParam?.disecode });
  
      if (checkSchool) {
        queryAssess.states = { $in: [checkSchool?.state?.toString()] };
      }
    }
  
    queryAssess.department = userParam?.department;
    console.log("Query Assess: ", queryAssess, "getStudents");
  
    const dbStudents = await Student.find(query, "id childName department");
    console.log("DB Students: ", dbStudents, "getStudents");
  
    const dbAssessments = await Assessment.find(queryAssess, "id");
    console.log("DB Assessments: ", dbAssessments, "getStudents");
  
    const arrAssessIds = dbAssessments.map(element => new objectId(element?.id));
    const totalTestCnt = arrAssessIds.length;
  
    const arrStudentIds = dbStudents.map(element => new objectId(element?.id));
  
    const progressRecords = await AssessmentStudentProgress.aggregate([
      {
        $match: {
          student: { $in: arrStudentIds },
          department: new objectId(userParam?.department),
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

    console.log("Progress Records: ", progressRecords, "getStudents");
  
    const finalArray = dbStudents.map(element => {
      const studentObj = {
        id: element?.id,
        name: element?.childName,
      };
  
      const matchingProgress = progressRecords.find(item => String(item?._id) === String(element?.id));
  
      studentObj.test_attempted = matchingProgress ? matchingProgress?.testAttemptedCnt : 0;
      studentObj.test_pending = totalTestCnt - studentObj?.test_attempted;
      console.log("Student Object: ", studentObj, "getStudents");
      return studentObj;
    });
    console.log("Final Array: ", finalArray, "getStudents");
    return finalArray;
  } catch (e) {
    console.log("Error in: ", e, "getStudents");
    throw e;
  }  
}
