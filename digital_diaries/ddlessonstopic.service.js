const db = require('../_helpers/db');
const Ddlesson = db.Ddlesson;
const Ddprogress = db.Ddprogress;
const Ddtopic = db.Ddtopic;
const User = db.User;
const Lesson = db.Lesson;
var objectId = require("mongoose").Types.ObjectId;
var _ = require("underscore");
const config = require('../config.json');
const moment = require('moment');

module.exports = {
    getddLessonsTopics,
    getTopicsForLesson,
};

async function getddLessonsTopics(userParam) {
    let userId = userParam.user;
    let subjectId = new objectId(userParam.subjectId);
    let classId = new objectId(userParam.classId);
    let finallessons = [];

    let stateDetail = await User.findOne({ "_id": userId }, { "state": 1, "usertype": 1 });

    if (stateDetail) {

        if (stateDetail.usertype != 'govt teacher' && stateDetail.usertype != 'spark') {
            return "Digital Diary is only available for Government Teachers and Spark Users!";
        }
        
        let state_id = stateDetail.state; // 5e3e47ca00d612342102b5f9
        let lessons = await Ddlesson.find({
            department: classId,
            subject: subjectId,
            state: new objectId(state_id),
            isActive: true
        }).sort({sort_order:1})
        let lessonIds = _.pluck(lessons, '_id');
        let distinctLessonIds = _.uniq(lessonIds);
        
        let topicQuery = {}
        topicQuery["isActive"] = true
        topicQuery["ddlesson"] = {}
        topicQuery["ddlesson"]["$in"] = distinctLessonIds
        topicQuery["$or"] = []
        topicQuery["$or"].push({user: {"$eq":null}})
        topicQuery["$or"].push({user: require('mongodb').ObjectID(userId)})
        let lessonTopics = await Ddtopic.find(topicQuery)
        let lessonTopicIds = _.pluck(lessonTopics, '_id');
        let distinctLessonTopicIds = _.uniq(lessonTopicIds);
        lessonTopics = _.groupBy(lessonTopics, 'ddlesson')
        let progressQuery = {}
        progressQuery["ddtopic"] = {}
        progressQuery["ddtopic"]["$in"] = distinctLessonTopicIds
        progressQuery["userId"] = require('mongodb').ObjectID(userId)
        let lessonProgresses = await Ddprogress.find(progressQuery)
        lessonProgresses = _.groupBy(lessonProgresses, 'ddtopic')
        
        lessons.forEach(lesson => {
            let tempLesson = {};
            tempLesson["_id"] = lesson._id
            tempLesson["isActive"] = lesson.isActive
            tempLesson["startDate"] = lesson.startDate
            tempLesson["endDate"] = lesson.endDate
            tempLesson["name"] = lesson.name
            tempLesson["description"] = lesson.description
            tempLesson["state"] = lesson.state
            tempLesson["topics"] = []
            let lessonId = lesson._id
            let topics = lessonTopics[lessonId]
            let totalTopics = 0
            let completedTopics = 0
            if (topics !== undefined) {
                totalTopics = topics.length
                topics.forEach(topic => {
                    let tempTopic = {};
                    tempTopic["_id"] = topic._id
                    tempTopic["isActive"] = topic.isActive
                    tempTopic["user"] = topic.user
                    tempTopic["name"] = topic.name
                    tempTopic["noOfDays"] = topic.noOfDays
                    tempTopic["progress"] = []

                    let topicId = topic._id
                    let progressElements = lessonProgresses[topicId];
                    let x = (progressElements) ? progressElements.length : 0;
                    while (x--) {
                        if (progressElements[x].userId == userId) {
                            let tempProgress = {};
                            tempProgress["_id"] = progressElements[x]._id
                            tempProgress["userId"] = progressElements[x].userId
                            tempProgress["isCompleted"] = progressElements[x].isCompleted
                            tempProgress["setDate"] = progressElements[x].setDate
                            completedTopics = completedTopics + (progressElements[x].isCompleted ? 1 : 0)
                            tempTopic["progress"].push(tempProgress)
                        }
                    }
                    tempLesson["topics"].push(tempTopic)
                    
                })
            }
            tempLesson["percentageProgress"] = (Math.round((completedTopics / totalTopics) * 100)) + '%';
            finallessons.push(tempLesson)
        });
        return finallessons; 
    }
}

async function getTopicsForLesson(userParam) {
    const userId = userParam.user;
    const lessonId = userParam.lessonId;
    const ddLessonId = userParam.ddLessonId;
    const fromDate = userParam.fromDate;
    const toDate = userParam.toDate;
    const dailyOrWeekly = userParam.dailyOrWeekly;

    if (!userId || !ddLessonId || !lessonId || !fromDate || !toDate || !dailyOrWeekly)
        throw 'Please share correct input';
    try {
        const lessonArray = await Lesson.find({"_id": lessonId});
        
        if (lessonArray) {
            const lessonDetails = lessonArray[0];
            const lessonWithTopics = {};

            lessonWithTopics["lessonImage"] = (lessonDetails["lessonImage"]) ? config.repositoryHost + lessonDetails["lessonImage"] : '';
            lessonWithTopics["lessonImageHeight"] = lessonDetails["lessonImageHeight"];
            lessonWithTopics["lessonImageWidth"] = lessonDetails["lessonImageWidth"];
            lessonWithTopics["lessonName"] = lessonDetails["name"];

            const ddLesson = await Ddlesson.find({"_id": ddLessonId});
            
            if (!ddLesson) {
                throw 'Digital Diary lesson not found';
            }

            lessonWithTopics["ddLessonDetails"] = ddLesson[0];

            const ddTopicArray = await Ddtopic.find({"isActive" : true, "ddlesson": ddLessonId});
            
            let topicsData = [];
            if (dailyOrWeekly == 'daily') {
                topicsData = getDDTopicsForDaily(ddTopicArray, fromDate);
            } else if (dailyOrWeekly == 'weekly') {
                topicsData = getDDTopicsForWeek(ddTopicArray, fromDate, toDate);
            }
            
            if (topicsData) {
                lessonWithTopics['topics'] = topicsData;
            }

            return lessonWithTopics;
        } else {
            return 'No lesson details found';
        }
    } catch (error) {
        return error;
    }
}

function checkBetween(date1, date2, date3) {
    return (date1.isSameOrAfter(date2) && date1.isSameOrBefore(date3));
}

function getDDTopicsForDaily(ddTopicArray, tomorrow) {
    const dateToCompare = moment(new Date(tomorrow), "DD-MM-YYYY").subtract(1, 'days');
    const ddTopics = _.filter(ddTopicArray, (ddTopic) => {
        if (ddTopic.startDate != null && ddTopic.noOfDays != null) {
            const startDate = moment(ddTopic.startDate, "DD-MM-YYYY");
            const endDate = moment(ddTopic.startDate, "DD-MM-YYYY").add(ddTopic.noOfDays, 'days');
            return (checkBetween(dateToCompare, startDate, endDate));
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
                const startDate = moment(ddTopic.startDate, "DD-MM-YYYY").add(i, 'days');
                return (checkBetween(startDate, from, to));
            }
        }
    });
    return ddTopics;
}