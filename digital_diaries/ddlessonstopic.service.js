const db = require("../_helpers/db");
const Ddlesson = db.Ddlesson;
const Ddprogress = db.Ddprogress;
const Ddtopic = db.Ddtopic;
const User = db.User;
const Lesson = db.Lesson;
const objectId = require("mongoose").Types.ObjectId;
const _ = require("underscore");
const config = require("../config.json");
const moment = require("moment");

module.exports = {
  getddLessonsTopics,
  getTopicsForLesson,
};

async function getddLessonsTopics(userParam) {
  try {
    const userId = userParam.user;
    const subjectId = new objectId(userParam.subjectId);
    const classId = new objectId(userParam.classId);
    const finallessons = [];

    const stateDetail = await User.findOne(
      { _id: userId },
      { state: 1, usertype: 1 }
    );

    if (!stateDetail) {
      return "User not found.";
    }

    const allowedUserTypes = ["govt teacher", "spark"];
    if (!allowedUserTypes.includes(stateDetail.usertype)) {
      return "Digital Diary is only available for Government Teachers and Spark Users!";
    }

    const stateId = stateDetail.state; // 5e3e47ca00d612342102b5f9
    const lessons = await Ddlesson.find({
      department: classId,
      subject: subjectId,
      state: new objectId(stateId),
      isActive: true,
    }).sort({ sort_order: 1 });

    const lessonIds = Array.from(new Set(lessons.map((lesson) => lesson._id)));
    const lessonTopics = await Ddtopic.find({
      isActive: true,
      ddlesson: { $in: lessonIds },
      $or: [{ user: null }, { user: new objectId(userId) }],
    });

    const lessonTopicIds = Array.from(
      new Set(lessonTopics.map((topic) => topic._id))
    );
    const lessonProgresses = await Ddprogress.find({
      ddtopic: { $in: lessonTopicIds },
      userId: new objectId(userId),
    });

    const groupedLessonTopics = _.groupBy(lessonTopics, "ddlesson");
    const groupedLessonProgresses = _.groupBy(lessonProgresses, "ddtopic");

    lessons.forEach((lesson) => {
      const tempLesson = {
        _id: lesson._id,
        isActive: lesson.isActive,
        startDate: lesson.startDate,
        endDate: lesson.endDate,
        name: lesson.name,
        description: lesson.description,
        state: lesson.state,
        topics: [],
        percentageProgress: "0%",
      };

      const lessonId = lesson._id;
      const topics = groupedLessonTopics[lessonId] || [];
      const totalTopics = topics.length;
      let completedTopics = 0;

      topics.forEach((topic) => {
        const tempTopic = {
          _id: topic._id,
          isActive: topic.isActive,
          user: topic.user,
          name: topic.name,
          noOfDays: topic.noOfDays,
          progress: [],
        };

        const topicId = topic._id;
        const progressElements = groupedLessonProgresses[topicId] || [];

        progressElements.forEach((progress) => {
          if (progress.userId == userId) {
            const tempProgress = {
              _id: progress._id,
              userId: progress.userId,
              isCompleted: progress.isCompleted,
              setDate: progress.setDate,
            };

            completedTopics += progress.isCompleted ? 1 : 0;
            tempTopic.progress.push(tempProgress);
          }
        });

        tempLesson.topics.push(tempTopic);
      });

      if (totalTopics > 0) {
        tempLesson.percentageProgress =
          Math.round((completedTopics / totalTopics) * 100) + "%";
      }

      finallessons.push(tempLesson);
    });

    return finallessons;
  } catch (error) {
    console.error("error", error);
    throw error;
  }
}

async function getTopicsForLesson(userParam) {
  const userId = userParam.user;
  const lessonId = userParam.lessonId;
  const ddLessonId = userParam.ddLessonId;
  const fromDate = userParam.fromDate;
  const toDate = userParam.toDate;
  const dailyOrWeekly = userParam.dailyOrWeekly;

  if (
    !userId ||
    !ddLessonId ||
    !lessonId ||
    !fromDate ||
    !toDate ||
    !dailyOrWeekly
  )
    throw "Please share correct input";
  try {
    const lessonArray = await Lesson.find({ _id: lessonId });

    if (lessonArray) {
      const lessonDetails = lessonArray[0];
      const lessonWithTopics = {};

      lessonWithTopics["lessonImage"] = lessonDetails["lessonImage"]
        ? config.repositoryHost + lessonDetails["lessonImage"]
        : "";
      lessonWithTopics["lessonImageHeight"] =
        lessonDetails["lessonImageHeight"];
      lessonWithTopics["lessonImageWidth"] = lessonDetails["lessonImageWidth"];
      lessonWithTopics["lessonName"] = lessonDetails["name"];

      const ddLesson = await Ddlesson.find({ _id: ddLessonId });

      if (!ddLesson) {
        throw "Digital Diary lesson not found";
      }

      lessonWithTopics["ddLessonDetails"] = ddLesson[0];

      const ddTopicArray = await Ddtopic.find({
        isActive: true,
        ddlesson: ddLessonId,
      });

      let topicsData = [];
      if (dailyOrWeekly == "daily") {
        topicsData = getDDTopicsForDaily(ddTopicArray, fromDate);
      } else if (dailyOrWeekly == "weekly") {
        topicsData = getDDTopicsForWeek(ddTopicArray, fromDate, toDate);
      }

      if (topicsData) {
        lessonWithTopics["topics"] = topicsData;
      }

      return lessonWithTopics;
    } else {
      return "No lesson details found";
    }
  } catch (error) {
    return error;
  }
}

function checkBetween(date1, date2, date3) {
  return date1.isSameOrAfter(date2) && date1.isSameOrBefore(date3);
}

function getDDTopicsForDaily(ddTopicArray, tomorrow) {
  const dateToCompare = moment(new Date(tomorrow), "DD-MM-YYYY").subtract(
    1,
    "days"
  );
  const ddTopics = _.filter(ddTopicArray, (ddTopic) => {
    if (ddTopic.startDate != null && ddTopic.noOfDays != null) {
      const startDate = moment(ddTopic.startDate, "DD-MM-YYYY");
      const endDate = moment(ddTopic.startDate, "DD-MM-YYYY").add(
        ddTopic.noOfDays,
        "days"
      );
      return checkBetween(dateToCompare, startDate, endDate);
    }
  });
  return ddTopics;
}

function getDDTopicsForWeek(ddTopicArray, weekFrom, weekTo) {
  const from = moment(new Date(weekFrom), "DD-MM-YYYY");
  const to = moment(new Date(weekTo), "DD-MM-YYYY");
  const ddTopics = _.filter(ddTopicArray, (ddTopic) => {
    if (ddTopic.startDate != null && ddTopic.noOfDays != null) {
      for (const i = 0; i < ddTopic.noOfDays; i++) {
        const startDate = moment(ddTopic.startDate, "DD-MM-YYYY").add(
          i,
          "days"
        );
        return checkBetween(startDate, from, to);
      }
    }
  });
  return ddTopics;
}
