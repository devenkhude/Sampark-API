const db = require('../_helpers/db');
const Topic = db.Ddtopic;
const Progress = db.Ddprogress;
const User = db.User;
var objectId = require("mongoose").Types.ObjectId;

module.exports = {
    addTopic
};

// This API will called when user will click on + buttom to add topic on digital diary screen

async function addTopic(userParam) {

    let topicName = userParam.name;
    let ddlesson = userParam.ddlesson;
    let user = userParam.user;
    let setDate = userParam.setDate ? userParam.setDate : null;
    let isCompleted = userParam.isCompleted ? userParam.isCompleted : false;

    const teacherType = await User.findOne({ _id: user, "usertype": { $in: ["govt teacher", "spark"] }}).select('_id');
    if (teacherType == null) {
        return "Digital Diary is available for Govt Teachers and Spark";
    }

    // insert new entry for Topic
    let ddTopicObj = new Topic({
        name: topicName,
        ddlesson: new objectId(ddlesson),
        isActive: true,
        sortOrder: 1,
        createdBy: user,
        user: user,
        createdDate: new Date(),
        updatedDate: new Date(),
        updatedBy: user
    });

    await ddTopicObj.save();

    // insert new entry for Topic Progress
    let ddTopicProgressObj = new Progress({
        ddlesson: ddlesson,
        ddtopic: ddTopicObj._id,
        userId: user,
        setDate: setDate,
        isCompleted: isCompleted,
        createdDate: new Date(),
        updatedDate: new Date()
    });

    await ddTopicProgressObj.save();

    return { success: true }
}