const userService = require('../users/user.service');

module.exports = device;

function device(req, res, next) {

let d = new Date()
console.log("METHOD : "+req.path+" : "+d.toISOString());

    if (req.query.device_id) {
      device_id = req.query.device_id;
    } else  if (req.body.device_id) {
      device_id = req.body.device_id;
    } else {
      device_id = "";
    }

    if (req.query.apk_version) {
      apk_version = req.query.apk_version;
    } else  if (req.body.apk_version) {
      apk_version = req.body.apk_version;
    } else {      
      apk_version = "";
    }
     
    if (req.query.fcm_token) {
      fcm_token = req.query.fcm_token;
    } else  if (req.body.fcm_token) {
      fcm_token = req.body.fcm_token;
    } else if (req.query.fcmtoken) {
      fcm_token = req.query.fcmtoken;
    } else  if (req.body.fcmtoken) {
      fcm_token = req.body.fcmtoken;
    } else if (req.query.fcmToken) {
      fcm_token = req.query.fcmToken;
    } else  if (req.body.fcmToken) {
      fcm_token = req.body.fcmToken;
    } else{      
      fcm_token = "";
    }

    if (req.query.user) {
      userid = req.query.user;
    } else if (req.body.user) {
      userid = req.body.user;
    } else if (req.query.user_id) {
      userid = req.query.user_id;
    } else if (req.body.user_id) {
      userid = req.body.user_id;
    } else if (req.query.userid) {
      userid = req.query.userid;
    } else if (req.body.userid) {
      userid = req.body.userid;
    } else if (req.query.userId) {
      userid = req.query.userId;
    } else if (req.body.userId) {
      userid = req.body.userId;
    } else {
      userid = "";
    }
    if (userid == "undefined") {
      userid = "";
    }
    if (userid != "" && userid != "undefined") {
      action_performed = req.path;
      userService.last_active_time(userid, device_id, action_performed, apk_version, fcm_token);
    }
    next();
}
