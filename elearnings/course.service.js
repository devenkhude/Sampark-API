//'use strict'
const config = require('../config.json');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const uploadToS3 = commonmethods.uploadToS3;
const downloadFileFromURL = commonmethods.downloadFileFromURL;
const uploadOnYouTube = commonmethods.uploadOnYouTube;
const uploadStreamToS3 = commonmethods.uploadStreamToS3;
const Course = db.Course;
const Certification = db.Certification;
const Usercertificate = db.Usercertificate;
const Coursemodule = db.Coursemodule;
const Livesession = db.Livesession;
const Enrollment = db.Enrollment;
const Courseprogress = db.Courseprogress;
const Moduleprogress = db.Moduleprogress;
const Document = db.Document;
const User = db.User;
const Userbadge = db.Userbadge;
const Feedbacklike = db.Feedbacklike;
const Sssvideoviewed = db.Sssvideoviewed;
const Documentviewed = db.Documentviewed;
const Livesessionattendance = db.Livesessionattendance;
const AssessmentQuestion = db.Assessmentquestion;
const Assessment = db.Assessment;
const Video = db.Video;
const Audio = db.Audio;
const Videostream = db.Videostream;
const AssessmentStudentProgress = db.Assessmentstudentprogress;
const Stream = db.Stream;
const getCurrentUserDetails = commonmethods.getCurrentUserDetails;
var q = require('q');
var path = require('path')
var isBase64 = require('is-base64');
var moment = require('moment');
var _ = require('underscore');
const { ObjectId } = require("mongodb");
var objectId = require("mongoose").Types.ObjectId;

module.exports = {
  getAllCourses: getAllCourses,
  getCourseModules: getCourseModules,
  progressUpdate: progressUpdate,
  enroll: enroll,
  cancelEnrollment: cancelEnrollment,
  saveFeedback: saveFeedback,
  feedbacks: feedbacks,
  likeFeedback: likeFeedback,
  liveSessionRequest: liveSessionRequest,
  getQuizQuestions: getQuizQuestions,
  uploadVideo: uploadVideo,
  saveQuizResults: saveQuizResults,
  getQuizResults: getQuizResults,
  getCertificate: getCertificate
};

function UserException(message,error_status) {
  this.message = message;
  this.error_status = error_status;
}

async function getCourseDetail(curCourse, enrollments, coursesSuggestedForYou, certificationGroups, liveSessions) {
  let defer = q.defer()
  try {
    let courseDetail = {};
    
    courseDetail['id'] = curCourse.id;
    courseDetail['name'] = curCourse.name;
    courseDetail['description'] = curCourse.description;
    courseDetail['rating'] = curCourse.rating;
    courseDetail['startDate'] = curCourse.startDate;
    courseDetail['endDate'] = curCourse.endDate;
    courseDetail['isPublished'] = curCourse.isPublished;
    courseDetail['publishedDate'] = curCourse.publishedDate;
    courseDetail['image'] = config.repositoryHost+curCourse.image;
    courseDetail['introductoryImage'] = (curCourse.introductoryImage) ? config.repositoryHost+curCourse.introductoryImage : '';
    
    let momentCurDateObj = moment(new Date(), 'MM-DD-YYYY');
    let curDate = momentCurDateObj.startOf('day').toISOString();
    let momentStartDateObj = moment(curCourse.startDate, 'MM-DD-YYYY');
    let startDate = momentStartDateObj.startOf('day').toISOString();
        
    if (startDate > curDate) {
      courseDetail['isTopPick'] = false;
      courseDetail['isLatest'] = true;
    } else {
      courseDetail['isTopPick'] = true;
      courseDetail['isLatest'] = false;
    }

    let totalDuration = 0;
    if (curCourse.totalDuration != "null") {
      let totalDurations = curCourse.totalDuration.toString().split(":");
      let hrs = parseInt(totalDurations[0]);
      let mins = (totalDurations.length > 1) ? parseInt(totalDurations[1]) : 0;
      let secs = (totalDurations.length > 2) ? parseInt(totalDurations[2]) : 0;
      totalDuration = (hrs*60*60)+(mins*60)+secs;
      if (totalDuration == "NaN")
        totalDuration = 0;
    }
    courseDetail['noOfModules'] = curCourse.noOfModules;
    courseDetail['totalDuration'] = totalDuration;
    courseDetail['subject'] = curCourse.subject;
    courseDetail['class'] = curCourse.department;
    courseDetail['certificationGroup'] = "";
    courseDetail['certificationGroupName'] = "";
    if (curCourse.certificationGroup) {
      const certification = certificationGroups.find((e) => e["id"].toString() === curCourse.certificationGroup.toString());
      courseDetail['certificationGroup'] = certification.id;
      courseDetail['certificationGroupName'] = certification.name;
    }
    courseDetail['class'] = curCourse.certificationGroup;
    courseDetail['userStatus'] = 'not-enrolled';
    courseDetail['remainingDuration'] = totalDuration;
    courseDetail['points'] = '';
    courseDetail['completion_date'] = '';
    
    if (coursesSuggestedForYou.indexOf(curCourse.id.toString()) > -1)
      courseDetail['userStatus'] = 'suggested';

    const checkLiveSession = liveSessions.find((p) => p['course'].toString() === curCourse.id.toString());
    const checkEnrollment = enrollments.find((p) => p['course'].toString() === curCourse.id.toString());

    if (checkLiveSession) {
      courseDetail['livesession'] = checkLiveSession;
    } else {
      courseDetail['livesession'] = "";
    }
    if (checkEnrollment && checkEnrollment['status'] == "in-progress") {
      courseDetail['userStatus'] = 'in-progress';
      courseDetail['points'] = checkEnrollment.points;
      courseDetail['remainingDuration'] = totalDuration;
    } else if (checkEnrollment && checkEnrollment['status'] == "completed") {
      courseDetail['userStatus'] = 'completed';
      courseDetail['points'] = checkEnrollment.points;
      courseDetail['completion_date'] = checkEnrollment.completionDate;
    }
    
    defer.resolve(courseDetail)
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function getAllCourses(userid) {
  //Query objects
  let defer = require('q').defer();
  try {
    let momentObj = moment(new Date(), 'MM-DD-YYYY');
    let checkDate = momentObj.endOf('day').toISOString();
    
    let query = {};
    query['isPublished'] = true;
    query['isActive'] = true;
    query["publishedDate"] = {};
    query["publishedDate"]["$lte"] = checkDate;
    query["$or"] = [];
    let queryEndDate = {};
    queryEndDate["endDate"] = {};
    queryEndDate["endDate"]["$exists"] = false;
    query["$or"].push(queryEndDate)
    queryEndDate = {};
    queryEndDate["endDate"] = {};
    queryEndDate["endDate"]["$gte"] = checkDate;
    query["$or"].push(queryEndDate)
    
    let curUser = await getCurrentUserDetails(userid);
    
    query['applicable_for'] = {}
    if (curUser[0] && curUser[0]['usertype'] == "spark") {
      if (curUser[0]['intern_user']) {
        query['applicable_for']["$in"] = ['Both','Intern','SparkIntern']      
      } else {
        query['applicable_for']["$in"] = ['Both','Spark','SparkIntern']      
      }
    } else if (curUser[0] && curUser[0]['usertype'] == "govt teacher") {
      query['applicable_for']["$in"] = ['Both','Teacher']      
    } else {
      query['applicable_for']["$in"] = ['Both','Child']       
    }
    
    //temporary sparks will get only pre-induction courses and others will get all courses irrespective of this condition
    if (curUser[0] && curUser[0]['temporary_user']) {
      query['isPreInductionCourse'] = true
    }
    
    const enrollments = await Enrollment.find({user: userid});
    const progressCourses = enrollments.filter((p) => p['status'].toString() === "in-progress");
    
    const enrolledCourseIds = enrollments.map(value => value.course);
    const progressCourseIds = progressCourses.map(value => value.course);

    let coursesSuggestedForYou = [];
    const certificationGroups = await Certification.find({},{name:1});
    let courseList = [];
    let liveSessions = [];
    if (progressCourseIds.length > 0) {
      const suggestedCourses = await Course.find({"_id":{"$in":progressCourseIds}})
      for (const curCourse of suggestedCourses) {
        let sub = curCourse.subject;
        let dept = curCourse.department;
        let suggestedCourse = await Course.distinct('_id',{"subject":sub, "department":dept})
        for (const courseId of suggestedCourse) {
            coursesSuggestedForYou.push(courseId.toString());
        }
      }
    }
    let queryLiveSession = {};
    queryLiveSession['startDate'] = {};
    queryLiveSession['startDate']['$gte'] = new Date();
    queryLiveSession['isActive'] = true;

    liveSessions = await Livesession.find(queryLiveSession);
    
    let finalQuery = {};
    finalQuery["$or"] = [];
    finalQuery["$or"].push(query);
    finalQuery["$or"].push({"_id":{"$in":enrolledCourseIds}});

    const courses = await Course.find(finalQuery);

    for (const curCourse of courses) {
      let course = await getCourseDetail(curCourse, enrollments, coursesSuggestedForYou, certificationGroups, liveSessions);
      if (course)
        courseList.push(course);
    }
    defer.resolve(courseList);
  } catch (e) {
    console.error(e);
    defer.reject(e);
    throw e;
  }
  return defer.promise
}

async function getModuleDetail(curModule, courseProgresses, userid, moduleProgresses) {
  let defer = q.defer()
  try {
    let videoids = [];
    let worksheetids = [];
    const courseProgress = courseProgresses.find((p) => p['module'].toString() === curModule.id.toString());
    const videos = await Video.find({"_id":{"$in":curModule.videos}},{name: 1, module: 1, url: 1, video_code: 1, description: 1, duration_min: 1, duration_sec: 1})
    let worksheets = [];
    if (curModule.worksheets.length > 1 || (curModule.worksheets.length == 1 && curModule.worksheets[0] != "")) {
      worksheets = await Document.find({"_id":{"$in":curModule.worksheets}},{name: 1, doc_url: 1})
    }
    let videoList = [];
    let steps = 0;
    for (const video of videos) {
      let videoData = {};

      let duration = "";
      if (video.duration_min != "" && video.duration_min != null) {
          duration = parseInt(video.duration_min)*60;
      }
      if (video.duration_sec != "" && video.duration_sec != null) {
          duration = duration + parseInt(video.duration_sec);
      }
      let progress = moduleProgresses.find((p) => p.module.toString() == curModule.id.toString() && p.viewedItemType.toString() == 'video' && p.viewedItem.toString() == video.id.toString());
      if (progress) {
        videoData['watched'] = true;
      } else {
        videoData['watched'] = false;
      }
      videoids.push(video.id.toString());
      videoData['id'] = video.id;
      videoData['name'] = video.name;
      videoData['description'] = video.description;
      videoData['url'] = config.repositoryHost + "samparkvideos/" + video.module + "/" + video.url;
      videoData['video_code'] = video.video_code;
      videoData['duration'] = duration;
      steps = steps + 1;
      videoData['display_count'] = (curModule.videos.indexOf(video["id"]) + 1).toString();
      videoData['sortOrder'] = curModule.videos.indexOf(video["id"]);
      videoList[curModule.videos.indexOf(video["id"])] = videoData
    }
    let worksheetList = [];
    let inc = steps + 1;
    for (const worksheet of worksheets) {
      let worksheetData = {};

      worksheetids.push(worksheet.id.toString());
      worksheetData['id'] = worksheet.id;
      worksheetData['name'] = worksheet.name;
      worksheetData['url'] = config.repositoryHost + worksheet.doc_url;
      let progress = moduleProgresses.find((p) => p.module.toString() == curModule.id.toString() && p.viewedItemType.toString() == 'worksheet' && p.viewedItem.toString() == worksheet.id.toString());
      if (progress) {
        worksheetData['watched'] = true;
      } else {
        worksheetData['watched'] = false;
      }
      steps = steps + 1;
      worksheetData['display_count'] = (curModule.worksheets.indexOf(worksheet["id"]) + inc).toString();
      worksheetData['sortOrder'] = curModule.worksheets.indexOf(worksheet["id"]);
      worksheetList[curModule.worksheets.indexOf(worksheet["id"])] = worksheetData
    }
    let videoswatched = await Sssvideoviewed.distinct('video',{ "user": userid, "video": {"$in":videoids} });
    videoswatched = videoswatched.map(function (item) {
        return item.toString();
    });
    for (const video of videoList) {
        if (videoswatched.indexOf(video.id.toString()) > -1)
          video["watched"] = true;
    }
    let worksheetswatched = await Documentviewed.distinct('document', { "user": userid, "doc_type": "worksheet" });
    worksheetswatched = worksheetswatched.map(function (item) {
        return item.toString();
    });
    for (const worksheet of worksheetList) {
        if (worksheetswatched.indexOf(worksheet.id.toString()) > -1)
          worksheet["watched"] = true;
    }
    let moduleDetail = {};
    let totalDuration = 0;
    if (curModule.duration != "null") {
      let totalDurations = curModule.duration.toString().split(":");
      let hrs = parseInt(totalDurations[0]);
      let mins = (totalDurations.length > 1) ? parseInt(totalDurations[1]) : 0;
      totalDuration = (hrs*60)+mins;
      if (totalDuration == "NaN")
        totalDuration = 0;
    }
    moduleDetail['id'] = curModule.id;
    moduleDetail['name'] = curModule.name;
    moduleDetail['image'] = config.repositoryHost+curModule.image;
    moduleDetail['duration'] = totalDuration;
    moduleDetail['description'] = curModule.description;
    moduleDetail['sortOrder'] = curModule.sortOrder;
    moduleDetail['userStatus'] = (courseProgress) ? courseProgress.status : 'not-started';
    moduleDetail['videos'] = videoList;
    moduleDetail['worksheets'] = worksheetList;
    moduleDetail['quiz'] = curModule.quiz;
    moduleDetail['quiz_display_count'] = (steps + 1).toString();
    moduleDetail['quizTaken'] = (courseProgress && courseProgress.status == "completed") ? true : false;

    defer.resolve(moduleDetail)
  } catch (e) {
    console.error(e);
    defer.reject(e);
    throw e;
  }
  return defer.promise
}

async function getCourseModules(userid, course) {
  let defer = require('q').defer();
  try {
    const courseDetail = await Course.findById(course);
    let query = {};
    query['course'] = course;
    const courseModules = await Coursemodule.find(query).sort({sortOrder: 1});
    query['user'] = userid;
    const courseProgresses = await Courseprogress.find(query);
    const moduleProgresses = await Moduleprogress.find(query);
    //const modulePr
    const courseEnrollment = await Enrollment.find(query);
    let courseStatus = "";
    let courseCompletionDate = "";
    let isCourseEnrolled = false;
    let enrollmentId = "";
    if (courseEnrollment && courseEnrollment.length == 1) {
      isCourseEnrolled = true;
      enrollmentId = courseEnrollment[0]['_id'];
      courseStatus = courseEnrollment[0]['status'];
      courseCompletionDate = courseEnrollment[0]['completionDate'];
    }
    let moduleList = [];
    for (const curModule of courseModules) {
      let courseMod = await getModuleDetail(curModule, courseProgresses, userid, moduleProgresses);
      if (courseMod)
        moduleList.push(courseMod);
    }
    let courseDetails = {};
    courseDetails['isCourseEnrolled'] = isCourseEnrolled;
    courseDetails['enrollmentId'] = enrollmentId;
    courseDetails['name'] = courseDetail['name']
    courseDetails['shareOnBaithak'] = true;
    courseDetails['description'] = courseDetail['description']
    courseDetails['startDate'] = courseDetail['startDate']
    courseDetails['endDate'] = courseDetail['endDate']
    courseDetails['rating'] = courseDetail['rating']
    courseDetails['status'] = courseStatus
    if (courseStatus == "completed")
      courseDetails['completionDate'] = courseCompletionDate
    else
      courseDetails['completionDate'] = ""
    courseDetails['introductoryTitle'] = courseDetail['introductoryTitle']
    courseDetails['introductoryImage'] = (courseDetail['introductoryImage']) ? config.repositoryHost+courseDetail['introductoryImage'] : ''
    courseDetails['introductoryDescription'] = courseDetail['introductoryDescription']

    let introductoryDuration = 0;
    if (courseDetail['introductoryDuration'] != "null") {
      let introductoryDurations = courseDetail['introductoryDuration'].toString().split(":");
      let mins = parseInt(introductoryDurations[0]);
      let secs = (introductoryDurations.length > 1) ? parseInt(introductoryDurations[1]) : 0;
      introductoryDuration = (mins*60)+secs;
      if (introductoryDuration == "NaN")
        introductoryDuration = 0;
    }
    courseDetails['introductoryDuration'] = introductoryDuration
    courseDetails['introductoryVideo'] = "";
    courseDetails['introductoryAudio'] = "";
    if (courseDetail['introductoryVideo']) {
      const video = await Video.find({"_id":courseDetail['introductoryVideo']})
      courseDetails['introductoryVideo'] = (video.length == 1) ? video[0].video_code : ""
    }
    if (courseDetail['introductoryAudio']) {
      const audio = await Audio.find({"_id":courseDetail['introductoryAudio']})
      courseDetails['introductoryAudio'] = (audio.length == 1) ? audio[0].audio_code : ""
    }
    courseDetails['liveSessionExists'] = courseDetail['liveSessionExists']

    let queryLiveSession = {};
    queryLiveSession['course'] = course;
    queryLiveSession['startDate'] = {};
    queryLiveSession['startDate']['$gte'] = new Date();
    queryLiveSession['isActive'] = true;

    const liveSesionDetails = await Livesession.find(queryLiveSession);
    if (liveSesionDetails && liveSesionDetails.length > 0) {
      courseDetails['liveSessionDetails'] = liveSesionDetails[0];
      courseDetails['liveSessionExists'] = true;
    } else {
      courseDetails['liveSessionExists'] = false;
    }
    courseDetails['modules'] = moduleList;

    defer.resolve(courseDetails);
  } catch (e) {
    console.error(e);
    defer.reject(e);
    throw e;
  }
  return defer.promise
}

async function enroll(req) {
  let defer = require('q').defer();
  try {
    let course = req.course;
    let user = req.user;
    
    let query = {};
    let queryUser = {};
    let enrollParams = {};
    query['course'] = course;
    query['user'] = user;
    queryUser['user'] = user;
    queryUser['status'] = 'in-progress';
    
    const checkCourse = await Course.find({"_id":course})
    let curDate = new Date();
    curDate.setHours(0,0,0,0);
    if (checkCourse.length == 1) {
      if (!checkCourse[0].isActive || !checkCourse[0].isPublished || checkCourse[0].publishedDate > curDate || checkCourse[0].startDate > curDate || (checkCourse[0].endDate !== null && checkCourse[0].endDate !== undefined && checkCourse[0].endDate <= curDate))
        throw new UserException("You cannot enroll this course",201); 
    } else {
      throw new UserException("Course does not exist",201);
    }
    const checkEnroll = await Enrollment.find(query)
    if (checkEnroll.length == 1) {
      throw new UserException("Already enrolled for this course",201);
    }
    const checkInProgressCourses = await Enrollment.countDocuments(queryUser)
    if (checkInProgressCourses >= 3) {
      throw new UserException("आप किसी भी एक समय पर 3 से अधिक पाठ्यक्रमों/कोर्स का नामांकन नहीं कर सकते हैं।  कृपया शुरू किये गए पाठ्यक्रम को सर्वप्रथम पूर्ण करें।",201);
      //throw new UserException("You cannot enroll for a new course, as you already have three courses in progress",201);
    }
    enrollParams['course'] = course;
    enrollParams['user'] = user;
    enrollParams['status'] = 'in-progress';
    enrollParams['updatedBy'] = user;
    let newEnrollment = new Enrollment(enrollParams);
    await newEnrollment.save()
    defer.resolve({success: true})
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function cancelEnrollment(req) {
  let defer = require('q').defer();
  try {
    let course = req.course;
    let user = req.user;
    
    let query = {};
    query['course'] = course;
    query['user'] = user;
    
    const checkEnroll = await Enrollment.find(query)

    if (checkEnroll.length == 1) {
      if (checkEnroll[0]['status'] == "completed") {
        throw new UserException("You cannot cancel the enrollment as you already completed the course",201);
      } else {
        await Enrollment.deleteMany(query)
        await Courseprogress.deleteMany(query)
        await Moduleprogress.deleteMany(query)
      }
    } else {
      throw new UserException("You were not enrolled for this course",201);
    }
    
    defer.resolve({success: true})
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function progressUpdate(req) {
  let defer = require('q').defer();
  try {
    let course = req.course;
    let user = req.user;
    let module = req.module;
    let viewedItemType = req.item_type;
    let viewedItem = req.item_id;
    let query = {};
    let updates = {};

    query['course'] = course;
    query['user'] = user;
    query['module'] = module;
    query['viewedItemType'] = viewedItemType;
    query['viewedItem'] = viewedItem;
    
    updates['course'] = course;
    updates['user'] = user;
    updates['module'] = module;
    updates['viewedItemType'] = viewedItemType;
    updates['viewedItem'] = viewedItem;
    updates['updatedDate'] = new Date();

    await Moduleprogress.updateOne(query, {$set: updates, $setOnInsert: {createdDate: new Date()}}, { upsert: true });
    const moduleDetail = await Coursemodule.findById(module);
    let moduleVideos = (moduleDetail && moduleDetail.videos) ? moduleDetail.videos.sort() : []
    let moduleWorksheets = (moduleDetail && moduleDetail.worksheets) ? moduleDetail.worksheets.sort() : []
    let moduleTotalProgressCount = moduleVideos.length + moduleWorksheets.length + 1;
    let moduleProgress = 0;
    let progresses = await Moduleprogress.aggregate([
      { $group: { _id: "$viewedItemType", ids: { $addToSet: "$viewedItem" } } }
    ]);
    for (const progress of progresses) {
      if (progress["_id"] && progress.ids) {
        let tempKey = progress["_id"].toString();
        let viewedItems = progress.ids.sort();
        
        if (tempKey == "worksheet") {
          let remainingWorksheets = moduleWorksheets.filter(function(val) {
            return viewedItems.indexOf(val) == -1;
          });
          moduleProgress = moduleProgress + (moduleWorksheets.length - remainingWorksheets.length);
        } else if (tempKey == "video") {
          let remainingVideos = moduleVideos.filter(function(val) {
            return viewedItems.indexOf(val) == -1;
          });
          moduleProgress = moduleProgress + (moduleVideos.length - remainingVideos.length);
        }
      }
    }
    if (moduleProgress > 0) {
      let queryC = {};
      let updatesC = {};
      queryC['course'] = course;
      queryC['user'] = user;
      queryC['module'] = module;
      
      updatesC['course'] = course;
      updatesC['user'] = user;
      updatesC['module'] = module;
      updatesC['status'] = 'in-progress';
      if (moduleProgress == moduleTotalProgressCount) {
        updatesC['status'] = 'completed';
      }
      updatesC['updatedDate'] = new Date();
      await Courseprogress.updateOne(queryC, {$set: updatesC, $setOnInsert: {createdDate: new Date()}}, { upsert: true });
    }
    defer.resolve({success: true})
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function saveFeedback(req) {
  let defer = require('q').defer();
  try {
    let course = req.course;
    let user = req.user;
    let feedback = req.feedback.trim();
    if (feedback == "") {
      throw new UserException("Kindly provide the feedback",201);
    }
    let rating = req.rating;
    let query = {};
    query['course'] = course;
    query['user'] = user;

    let checkEnroll = await Enrollment.find(query);

    if (checkEnroll && checkEnroll[0]) {
      if (checkEnroll[0]['status'] == 'completed') {
        let updates = {};
        updates['feedback'] = feedback;
        updates['rating'] = rating;
        updates['updatedDate'] = new Date();
        updates['feedbackDate'] = new Date();
        updates['updatedBy'] = user;
        await Enrollment.updateOne(query, updates);
        
        let queryF = {};
        queryF['course'] = checkEnroll[0]['course'];
        queryF['status'] = 'completed';
        queryF['feedback'] = {};
        queryF['feedback']['$exists'] = true;
        
        let dbFeedbacks = await Enrollment.find(queryF,{rating: 1});
        let totalRating = 0;
        for(const dbFeedback of dbFeedbacks) {
          totalRating = totalRating + dbFeedback.rating;
        }
        let avgRating = totalRating / dbFeedbacks.length;
        await Course.updateOne({"_id":checkEnroll[0]['course']},{"$set":{rating:avgRating.toFixed(2)}});
        defer.resolve({success: true})
      } else {
        throw new UserException("You have not completed the course. Complete it for giving feedback",201);
      }
    } else {
      throw new UserException("You have not enrolled in the course",201);
    }   
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function feedbacks(course, userid, pageNo) {
  let defer = require('q').defer();
  try {
    let skip = 0;
    let perPage = 5;
    if (pageNo == "" || pageNo == 0 || pageNo == "0") {
        skip = 0;
    } else {
        skip = (pageNo-1) * perPage;
    }
    let query = {};
    query['course'] = course;
    query['status'] = 'completed';
    query['feedback'] = {};
    query['feedback']['$exists'] = true;
    
    let feedbacks = [];
    let feedbacklikes = await Feedbacklike.distinct('enrollment',{user: userid})
    feedbacklikes = feedbacklikes.map(function (item) {
      return item.toString();
    });
    let dbFeedbacks = await Enrollment.find(query,{feedback: 1, rating: 1, likes: 1, feedbackDate: 1, videos: 1}).populate('user',['fullName','image']).sort({feedbackDate: -1}).limit(perPage).skip(skip)
    for (const dbFeedback of dbFeedbacks) {
      let feedback = {};
      feedback['id'] = dbFeedback.id;
      feedback['likes'] = dbFeedback.likes;
      feedback['rating'] = dbFeedback.rating;
      feedback['feedback'] = dbFeedback.feedback;
      
      feedback['video'] = "";
      if (dbFeedback.videos.length > 0) {
        let video = dbFeedback.videos[dbFeedback.videos.length-1]
        let videodetail = await Videostream.findById(video)
        if (videodetail) {
          feedback['video'] = videodetail;
        }
      }
      feedback['feedback_date'] = dbFeedback.feedbackDate;
      if (feedbacklikes.indexOf(dbFeedback.id.toString()) > -1){
        feedback['is_liked'] = 1;
      } else {
        feedback['is_liked'] = 0;
      }
      feedback['user'] = {};
      feedback['user']['id'] = dbFeedback.user.id
      feedback['user']['fullName'] = dbFeedback.user.fullName;
      feedback['user']['image'] = (dbFeedback.user.image != "" && dbFeedback.user.image != null) ? config.repositoryHost + dbFeedback.user.image : config.user_image;
      feedbacks.push(feedback);
    }
    defer.resolve(feedbacks)
  } catch (e) {
    console.error(e);
    defer.reject(e);
    throw e;
  }
  return defer.promise
}

async function likeFeedback(req) {
  let defer = require('q').defer();
  try {
    let user = req.user;
    let enrollment = req.enrollment;
    let is_liked = req.is_liked;
    
    let query = {};
    query.enrollment = enrollment;
    let likeCount = await Feedbacklike.countDocuments(query);
    let updates = {};
    updates.enrollment = enrollment;
    if (is_liked == "true") {
      query.user = user;
      let dbObject = await Feedbacklike.updateOne(query, {$set: query, $setOnInsert: {createdDate: new Date()}}, { upsert: true });
      if (dbObject['upserted']) {
        likeCount = likeCount + 1;
      }
    } else {
      let dbObject = await Feedbacklike.deleteOne({enrollment: enrollment, user: user})
      if (dbObject['deletedCount']) {
        likeCount = likeCount - 1;
      }
    }
    await Enrollment.updateOne({"_id":enrollment},{"$set":{likes: likeCount}});
    defer.resolve({success: true})
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function liveSessionRequest(req) {
  let defer = require('q').defer();
  try {
    let livesession = req.livesession;
    let user = req.user;
    let status = req.status;
    
    let query = {};
    let livesessionParams = {};
    query['livesession'] = livesession;
    query['user'] = user;
    
    const checkLiveSession = await Livesessionattendance.find(query)

    if (checkLiveSession.length == 0) {
      livesessionParams['livesession'] = livesession;
      livesessionParams['user'] = user;
      livesessionParams['acceptance'] = status;
      let newLivesession = new Livesessionattendance(livesessionParams);
      await newLivesession.save()
    }
    defer.resolve({success: true})
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

/*
This API is to get questions by assessment ids
*/
async function getQuizQuestions(assessmentId) {
  let defer = require('q').defer();
  try {
    //Split them into array
    let arrAssessmentIds = [assessmentId];

    let query = {};
    let finalArray = [];

    //To get active assessments based on class id
    query['isActive'] = true;
    query['questionType'] = "objective";
    query['assessment'] = { '$in': arrAssessmentIds };

    const assessmentQuestions = await AssessmentQuestion.find(query);

    let queryAssess = {};

    //To get active assessments based on class id
    queryAssess['isActive'] = true;

    const Assessments = await Assessment.find(queryAssess);

    //To do groupby on department of assessments received
    let questionsGroupByAssessment = _.groupBy(assessmentQuestions, 'assessment');

    //Loop through objects
    for (const assessId in questionsGroupByAssessment) {
      let questionList = {};

      //Assigning required class info to a final object
      questionList['id'] = assessId;

      //To get assessment details
      let assessmentName = _.where(Assessments, { id: assessId });

      questionList['name'] = assessmentName[0]['lesson'];
      questionList['level'] = assessmentName[0]['level'];
      questionList['timeLimit'] = assessmentName[0]['duration'];

      let requiredCnt = questionsGroupByAssessment[assessId].length >= 21 ? 21 : questionsGroupByAssessment[assessId].length;
      questionList['displayQuestionsCnt'] = requiredCnt - 1;

      questionList['instructions'] = {};
      questionList['instructions']['rules'] = [];
      questionList['instructions']['point_system'] = [];

      let maxMarks = (assessmentName[0]['maxMarks']) ? assessmentName[0]['maxMarks'] : assessmentName[0]['displayQuestionsCnt'];
      let perQuestionPoint = (parseFloat(maxMarks) / parseFloat(questionList['displayQuestionsCnt'])).toFixed(1);
      let rule1 = 'You have to score over 80% to complete this module successfully.';
      let rule2 = 'You will get 3 Lifelines.';
      let rule3 = 'Maximum time taken should be '+assessmentName[0]['duration']+' minutes.';
      let point1 = '+'+perQuestionPoint+' for each correct answer.';
      let point2 = 'Each unused Lifelines earn you  5 points.';
      let point3 = 'If you complete the quiz within stipulated time, you  earn 5 points.';

      questionList['instructions']['rules'].push(rule1);
      questionList['instructions']['rules'].push(rule2);
      questionList['instructions']['rules'].push(rule3);
      questionList['instructions']['point_system'].push(point1);
      questionList['instructions']['point_system'].push(point2);
      questionList['instructions']['point_system'].push(point3);

      //Array of questions
      let questionArr = [];

      for (const assessIndex in questionsGroupByAssessment[assessId]) {
        let questionInnerObj = questionsGroupByAssessment[assessId][assessIndex];

        //Each question as an object
        let questionObj = {};

        questionObj['id'] = questionInnerObj['id'];
        questionObj['question'] = questionInnerObj['question'];
        questionObj['sentence'] = questionInnerObj['sentence'] ? questionInnerObj['sentence'] : '';
        questionObj['questionType'] = questionInnerObj['questionType'] ? questionInnerObj['questionType'] : 'objective';
        questionObj['optionType'] = questionInnerObj['optionType'] ? questionInnerObj['optionType'] : '';
        questionObj['isAudioEnabled'] = questionInnerObj['isAudioEnabled'] ? questionInnerObj['isAudioEnabled'] : '';
        
        if (questionObj['questionType'] == "ml-b") {
          let optionKeys = Object.keys(questionInnerObj['options'])
          let optionValues = Object.values(questionInnerObj['options'])
          await shuffle(optionValues)
          let newOptions = {}
          for (let i=0; i<optionKeys.length; i++) {
            newOptions[optionKeys[i]] = optionValues[i]
          }
          questionObj['options'] = newOptions;
        } else {
          questionObj['options'] = questionInnerObj['options'];
        }
           
        questionObj['question_image'] = questionInnerObj['question_image'] ? config.repositoryHost + questionInnerObj['question_image'] : '';

        if(!_.isEmpty(questionInnerObj['options_image'])) {
          questionInnerObj['options_image']['a'] = questionInnerObj['options_image']['a'] ? config.repositoryHost + questionInnerObj['options_image']['a'] : '';
          questionInnerObj['options_image']['b'] = questionInnerObj['options_image']['b'] ? config.repositoryHost + questionInnerObj['options_image']['b'] : '';
          questionInnerObj['options_image']['c'] = questionInnerObj['options_image']['c'] ? config.repositoryHost + questionInnerObj['options_image']['c'] : '';
          questionInnerObj['options_image']['d'] = questionInnerObj['options_image']['d'] ? config.repositoryHost + questionInnerObj['options_image']['d'] : '';
          questionObj['options_image'] = questionInnerObj['options_image'];
        } else {
          questionObj['options_image'] = {};
        }
        
        let questionOptions = {}
				Object.keys(questionObj['options']).forEach(function(option) {
					if (questionObj['options'][option] == "") {
						questionOptions[option] = option
					} else {
						questionOptions[option] = questionObj['options'][option]
					}
				});
				questionObj['options'] = questionOptions
				let correctAnswerKeys = Object.keys(questionInnerObj['correctAnswer'])
				let correctAnswerKey = correctAnswerKeys[0]

				if (questionInnerObj['correctAnswer'][correctAnswerKey] == "") {
					questionInnerObj['correctAnswer'][correctAnswerKey] = correctAnswerKey
				}
				questionObj['correctAnswer'] = questionInnerObj['correctAnswer'];
        
        //Push each object to an array
        questionArr.push(questionObj);

        //Push all assessments to final object
        questionList['questions'] = questionArr;
      }

      //Assign final object to an array
      finalArray.push(questionList);
    }

    defer.resolve(finalArray);
  } catch (e) {
    console.error(e);
    defer.reject(e);
    throw e;
  }
  return defer.promise
}

async function getUserDetails(userid) {
  let defer = require('q').defer()
  try {
    if (userid) {
      let curUser = await User.find({ "_id": userid });
      defer.resolve(curUser)
    } else {
      defer.resolve("")
    }
  } catch (e) {
    console.log(e)
    throw e
    defer.reject(e)
  }
  return defer.promise
}

async function uploadVideo(req) {
  let defer = require('q').defer()
  try {
    const fs = require('fs')
    let data = req;
    let dir = "";
    let uploadFolder = "";
    dir = config.uploadPath + 'uservideos/';
    uploadFolder = "uservideos"
    let course = data.body.course;
    let user_groups = [];
    let enrollmentCheck = await Enrollment.find({course: course, user: data.body.user})
    if (enrollmentCheck && enrollmentCheck.length == 1) {
      /**
       * Below logic will get user details from database and update social hours if available.
       */
      let curUser = await getUserDetails(data.body.user);
      let curUserGroup = "";
      let curUserState = "";
      let curUserDistrict = "";
      let curUserLocation = "";
      if (curUser.length > 0) {

        curUser = curUser[0];

        curUserGroup = curUser.usertype;
        curUserState = curUser.state.toString();
        curUserDistrict = curUser.district;
        curUserLocation = curUser.location;
        india_ids = Object.keys(config.india_user_ids);
        if (india_ids.indexOf(curUser.id.toString()) !== -1) {
          curUserLocation = "India"
        }
      } //end of if condition checking for user record availability

      let sampark_didi_ids = Object.keys(config.sampark_didi_ids);

      for (const usergroup in config.user_groups) {
        user_groups.push(usergroup)
      }
      if (dir != '') {
        let uploadData;
        let sampleFile;
        if (!data.files || Object.keys(data.files).length === 0) {
          throw new UserException("File not uploaded",201);
        }
        sampleFile = data.files.file;
        uploadData = await uploadToS3(sampleFile, uploadFolder);
        let postDescription = "";
        if (isBase64(data.body.message)) {
          let buff = new Buffer(data.body.message, 'base64');
          postDescription = decodeURIComponent(buff);
        } else {
          postDescription = data.body.message;
        }
        let uservideostream = {};
        let streamData = {};

        let uploadResponse = await uploadOnYouTube(sampleFile, uploadData.Key, postDescription);
        if (uploadResponse["status"] == 200) {
          let youtubeID = uploadResponse['data']['id'];
          let durationMin = 0;
          let durationSec = 0;
          let duration = uploadResponse['data']['contentDetails']['duration'];
          let arr = duration.split('M');
          if (arr && arr.length == 2) {
            durationMin = arr[0].replace('PT', '');
            durationSec = arr[1].replace('S', '');
          }

          uservideostream = new Videostream({
            name: "",
            youtube_code: youtubeID,
            duration_min: durationMin,
            duration_sec: durationSec,
            sort_order: 0,
            description: data.body.message,
            author: data.body.user,
            createdBy: data.body.user,
            updatedBy: data.body.user,
            thumbnail: "",
            is_shareable: true
          });
          uservideostream.save();
          streamData.item_type = "video";
          streamData.item_id = uservideostream.id;
          streamData.user_groups = user_groups;
          streamData.states = [curUserState];
          if (curUserDistrict !== "")
            streamData.district = curUserDistrict;
          if (curUserLocation !== "")
            streamData.location = curUserLocation;

          streamData.priority = 1;
          if (sampark_didi_ids.indexOf(data.body.user.toString()) >= 0) {
            streamData.is_sampark_didi_post = true;

          } else {
            streamData.is_sampark_didi_post = false;

          }
          const stream = new Stream(streamData);
          await stream.save();
          let enrollVideos = (enrollmentCheck[0]['videos']) ? enrollmentCheck[0]['videos'] : [];
          enrollVideos.push(uservideostream.id)
          await Enrollment.updateOne({"_id":enrollmentCheck[0]["_id"]},{"$set":{videos: enrollVideos}});
        
          defer.resolve({ success: true })
        } else {
          defer.resolve({ success: false })
        }
      } else {
        throw new UserException("Incorrect Post",201);
      }
    } else {
      throw new UserException("Not enrolled for the course",201);
    }
  } catch (e) {
    console.log(e)
    defer.reject(e)
  }
  return defer.promise
}

/*
This API is to save assessment results
*/
async function saveQuizResults(assessDetails) {

  if (!_.isEmpty(assessDetails)) {

    try {
      let moduleId = "";
      let courseId = "";
      let moduleDetails = await Coursemodule.find({"_id":assessDetails['moduleId']})
      if (moduleDetails.length == 1) {
        moduleId = moduleDetails[0]['_id'];
        courseId = moduleDetails[0]['course'];
      }
      let departmentId = "";
      let subjectId = "";
      let maxMarks = 0;
      let pointValue = 1;
      let maxDuration = 0;
      let assessmentDetails = await Assessment.find({"_id":assessDetails['assessmentId']})
      if (assessmentDetails.length == 1) {
        departmentId = assessmentDetails[0]['departmentId'];
        subjectId = assessmentDetails[0]['subjectId'];

        maxMarks = (assessmentDetails[0]['maxMarks']) ? assessmentDetails[0]['maxMarks'] : assessmentDetails[0]['displayQuestionsCnt'];
        pointValue = (parseFloat(maxMarks) / parseFloat(assessmentDetails[0]['displayQuestionsCnt'])).toFixed(1);
        
        maxDuration = assessmentDetails[0]['duration'];
      }
      let enrollmentId = assessDetails['enrollmentId'];
      //To check if already test has been taken      
      
      let checkCourseProgress = await Courseprogress.find({course: courseId, module: moduleId, user: assessDetails['loggedInUserID']});
      if (checkCourseProgress.length == 1) {
        let lastStatus = checkCourseProgress[0]['status'];
        if (lastStatus == "completed") {
          throw new UserException("You have already given the quiz and completed the module",201);
        }
      }

      let stateId = assessDetails['stateId'];
      let entryType = assessDetails['entryType'];
      let type = assessDetails['type'];
      let lifeLineRemaining = assessDetails['lifeLineRemaining'];

      let studentAnswers = []
      //If answers are there fill answers table
      if (assessDetails.questions.length) {

        let questionArr = assessDetails.questions;
        for (i = 0; i < questionArr.length; i++) {
          let studentAnswer = {}
          studentAnswer['question'] = questionArr[i]['id']
          studentAnswer['selectedAnswer'] = questionArr[i]['enteredAnswer']
          studentAnswer['correctAnswer'] = questionArr[i]['correctAnswer']
          studentAnswer['type'] = type
          studentAnswers.push(studentAnswer)
        }
      }
      //Insert assessment student progess collection
      const studentAssessProgress = new AssessmentStudentProgress({
        enrollment: enrollmentId,
        module: moduleId,
        course: courseId,
        student: assessDetails['studentId'],
        assessment: assessDetails['assessmentId'],
        state: stateId,
        department: departmentId,
        subject: subjectId,
        correctQuestionCnt: assessDetails['correctQuesionCnt'],
        totalQuestionCnt: assessDetails['totalQuesionCnt'],
        entryType: entryType,
        completionDuration: assessDetails['completionDuration'],
        countOfStar: assessDetails['countOfStar'],
        type: type,
        answers: studentAnswers,
        createdBy: new objectId(assessDetails['loggedInUserID']),
        modifiedBy: new objectId(assessDetails['loggedInUserID'])
      });

      await studentAssessProgress.save();
      
      let pointsForTime = 0;
      let percentageValue = (parseFloat(assessDetails['correctQuesionCnt'])/parseFloat(assessDetails['totalQuesionCnt'])) * 100;
      let percentage = percentageValue.toFixed(2);
      let modulePoints = 0;

      let totalPoints = pointValue * assessDetails['correctQuesionCnt'];
      if (assessDetails['completionDuration'] <= maxDuration) {
        pointsForTime = 5;
        totalPoints = totalPoints + pointsForTime;
      }
      let lifeLinePonts = lifeLineRemaining * 5;
      totalPoints = totalPoints + lifeLinePonts;
      if (percentage >= 80) {
        modulePoints = totalPoints;
      }
      let newQuizResult = {
        correctQuestionCnt: assessDetails['correctQuesionCnt'],
        totalQuestionCnt: assessDetails['totalQuesionCnt'],
        completionDuration: assessDetails['completionDuration'],
        countOfStar: assessDetails['countOfStar'],
        lifeLinePonts: lifeLinePonts,
        pointsForTime: pointsForTime,
        percentage: percentage,
        points: totalPoints
      }

      let result = {};
      result['retry'] = true;
      result['points'] = newQuizResult;
      if (checkCourseProgress.length == 1) {
        quizResults = checkCourseProgress[0]['quizResults']
        quizResults.push(newQuizResult);
        let updateSet = {};
        updateSet['quizResults'] = quizResults;
        if (percentage >= 80) {
          updateSet['status'] = 'completed';
          result['retry'] = false;
        }
        await Courseprogress.updateOne({course: courseId, module: moduleId, user: assessDetails['loggedInUserID']},{"$set":updateSet})
      } else {
        quizResults = [];
        quizResults.push(newQuizResult);
        
        let newCourseProgress = new Courseprogress();
        newCourseProgress['course'] = courseId;
        newCourseProgress['module'] = moduleId;
        newCourseProgress['user'] = assessDetails['loggedInUserID'];
        newCourseProgress['quizResults'] = quizResults;
        if (percentage >= 80) {
          newCourseProgress['status'] = 'completed';
          result['retry'] = false;
        } else {
          newCourseProgress['status'] = 'in-progress';
        }
      }
      let maxAttemptsAllowed = 0;
      result['attempts_left'] = ((maxAttemptsAllowed - quizResults.length) >= 0) ? (maxAttemptsAllowed - quizResults.length) : 0;
      //check course completeness
      const courseModules = await Coursemodule.countDocuments({"course":courseId})
      const courseModulesCompleted = await Courseprogress.countDocuments({"user": assessDetails['loggedInUserID'], "course":courseId, "status":"completed"})
      if (courseModules == courseModulesCompleted) {
        completionDate = new Date();
        await Enrollment.updateOne({"_id":enrollmentId},{"$inc" : {"points":modulePoints}, "$set":{"status":"completed", completionDate: completionDate}})
        
        let checkusercertificate = await Usercertificate.countDocuments({user: assessDetails['loggedInUserID'], course: courseId})
        if (checkusercertificate == 0) {
          let certificateP = await createCertificate(courseId, assessDetails['loggedInUserID']);
          let usercerticate = new Usercertificate();
          usercerticate.user = assessDetails['loggedInUserID'];
          usercerticate.course = courseId;
          usercerticate.path = certificateP;
          if (await usercerticate.save()) {
            console.log("CERTIFICATE SAVED")
          }
        }
        let completedCourses = await Enrollment.distinct('course',{"user":new objectId(assessDetails['studentId']), "status":"completed"})
        let completedCourseCount = completedCourses.length;
        
        const goldBadgesCnt = await Userbadge.countDocuments({ user: new objectId(assessDetails['studentId']), badge: 'gold', type: 'elearning' });
        const silverBadgesCnt = await Userbadge.countDocuments({ user: new objectId(assessDetails['studentId']), badge: 'silver', type: 'elearning' });
        const bronzeBadgesCnt = await Userbadge.countDocuments({ user: new objectId(assessDetails['studentId']), badge: 'bronze', type: 'elearning' });
        
        let newBronzeBadgesCnt = parseInt(completedCourseCount / 3) - bronzeBadgesCnt;
        let newSilverBadgesCnt = parseInt(completedCourseCount / 6) - silverBadgesCnt;
        let newGoldBadgesCnt = parseInt(completedCourseCount / 12) - goldBadgesCnt;
        
        for (i=0; i<newBronzeBadgesCnt; i++) {
          let newBadge = new Userbadge({ user: new objectId(assessDetails['studentId']), badge: 'bronze', type: 'elearning' })
          await newBadge.save()
        }
        
        for (i=0; i<newSilverBadgesCnt; i++) {
          let newBadge = new Userbadge({ user: new objectId(assessDetails['studentId']), badge: 'silver', type: 'elearning' })
          await newBadge.save()
        }
        
        for (i=0; i<newGoldBadgesCnt; i++) {
          let newBadge = new Userbadge({ user: new objectId(assessDetails['studentId']), badge: 'gold', type: 'elearning' })
          await newBadge.save()
        }
        
        await User.updateOne({"_id":assessDetails['loggedInUserID']},{"$set" : {"noOfCompletedCourses": completedCourseCount}})
      } else {
        await Enrollment.updateOne({"_id":enrollmentId},{"$inc" : {"points":modulePoints}})
      }

      return result;
      
    } catch (e) {
      throw e //'Exception came while inserting into database';
    }
  } else {
    throw 'Assessment results needs to be passed in json format';
  }
}

/*
This API is to give assessment results
*/
async function getQuizResults(assessDetails) {
  if (!_.isEmpty(assessDetails)) {
    try {
      let moduleId = assessDetails['moduleId'];
      let courseId = "";
      let assessmentId = assessDetails['assessmentId'];

      let moduleDetails = await Coursemodule.find({"_id":assessDetails['moduleId']})
      if (moduleDetails.length == 1) {
        courseId = moduleDetails[0]['course'];
      } else {
        throw new UserException("Module does not exists",201);
      }
      let enrollmentDetails = await Enrollment.find({"course":courseId, "user":assessDetails['loggedInUserID']})
      let enrollmentId = "";
      if (enrollmentDetails.length == 1) {
        enrollmentId = enrollmentDetails[0]["_id"];
      } else {
        throw new UserException("You have not enrolled for the course",201);
      }
      
      const studentProgresses = await AssessmentStudentProgress.find({"enrollment":enrollmentId, "module":moduleId, "course":courseId, "student":assessDetails['loggedInUserID'], "assessment":assessmentId});
      if (studentProgresses.length == 0) {
        throw new UserException("You have not given the assessment",201);
      }
      
      const studentProgress = studentProgresses[studentProgresses.length-1];
  
      let result = {};
      result['progress'] = studentProgress;
      result['answers'] = studentProgress.answers;
      return result;
  
    } catch (e) {
      console.error(e);
      throw e; //'Exception came while inserting into database';
    }
  } 
}

async function createCertificate(course, user) {
  let promises1 = [];
  let im = require('imagemagick');
  let certificateName = "";
  let userUpdatedCertificates = [];
  const curUser = await User.findById(user);
  const curCourse = await Course.findById(course);
  const enrollment = await Enrollment.find({"course":course, "user":user})
  if (enrollment && enrollment.length >= 1) {
    let allotdate = enrollment[0]['completionDate'];
    if (curUser.fullName !== undefined && curUser.fullName !== null)
      certificateName = curUser.fullName.toUpperCase();
    else
      certificateName = curUser.firstName.toUpperCase() + ((curUser.lastName !== undefined && curUser.lastName !== null) ? " " + curUser.lastName.toUpperCase() : "");

    let allotdatestring = allotdate.getDate() + '-' + (allotdate.getMonth() + 1) + '-' + allotdate.getFullYear();
    try {
      const certificateUrl = config.assetHost + "course-certificate.png";
      await downloadFileFromURL(certificateUrl, config.uploadPath, "course-certificate.png");
    } catch (e) {
      console.log("File not downloaded" + "course-certificate.png");
      console.log(e);
    }
    let usercertificatepath = config.uploadPath + 'usercertificates/' + user + "_" + course + '.png';
    let mastercertificatepath = config.uploadPath + 'course-certificate.png';
    const obj = {
      key: course,
      value: user + "_" + course + '.png'
    };
    userUpdatedCertificates.push(obj);
    let p = new Promise((resolve, reject) => {
      if (curCourse.isNameInHindi) {
        if (curCourse.englishTitle == "") {
          let optionsObj = [mastercertificatepath, '-flatten', '-font', 'Lohit-Devanagari', '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,450 '"+ curCourse.name +"'", usercertificatepath];
          im.convert(optionsObj, function (err, stdout) {
            if (err) reject(err);

            let optionsObj1 = [usercertificatepath, '-flatten', '-font', 'Utopia-Regular', '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,615 '" + certificateName + "' text 0,740 '" + allotdatestring + "'", usercertificatepath];

            im.convert(optionsObj1, function (err, stdout) {
              if (err) reject(err);
              resolve("Converted Image successfully 2");
            });
          });
        } else {
          let optionsObj = [mastercertificatepath, '-flatten', '-font', 'Utopia-Regular', '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,450 '"+ curCourse.englishTitle +"' text 0,615 '" + certificateName + "' text 0,740 '" + allotdatestring + "'", usercertificatepath];

          im.convert(optionsObj, function (err, stdout) {
            if (err) reject(err);
            resolve("Converted Image successfully 2");
          });
        }
      } else {
        let optionsObj = [mastercertificatepath, '-flatten', '-font', 'Utopia-Regular', '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,450 '"+ curCourse.name +"' text 0,615 '" + certificateName + "' text 0,740 '" + allotdatestring + "'", usercertificatepath];

        im.convert(optionsObj, function (err, stdout) {
          if (err) reject(err);
          resolve("Converted Image successfully 2");
        });
      }
    });
    promises1.push(p)

    try {
      await Promise.all(promises1);
      try {
        try {
          const fs = require('fs')
          const certFile = fs.createReadStream(usercertificatepath);
          await uploadStreamToS3(certFile, "usercertificates", user + "_" + course + '.png');          
          const filePathMasterCertificate = path.resolve(config.uploadPath + 'course-certificate.png');
          fs.unlinkSync(filePathMasterCertificate);
        } catch (e) {
          console.error(e);
          throw e
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    }
    catch (err) {
      console.error(e);
      throw err;
    }
  } else {
    throw new UserException("Not enrolled for the course",201);
  }
  return 'usercertificates/' + user + "_" + course + '.png';
}

/*
This API is to give course certifictae
*/
async function getCertificate(assessDetails) {
  let defer = require('q').defer();
  
  try {
    if (!_.isEmpty(assessDetails)) {
      if (assessDetails['courseId'] && assessDetails['loggedInUserID']) {
        let checkusercertificate = await Usercertificate.find({user: assessDetails['loggedInUserID'], course: assessDetails['courseId']})
        let certificate = ""
        if (checkusercertificate.length == 0) {
          certificate = await createCertificate(assessDetails['courseId'], assessDetails['loggedInUserID'])
          let usercerticate = new Usercertificate();
          usercerticate.user = assessDetails['loggedInUserID'];
          usercerticate.course = assessDetails['courseId'];
          usercerticate.path = certificate;
          if (await usercerticate.save()) {
            console.log("CERTIFICATE SAVED")
          }
        } else {
          certificate = checkusercertificate[0]['path']
        }
      
        defer.resolve(config.repositoryHost + certificate)
      }
    } else {
      throw 'Assessment results needs to be passed in json format';
    }
  } catch (e) {
    console.log(e);
    defer.reject(e);
    throw e;
  }
  return defer.promise
}

function sortProperties(obj)
{
  // convert object into array
	var sortable=[];
	for(var key in obj)
		if(obj.hasOwnProperty(key))
			sortable.push([key, obj[key]]); // each item is an array in format [key, value]
	
	// sort items by value
	sortable.sort(function(a, b)
	{
	  return b[1]-a[1]; // compare numbers
	});
	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}

function sortObjects(objects) {
    var newObject = {};
    var sortedArray = sortProperties(objects, 'zindex', true, false);
    let loopend = sortedArray.length;
    if (loopend > 10)
      loopend = 10;
    for (var i = 0; i < loopend; i++) {
        var key = sortedArray[i][0];
        var value = sortedArray[i][1];
        newObject[key] = value;
    }
    return newObject;
}
