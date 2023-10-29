const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const get_current_user = commonmethods.get_current_user;
const Activity = db.Activity;
const uploadToS3 = commonmethods.uploadToS3;

module.exports = {
    getAll,
    getById,
    create,
    update,
    edit,
    delete: _delete
};

async function getAll() {
    activities = await Activity.find().select('id name thumbnail url activity_code');
    activityList = [];
    for(var i = 0; i < activities.length;i++){
      
      activity = {};
      
      activity['id'] = activities[i]['id'];
      activity['name'] = activities[i]['name'];
      activity['activity_code'] = activities[i]['activity_code'];      
      activity["url"] = config.repositoryHost+activities[i]["url"];
      activity["thumbnail"] = config.repositoryHost+activities[i]["thumbnail"];

      activityList.push(activity);
    }
    return activityList;
    //return await Activity.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function getById(id, user) {
    
    activity = await Activity.findById(id).select('-hash');
    activity["is_liked"] = "";
    
    var departmentname = activity["department"];
    var subject = activity["subject"];
    var query = {};
    var queryCat = {};
    var queryActivity = {};
    if (departmentname !== "") {
      query['department'] = departmentname;
    }
    if (subject !== "") {
      query['subject'] = subject;
    }
    
    var categoryids = [];
    queryActivity['activity'] = activity;
    activityCategories = await Activitycategory.find(queryActivity).select('category');
    for(var i = 0; i < activityCategories.length;i++){
      categoryids.push(activityCategories[i]["category"]);
    }
    
    var activityids = [];
    queryCat["category"] = {};
    queryCat["category"]["$in"] = categoryids;
    categoryActivities = await Activitycategory.find(queryCat).select('activity');
    for(var i = 0; i < categoryActivities.length;i++){
      activityids.push(categoryActivities[i]["activity"]);
    }
  
    query["_id"] = {};
    query["_id"]["$nin"] = [id];
    
    if (activityids.length > 0) {
      query["_id"]["$in"] = activityids;
    }
    
    worksheet = []
    watch_next = await Activity.find(query).select('activity_code name thumbnail');
    watch_next.forEach(function(item, index, array) {
      watch_next[index].thumbnail = config.repositoryHost+item.thumbnail;
      if (index < 3) {
        worksheet.push(watch_next[index])
      } 
    });
    
    if (user !== "") {
      userlikes = await Activitylike.find({user: user, activity: id}).select('activity is_liked');
      for(var i = 0; i < userlikes.length;i++){
        activity["is_liked"] = userlikes[i]["is_liked"];
      }
    }
    activity["url"] = config.repositoryHost+activity["url"];
    activity["thumbnail"] = config.repositoryHost+activity["thumbnail"];
    activity["thumbnail"] = "https://img.youtube.com/vi/"+activity["activity_code"]+"/hqdefault.jpg"; //to be remove
    
    var activityData = {};
    activityData["activity"] = activity;
    activityData["watch_next"] = watch_next;
    if (activity["worksheet"] == "") {
      activityData["worksheet"] = [];
    } else {
      activityData["worksheet"] = worksheet;
    }
    return activityData;
}

async function create(req) {
    var current_user = get_current_user(req);
    var updatedAt = new Date();
    // validate
    activityParam = req.body
    
    activityParam.createdBy = current_user;
    activityParam.updatedBy = current_user;
    if (await Activity.findOne({ activity_code: activityParam.activity_code })) {
        throw 'Activity Youtube Code "' + activityParam.activity_code + '" is already taken';
    }

    const activity = new Activity(activityParam);

    // save activity
    if (await activity.save()) {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      }

      let thumbnail = req.files.thumbnail;
      let uploadData = await uploadToS3(thumbnail, "activity");
      activity.thumbnail = uploadData.Key;
      activity.save();
    }
    
    return {success: true}
}

async function edit(id) {
    activity = await Activity.findById(id).select('-hash');
    var activitydetail = {};    
    
    activitydetail["name"] = activity.name;
    activitydetail["activity_code"] = activity.activity_code;
    activitydetail["url"] = activity.url;
    activitydetail["thumbnail"] = config.repositoryHost+activity.thumbnail;
    activitydetail["description"] = activity.description;
    activitydetail["createdDate"] = activity.createdDate;
    activitydetail["id"] = activity.id;
    return activitydetail;
}

async function update(id, req) {
    var current_user = get_current_user(req);
    var updatedAt = new Date();
    activityParam = req.body
    const activity = await Activity.findById(id);

    // validate
    if (!activity) throw 'Activity not found';
    if (activity.activity_code !== activityParam.activity_code && await Activity.findOne({ activity_code: activityParam.activity_code })) {
        throw 'Activity "' + activityParam.activity_code + '" is already taken';
    }

    activityParam.updatedBy = current_user;
    activityParam.updatedDate = updatedAt;
    // copy activityParam properties to activity
    Object.assign(activity, activityParam);
    
    if (await activity.save()) {
      if (req.files && Object.keys(req.files).length === 1) {
        let thumbnail = req.files.thumbnail;
        let uploadData = await uploadToS3(thumbnail, "activity");
        activity.thumbnail = uploadData.Key;
        activity.save();
      }
    }
    
    return {success: true}
}

async function _delete(id) {
    await Activity.findByIdAndRemove(id);
    return {success: true}
}
