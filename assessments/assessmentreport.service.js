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
  
  try {
    const classId = req?.query?.classId;
    const disecode = req?.query?.diseCode;
  
    const dbDepartment = await Departmentmaster.findById(classId);
  
    const dbStudents = await Student.find({ department: classId, diseCode: disecode, isActive: true });
  
    const arrStudentIds = dbStudents.map(element => new objectId(element?.id));
    console.log("Assessment Class Student Array: ", arrStudentIds, "getClassStudentRport");
  
    const progressRecords = await AssessmentStudentProgress.aggregate([
      {
        $match: {
          department: new objectId(classId),
          student: { $in: arrStudentIds },
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

    console.log("Progress Records: ", progressRecords, "getClassStudentRport");
  
    const finalObj = {
      studentReports: dbStudents.map(element => {
        const matchingProgress = progressRecords.find(item => String(item?._id) === String(element?.id));
  
        const studentObj = {
          studentId: element?.id,
          studentName: element?.childName,
          className: dbDepartment?.name,
          totalPercentage: matchingProgress
            ? Number(((matchingProgress?.totalCorrectQuestionCnt / matchingProgress?.totalQuestionCnt) * 100).toFixed(2))
            : 0,
          totalRatings: matchingProgress ? matchingProgress?.totalStars : 0,
        };

        console.log("Student Object: ", studentObj, "getClassStudentRport");
  
        return studentObj;
      }),
    };

    console.log("Final Report Object: ", finalObj, "getClassStudentRport");
  
    return finalObj;
  } catch (error) {
    console.error(error);
    console.log("Error in: ", error, "getClassStudentRport");
    throw error;
  }  
}

async function registerStudent(req) {
  if (req) {
    console.log("Request: ", req, "registerStudent");
    if (req?.state && req?.state !== "") {
      user_state = await State.findById(req.state);
      console.log("User State: ", user_state, "registerStudent");

      if (req?.diseCode && req?.diseCode !== "") {
        if (!req?.diseCode.startsWith(user_state?.code)) {
          return 'Dise Code does not belongs to ' + user_state?.name;
        }
      }
    }
    try {
      const studentDetail = req;
      if (!studentDetail?.studentId) {

        let dbStudent;

        if (studentDetail?.SRNumber && studentDetail?.SRNumber?.trim()) {
          dbStudent = await Student.find({ srnNo: studentDetail?.SRNumber, isActive: true });
          console.log("Student: ", dbStudent, "registerStudent");
        }

        if (dbStudent && dbStudent?.length) {
          return 'Student already registered with the ' + studentDetail.SRNumber + ' SR Number';
        }

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
        console.log("Student Object: ", student, "registerStudent");
        await student.save();
      } else {
        let dbStudent = await Student.findById(studentDetail?.studentId);
        console.log("Student by ID: ", dbStudent, "registerStudent");
        let checkStudent;
        if (studentDetail?.SRNumber && studentDetail?.SRNumber?.trim() && dbStudent?.srnNo != studentDetail?.SRNumber) {
          checkStudent = await Student.find({ srnNo: studentDetail?.SRNumber, isActive: true});
          console.log("Check Student: ", checkStudent, "registerStudent");
        }
        
        if (checkStudent && checkStudent?.length) {
          return 'Student already registered with the ' + studentDetail?.SRNumber + ' SR Number';
        }

        dbStudent.childName = studentDetail?.name;
        dbStudent.department = new objectId(studentDetail?.department);
        dbStudent.srnNo = studentDetail?.SRNumber;
        dbStudent.diseCode = studentDetail?.diseCode;
        dbStudent.parentName = studentDetail?.parentName;
        dbStudent.parentMobile = studentDetail?.parentMobile;
        dbStudent.modifiedDate = new Date();
        dbStudent.modifiedBy = new objectId(studentDetail?.createdBy);
        console.log("Save Student: ", dbStudent, "registerStudent");
        dbStudent.save();
      }
      return true;
    } catch (e) {
      console.log("Error in: ", e, "registerStudent");
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

    if (req?.state && req?.state !== "") {
      user_state = await State.findById(req?.state).select('code name');
      
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
  try{
    const departments = await Departmentmaster.find({ module: "sa" });
    console.log("Departments: ", departments, "getAssessmentClass");
    const departmentList = [];
    if (departments && departments?.length) {
      departments.forEach(element => {
        let department = {};
        department.id = element?.id;
        department.module = element?.module;
        department.name = element?.name;
        departmentList.push(department);
      });
      console.log("Department List: ", departmentList, "getAssessmentClass");
    }
    return departmentList;
  }
  catch (error) {
    console.log("Error in: ", error, "getAssessmentClass");
  }
}

async function getStudentDetail(req) {
  try {
    const studentId = req?.query?.studentId;
    console.log("Student ID: ", studentId, "getStudentDetail");
    const dbStudent = await Student.findById(studentId);
    console.log("Student by ID: ", dbStudent, "getStudentDetail");
    return dbStudent
      ? {
          studentId: dbStudent?.id,
          name: dbStudent?.childName,
          department: dbStudent?.department,
          SRNumber: dbStudent?.srnNo,
          diseCode: dbStudent?.diseCode,
          createdBy: dbStudent?.createdBy,
          parentName: dbStudent?.parentName,
          parentMobile: dbStudent?.parentMobile,
        }
      : null;
  } catch (error) {
    console.log("Error in: ", error, "getStudentDetail");
    throw error;
  }  
}
async function getAssessmentSubjects(req) {
  try {
    const dbSubjects = await Subjectmaster.find({ module: "sa" });
    console.log("Subject: ", dbSubjects, "getAssessmentSubjects");
    const subjects = [];
    if (dbSubjects && dbSubjects?.length) {
      dbSubjects.forEach(element => {
        let subject = {};
        subject.id = element?.id;
        subject.module = element?.module;
        subject.name = element?.name;
        subjects.push(subject);
      });
      console.log("DB Subjects: ", subjects, "getAssessmentSubjects");
    }
    return subjects;
  } catch (error) {
    console.log("Error in: ", error, "getAssessmentSubjects");
  }
}

/*
This API is to get classwise report by subject, class and then assessments
*/
async function getClasswiseReport(userParam) {

  try {
    const diseCode = userParam?.diseCode;
    console.log("Disecode: ", diseCode, "getClasswiseReport");
    const query = {
      isActive: true,
      published: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      assessmentType: 'State',
    };
    console.log("Query: ", query, "getClasswiseReport");
    if (Boolean(userParam?.stateId)) {
      const arrState = [userParam?.stateId];
      query.states = { $in: arrState };
      console.log("Query States: ", query.states, "getClasswiseReport");
    }
  
    const assessments = await Assessment.find(query);
    console.log("Assessments: ", assessments, "getClasswiseReport");
    const Subjects = await Subjectmaster.find({ module: 'sa' }).select('id name');
    console.log("Subjects: ", Subjects, "getClasswiseReport");
    const Departments = await Departmentmaster.find({ module: 'sa' }).select('id name');
    console.log("Departments: ", Departments, "getClasswiseReport");
    const regEx = / /ig;
    const replaceMask = '';
  
    const finalArray = [];
  
    const assessmentsGroupBySubject = _.groupBy(assessments, 'subject');
    console.log("Assessments Group by Subjects: ", assessmentsGroupBySubject, "getClasswiseReport");
  
    for (const subjectId in assessmentsGroupBySubject) {
      const assessmentSubjectList = {};
      const subjectName = _.where(Subjects, { id: subjectId });
  
      assessmentSubjectList.subjectId = subjectId;
      assessmentSubjectList.subjectName = subjectName[0].name;
      assessmentSubjectList.icon = config.assetHost + subjectName[0].name.toLowerCase().replace(regEx, replaceMask) + '.png';
      assessmentSubjectList.icon_active = config.assetHost + 'big-' + subjectName[0].name.toLowerCase().replace(regEx, replaceMask) + '.png';

      console.log("Assessments Subject List: ", assessmentSubjectList, "getClasswiseReport");
  
      const assessmentsGroupByClass = _.groupBy(assessmentsGroupBySubject[subjectId], 'department');
      const assessmentClassArr = [];
  
      for (const deptId in assessmentsGroupByClass) {
        const totalDbAssessments = assessmentsGroupByClass[deptId].length;
        const assessmentClassList = {};
        const className = _.where(Departments, { id: deptId });
  
        assessmentClassList.classId = deptId;
        assessmentClassList.className = className[0].name;
        assessmentClassList.icon = config.assetHost + className[0].name.toLowerCase().replace(regEx, replaceMask) + '.png';
        assessmentClassList.icon_active = config.assetHost + 'big-' + className[0].name.toLowerCase().replace(regEx, replaceMask) + '.png';

        console.log("Assessments Class List: ", assessmentClassList, "getClasswiseReport");
  
        const dbStudents = await Student.find({ department: deptId, diseCode, isActive: true });
        const arrStudentIds = dbStudents.map(element => new objectId(element?.id));
  
        const studentCnt = arrStudentIds.length;
        assessmentClassList.totalStudents = studentCnt;
  
        const arrAssessIds = assessmentsGroupByClass[deptId].map(assessInnerObj => new objectId(assessInnerObj.id));
  
        const progressRecordClass = await AssessmentStudentProgress.aggregate([
          {
            $match: {
              department: new objectId(deptId),
              subject: new objectId(subjectId),
              student: { $in: arrStudentIds },
              assessment: { $in: arrAssessIds },
            },
          },
          {
            $group: {
              _id: null,
              totalStudentsAppeared: { $sum: 1 },
              totalCorrectQuestionCnt: { $sum: '$correctQuestionCnt' },
              totalQuestionCnt: { $sum: '$totalQuestionCnt' },
            },
          },
        ]);

        console.log("Progress Record Class: ", progressRecordClass, "getClasswiseReport");
  
        if (progressRecordClass.length) {
          const calcPercentage = (progressRecordClass[0].totalCorrectQuestionCnt / progressRecordClass[0].totalQuestionCnt) * 100;
          assessmentClassList.totalMarksPercentage = Number(calcPercentage.toFixed(2));
          const completedPercentage = (progressRecordClass[0].totalStudentsAppeared / (studentCnt * totalDbAssessments)) * 100;
          assessmentClassList.completedAssessmentsPercentage = Number(completedPercentage.toFixed(2));
        } else {
          assessmentClassList.totalMarksPercentage = null;
          assessmentClassList.completedAssessmentsPercentage = null;
        }
  
        const progressRecords = await AssessmentStudentProgress.aggregate([
          {
            $match: {
              student: { $in: arrStudentIds },
              department: new objectId(deptId),
              subject: new objectId(subjectId),
              assessment: { $in: arrAssessIds },
            },
          },
          {
            $group: {
              _id: '$assessment',
              attemptedCnt: { $sum: 1 },
              totalCorrectQuestionCnt: { $sum: '$correctQuestionCnt' },
              totalQuestionCnt: { $sum: '$totalQuestionCnt' },
            },
          },
        ]);
  
        console.log("Progress Record: ", progressRecords, "getClasswiseReport");
        
        const assessArr = assessmentsGroupByClass[deptId].map(assessInnerObj => {
          const assessmentId = assessInnerObj.id;
          const matchingProgress = progressRecords.find(item => String(item._id) === String(assessmentId));
  
          const assessObj = {
            id: assessmentId,
            name: assessInnerObj.lesson,
            attemptedCnt: matchingProgress ? matchingProgress.attemptedCnt : 0,
          };
  
          if (matchingProgress) {
            const calcPercentage = (matchingProgress.totalCorrectQuestionCnt / matchingProgress.totalQuestionCnt) * 100;
            assessObj.totalPercentage = Number(calcPercentage.toFixed(2));
          } else {
            assessObj.totalPercentage = null;
          }
  
          return assessObj;
        });
  
        assessmentClassList.assessments = assessArr;
        assessmentClassArr.push(assessmentClassList);
      }
  
      assessmentClassArr = _.sortBy(assessmentClassArr, 'className');
      assessmentSubjectList.classes = assessmentClassArr;
      finalArray.push(assessmentSubjectList);
    }
  
    if (assessments.length) {
      const assessmentSubjectList = {};
      const allSubjectName = 'All Subject';
  
      assessmentSubjectList.subjectName = allSubjectName;
      assessmentSubjectList.icon = config.assetHost + allSubjectName.toLowerCase().replace(regEx, replaceMask) + '.png';
      assessmentSubjectList.icon_active = config.assetHost + 'big-' + allSubjectName.toLowerCase().replace(regEx, replaceMask) + '.png';
  
      finalArray.push(assessmentSubjectList);
    }
  
    console.log("Final Array: ", finalArray, "getClasswiseReport");
    return finalArray;
  } catch (error) {
    console.log("Error in: ", error, "getClasswiseReport");
    throw error;
  }  
}

/*
This API is to get all subject report 
*/
async function getAllSubjectReport(userParam) {
  try {
    const query = {
      isActive: true,
      published: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    };
  
    if (userParam?.diseCode) {
      query.assessmentType = { $in: ['State'] };
  
      if (Boolean(userParam?.stateId)) {
        query.states = { $in: [userParam?.stateId] };
      }
    }
  
    if (userParam?.classId) {
      query.department = userParam.classId;
    }

    console.log("Query: ", query, "getAllSubjectReport");
  
    const assessments = await Assessment.find(query);
    console.log("Assessments: ", assessments, "getAllSubjectReport");

  
    const Subjects = await Subjectmaster.find({ module: 'sa' }).select('id name');
    console.log("Subjects: ", Subjects, "getAllSubjectReport");
  
    const assessmentsGroupBySubject = _.groupBy(assessments, 'subject');
  
    const arrAssessIds = assessments.flatMap(item => new objectId(item.id));
  
    const finalArray = [];
  
    for (const subjectId in assessmentsGroupBySubject) {
      const assessmentSubjectList = {
        subjectId,
        subjectName: '',
        totalAssessments: assessmentsGroupBySubject[subjectId].length,
        totalMarksPercentage: null,
        averageStudentsAppeared: null,
        totalPercentage: null,
        totalStars: null,
      };
  
      const subjectName = _.where(Subjects, { id: subjectId });
  
      if (subjectName.length > 0) {
        assessmentSubjectList.subjectName = subjectName[0].name;
      }
  
      if (userParam?.diseCode) {
        const dbStudents = await Student.find({ diseCode: userParam?.diseCode, isActive: true });
  
        const arrStudentIds = dbStudents.map(element => new objectId(element?.id));
  
        const studentCnt = arrStudentIds.length;
  
        const distinctStudents = await AssessmentStudentProgress.distinct("student", {
          subject: new objectId(subjectId),
          student: { $in: arrStudentIds }
        });
        console.log("Distinct Students: ", distinctStudents, "getAllSubjectReport");
  
        const totalStudentsAppeared = distinctStudents.length;
  
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

          console.log("Progress Record: ", progressRecord, "getAllSubjectReport");
  
        if (progressRecord.length) {
          const calcPercentage = (progressRecord[0].totalCorrectQuestionCnt / progressRecord[0].totalQuestionCnt) * 100;
          assessmentSubjectList.totalMarksPercentage = Number(calcPercentage.toFixed(2));
          const averageStudents = totalStudentsAppeared / studentCnt;
          assessmentSubjectList.averageStudentsAppeared = Number(averageStudents.toFixed(2));
        }
      } else if (userParam.studentId && userParam.classId) {
        const progressRecord = await AssessmentStudentProgress.aggregate([
          {
            $match: {
              department: new objectId(userParam.classId),
              subject: new objectId(subjectId),
              student: new objectId(userParam.studentId),
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
          console.log("Progress Record: ", query, "getAllSubjectReport");
        if (progressRecord.length) {
          const calcPercentage = (progressRecord[0].totalCorrectQuestionCnt / progressRecord[0].totalQuestionCnt) * 100;
          assessmentSubjectList.totalPercentage = Number(calcPercentage.toFixed(2));
          assessmentSubjectList.totalStars = progressRecord[0].totalStars;
        }
      }
      finalArray.push(assessmentSubjectList);
    }
    console.log("Final Array: ", finalArray, "getAllSubjectReport");
    return finalArray;
  } catch (e) {
    console.log("Error in: ", e, "getAllSubjectReport");
    throw e;
  }  
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
