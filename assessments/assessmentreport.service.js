const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const Assessment = db.Assessment;
const AssessmentQuestion = db.Assessmentquestion;
const AssessmentStudentProgress = db.Assessmentstudentprogress;
const Subjectmaster = db.Subjectmaster;
const Student = db.Student;
const User = db.User;
const State = db.State;
const Departmentmaster = db.Departmentmaster;
const School = db.School;

const csvsync = require("csvsync");
const _ = require("underscore");
const fs = require("fs");
const { ObjectId } = require("mongodb");
const objectId = require("mongoose").Types.ObjectId;

module.exports = {
  registerStudent,
  deActivateStudent,
  getClassStudentRport,
  getAssessmentClass,
  getStudentDetail,
  getAssessmentSubjects,
  getClasswiseReport,
  getAllSubjectReport,
  registerStudentForNewAPK
};

//To get classwise students report for the given class
async function getClassStudentRport(req) {
  
  let finalObj = {
    studentReports: [],
  };

  const classId = req.query.classId;
  
  let disecode = req.query.diseCode;
  const dbDepartment = await Departmentmaster.findById(classId);
  
  let arrStudentIds = [];

  const dbStudents = await Student.find({ department: classId, diseCode: disecode, isActive: true });

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach(element => {
      let dbStudentId = new objectId(element.id);
      arrStudentIds.push(dbStudentId);
    });
  }

  //To get count of stars and percentage
  const progressRecords = await AssessmentStudentProgress.aggregate([
  { $match: { 
      department: new objectId(classId), student: {$in: arrStudentIds}
    } 
  },
  {
    $group: {
      _id: "$student",
      totalStars: { $sum: "$countOfStar" },
      totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
      totalQuestionCnt: { $sum: "$totalQuestionCnt" },
    }
  }]); 

  if (dbStudents && dbStudents.length) {
    dbStudents.forEach(element => {
      let studentObj = {};

      studentObj['studentId'] = element.id;        
      studentObj['studentName'] = element.childName;
      studentObj['className'] = dbDepartment.name;
      const matchingProgress  = _.filter(progressRecords, item => String(item._id) === String(element.id));

      if (matchingProgress.length) {
        const calcPercentage = (matchingProgress[0]['totalCorrectQuestionCnt'] / matchingProgress[0]['totalQuestionCnt']) * 100;
        studentObj['totalPercentage'] = Number(calcPercentage.toFixed(2));
        studentObj['totalRatings'] = matchingProgress[0]['totalStars'];
      } else {
        studentObj['totalPercentage'] = 0;          
        studentObj['totalRatings'] = 0;
      }        
      finalObj.studentReports.push(studentObj);
    });
  }

  return finalObj;
}

async function registerStudent(req) {
  if (req) {

    if (req.state && req.state !== "") {
      user_state = await State.findById(req.state);

      if (req.diseCode && req.diseCode !== "") {
        if (!req.diseCode.startsWith(user_state.code)) {
          return 'Dise Code does not belongs to ' + user_state.name;
        }
      }
    }
    try {
      var studentDetail = req;
      if (!studentDetail.studentId) {

        let dbStudent;

        if (studentDetail.SRNumber && studentDetail.SRNumber.trim()) {
          dbStudent = await Student.find({ srnNo: studentDetail.SRNumber, isActive: true });
        }

        if (dbStudent && dbStudent.length) {
          return 'Student already registered with the ' + studentDetail.SRNumber + ' SR Number';
        }

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
      } else {
        let dbStudent = await Student.findById(studentDetail.studentId);
        let checkStudent;
        if (studentDetail.SRNumber && studentDetail.SRNumber.trim() && dbStudent.srnNo != studentDetail.SRNumber) {
          checkStudent = await Student.find({ srnNo: studentDetail.SRNumber, isActive: true});
        }
        
        if (checkStudent && checkStudent.length) {
          return 'Student already registered with the ' + studentDetail.SRNumber + ' SR Number';
        }

        dbStudent.childName = studentDetail.name;
        dbStudent.department = new objectId(studentDetail.department);
        dbStudent.srnNo = studentDetail.SRNumber;
        dbStudent.diseCode = studentDetail.diseCode;
        dbStudent.parentName = studentDetail.parentName;
        dbStudent.parentMobile = studentDetail.parentMobile;
        dbStudent.modifiedDate = new Date();
        dbStudent.modifiedBy = new objectId(studentDetail.createdBy);
        dbStudent.save();
      }
      return true;
    } catch (e) {
      console.log("Error", e);
      return false;
    }
  } else {
    return false;
  }
}

/*
This API is for new apk
*/
async function registerStudentForNewAPK(req) { 
  let finalObject = {}; 
  if (req) {

    if (req.state && req.state !== "") {
      user_state = await State.findById(req.state).select('code name');
      if (req.diseCode && req.diseCode !== "") {
        if (!req.diseCode.startsWith(user_state.code)) {
          finalObject['status'] = false;
          finalObject['message'] = 'Dise Code does not belongs to ' + user_state.name;
          return finalObject;           
        }
      }
    }

    try {
      var studentDetail = req;
      if (!studentDetail.studentId) {

        let dbStudent;

        if (studentDetail.SRNumber && studentDetail.SRNumber.trim()) {
          dbStudent = await Student.find({ srnNo: studentDetail.SRNumber, isActive: true }).select('id diseCode');
        }
        
        if (dbStudent && dbStudent.length) {
          if(studentDetail.diseCode && studentDetail.diseCode.trim() && dbStudent[0]['diseCode'] == studentDetail.diseCode.trim()) {
            finalObject['status'] = false;
            finalObject['message'] = 'Student already registered with the given ' + studentDetail.SRNumber + ' SR Number and dise code '+studentDetail.diseCode;
            return finalObject;            
          } else {
            finalObject['status'] = false;
            finalObject['studentId'] = dbStudent[0]['id'];
            finalObject['diseCode'] = dbStudent[0]['diseCode'];
            finalObject['message'] = 'This student is already registered with '+ dbStudent[0]['diseCode'] + ', Do you want to update the student for the given dise code?';
            return finalObject;
          }
        }

        // only available disecode can be inserted in the db
        const student = new Student({
          parentMobile: studentDetail.parentMobile,
          srnNo: studentDetail.SRNumber.trim(),
          childName: studentDetail.name,
          parentName: studentDetail.parentName,
          diseCode: studentDetail.diseCode.trim(),
          department: new objectId(studentDetail.department),
          isActive: true,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createdBy: new objectId(studentDetail.createdBy),
          modifiedBy: new objectId(studentDetail.createdBy),
        });
        await student.save();
      } else {
        let dbStudent = await Student.findById(studentDetail.studentId);
        let checkStudent;
        if (studentDetail.SRNumber && studentDetail.SRNumber.trim() && dbStudent.srnNo != studentDetail.SRNumber.trim()) {
          checkStudent = await Student.find({ srnNo: studentDetail.SRNumber, isActive: true}).select('id');
        }
        
        if (checkStudent && checkStudent.length) {
          finalObject['status'] = false;
          finalObject['message'] = 'Student already registered with the ' + studentDetail.SRNumber + ' SR Number';
          return finalObject;          
        }

        dbStudent.childName = studentDetail.name;
        dbStudent.department = new objectId(studentDetail.department);
        dbStudent.srnNo = studentDetail.SRNumber;
        dbStudent.diseCode = studentDetail.diseCode;
        dbStudent.parentName = studentDetail.parentName;
        dbStudent.parentMobile = studentDetail.parentMobile;
        dbStudent.modifiedDate = new Date();
        dbStudent.modifiedBy = new objectId(studentDetail.createdBy);
        dbStudent.save();
      }
      finalObject['status'] = true;
      finalObject['message'] = 'Success'; 
      return finalObject;
    } catch (e) {
      finalObject['status'] = false;
      finalObject['message'] = 'Error'; 
      return finalObject;
    }
  } else {
    finalObject['status'] = true;
    finalObject['message'] = 'Request is empty'; 
    return finalObject;
  }
}

async function getAssessmentClass(req) {
  const departments = await Departmentmaster.find({ module: "sa" });
  departmentList = [];
  if (departments && departments.length) {
    for (var i = 0; i < departments.length; i++) {
      department = {};

      department.id = departments[i].id;
      department.module = departments[i].module;
      department.name = departments[i].name;
      departmentList.push(department);
    }
  }
  return departmentList;
}

async function getStudentDetail(req) {
  const studentId = req.query.studentId;
  let student = {
    studentId: "",
    name: "",
    parentMobile: "",
    SRNumber: "",
    parentName: "",
    diseCode: "",
    department: "",
    createdBy: "",
  };

  const dbStudent = await Student.findById(studentId);
  if (dbStudent) {
    student.studentId = dbStudent.id;
    student.name = dbStudent.childName;
    student.department = dbStudent.department;
    student.SRNumber = dbStudent.srnNo;
    student.diseCode = dbStudent.diseCode;
    student.createdBy = dbStudent.createdBy;
    student.parentName = dbStudent.parentName;
    student.parentMobile = dbStudent.parentMobile;
    return student;
  }
  return null;
}
async function getAssessmentSubjects(req) {
  const dbSubjects = await Subjectmaster.find({ module: "sa" });
  subjects = [];
  if (dbSubjects && dbSubjects.length) {
    for (var i = 0; i < dbSubjects.length; i++) {
      subject = {};

      subject.id = dbSubjects[i].id;
      subject.module = dbSubjects[i].module;
      subject.name = dbSubjects[i].name;
      subjects.push(subject);
    }
  }
  return subjects;
}

/*
This API is to get classwise report by subject, class and then assessments
*/
async function getClasswiseReport(userParam) {

  let query = {};
  let finalArray = [];
  const diseCode = userParam.diseCode;

  var searchMask = ' ';
  var regEx = new RegExp(searchMask, 'ig');
  var replaceMask = '';

  //To get active assessments based on class id
  query['isActive'] = true;
  query['published'] = true;
  query['startDate'] = { $lte: new Date() };
  query['endDate'] = { $gte: new Date() };

  query['assessmentType'] = 'State';

  if (Boolean(userParam.stateId)) {
    var arrState = [];
    arrState.push(userParam.stateId);
    query['states'] = { '$in': arrState };
  }

  /*if(Boolean(userParam.districtId)) {
    var arrDistrict = []
    arrDistrict.push(userParam.districtId);
    query['districts'] = { '$in': arrDistrict };
  }

  if(Boolean(userParam.blockId)) {
    var arrBlock = [];
    arrBlock.push(userParam.blockId);
    query['blocks'] = { '$in': arrBlock };
  }*/

  const assessments = await Assessment.find(query);

  //return assessments;  

  //To get all subjects for this sa module
  const Subjects = await Subjectmaster.find({ module: 'sa' }).select('id name');

  //To get all classes for this sa module
  const Departments = await Departmentmaster.find({ module: 'sa' }).select('id name');

  //To do groupby on department of assessments received
  var assessmentsGroupBySubject = _.groupBy(assessments, 'subject');

  //return assessmentsGroupBySubject;

  //Loop through subjects
  for (var subjectId in assessmentsGroupBySubject) {
    let assessmentSubjectList = {};

    //To get subject name
    var subjectName = _.where(Subjects, { id: subjectId });

    //Assigning required subject info to a final object
    assessmentSubjectList['subjectId'] = subjectId;
    assessmentSubjectList['subjectName'] = subjectName[0]['name'];
    assessmentSubjectList['icon'] = config.assetHost + subjectName[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';
    assessmentSubjectList['icon_active'] = config.assetHost + 'big-' + subjectName[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';

    //Group by class
    var assessmentsGroupByClass = _.groupBy(assessmentsGroupBySubject[subjectId], 'department');

    //To assign class objects
    var assessmentClassArr = [];

    //Loop through departments
    for (var deptId in assessmentsGroupByClass) {
      var totalDbAssessments = assessmentsGroupByClass[deptId].length;

      //Each class as object
      var assessmentClassList = {};

      //To get class name
      var className = _.where(Departments, { id: deptId });

      //Assigning required subject info to a final object
      assessmentClassList['classId'] = deptId;
      assessmentClassList['className'] = className[0]['name'];
      assessmentClassList['icon'] = config.assetHost + className[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';
      assessmentClassList['icon_active'] = config.assetHost + 'big-' + className[0]['name'].toLowerCase().replace(regEx, replaceMask) + '.png';

      //To get number of students in this class
      const dbStudents = await Student.find({ department: deptId, diseCode: diseCode, isActive: true });

      var arrStudentIds = [];

      if (dbStudents && dbStudents.length) {

        for (let index = 0; index < dbStudents.length; index++) {
          const element = dbStudents[index];
          var dbStudentId = new objectId(element.id);
          arrStudentIds.push(dbStudentId);
        }

        var studentCnt = arrStudentIds.length;

        assessmentClassList['totalStudents'] = studentCnt;
      } else {
        assessmentClassList['totalStudents'] = 0;
      }

      //Array of assessment
      let assessArr = [];
      var arrAssessIds = [];

      //Loop through assessments
      for (var assessIndex in assessmentsGroupByClass[deptId]) {
        var assessInnerObj = assessmentsGroupByClass[deptId][assessIndex];

        var dbAssessId = new objectId(assessInnerObj['id']);
        arrAssessIds.push(dbAssessId);       

      }

      //To get total counts
      var progressRecordClass = await AssessmentStudentProgress.aggregate([
        {
          $match: {
            department: new objectId(deptId), subject: new objectId(subjectId),
            student: { $in: arrStudentIds }, assessment: { $in: arrAssessIds }  
          }
        },
        {
          $group: {
            _id: null,
            totalStudentsAppeared: { $sum: 1 },
            totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
            totalQuestionCnt: { $sum: "$totalQuestionCnt" },
          }
        }]);

      if (progressRecordClass.length) {
        var calcPercentage = (progressRecordClass[0]['totalCorrectQuestionCnt'] / progressRecordClass[0]['totalQuestionCnt']) * 100;
        assessmentClassList['totalMarksPercentage'] = Number(calcPercentage.toFixed(2));
        var completedPercentage = (progressRecordClass[0]['totalStudentsAppeared'] / (studentCnt * totalDbAssessments)) * 100;
        assessmentClassList['completedAssessmentsPercentage'] = Number(completedPercentage.toFixed(2));
      } else {
        assessmentClassList['totalMarksPercentage'] = null;
        assessmentClassList['completedAssessmentsPercentage'] = null;
      }      

      //To get count of stars and percentage
      var progressRecords = await AssessmentStudentProgress.aggregate([
      {
        $match: { student: {$in: arrStudentIds}, 
        department: new objectId(deptId),
        subject: new objectId(subjectId),
        assessment: { $in: arrAssessIds } } 
      },
      {
        $group: {
          _id: "$assessment",
          attemptedCnt: { $sum: 1 },
          totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
          totalQuestionCnt: { $sum: "$totalQuestionCnt" }
        }
      }]); 

      //Loop through assessments
      for (var assessIndex in assessmentsGroupByClass[deptId]) {
        var assessInnerObj = assessmentsGroupByClass[deptId][assessIndex];

        var assessmentId = assessInnerObj['id'];

        var matchingProgress  = _.filter(progressRecords, item => String(item._id) === String(assessmentId));

        if (matchingProgress.length) {

          //Each assessment as an object
          let assessObj = {};

          assessObj['id'] = assessmentId;
          assessObj['name'] = assessInnerObj['lesson'];

          assessObj['attemptedCnt'] = matchingProgress[0]['attemptedCnt'];

          var calcPercentage = (matchingProgress[0]['totalCorrectQuestionCnt'] / matchingProgress[0]['totalQuestionCnt']) * 100
          assessObj['totalPercentage'] = Number(calcPercentage.toFixed(2));

          //Push each object to an array
          assessArr.push(assessObj);
        } else {
          //Each assessment as an object
          let assessObj = {};

          assessObj['id'] = assessmentId;
          assessObj['name'] = assessInnerObj['lesson'];

          assessObj['attemptedCnt'] = 0;
          assessObj['totalPercentage'] = null;

          //Push each object to an array
          assessArr.push(assessObj);
        }

      }

      //Push all assessments to class object of assessments
      assessmentClassList['assessments'] = assessArr;

      //Push class info to an array
      assessmentClassArr.push(assessmentClassList);
    }

    //Sort classes array by class name
    assessmentClassArr = _.sortBy(assessmentClassArr, 'className');

    //Push all classes info to classes
    assessmentSubjectList['classes'] = assessmentClassArr;

    //Assign final object to an array
    finalArray.push(assessmentSubjectList);
  }

  //To add all subjects icon if there are any assessments
  if (assessments.length) {
    let assessmentSubjectList = {};

    var allSubjectName = 'All Subject';

    assessmentSubjectList['subjectName'] = allSubjectName;
    assessmentSubjectList['icon'] = config.assetHost + allSubjectName.toLowerCase().replace(regEx, replaceMask) + '.png';
    assessmentSubjectList['icon_active'] = config.assetHost + 'big-' + allSubjectName.toLowerCase().replace(regEx, replaceMask) + '.png';

    finalArray.push(assessmentSubjectList);
  }

  //return final array
  return finalArray;
}

/*
This API is to get all subject report 
*/
async function getAllSubjectReport(userParam) {

  let query = {};
  let finalArray = [];
  const diseCode = userParam.diseCode;
  const studentId = userParam.studentId;
  const classId = userParam.classId;

  //To get active assessments based on class id
  query['isActive'] = true;
  query['published'] = true;
  query['startDate'] = { $lte: new Date() };
  query['endDate'] = { $gte: new Date() };

  if (diseCode) {
    query['assessmentType'] = { '$in': ['State'] };

    if (Boolean(userParam.stateId)) {
      let arrState = [];
      arrState.push(userParam.stateId);
      query['states'] = { '$in': arrState };
    }
  }

  if (classId) query['department'] = classId;

  const assessments = await Assessment.find(query);

  //To get all subjects for this sa module
  const Subjects = await Subjectmaster.find({ module: 'sa' }).select('id name');

  //To do groupby on department of assessments received
  const assessmentsGroupBySubject = _.groupBy(assessments, 'subject');

  let arrAssessIds = [];

  for (let subjectId in assessmentsGroupBySubject) {
    for (let assessIndex in assessmentsGroupBySubject[subjectId]) {
      let assessInnerObj = assessmentsGroupBySubject[subjectId][assessIndex];
      arrAssessIds.push(new objectId(assessInnerObj['id']));
    }
  }

  //Loop through subjects
  for (let subjectId in assessmentsGroupBySubject) {
    let assessmentSubjectList = {};

    //To get subject name
    const subjectName = _.where(Subjects, { id: subjectId });

    //Assigning required subject info to a final object
    assessmentSubjectList['subjectId'] = subjectId;
    assessmentSubjectList['subjectName'] = subjectName[0]['name'];
    assessmentSubjectList['totalAssessments'] = assessmentsGroupBySubject[subjectId].length;

    if (diseCode) {
      //To get number of students in this class
      const dbStudents = await Student.find({ diseCode: diseCode, isActive: true });

      let arrStudentIds = [];

      if (dbStudents && dbStudents.length) {
        dbStudents.forEach(element => {
          let dbStudentId = new objectId(element.id);
          arrStudentIds.push(dbStudentId);
        });
      }

      const studentCnt = arrStudentIds.length;
      //To get total number of students appeared
      const distinctStudents = await AssessmentStudentProgress.distinct("student", {
        subject: new objectId(subjectId),
        student: { $in: arrStudentIds }
      });

      const totalStudentsAppeared = distinctStudents.length;
      //To get total counts
      const progressRecord = await AssessmentStudentProgress.aggregate([
        {
          $match: {            
            subject: new objectId(subjectId),
            student: { $in: arrStudentIds },
            assessment: { $in: arrAssessIds }
          }
        },
        {
          $group: {
            _id: null,
            totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
            totalQuestionCnt: { $sum: "$totalQuestionCnt" },
          }
        }]);

      if (progressRecord.length) {
        let calcPercentage = (progressRecord[0]['totalCorrectQuestionCnt'] / progressRecord[0]['totalQuestionCnt']) * 100;
        assessmentSubjectList['totalMarksPercentage'] = Number(calcPercentage.toFixed(2));
        let avergaeStudents = totalStudentsAppeared / studentCnt;
        assessmentSubjectList['averageStudentsAppeared'] = Number(avergaeStudents.toFixed(2));
      } else {
        assessmentSubjectList['totalMarksPercentage'] = null;
        assessmentSubjectList['averageStudentsAppeared'] = null;
      }
    } else if (studentId && classId) {

      //To get count of stars and percentage
      const progressRecord = await AssessmentStudentProgress.aggregate([
        {
          $match: {
            department: new objectId(classId),
            subject: new objectId(subjectId),
            student: new objectId(studentId),
            assessment: { $in: arrAssessIds }
          }
        },
        {
          $group: {
            _id: null,
            totalStars: { $sum: "$countOfStar" },
            totalCorrectQuestionCnt: { $sum: "$correctQuestionCnt" },
            totalQuestionCnt: { $sum: "$totalQuestionCnt" },
          }
        }]);

      if (progressRecord.length) {
        let calcPercentage = (progressRecord[0]['totalCorrectQuestionCnt'] / progressRecord[0]['totalQuestionCnt']) * 100
        assessmentSubjectList['totalPercentage'] = Number(calcPercentage.toFixed(2));
        assessmentSubjectList['totalStars'] = progressRecord[0]['totalStars'];
      } else {
        assessmentSubjectList['totalPercentage'] = null;
        assessmentSubjectList['totalStars'] = null;
      }
    }

    //Assign final object to an array
    finalArray.push(assessmentSubjectList);
  }

  //return final array
  return finalArray;
}

/*
This API is to deactivate student
*/
async function deActivateStudent(id, userParam) {

  //Find student by id
  const student = await Student.findById(id);

  // validate
  if (!student) throw 'Student not found';

  //Copy userParam properties to student
  userParam.isActive = false;
  userParam.modifiedDate = new Date();

  Object.assign(student, userParam);

  //save student
  await student.save();

  return {
    "success": true
  }
}
