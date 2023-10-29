const db = require('../_helpers/db');
const Progress = db.Ddprogress;

module.exports = {
    setTopicDate
};

async function setTopicDate(userParam) {

    let ddlesson = userParam.ddlesson;
    let ddtopic = userParam.ddtopic;
    let userId = userParam.user;
    let setDate = userParam.setDate;
    let isCompleted = userParam.isCompleted;


    if (isCompleted) {
        await Progress.updateOne({ ddlesson: ddlesson, ddtopic: ddtopic, userId: userId }, { $set: { updatedDate: new Date(), setDate: setDate, isCompleted: isCompleted }, $setOnInsert: { createdDate: new Date() } }, { upsert: true });
    }
    else {
        await Progress.updateOne({ ddlesson: ddlesson, ddtopic: ddtopic, userId: userId }, { $set: { updatedDate: new Date(), setDate: setDate }, $setOnInsert: { createdDate: new Date() } }, { upsert: true });
    }

    return { success: true }
}