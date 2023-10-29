//'use strict'
const config = require('../config.json');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const Coursediscussion = db.Coursediscussion;
const Enrollment = db.Enrollment;
var { promisify } = require('util');
var q = require('q');
var path = require('path')
var isBase64 = require('is-base64');
var moment = require('moment');
var _ = require('underscore');

module.exports = {
  discussions: discussions,
  saveComment: saveComment
};

function UserException(message,error_status) {
    this.message = message;
    this.error_status = error_status;
}

async function discussions(course, discussionId, pageNo) {
    let defer = require('q').defer();
    try {
        let query = {};
        query['course'] = course;
        if (discussionId != "" && discussionId != 0 && discussionId != "0") {
            query['parentComment'] = discussionId;
        } else {
            query['parentComment'] = {};
            query['parentComment']['$exists'] = false;            
        }
        
        let perPage = 5;
        let skip = (pageNo == 0 || pageNo == "0") ? 0: (pageNo-1) * perPage; 
        let comments = await Coursediscussion.find(query).populate('user',['fullName','image']).sort({createdDate: -1}).limit(perPage).skip(skip)
        let commentList = [];
        for (const curComment of comments) {
            let commentDetail = {};
            commentDetail['id'] = curComment.id;
            commentDetail['user'] = {}; 
            commentDetail['user']["id"] = curComment.user.id;
            commentDetail['user']["fullName"] = curComment.user.fullName;
            commentDetail['user']['image'] = (curComment.user.image != "" && curComment.user.image != null) ? config.repositoryHost + curComment.user.image : config.user_image;
            commentDetail['comment'] = curComment.comment;
            commentDetail['createdDate'] = curComment.createdDate;
            let childQuery = {};
            childQuery['parentComment'] = curComment.id;
            let dbChildComments = await Coursediscussion.find(childQuery).populate('user',['fullName','image']).sort({createdDate: -1}).limit(perPage)
            let childComments = [];
            for (const dbChildComment of dbChildComments) {
                let childCommentDetail = {};
                childCommentDetail['id'] = dbChildComment.id;
                childCommentDetail['user'] = {};
                childCommentDetail['user']["id"] = dbChildComment.user.id;
                childCommentDetail['user']["fullName"] = dbChildComment.user.fullName;
                childCommentDetail['user']['image'] = (dbChildComment.user.image != "" && dbChildComment.user.image != null) ? config.repositoryHost + dbChildComment.user.image : config.user_image;
                childCommentDetail['comment'] = dbChildComment.comment;
                childCommentDetail['createdDate'] = dbChildComment.createdDate;
                childComments.push(childCommentDetail);
            }
            commentDetail['childComments'] = childComments;

            commentList.push(commentDetail)
        }
        defer.resolve(commentList)
    } catch (e) {
        console.error(e);
        defer.reject(e);
        throw e;
    }
    return defer.promise
}
  
async function saveComment(req) {
    let defer = require('q').defer();
    try {
        let user = req.user;
        let course = req.course;
        let comment = req.comment;
        let parentComment = req.parent;
        
        let query = {};
        query['course'] = course;
        query['user'] = user;
        
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
        await newComment.save()
        defer.resolve({success: true})
    } catch (e) {
        console.log(e)
        throw e
        defer.reject(e)
    }
    return defer.promise
}
