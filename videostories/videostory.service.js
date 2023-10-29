const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const update_user_points = commonmethods.update_user_points;
const scheduleNotification = commonmethods.scheduleNotification;
const deleteScheduleNotifications = commonmethods.deleteScheduleNotifications;
const uploadToS3 = commonmethods.uploadToS3;
const deleteFromS3 = commonmethods.deleteFromS3;
const getImageDimension = commonmethods.getImageDimension;
const get_current_user = commonmethods.get_current_user;
const Videostory = db.Videostory;

var { promisify } = require('util');
var url = require('url');
var http = require('http');
var https = require('https');
var path = require('path');

module.exports = {
    getAll
};

async function getAll(req) {
  let requestParam = req.body;
  let sort = {};
  let sort_order = "asc"
  if (req.body.sort_order)
  {
    sort_order = req.body.sort_order
  }
  sort["createdDate"] = (sort_order == "asc") ? 1 : -1
  
  const videoStories = await Videostory.find().sort(sort)
  return videoStories
}
