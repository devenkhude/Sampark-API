//'use strict'
const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const Coursediscussion = db.Coursediscussion;
const Enrollment = db.Enrollment;
const { promisify } = require("util");
const q = require("q");
const path = require("path");
const isBase64 = require("is-base64");
const moment = require("moment");
const _ = require("underscore");

module.exports = {
  discussions: discussions,
  saveComment: saveComment,
};

function UserException(message, error_status) {
  this.message = message;
  this.error_status = error_status;
}

async function discussions(course, discussionId, pageNo) {
  try {
    const query = {
      course: course,
      parentComment:
        discussionId !== "" && discussionId !== 0 && discussionId !== "0"
          ? discussionId
          : { $exists: false },
    };

    const perPage = 5;
    const skip = pageNo == 0 || pageNo === "0" ? 0 : (pageNo - 1) * perPage;

    const comments = await Coursediscussion.find(query)
      .populate("user", ["fullName", "image"])
      .sort({ createdDate: -1 })
      .limit(perPage)
      .skip(skip);

    const commentList = await Promise.all(
      comments.map(async (curComment) => {
        const commentDetail = {
          id: curComment.id,
          user: {
            id: curComment.user.id,
            fullName: curComment.user.fullName,
            image:
              curComment.user.image !== "" && curComment.user.image !== null
                ? config.repositoryHost + curComment.user.image
                : config.user_image,
          },
          comment: curComment.comment,
          createdDate: curComment.createdDate,
          childComments: [],
        };

        const childQuery = { parentComment: curComment.id };
        const dbChildComments = await Coursediscussion.find(childQuery)
          .populate("user", ["fullName", "image"])
          .sort({ createdDate: -1 })
          .limit(perPage);

        commentDetail.childComments = dbChildComments.map((dbChildComment) => ({
          id: dbChildComment.id,
          user: {
            id: dbChildComment.user.id,
            fullName: dbChildComment.user.fullName,
            image:
              dbChildComment.user.image !== "" &&
              dbChildComment.user.image !== null
                ? config.repositoryHost + dbChildComment.user.image
                : config.user_image,
          },
          comment: dbChildComment.comment,
          createdDate: dbChildComment.createdDate,
        }));

        return commentDetail;
      })
    );

    return commentList;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function saveComment(req) {
  let defer = require("q").defer();
  try {
    let user = req.user;
    let course = req.course;
    let comment = req.comment;
    let parentComment = req.parent;

    let query = {};
    query["course"] = course;
    query["user"] = user;

    //const checkEnroll = await Enrollment.countDocuments(query)

    //if (checkEnroll == 0) {
    //  throw "Enroll for the course to enter into the discussion"
    //}
    let newComment = new Coursediscussion();
    newComment.course = course;
    newComment.user = user;
    newComment.comment = comment;
    if (parentComment !== null && parentComment !== "") {
      newComment.parentComment = parentComment;
    }
    await newComment.save();
    defer.resolve({ success: true });
  } catch (e) {
    console.log(e);
    throw e;
    defer.reject(e);
  }
  return defer.promise;
}
