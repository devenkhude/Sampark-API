const config = require('../config.json');
const fs = require('fs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const cronmethods = require('../_helpers/cronmethods');
const update_user_points = commonmethods.update_user_points;
const titleize = commonmethods.titleize;
const update_social_hours = commonmethods.update_social_hours;
const update_post_action = commonmethods.update_post_action;
const create_notification = commonmethods.create_notification;
const uploadToS3 = commonmethods.uploadToS3;
const uploadStreamToS3 = commonmethods.uploadStreamToS3;
const uploadOnYouTube = commonmethods.uploadOnYouTube;
const deleteOnYouTube = commonmethods.deleteOnYouTube;
const downloadFileFromURL = commonmethods.downloadFileFromURL;
const getAWSObject = commonmethods.getAWSObject;
const calculate_lesson_progress = commonmethods.calculate_lesson_progress;
const User = db.User;
const Uservideo = db.Uservideo;
const Userscertvideo = db.Userscertvideo;
const Textscertstream = db.Textscertstream;
const Imagescertstream = db.Imagescertstream;
const Videoscertstream = db.Videoscertstream;
const Pdfscertstream = db.Pdfscertstream;
const Scertstream = db.Scertstream;
const Textstream = db.Textstream;
const Imagestream = db.Imagestream;
const Videostream = db.Videostream;
const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;
const Stream = db.Stream;
const Video = db.Video;
const Audio = db.Audio;
const Audiotextbook = db.Audiotextbook;
const PostShare = db.PostShare;
const Course = db.Course;
const Notification = db.Notification;
//convert -font helvetica -fill black -pointsize 30 -gravity center -draw "text 0,30 'GAGAN SHARMA'" cert.png result.png
//convert -font helvetica -fill black -pointsize 20 -gravity southwest -draw "text 80,120 '26-02-2020'" result.png result1.png
//convert -font helvetica -fill black -pointsize 30 -gravity center -draw "text 0,30 'GAGAN SHARMA' text 80,120 '26-02-2020'" certificate-english-class3.png result.png
const Scertimagecomment = db.Scertimagecomment;
const Scertvideocomment = db.Scertvideocomment;
const Scertpdfcomment = db.Scertpdfcomment;
const Scerttextcomment = db.Scerttextcomment;
const Scertimagelike = db.Scertimagelike;
const Scertvideolike = db.Scertvideolike;
const Scertpdflike = db.Scertpdflike;
const Scerttextlike = db.Scerttextlike;

const Imagecomment = db.Imagecomment;
const Videocomment = db.Videocomment;
const Sssvideocomment = db.Sssvideocomment;
const Textcomment = db.Textcomment;
const Imagelike = db.Imagelike;
const Videolike = db.Videolike;
const Sssvideolike = db.Sssvideolike;
const Textlike = db.Textlike;
const Videoplayed = db.Videoplayed;
const Sssvideoplayed = db.Sssvideoplayed;
const Audioplayed = db.Audioplayed;
const Audiotextbookplayed = db.Audiotextbookplayed;
const Audiotextbooklike = db.Audiotextbooklike;
const Audiotextbookcomment = db.Audiotextbookcomment;

const Englishspeechviewed = db.Englishspeechviewed;
const Audiotextbookviewed = db.Audiotextbookviewed;
const Scertsolutionviewed = db.Scertsolutionviewed;
const Documentviewed = db.Documentviewed;
const Kitviewed = db.Kitviewed;
const Lesson = db.Lesson;
const Userdevice = db.Userdevice;
const Lessonprogress = db.Lessonprogress;
const Unlockedlesson = db.Unlockedlesson;
const Videoviewed = db.Videoviewed;
const Sssvideoviewed = db.Sssvideoviewed;
const Audioviewed = db.Audioviewed;
const Userbadge = db.Userbadge;
const Usercertificate = db.Usercertificate;
const Badge = db.Badge;
const Certificate = db.Certificate;
const Userattendance = db.Userattendance;
const Subcomment = db.Subcomment;

const Userfollower = db.Userfollower;
const State = db.State;
const Sssassessmentviewed = db.Sssassessmentviewed;
const Boloviewed = db.Boloviewed;
const Sparkle = db.Usersparkle;
const Teacherranks = db.Teacherrank;
const Parentranks = db.Parentrank;
const Enrollment = db.Enrollment;

const School = db.School;

var path = require('path');
var isBase64 = require('is-base64');
const { ObjectID } = require('mongodb');
var objectId = require("mongoose").Types.ObjectId;
var _ = require("underscore");
const englishFont = "Utopia-Regular"
//const englishFont = "helvetica"

module.exports = {
    getAll,
    getScertUploads,
    getById,
    uploadnew,
    postaction,
    uploadscert,
    comment,
    like,
    edit,
    comments,
    updatehours,
    played,
    offlinesyncing,
    resourceviewed,
    lessonunlocked,
    getLeaderShip,
    sendcertificate,
    replyOnComment,
    deleteComment,
    followunfollow,
    followers,
    otherProfile,
    recordPostShare,
    sendPushForDDLesson
};

/*
This API is to get badges and certificates for given user.
It also gives progress in percentage for maths and english subjects.
And time spent in learning daily, monthly, total and today.

DB Indexes  : is_active on badges and certificates
user on userdevices
user on userbadges 
user on userattendances
user,certificate on usercertificates
module on subjectmasters
module on departmentmasters
subject,department and section on lessons
user,lesson on lessonprogresses

*/
async function getLeaderShip(req) {

    //If user id is received in get request
    if (req.query.user) {
        let user = req.query.user;

        let curUser = await User.findById(user);

        //If apk_version is not found in request
        let apk_version = (req.query.apk_version) ? req.query.apk_version : 4.9;
        if (!apk_version) {
            let curUserDevice = await Userdevice.find({ "user": userid }, { apk_version: 1 }).sort({ last_active_on: -1 })
            apk_version = (curUserDevice[0]) ? curUserDevice[0].apk_version : 4.9;
        }

        let tempbadge = {};
        let welcomedate = new Date();
        let mastercertificates = [];
        let masterbadges = [];
        const certificatesfiles = [];
        // let badgeQuery = {};
        // badgeQuery['is_active'] = true;
        // badgeQuery['$or'] = [];
        // badgeQuery['$or'].push({ "applicableFor": "both" });
        let userType = "";
        if (curUser['usertype'] == "govt teacher" || curUser['usertype'] == "teacher")
            userType = "teacher";
        else if (curUser['usertype'] == "parent")
            userType = "parent";
        // badgeQuery['$or'].push({ "applicableFor": userType });
        //To get active badges and certificates from db 
        // const masterbadgess = await Badge.find(badgeQuery);
        const mastercertificatess = await Certificate.find({ is_active: true }).sort({ "subject": -1 });

        //To define welcome badge
        welcomedate.setDate(welcomedate.getDate() + 365);
        tempbadge['_id'] = '00000000000000000000000';
        tempbadge['name'] = 'welcome';
        tempbadge['title'] = 'Welcome';
        tempbadge['path'] = (apk_version < 4.8) ? '/welcome.png' : config.assetHost + 'welcome.png';
        tempbadge['is_active'] = true;
        tempbadge['expiry'] = welcomedate;
        tempbadge['description'] = 'अरे वाह! आपने सीखने की दिशा में पहला कदम उठा लिया है! बैठक समुदाय इस पदक के साथ आपका स्वागत करता है।\n\nYou have taken the first step to learning! Baithak community welcomes you with this badge.';
        tempbadge['id'] = '00000000000000000000000';
        masterbadges.push(tempbadge);

        //Loop through db badges array and update few values in it
        // for (const masterbadge of masterbadgess) {
        //     tempbadge = {};
        //     tempbadge['_id'] = masterbadge['_id'];
        //     tempbadge['name'] = masterbadge['name'];
        //     tempbadge['title'] = masterbadge['title'];
        //     tempbadge['path'] = (apk_version < 4.8) ? masterbadge['path'] : config.assetHost + masterbadge['path'].replace('/', '');
        //     tempbadge['is_active'] = false;
        //     tempbadge['expiry'] = masterbadge['expiry'];
        //     tempbadge['description'] = masterbadge['description'];
        //     tempbadge['id'] = masterbadge['id'];
        //     masterbadges.push(tempbadge);
        // }

        //Loop through db certificates array and update few values in it
        for (const mastercertificate of mastercertificatess) {
            const certificateFileObj = {};
            let tempcertificate = {};
            tempcertificate['is_active'] = false;
            tempcertificate['total_duration'] = mastercertificate['total_duration'];
            tempcertificate['_id'] = mastercertificate['_id'];
            tempcertificate['name'] = mastercertificate['name'];
            tempcertificate['path'] = (apk_version < 4.8) ? mastercertificate['path'] : config.assetHost + mastercertificate['path'].replace('/', '');
            tempcertificate['rpath'] = mastercertificate['path'];
            tempcertificate['message'] = mastercertificate['message'];
            tempcertificate['department'] = mastercertificate['department'];
            tempcertificate['subject'] = mastercertificate['subject'];
            tempcertificate['id'] = mastercertificate['id'];
            certificateFileObj.id = mastercertificate['id'];
            certificateFileObj.filePath = mastercertificate['path'];
            certificatesfiles.push(certificateFileObj);
            mastercertificates.push(tempcertificate);
        }
        //Formatting current date
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }
        today = dd + '-' + mm + '-' + yyyy;
        let enddate = yyyy + '-' + mm + '-' + dd;

        //To get user badges and attendance
        // const userbadges = await Userbadge.find({ 'user': user })
        // const userattendance = await Userattendance.find({ 'user': user, 'attendance_date': today })
        // const userattendances = await Userattendance.find({ 'user': user }).sort({ createdDate: 1 })

        //To get subjects
        const subjects = await Subjectmaster.find({ 'module': 'sss' }, { 'name': 1 });

        let class_subject_progress = {};
        let subject_names = {};
        for (const subject of subjects) {
            subject_names[subject.id] = {};
            subject_names[subject.id]['name'] = subject.name;
            subject_names[subject.id]['lessons'] = 0;
            subject_names[subject.id]['progress'] = 0;
            subject_names[subject.id]['progress_percent'] = 0;
        }

        const classes = await Departmentmaster.find({ 'module': 'sss' }, { 'name': 1, 'id': 1, 'subjects': 1 });
        let total_lessons = 0;
        for (const classdept of classes) {
            let classkey = classdept.id;

            class_subject_progress[classkey] = {};
            class_subject_progress[classkey]['name'] = classdept.name;
            class_subject_progress[classkey]['lessons'] = 0;
            class_subject_progress[classkey]['progress'] = 0;
            class_subject_progress[classkey]['progress_percent'] = 0;

            for (const classsubjectid of classdept.subjects) {

                let subjectkey = classsubjectid;
                if (subject_names[classsubjectid]) {
                    class_subject_progress[classkey][subjectkey] = {};
                    class_subject_progress[classkey][subjectkey]['name'] = subject_names[classsubjectid]['name'];
                    class_subject_progress[classkey][subjectkey]['lessons'] = 0;
                    class_subject_progress[classkey][subjectkey]['progress'] = 0;
                    class_subject_progress[classkey][subjectkey]['progress_percent'] = 0;

                    let lessonids = [];
                    await Lesson.find({ 'subject': classsubjectid, 'department': classdept.id, 'section': 'sss' }).then(lessons => {
                        for (const lesson of lessons) {
                            class_subject_progress[classkey]['lessons'] = class_subject_progress[classkey]['lessons'] + 1
                            total_lessons = total_lessons + 1;
                            class_subject_progress[classkey][subjectkey]['lessons'] = class_subject_progress[classkey][subjectkey]['lessons'] + 1

                            subject_names[classsubjectid]['lessons'] = subject_names[classsubjectid]['lessons'] + 1;

                            lessonids.push(require('mongodb').ObjectID(lesson.id))
                        }
                    })

                    let query_video = {};
                    query_video['user'] = user;
                    query_video['lesson'] = {};
                    query_video['lesson']['$in'] = lessonids;
                    await Lessonprogress.find(query_video).then(lesson_progress => {
                        for (const progress of lesson_progress) {
                            class_subject_progress[classkey]['progress'] = class_subject_progress[classkey]['progress'] + progress['progress'];
                            class_subject_progress[classkey][subjectkey]['progress'] = class_subject_progress[classkey][subjectkey]['progress'] + progress['progress'];
                            subject_names[classsubjectid]['progress'] = subject_names[classsubjectid]['progress'] + progress['progress'];
                        }
                    })
                    let subjectprogress = class_subject_progress[classkey][subjectkey]['progress'] / class_subject_progress[classkey][subjectkey]['lessons']
                    class_subject_progress[classkey][subjectkey]['progress_percent'] = Math.round((subjectprogress + Number.EPSILON) * 100) / 100
                }
            }
            let classprogress = class_subject_progress[classkey]['progress'] / class_subject_progress[classkey]['lessons'];
            class_subject_progress[classkey]['progress_percent'] = Math.round((classprogress + Number.EPSILON) * 100) / 100
        }

        for (const subject of subjects) {
            let subjectprogress = subject_names[subject.id]['progress'] / subject_names[subject.id]['lessons'];
            subject_names[subject.id]['progress_percent'] = Math.round((subjectprogress + Number.EPSILON) * 100) / 100
        }

        let leadership = {};
        // leadership['badges'] = '';
        leadership['certificates'] = '';
        // leadership['progress'] = {};
        // leadership['time_spent'] = {};
        // leadership['time_spent']['daily'] = 0;
        // leadership['time_spent']['monthly'] = 0;
        // leadership['time_spent']['total'] = 0;

        // for (const subject of subjects) {
        //     leadership['progress'][subject.name] = subject_names[subject.id]['progress_percent']
        // }

        // leadership["progress"]["Baithak"] = 0;

        // if (userattendance.length == 1) {
        //     leadership["time_spent"]["today"] = userattendance[0]['sss_hours'];
        // } else {
        //     leadership["time_spent"]["today"] = 0;
        // }
        // if (userattendances.length > 0) {
        //     let start_date = userattendances[0]['attendance_date'];

        //     let sdate = new Date(start_date.split('-').reverse().join('-'));
        //     let edate = new Date(enddate);
        //     let no_of_days = Math.ceil(Math.abs(edate.getTime() - sdate.getTime()) / (1000 * 3600 * 24)) + 1;
        //     let total_hours = 0;
        //     let monthly_hours = {};
        //     for (i = 0; i < userattendances.length; i++) {
        //         let attendance_dates = userattendances[i]['attendance_date'].split('-')
        //         let attendance_month = attendance_dates[1] + '-' + attendance_dates[2];
        //         if (!monthly_hours.hasOwnProperty(attendance_month)) {
        //             monthly_hours[attendance_month] = 0;
        //         }
        //         monthly_hours[attendance_month] = monthly_hours[attendance_month] + userattendances[i]['sss_hours'];
        //         total_hours = total_hours + userattendances[i]['sss_hours']
        //     }
        //     let no_of_months = Object.keys(monthly_hours).length
        //     leadership['time_spent']['daily'] = Math.ceil(total_hours / no_of_days);
        //     leadership['time_spent']['total'] = total_hours;
        //     leadership['time_spent']['monthly'] = Math.ceil(total_hours / no_of_months);
        // }

        // if (userbadges.length > 0) {
        //     let badges = [];
        //     for (const userbadge of userbadges) {
        //         badges[userbadge['badge']] = userbadge['expiryDate'] //.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})

        //         if (userbadge["type"] == "topsss") {
        //             let tempBadge = {};
        //             tempBadge.user = userbadge["user"];
        //             tempBadge.badge = userbadge["badge"];
        //             tempBadge.type = userbadge["type"];
        //             tempBadge.expiry = userbadge["expiryDate"];
        //             tempBadge.createdDate = userbadge["createdDate"];
        //             tempBadge.name = "silver";
        //             tempBadge.is_active = true;
        //             tempBadge.path = config.assetHost + "/top_sss.png".replace('/', '');

        //             let created = new Date(userbadge["createdDate"]);
        //             created.setMonth(created.getMonth() - 1);
        //             let monthIndex = created.getMonth();

        //             let monthName = getMonthName(monthIndex);
        //             tempBadge.title = "टॉप SSS टीचर " + (monthName.split(" "))[1] + " " + created.getFullYear();
        //             tempBadge.description = 'बधाई हो, आप ' + (monthName.split(" "))[1] + ' महीने के लिए शीर्ष SSS शिक्षक हैं।\n\n Congratulations, you are the top SSS teacher for the month of ' + (monthName.split(" "))[0];

        //             masterbadges.push(tempBadge);
        //         }
        //         else if (userbadge["type"] == "topbaithak") {
        //             let tempBadge = {};
        //             tempBadge.user = userbadge["user"];
        //             tempBadge.badge = userbadge["badge"];
        //             tempBadge.type = userbadge["type"];
        //             tempBadge.expiry = userbadge["expiryDate"];
        //             tempBadge.createdDate = userbadge["createdDate"];
        //             tempBadge.is_active = true;
        //             tempBadge.name = "bronze";
        //             tempBadge.path = config.assetHost + "/top_baithak.png".replace('/', '');
        //             let created = new Date(userbadge["createdDate"]);
        //             created.setMonth(created.getMonth() - 1);
        //             let monthIndex = created.getMonth();

        //             let monthName = getMonthName(monthIndex);
        //             tempBadge.title = "टॉप बैठक टीचर " + (monthName.split(" "))[1] + " " + created.getFullYear();
        //             tempBadge.description = 'बधाई हो, आप ' + (monthName.split(" "))[1] + ' महीने के लिए शीर्ष बैथक शिक्षक हैं।\n\n Congratulations, you are the top Baithak teacher for the month of ' + (monthName.split(" "))[0];

        //             masterbadges.push(tempBadge);
        //         }
        //         else if (userbadge["type"] == "topoverall") {
        //             let tempBadge = {};
        //             tempBadge.user = userbadge["user"];
        //             tempBadge.badge = userbadge["badge"];
        //             tempBadge.type = userbadge["type"];
        //             tempBadge.expiry = userbadge["expiryDate"];
        //             tempBadge.createdDate = userbadge["createdDate"];
        //             tempBadge.is_active = true;
        //             tempBadge.name = "gold";
        //             tempBadge.path = config.assetHost + "/top_overall.png".replace('/', '');


        //             let created = new Date(userbadge["createdDate"]);
        //             created.setMonth(created.getMonth() - 1);
        //             let monthIndex = created.getMonth();

        //             let monthName = getMonthName(monthIndex);
        //             tempBadge.title = "टॉप संपूर्ण " + (monthName.split(" "))[1] + " " + created.getFullYear();
        //             tempBadge.description = 'बधाई हो, आप ' + (monthName.split(" "))[1] + ' महीने के लिए शीर्ष शिक्षक हैं।\n\n Congratulations, you are the top teacher for the month of ' + (monthName.split(" "))[0];

        //             masterbadges.push(tempBadge);
        //         }
        //         else if (userbadge["type"] == "elearning") {
        //             let tempBadge = {};
        //             tempBadge.user = userbadge["user"];
        //             tempBadge.badge = userbadge["badge"];
        //             tempBadge.type = userbadge["type"];
        //             tempBadge.expiry = "";
        //             tempBadge.createdDate = userbadge["createdDate"];
        //             tempBadge.name = "elearning";
        //             tempBadge.is_active = true;
        //             tempBadge.path = config.assetHost + userbadge["badge"].toLowerCase() + ".png".replace('/', '');

        //             tempBadge.title = userbadge["badge"].charAt(0).toUpperCase() + userbadge["badge"].slice(1) + " Achiver";
        //             if (userbadge["badge"] == "bronze")
        //                 tempBadge.description = "You get 1 bronze badge on completing 3 courses";
        //             if (userbadge["badge"] == "silver")
        //                 tempBadge.description = "You get 1 silver badge on completing 6 courses";
        //             if (userbadge["badge"] == "gold")
        //                 tempBadge.description = "You get 1 gold badge on completing 12 courses";

        //             masterbadges.push(tempBadge);
        //         }
        //     }
        //     for (const masterbadge of masterbadges) {

        //         if (masterbadge["type"] == "topsss" || masterbadge["type"] == "topbaithak" || masterbadge["type"] == "topoverall" || masterbadge["type"] == "elearning") {
        //             masterbadge['is_active'] = true;
        //             masterbadge['expiry'] = masterbadge['expiry'];
        //         }
        //         else if (badges.hasOwnProperty(masterbadge['name'])) {
        //             masterbadge['is_active'] = true;
        //             masterbadge['expiry'] = badges[masterbadge['name']];
        //         }
        //         else {
        //             masterbadge['is_active'] = false;
        //         }
        //     }
        // }
        // leadership['badges'] = masterbadges;

        let certificate_videos = {};
        const viewed_videos = await Sssvideoviewed.find({ user: user });
        let videos_viewed = [];
        for (const viewed_video of viewed_videos) {
            videos_viewed.push(viewed_video.video.toString())
        }

        let certificates = {};
        
        const completedCourses = await Enrollment.distinct('course',{status: "completed", user: user})
        let completedCourseIDs = [];
        for (const completedCourse of completedCourses) {
            completedCourseIDs.push(completedCourse.toString())
        }
        for (const mastercertificate of mastercertificates) {
            let cert_progress = 0;
            let clessons = "";
            if (mastercertificate['department'] && mastercertificate['subject']) {
                clessons = await Lesson.find({ department: mastercertificate['department'], subject: mastercertificate['subject'], "section": "sss" })
                cert_progress = class_subject_progress[mastercertificate['department']][mastercertificate['subject']]['progress_percent'];
            } else if (mastercertificate['department']) {
                clessons = await Lesson.find({ department: mastercertificate['department'], 'section': 'sss' })
                cert_progress = class_subject_progress[mastercertificate['department']]['progress_percent'];
            } else if (mastercertificate['subject']) {
                cert_progress = subject_names[mastercertificate['subject']]['progress_percent'];
                clessons = await Lesson.find({ subject: mastercertificate['subject'], 'section': 'sss' })
            } else
                continue;

            let certificate_video = [];
            let certificate_baithak_video = [];
            certificate_videos[mastercertificate['_id']] = {}
            for (const clesson of clessons) {
                certificate_video = certificate_video.concat(clesson.videos);
                certificate_baithak_video = certificate_baithak_video.concat(clesson.baithak_videos);
            }
            let duration = 0;
            let duration_watched = 0;
            let check_videos = [];
            for (const video of certificate_video) {
                if (video != '' && check_videos.indexOf(video.toString()) === -1) {
                    check_videos.push(video.toString())
                    let video_detail = await Video.findById(video).populate('department', 'name').populate('subject', 'name');
                    duration = duration + (video_detail.duration_min * 60 + video_detail.duration_sec)
                    if (videos_viewed.indexOf(video) !== -1) {
                        duration_watched = duration_watched + (video_detail.duration_min * 60 + video_detail.duration_sec)
                    }
                }
            }

            mastercertificate["cert_progress"] = cert_progress;
            mastercertificate["total_duration"] = Math.ceil(duration / (60 * 60));
            mastercertificate["duration_watched"] = Math.ceil(duration_watched / (60 * 60));
            mastercertificate["total_duration"] = parseInt(duration / (60 * 60));
            mastercertificate["duration_watched"] = parseInt(duration_watched / (60 * 60));

            if (mastercertificate['total_duration'] - mastercertificate['duration_watched'] <= 0 && cert_progress == 100) {
                certificates[mastercertificate['_id']] = mastercertificate['path'];
                mastercertificate['message'] = 'You have achived this! Brag about it';
            } else if (mastercertificate['total_duration'] - mastercertificate['duration_watched'] > 0) {
                mastercertificate['message'] = (mastercertificate['total_duration'] - mastercertificate['duration_watched']) + ' hrs to go';
            }
        }

        // let remainingcertificates = {};
        if (Object.keys(certificates).length > 0) {
            const userexistingcertificates = await Usercertificate.distinct('certificate', { 'user': user, 'certificate': { '$in': Object.keys(certificates) } })

            for (const certificate of userexistingcertificates) {
                if (certificates.hasOwnProperty(certificate.toString())) {
                    delete certificates[certificate.toString()]
                }
            }
            /*
            const userexistingcoursecertificates = await Usercertificate.distinct('course', { 'user': user })
            
            for (const certificate of userexistingcoursecertificates) {
                //console.log(certificate)
                let certificateIndex = completedCourseIDs.indexOf(certificate.toString());
                //console.log(certificateIndex)
                if (certificateIndex > -1) {
                  completedCourseIDs.splice(certificateIndex, 1);
                }
            } */
        }
        if (Object.keys(certificates).length > 0) {
            try {
                let promises1 = [];
                // let promises2 = [];
                let im = require('imagemagick');
                let allotdate = new Date();
                let certificateName = "";
                userUpdatedCertificates = [];
                const curUser = await User.findById(user);
                if (curUser.fullName !== undefined && curUser.fullName !== null)
                    certificateName = curUser.fullName.toUpperCase();
                else
                    certificateName = curUser.firstName.toUpperCase() + ((curUser.lastName !== undefined && curUser.lastName !== null) ? " " + curUser.lastName.toUpperCase() : "");

                let allotdatestring = allotdate.getDate() + '-' + (allotdate.getMonth() + 1) + '-' + allotdate.getFullYear();
                for (const certificate of Object.keys(certificates)) {

                    const fileData = certificatesfiles.filter(p => p.id === certificate);

                    // download the mastercertificate from cdn
                    if (fileData.length) {
                        try {
                            const certificateUrl = config.assetHost + fileData[0].filePath.replace('/', '');
                            await downloadFileFromURL(certificateUrl, '../assets/', fileData[0].filePath.replace('/', ''));
                        } catch (e) {
                            console.log(e);
                        }

                    } else {
                        console.log('FIle not found');
                    }
                    let usercertificatepath = config.uploadPath + 'usercertificates/' + user + "_" + certificate + '.png';
                    
                    const obj = {
                        key: certificate,
                        value: user + "_" + certificate + '.png'
                    };
                    userUpdatedCertificates.push(obj);
                    p = new Promise((resolve, reject) => {
                        
                        let optionsObj = [certificates[certificate], '-flatten', '-font', englishFont, '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,412 '" + certificateName + "' text 0,629 '" + allotdatestring + "'", usercertificatepath];
                        im.convert(optionsObj, function (err, stdout) {
                            if (err) reject(err);
                            resolve("Converted Image successfully 1");
                        });
                    });
                    promises1.push(p)
                }

                try {
                    await Promise.all(promises1)

                    try {

                        for (const certificate of Object.keys(certificates)) {
                            const fileData = certificatesfiles.filter(p => p.id === certificate);

                            if (fileData.length) {
                                try {
                                    const filePathMasterCertificate = path.resolve(__dirname, '../assets/', fileData[0].filePath.replace('/', ''));
                                    if (fs.existsSync(filePathMasterCertificate)) {
                                        fs.unlinkSync(filePathMasterCertificate);
                                    }
                                } catch (e) {
                                    console.log(e);
                                }
                            } else {
                                console.log('FIle not found');
                            }
                        }
                        if (userUpdatedCertificates.length) {
                            const imagesToPdf = require("images-to-pdf")
                            for (let cerificateIndex = 0; cerificateIndex < userUpdatedCertificates.length; cerificateIndex++) {
                                const filePathCertificate = path.resolve(__dirname, '../uploads/usercertificates/' + userUpdatedCertificates[cerificateIndex].value);

                                const file = fs.createReadStream(filePathCertificate);

                                let updateResponse = await uploadStreamToS3(file, "usercertificates", userUpdatedCertificates[cerificateIndex].value);

                                // create the pdf 
                                let filePathCertificatePdf = filePathCertificate.replace(".png", ".pdf");

                                await imagesToPdf([filePathCertificate], filePathCertificatePdf);

                                const pdfFile = fs.createReadStream(filePathCertificatePdf);
                                const pdfFileName = userUpdatedCertificates[cerificateIndex].value.replace(".png", ".pdf");
                                let updateResponsePdf = await uploadStreamToS3(pdfFile, "usercertificates", pdfFileName);

                                if (updateResponse && updateResponsePdf) {
                                    try {
                                        if (fs.existsSync(filePathCertificate)) {
                                            fs.unlinkSync(filePathCertificate);
                                        }
                                        if (fs.existsSync(filePathCertificatePdf)) {
                                            fs.unlinkSync(filePathCertificatePdf)
                                        }
                                    } catch (err) {
                                        console.error(err)
                                    }
                                    let updatedDate = new Date();
                                    await Usercertificate.updateOne({ "user": user, "certificate": userUpdatedCertificates[cerificateIndex].key }, { "$set": { "path": updateResponse.key, "updatedDate": updatedDate } }, { "upsert": true })
                                }
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
                catch (err) {
                    console.log(err)
                }
            }
            catch (err) {
                console.log(err)
            }
        }
        /*
        if (completedCourseIDs.length > 0) {
            for (const course of completedCourseIDs) {                
                let newcertificate = await createCertificate(course, user)
                let usercerticate = new Usercertificate();
                usercerticate.user = user;
                usercerticate.course = course;
                usercerticate.path = newcertificate;
                if (await usercerticate.save()) {
                  console.log("CERTIFICATE SAVED")
                }
            }
        }
        */
        
        let existingCourses = []
        const usercertificates = await Usercertificate.find({ 'user': user })
        if (usercertificates.length > 0 || Object.keys(certificates).length > 0) {
            for (const usercertificate of usercertificates) {
                if (usercertificate['certificate'] != undefined) {
                    certificates[usercertificate['certificate']] = (apk_version < 4.8) ? '/' + usercertificate['path'] : config.aws_s3_url + usercertificate['path'] + "";
                }
                if (usercertificate['course'] != undefined) {
                    let courseCertificateIndex = existingCourses.indexOf(usercertificate['course'].toString());
                    if (courseCertificateIndex == -1) {
                      existingCourses.push(usercertificate['course'].toString())
                      let courseDetail = await Course.findById(usercertificate['course'])
                      let coursecertificate = {
                          is_active: true,
                          total_duration: 1,
                          name: courseDetail.name,
                          type: "elearning",
                          path: config.aws_s3_url + usercertificate['path'],
                          rpath: usercertificate['path'],
                          message: 'You have achived this! Brag about it',
                          department: courseDetail.department,
                          subject: courseDetail.subject,
                          id: usercertificate['course'],
                          cert_progress: 100,
                          duration_watched: 1
                      }
                      mastercertificates.push(coursecertificate);
                    } else {
                      await Usercertificate.deleteOne({"_id":usercertificate['_id']})
                    }
                }

            }

            for (const mastercertificate of mastercertificates) {
                if (certificates.hasOwnProperty(mastercertificate['_id'])) {
                    mastercertificate['is_active'] = true;
                    mastercertificate['path'] = certificates[mastercertificate['_id']];
                    let url = certificates[mastercertificate['_id']].replace(".png", ".pdf");
                    let fileName = "";
                    let arr = url.split("usercertificates");
                    if (arr.length == 2) {
                        fileName = "usercertificates" + arr[1];
                    }
                    const res = await getAWSObject(fileName);
                    
                    if (res && res.statusCode == 404) {
                        mastercertificate['pdfpath'] = "";
                    } else {
                        mastercertificate['pdfpath'] = certificates[mastercertificate['_id']] ? certificates[mastercertificate['_id']].replace(".png", ".pdf") : "";
                    }
                    //  mastercertificate['pdfpath'] = certificates[mastercertificate['_id']].replace(".png",".pdf");
                    mastercertificate['message'] = 'You have achived this! Brag about it';
                } else if (mastercertificate.hasOwnProperty('type') && mastercertificate['type'] == "elearning") {
                    mastercertificate['is_active'] = true;
                } else {
                    mastercertificate['pdfpath'] = "";
                    mastercertificate['type'] = "";
                }
            }
        }
      
        leadership['certificates'] = mastercertificates;
        leadership['badges'] = [];
        leadership['progress'] = {};
        leadership['time_spent'] = {};

        return leadership;
    } else {
        throw 'Kindly provide user.';
    }
}

function getMonthName(index) {

    let monthArrayEnglish = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let monthArrayHindi = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
    return (monthArrayEnglish[index] + " " + monthArrayHindi[index])
}

async function edit(id) {
    const userVideos = await Uservideo.findById(id).select('-hash');
    let stream = {};
    stream['stream_type'] = 'video';
    stream['id'] = userVideos['id'];
    stream['path'] = config.repositoryHost + userVideos['path'];
    if (isBase64(userVideos['description'])) {
        let buff = new Buffer(userVideos['description'], 'base64');
        stream['description'] = decodeURIComponent(buff);
    } else {
        stream['description'] = userVideos['description'];
    }
    stream['user'] = userVideos['user'];
    stream["created_at"] = userVideos['createdDate'];
    return stream;
}

async function sendcertificate(userParam) {
    email = userParam.email
    certificate = userParam.certificate
    user = userParam.user
    const userdetails = await User.findById(user)

    const certificatedetails = await Certificate.findById(certificate)
    const usercertificate = await Usercertificate.find({ "user": user, "certificate": certificate });
    if (usercertificate.length == 1 && usercertificate[0].path !== "") {
        usercertificateparam = {}
        usercertificateparam["email"] = email
        usercertificateparam["sent_on_email"] = true
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(config.sendgrid_api_key);
        try {
            const imagesToPdf = require("images-to-pdf")
            
            // need to check how we create pdf from cdn_url image
            // download the file from cdn then create the pdf after sending the email delete the file
            const fileUrl = config.aws_s3_url + usercertificate[0].path;
            const filePath = await downloadFileFromURL(fileUrl, '../uploads/usercertificates/', userdetails.id + "_" + certificatedetails.id + ".png");
            await imagesToPdf([config.uploadPath + usercertificate[0].path], config.uploadPath + "usercertificates/" + userdetails.id + "_" + certificatedetails.id + ".pdf")

            // await imagesToPdf([config.uploadPath+usercertificate[0].path], config.uploadPath+"usercertificates/"+userdetails.id+"_"+certificatedetails.id+".pdf")
        } catch (err) {
            
        }
        pathToAttachment = config.uploadPath + "usercertificates/" + userdetails.id + "_" + certificatedetails.id + ".pdf";
        attachment = fs.readFileSync(pathToAttachment).toString("base64");

        let emailsubject = "";
        let emailtextbody = "";
        let emailhtmlbody = "";
        if (certificatedetails.subject && certificatedetails.department) {
            emailsubject = 'Certificate of Completion';
            emailtextbody = 'प्रिय ' + userdetails.firstName + ' जी, %0A%0Aबधाई हो! सम्पर्क फाउंडेशन की तरफ से आपको सर्टिफिकेट ऑफ़ कम्पलीशन से सम्मानित किया जाता है। %0A%0Aहमें गर्व है की आपके जैसे जागरूक और जिज्ञासु शिक्षक बैठक समुदाय का हिस्सा हैं।%0Aइसी तरह अपनी लर्निंग यात्रा को चलने दीजिये। %0A%0A%0Aसादर, बैठक समुदाय';
            emailhtmlbody = 'प्रिय ' + userdetails.firstName + ' जी, <br><br>बधाई हो! सम्पर्क फाउंडेशन की तरफ से आपको सर्टिफिकेट ऑफ़ कम्पलीशन से सम्मानित किया जाता है। <br><br>हमें गर्व है की आपके जैसे जागरूक और जिज्ञासु शिक्षक बैठक समुदाय का हिस्सा हैं।<br>इसी तरह अपनी लर्निंग यात्रा को चलने दीजिये। <br><br><br>सादर,<br>बैठक समुदाय';
        } else if (certificatedetails.department) {

        }
        const msg1 = {
            to: email,
            //from: 'no-reply@samparkfoundation.org',
            from: 'appsupport@samparkfoundation.org',
            subject: emailsubject,
            text: emailtextbody,
            html: emailhtmlbody,
            attachments: [
                {
                    content: attachment,
                    filename: "certificate.pdf",
                    type: "application/pdf",
                    disposition: "attachment"
                }
            ]
        };
        await sgMail.send(msg1).catch(err => {
            
        });

        // delete the certificay=te image and pdf
        const filePathCertificateImage = path.resolve(__dirname, '../uploads/usercertificates/' + userdetails.id + "_" + certificatedetails.id + ".png");
        const filePathCertificatePdf = path.resolve(__dirname, '../uploads/usercertificates/' + userdetails.id + "_" + certificatedetails.id + ".pdf");
        try {
            fs.unlinkSync(filePathCertificateImage)
            fs.unlinkSync(filePathCertificatePdf);
        } catch (err) {
            console.error(err)
        }

        Object.assign(usercertificate[0], usercertificateparam);
        await usercertificate[0].save();
    }
    return { success: true };
}

async function updatehours(userParam) {

    const user = await User.findById(userParam.id);

    // validate
    if (!user) throw 'User not found';

    update_social_hours(user, userParam.social_hours);
    // copy userParam properties to user

    return { success: true };
}

async function getById(id) {

    stream = await Stream.findById(id).select('-hash');
    stream["is_liked"] = "";

    let departmentname = stream["department"];
    let subject = stream["subject"];
    let query = {};
    let queryStream = {};
    if (departmentname !== "") {
        query['department'] = departmentname;
    }
    if (subject !== "") {
        query['subject'] = subject;
    }

    queryStream['stream'] = stream;

    query["_id"] = {};
    query["_id"]["$nin"] = [id];

    if (user !== "") {
        const userlikes = await Streamlike.find({ user: user, stream: id }).select('stream is_liked');
        for (const userlike of userlikes) {
            stream["is_liked"] = userlike["is_liked"];
        }
    }
    stream["youtube_code"] = config.repositoryHost + stream["youtube_code"];
    stream["thumbnail"] = config.repositoryHost + stream["thumbnail"];
    stream["thumbnail"] = "https://img.youtube.com/vi/" + stream["stream_code"] + "/hqdefault.jpg"; //to be remove

    var streamData = {};
    streamData["stream"] = stream;
    return streamData;
}

async function getScertUploads() {
    userVideos = await Userscertvideo.find().populate('user', 'firstName lastName');
    streamList = [];
    for (var i = 0; i < userVideos.length; i++) {
        stream = {};
        stream['stream_type'] = 'video';
        stream['id'] = userVideos[i]['id'];
        stream['path'] = config.repositoryHost + userVideos[i]['path'];
        if (isBase64(userVideos[i]['description'])) {
            let buff = new Buffer(userVideos[i]['description'], 'base64');
            stream['description'] = decodeURIComponent(buff);
        } else {
            stream['description'] = userVideos[i]['description'];
        }
        stream['user'] = userVideos[i]['user'];
        stream["created_at"] = userVideos[i]['createdDate'];

        streamList.push(stream);
    }

    return streamList;
    //return await Stream.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function getAll() {
    userVideos = await Uservideo.find().populate('user', 'firstName lastName');
    streamList = [];
    for (var i = 0; i < userVideos.length; i++) {
        stream = {};
        stream['stream_type'] = 'video';
        stream['id'] = userVideos[i]['id'];
        stream['status'] = userVideos[i]['status'];
        stream['path'] = config.uploadPath + userVideos[i]['path'];
        stream['url'] = config.repositoryHost + userVideos[i]['path'];
        if (isBase64(userVideos[i]['description'])) {
            let buff = new Buffer(userVideos[i]['description'], 'base64');
            stream['description'] = decodeURIComponent(buff);
        } else {
            stream['description'] = userVideos[i]['description'];
        }
        stream['user'] = userVideos[i]['user'];
        stream["created_at"] = userVideos[i]['createdDate'];

        streamList.push(stream);
    }

    return streamList;
    //return await Stream.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function uploadscert(req) {
    // validate
    //var CircularJSON = require('circular-json');   
    const fs = require('fs')
    let reqbody = req.body;
    let dir = "";
    let uploadFolder = "";
    if (reqbody.uploadtype == "image") {
        dir = config.uploadPath + "scertstream_uploads/image/";
        uploadFolder = "scertstream_uploads/image";
    } else if (reqbody.uploadtype == "video") {
        dir = config.uploadPath + 'uservideos/';
        uploadFolder = "uservideos";
    } else if (reqbody.uploadtype == "audio") {
        dir = config.uploadPath + 'useraudios/';
        uploadFolder = "useraudios";
    } else if (reqbody.uploadtype == "pdf") {
        dir = config.uploadPath + 'scertstream_uploads/pdf/';
        uploadFolder = "scertstream_uploads/pdf";
    } else if (reqbody.uploadtype == "text") {
        uploadFolder = "";
    } else {
        throw 'Incorrect Upload';
    }

    var user_groups = [];
    var curUser = "";

    if (reqbody.user) {
        curUser = await User.find({ "_id": reqbody.user });
        if (curUser.length == 1) {
            curUser = curUser[0];
            curUserGroup = curUser.usertype;
            curUserState = curUser.state.toString();
            curUserDistrict = curUser.district;
            curUserLocation = curUser.location;

            india_ids = Object.keys(config.india_user_ids);
            if (india_ids.indexOf(curUser.id.toString()) !== -1) {
                curUserLocation = "India"
            }
        }
    }

    for (var usergroup in config.user_groups) {
        user_groups.push(usergroup)
    }
    if (uploadFolder != '') {
        if (!req.files || Object.keys(req.files).length === 0) {
            throw "File not uploaded";
        }
        var sampleFile = req.files.file;

        let uploadData = await uploadToS3(sampleFile, uploadFolder);

        if (isBase64(reqbody.description)) {
            let buff = new Buffer(reqbody.description, 'base64');
            postDescription = decodeURIComponent(buff);
        } else {
            postDescription = reqbody.description;
        }
        if (reqbody.uploadtype == "image") {
            const userimagescertstream = new Imagescertstream({ name: "", sort_order: 0, thumbnail: uploadData.Key, description: postDescription, author: reqbody.user, createdBy: reqbody.user, updatedBy: reqbody.user, is_shareable: true });

            if (await userimagescertstream.save()) {
                let dimensions = await getDimension(uploadData.Location)
                userimagescertstream.width = dimensions['width'];
                userimagescertstream.height = dimensions['height'];
                await userimagescertstream.save();

                scertstreamData = {};
                scertstreamData.item_type = "image";
                scertstreamData.item_id = userimagescertstream.id;
                scertstreamData.user_groups = user_groups;
                scertstreamData.states = [curUserState];
                scertstreamData.priority = 1;
                const scertstream = new Scertstream(scertstreamData);
                await scertstream.save();

                if (reqbody.user != "") {
                    //update_user_points(reqbody.user, 50, null, null);
                }
                return { success: true }
            }

        } else if (reqbody.uploadtype == "pdf") {
            const userpdfscertstream = new Pdfscertstream({ name: "", sort_order: 0, pdf: uploadData.Key, description: postDescription, author: reqbody.user, createdBy: reqbody.user, updatedBy: reqbody.user, is_shareable: true });

            if (await userpdfscertstream.save()) {
                scertstreamData = {};
                scertstreamData.item_type = "pdf";
                scertstreamData.item_id = userpdfscertstream.id;
                scertstreamData.user_groups = user_groups;
                scertstreamData.states = [curUserState];
                scertstreamData.priority = 1;
                const scertstream = new Scertstream(scertstreamData);
                await scertstream.save();

                if (reqbody.user != "") {
                    //update_user_points(reqbody.user, 50, null, null);
                }
                return { success: true }
            }

        } else if (reqbody.uploadtype == "video") {
            const userscertupload = new Userscertvideo({ path: 'userscertvideos/' + sampleFile.name, description: postDescription, user: reqbody.user });

            if (await userscertupload.save()) {

                let filename = userupload.id + path.extname(sampleFile.name);
                let uploadData = await uploadToS3(sampleFile, "userscertvideos", filename);
                userscertupload.doc_url = uploadData.Key;
                await userscertupload.save();

                return { success: true }
            }

        } else {
            throw 'Incorrect Upload';
        }
    } else if (reqbody.uploadtype == "text") {
        const usertextscertstream = new Textscertstream({ name: "", sort_order: 0, description: reqbody.description, author: reqbody.user, createdBy: reqbody.user, updatedBy: reqbody.user, is_shareable: true });
        if (await usertextscertstream.save()) {
            scertstreamData = {};
            scertstreamData.item_type = "text";
            scertstreamData.item_id = usertextscertstream.id;
            scertstreamData.user_groups = user_groups;
            scertstreamData.states = [curUserState];
            scertstreamData.priority = 1;
            const scertstream = new Scertstream(scertstreamData);
            await scertstream.save();

            if (reqbody.user != "") {
                //update_user_points(reqbody.user, 50, null, null);
            }

            return { success: true }
        }

    } else {
        throw 'Incorrect Post';
    }
}

//This is to update stream collection when any post is deleted, hidden or report abuse 
async function postaction(userParam) {

    const stream = await Stream.findById(userParam.streamId);

    // validate
    if (!stream) throw 'Stream not found';
    update_post_action(stream, userParam.action, userParam.actionBy);

    //Below code is to delete youtube video when user deletes post
    if (stream.item_type == "video" && stream.is_sampark_didi_post == false) {
        let uservideostream = {};
        uservideostream = await Videostream.findById(stream.item_id);
        if (uservideostream && uservideostream.youtube_code != "" && uservideostream.youtube_code != null)
            await deleteOnYouTube(uservideostream.youtube_code);
    }
    return { success: true };
}

async function renamefile(source, destination) {
    let fs = require('fs');
    let defer = require('q').defer()
    try {
        await fs.rename(source, destination, function (err) {
            if (err) throw err;
        })
    } catch (err) {
        console.error(err);
        defer.reject(err)
    }
    return defer.promise
}

async function getDimension(imagePath) {
    let probe = require('probe-image-size');
    let defer = require('q').defer()
    let inputimage = imagePath;
    try {
        await probe(inputimage)
            .then(dimensions => {
                let dimension = {};
                dimension["width"] = dimensions.width;
                dimension["height"] = dimensions.height;
                defer.resolve(dimension)
            })
            .catch(err => {
                console.error(err);

                let dimension = {};
                dimension["width"] = 0; //dimensions.width;
                dimension["height"] = 0; //dimensions.height;
                defer.resolve(dimension)
            });
    } catch (err) {
        console.error(err);

        let dimension = {};
        dimension["width"] = 0; //dimensions.width;
        dimension["height"] = 0; //dimensions.height;
        defer.resolve(dimension)
    }
    return defer.promise
}

async function getUserDetails(userid) {
    let defer = require('q').defer()
    try {
        if (userid) {
            let curUser = await User.find({ "_id": userid });
            defer.resolve(curUser)
        } else {
            defer.resolve("")
        }
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}

async function uploadnew(req) {

    const fs = require('fs')
    let data = req;
    let dir = "";
    let uploadFolder = "";
    if (data.body.uploadtype == "image") {
        dir = config.uploadPath + "stream_uploads/image/";
        uploadFolder = "stream_uploads/image"
    } else if (data.body.uploadtype == "video") {
        dir = config.uploadPath + 'uservideos/';
        uploadFolder = "uservideos"
    } else if (data.body.uploadtype == "audio") {
        dir = config.uploadPath + 'useraudios/';
        uploadFolder = "useraudios"
    } else if (data.body.uploadtype == "text") {
        uploadFolder = ""
    } else {
        throw 'Incorrect Upload';
    }

    let user_groups = [];

    /**
     * Below logic will get user details from database and update social hours if available.
     */
    let curUser = await getUserDetails(data.body.user);
    let curUserGroup = "";
    let curUserState = "";
    let curUserDistrict = "";
    let curUserCluster = "";
    let curUserBlock = "";
    let curUserLocation = "";

    if (curUser.length > 0) {

        curUser = curUser[0];

        curUserGroup = curUser.usertype;
        curUserState = curUser.state.toString();
        curUserDistrict = curUser.district;
        curUserCluster = curUser.cluster;
        curUserBlock = curUser.block;
        curUserLocation = curUser.location;
        india_ids = Object.keys(config.india_user_ids);
        if (india_ids.indexOf(curUser.id.toString()) !== -1) {
            curUserLocation = "India"
        }
    } //end of if condition checking for user record availability

    let sampark_didi_ids = Object.keys(config.sampark_didi_ids);

    for (const usergroup in config.user_groups) {
        user_groups.push(usergroup)
    }

    if (dir != '') {
        let uploadData;
        let sampleFile;
        let upldaoDataList = [];
        // if (!data.body.isVideoEmpty || data.body.isVideoEmpty === 'false') {
        //   if (!data.files || Object.keys(data.files).length === 0) {
        //     throw "File not uploaded";
        //   }
        //   sampleFile = data.files.file;

        //   //if (data.body.uploadtype != "video")
        //   if (!data.body.isVideoEmpty || data.body.isVideoEmpty === 'false') {
        //     uploadData = await uploadToS3(sampleFile, uploadFolder);
        //   }
        // }
        //
        if (!data.body.isVideoEmpty || data.body.isVideoEmpty === 'false') {
            if (!data.files || Object.keys(data.files).length === 0) {
                throw "File not uploaded";
            }

            //if (data.body.uploadtype != "video")
            if (!data.body.isVideoEmpty || data.body.isVideoEmpty === 'false') {
                if (data.files.file && !data.files.file.length) {
                    // for version <=5.6 and video upload
                    sampleFile = data.files.file;
                    uploadData = await uploadToS3(sampleFile, uploadFolder);
                } else {
                    // for version > 5.6
                    for (let index = 0; index < data.files.file.length; index++) {
                        const element = data.files.file[index];
                        element.name = index + "-" + element.name;
                        let response = await uploadToS3(element, uploadFolder);
                        upldaoDataList.push(response);
                    }
                }
            }
        }
        //
        let postDescription = "";
        if (isBase64(data.body.description)) {
            let buff = new Buffer(data.body.description, 'base64');
            postDescription = decodeURIComponent(buff);
        } else {
            postDescription = data.body.description;
        }
        if (data.body.uploadtype == "image") {
            let userimagestream = {};
            let streamData = {};

            if (data.body.editpost) {
                streamData = await Stream.findById(data.body.post_id);
                if (!streamData) throw 'stream not found';
                userimagestream = await Imagestream.findById(streamData.item_id);
                if (!userimagestream) throw 'Image stream not found';

                let thumbnails = [];
                if (upldaoDataList.length) {
                    for (let index = 0; index < upldaoDataList.length; index++) {
                        const element = upldaoDataList[index];
                        thumbnails.push(element.Key);
                    }
                    userimagestream.thumbnail = thumbnails[0];
                    userimagestream.thumbnails = thumbnails;
                } else {
                    thumbnails.push(uploadData.Key);
                    userimagestream.thumbnail = uploadData.Key;
                    userimagestream.thumbnails = thumbnails;
                }

                userimagestream.description = postDescription;
                let currentISTDate = new Date();
                userimagestream.updatedDate = currentISTDate.toISOString();

                streamData.updatedDate = currentISTDate.toISOString();
                if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                    streamData.hashtags = data.body.hashtags;
                else
                    streamData.hashtags = [];
                //streamData.publishDate = currentISTDate.toISOString();
            }
            else {
                let thumbnails = [];
                if (upldaoDataList.length) {
                    for (let index = 0; index < upldaoDataList.length; index++) {
                        const element = upldaoDataList[index];

                        thumbnails.push(element.Key);
                    }
                    userimagestream = new Imagestream({ name: "", sort_order: 0, thumbnail: thumbnails[0], thumbnails: thumbnails, description: postDescription, author: data.body.user, createdBy: data.body.user, updatedBy: data.body.user, is_shareable: true });
                } else {
                    thumbnails.push(uploadData.Key);
                    userimagestream = new Imagestream({ name: "", sort_order: 0, thumbnail: uploadData.Key, thumbnails: thumbnails, description: postDescription, author: data.body.user, createdBy: data.body.user, updatedBy: data.body.user, is_shareable: true });
                }

                await userimagestream.save();

                streamData.item_type = "image";
                streamData.item_id = userimagestream.id;
                streamData.user_groups = user_groups;
                streamData.states = [curUserState];
                if (curUserDistrict !== "")
                    streamData.district = curUserDistrict;
                if (curUserCluster !== "")
                    streamData.cluster = curUserCluster;
                if (curUserBlock !== "")
                    streamData.block = curUserBlock;
                if (curUserLocation !== "")
                    streamData.location = curUserLocation;
                streamData.priority = 1;

                if (sampark_didi_ids.indexOf(data.body.user.toString()) >= 0)
                    streamData.is_sampark_didi_post = true
                else
                    streamData.is_sampark_didi_post = false

                if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                    streamData.hashtags = data.body.hashtags;
                else
                    streamData.hashtags = [];
            }

            let dimensions;
            if (upldaoDataList.length) {
                let thumbnails_dimensions = [];
                for (let index = 0; index < upldaoDataList.length; index++) {

                    let dimension = await getDimension(upldaoDataList[index].Location)
                    let heightWidth = {};
                    heightWidth.width = dimension['width'];
                    heightWidth.height = dimension['height'];
                    thumbnails_dimensions.push(heightWidth);
                }
                userimagestream.thumbnails_dimensions = thumbnails_dimensions;
            } else {
                dimensions = await getDimension(uploadData.Location);
                userimagestream.width = dimensions['width'];
                userimagestream.height = dimensions['height'];
            }

            // userimagestream.thumbnail = 'stream_uploads/image/'+filename;

            await userimagestream.save();

            streamData.diseCode = data.body.diseCode ? data.body.diseCode : '';
            streamData.pincode = data.body.pincode ? data.body.pincode : '';
            // if (data.body.userType == 'govt teacher' || data.body.userType == 'parent')
            streamData.postOn = data.body.postOn ? data.body.postOn : 'Baithak';

            const stream = new Stream(streamData);
            await stream.save();
            if (!data.body.editpost && data.body.user != "" && (streamData.postOn == "Baithak" || streamData.postOn == "Both"))
                await notifyFollowers(stream, data.body.user);

            if (data.body.user != "") {
                update_user_points(data.body.user, 50, null, null);
            }
            return { success: true }
            //}

        } else if (data.body.uploadtype == "video") {
            //throw 'Incorrect Upload'; //Added this code to restrict user to upload video as YoutuBe channel is blocked

            let uservideostream = {};
            //  let uploadResponse = await uploadOnYouTube(sampleFile, uploadData.Key, postDescription);
            
            //   if (uploadResponse["status"] == 200) {

            //   let youtubeURL = "https://www.youtube.com/watch?v=" + uploadResponse["data"]["id"];
            //  let youtubeID = uploadResponse['data']['id'];
            //PT4M13S
            // let durationMin = 0;
            //  let durationSec =0;
            //  let duration = uploadResponse['data']['contentDetails']['duration'];
            //  let arr = duration.split('M');
            //  if (arr && arr.length == 2) {
            //   let durationMin = arr[0].replace('PT', '');
            //   let durationSec = arr[1].replace('S','');
            // }

            let streamData = {};

            if (data.body.editpost) {
                streamData = await Stream.findById(data.body.post_id);
                if (!streamData) throw 'stream not found';
                uservideostream = await Videostream.findById(streamData.item_id);
                if (!uservideostream) throw 'Video stream not found';

                if (data.body.isVideoEmpty && (data.body.isVideoEmpty === true || data.body.isVideoEmpty === 'true')) {
                    //Pratik Nahate - This if condition will execute when user uploads same video in edit post
                    uservideostream.description = postDescription;
                    let currentISTDate = new Date();
                    uservideostream.updatedDate = currentISTDate.toISOString();
                    // uservideostream.updatedBy = data.body.user;
                    uservideostream.save();

                    streamData.updatedDate = currentISTDate.toISOString();
                    streamData.states = [curUserState];
                    if (curUserDistrict !== "")
                        streamData.district = curUserDistrict;
                    if (curUserLocation !== "")
                        streamData.location = curUserLocation;

                    if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                        streamData.hashtags = data.body.hashtags;
                    else
                        streamData.hashtags = [];

                    streamData.save();
                    if (data.body.user != "") {
                        update_user_points(data.body.user, 50, null, null);
                    }
                } else {

                    // delete video from youtube 
                    const deleteReponse = await deleteOnYouTube(uservideostream.youtube_code);
                    if (deleteReponse && deleteReponse.status === 204) {
                        let uploadResponse = await uploadOnYouTube(sampleFile, uploadData.Key, postDescription);
                        if (uploadResponse["status"] == 200) {
                            let youtubeURL = "https://www.youtube.com/watch?v=" + uploadResponse["data"]["id"];
                            let youtubeID = uploadResponse['data']['id'];
                            // PT4M13S
                            let durationMin = 0;
                            let durationSec = 0;

                            let duration = uploadResponse['data']['contentDetails']['duration'];
                            let arr = duration.split('M');
                            if (arr && arr.length == 2) {
                                durationMin = arr[0].replace('PT', '');
                                durationSec = arr[1].replace('S', '');
                            }

                            uservideostream.youtube_code = youtubeID;
                            //uservideostream.thumbnail = "https://img.youtube.com/"+ youtubeID + "/hqdefault.jpg";
                            uservideostream.thumbnail = "";
                            uservideostream.description = postDescription;
                            uservideostream.duration_min = durationMin;
                            uservideostream.duration_sec = durationSec;
                            let currentISTDate = new Date();
                            uservideostream.updatedDate = currentISTDate.toISOString();
                            // uservideostream.updatedBy = data.body.user;
                            uservideostream.save();

                            streamData.updatedDate = currentISTDate.toISOString();
                            streamData.states = [curUserState];
                            if (curUserDistrict !== "")
                                streamData.district = curUserDistrict;
                            if (curUserCluster !== "")
                                streamData.cluster = curUserCluster;
                            if (curUserBlock !== "")
                                streamData.block = curUserBlock;
                            if (curUserLocation !== "")
                                streamData.location = curUserLocation;

                            if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                                streamData.hashtags = data.body.hashtags;
                            else
                                streamData.hashtags = [];

                            streamData.diseCode = data.body.diseCode ? data.body.diseCode : '';
                            streamData.pincode = data.body.pincode ? data.body.pincode : '';
                            // if (data.body.userType == 'govt teacher') 
                            streamData.postOn = data.body.postOn ? data.body.postOn : 'Baithak';

                            streamData.save();
                            if (data.body.user != "") {
                                update_user_points(data.body.user, 50, null, null);
                            }
                        } else {
                            return { success: false }
                        }
                    } else {
                        return { success: false }
                    }
                }

            } else {
                let uploadResponse = await uploadOnYouTube(sampleFile, uploadData.Key, postDescription);
                if (uploadResponse["status"] == 200) {
                    // let youtubeURL = "https://www.youtube.com/watch?v=" + uploadResponse["data"]["id"];
                    let youtubeID = uploadResponse['data']['id'];
                    //PT4M13S
                    let durationMin = 0;
                    let durationSec = 0;
                    let duration = uploadResponse['data']['contentDetails']['duration'];
                    let arr = duration.split('M');
                    if (arr && arr.length == 2) {
                        durationMin = arr[0].replace('PT', '');
                        durationSec = arr[1].replace('S', '');
                    }

                    uservideostream = new Videostream({
                        name: "",
                        youtube_code: youtubeID,
                        duration_min: durationMin,
                        duration_sec: durationSec,
                        sort_order: 0,
                        description: data.body.description,
                        author: data.body.user,
                        createdBy: data.body.user,
                        updatedBy: data.body.user,
                        //thumbnail: "https://img.youtube.com/"+ youtubeID + "/hqdefault.jpg",
                        thumbnail: "",
                        is_shareable: true
                    }
                    );
                    uservideostream.save();
                    streamData.item_type = "video";
                    streamData.item_id = uservideostream.id;
                    streamData.user_groups = user_groups;
                    streamData.states = [curUserState];
                    if (curUserDistrict !== "")
                        streamData.district = curUserDistrict;
                    if (curUserLocation !== "")
                        streamData.location = curUserLocation;

                    streamData.priority = 1;
                    if (sampark_didi_ids.indexOf(data.body.user.toString()) >= 0)
                        streamData.is_sampark_didi_post = true;
                    else
                        streamData.is_sampark_didi_post = false;

                    if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                        streamData.hashtags = data.body.hashtags;
                    else
                        streamData.hashtags = [];

                    const stream = new Stream(streamData);
                    await stream.save();
                    if (!data.body.editpost && data.body.user != "")
                        await notifyFollowers(stream, data.body.user);
                    if (data.body.user != "") {
                        update_user_points(data.body.user, 50, null, null);
                    }
                } else {
                    return { success: false }
                }
            }

            return { success: true }

        } else {
            throw 'Incorrect Upload';
        }
    } else if (data.body.uploadtype == "text") {
        let usertextstream = {};
        let streamData = {};
        if (data.body.editpost) {
            streamData = await Stream.findById(data.body.post_id);
            if (!streamData) throw 'stream not found';
            usertextstream = await Textstream.findById(streamData.item_id);
            if (!usertextstream) throw 'text stream not found';
            usertextstream.description = data.body.description;
            usertextstream.reasonToShare = data.body.reasonToShare;
            let currentISTDate = new Date();
            usertextstream.updatedDate = currentISTDate.toISOString();

            await usertextstream.save();

            streamData.updatedDate = currentISTDate.toISOString();
            if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                streamData.hashtags = data.body.hashtags;
            else
                streamData.hashtags = [];
            //streamData.publishDate = currentISTDate.toISOString();
        }
        else {
            const { description, user, reasonToShare, resourceType, resourceLink } = data.body;
            usertextstream = new Textstream(
                { 
                    name: "", 
                    sort_order: 0, 
                    description: description, 
                    author: user, 
                    reasonToShare: (reasonToShare != "" && reasonToShare != null) ? reasonToShare : "",
                    resourceType: (resourceType != "" && resourceType != null) ? resourceType : "",
                    resourceLink: (resourceLink != "" && resourceLink != null) ? resourceLink : "",
                    createdBy: user, 
                    updatedBy: user, 
                    is_shareable: true 
                }
            );

            await usertextstream.save();

            streamData.item_type = "text";
            streamData.item_id = usertextstream.id;
            streamData.user_groups = user_groups;
            streamData.states = [curUserState];
            if (curUserDistrict !== "")
                streamData.district = curUserDistrict;
            if (curUserCluster !== "")
                streamData.cluster = curUserCluster;
            if (curUserBlock !== "")
                streamData.block = curUserBlock;
            if (curUserLocation !== "")
                streamData.location = curUserLocation;
            streamData.priority = 1;

            if (data.body.hashtags && data.body.hashtags != undefined && data.body.hashtags.length > 0)
                streamData.hashtags = data.body.hashtags;
            else
                streamData.hashtags = [];

            if (sampark_didi_ids.indexOf(data.body.user.toString()) >= 0) {
                streamData.is_sampark_didi_post = true;
            } else {
                streamData.is_sampark_didi_post = false;
            }
        }

        streamData.diseCode = data.body.diseCode ? data.body.diseCode : '';
        streamData.pincode = data.body.pincode ? data.body.pincode : '';
        // if (data.body.userType == 'govt teacher') {
        streamData.postOn = data.body.postOn ? data.body.postOn : 'Baithak';

        const stream = new Stream(streamData);

        await stream.save();
        if (!data.body.editpost && data.body.user != "" && (streamData.postOn == "Baithak" || streamData.postOn == "Both"))
            await notifyFollowers(stream, data.body.user);
        if (data.body.user != "") {
            update_user_points(data.body.user, 50, null, null);
        }

        return { success: true }

    } else {
        throw 'Incorrect Post';
    }
}

async function notifyFollowers(stream, following) {
    const userFollowers = await Userfollower.find({ following: following, action: 'F' }).select('id follower action');
    const followingDetail = await User.findById(following);

    if (userFollowers && userFollowers.length) {
        for (let index = 0; index < userFollowers.length; index++) {
            const element = userFollowers[index];
            //var dbFollowerId = new objectId(element.follower);
            const followerDetail = await User.findById(element.follower);

            if (followerDetail && followerDetail !== undefined && followerDetail !== null)
                await create_notification(stream, followerDetail, 'newUserPost', followingDetail);
            //arrFollowerIds.push(dbFollowerId);
        }
    }
}
async function deleteComment(data) {
    try {
        let updatedAt = new Date();
        let module_name = data.module;
        let item_type = data.item_type;
        let commentId = data.commentId;
        let user = data.deleted_by;
        if (module_name === "undefined") {
            module_name = "";
        }
        let query = {};
        if (module_name == "scert") {
            let comment;
            let stream;
            query['_id'] = commentId;
            if (item_type == "image") {
                comment = await Scertimagecomment.findById(commentId);
                stream = await Imagescertstream.findById(comment.image);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Scertimagecomment.findByIdAndRemove(commentId);
            } else if (item_type == "video") {
                comment = await Scertvideocomment.findById(commentId);
                stream = await Videoscertstream.findById(comment.video);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Scertvideocomment.findByIdAndRemove(commentId);
            } else if (item_type == "pdf") {
                comment = await Scertpdfcomment.findById(commentId);
                stream = await Pdfscertstream.findById(comment.pdf);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Scertpdfcomment.findByIdAndRemove(commentId);

            } else if (item_type == "text") {
                comment = await Scerttextcomment.findById(commentId);
                stream = await Textscertstream.findById(comment.text);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Scerttextcomment.findByIdAndRemove(commentId);
            } else {
                throw 'Incorrect Item';
            }
            let scertstream = await Scertstream.find({ item_type: item_type, item_id: stream.id });
            if (scertstream && scertstream.length) {
                scertstream[0].updatedDate = updatedAt;
                await scertstream[0].save();
            }

            // comment.is_deleted = true;
            // comment.deleted_by = new ObjectID(user);
            // comment.save();
            return true;
        } else {
            let comment;
            let stream;
            query['_id'] = commentId;
            if (item_type == "image") {
                comment = await Imagecomment.findById(commentId);
                stream = await Imagestream.findById(comment.image);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Imagecomment.findByIdAndRemove(commentId);
            } else if (item_type == "video") {
                comment = await Videocomment.findById(commentId);
                stream = await Videostream.findById(comment.video);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Videocomment.findByIdAndRemove(commentId);
            } else if (item_type == "sssvideo") {
                comment = await Sssvideocomment.findById(commentId);
                stream = await Video.findById(comment.video);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Sssvideocomment.findByIdAndRemove(commentId);
            } else if (item_type == "text") {
                comment = await Textcomment.findById(commentId);
                stream = await Textstream.findById(comment.text);
                stream.commentcount = stream.commentcount - 1;
                stream.save();
                await Textcomment.findByIdAndRemove(commentId);
            } else if (item_type == "audiotextbook") {
                comment = await Audiotextbookcomment.findById(commentId);
                audiotextbook = await Audiotextbook.findById(comment.audiotextbook);
                audiotextbook.commentcount = audiotextbook.commentcount - 1;
                audiotextbook.save();
                await Audiotextbookcomment.findByIdAndRemove(commentId);
            } else {
                throw 'Incorrect Item';
            }
            let streams = await Stream.find({ item_type: item_type, item_id: stream.id })
            if (streams && streams.length) {
                streams[0].updatedDate = updatedAt;
                await streams[0].save();
            }

            // comment.is_deleted = true;
            // comment.deleted_by = new ObjectID(user);
            // comment.save();
            return true;
        }
    } catch (ex) {
        return ex;
    }
}

// API updated by Devendra K
async function comments(req) {
    let defer = require('q').defer();
    try {
        let module_name = (req.module && req.module != "undefined") ? req.module : "";
        let item_type = req.item_type ? req.item_type : "";
        let item = req.item ? req.item : "";

        let user_comments = [];
        let query = {};
        let comments = "";

        switch (item_type) {
            case "image":
                query['image'] = item;
                if (module_name == "scert") {
                    comments = await Scertimagecomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 });
                } else {
                    comments = await Imagecomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                }
                break;
            case "video":
                query['video'] = item;
                if (module_name == "scert") {
                    comments = await Scertvideocomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                } else {
                    comments = await Videocomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                }
                break;
            case "pdf":
                query['pdf'] = item;
                comments = await Scertpdfcomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                break;
            case "text":
                query['text'] = item;
                if (module_name) {
                    comments = await Scerttextcomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                } else {
                    comments = await Textcomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                }
                break;
            case "sssvideo":
                query['video'] = item;
                comments = await Sssvideocomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                break;
            case "audiotextbook":
                query['audiotextbook'] = item;
                comments = await Audiotextbookcomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 }); //.limit(per_page);
                break;
        }

        let j = 0;
        for (const comment of comments) {
            if (comment["user"]) {
                comment["caricatures"] = (comment["caricatures"]) ? comment["caricatures"].map(function (e) { return config.repositoryHost + e }) : [];
                user_comments[j] = {};
                user_comments[j]['comment'] = comment["comment"];
                user_comments[j]['comment_id'] = comment["_id"];
                user_comments[j]['caricatures'] = comment["caricatures"];
                user_comments[j]['name'] = (comment["user"]["fullName"]) ? titleize(comment["user"]["fullName"]) : titleize(comment["user"]["firstName"]);
                user_comments[j]['verified'] = comment["user"]["is_verified"];
                user_comments[j]['created_at'] = comment["createdDate"];
                user_comments[j]['user'] = comment["user"]["id"]
                user_comments[j]['badge'] = 0;
                user_comments[j]['location'] = "";

                if (comment["user"]["image"] != "" && comment["user"]["image"] != null) {
                    user_comments[j]['image'] = config.repositoryHost + comment["user"]["image"];
                } else {
                    user_comments[j]['image'] = config.user_image;
                }
                await getSubComments(comment["_id"]).then(function (subComments) {
                    user_comments[j]['replies'] = subComments;
                }).catch(err => {
                    user_comments[j]['replies'] = [];
                });
                j = j + 1;
            }
        }
        defer.resolve(user_comments);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise;
}

// API updated by Devendra K
async function getSubComments(commentId) {
    let defer = require('q').defer();
    try {
        let query = {};
        query['comment_id'] = commentId;
        let subCommentData = await Subcomment.find(query).populate('user', ['fullName', 'firstName', 'lastName', 'is_verified', 'image', 'location', 'badge', 'total_points', 'sss_hours', 'social_hours']).sort({ createdDate: -1 });
        let subComments = [];
        for (const comment of subCommentData) {
            let user_comment = {};
            comment["caricatures"] = (comment["caricatures"].length) ? comment["caricatures"].map(function (e) { return config.repositoryHost + e }) : [];
            user_comment['comment'] = comment["comment"];
            user_comment['comment_id'] = comment["_id"];
            user_comment['caricatures'] = comment["caricatures"];
            user_comment['name'] = (comment["user"]["fullName"]) ? titleize(comment["user"]["fullName"]) : titleize(comment["user"]["firstName"]);
            user_comment['verified'] = comment["user"]["is_verified"];
            user_comment['created_at'] = comment["createdDate"];
            user_comment['user'] = comment["user"]["id"];
            user_comment['parent_comment_id'] = commentId;

            if (comment["user"]["image"] != "" && comment["user"]["image"] != null) {
                user_comment['image'] = config.repositoryHost + comment["user"]["image"];
            } else {
                user_comment['image'] = config.user_image;
            }
            subComments.push(user_comment);
        }
        defer.resolve(subComments);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise;
}

async function replyOnComment(req) {
    let commentParam = req;
    let item_type = commentParam.item_type;
    let comment = commentParam.comment;
    let caricatures = commentParam.caricatures;
    let user = commentParam.user;
    let comment_id = commentParam.item;
    let social_hours = commentParam.social_hours;


    if (user != "") {
        update_user_points(user, 10, null, null);
        if (social_hours != "" && social_hours != undefined) {
            curUser = await User.find({ "_id": user });
            if (curUser.length == 1) {
                curUser = curUser[0];
                update_social_hours(curUser, social_hours);
            }
        }
    }


    if (comment != "" && comment != null) {
        if (item_type == "image" || item_type == "text" || item_type == "video" || item_type == "sssvideo" || item_type == "audiotextbook") {
            const reply = new Subcomment({ comment: comment, user: user, comment_id: comment_id, item_type: item_type, caricatures: caricatures });
            if (await reply.save()) {
                if (item_type == "image") {
                    const imageComment = await Imagecomment.findById(comment_id);
                    const stream = await Stream.find({ item_type: "image", item_id: imageComment.image });
                    await create_notification(stream[0], imageComment, 'reply', user);
                }
                else if (item_type == "video") {
                    const videoComment = await Videocomment.findById(comment_id);
                    const stream = await Stream.find({ item_type: "video", item_id: videoComment.video });
                    await create_notification(stream[0], videoComment, 'reply', user);
                }
                else if (item_type == "text") {
                    const textComment = await Textcomment.findById(comment_id);
                    const stream = await Stream.find({ item_type: "text", item_id: textComment.text });
                    await create_notification(stream[0], textComment, 'reply', user);
                }
                else if (item_type == "sssvideo") {
                    const sssvideoComment = await Sssvideocomment.findById(comment_id);
                    const stream = await Stream.find({ item_type: "sssvideo", item_id: sssvideoComment.video });
                    await create_notification(stream[0], sssvideoComment, 'reply', user);
                }

                return { success: true }
            }
            else
                throw 'Failed to save in DB';
        }
        else
            throw 'Please send correct request';
    }
    else
        throw 'Please send correct request';
}

async function checkcommentexistance(item_type, comment, user, item, caricatures) {
  let usercommentcount = 0
  if (item_type == "image") {
    usercommentcount = await Imagecomment.countDocuments({ comment: comment, user: user, image: item, caricatures: caricatures });
    
  } else if (item_type == "video") {
    usercommentcount = await Videocomment.countDocuments({ comment: comment, user: user, video: item, caricatures: caricatures });

  } else if (item_type == "text") {
    usercommentcount = await Textcomment.countDocuments({ comment: comment, user: user, text: item, caricatures: caricatures });

  } else if (item_type == "sssvideo") {
    usercommentcount = await Sssvideocomment.countDocuments({ comment: comment, user: user, video: item, caricatures: caricatures });

  } else {
    throw 'Incorrect Item for Comment 1';
  }
  
  let userCommentId = ""
  if (usercommentcount > 0) {
    if (item_type == "image") {
      userComment = await Imagecomment.findOne({ comment: comment, user: user, image: item, caricatures: caricatures });
      userCommentId = userComment["_id"]
      
    } else if (item_type == "video") {
      userComment = await Videocomment.findOne({ comment: comment, user: user, video: item, caricatures: caricatures });
      userCommentId = userComment["_id"]

    } else if (item_type == "text") {
      userComment = await Textcomment.findOne({ comment: comment, user: user, text: item, caricatures: caricatures });
      userCommentId = userComment["_id"]

    } else if (item_type == "sssvideo") {
      userComment = await Sssvideocomment.findOne({ comment: comment, user: user, video: item, caricatures: caricatures });
      userCommentId = userComment["_id"]

    } else {
      throw 'Incorrect Item for Comment 1';
    }
  }
  return userCommentId;
}
  
async function comment(req) {
  try {
    commentParam = req;
    item_type = commentParam.item_type;
    comment = commentParam.comment;
    let caricatures = commentParam.caricatures;
    user = commentParam.user;
    item = commentParam.item;
    module = (commentParam.module) ? commentParam.module : ""
    social_hours = commentParam.social_hours
    streamParam = {};
    scertstreamParam = {};
    
    let isCommentExist = await checkcommentexistance(item_type, comment, user, item, caricatures);
    if (isCommentExist != "") {
      return { success: true, commentId: isCommentExist }
    } 
    
    var updatedAt = new Date();
    if (user != "") {
        update_user_points(user, 10, null, null);
        if (social_hours != "" && social_hours != undefined) {
            curUser = await User.find({ "_id": user });
            if (curUser.length == 1) {
                curUser = curUser[0];
                update_social_hours(curUser, social_hours);
            }
        }
    }
    if (module == "scert") {
        if (item_type == "image") {
            const usercomment = new Scertimagecomment({ comment: comment, user: user, image: item });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Scertimagecomment.countDocuments({ image: item });
                const imagescertstream = await Imagescertstream.findById(item)
                scertstreamParam['commentcount'] = usercomments;
                Object.assign(imagescertstream, scertstreamParam);
                await imagescertstream.save();

                const scertstream = await Scertstream.find({ item_type: "image", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(scertstream[0], sParam);
                await scertstream[0].save()
                await create_notification(scertstream[0], imagescertstream, 'comment', user);
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "video") {
            const usercomment = new Scertvideocomment({ comment: comment, user: user, video: item });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Scertvideocomment.countDocuments({ video: item });
                const videoscertstream = await Videoscertstream.findById(item)
                scertstreamParam['commentcount'] = usercomments;
                Object.assign(videoscertstream, scertstreamParam);
                await videoscertstream.save();

                const scertstream = await Scertstream.find({ item_type: "video", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(scertstream[0], sParam);
                await scertstream[0].save()

                await create_notification(scertstream[0], videoscertstream, 'comment', user);
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "text") {
            const usercomment = new Scerttextcomment({ comment: comment, user: user, text: item });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Scerttextcomment.countDocuments({ text: item });
                const textscertstream = await Textscertstream.findById(item)
                scertstreamParam['commentcount'] = usercomments;
                Object.assign(textscertstream, scertstreamParam);
                await textscertstream.save();

                const scertstream = await Scertstream.find({ item_type: "text", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(scertstream[0], sParam);
                await scertstream[0].save()

                await create_notification(scertstream[0], textscertstream, 'comment', user);
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "pdf") {
            const usercomment = new Scertpdfcomment({ comment: comment, user: user, pdf: item });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Scertpdfcomment.countDocuments({ pdf: item });
                const sssvideo = await Pdfscertstream.findById(item)
                scertstreamParam['commentcount'] = usercomments;
                Object.assign(sssvideo, scertstreamParam);
                await sssvideo.save();

                const scertstream = await Scertstream.find({ item_type: "pdf", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                if (scertstream && scertstream[0]) {
                    Object.assign(scertstream[0], sParam);
                    await scertstream[0].save()
                }
                return { success: true, commentId: commentData['_id'] }
            }

        } else {
            throw 'Incorrect Item for Comment';
        }
    } else {
        if (item_type == "image") {
            const usercomment = new Imagecomment({ comment: comment, user: user, image: item, caricatures: caricatures });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Imagecomment.countDocuments({ image: item });
                const imagestream = await Imagestream.findById(item)
                streamParam['commentcount'] = usercomments;
                Object.assign(imagestream, streamParam);
                await imagestream.save();

                const stream = await Stream.find({ item_type: "image", item_id: item });
                // let viewCountUpdate = stream[0]['viewcount'];
                // viewCountUpdate = viewCountUpdate + 10;
                sParam = {};
                sParam.updatedDate = updatedAt;
                // sParam.viewcount = viewCountUpdate;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                await create_notification(stream[0], imagestream, 'comment', user);
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "video") {
            const usercomment = new Videocomment({ comment: comment, user: user, video: item, caricatures: caricatures });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Videocomment.countDocuments({ video: item });
                const videostream = await Videostream.findById(item)
                // let viewCountUpdate = videostream['viewcount'];
                // viewCountUpdate = viewCountUpdate + 10;
                streamParam['commentcount'] = usercomments;
                // streamParam['viewcount'] = viewCountUpdate;
                Object.assign(videostream, streamParam);
                await videostream.save();

                const stream = await Stream.find({ item_type: "video", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()

                await create_notification(stream[0], videostream, 'comment', user);
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "text") {
            const usercomment = new Textcomment({ comment: comment, user: user, text: item, caricatures: caricatures });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Textcomment.countDocuments({ text: item });
                const textstream = await Textstream.findById(item)
                streamParam['commentcount'] = usercomments;
                Object.assign(textstream, streamParam);
                await textstream.save();

                const stream = await Stream.find({ item_type: "text", item_id: item });
                // let viewCountUpdate = stream[0]['viewcount'];
                // viewCountUpdate = viewCountUpdate + 10;
                sParam = {};
                sParam.updatedDate = updatedAt;
                // sParam.viewcount = viewCountUpdate;
                Object.assign(stream[0], sParam);
                await stream[0].save()

                await create_notification(stream[0], textstream, 'comment', user);
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "sssvideo") {
            const usercomment = new Sssvideocomment({ comment: comment, user: user, video: item, caricatures: caricatures });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Sssvideocomment.countDocuments({ video: item });
                const sssvideo = await Video.findById(item)
                // let viewCountUpdate = sssvideo['viewcount'];
                // viewCountUpdate = viewCountUpdate + 10;
                streamParam['commentcount'] = usercomments;
                // streamParam['viewcount'] = viewCountUpdate;
                Object.assign(sssvideo, streamParam);
                await sssvideo.save();

                const stream = await Stream.find({ item_type: "sssvideo", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                if (stream && stream[0]) {
                    Object.assign(stream[0], sParam);
                    await stream[0].save()
                }
                return { success: true, commentId: commentData['_id'] }
            }

        } else if (item_type == "audiotextbook") {
            const usercomment = new Audiotextbookcomment({ comment: comment, user: user, audiotextbook: item, caricatures: caricatures });
            let commentData = await usercomment.save();
            if (commentData) {
                const usercomments = await Audiotextbookcomment.countDocuments({ audiotextbook: item });
                const audiotextbook = await Audiotextbook.findById(item)
                // let viewCountUpdate = sssvideo['viewcount'];
                // viewCountUpdate = viewCountUpdate + 10;
                streamParam['commentcount'] = usercomments;
                // streamParam['viewcount'] = viewCountUpdate;
                Object.assign(audiotextbook, streamParam);
                await audiotextbook.save();

                return { success: true, commentId: commentData['_id'] }
            }

        } else {
            throw 'Incorrect Item for Comment 1';
        }
    }
  } catch (e) {
    
  }
}

async function like(req) {
    let likeParam = req
    let module = (likeParam.module) ? likeParam.module : ""
    if (module == "scert") {
        return likescertstream(likeParam);
    } else {
        return likestream(likeParam);
    }
}

async function likescertstream(req) {

    var updatedAt = new Date();
    likeParam = req;
    item_type = likeParam.item_type
    like = likeParam.is_liked
    user = likeParam.user
    device_id = likeParam.device_id
    item = likeParam.item
    social_hours = likeParam.social_hours
    streamParam = {};
    if (like == true || like == "true") {
        if (user != "") {
            if (social_hours != "" && social_hours != undefined) {
                curUser = await User.find({ "_id": user });
                if (curUser.length == 1) {
                    curUser = curUser[0];
                    update_social_hours(curUser, social_hours);
                }
            }
            update_user_points(user, 10, null, null);
        }
        if (item_type == "image") {
            const userlike = new Scertimagelike({ is_liked: like, device_id: device_id, image: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Scertimagelike.countDocuments({ image: item });
                const imagestream = await Imagescertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(imagestream, streamParam);
                await imagestream.save();
                const stream = await Scertstream.find({ item_type: "image", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                await create_notification(stream[0], imagestream, 'like', user);
                return { success: true }
            }

        } else if (item_type == "video") {
            const userlike = new Scertvideolike({ is_liked: like, device_id: device_id, video: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Scertvideolike.countDocuments({ video: item });
                const videostream = await Videoscertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(videostream, streamParam);
                await videostream.save();

                const stream = await Scertstream.find({ item_type: "video", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()

                await create_notification(stream[0], videostream, 'like', user);
                return { success: true }
            }

        } else if (item_type == "text") {
            const userlike = new Scerttextlike({ is_liked: like, device_id: device_id, text: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Scerttextlike.countDocuments({ text: item });
                const textstream = await Textscertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(textstream, streamParam);
                await textstream.save();

                const stream = await Scertstream.find({ item_type: "text", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()

                await create_notification(stream[0], textstream, 'like', user);
                return { success: true }
            }

        } else if (item_type == "pdf") {
            const userlike = new Scertpdflike({ is_liked: like, device_id: device_id, pdf: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Scertpdflike.countDocuments({ pdf: item });
                const pdfstream = await Pdfscertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(pdfstream, streamParam);
                await pdfstream.save();

                const stream = await Scertstream.find({ item_type: "pdf", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else {
            throw 'Incorrect Item for Like';
        }
    } else {
        likeSearch = {};
        if (user != "") {
            likeSearch["user"] = user;
            update_user_points(user, -10, null, null);
            if (social_hours != "" && social_hours != undefined) {
                curUser = await User.find({ "_id": user });
                if (curUser.length == 1) {
                    curUser = curUser[0];
                    update_social_hours(curUser, social_hours);
                }
            }
        }
        likeSearch["device_id"] = device_id;
        if (item_type == "image") {
            likeSearch["image"] = item;
            const userlike = await Scertimagelike.findOne(likeSearch);

            if (userlike) {
                await Scertimagelike.deleteMany(likeSearch);

                const userlikes = await Scertimagelike.countDocuments({ image: item });
                const imagestream = await Imagescertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(imagestream, streamParam);
                await imagestream.save();

                const stream = await Scertstream.find({ item_type: "image", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "video") {
            likeSearch["video"] = item;
            const userlike = await Scertvideolike.findOne(likeSearch);

            if (userlike) {
                await Scertvideolike.deleteMany(likeSearch);

                const userlikes = await Scertvideolike.countDocuments({ video: item });
                const videostream = await Videoscertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(videostream, streamParam);
                await videostream.save();

                const stream = await Scertstream.find({ item_type: "video", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "text") {
            likeSearch["text"] = item;
            const userlike = await Scerttextlike.findOne(likeSearch);

            if (userlike) {
                await Scerttextlike.deleteMany(likeSearch);

                const userlikes = await Scerttextlike.countDocuments({ text: item });
                const textstream = await Textscertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(textstream, streamParam);
                await textstream.save();

                const stream = await Scertstream.find({ item_type: "text", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "pdf") {
            likeSearch["pdf"] = item;
            const userlike = await Scertpdflike.findOne(likeSearch);
            if (userlike) {
                await Scertpdflike.deleteMany(likeSearch);

                const userlikes = await Scertpdflike.countDocuments({ pdf: item });
                const pdfstream = await Pdfscertstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(pdfstream, streamParam);
                await pdfstream.save();

                const stream = await Scertstream.find({ item_type: "pdf", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else {
            throw 'Incorrect Item for Like';
        }
    }
}

async function likestream(req) {
try {
    let updatedAt = new Date();
    let likeParam = req;
    let item_type = likeParam.item_type;
    let like = likeParam.is_liked;
    let user = likeParam.user;
    let device_id = likeParam.device_id;
    let item = likeParam.item;
    let social_hours = likeParam.social_hours;
    let streamParam = {};
    let likeSearch = {};
    if (like == true || like == "true") {
        if (user != "") {
            likeSearch["user"] = user;
            if (social_hours != "" && social_hours != undefined) {
                curUser = await User.find({ "_id": user });
                if (curUser.length == 1) {
                    curUser = curUser[0];
                    update_social_hours(curUser, social_hours);
                }
            }
            update_user_points(user, 10, null, null);
        }
        if (item_type == "image") {
          likeSearch["image"] = item;
          const checkuserlike = await Imagelike.findOne(likeSearch);
          if (checkuserlike) {
            return { success: true }
          } else {
            const userlike = new Imagelike({ is_liked: like, device_id: device_id, image: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Imagelike.countDocuments({ image: item });
                const imagestream = await Imagestream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(imagestream, streamParam);
                await imagestream.save();
                const stream = await Stream.find({ item_type: "image", item_id: item })
                // let viewCountUpdate = stream[0]['viewcount'];
                // viewCountUpdate = viewCountUpdate + 5;
                sParam = {};
                sParam.updatedDate = updatedAt;
                //sParam.viewcount = viewCountUpdate;
                Object.assign(stream[0], sParam);
                await stream[0].save();
                await create_notification(stream[0], imagestream, 'like', user);
                return { success: true }
            }
          }
        } else if (item_type == "video") {
          likeSearch["video"] = item;
          const checkuserlike = await Videolike.findOne(likeSearch);

          if (checkuserlike) {
            return { success: true }
          } else {
            const userlike = new Videolike({ is_liked: like, device_id: device_id, video: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Videolike.countDocuments({ video: item });
                const videostream = await Videostream.findById(item);
                // let viewCountUpdate = videostream['viewcount'];
                // viewCountUpdate = viewCountUpdate + 5;
                streamParam['likecount'] = userlikes;
                //streamParam['viewcount'] = viewCountUpdate;
                Object.assign(videostream, streamParam);
                await videostream.save();

                const stream = await Stream.find({ item_type: "video", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()

                await create_notification(stream[0], videostream, 'like', user);
                return { success: true }
            }
          }
        } else if (item_type == "text") {
          likeSearch["text"] = item;
          const checkuserlike = await Textlike.findOne(likeSearch);

          if (checkuserlike) {
            return { success: true }
          } else {
            const userlike = new Textlike({ is_liked: like, device_id: device_id, text: item });
            if (user != "") {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Textlike.countDocuments({ text: item });
                const textstream = await Textstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(textstream, streamParam);
                await textstream.save();

                const stream = await Stream.find({ item_type: "text", item_id: item });
                // let viewCountUpdate = stream[0]['viewcount'];
                // viewCountUpdate = viewCountUpdate + 5;
                sParam = {};
                sParam.updatedDate = updatedAt;
                //sParam.viewcount = viewCountUpdate;
                Object.assign(stream[0], sParam);
                await stream[0].save()

                await create_notification(stream[0], textstream, 'like', user);
                return { success: true }
            }
          }
        } else if (item_type == "sssvideo") {
          likeSearch["video"] = item;
          const checkuserlike = await Sssvideolike.findOne(likeSearch);

          if (checkuserlike) {
            return { success: true }
          } else {
            const userlike = new Sssvideolike({ is_liked: like, device_id: device_id, video: item });
            if (user) {
                userlike.user = user;
            }
            if (await userlike.save()) {
                const userlikes = await Sssvideolike.countDocuments({ video: item });
                const sssvideo = await Video.findById(item);
                // let viewCountUpdate = sssvideo['viewcount'];
                // viewCountUpdate = viewCountUpdate + 5;
                streamParam['likecount'] = userlikes;
                //streamParam['viewcount'] = viewCountUpdate;
                Object.assign(sssvideo, streamParam);
                await sssvideo.save();

                const stream = await Stream.find({ item_type: "sssvideo", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }
          }
        } else if (item_type == "audiotextbook") {
            likeSearch["audiotextbook"] = item;
            const checkuserlike = await Audiotextbooklike.findOne(likeSearch);

            if (checkuserlike) {
                return { success: true }
            } else {
              const userlike = new Audiotextbooklike({ is_liked: like, device_id: device_id, audiotextbook: item });
              if (user) {
                  userlike.user = user;
              }
              if (await userlike.save()) {
                  const userlikes = await Audiotextbooklike.countDocuments({ audiotextbook: item });
                  const audiotextbook = await Audiotextbook.findById(item);
                  // let viewCountUpdate = sssvideo['viewcount'];
                  // viewCountUpdate = viewCountUpdate + 5;
                  streamParam['likecount'] = userlikes;
                  //streamParam['viewcount'] = viewCountUpdate;
                  Object.assign(audiotextbook, streamParam);
                  await audiotextbook.save();

                  return { success: true }
              }
            }
        } else {
            throw 'Incorrect Item for Like';
        }
    } else {
        if (user != "") {
            likeSearch["user"] = user;
            update_user_points(user, -10, null, null);
            if (social_hours != "" && social_hours != undefined) {
                curUser = await User.find({ "_id": user });
                if (curUser.length == 1) {
                    curUser = curUser[0];
                    update_social_hours(curUser, social_hours);
                }
            }
        }
        likeSearch["device_id"] = device_id;
        if (item_type == "image") {
            likeSearch["image"] = item;
            const userlike = await Imagelike.findOne(likeSearch);
            if (userlike) {
                await Imagelike.deleteMany(likeSearch);
                const userlikes = await Imagelike.countDocuments({ image: item });
                const imagestream = await Imagestream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(imagestream, streamParam);
                await imagestream.save();
                const stream = await Stream.find({ item_type: "image", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "video") {
            likeSearch["video"] = item;
            const userlike = await Videolike.findOne(likeSearch);

            if (userlike) {
                await Videolike.deleteMany(likeSearch);
                const userlikes = await Videolike.countDocuments({ video: item });
                const videostream = await Videostream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(videostream, streamParam);
                await videostream.save();

                const stream = await Stream.find({ item_type: "video", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "text") {
            likeSearch["text"] = item;
            const userlike = await Textlike.findOne(likeSearch);

            if (userlike) {
                await Textlike.deleteMany(likeSearch);
                const userlikes = await Videolike.countDocuments({ video: item });
                const textstream = await Textstream.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(textstream, streamParam);
                await textstream.save();

                const stream = await Stream.find({ item_type: "text", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "sssvideo") {
            likeSearch["video"] = item;
            const userlike = await Sssvideolike.findOne(likeSearch);

            if (userlike) {
                await Sssvideolike.deleteMany(likeSearch);
                const userlikes = await Sssvideolike.countDocuments({ video: item });
                const sssvideo = await Video.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(sssvideo, streamParam);
                await sssvideo.save();

                const stream = await Stream.find({ item_type: "sssvideo", item_id: item })
                sParam = {};
                sParam.updatedDate = updatedAt;
                Object.assign(stream[0], sParam);
                await stream[0].save()
                return { success: true }
            }

        } else if (item_type == "audiotextbook") {
            likeSearch["audiotextbook"] = item;
            const userlike = await Audiotextbooklike.findOne(likeSearch);

            if (userlike) {
                await Audiotextbooklike.deleteMany(likeSearch);
                const userlikes = await Audiotextbooklike.countDocuments({ audiotextbook: item });
                const audiotextbook = await Audiotextbook.findById(item)
                streamParam['likecount'] = userlikes;
                Object.assign(audiotextbook, streamParam);
                await audiotextbook.save();
                return { success: true }
            }

        } else {
            throw 'Incorrect Item for Like';
        }
    }

} catch (e) {
    
}
}

async function offlinesyncing(req) {
    offlinesyncingData = req.body.item
    for (var i = 0; i < offlinesyncingData.length; i++) {
        actionType = offlinesyncingData[i]['action'];
        var newreq = {};
        newreq.body = offlinesyncingData[i];
        if (actionType == "like") {
            this.like(newreq.body);
        } else if (actionType == "comment") {
            this.comment(newreq);
        }
    }
    return { success: true }
}

async function played(reqbody) {
    let defer = require('q').defer();
    try {
        let likeParam = reqbody
        let item_type = likeParam.item_type
        let duration = likeParam.duration
        let device_id = (likeParam.device_id) ? likeParam.device_id : "undefined"
        let user = (likeParam.user) ? likeParam.user : ""
        let item = likeParam.item
        let durationcheck = Number(duration);
        if (durationcheck == NaN) {
            durationcheck = 0;
        }

        if (durationcheck > 0) {
            let currentISTDate = new Date();

            await Stream.updateOne({ "item_type": item_type, "item_id": item }, { $inc: { viewcount: 1 }, "updatedDate": currentISTDate.toISOString() });

            if (item_type === "video") {
                const video = await Videostream.findById(item);
                if (video) {
                    await Videostream.updateOne({ "_id": item }, { $inc: { viewcount: 1 } });
                    const userplayed = new Videoplayed({ duration: duration, video: item, device_id: device_id });
                    if (user) {
                        userplayed.user = user;
                        let duration_in_sec = video["duration_min"] * 60 + video["duration_sec"];
                        let duration_for_pass = (parseFloat(config.video_passing_percentage) / 100) * parseFloat(duration_in_sec);
                        if (duration >= duration_for_pass) {
                            try {
                                await Videoviewed.updateOne({ "video": item, "user": user }, { "$set": { "video": item, "user": user } }, { "upsert": true })
                                const checklessons = await Lesson.find({ "baithak_videos": item })
                                await calculate_lesson_progress(checklessons, user)
                            } catch (e) {
                                defer.reject(e)
                            }
                        }
                        if (durationcheck >= 300) { //watch atleast 5 min video
                            update_user_points(user, 10, null, null);
                        }
                    }
                    if (await userplayed.save()) {
                        defer.resolve(true)
                    } else {
                        defer.reject("Some error occured. Try again later")
                    }
                } else {
                    defer.reject("Video not exists")
                }

            } else if (item_type == "sssaudio") {
                const audio = await Audio.findById(item);
                if (audio) {

                    await Audio.updateOne({ "_id": item }, { $inc: { viewcount: 1 } });
                    const userplayed = new Audioplayed({ duration: duration, audio: item, device_id: device_id });

                    try {
                        if (user) {
                            userplayed.user = user;
                            let duration_in_sec = audio["duration_min"] * 60 + audio["duration_sec"];
                            let duration_for_pass = (parseFloat(config.video_passing_percentage) / 100) * parseFloat(duration_in_sec);
                            if (duration >= duration_for_pass) {
                                try {
                                    await Audioviewed.updateOne({ "audio": item, "user": user }, { "$set": { "audio": item, "user": user } }, { "upsert": true })

                                    const checklessons = await Lesson.find({ "audios": item })
                                    await calculate_lesson_progress(checklessons, user)
                                } catch (e) {
                                    defer.reject(e)
                                }
                            }
                        }
                        if (await userplayed.save()) {
                            defer.resolve(true)
                        } else {
                            defer.reject("Some error occured. Try again later")
                        }
                    } catch (err) {
                        defer.reject(err)
                    }
                } else {
                    defer.reject("Audio not exists")
                }
            } else if (item_type == "sssvideo") {
                const video = await Video.findById(item);
                if (video) {
                    await Video.updateOne({ "_id": item }, { $inc: { viewcount: 1 } });//commented as viewcount will be increase from streams
                    const userplayed = new Sssvideoplayed({ duration: duration, video: item, device_id: device_id });
                    if (user) {
                        userplayed.user = user;
                        let duration_in_sec = video["duration_min"] * 60 + video["duration_sec"];
                        let duration_for_pass = (parseFloat(config.video_passing_percentage) / 100) * parseFloat(duration_in_sec);
                        if (duration >= duration_for_pass) {
                            try {
                                await Sssvideoviewed.updateOne({ "video": item, "user": user }, { "$set": { "video": item, "user": user } }, { "upsert": true })

                                const checklessons = await Lesson.find({ "videos": item })
                                await calculate_lesson_progress(checklessons, user)
                            } catch (e) {
                                defer.reject(e)
                            }
                        }
                        if (durationcheck >= 300) { //watch atleast 5 min video
                            update_user_points(user, 10, video, durationcheck);
                        } else {
                            update_user_points(user, 0, video, durationcheck);
                        }
                    }
                    if (await userplayed.save()) {
                        defer.resolve(true)
                    } else {
                        defer.reject("Some error occured. Try again later")
                    }
                } else {
                    defer.reject("Video not exists")
                }

            } else if (item_type == "audiotextbook") {
                const audiotextbook = await Audiotextbook.findById(item);
                if (audiotextbook) {
                    await Audiotextbook.updateOne({ "_id": item }, { $inc: { viewcount: 1 } });//commented as viewcount will be increase from streams
                    const userplayed = new Audiotextbookplayed({ duration: duration, audiotextbook: item, device_id: device_id });
                    if (user) {
                        userplayed.user = user;
                        let duration_in_sec = audiotextbook["duration_min"] * 60 + audiotextbook["duration_sec"];
                        let duration_for_pass = (parseFloat(config.video_passing_percentage) / 100) * parseFloat(duration_in_sec);
                        if (duration >= duration_for_pass) {
                            try {
                                await Audiotextbookviewed.updateOne({ "audiotextbook": item, "user": user }, { "$set": { "audiotextbook": item, "user": user } }, { "upsert": true })

                                const checklessons = await Lesson.find({ "audiotextbooks": item })
                                await calculate_lesson_progress(checklessons, user)
                            } catch (e) {
                                defer.reject(e)
                            }
                        }
                        if (durationcheck >= 300) { //watch atleast 5 min video
                            update_user_points(user, 10, audiotextbook, durationcheck);
                        } else {
                            update_user_points(user, 0, audiotextbook, durationcheck);
                        }
                    }
                    if (await userplayed.save()) {
                        defer.resolve(true)
                    } else {
                        defer.reject("Some error occured. Try again later")
                    }
                } else {
                  defer.reject('Incorrect Item');
                }
            }

        } else {
            defer.resolve(true)
        }
    } catch (err) {
        defer.reject(err)
    }
    return defer.promise
}

async function resourceviewed(req) {
    let defer = require('q').defer();
    try {
        let viewedParam = req;
        let item_type = viewedParam.item_type
        let device_id = (viewedParam.device_id) ? viewedParam.device_id : "undefined"
        let user = (viewedParam.user) ? viewedParam.user : ""
        let item = viewedParam.item

        if (user != "") {
            let checklessons = {};
            if (item_type == "worksheet" || item_type == "assessment" || item_type == "quiz" || item_type == "progress_chart"  || item_type == "lesson_plan" || item_type == "project_work") {
                const documentviewed = new Documentviewed({ document: item, user: user });
                try {
                    await documentviewed.save()
                    await Documentviewed.updateOne({ document: item, user: user }, { "$set": { device_id: device_id } })
                    try {
                        let itemid = require('mongodb').ObjectID(item);
                        if (item_type == "worksheet") {
                            checklessons = await Lesson.find({ "worksheet": itemid })
                        } else if (item_type == "assessment") {
                            checklessons = await Lesson.find({ "assessment": itemid })
                        } else if (item_type == "progress_chart") {
                            checklessons = await Lesson.find({ "progress_chart": itemid })
                        } else if (item_type == "lesson_plan") {
                            checklessons = await Lesson.find({ "lesson_plan": itemid })
                        } else if (item_type == "project_work") {
                            checklessons = await Lesson.find({ "project_work": itemid })
                        }
                        await calculate_lesson_progress(checklessons, user)
                    } catch (err) {
                    }
                } catch (e) {
                }
            } else if (item_type == "scertsolution") {
                const scertsolutionviewed = new Scertsolutionviewed({ scertsolution: item, user: user });
                try {
                    await scertsolutionviewed.save()
                    await Scertsolutionviewed.updateOne({ scertsolution: item, user: user }, { "$set": { device_id: device_id } })
                    checklessons = await Lesson.find({ "scert_solutions": item })
                    await calculate_lesson_progress(checklessons, user)
                } catch (e) {
                }
            } else if (item_type == "kit") {
                const kitviewed = new Kitviewed({ kit: item, user: user });
                try {
                    await kitviewed.save()
                    await Kitviewed.updateOne({ kit: item, user: user }, { "$set": { device_id: device_id } })
                    checklessons = await Lesson.find({ "kits": item })
                    await calculate_lesson_progress(checklessons, user)
                } catch (e) {
                }
            }
            else if (item_type == "sssassessment") {
                const sssAssessmentViewed = new Sssassessmentviewed({ user: user, assessment: item });
                try {
                    await sssAssessmentViewed.save();
                } catch (error) {
                    throw error;
                }
            }
            else if (item_type == "bolo") {
                const boloViewed = new Boloviewed({ user: user, boloId: item });
                try {
                    await boloViewed.save();
                } catch (error) {
                    throw error;
                }
            }
            else if (item_type == "englishspeech") {
                const englishspeechViewed = new Englishspeechviewed({ user: user, englishspeechId: item });
                try {
                    await englishspeechViewed.save();
                } catch (error) {
                    throw error;
                }
            }
            else {
                throw 'Incorrect Item';
            }
        } else {

        }
        defer.resolve(true);
    } catch (err) {
        defer.reject(err);
    }
    return defer.promise;
}

async function lessonunlocked(request_body) {
    let defer = require('q').defer();
    try {
        let viewedParam = request_body

        let user = (viewedParam.user) ? viewedParam.user : ""
        let device_id = (viewedParam.device_id) ? viewedParam.device_id : ""
        let item = viewedParam.lesson

        const checklesson = await Lesson.findById(item).select('-hash');
        if (checklesson && checklesson["_id"] == item) {
            let isUnlockedlesson = 0;
            if (user)
                isUnlockedlesson = await Unlockedlesson.countDocuments({ lesson: item, user: user })
            else
                isUnlockedlesson = await Unlockedlesson.countDocuments({ lesson: item, device_id: device_id });

            if (isUnlockedlesson === 1) {
                defer.resolve(true);
            } else {
                const unlockedlesson = new Unlockedlesson({ lesson: item });
                if (user)
                    unlockedlesson.user = user
                else
                    unlockedlesson.device_id = device_id;

                if (await unlockedlesson.save()) {
                    defer.resolve(true);
                } else {
                    defer.reject("Some error occured. Try again later");
                }
            }
        } else {
            throw 'Lesson not exists';
        }
    } catch (err) {
        defer.reject(err);
    }
    return defer.promise;
}

//This is to follow or unfollow a user
async function followunfollow(userParam) {
    const follower = userParam.follower;
    const following = userParam.following;
    const action = userParam.action;
    const userfollower = await Userfollower.find({ follower: follower, following: following });
    //If action is follow or unfollow
    if (action == 'F') {
        if (!userfollower.length) {
            const dbUserfollower = new Userfollower({
                follower: follower,
                following: following,
                action: 'F',
                createdDate: new Date(),
                modifiedDate: new Date(),
                createdBy: follower,
                modifiedBy: follower
            });
            await dbUserfollower.save();

            const followerDetail = await User.findById(follower);
            const followingDetail = await User.findById(following);

            //Send notification to following user
            await create_notification(followingDetail, "", 'follow', followerDetail);
        } else if (userfollower[0]['action'] == 'F') {
            return 'You are already following this user.';
        } else if (userfollower[0]['action'] == 'U') {
            await Userfollower.updateOne({ "follower": follower, "following": following, "action": 'U' },
                { "$set": { "action": 'F', "createdBy": follower, "modifiedBy": follower } }, { "upsert": false });
            const followerDetail = await User.findById(follower);
            const followingDetail = await User.findById(following);
            //Send notification to following user
            await create_notification(followingDetail, "", 'follow', followerDetail);
        }
    } else if (action == 'U') {
        if (userfollower && userfollower.length && userfollower[0]['action'] == 'F') {
            await Userfollower.updateOne({ "follower": follower, "following": following, "action": 'F' },
                { "$set": { "action": 'U', "createdBy": follower, "modifiedBy": follower } }, { "upsert": false });
        } else {
            return 'You are not following this user.';
        }
    } else {
        return 'action parameter needs to be passed as F or U.';
    }
    return true;
}

//This is to get list of followers
async function followers(userParam) {

    const following = userParam.following;
    const loggedInUserId = userParam.loggedInUserId;

    var followersList = [];

    const userfollower = await Userfollower.find({ following: following, action: 'F' }).select('id follower action');

    var arrFollowerIds = [];
    var arrFollowingIds = [];

    if (userfollower && userfollower.length) {

        for (let index = 0; index < userfollower.length; index++) {
            const element = userfollower[index];
            var dbFollowerId = new objectId(element.follower);
            arrFollowerIds.push(dbFollowerId);
        }
    }

    //To get the follow status w.r.t. other profile user followers
    const userfollowers = await Userfollower.find({ follower: loggedInUserId, following: { $in: arrFollowerIds }, action: 'F' }).select('following action');

    if (userfollowers && userfollowers.length) {
        for (let index = 0; index < userfollowers.length; index++) {
            const element = userfollowers[index];
            var dbFollowingId = String(element.following);
            arrFollowingIds.push(dbFollowingId);
        }
    }

    //return arrFollowStatus;

    //To get follower names
    var userdetails = await User.find({ _id: { $in: arrFollowerIds } }).select('id firstName lastName image');

    if (userdetails && userdetails.length) {
        for (let index = 0; index < userdetails.length; index++) {
            let followerObj = {};
            const element = userdetails[index];
            followerObj['id'] = new objectId(element.id);
            userId = String(element.id);
            followerObj['firstName'] = element.firstName;
            followerObj['lastName'] = element.lastName;
            followerObj['profilePic'] = (element.image != '' && element.image != null) ? config.repositoryHost + element.image : config.user_image;

            if (_.contains(arrFollowingIds, userId)) {
                followerObj['followingStatus'] = 'F';
            } else {
                followerObj['followingStatus'] = null;
            }

            followersList.push(followerObj);
        }
    }
    return followersList;
}

//API updated by Devendra K
async function getCountDetails(userId, user, arrUserDetails) {
    arrUserDetails['completedCoursesCnt'] = user.noOfCompletedCourses ? user.noOfCompletedCourses : 0;
    arrUserDetails['goldBadgesCnt'] = await Userbadge.countDocuments({ user: new objectId(userId), badge: 'gold' });
    arrUserDetails['silverBadgesCnt'] = await Userbadge.countDocuments({ user: new objectId(userId), badge: 'silver' });
    arrUserDetails['bronzeBadgesCnt'] = await Userbadge.countDocuments({ user: new objectId(userId), badge: 'bronze' });
    arrUserDetails['learningPts'] = 50;
    arrUserDetails['followersCnt'] = await Userfollower.countDocuments({ following: new objectId(userId), action: 'F' });
    return arrUserDetails;
}

//API updated by Devendra K
async function getStreamDetails(userId, arrUserDetails) {
    const textstreams = await Textstream.find({ author: userId }).select('id');
    const imagestreams = await Imagestream.find({ author: userId }).select('id');
    const videostreams = await Videostream.find({ author: userId }).select('id');

    let arrItemIds = [];

    if (textstreams && textstreams.length > 0) {
        textstreams.map((text) => arrItemIds.push(text.id));
    }
    if (imagestreams && imagestreams.length > 0) {
        imagestreams.map((image) => arrItemIds.push(image.id));
    }
    if (videostreams && videostreams.length > 0) {
        videostreams.map((video) => arrItemIds.push(video.id));
    }
    let streamRecord = await Stream.aggregate([
        { $match: { item_id: { $in: arrItemIds }, is_active: true } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$viewcount" },
                postsCnt: { $sum: 1 }
            }
        }]);
    arrUserDetails['viewsCnt'] = streamRecord.length ? streamRecord[0]['totalViews'] : 0;
    arrUserDetails['postsCnt'] = streamRecord.length ? streamRecord[0]['postsCnt'] : 0;
    return arrUserDetails;
}

//API updated by Devendra K
async function getOtherUserSparkles(userId, arrUserDetails) {
    const today = new Date();
    const mm = today.getMonth() + 1;
    const yyyy = today.getFullYear();
    const getSessionData = await cronmethods.getSessionData(yyyy, mm, new objectId(userId));
    const otherUserSparkleDate = await Sparkle.aggregate([
        {
            // $match: {
            //     user: new objectId(userId)
            // }
            $match: getSessionData,
        },
        {
            $group: {
                _id: { user: "$user" },
                totalSparkles: { $sum: "$total" },
            }
        }
    ]);
    if (otherUserSparkleDate && otherUserSparkleDate.length > 0) {
        arrUserDetails['totalSparkles'] = otherUserSparkleDate[0].totalSparkles;
    }
    return arrUserDetails;
}

//API updated by Devendra K
async function getOtherUserRank(userdetails, userId, arrUserDetails) {
    let userType = userdetails.usertype;
    let district = userdetails.district;
    const collectionName = (userType == "govt teacher") ? Teacherranks : Parentranks;
    let TeacherranksData = await collectionName.find({ user: userId }, { rank: 1, grandTotal: 1 });
    if (TeacherranksData.length > 0) {
        let rank = TeacherranksData[0].rank;
        let grandTotal = TeacherranksData[0].grandTotal;
        switch (rank) {
            case (rank <= 10):
                topPercentage = "10%";
                nextAchievement = {
                    "sparkles": "",
                    "nextCrown": "You already have Gold Crown"
                }
                break;
            case (rank > 10 && rank <= 20):
                topPercentage = "20%";
                nextAchievement = {
                    "sparkles": await getSparkleDifference(10, district, grandTotal, userType),
                    "nextCrown": "Gold"
                }
                break;
            case (rank > 20 && rank <= 30):
                topPercentage = "30%";
                nextAchievement = {
                    "sparkles": await getSparkleDifference(20, district, grandTotal, userType),
                    "nextCrown": "Silver"
                }
                break;
            case (rank > 30 && rank <= 50):
                topPercentage = "50%";
                nextAchievement = {
                    "sparkles": await getSparkleDifference(30, district, grandTotal, userType),
                    "nextCrown": "Bronze"
                }
                break;
            default:
                topPercentage = "No Rank";
                nextAchievement = {
                    "sparkles": await getSparkleDifference(50, district, grandTotal, userType),
                    "nextCrown": "Dotted"
                }
                break;
        }
        arrUserDetails['topInDistrict'] = topPercentage;
    }
    return arrUserDetails;
}

//API updated by Devendra K
async function otherProfile(userParam) {
    try {
        const userId = userParam.userId;
        const loggedInUserId = userParam.loggedInUserId;
        if (userId) {
            //To get the follow status w.r.t. other profile user clicked
            const userfollower = await Userfollower.find({ follower: loggedInUserId, following: userId }).select('id action');
            //To get other user details
            let userdetails = await User.findOne({ _id: new objectId(userId) }).select('id firstName lastName image state noOfCompletedCourses usertype district registrationDate diseCode schoolName totalResources');
            if (userdetails) {
                let arrUserDetails = {};
                arrUserDetails['followStatus'] = (userfollower && userfollower.length) ? userfollower[0]['action'] : null;
                arrUserDetails['id'] = userId;
                arrUserDetails['firstName'] = userdetails.firstName;
                arrUserDetails['lastName'] = userdetails.lastName;
                arrUserDetails['profilePic'] = (userdetails.image != '' || userdetails.image != null) ? config.repositoryHost + userdetails.image : config.user_image;
                // Added By Devendra
                arrUserDetails['registrationDate'] = userdetails.registrationDate;
                arrUserDetails['totalResources'] = userdetails.totalResources;
                if (userdetails.schoolName != "") {
                    arrUserDetails['schoolName'] = userdetails.schoolName;
                } else {
                    const school = await School.find({ diseCode: userdetails.diseCode });
                    arrUserDetails['schoolName'] = (school && school.length > 0) ? school[0].schoolName : "";
                }
                if (userdetails.state) {
                    arrUserDetails['state'] = userdetails.state;
                    let userstate = await State.findById(userdetails.state);
                    let statename = (userstate && userstate.name) ? userstate.name : "My State";
                    arrUserDetails['stateName'] = statename;
                }
                arrUserDetails = await getCountDetails(userId, userdetails, arrUserDetails);
                arrUserDetails = await getStreamDetails(userId, arrUserDetails);
                // Get Other user's sparkle details
                arrUserDetails = await getOtherUserSparkles(userId, arrUserDetails);
                // Get Other user's rank in disctrict
                arrUserDetails = await getOtherUserRank(userdetails, userId, arrUserDetails);
                return arrUserDetails;
            } else {
                throw 'No user record found';
            }
        }
    } catch (e) {
        throw e;
    }
}

//API updated by Devendra K
async function getSparkleDifference(range, district, currentgrandTotal, userType) {
    let defer = require('q').defer();
    let difference = 0;
    try {
        let collectionName = (userType == "govt teacher") ? Teacherranks : Parentranks;
        let getAboveRange = await collectionName.find({ district: district, rank: { "$lt": range } }, { grandTotal: 1 }).sort({ grandTotal: 1 }).limit(1);
        if (getAboveRange.length > 0) {
            let getAboveRangeGrandTotal = getAboveRange[0].grandTotal;
            difference = (getAboveRangeGrandTotal - currentgrandTotal);
        }
        defer.resolve(difference);
    }
    catch (e) {
        defer.reject(e)
    }
    return defer.promise
}

// Below function will capture unique post share by the user. 
// This store in the db & calculate the badges based on the number of unique share
async function recordPostShare(userParam) {

    const userId = userParam.userId;
    const streamId = userParam.streamId;
    if (userId == null || userId == undefined || streamId == null || streamId == undefined)
        throw 'Please share correct input';
    else {
        const postShareData = await PostShare.find({ userId: userId, streamId: streamId });

        if (!postShareData.length) {
            const dbPostShare = new PostShare({
                userId: userId,
                streamId: streamId,
                shared_on: new Date(),
            });
            await dbPostShare.save();

            let uniqueShareCount = await PostShare.countDocuments({ userId: userId });
            if (uniqueShareCount && uniqueShareCount == 100) {
                let checkUserBadge = await Userbadge.find({ "user": userId, "badge": "unique-sharing-100" });
                if (checkUserBadge.length == 0) {
                    let today = new Date();
                    let expiry_date = new Date(today.setDate(today.getDate() + parseInt(config.badge_available_for_days)));
                    let centuryBadge = new Userbadge({ "user": userId, "badge": "unique-sharing-100", type: 'uniq-sharing', expiryDate: expiry_date });
                    await centuryBadge.save();
                }
            }
            else if (uniqueShareCount && uniqueShareCount == 200) {
                let checkUserBadge = await Userbadge.find({ "user": userId, "badge": "unique-sharing-200" });

                if (checkUserBadge.length == 0) {
                    let today = new Date();
                    let expiry_date = new Date(today.setDate(today.getDate() + parseInt(config.badge_available_for_days)));
                    let doubleCenturyBadge = new Userbadge({ "user": userId, "badge": "unique-sharing-200", type: 'uniq-sharing', expiryDate: expiry_date });
                    await doubleCenturyBadge.save();
                }
            }
            else if (uniqueShareCount && uniqueShareCount == 300) {
                let checkUserBadge = await Userbadge.find({ "user": userId, "badge": "unique-sharing-300" });
                if (checkUserBadge.length == 0) {
                    let today = new Date();
                    let expiry_date = new Date(today.setDate(today.getDate() + parseInt(config.badge_available_for_days)));
                    let tripleCenturyBadge = new Userbadge({ "user": userId, "badge": "unique-sharing-300", type: 'uniq-sharing', expiryDate: expiry_date });
                    await tripleCenturyBadge.save();
                }
            }
            else if (uniqueShareCount && uniqueShareCount == 500) {
                let checkUserBadge = await Userbadge.find({ "user": userId, "badge": "unique-sharing-500" });
                if (checkUserBadge.length == 0) {
                    let today = new Date();
                    let expiry_date = new Date(today.setDate(today.getDate() + parseInt(config.badge_available_for_days)));
                    let goldenBatBadge = new Userbadge({ "user": userId, "badge": "unique-sharing-500", type: 'uniq-sharing', expiryDate: expiry_date });
                    await goldenBatBadge.save();
                }
            }
        }
        return {
            statusCode: 200,
            status: true
        };
    }
}

async function sendPushForDDLesson(userParam) {
    const phoneNumber = userParam.phoneNumber;
    const dailyOrWeekly = userParam.dailyOrWeekly;

    if (phoneNumber == null || phoneNumber.length > 10 || phoneNumber.length < 10 || dailyOrWeekly == undefined)
        throw 'Please share correct input';

    if (dailyOrWeekly === 'daily') {
        cronmethods.notifyTeachersForNextDayTasks(phoneNumber);
    } else if (dailyOrWeekly === 'weekly') {
        cronmethods.notifyTeachersForNextWeekTasks(phoneNumber);
    }
}

async function createCertificate(course, user) {
  let promises1 = [];
  let im = require('imagemagick');
  let certificateName = "";
  userUpdatedCertificates = [];
  const curUser = await User.findById(user);
  const curCourse = await Course.findById(course);
  const enrollment = await Enrollment.find({"course":course, "user":user})
  if (enrollment && enrollment.length >= 1) {
    let allotdate = enrollment[0]['completionDate'];
    if (curUser.fullName !== undefined && curUser.fullName !== null)
      certificateName = curUser.fullName.toUpperCase();
    else
      certificateName = curUser.firstName.toUpperCase() + ((curUser.lastName !== undefined && curUser.lastName !== null) ? " " + curUser.lastName.toUpperCase() : "");

    let allotdatestring = allotdate.getDate() + '-' + (allotdate.getMonth() + 1) + '-' + allotdate.getFullYear();
    try {
      const certificateUrl = config.assetHost + "course-certificate.png";
      await downloadFileFromURL(certificateUrl, config.uploadPath, "course-certificate.png");
    } catch (e) {
      
    }
    let usercertificatepath = config.uploadPath + 'usercertificates/' + user + "_" + course + '.png';
    let mastercertificatepath = config.uploadPath + 'course-certificate.png';
    const obj = {
      key: course,
      value: user + "_" + course + '.png'
    };
    userUpdatedCertificates.push(obj);
    p = new Promise((resolve, reject) => {
      if (curCourse.isNameInHindi == true) {
        if (curCourse.englishTitle == "") {
          let optionsObj = [mastercertificatepath, '-flatten', '-font', 'Lohit-Devanagari', '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,450 '"+ curCourse.name +"'", usercertificatepath];
          im.convert(optionsObj, function (err, stdout) {
            if (err) reject(err);

            let optionsObj1 = [usercertificatepath, '-flatten', '-font', englishFont, '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,615 '" + certificateName + "' text 0,740 '" + allotdatestring + "'", usercertificatepath];

            im.convert(optionsObj1, function (err, stdout) {
              if (err) reject(err);
              resolve("Converted Image successfully 2");
            });
          });
        } else {
          let optionsObj = [mastercertificatepath, '-flatten', '-font', englishFont, '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,450 '"+ curCourse.englishTitle +"' text 0,615 '" + certificateName + "' text 0,740 '" + allotdatestring + "'", usercertificatepath];

          im.convert(optionsObj, function (err, stdout) {
            if (err) reject(err);
            resolve("Converted Image successfully 2");
          });
        }
      } else {
        let optionsObj = [mastercertificatepath, '-flatten', '-font', englishFont, '-fill', 'black', '-pointsize', '40', '-gravity', 'North', '-draw', "text 0,450 '"+ curCourse.name +"' text 0,615 '" + certificateName + "' text 0,740 '" + allotdatestring + "'", usercertificatepath];

        im.convert(optionsObj, function (err, stdout) {
          if (err) reject(err);
          resolve("Converted Image successfully 2");
        });
      }
    });
    promises1.push(p)

    try {
      await Promise.all(promises1)

      try {

        try {
          const fs = require('fs')
          const certFile = fs.createReadStream(usercertificatepath);
          let updateResponseImage = await uploadStreamToS3(certFile, "usercertificates", user + "_" + course + '.png');
                    
          const filePathMasterCertificate = path.resolve(config.uploadPath + 'course-certificate.png');
          
          fs.unlinkSync(filePathMasterCertificate);

        } catch (e) {
          throw e
        }
      } catch (e) {
        throw e
      }
    }
    catch (err) {
      throw err
    }
  } else {
    throw new UserException("Not enrolled for the course",201);
  }
  return 'usercertificates/' + user + "_" + course + '.png';
}
