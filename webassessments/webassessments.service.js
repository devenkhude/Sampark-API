const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const Assessment = db.Assessment;
const AssessmentQuestion = db.Assessmentquestion;
const AssessmentStudentProgress = db.Assessmentstudentprogress;
const School = db.School;
const Departmentmaster = db.Departmentmaster;
const Student = db.Student;
const State = db.State;
const User = db.User;

var _ = require("underscore");
var objectId = require("mongoose").Types.ObjectId;
var CryptoJS = require("crypto-js");

module.exports = {
  validateSRNumber,
  saveAssessmentResults,
  registerStudent,
  getAssessmentClass,
  getValidIdForDeepLink
};

/*
This API is to validate given srn number and provide assessment question if its valid
*/
async function validateSRNumber(userParam) {
  //Get params into variables
  const srnNo = userParam.srnNo;
  let assessInputEnc = userParam.assessmentId;

  //To convert all spaces to + as browser is replacing all + to space 
  let assessInput = assessInputEnc.replace(/ /g, "+");
  let encryptedData = decodeURIComponent(assessInput);
  
  //Decryption 
  let Key = CryptoJS.enc.Utf8.parse("6il7YCRSqIOB9NooY225lPKQ0KuAF/nkFX6cY3vJkS0=");
  let IV = CryptoJS.enc.Utf8.parse("0123456789ABCDEF");
  let decryptedText = CryptoJS.AES.decrypt(encryptedData, Key, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  let assessmentId = decryptedText.toString(CryptoJS.enc.Utf8);

  let query = {};
  let queryAssess = {};
  let finalObj = {};
  finalObj['assessmentDetails'] = {};
  let dbStudent;
  let assessmentQuestions;
  let assessmentDetails;
  //If sr number ad assessment id are given
  if (srnNo && srnNo.trim() && assessmentId && assessmentId.trim()) {

    //Run queries
    dbStudent = await Student.find({ srnNo: srnNo, isActive: true });

    //To get assessment questions and assessment details
    query['isActive'] = true;
    query['assessment'] = new objectId(assessmentId);

    queryAssess['isActive'] = true;
    queryAssess['published'] = true;
    queryAssess['startDate'] = { $lte: new Date() };
    queryAssess['endDate'] = { $gte: new Date() };
    queryAssess['_id'] = new objectId(assessmentId);

    assessmentQuestions = await AssessmentQuestion.find(query);
    assessmentDetails = await Assessment.find(queryAssess);
  } else {
    finalObj['success'] = false;
    finalObj['statusCode'] = 603;
    finalObj['alert'] = 1;
    finalObj['message'] = "Invalid Request";
    return finalObj;
  }

  //If student found
  if (dbStudent && dbStudent.length) {

    //Form final object
    finalObj['success'] = true;
    finalObj['message'] = "Valid Request";
    finalObj['studentDetails'] = {};

    //Append student details
    finalObj['studentDetails']['id'] = dbStudent[0].id;
    finalObj['studentDetails']['name'] = dbStudent[0].childName;
    finalObj['studentDetails']['srNumber'] = dbStudent[0].srnNo;

    //To get parent id if registered otherwise student id 
    let parentMobile = dbStudent[0].parentMobile;
    let dbUser = await User.find({ "phone_number": parentMobile }).select('id');
    finalObj['studentDetails']['loggedInUserId'] = dbUser[0] ? dbUser[0]['id'] : dbStudent[0].id;

    //To get class name
    let deptId = dbStudent[0].department;

    let dbDepartment = await Departmentmaster.findById(deptId).select('id name');
    //return className;
    finalObj['studentDetails']['deptId'] = deptId;
    finalObj['studentDetails']['className'] = dbDepartment ? dbDepartment.name : null;

    //To get state name
    let diseCode = dbStudent[0].diseCode;
    let dbSchool = await School.find({ "diseCode": diseCode }).select('state');
    let stateId = dbSchool[0] ? dbSchool[0]['state'] : null;

    if (stateId) {
      let dbState = await State.findById(stateId).select('id name');
      finalObj['studentDetails']['state'] = dbState ? dbState.id : null;
      finalObj['studentDetails']['stateName'] = dbState ? dbState.name : null;
    } else {
      finalObj['studentDetails']['state'] = null;
      finalObj['studentDetails']['stateName'] = null;
    }
  } else {
    finalObj['success'] = false;
    finalObj['statusCode'] = 600;
    finalObj['confirmation'] = 1;
    finalObj['message'] = "This SR Number is not registered";
  }

  if (assessmentDetails && assessmentDetails.length) {

    //To get class name
    let deptId = assessmentDetails[0].department;
    let dbDepartment = await Departmentmaster.findById(deptId).select('id name');

    //Append assessment details
    finalObj['assessmentDetails']['id'] = assessmentId;
    finalObj['assessmentDetails']['name'] = assessmentDetails[0]['lesson'];
    finalObj['assessmentDetails']['level'] = assessmentDetails[0]['level'];
    finalObj['assessmentDetails']['subject'] = assessmentDetails[0]['subject'];
    finalObj['assessmentDetails']['className'] = dbDepartment ? dbDepartment.name : null;

    let level = assessmentDetails[0]['level'];
    finalObj['assessmentDetails']['timeLimit'] = assessmentDetails[0]['duration'];

    finalObj['assessmentDetails']['instructions'] = [];

    let instruction1 = 'You will get total ' + assessmentDetails[0]['duration'] + ' minutes to finish the test;' +
      ' if you finish in ' + level['Difficult'] + ' minutes (Difficult), you will get 3 stars, in ' + level['Moderate'] +
      ' mins (Moderate) you  will get 2 stars and above ' + level['Easy'] + ' mins you will get 1 star';

    let instruction2 = "For each assessment you will get 3 lifelines from Sampark Didi to help you in the " +
      "test, if you don’t use the lifelines you will get 1 star";

    finalObj['assessmentDetails']['instructions'].push(instruction1);
    finalObj['assessmentDetails']['instructions'].push(instruction2);

    //Array of questions
    let questionArr = [];

    //Loop through assessment db questions
    for (let questionIndex in assessmentQuestions) {
      let questionDbObj = assessmentQuestions[questionIndex];

      //Each question as an object
      let questionObj = {};

      questionObj['id'] = questionDbObj['id'];
      questionObj['question'] = questionDbObj['question'];
questionObj['options'] = questionDbObj['options'] ? questionDbObj['options'] : {};
      questionObj['question_image'] = questionDbObj['question_image'] ? config.repositoryHost + questionDbObj['question_image'] : '';

      if (!_.isEmpty(questionDbObj['options_image'])) {
        questionDbObj['options_image']['a'] ? questionDbObj['options_image']['a'] = config.repositoryHost + questionDbObj['options_image']['a'] : '';
        questionDbObj['options_image']['b'] ? questionDbObj['options_image']['b'] = config.repositoryHost + questionDbObj['options_image']['b'] : '';
        questionDbObj['options_image']['c'] ? questionDbObj['options_image']['c'] = config.repositoryHost + questionDbObj['options_image']['c'] : '';
        questionDbObj['options_image']['d'] ? questionDbObj['options_image']['d'] = config.repositoryHost + questionDbObj['options_image']['d'] : '';
        questionObj['options_image'] = questionDbObj['options_image'];
      } else {
        questionObj['options_image'] = {};
      }

      questionOptions = {}
      Object.keys(questionObj['options']).forEach(function(option) {
        if (questionObj['options'][option] == "") {
          questionOptions[option] = option
        } else {
          questionOptions[option] = questionObj['options'][option]
        }
      });
      questionObj['options'] = questionOptions
      let correctAnswerKeys = Object.keys(questionDbObj['correctAnswer'])
      let correctAnswerKey = correctAnswerKeys[0]
      if (questionDbObj['correctAnswer'][correctAnswerKey] == "") {
        questionDbObj['correctAnswer'][correctAnswerKey] = correctAnswerKey
      }
      questionObj['correctAnswer'] = questionDbObj['correctAnswer'];

      //Push each object to an array
      questionArr.push(questionObj);
    }
    //Push all assessments to final object
    finalObj['questions'] = questionArr;

    //To form display count based on number of questions
    let requiredCnt = questionArr.length >= 21 ? 21 : questionArr.length;
    finalObj['assessmentDetails']['displayQuestionsCnt'] = requiredCnt - 1;

    if (dbStudent && dbStudent.length && String(deptId) != String(dbStudent[0].department)) {
      finalObj['success'] = false;
      finalObj['statusCode'] = 601;
      finalObj['confirmation'] = 1;
      finalObj['message'] = "This assessment does not belongs to your class.";
      return finalObj;
    }

    if (dbStudent && dbStudent.length && assessmentDetails[0]['assessmentType'] == 'State') {
      //Get parent state
      let dbUser = await User.find({ "phone_number": dbStudent[0].parentMobile }).select('state');
      if (dbUser && dbUser.length && dbUser[0].state && assessmentDetails[0].states &&
        !_.contains(assessmentDetails[0].states, String(dbUser[0].state))) {

        finalObj['success'] = false;
        finalObj['statusCode'] = 602;
        finalObj['confirmation'] = 1;
        finalObj['message'] = "This assessment does not belongs to your state.";
        return finalObj;
      }
    }
  }
  return finalObj;
}

/*
This API is to save web assessment results
*/
async function saveAssessmentResults(assessDetails) {

  if (!_.isEmpty(assessDetails)) {

    try {

      //To check if already test has been taken      
      var testAttemptedCnt = await AssessmentStudentProgress.find({
        student: new objectId(assessDetails['studentId']),
        assessment: new objectId(assessDetails['assessmentId'])
      }).countDocuments();

      //If test has been taken delete exsting records from progress and answers tables
      if (testAttemptedCnt) {
        //Delete progress record
        await AssessmentStudentProgress.deleteMany({
          student: new objectId(assessDetails['studentId']),
          assessment: new objectId(assessDetails['assessmentId'])
        });
      }

      let studentAnswers = []
      //If answers are there fill answers table
      if (assessDetails.questions.length) {

        let questionArr = assessDetails.questions;
        for (i = 0; i < questionArr.length; i++) {
          let studentAnswer = {}
          studentAnswer['question'] = questionArr[i]['id']
          studentAnswer['selectedAnswer'] = questionArr[i]['enteredAnswer']
          studentAnswer['correctAnswer'] = questionArr[i]['correctAnswer']
          studentAnswer['type'] = 'HT'
          studentAnswers.push(studentAnswer)
        }
      }

      //Insert assessment student progess collection
      const studentAssessProgress = new AssessmentStudentProgress({

        student: assessDetails['studentId'],
        assessment: assessDetails['assessmentId'],
        state: assessDetails['stateId'],
        department: assessDetails['departmentId'],
        subject: assessDetails['subjectId'],
        correctQuestionCnt: assessDetails['correctQuesionCnt'],
        totalQuestionCnt: assessDetails['totalQuesionCnt'],
        entryType: 'Calculated',
        completionDuration: assessDetails['completionDuration'],
        countOfStar: assessDetails['countOfStar'],
        type: 'HT',
        answers: studentAnswers,
        sourceType: assessDetails['sourceType'],
        createdBy: new objectId(assessDetails['loggedInUserID']),
        modifiedBy: new objectId(assessDetails['loggedInUserID'])

      });

      await studentAssessProgress.save();

      return { 'success': true, 'message': 'Assessment results saved successfully.' };
    } catch (e) {
      return { 'success': false, 'message': 'Exception came while inserting into database.' };
    }
  } else {
    return { 'success': false, 'message': 'Assessment results needs to be passed in json format.' };
  }
}

//To register a student or edit a student
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

    /*if (req.diseCode && req.diseCode !== "") {
      
      //To check if diseCode exists in db
      var diseCodeCnt = await School.find({diseCode : req.diseCode}).countDocuments();

      if (!diseCodeCnt) {
        return 'Invalid disecode.';
      }
    }*/

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
      return false;
    }
  } else {
    return false;
  }
}

//To get class list
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

//To get valid id for deeplink
async function getValidIdForDeepLink(userParam) {
  //Get params into variables
  const receivedId = userParam.id;
  const endpoint = userParam.endpoint; //For future purpose

  if(receivedId) {
    //To convert all spaces to + as browser is replacing all + to space 
    const receivedIdWithValidChar = receivedId.replace(/ /g, "+");
    const encryptedData = decodeURIComponent(receivedIdWithValidChar);

    //Decryption 
    const Key = CryptoJS.enc.Utf8.parse("6il7YCRSqIOB9NooY225lPKQ0KuAF/nkFX6cY3vJkS0=");
    const IV = CryptoJS.enc.Utf8.parse("0123456789ABCDEF");
    try {
      const decryptedText = CryptoJS.AES.decrypt(encryptedData, Key, {
        iv: IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      let receivedIdDecrypted = decryptedText.toString(CryptoJS.enc.Utf8);
      return receivedIdDecrypted;
    } catch (error) {
      return "";
    }
  }
  return "";
}
