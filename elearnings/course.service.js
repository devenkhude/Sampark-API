//'use strict'
const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
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
const q = require("q");
const path = require("path");
const isBase64 = require("is-base64");
const moment = require("moment");
const _ = require("underscore");
const { ObjectId } = require("mongodb");
const objectId = require("mongoose").Types.ObjectId;

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
  getCertificate: getCertificate,
};

function UserException(message, error_status) {
  this.message = message;
  this.error_status = error_status;
}

async function getCourseDetail(
  curCourse,
  enrollments,
  coursesSuggestedForYou,
  certificationGroups,
  liveSessions
) {
  const defer = q.defer();
  try {
    const courseDetail = {
      id: curCourse?.id,
      name: curCourse?.name,
      description: curCourse?.description,
      rating: curCourse?.rating,
      startDate: curCourse?.startDate,
      endDate: curCourse?.endDate,
      isPublished: curCourse?.isPublished,
      publishedDate: curCourse?.publishedDate,
      image: config?.repositoryHost + curCourse?.image,
      introductoryImage: curCourse?.introductoryImage
        ? config?.repositoryHost + curCourse?.introductoryImage
        : "",
    };

    const momentCurDateObj = moment();
    const curDate = momentCurDateObj.startOf("day").toISOString();
    const momentStartDateObj = moment(curCourse.startDate);
    const startDate = momentStartDateObj.startOf("day").toISOString();

    courseDetail.isTopPick = startDate > curDate;
    courseDetail.isLatest = !courseDetail.isTopPick;

    let totalDuration = 0;
    if (curCourse?.totalDuration !== "null") {
      const totalDurations = curCourse?.totalDuration?.split(":").map(Number);
      totalDuration = totalDurations.reduce(
        (acc, val, index) =>
          acc + val * Math.pow(60, totalDurations.length - 1 - index),
        0
      );
    }

    courseDetail.noOfModules = curCourse?.noOfModules;
    courseDetail.totalDuration = totalDuration;
    courseDetail.subject = curCourse?.subject;
    courseDetail.class = curCourse?.department;
    courseDetail.certificationGroup = "";
    courseDetail.certificationGroupName = "";

    if (curCourse?.certificationGroup) {
      const certification = certificationGroups.find(
        (e) => e.id.toString() === curCourse?.certificationGroup?.toString()
      );
      courseDetail.certificationGroup = certification?.id || "";
      courseDetail.certificationGroupName = certification?.name || "";
    }

    courseDetail.class = curCourse?.certificationGroup;
    courseDetail.userStatus = "not-enrolled";
    courseDetail.remainingDuration = totalDuration;
    courseDetail.points = "";
    courseDetail.completion_date = "";

    if (coursesSuggestedForYou.includes(curCourse.id.toString()))
      courseDetail.userStatus = "suggested";

    const checkLiveSession = liveSessions.find(
      (p) => p.course.toString() === curCourse.id.toString()
    );
    const checkEnrollment = enrollments.find(
      (p) => p.course.toString() === curCourse.id.toString()
    );

    courseDetail.livesession = checkLiveSession || "";

    if (checkEnrollment) {
      courseDetail.userStatus = checkEnrollment?.status;
      courseDetail.points = checkEnrollment?.points || "";
      courseDetail.remainingDuration = totalDuration;
      courseDetail.completion_date = checkEnrollment?.completionDate || "";
    }

    defer.resolve(courseDetail);
  } catch (e) {
    console.log("Error in: ", error, "getCourseDetail");
    defer.reject(e);
  }
  return defer.promise;
}

async function getAllCourses(userid) {
  //Query objects
  const defer = require("q").defer();
  try {
    const momentObj = moment();
    const checkDate = momentObj.endOf("day").toISOString();

    const query = {
      isPublished: true,
      isActive: true,
      publishedDate: { $lte: checkDate },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: checkDate } }],
    };

    const curUser = await getCurrentUserDetails(userid);

    const userType = curUser[0]?.usertype || "";
    const isInternUser = curUser[0]?.intern_user || false;
    const isTemporaryUser = curUser[0]?.temporary_user || false;

    if (userType === "spark") {
      const applicableForValues = isInternUser
        ? ["Both", "Intern", "SparkIntern"]
        : ["Both", "Spark", "SparkIntern"];
      query.applicable_for = { $in: applicableForValues };
    } else if (userType === "govt teacher") {
      query.applicable_for = { $in: ["Both", "Teacher"] };
    } else {
      query.applicable_for = { $in: ["Both", "Child"] };
    }

    if (isTemporaryUser) {
      query.isPreInductionCourse = true;
    }

    console.log("Query: ", query, "getAllCourses");

    const enrollments = await Enrollment.find({ user: userid });
    const progressCourses = enrollments.filter(
      (p) => p.status === "in-progress"
    );

    const enrolledCourseIds = enrollments.map((value) => value.course);
    const progressCourseIds = progressCourses.map((value) => value.course);

    const coursesSuggestedForYou = progressCourseIds.reduce(
      (acc, curCourseId) => {
        const suggestedCourses = enrollments
          .filter(
            (enrollment) =>
              enrollment.course.toString() === curCourseId.toString()
          )
          .map((enrollment) => enrollment.course.toString());
        return acc.concat(suggestedCourses);
      },
      []
    );

    const queryLiveSession = {
      startDate: { $gte: new Date() },
      isActive: true,
    };

    const liveSessions = await Livesession.find(queryLiveSession);

    const finalQuery = {
      $or: [query, { _id: { $in: enrolledCourseIds } }],
    };

    const courses = await Course.find(finalQuery);
    const courseList = await Promise.all(
      courses.map((curCourse) =>
        getCourseDetail(
          curCourse,
          enrollments,
          coursesSuggestedForYou,
          certificationGroups,
          liveSessions
        )
      )
    );
    console.log("Course List: ", courseList, "getAllCourses");
    defer.resolve(courseList);
  } catch (e) {
    console.log("Error in: ", e, "getAllCourses");
    defer.reject(e);
  }
  return defer.promise;
}

async function getModuleDetail(
  curModule,
  courseProgresses,
  userid,
  moduleProgresses
) {
  const defer = q.defer();
  try {
    const videoids = [];
    const worksheetids = [];
    const courseProgress = courseProgresses.find(
      (p) => p?.module?.toString() === curModule?.id?.toString()
    );

    const videos = await Video.find(
      { _id: { $in: curModule.videos } },
      {
        name: 1,
        module: 1,
        url: 1,
        video_code: 1,
        description: 1,
        duration_min: 1,
        duration_sec: 1,
      }
    );

    console.log("Videos: ", videos, "getModuleDetail");

    const worksheets =
      curModule?.worksheets?.length > 1 ||
      (curModule?.worksheets?.length === 1 && curModule?.worksheets[0] !== "")
        ? await Document.find(
            { _id: { $in: curModule?.worksheets } },
            { name: 1, doc_url: 1 }
          )
        : [];

    const videoList = videos.map((video) => {
      const duration =
        (video?.duration_min !== "" && video?.duration_min !== null
          ? parseInt(video?.duration_min) * 60
          : 0) +
        (video?.duration_sec !== "" && video?.duration_sec !== null
          ? parseInt(video?.duration_sec)
          : 0);

      const progress = moduleProgresses.find(
        (p) =>
          p?.module.toString() === curModule?.id.toString() &&
          p?.viewedItemType.toString() === "video" &&
          p?.viewedItem.toString() === video?.id.toString()
      );

      videoids.push(video?.id?.toString());

      return {
        id: video?.id,
        name: video?.name,
        description: video?.description,
        url:
          config?.repositoryHost +
          "samparkvideos/" +
          video?.module +
          "/" +
          video?.url,
        video_code: video?.video_code,
        duration: duration,
        watched: progress ? true : false,
        display_count: (curModule?.videos.indexOf(video?.id) + 1).toString(),
        sortOrder: curModule?.videos.indexOf(video?.id),
      };
    });

    const worksheetList = worksheets.map((worksheet) => {
      const progress = moduleProgresses.find(
        (p) =>
          p.module.toString() === curModule.id.toString() &&
          p.viewedItemType.toString() === "worksheet" &&
          p.viewedItem.toString() === worksheet.id.toString()
      );

      worksheetids.push(worksheet.id.toString());

      return {
        id: worksheet?.id,
        name: worksheet?.name,
        url: config?.repositoryHost + worksheet?.doc_url,
        watched: progress ? true : false,
        display_count: (
          curModule?.worksheets.indexOf(worksheet?.id) +
          videoList?.length +
          1
        ).toString(),
        sortOrder: curModule?.worksheets.indexOf(worksheet.id),
      };
    });

    const videoswatched = (
      await Sssvideoviewed.distinct("video", {
        user: userid,
        video: { $in: videoids },
      })
    ).map((item) => item.toString());

    videoList.forEach((video) => {
      if (videoswatched.includes(video?.id.toString())) video.watched = true;
    });

    const worksheetswatched = (
      await Documentviewed.distinct("document", {
        user: userid,
        doc_type: "worksheet",
      })
    ).map((item) => item.toString());

    worksheetList.forEach((worksheet) => {
      if (worksheetswatched.includes(worksheet.id.toString()))
        worksheet.watched = true;
    });

    const moduleDetail = {
      id: curModule?.id,
      name: curModule?.name,
      image: config?.repositoryHost + curModule?.image,
      duration: 0,
      description: curModule?.description,
      sortOrder: curModule?.sortOrder,
      userStatus: courseProgress ? courseProgress?.status : "not-started",
      videos: videoList,
      worksheets: worksheetList,
      quiz: curModule?.quiz,
      quiz_display_count: (
        videoList?.length +
        worksheetList?.length +
        1
      ).toString(),
      quizTaken:
        courseProgress && courseProgress.status === "completed" ? true : false,
    };

    if (curModule.duration !== "null") {
      const totalDurations = curModule?.duration?.toString().split(":");
      const hrs = parseInt(totalDurations[0]);
      const mins = totalDurations.length > 1 ? parseInt(totalDurations[1]) : 0;
      moduleDetail.duration = hrs * 60 + mins;
      if (isNaN(moduleDetail?.duration)) moduleDetail.duration = 0;
    }
    console.log("Module Detail: ", moduleDetail, "getModuleDetail");
    defer.resolve(moduleDetail);
  } catch (e) {
    console.log("Error in: ", e, "getModuleDetail");
    defer.reject(e);
  }
  return defer.promise;
}

function parseIntroductoryDuration(duration) {
  if (duration && duration !== "null") {
    const [mins, secs] = duration.toString().split(":").map(Number);
    return isNaN(mins) || isNaN(secs) ? 0 : mins * 60 + secs;
  }
  return 0;
}

async function getMediaCode(mediaId, model) {
  if (mediaId) {
    const media = await model.findById(mediaId);
    return media ? media.video_code || media.audio_code || "" : "";
  }
  return "";
}

async function getCourseModules(userid, course) {
  try {
    const courseDetail = await Course.findById(course);
    const courseModules = await Coursemodule.find({ course }).sort({
      sortOrder: 1,
    });
    const courseProgresses = await Courseprogress.find({
      course,
      user: userid,
    });
    const moduleProgresses = await Moduleprogress.find({
      course,
      user: userid,
    });
    const courseEnrollment = await Enrollment.findOne({ course, user: userid });

    let courseStatus = "";
    let courseCompletionDate = "";
    let isCourseEnrolled = false;
    let enrollmentId = "";

    if (courseEnrollment) {
      isCourseEnrolled = true;
      enrollmentId = courseEnrollment._id;
      courseStatus = courseEnrollment.status;
      courseCompletionDate = courseEnrollment.completionDate;
    }

    const moduleList = await Promise.all(
      courseModules.map(async (curModule) => {
        return await getModuleDetail(
          curModule,
          courseProgresses,
          userid,
          moduleProgresses
        );
      })
    );

    let courseDetails = {
      isCourseEnrolled,
      enrollmentId,
      name: courseDetail.name,
      shareOnBaithak: true,
      description: courseDetail.description,
      startDate: courseDetail.startDate,
      endDate: courseDetail.endDate,
      rating: courseDetail.rating,
      status: courseStatus,
      completionDate: courseStatus === "completed" ? courseCompletionDate : "",
      introductoryTitle: courseDetail.introductoryTitle,
      introductoryImage: courseDetail.introductoryImage
        ? config.repositoryHost + courseDetail.introductoryImage
        : "",
      introductoryDescription: courseDetail.introductoryDescription,
      introductoryDuration: parseIntroductoryDuration(
        courseDetail.introductoryDuration
      ),
      introductoryVideo: await getMediaCode(
        courseDetail.introductoryVideo,
        Video
      ),
      introductoryAudio: await getMediaCode(
        courseDetail.introductoryAudio,
        Audio
      ),
      liveSessionDetails: null,
      liveSessionExists: courseDetail.liveSessionExists,
    };

    const liveSessionQuery = {
      course,
      startDate: { $gte: new Date() },
      isActive: true,
    };

    const liveSesionDetails = await Livesession.find(liveSessionQuery).limit(1);

    courseDetails.liveSessionDetails =
      liveSesionDetails.length > 0 ? liveSesionDetails[0] : null;
    courseDetails.liveSessionExists = liveSesionDetails.length > 0;

    courseDetails.modules = moduleList;

    return courseDetails;
  } catch (e) {
    console.log("Error in: ", e, "getCourseModules");
    throw e;
  }
}

async function enroll(req) {
  let defer = require("q").defer();
  try {
    let course = req?.course;
    let user = req?.user;

    let query = {};
    let queryUser = {};
    let enrollParams = {};
    query["course"] = course;
    query["user"] = user;
    queryUser["user"] = user;
    queryUser["status"] = "in-progress";

    const checkCourse = await Course.find({ _id: course });
    let curDate = new Date();
    curDate.setHours(0, 0, 0, 0);
    if (checkCourse.length == 1) {
      if (
        !checkCourse[0].isActive ||
        !checkCourse[0].isPublished ||
        checkCourse[0].publishedDate > curDate ||
        checkCourse[0].startDate > curDate ||
        (checkCourse[0].endDate !== null &&
          checkCourse[0].endDate !== undefined &&
          checkCourse[0].endDate <= curDate)
      )
        throw new UserException("You cannot enroll this course", 201);
    } else {
      throw new UserException("Course does not exist", 201);
    }
    const checkEnroll = await Enrollment.find(query);
    if (checkEnroll.length == 1) {
      throw new UserException("Already enrolled for this course", 201);
    }
    const checkInProgressCourses = await Enrollment.countDocuments(queryUser);
    if (checkInProgressCourses >= 3) {
      throw new UserException(
        "आप किसी भी एक समय पर 3 से अधिक पाठ्यक्रमों/कोर्स का नामांकन नहीं कर सकते हैं।  कृपया शुरू किये गए पाठ्यक्रम को सर्वप्रथम पूर्ण करें।",
        201
      );
      //throw new UserException("You cannot enroll for a new course, as you already have three courses in progress",201);
    }
    enrollParams["course"] = course;
    enrollParams["user"] = user;
    enrollParams["status"] = "in-progress";
    enrollParams["updatedBy"] = user;
    let newEnrollment = new Enrollment(enrollParams);
    await newEnrollment.save();
    defer.resolve({ success: true });
  } catch (e) {
    console.log("Error in: ", e, "enroll");
    defer.reject(e);
  }
  return defer.promise;
}

async function cancelEnrollment(req) {
  let defer = require("q").defer();
  try {
    let course = req.course;
    let user = req.user;

    let query = {};
    query["course"] = course;
    query["user"] = user;

    const checkEnroll = await Enrollment.find(query);

    if (checkEnroll.length == 1) {
      if (checkEnroll[0]["status"] == "completed") {
        throw new UserException(
          "You cannot cancel the enrollment as you already completed the course",
          201
        );
      } else {
        await Enrollment.deleteMany(query);
        await Courseprogress.deleteMany(query);
        await Moduleprogress.deleteMany(query);
      }
    } else {
      throw new UserException("You were not enrolled for this course", 201);
    }

    defer.resolve({ success: true });
  } catch (e) {
    console.log("Error in: ", e, "cancelEnrollment");
    defer.reject(e);
  }
  return defer.promise;
}

async function progressUpdate(req) {
  let defer = require("q").defer();
  try {
    let course = req.course;
    let user = req.user;
    let module = req.module;
    let viewedItemType = req.item_type;
    let viewedItem = req.item_id;
    let query = {};
    let updates = {};

    query["course"] = course;
    query["user"] = user;
    query["module"] = module;
    query["viewedItemType"] = viewedItemType;
    query["viewedItem"] = viewedItem;

    updates["course"] = course;
    updates["user"] = user;
    updates["module"] = module;
    updates["viewedItemType"] = viewedItemType;
    updates["viewedItem"] = viewedItem;
    updates["updatedDate"] = new Date();

    await Moduleprogress.updateOne(
      query,
      { $set: updates, $setOnInsert: { createdDate: new Date() } },
      { upsert: true }
    );
    const moduleDetail = await Coursemodule.findById(module);
    let moduleVideos =
      moduleDetail && moduleDetail.videos ? moduleDetail.videos.sort() : [];
    let moduleWorksheets =
      moduleDetail && moduleDetail.worksheets
        ? moduleDetail.worksheets.sort()
        : [];
    let moduleTotalProgressCount =
      moduleVideos.length + moduleWorksheets.length + 1;
    let moduleProgress = 0;
    let progresses = await Moduleprogress.aggregate([
      { $group: { _id: "$viewedItemType", ids: { $addToSet: "$viewedItem" } } },
    ]);
    for (const progress of progresses) {
      if (progress["_id"] && progress.ids) {
        let tempKey = progress["_id"].toString();
        let viewedItems = progress.ids.sort();

        if (tempKey == "worksheet") {
          let remainingWorksheets = moduleWorksheets.filter(function (val) {
            return viewedItems.indexOf(val) == -1;
          });
          moduleProgress =
            moduleProgress +
            (moduleWorksheets.length - remainingWorksheets.length);
        } else if (tempKey == "video") {
          let remainingVideos = moduleVideos.filter(function (val) {
            return viewedItems.indexOf(val) == -1;
          });
          moduleProgress =
            moduleProgress + (moduleVideos.length - remainingVideos.length);
        }
      }
    }
    if (moduleProgress > 0) {
      let queryC = {};
      let updatesC = {};
      queryC["course"] = course;
      queryC["user"] = user;
      queryC["module"] = module;

      updatesC["course"] = course;
      updatesC["user"] = user;
      updatesC["module"] = module;
      updatesC["status"] = "in-progress";
      if (moduleProgress == moduleTotalProgressCount) {
        updatesC["status"] = "completed";
      }
      updatesC["updatedDate"] = new Date();
      await Courseprogress.updateOne(
        queryC,
        { $set: updatesC, $setOnInsert: { createdDate: new Date() } },
        { upsert: true }
      );
    }
    defer.resolve({ success: true });
  } catch (e) {
    console.log(e);
    throw e;
    defer.reject(e);
  }
  return defer.promise;
}

async function saveFeedback(req) {
  let defer = require("q").defer();
  try {
    let course = req.course;
    let user = req.user;
    let feedback = req.feedback.trim();
    if (feedback == "") {
      throw new UserException("Kindly provide the feedback", 201);
    }
    let rating = req.rating;
    let query = {};
    query["course"] = course;
    query["user"] = user;

    let checkEnroll = await Enrollment.find(query);

    if (checkEnroll && checkEnroll[0]) {
      if (checkEnroll[0]["status"] == "completed") {
        let updates = {};
        updates["feedback"] = feedback;
        updates["rating"] = rating;
        updates["updatedDate"] = new Date();
        updates["feedbackDate"] = new Date();
        updates["updatedBy"] = user;
        await Enrollment.updateOne(query, updates);

        let queryF = {};
        queryF["course"] = checkEnroll[0]["course"];
        queryF["status"] = "completed";
        queryF["feedback"] = {};
        queryF["feedback"]["$exists"] = true;

        let dbFeedbacks = await Enrollment.find(queryF, { rating: 1 });
        let totalRating = 0;
        for (const dbFeedback of dbFeedbacks) {
          totalRating = totalRating + dbFeedback.rating;
        }
        let avgRating = totalRating / dbFeedbacks.length;
        await Course.updateOne(
          { _id: checkEnroll[0]["course"] },
          { $set: { rating: avgRating.toFixed(2) } }
        );
        defer.resolve({ success: true });
      } else {
        throw new UserException(
          "You have not completed the course. Complete it for giving feedback",
          201
        );
      }
    } else {
      throw new UserException("You have not enrolled in the course", 201);
    }
  } catch (e) {
    console.log(e);
    throw e;
    defer.reject(e);
  }
  return defer.promise;
}

async function feedbacks(course, userid, pageNo) {
  try {
    let skip = 0;
    const perPage = 5;

    if (pageNo && !isNaN(pageNo) && pageNo > 0) {
      skip = (pageNo - 1) * perPage;
    }

    const query = {
      course: course,
      status: "completed",
      "feedback.$exists": true,
    };

    const feedbacklikes = await Feedbacklike.distinct("enrollment", {
      user: userid,
    });

    const feedbacks = await Enrollment.find(query, {
      feedback: 1,
      rating: 1,
      likes: 1,
      feedbackDate: 1,
      videos: 1,
    })
      .populate("user", ["fullName", "image"])
      .sort({ feedbackDate: -1 })
      .limit(perPage)
      .skip(skip);

    const result = feedbacks.map(async (dbFeedback) => {
      const feedback = {
        id: dbFeedback.id,
        likes: dbFeedback.likes,
        rating: dbFeedback.rating,
        feedback: dbFeedback.feedback,
        video: "",
      };

      if (dbFeedback.videos.length > 0) {
        const video = dbFeedback.videos[dbFeedback.videos.length - 1];
        const videodetail = await Videostream.findById(video);

        if (videodetail) {
          feedback.video = videodetail;
        }
      }

      feedback.feedback_date = dbFeedback.feedbackDate;

      feedback.is_liked = feedbacklikes.includes(dbFeedback.id.toString())
        ? 1
        : 0;

      feedback.user = {
        id: dbFeedback.user.id,
        fullName: dbFeedback.user.fullName,
        image:
          dbFeedback.user.image !== "" && dbFeedback.user.image !== null
            ? config.repositoryHost + dbFeedback.user.image
            : config.user_image,
      };

      return feedback;
    });

    return Promise.all(result);
  } catch (e) {
    console.log("Error in: ", e, "feedbacks");
    throw e;
  }
}

async function likeFeedback(req) {
  let defer = require("q").defer();
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
      let dbObject = await Feedbacklike.updateOne(
        query,
        { $set: query, $setOnInsert: { createdDate: new Date() } },
        { upsert: true }
      );
      if (dbObject["upserted"]) {
        likeCount = likeCount + 1;
      }
    } else {
      let dbObject = await Feedbacklike.deleteOne({
        enrollment: enrollment,
        user: user,
      });
      if (dbObject["deletedCount"]) {
        likeCount = likeCount - 1;
      }
    }
    await Enrollment.updateOne(
      { _id: enrollment },
      { $set: { likes: likeCount } }
    );
    defer.resolve({ success: true });
  } catch (e) {
    console.log("Error in: ", e, "likeFeedback");
    defer.reject(e);
  }
  return defer.promise;
}

async function liveSessionRequest(req) {
  let defer = require("q").defer();
  try {
    let livesession = req.livesession;
    let user = req.user;
    let status = req.status;

    let query = {};
    let livesessionParams = {};
    query["livesession"] = livesession;
    query["user"] = user;

    const checkLiveSession = await Livesessionattendance.find(query);

    if (checkLiveSession.length == 0) {
      livesessionParams["livesession"] = livesession;
      livesessionParams["user"] = user;
      livesessionParams["acceptance"] = status;
      let newLivesession = new Livesessionattendance(livesessionParams);
      await newLivesession.save();
    }
    defer.resolve({ success: true });
  } catch (e) {
    console.log("Error in: ", e, "liveSessionRequest");
    defer.reject(e);
  }
  return defer.promise;
}

async function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

/*
This API is to get questions by assessment ids
*/
async function getQuizQuestions(assessmentId) {
  try {
    const arrAssessmentIds = [assessmentId];
    const query = {
      isActive: true,
      questionType: "objective",
      assessment: { $in: arrAssessmentIds },
    };

    console.log("Query: ", query, "getQuizQuestions");

    const assessmentQuestions = await AssessmentQuestion.find(query);
    const queryAssess = { isActive: true };
    const Assessments = await Assessment.find(queryAssess);
    const questionsGroupByAssessment = _.groupBy(
      assessmentQuestions,
      "assessment"
    );

    const finalArray = await Promise.all(
      Object.keys(questionsGroupByAssessment).map(async (assessId) => {
        const questionList = {
          id: assessId,
        };

        const assessmentName = _.find(Assessments, { id: assessId });

        questionList.name = assessmentName ? assessmentName.lesson : "";
        questionList.level = assessmentName ? assessmentName.level : "";
        questionList.timeLimit = assessmentName ? assessmentName.duration : "";

        const requiredCnt = Math.min(
          questionsGroupByAssessment[assessId].length,
          21
        );
        questionList.displayQuestionsCnt = requiredCnt - 1;

        questionList.instructions = {
          rules: [
            "You have to score over 80% to complete this module successfully.",
            "You will get 3 Lifelines.",
            `Maximum time taken should be ${
              assessmentName ? assessmentName.duration : ""
            } minutes.`,
          ],
          point_system: [
            `+${
              (assessmentName ? assessmentName.maxMarks : 0) /
              questionList.displayQuestionsCnt.toFixed(1)
            } for each correct answer.`,
            "Each unused Lifelines earn you 5 points.",
            "If you complete the quiz within stipulated time, you earn 5 points.",
          ],
        };

        const questionArr = await Promise.all(
          questionsGroupByAssessment[assessId].map(async (questionInnerObj) => {
            const questionObj = {
              id: questionInnerObj.id,
              question: questionInnerObj.question,
              sentence: questionInnerObj.sentence || "",
              questionType: questionInnerObj.questionType || "objective",
              optionType: questionInnerObj.optionType || "",
              isAudioEnabled: questionInnerObj.isAudioEnabled || "",
            };

            if (questionObj.questionType === "ml-b") {
              const optionKeys = Object.keys(questionInnerObj.options);
              const optionValues = Object.values(questionInnerObj.options);
              await shuffle(optionValues);
              const newOptions = Object.fromEntries(
                optionKeys.map((key, i) => [key, optionValues[i]])
              );
              questionObj.options = newOptions;
            } else {
              questionObj.options = questionInnerObj.options;
            }

            questionObj.question_image = questionInnerObj.question_image
              ? config.repositoryHost + questionInnerObj.question_image
              : "";

            if (!_.isEmpty(questionInnerObj.options_image)) {
              questionInnerObj.options_image = {
                a: questionInnerObj.options_image.a
                  ? config.repositoryHost + questionInnerObj.options_image.a
                  : "",
                b: questionInnerObj.options_image.b
                  ? config.repositoryHost + questionInnerObj.options_image.b
                  : "",
                c: questionInnerObj.options_image.c
                  ? config.repositoryHost + questionInnerObj.options_image.c
                  : "",
                d: questionInnerObj.options_image.d
                  ? config.repositoryHost + questionInnerObj.options_image.d
                  : "",
              };
              questionObj.options_image = questionInnerObj.options_image;
            } else {
              questionObj.options_image = {};
            }

            const questionOptions = Object.fromEntries(
              Object.entries(questionObj.options).map(([option, value]) => [
                option,
                value === "" ? option : value,
              ])
            );
            questionObj.options = questionOptions;

            questionObj.correctAnswer = questionInnerObj.correctAnswer;

            return questionObj;
          })
        );
        console.log("Question Array: ", questionArr, "getQuizQuestions");
        questionList.questions = questionArr;
        return questionList;
      })
    );
    console.log("Final Array: ", finalArray, "getQuizQuestions");
    return finalArray;
  } catch (e) {
    console.log("Error in: ", e, "getQuizQuestions");
    throw e;
  }
}

async function getUserDetails(userid) {
  let defer = require("q").defer();
  try {
    if (userid) {
      let curUser = await User.find({ _id: userid });
      defer.resolve(curUser);
    } else {
      defer.resolve("");
    }
  } catch (e) {
    console.log("Error in: ", e, "getUserDetails");
    defer.reject(e);
  }
  return defer.promise;
}

async function uploadVideo(req) {
  let defer = require("q").defer();
  try {
    const fs = require("fs");
    let data = req;
    let dir = "";
    let uploadFolder = "";
    dir = config.uploadPath + "uservideos/";
    uploadFolder = "uservideos";
    let course = data.body.course;
    let user_groups = [];
    let enrollmentCheck = await Enrollment.find({
      course: course,
      user: data.body.user,
    });
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
          curUserLocation = "India";
        }
      } //end of if condition checking for user record availability

      let sampark_didi_ids = Object.keys(config.sampark_didi_ids);

      for (const usergroup in config.user_groups) {
        user_groups.push(usergroup);
      }
      if (dir != "") {
        let uploadData;
        let sampleFile;
        if (!data.files || Object.keys(data.files).length === 0) {
          throw new UserException("File not uploaded", 201);
        }
        sampleFile = data.files.file;
        uploadData = await uploadToS3(sampleFile, uploadFolder);
        let postDescription = "";
        if (isBase64(data.body.message)) {
          let buff = new Buffer(data.body.message, "base64");
          postDescription = decodeURIComponent(buff);
        } else {
          postDescription = data.body.message;
        }
        let uservideostream = {};
        let streamData = {};

        let uploadResponse = await uploadOnYouTube(
          sampleFile,
          uploadData.Key,
          postDescription
        );
        if (uploadResponse["status"] == 200) {
          let youtubeID = uploadResponse["data"]["id"];
          let durationMin = 0;
          let durationSec = 0;
          let duration = uploadResponse["data"]["contentDetails"]["duration"];
          let arr = duration.split("M");
          if (arr && arr.length == 2) {
            durationMin = arr[0].replace("PT", "");
            durationSec = arr[1].replace("S", "");
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
            is_shareable: true,
          });
          uservideostream.save();
          streamData.item_type = "video";
          streamData.item_id = uservideostream.id;
          streamData.user_groups = user_groups;
          streamData.states = [curUserState];
          if (curUserDistrict !== "") streamData.district = curUserDistrict;
          if (curUserLocation !== "") streamData.location = curUserLocation;

          streamData.priority = 1;
          if (sampark_didi_ids.indexOf(data.body.user.toString()) >= 0) {
            streamData.is_sampark_didi_post = true;
          } else {
            streamData.is_sampark_didi_post = false;
          }
          const stream = new Stream(streamData);
          await stream.save();
          let enrollVideos = enrollmentCheck[0]["videos"]
            ? enrollmentCheck[0]["videos"]
            : [];
          enrollVideos.push(uservideostream.id);
          await Enrollment.updateOne(
            { _id: enrollmentCheck[0]["_id"] },
            { $set: { videos: enrollVideos } }
          );

          defer.resolve({ success: true });
        } else {
          defer.resolve({ success: false });
        }
      } else {
        throw new UserException("Incorrect Post", 201);
      }
    } else {
      throw new UserException("Not enrolled for the course", 201);
    }
  } catch (e) {
    console.log(e);
    defer.reject(e);
  }
  return defer.promise;
}

/*
This API is to save assessment results
*/
async function saveQuizResults(assessDetails) {
  if (!_.isEmpty(assessDetails)) {
    try {
      let moduleId = "";
      let courseId = "";
      let moduleDetails = await Coursemodule.find({
        _id: assessDetails["moduleId"],
      });
      if (moduleDetails.length == 1) {
        moduleId = moduleDetails[0]["_id"];
        courseId = moduleDetails[0]["course"];
      }
      let departmentId = "";
      let subjectId = "";
      let maxMarks = 0;
      let pointValue = 1;
      let maxDuration = 0;
      let assessmentDetails = await Assessment.find({
        _id: assessDetails["assessmentId"],
      });
      if (assessmentDetails.length == 1) {
        departmentId = assessmentDetails[0]["departmentId"];
        subjectId = assessmentDetails[0]["subjectId"];

        maxMarks = assessmentDetails[0]["maxMarks"]
          ? assessmentDetails[0]["maxMarks"]
          : assessmentDetails[0]["displayQuestionsCnt"];
        pointValue = (
          parseFloat(maxMarks) /
          parseFloat(assessmentDetails[0]["displayQuestionsCnt"])
        ).toFixed(1);

        maxDuration = assessmentDetails[0]["duration"];
      }
      let enrollmentId = assessDetails["enrollmentId"];
      //To check if already test has been taken

      let checkCourseProgress = await Courseprogress.find({
        course: courseId,
        module: moduleId,
        user: assessDetails["loggedInUserID"],
      });
      if (checkCourseProgress.length == 1) {
        let lastStatus = checkCourseProgress[0]["status"];
        if (lastStatus == "completed") {
          throw new UserException(
            "You have already given the quiz and completed the module",
            201
          );
        }
      }

      let stateId = assessDetails["stateId"];
      let entryType = assessDetails["entryType"];
      let type = assessDetails["type"];
      let lifeLineRemaining = assessDetails["lifeLineRemaining"];

      let studentAnswers = [];
      //If answers are there fill answers table
      if (assessDetails.questions.length) {
        let questionArr = assessDetails.questions;
        for (i = 0; i < questionArr.length; i++) {
          let studentAnswer = {};
          studentAnswer["question"] = questionArr[i]["id"];
          studentAnswer["selectedAnswer"] = questionArr[i]["enteredAnswer"];
          studentAnswer["correctAnswer"] = questionArr[i]["correctAnswer"];
          studentAnswer["type"] = type;
          studentAnswers.push(studentAnswer);
        }
      }
      //Insert assessment student progess collection
      const studentAssessProgress = new AssessmentStudentProgress({
        enrollment: enrollmentId,
        module: moduleId,
        course: courseId,
        student: assessDetails["studentId"],
        assessment: assessDetails["assessmentId"],
        state: stateId,
        department: departmentId,
        subject: subjectId,
        correctQuestionCnt: assessDetails["correctQuesionCnt"],
        totalQuestionCnt: assessDetails["totalQuesionCnt"],
        entryType: entryType,
        completionDuration: assessDetails["completionDuration"],
        countOfStar: assessDetails["countOfStar"],
        type: type,
        answers: studentAnswers,
        createdBy: new objectId(assessDetails["loggedInUserID"]),
        modifiedBy: new objectId(assessDetails["loggedInUserID"]),
      });

      await studentAssessProgress.save();

      let pointsForTime = 0;
      let percentageValue =
        (parseFloat(assessDetails["correctQuesionCnt"]) /
          parseFloat(assessDetails["totalQuesionCnt"])) *
        100;
      let percentage = percentageValue.toFixed(2);
      let modulePoints = 0;

      let totalPoints = pointValue * assessDetails["correctQuesionCnt"];
      if (assessDetails["completionDuration"] <= maxDuration) {
        pointsForTime = 5;
        totalPoints = totalPoints + pointsForTime;
      }
      let lifeLinePonts = lifeLineRemaining * 5;
      totalPoints = totalPoints + lifeLinePonts;
      if (percentage >= 80) {
        modulePoints = totalPoints;
      }
      let newQuizResult = {
        correctQuestionCnt: assessDetails["correctQuesionCnt"],
        totalQuestionCnt: assessDetails["totalQuesionCnt"],
        completionDuration: assessDetails["completionDuration"],
        countOfStar: assessDetails["countOfStar"],
        lifeLinePonts: lifeLinePonts,
        pointsForTime: pointsForTime,
        percentage: percentage,
        points: totalPoints,
      };

      let result = {};
      result["retry"] = true;
      result["points"] = newQuizResult;
      if (checkCourseProgress.length == 1) {
        quizResults = checkCourseProgress[0]["quizResults"];
        quizResults.push(newQuizResult);
        let updateSet = {};
        updateSet["quizResults"] = quizResults;
        if (percentage >= 80) {
          updateSet["status"] = "completed";
          result["retry"] = false;
        }
        await Courseprogress.updateOne(
          {
            course: courseId,
            module: moduleId,
            user: assessDetails["loggedInUserID"],
          },
          { $set: updateSet }
        );
      } else {
        quizResults = [];
        quizResults.push(newQuizResult);

        let newCourseProgress = new Courseprogress();
        newCourseProgress["course"] = courseId;
        newCourseProgress["module"] = moduleId;
        newCourseProgress["user"] = assessDetails["loggedInUserID"];
        newCourseProgress["quizResults"] = quizResults;
        if (percentage >= 80) {
          newCourseProgress["status"] = "completed";
          result["retry"] = false;
        } else {
          newCourseProgress["status"] = "in-progress";
        }
      }
      let maxAttemptsAllowed = 0;
      result["attempts_left"] =
        maxAttemptsAllowed - quizResults.length >= 0
          ? maxAttemptsAllowed - quizResults.length
          : 0;
      //check course completeness
      const courseModules = await Coursemodule.countDocuments({
        course: courseId,
      });
      const courseModulesCompleted = await Courseprogress.countDocuments({
        user: assessDetails["loggedInUserID"],
        course: courseId,
        status: "completed",
      });
      if (courseModules == courseModulesCompleted) {
        completionDate = new Date();
        await Enrollment.updateOne(
          { _id: enrollmentId },
          {
            $inc: { points: modulePoints },
            $set: { status: "completed", completionDate: completionDate },
          }
        );

        let checkusercertificate = await Usercertificate.countDocuments({
          user: assessDetails["loggedInUserID"],
          course: courseId,
        });
        if (checkusercertificate == 0) {
          let certificateP = await createCertificate(
            courseId,
            assessDetails["loggedInUserID"]
          );
          let usercerticate = new Usercertificate();
          usercerticate.user = assessDetails["loggedInUserID"];
          usercerticate.course = courseId;
          usercerticate.path = certificateP;
          if (await usercerticate.save()) {
            console.log("CERTIFICATE SAVED");
          }
        }
        let completedCourses = await Enrollment.distinct("course", {
          user: new objectId(assessDetails["studentId"]),
          status: "completed",
        });
        let completedCourseCount = completedCourses.length;

        const goldBadgesCnt = await Userbadge.countDocuments({
          user: new objectId(assessDetails["studentId"]),
          badge: "gold",
          type: "elearning",
        });
        const silverBadgesCnt = await Userbadge.countDocuments({
          user: new objectId(assessDetails["studentId"]),
          badge: "silver",
          type: "elearning",
        });
        const bronzeBadgesCnt = await Userbadge.countDocuments({
          user: new objectId(assessDetails["studentId"]),
          badge: "bronze",
          type: "elearning",
        });

        let newBronzeBadgesCnt =
          parseInt(completedCourseCount / 3) - bronzeBadgesCnt;
        let newSilverBadgesCnt =
          parseInt(completedCourseCount / 6) - silverBadgesCnt;
        let newGoldBadgesCnt =
          parseInt(completedCourseCount / 12) - goldBadgesCnt;

        for (i = 0; i < newBronzeBadgesCnt; i++) {
          let newBadge = new Userbadge({
            user: new objectId(assessDetails["studentId"]),
            badge: "bronze",
            type: "elearning",
          });
          await newBadge.save();
        }

        for (i = 0; i < newSilverBadgesCnt; i++) {
          let newBadge = new Userbadge({
            user: new objectId(assessDetails["studentId"]),
            badge: "silver",
            type: "elearning",
          });
          await newBadge.save();
        }

        for (i = 0; i < newGoldBadgesCnt; i++) {
          let newBadge = new Userbadge({
            user: new objectId(assessDetails["studentId"]),
            badge: "gold",
            type: "elearning",
          });
          await newBadge.save();
        }

        await User.updateOne(
          { _id: assessDetails["loggedInUserID"] },
          { $set: { noOfCompletedCourses: completedCourseCount } }
        );
      } else {
        await Enrollment.updateOne(
          { _id: enrollmentId },
          { $inc: { points: modulePoints } }
        );
      }

      return result;
    } catch (e) {
      throw e; //'Exception came while inserting into database';
    }
  } else {
    throw "Assessment results needs to be passed in json format";
  }
}

/*
This API is to give assessment results
*/
async function getQuizResults(assessDetails) {
  try {
    if (_.isEmpty(assessDetails)) {
      throw new UserException("Assessment details are empty", 400);
    }

    const moduleId = assessDetails?.moduleId;
    let courseId = "";
    const assessmentId = assessDetails?.assessmentId;

    const moduleDetails = await Coursemodule.findById(moduleId);
    if (!moduleDetails) {
      throw new UserException("Module does not exist", 404);
    }
    courseId = moduleDetails?.course;

    const enrollmentDetails = await Enrollment.findOne({
      course: courseId,
      user: assessDetails?.loggedInUserID,
    });

    if (!enrollmentDetails) {
      throw new UserException("You have not enrolled for the course", 404);
    }

    const enrollmentId = enrollmentDetails?._id;

    const studentProgress = await AssessmentStudentProgress.findOne({
      enrollment: enrollmentId,
      module: moduleId,
      course: courseId,
      student: assessDetails?.loggedInUserID,
      assessment: assessmentId,
    }).sort({ createdAt: -1 });

    if (!studentProgress) {
      throw new UserException("You have not given the assessment", 404);
    }

    return {
      progress: studentProgress,
      answers: studentProgress.answers,
    };
  } catch (e) {
    console.log("Error in: ", e, "getQuizResults");
    throw e;
  }
}

async function createCertificate(course, user) {
  let promises1 = [];
  let im = require("imagemagick");
  let certificateName = "";
  let userUpdatedCertificates = [];
  const curUser = await User.findById(user);
  const curCourse = await Course.findById(course);
  const enrollment = await Enrollment.find({ course: course, user: user });
  if (enrollment && enrollment.length >= 1) {
    let allotdate = enrollment[0]["completionDate"];
    if (curUser.fullName !== undefined && curUser.fullName !== null)
      certificateName = curUser.fullName.toUpperCase();
    else
      certificateName =
        curUser.firstName.toUpperCase() +
        (curUser.lastName !== undefined && curUser.lastName !== null
          ? " " + curUser.lastName.toUpperCase()
          : "");

    let allotdatestring =
      allotdate.getDate() +
      "-" +
      (allotdate.getMonth() + 1) +
      "-" +
      allotdate.getFullYear();
    try {
      const certificateUrl = config.assetHost + "course-certificate.png";
      await downloadFileFromURL(
        certificateUrl,
        config.uploadPath,
        "course-certificate.png"
      );
    } catch (e) {
      console.log("File not downloaded" + "course-certificate.png");
      console.log(e);
    }
    let usercertificatepath =
      config.uploadPath + "usercertificates/" + user + "_" + course + ".png";
    let mastercertificatepath = config.uploadPath + "course-certificate.png";
    const obj = {
      key: course,
      value: user + "_" + course + ".png",
    };
    userUpdatedCertificates.push(obj);
    let p = new Promise((resolve, reject) => {
      if (curCourse.isNameInHindi) {
        if (curCourse.englishTitle == "") {
          let optionsObj = [
            mastercertificatepath,
            "-flatten",
            "-font",
            "Lohit-Devanagari",
            "-fill",
            "black",
            "-pointsize",
            "40",
            "-gravity",
            "North",
            "-draw",
            "text 0,450 '" + curCourse.name + "'",
            usercertificatepath,
          ];
          im.convert(optionsObj, function (err, stdout) {
            if (err) reject(err);

            let optionsObj1 = [
              usercertificatepath,
              "-flatten",
              "-font",
              "Utopia-Regular",
              "-fill",
              "black",
              "-pointsize",
              "40",
              "-gravity",
              "North",
              "-draw",
              "text 0,615 '" +
                certificateName +
                "' text 0,740 '" +
                allotdatestring +
                "'",
              usercertificatepath,
            ];

            im.convert(optionsObj1, function (err, stdout) {
              if (err) reject(err);
              resolve("Converted Image successfully 2");
            });
          });
        } else {
          let optionsObj = [
            mastercertificatepath,
            "-flatten",
            "-font",
            "Utopia-Regular",
            "-fill",
            "black",
            "-pointsize",
            "40",
            "-gravity",
            "North",
            "-draw",
            "text 0,450 '" +
              curCourse.englishTitle +
              "' text 0,615 '" +
              certificateName +
              "' text 0,740 '" +
              allotdatestring +
              "'",
            usercertificatepath,
          ];

          im.convert(optionsObj, function (err, stdout) {
            if (err) reject(err);
            resolve("Converted Image successfully 2");
          });
        }
      } else {
        let optionsObj = [
          mastercertificatepath,
          "-flatten",
          "-font",
          "Utopia-Regular",
          "-fill",
          "black",
          "-pointsize",
          "40",
          "-gravity",
          "North",
          "-draw",
          "text 0,450 '" +
            curCourse.name +
            "' text 0,615 '" +
            certificateName +
            "' text 0,740 '" +
            allotdatestring +
            "'",
          usercertificatepath,
        ];

        im.convert(optionsObj, function (err, stdout) {
          if (err) reject(err);
          resolve("Converted Image successfully 2");
        });
      }
    });
    promises1.push(p);

    try {
      await Promise.all(promises1);
      try {
        try {
          const fs = require("fs");
          const certFile = fs.createReadStream(usercertificatepath);
          await uploadStreamToS3(
            certFile,
            "usercertificates",
            user + "_" + course + ".png"
          );
          const filePathMasterCertificate = path.resolve(
            config.uploadPath + "course-certificate.png"
          );
          fs.unlinkSync(filePathMasterCertificate);
        } catch (e) {
          console.error(e);
          throw e;
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    } catch (err) {
      console.error(e);
      throw err;
    }
  } else {
    throw new UserException("Not enrolled for the course", 201);
  }
  return "usercertificates/" + user + "_" + course + ".png";
}

/*
This API is to give course certifictae
*/
async function getCertificate(assessDetails) {
  try {
    if (
      !_.isEmpty(assessDetails) &&
      assessDetails?.courseId &&
      assessDetails?.loggedInUserID
    ) {
      const checkusercertificate = await Usercertificate.find({
        user: assessDetails?.loggedInUserID,
        course: assessDetails?.courseId,
      });

      let certificate = "";

      if (checkusercertificate?.length === 0) {
        certificate = await createCertificate(
          assessDetails.courseId,
          assessDetails.loggedInUserID
        );

        const usercerticate = new Usercertificate({
          user: assessDetails?.loggedInUserID,
          course: assessDetails?.courseId,
          path: certificate,
        });

        if (await usercerticate.save()) {
          console.log("CERTIFICATE SAVED");
        }
      } else {
        certificate = checkusercertificate[0]?.path;
      }

      return config?.repositoryHost + certificate;
    } else {
      throw "Assessment results need to be passed in JSON format with courseId and loggedInUserID";
    }
  } catch (e) {
    console.log("Error in: ", e, "getCertificate");
    throw e;
  }
}

function sortProperties(obj) {
  // convert object into array
  var sortable = [];
  for (var key in obj)
    if (obj.hasOwnProperty(key)) sortable.push([key, obj[key]]); // each item is an array in format [key, value]

  // sort items by value
  sortable.sort(function (a, b) {
    return b[1] - a[1]; // compare numbers
  });
  return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
}

function sortObjects(objects) {
  var newObject = {};
  var sortedArray = sortProperties(objects, "zindex", true, false);
  let loopend = sortedArray.length;
  if (loopend > 10) loopend = 10;
  for (var i = 0; i < loopend; i++) {
    var key = sortedArray[i][0];
    var value = sortedArray[i][1];
    newObject[key] = value;
  }
  return newObject;
}
