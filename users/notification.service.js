const config = require('../config.json');
const db = require('../_helpers/db');
var _ = require("underscore");
const User = db.User;
const Video = db.Video;
const Notification = db.Notification;
const Videostream = db.Videostream;
const Imagestream = db.Imagestream;
const Textstream = db.Textstream;
const Sssvideolike = db.Sssvideolike;
const Imagelike = db.Imagelike;
const Videolike = db.Videolike;
const Textlike = db.Textlike;
const Course = db.Course;
const Livesession = db.Livesession;
const Livesessionattendance = db.Livesessionattendance;

module.exports = {
  getall: getall,
};

async function getall(userid, timestamp) {
  let defer = require('q').defer();
  try {
    if (!userid)
      throw "Kindly provide user details"

    let query = {};
    let bulkQuery = {};
    let courseQuery = {};
    let livesessionQuery = {};
    query["user"] = userid;
    bulkQuery["user"] = null;
    courseQuery["user"] = null;
    courseQuery["isSent"] = true;
    courseQuery["course"] = {};
    courseQuery["course"]["$exists"] = true;
    livesessionQuery["user"] = null;
    livesessionQuery["isSent"] = true;
    livesessionQuery["livesession"] = {};
    livesessionQuery["livesession"]["$exists"] = true;
    query["course"] = null;
    bulkQuery["course"] = null;
    livesessionQuery["course"] = null;
    query["createdDate"] = {};
    bulkQuery["createdDate"] = {};
    courseQuery["createdDate"] = {};
    livesessionQuery["createdDate"] = {};
    if (timestamp) {
      query["createdDate"]["$gt"] = timestamp;
      query["createdDate"]["$lte"] = new Date();

      bulkQuery["createdDate"]["$gt"] = timestamp;
      bulkQuery["createdDate"]["$lte"] = new Date();

      courseQuery["createdDate"]["$gt"] = timestamp;
      courseQuery["createdDate"]["$lte"] = new Date();

      livesessionQuery["createdDate"]["$gt"] = timestamp;
      livesessionQuery["createdDate"]["$lte"] = new Date();
    }
    else {
      query["createdDate"]["$lte"] = new Date();
      bulkQuery["createdDate"]["$lte"] = new Date();
      courseQuery["createdDate"]["$lte"] = new Date();
      livesessionQuery["createdDate"]["$lte"] = new Date();
    }
    const curUser = await User.findOne({ "_id": userid });

    if (curUser) {
      curUserGroup = curUser.usertype;
      curUserState = curUser.state;

      bulkQuery["topic"] = (curUserGroup.trim()).replace(" ", "_");
      courseQuery["topic"] = (curUserGroup.trim()).replace(" ", "_");
    }
    const sssvideolikes = await Sssvideolike.distinct('video', { user: userid })
    const videolikes = await Videolike.distinct('video', { user: userid })
    const imagelikes = await Imagelike.distinct('image', { user: userid });
    const textlikes = await Textlike.distinct('text', { user: userid });

    let user_notifications = [];
    let notifications = await Notification.find(query).sort({ createdDate: -1 }).populate('creator', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']).populate('stream').limit(30);
    let bulkNotifications = await Notification.find(bulkQuery).sort({ createdDate: -1 }).populate('creator', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']).populate('stream').limit(30);
    let courseNotifications = await Notification.find(courseQuery).sort({ createdDate: -1 }).populate('creator', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']).populate('course').limit(30);
    let livesessionNotifications = await Notification.find(livesessionQuery).sort({ createdDate: -1 }).populate('creator', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']).populate('livesession').limit(30);
    notifications = notifications.concat(bulkNotifications);
    notifications = notifications.concat(courseNotifications);
    for (const livesessionNotification of livesessionNotifications) {
      let livesession = livesessionNotification.livesession
      checklivesessionuser = await Livesessionattendance.find({ livesession: livesession, user: userid, acceptance: { "$ne": "no" } })
      if (checklivesessionuser.length == 1) {
        notifications.push(livesessionNotification)
      }
    }
    notifications = (_.sortBy(notifications, 'createdDate')).reverse();
    for (const notification of notifications) {
      let user_notification = {};

      let notification_stream = notification.stream
      let notification_course = notification.course
      let notification_livesession = notification.livesession
      
      let stream = {};
      if (notification_stream !== null && notification_stream !== undefined && notification.creator !== null) {
        let streamDetail = "";
        if (notification_stream['item_type'] == "video") {
          streamDetail = await Videostream.findById(notification_stream['item_id']).populate('author', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'fullName', 'viewcount']);

        } else if (notification_stream['item_type'] == "image") {
          streamDetail = await Imagestream.findById(notification_stream['item_id']).populate('author', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'fullName']);

        } else if (notification_stream['item_type'] == "text") {
          streamDetail = await Textstream.findById(notification_stream['item_id']).populate('author', ['firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'fullName']);
        } else if (notification_stream['item_type'] == "sssvideo") {
          streamDetail = await Video.findById(notification_stream['item_id']).populate('subject', 'name').populate('department', 'name');
        }

        if (streamDetail) {
          stream['module'] = "baithak"
          if (notification_stream['item_type'] == "video") {
            if (videolikes.indexOf(notification_stream["item_id"]) > -1) {
              stream["is_liked"] = (videolikes[notification_stream["item_id"]]) ? videolikes[notification_stream["item_id"]] : "";
            } else {
              stream["is_liked"] = "";
            }

          } else if (notification_stream['item_type'] == "image") {
            if (imagelikes.indexOf(notification_stream["item_id"]) > -1) {
              stream["is_liked"] = (imagelikes[notification_stream["item_id"]]) ? imagelikes[notification_stream["item_id"]] : "";
            } else {
              stream["is_liked"] = "";
            }

          } else if (notification_stream['item_type'] == "text") {
            if (textlikes.indexOf(notification_stream["item_id"]) > -1) {
              stream["is_liked"] = (textlikes[notification_stream["item_id"]]) ? textlikes[notification_stream["item_id"]] : "";
            } else {
              stream["is_liked"] = "";
            }

          } else if (notification_stream['item_type'] == "sssvideo") {
            stream['module'] = streamDetail['module'];
            if (sssvideolikes.indexOf(notification_stream["item_id"]) > -1) {
              stream["is_liked"] = (sssvideolikes[notification_stream["item_id"]]) ? sssvideolikes[notification_stream["item_id"]] : "";
            } else {
              stream["is_liked"] = "";
            }
          }

          stream['stream_type'] = notification_stream['item_type'];
          stream['stream_id'] = streamDetail.id;
          stream['id'] = notification_stream['id'];
          stream["likecount"] = streamDetail['likecount'];
          stream["commentcount"] = streamDetail['commentcount'];
          if (notification_stream['item_type'] == "image" || notification_stream['item_type'] == "text")
            stream["viewcount"] = notification_stream['viewcount'];
          else if (notification_stream['item_type'] == "video" || notification_stream['item_type'] == "sssvideo")
            stream["viewcount"] = streamDetail['viewcount'];

          stream["viewcount"] = parseInt(stream["viewcount"]) + getAdditionalViewCount(stream["likecount"], stream["commentcount"]);
          // else
          //   stream["viewcount"] = 0;
          stream["created_at"] = notification_stream['publishDate'];
          stream["publish_at"] = notification_stream['publishDate'];
          stream['hashtags'] = notification_stream['hashtags'];
          stream['postOn'] = notification_stream['postOn'];

          if (notification_stream['is_podcast_post'] == true) {
            stream["author"] = "Sampark Radio";
            stream["author_id"] = streamDetail['author'];
            stream["location"] = "India";
          }
          else if (notification_stream['item_type'] != "sssvideo") {
            stream["author"] = titleize(streamDetail['author']['fullName']);
            stream["author_id"] = streamDetail['author']['_id'];
            stream["location"] = streamDetail['author']['location'];
          }
          else {
            stream["author"] = "Sampark Didi";
            stream["author_id"] = streamDetail['author'];
            stream["location"] = "India";
          }
          stream["is_report_abused"] = notification_stream['is_report_abused'];
          stream["is_shareable"] = streamDetail['is_shareable'];
          stream["description"] = streamDetail['description'];
          stream["height"] = streamDetail['height'];
          stream["width"] = streamDetail['width'];
          stream["is_deleted"] = notification_stream['is_deleted'];
          stream["is_hidden"] = notification_stream['is_hidden'];
          stream["is_report_abused"] = notification_stream['is_report_abused'];
          stream['hashtags'] = notification_stream['hashtags'];

          if (stream['author'] === "Sampark Didi")
            stream['image'] = config.didi_image;
          else if (stream['author'] === "Sampark Radio")
            stream['image'] = config.radio_image;
          else
            stream['image'] = (!streamDetail.author.image || streamDetail.author.image == "" || streamDetail.author.image == "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;

          if (notification_stream['item_type'] === "image") {
            stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
            if (streamDetail['thumbnails'] != undefined && streamDetail['thumbnails'] != '' && streamDetail['thumbnails'] != null && streamDetail['thumbnails'].length > 0) {
              stream["thumbnails"] = getThumbnailsArray(streamDetail['thumbnails']);
              stream["thumbnails_dimensions"] = streamDetail['thumbnails_dimensions'];
            }
          } else if (notification_stream['item_type'] !== "text") {
            stream["video_code"] = streamDetail.youtube_code;
            if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null) {
              stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
            } else {
              stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
            }
          }
        }

      }

      user_notification['id'] = notification['id'];
      user_notification['created_at'] = notification['createdDate'];
      user_notification['message'] = notification['message'];
      if (user_notification['message'] !== "follow" && notification_stream !== null && notification_stream !== undefined) {
        user_notification['stream'] = stream;
        user_notification['item_type'] = notification_stream['item_type'];
        user_notification['item_id'] = notification['item_id'];
        user_notification['stream_id'] = notification_stream['id'];
      }
      if (user_notification['message'] !== "follow" && notification_course !== null && notification_course !== undefined) {
        let courseDetail = {};
        courseDetail['name'] = notification.course.name;
        courseDetail['description'] = notification.course.description;
        courseDetail['image'] = config.repositoryHost + notification.course.image;
        user_notification['course'] = courseDetail;
        user_notification['item_type'] = "course";
        user_notification['course_id'] = notification.course.id;
      }
      if (user_notification['message'] !== "follow" && notification_livesession !== null && notification_livesession !== undefined) {
        user_notification['livesession'] = notification_livesession;
        user_notification['item_type'] = "livesession";
        user_notification['livesession_id'] = notification_livesession.id;
      }
      user_notification['author'] = (notification.creator.lastName) ? titleize(notification.creator.firstName + " " + notification.creator.lastName) : titleize(notification.creator.firstName);
      // Below condition to get image from stream if post is from Sampark Radio or Sampark Didi
      if (user_notification['message'] !== "sdvideo" && user_notification['message'] !== "podcast")
        user_notification['image'] = (!notification.creator.image || notification.creator.image == "" || notification.creator.image == "null") ? config.user_image : config.repositoryHost + notification.creator.image;
      else
        user_notification['image'] = stream["image"];
      user_notifications.push(user_notification);
    }
    defer.resolve(user_notifications);
  } catch (e) {
    console.log(e);
    defer.reject(e)
  }
  return defer.promise;
}

function getAdditionalViewCount(likeCount, commentCount) {
  let likeViewCount = parseInt(likeCount) * config.view_count_multiple_for_like;
  let commentViewCount = parseInt(commentCount) * config.view_count_multiple_for_comment;

  return likeViewCount + commentViewCount;
}

function getThumbnailsArray(thumbnailArray) {
  let thumbnails = [];
  for (const thumbnail of thumbnailArray) {
    thumbnails.push(config.repositoryHost + thumbnail);
  }
  return thumbnails;
}

function titleize(name) {
  return name.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
}
