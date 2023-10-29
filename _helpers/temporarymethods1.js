const config = require("../config.json");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
var moment = require('moment');
mongoose.connect(process.env.MONGODB_URI || config.connectionString, {
	useCreateIndex: true,
	useNewUrlParser: true,
});
mongoose.Promise = global.Promise;

const db = require("./db");
const AWS = require("aws-sdk");
const BUCKET_NAME = config.bucket_name;
let q = require("q");
const IAM_USER_KEY = config.aws_key;
const IAM_USER_SECRET = config.aws_secret;
const User = db.User;
const State = db.State;
const Notification = db.Notification;
const Documentviewed = db.Documentviewed;
const Scertsolutionviewed = db.Scertsolutionviewed;
const Videoviewed = db.Videoviewed;
const Sssvideoviewed = db.Sssvideoviewed;
const Kitviewed = db.Kitviewed;
const Audioviewed = db.Audioviewed;
const Scertsolution = db.Scertsolution;
const Lessonprogress = db.Lessonprogress;
const Stream = db.Stream;
const Teachersparkle = db.Teachersparkle;
const Enrollment = db.Enrollment;
const Imagelike = db.Imagelike;
const Videolike = db.Videolike;
const Textlike = db.Textlike;

const Videostream = db.Videostream;
const Imagestream = db.Imagestream;
const Textstream = db.Textstream;

const Videocomment = db.Videocomment;
const Imagecomment = db.Imagecomment;
const Textcomment = db.Textcomment;

const Assessment = db.Assessment;
const AssessmentQuestion = db.Assessmentquestion;
const AssessmentStudentProgress = db.Assessmentstudentprogress;

const Userattendance = db.Userattendance;
const Userbadge = db.Userbadge;
const Reward = db.Reward;
const Student = db.Student;
const Sparkle = db.Usersparkle;
const Topteachers = db.Topteacher;
const Videostory = db.Videostory;
const Courseprogress = db.Courseprogress;
const Teacherrank = db.Teacherrank;
const Parentrank = db.Parentrank;
const Teachersssrank = db.Teachersssrank;
const Parentsssrank = db.Parentsssrank;
const Teacherbaithaklikesrank = db.Teacherbaithaklikesrank;
const Parentbaithaklikesrank = db.Parentbaithaklikesrank;
const Teachercourserank = db.Teachercourserank;
const Parentcourserank = db.Parentcourserank;
const Teacherassessmentrank = db.Teacherassessmentrank;
const Parentassessmentrank = db.Parentassessmentrank;
const Teacherdigitaldiaryrank = db.Teacherdigitaldiaryrank;
const Parentdigitaldiaryrank = db.Parentdigitaldiaryrank;
const Teacherbonusrank = db.Teacherbonusrank;
const Parentbonusrank = db.Parentbonusrank;
const District = db.District;
const Progress = db.Ddprogress;

const VideoDeactivationHistory = db.VideoDeactivationHistory;
const socket = require("socket.io-client")(config.applicationHost);
const https = require("https");
const path = require("path");
const fs = require("fs");

var readline = require("readline");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
var _ = require("underscore");
var SCOPES = [
	"https://www.googleapis.com/auth/youtube.upload",
	"https://www.googleapis.com/auth/youtube",
];
//var TOKEN_DIR = "D:\\youtube-token\\";
//var TOKEN_PATH = TOKEN_DIR + "youtube-authorization-token.json";
//var TOKEN_DIR = "/var/www/html/Prod/youtube-token/";
var TOKEN_DIR = config.token_dir;
var TOKEN_PATH = TOKEN_DIR + "youtube-authorization-token.json";
var objectId = require("mongoose").Types.ObjectId;
const { Sssvideolike, Sssvideocomment } = require("./db");
const { ObjectId } = require("bson");
const { find } = require("underscore");
const { registerStudentForNewAPK } = require("../assessments/assessmentreport.service");

module.exports = {
	getUniqueUsers: async function (collection, year, month) {
    console.log(year)
    console.log(month)
		let userAttData = await collection.distinct('user',{year: year, month: month})
		return userAttData;
	},
  removeDuplicateRanks: async function (newYear, newMonth) {
    await this.removeDuplicateTeacherRanks(Teacherrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Teachersssrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentsssrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Teacherbaithaklikesrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentbaithaklikesrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Teachercourserank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentcourserank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Teacherassessmentrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentassessmentrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Teacherdigitaldiaryrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentdigitaldiaryrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Teacherbonusrank, newYear, newMonth)
    await this.removeDuplicateTeacherRanks(Parentbonusrank, newYear, newMonth)
    console.log("All Duplication Removed")
  },
  removeDuplicateTeacherRanks: async function (collection, newYear, newMonth) {
    console.log("Removing Duplication From ", collection.modelName)
		let today = new Date();
		let yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);
		const startOfDay = new Date(yesterday.setUTCHours(0, 0, 0, 0)).toISOString();
    let deletedRecords = 0
		// let activeUsers = await this.getActiveUsers(startOfDay);
		let uniqueUsers = await this.getUniqueUsers(collection, newYear, newMonth);
    console.log("Unique Users in ", collection.modelName, ' : ',uniqueUsers.length)
    for (const uniqueUser of uniqueUsers) {
      teacherranks = await collection.find({user: uniqueUser, month: newMonth, year: newYear}).sort({sssTotal: -1})
      if (teacherranks.length > 1) {
        //console.log(teacherranks)
        let i = 0
        for (const teacherrank of teacherranks) {
          //console.log("I : ",i)
          if (i > 0) {
            await collection.deleteOne({"_id":teacherrank.id})
            deletedRecords = deletedRecords + 1
          }
          i = i + 1
        }
      }
    }
    console.log("Total Records Deleted for ",collection.modelName," : ",deletedRecords)
    return ""
	},
	
};
