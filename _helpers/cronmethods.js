const config = require("../config.json");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
var moment = require("moment");
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
const Ddlesson = db.Ddlesson;
const Ddtopic = db.Ddtopic;
const State = db.State;
const Notification = db.Notification;
const Documentviewed = db.Documentviewed;
// Added by Devendra
const Audiotextbookplayed = db.Audiotextbookplayed;
const Sssvideoplayed = db.Sssvideoplayed;
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
const TeachersssRank = db.Teachersssrank;
const ParentsssRank = db.Parentsssrank;
const TeacherbaithaklikesRank = db.Teacherbaithaklikesrank;
const ParentbaithaklikesRank = db.Parentbaithaklikesrank;
const TeachercourseRank = db.Teachercourserank;
const ParentcourseRank = db.Parentcourserank;
const TeacherassessmentRank = db.Teacherassessmentrank;
const ParentassessmentRank = db.Parentassessmentrank;
const TeacherdigitaldiaryRank = db.Teacherdigitaldiaryrank;
const ParentdigitaldiaryRank = db.Parentdigitaldiaryrank;
const TeacherbonusRank = db.Teacherbonusrank;
const ParentbonusRank = db.Parentbonusrank;
const District = db.District;
const Progress = db.Ddprogress;
const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;
const TeacherstvRank = db.Teacherstvrank;

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
const {
    registerStudentForNewAPK,
} = require("../assessments/assessmentreport.service");

const firebaseAdmin = require("firebase-admin");

// const firebaseServiceAccount = require("../sampark-2cb4e-firebase-adminsdk-bfxop-67d0adbf87.json");

const firebaseServiceAccount = {
    "type": "service_account",
    "project_id": "sampark-2cb4e",
    "private_key_id": "67d0adbf871aaa2b61c288c5b85cfbb96ad0a73f",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCmUq0R5dOV1Yqw\noGvqf+RSIkBKgh9wcTc6hCnkPprT01guN9KmNFEJvhaed/4f0+rZLWJLpst/6KZq\ni09d8fOxZBuNwGMiAv2B0xyValOStSNDtvs2wXpiFO47rDW+35IJPPTfynwGBGxm\nxUQw90Xzg3CoccLmuPYXf654pMGAv+MKjY0g6dmOvDky8ZO7vjFtsX3nj+OB31Lf\nTFFWkjezVppUp78enDlsEnoAfV/rEfoCMyiUcSHyLyMCBYh34+Qynx01uRf0qmoU\nOtXRGzgu63DBsPAbxneSFr6J1hnnSQnOmaTlTLzZvBGeFFLKmMArqh1M2JTsia3y\nGIUIwarFAgMBAAECggEAJv/F0yeHuF9s+MN06nR4jgW3+4CNbKkvYQoyZHGFjlvF\nFnlCbHRh+B3ZYekS7lWbgLcSkFiY6PIda2glAQtFr/egOlm9JPF8jd95mVNoK0NL\n9InIV+uADdWIkvdrVslHjeD8LillcWfCH0rsFWs1vMa6ONUL9VuzYIkw2NsRAGYd\nB4VerivBdSqGB+TLqxqLS0z6vtQVdbxAaYoIjETlp/qvZsaq3UcmZTcSD7/nMjut\nc3eWU+SsaA/2N/zftRZ4K1RwPwvs5zVNKceTYdLOYDlIBdsJiHddc+lsUZLSBXcq\n8o7EcC1stJO5BrmRasonh2LLc/6fspcURUUfKiE2QQKBgQDeHq4PXw7bFxyvIEL1\n1Zjh1d95y5fbbxqWN9L7Sf4LUa4qpsfQKVagDeDuO6rHRjfui+yB3cbelPcsDRH+\nQcZbllWG0FiNJld7nv3mGRZQtiU8Ovpn4OHKDhopsq4J6uW2r3g343DizAOly72c\ny0dk9o3Dd483pHGw56x/2s0gMQKBgQC/sT46YQJMiHL9XQ0UvxwokDxmby8NOVbN\nHemd6U3bTccqeD9+8YG14deqaGpT+RUF7cVYzsVP/wFihnvEJvxpPquEPwZq3kep\n69JZVKlK6MdmiNPlR30+Me0VqkZOL6USOPCytbIfbAUxW4Qr0i3Iqk1MRrNFcFzG\nrSQpk02C1QKBgGdvlBD2bF2ccrAe7u+6KzqntSzroWj/YTso/egledddjySvjAck\n6QEZ1XA7evjXez5sDJQhafXHGx95arKjgLKv3F4ucb4xZ7XawVPAxQKK/+X/dRKg\nx6SnUomuepuFtrmPFwW3tZ738I7pxP/aLgIXSscGyzvXKVZ/XHYhtzpRAoGBAILI\ngYVA9FmU6qcz2h3ieWqvZZYZm0dxbGhLVT04lLbf7Ndr7R5F1VJrQEHyNUEPeqlt\n3KvHftUiTSaUTFK6qpF/gXObsFwvRUOIMh5iZZJHGOw6xB701F0foPqcDpV/aibx\nlD7JOjq37x8KqjVfk38Jue0le2AP1ixyqm53InX1AoGBAMJa064iz+ujmohQ2ovc\nTgqg9yU6M7DtqwKBBnovnjAx77kY05OPv5mOpwOXhljmEBpxWPQp6HMivMDjhnWQ\n+oSFtvt5dx0qOks8aEf2pqDeQhFsbffCGm8trhc7XaGonOoMySq/bqv1KmQV56eV\nXmVuWR6lGL7fV3ueORg7sufu\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-bfxop@sampark-2cb4e.iam.gserviceaccount.com",
    "client_id": "117762032676598230143",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-bfxop%40sampark-2cb4e.iam.gserviceaccount.com"
  }

if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(firebaseServiceAccount),
        databaseURL: "https://sampark-2cb4e.firebaseio.com",
    });
}

module.exports = {
    sendEmail: async function (cronname, cronstatus, message, errormessage) {
        //cronstatus -> started, completed, stopped (when uncompleted and stopped due to some error)
        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(config.sendgrid_api_key);

        let runat = new Date().toISOString();
        let subject = "Sampark Job Updates";
        let mailmessage = "CRON : " + cronname + " " + cronstatus + " at " + runat;
        if (errormessage != "") {
            mailmessage = mailmessage + "<br><br>" + errormessage;
        }
        if (message != "") {
            mailmessage = mailmessage + "<br><br>" + message;
        }
        const msg1 = {
            to: "gagan.sharma@matrixnodes.com",
            //from: 'no-reply@samparkfoundation.org',
            from: "appsupport@samparkfoundation.org",
            subject: subject,
            text: mailmessage,
            html: mailmessage,
        };
        await sgMail.send(msg1).catch((err) => {
        });
    },

    getCurrentUserDetails: async function (userid) {
        let defer = q.defer();
        try {
            if (userid) {
                let curUser = await User.find({ _id: userid });
                defer.resolve(curUser);
            } else {
                defer.resolve("");
            }
        } catch (e) {
            defer.reject(e);
        }
        return defer.promise;
    },
    uploadToS3: async function (file, folder, newfilename) {
        if (!newfilename) {
            newfilename = new Date().getTime() + file.name; //Added datetimestamp for unique image if two images having same name
        }
        let defer = require("q").defer();
        try {
            let s3bucket = new AWS.S3({
                accessKeyId: IAM_USER_KEY,
                secretAccessKey: IAM_USER_SECRET,
                Bucket: BUCKET_NAME,
            });
            s3bucket.createBucket(function () {
                let params = {
                    Bucket: BUCKET_NAME + "/" + folder,
                    Key: newfilename,
                    Body: file.data,
                };
                s3bucket.upload(params, function (err, data) {
                    if (err) {
                        defer.reject(e);
                    }
                    defer.resolve(data);
                });
            });
        } catch (e) {
            defer.reject(e);
        }
        return defer.promise;
    },
    uploadStreamToS3: async function (file, folder, newfilename) {
        if (!newfilename) {
            newfilename = file.name;
        }
        let defer = require("q").defer();
        try {
            let s3bucket = new AWS.S3({
                accessKeyId: IAM_USER_KEY,
                secretAccessKey: IAM_USER_SECRET,
                Bucket: BUCKET_NAME,
            });
            s3bucket.createBucket(function () {
                let params = {
                    Bucket: BUCKET_NAME + "/" + folder,
                    Key: newfilename,
                    Body: file,
                };
                s3bucket.upload(params, function (err, data) {
                    if (err) {
                        defer.reject(e);
                    }
                    defer.resolve(data);
                });
            });
        } catch (e) {
            defer.reject(e);
        }
        return defer.promise;
    },
    downloadFileFromURL: async function (url, folerName, fileName) {
        const localPath = path.resolve(__dirname, folerName + fileName);
        var file = fs.createWriteStream(localPath);
        try {
            var request = https.get(url, function (response) {
                response.pipe(file);
            });
        } catch (e) {
        }
        return new Promise((resolve, reject) => {
            file.on("finish", resolve);
            file.on("error", reject);
        });
    },
    getAWSObject: async function (fileName) {
        let defer = require("q").defer();
        try {
            let s3bucket = new AWS.S3({
                accessKeyId: IAM_USER_KEY,
                secretAccessKey: IAM_USER_SECRET,
                Bucket: BUCKET_NAME,
            });
            let s3object = s3bucket.getObject(
                {
                    Bucket: BUCKET_NAME,
                    Key: fileName,
                },
                function (error, b) {
                    defer.resolve(error);
                }
            );
        } catch (headErr) {
            defer.reject(headErr);
        }
        return defer.promise;
    },
    titleize: function (name) {
        return name
            .toLowerCase()
            .split(" ")
            .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            .join(" ")
            .trim();
    },

    get_current_user: function (req) {
        var accessToken = req.headers.authorization.replace("Bearer ", "");
        var d = jwt.decode(accessToken, config.secret);
        return d.sub;
    },

    calculate_lesson_progress: async function (lessons, userid) {
        if (lessons.length > 0) {
            let resourceviewed = 0;
            let totalresources = 0;

            let query_doc = {};
            query_doc["user"] = userid;

            let document_ids = [];
            checkdocuments = await Documentviewed.find(query_doc).select("document");
            for (const checkdocument of checkdocuments) {
                document_ids.push(checkdocument["document"].toString());
            }

            for (const curLesson of lessons) {
                resourceviewed = 0;
                totalresources = 0;

                kitids = curLesson["kits"];
                if (kitids.length > 1 || (kitids.length == 1 && kitids[0] != "")) {
                    totalresources = totalresources + kitids.length;

                    let query_kits = {};
                    query_kits["user"] = userid;
                    query_kits["kit"] = {};
                    query_kits["kit"]["$in"] = kitids;
                    const checkkits = await Kitviewed.distinct("kit", query_kits);
                    resourceviewed = resourceviewed + checkkits.length;
                }

                videoids = curLesson["videos"];
                if (
                    videoids.length > 1 ||
                    (videoids.length == 1 && videoids[0] != "")
                ) {
                    totalresources = totalresources + videoids.length;

                    var query_video = {};
                    query_video["user"] = userid;
                    query_video["video"] = {};
                    query_video["video"]["$in"] = videoids;
                    const checkvideos = await Sssvideoviewed.distinct(
                        "video",
                        query_video
                    );
                    resourceviewed = resourceviewed + checkvideos.length;
                }

                audioids = curLesson["audios"];
                if (
                    audioids.length > 1 ||
                    (audioids.length == 1 && audioids[0] != "")
                ) {
                    totalresources = totalresources + audioids.length;

                    var query_audio = {};
                    query_audio["user"] = userid;
                    query_audio["audio"] = {};
                    query_audio["audio"]["$in"] = audioids;
                    const checkaudios = await Audioviewed.distinct("audio", query_audio);
                    resourceviewed = resourceviewed + checkaudios.length;
                }

                let baithak_videoids = curLesson["baithak_videos"];
                if (
                    baithak_videoids.length > 1 ||
                    (baithak_videoids.length == 1 && baithak_videoids[0] != "")
                ) {
                    totalresources = totalresources + baithak_videoids.length;

                    var query_bvideo = {};
                    query_bvideo["user"] = userid;
                    query_bvideo["video"] = {};
                    query_bvideo["video"]["$in"] = baithak_videoids;
                    const checkbvideos = await Videoviewed.distinct(
                        "video",
                        query_bvideo
                    );
                    resourceviewed = resourceviewed + checkbvideos.length;
                }

                curUser = await User.find({ _id: userid }); //.populate('state',['name']);
                if (curUser.length == 1) {
                    curUser = curUser[0];
                    curUserState = curUser.state;
                    scert_solutionid = curLesson["scert_solutions"];
                    if (
                        scert_solutionid.length > 1 ||
                        (scert_solutionid.length == 1 && scert_solutionid[0] != "")
                    ) {
                        scert_solution = await Scertsolution.find({
                            _id: scert_solutionid,
                            states: curUserState,
                        });
                        if (scert_solution.length > 0) {
                            var query_scert = {};
                            query_scert["user"] = userid;
                            query_scert["scertsolution"] = {};
                            query_scert["scertsolution"] = scert_solution[0]["_id"];

                            const checkscertsols = await Scertsolutionviewed.distinct(
                                "scertsolution",
                                query_scert
                            );
                            resourceviewed = resourceviewed + checkscertsols.length;
                            totalresources = totalresources + checkscertsols.length;
                        }
                    }
                }

                if (
                    curLesson["progress_chart"] !== null &&
                    curLesson["progress_chart"] !== "" &&
                    curLesson["progress_chart"] !== undefined
                ) {
                    totalresources = totalresources + 1;
                    if (
                        document_ids.indexOf(curLesson["progress_chart"].toString()) > -1
                    ) {
                        resourceviewed = resourceviewed + 1;
                    }
                }

                if (
                    curLesson["assessment"] !== null &&
                    curLesson["assessment"] !== "" &&
                    curLesson["assessment"] !== undefined
                ) {
                    totalresources = totalresources + 1;
                    if (document_ids.indexOf(curLesson["assessment"].toString()) > -1) {
                        resourceviewed = resourceviewed + 1;
                    }
                }

                if (
                    curLesson["worksheet"] !== null &&
                    curLesson["worksheet"] !== "" &&
                    curLesson["worksheet"] !== undefined
                ) {
                    totalresources = totalresources + 1;
                    if (document_ids.indexOf(curLesson["worksheet"].toString()) > -1) {
                        resourceviewed = resourceviewed + 1;
                    }
                }
                if (totalresources > 0) {
                    let new_progress = parseInt((resourceviewed / totalresources) * 100);

                    await Lessonprogress.updateOne(
                        { lesson: curLesson["_id"], user: userid },
                        {
                            $set: {
                                lesson: curLesson["_id"],
                                user: userid,
                                progress: new_progress,
                            },
                        },
                        { upsert: true }
                    );
                }
            }
        }
    },
    prepareGetTodayVideoPostQuery: function () {
        let finalVideoQuery = {}; //  Final query object initialization
        let queryForVideo = {}; // Query to fetch SD posts

        queryForVideo["is_active"] = true;
        queryForVideo["is_deleted"] = false;
        queryForVideo["is_hidden"] = false;
        queryForVideo["publishDate"] = {};

        const startOfDay = new Date(
            new Date().setUTCHours(0, 0, 0, 0)
        ).toISOString();
        const endOfDay = new Date().toISOString();
        //const endOfDay = new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString();

        queryForVideo["publishDate"]["$gt"] = startOfDay;
        queryForVideo["publishDate"]["$lt"] = endOfDay;

        queryForVideo["is_sampark_didi_post"] = false;
        queryForVideo["item_type"] = "video";

        finalVideoQuery["$and"] = [];
        for (const [key, value] of Object.entries(queryForVideo)) {
            let q = {};
            q[key] = value;
            finalVideoQuery["$and"].push(q);
        }

        return finalVideoQuery;
    },
    scheduleConsolidateNotification: async function () {
        let videoStreamsQuery = this.prepareGetTodayVideoPostQuery();

        videoStreams = await Stream.find(videoStreamsQuery, { item_id: 1 });
        let videoCount = 0;
        for (const curStream of videoStreams) {
            let authorId = await Videostream.findById(curStream.item_id, {
                author: 1,
            });
            if (authorId != undefined) {
                let user = await User.findById(authorId.author);
                if (user.usertype == "govt teacher") videoCount = videoCount + 1;
            }
        }

        if (videoCount > 0) {
            let topic = ""; //
            let fcmTitle = "New videos";
            let fcmMessage =
                "There are " + videoCount + " new teacher videos on Baithak today";
            let users = await User.find(
                { usertype: { $ne: "parent" } },
                { fcm_token: 1 }
            ).limit(10);

            this.sendNotificationToTopic(topic, fcmTitle, fcmMessage);
        }
    },
    sendNotificationToTopic: async function (topic, fcmTitle, fcmMessage) {
        var admin = require("firebase-admin");

        var serviceAccount = require("../sampark-2cb4e-firebase-adminsdk-bfxop-67d0adbf87.json");

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://sampark-2cb4e.firebaseio.com",
            });
        }
        var payload = {
            notification: {
                title: fcmTitle,
                body: fcmMessage,
            },
        };
        var options = {
            priority: "high",
            timeToLive: 60 * 60 * 24,
        };

        admin
            .messaging()
            .sendToTopic(topic, payload, options)
            .then(function (response) {
            })
            .catch(function (error) {
            });
    },

    create_notification: async function (stream, streamdetail, action, curUser) {
        if (action == "comment") {
            fcmtitle = "New Comment";
            fcmmessage =
                "New comment has been posted for your post " + streamdetail.description;
        } else if (action == "like") {
            fcmtitle = "New Like";
            fcmmessage = "Your post " + streamdetail.description + " has been liked";
        } else if (action == "videoapproved") {
            fcmtitle = "Video	Post Approved";
            fcmmessage = "Video posted by you has been approved";
        } else if (action == "reply") {
            fcmtitle = "New Reply";
            fcmmessage =
                "New reply has been posted for your comment " + streamdetail.comment;
            user = streamdetail.user;
        } else if (action == "follow") {
            fcmtitle = "New follower";
            fcmmessage =
                "प्रिय " +
                stream.fullName +
                ", " +
                curUser.fullName +
                " ने आपका अनुसरण (follow ) किया है। देखने के लिए बैठक पर अभी लॉग इन करें।";
            user = stream.id;
        } else if (action == "newUserPost") {
            fcmtitle = "New Post on Baithak";
            //प्रिय <User Name>, आप <Following user nam>follow करते हैं, उन्होंने अभी अभी कुछ नया पोस्ट किया है।  देखने के लिए बैठक पर अभी लॉग इन करें।
            fcmmessage =
                "प्रिय " +
                streamdetail.fullName +
                ", आप " +
                curUser.fullName +
                " का अनुसरण (follow ) करते हैं, उन्होंने अभी अभी कुछ नया पोस्ट किया है।  देखने के लिए बैठक पर अभी लॉग इन करें।";
            user = streamdetail._id;
        } else if (action == "videorejected") {
            fcmtitle = "Video Post Rejected";
            fcmmessage = "Video posted by you has been rejected";
            user = streamdetail.user;
        }
        if (action != "reply" && action != "follow" && action != "newUserPost") {
            user = streamdetail.author;
        }
        message = action;

        if (user != curUser && curUser !== null && curUser !== undefined) {
            var admin = require("firebase-admin");

            //var id = "5e130bba1e6e9053ee824b12";
            const userdetail = await User.findById(user);
            var serviceAccount = require("../sampark-2cb4e-firebase-adminsdk-bfxop-67d0adbf87.json");

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: "https://sampark-2cb4e.firebaseio.com",
                });
            }
            var payload = {
                notification: {
                    title: fcmtitle,
                    body: fcmmessage,
                },
                data: {
                    user: userdetail.id,
                    usertype: userdetail.usertype,
                },
            };
            var options = {
                priority: "high",
                timeToLive: 60 * 60 * 24,
            };
            let notification;
            if (action !== "follow")
                notification = new Notification({
                    user: user,
                    stream: stream.id,
                    message: message,
                    creator: curUser,
                });
            else
                notification = new Notification({
                    user: user,
                    message: message,
                    creator: curUser,
                });
            await notification.save();

            if (action == "like") {
                socket.emit("newlike", { message: message, user: user });
            }
            if (action == "comment") {
                socket.emit("newcomment", { message: message, user: user });
            }
            if (action == "videoapproved") {
                socket.emit("videoapproved", { message: message, user: user });
            }
            if (action == "videorejected") {
                socket.emit("videorejected", { message: message, user: user });
            }
            if (action == "reply") {
                socket.emit("newreply", { message: message, user: user });
            }
            if (action == "follow") {
                socket.emit("newfollow", { message: message, user: user });
            }
            if (action == "newUserPost") {
                socket.emit("newUserPost", { message: message, user: user });
            }
            if (userdetail && userdetail.fcm_token) {
                admin
                    .messaging()
                    .sendToDevice(userdetail.fcm_token, payload, options)
                    .then(function (response) {
                    })
                    .catch(function (error) {
                    });
            }
        }
    },

    resize_image: async function (path, old_path, model) {
        var im = require("imagemagick");
        var newPath = old_path; //__dirname + "/uploads/fullsize/" + imageName;
        var thumbPath = path; //__dirname + "/uploads/thumbs/" + imageName;

        im.identify(newPath, function (err, features) {
            if (err) throw err;
            if (features.width > config.imageMaxWidth) {
                im.resize(
                    {
                        srcPath: newPath,
                        dstPath: thumbPath,
                        width: config.imageMaxWidth,
                    },
                    function (err, stdout, stderr) {
                        if (err) throw err;
                        im.identify(thumbPath, function (err, featuresnew) {
                            if (err) throw err;
                            model.width = featuresnew.width;
                            model.height = featuresnew.height;
                            model.save();
                        });
                    }
                );
            } else {
                model.width = features.width;
                model.height = features.height;
                model.save();
            }
            // { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
        });
    },

    update_social_hours: function (check_user, social_seconds) {
        userParam = {};
        let social_hours = parseFloat(social_seconds);
        let current_social_hours = 0;
        if (check_user.social_hours && check_user.social_hours > 0) {
            current_social_hours = social_hours - check_user.social_hours;
        } else {
            current_social_hours = social_hours;
        }
        userParam["social_hours"] = social_hours;
        Object.assign(check_user, userParam);
        check_user.save();

        let today = new Date();
        let dd = today.getDate();

        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        if (dd < 10) {
            dd = "0" + dd;
        }

        if (mm < 10) {
            mm = "0" + mm;
        }
        today = dd + "-" + mm + "-" + yyyy;
        Userattendance.find({ user: check_user.id, attendance_date: today })
            .select("-hash")
            .then((res1) => {
                if (res1.length == 1) {
                    checkattendance = res1[0];
                    userAParam = {};
                    userAParam["social_hours"] =
                        checkattendance.social_hours + current_social_hours;
                    Object.assign(checkattendance, userAParam);
                    checkattendance.save();
                }
            });

        // save video
    },
    // This cron job will run on the first day of everymonth
    copyLastMonthRankData: async function () {
        try {
            let today = new Date(); // 2021-09-15T06:35:05.960Z
            let mm = today.getMonth();
            let currentMonth = mm + 1;
            let yyyy = today.getFullYear();
            let currentYear = today.getFullYear();
            if (mm == 0) {
                mm = 12;
                yyyy = yyyy - 1;
            }
            // get last month teachers rank data and insert into current month
            let lastMonthTeachersRankData = await Teacherrank.find({
                month: mm,
                year: yyyy,
            });
            if (lastMonthTeachersRankData.length > 0) {
                for (let i = 0; i < lastMonthTeachersRankData.length; i++) {
                    grandTotal = lastMonthTeachersRankData[i].grandTotal;
                    userId = lastMonthTeachersRankData[i].user;
                    districtId = lastMonthTeachersRankData[i].district;
                    month = lastMonthTeachersRankData[i].month;
                    year = lastMonthTeachersRankData[i].year;
                    noOfUsers = lastMonthTeachersRankData.length;
                    rank = ((i + 1) / noOfUsers) * 100;
                    
                    await Teacherrank.deleteMany({user: userId, month: currentMonth, year: currentYear})
                    
                    let TeacherRankObj = new Teacherrank({
                        user: userId,
                        district: districtId,
                        updatedDate: new Date(),
                        rank: rank,
                        newindex: i + 1,
                        grandTotal: grandTotal,
                        month: currentMonth,
                        year: currentYear,
                    });
                    await TeacherRankObj.save(TeacherRankObj);
                }
            }

            // get last month parents rank data and insert into current month
            let lastMonthParentsRankData = await Parentrank.find({
                month: mm,
                year: yyyy,
            });

            if (lastMonthParentsRankData.length > 0) {
                for (let i = 0; i < lastMonthParentsRankData.length; i++) {
                    grandTotal = lastMonthParentsRankData[i].grandTotal;
                    userId = lastMonthParentsRankData[i].user;
                    districtId = lastMonthParentsRankData[i].district;
                    month = lastMonthParentsRankData[i].month;
                    year = lastMonthParentsRankData[i].year;
                    noOfUsers = lastMonthParentsRankData.length;
                    rank = ((i + 1) / noOfUsers) * 100;

                    await Parentrank.deleteMany({user: userId, month: currentMonth, year: currentYear})
                    
                    let ParentRankObj = new Parentrank({
                        user: userId,
                        district: districtId,
                        updatedDate: new Date(),
                        rank: rank,
                        newindex: i + 1,
                        grandTotal: grandTotal,
                        month: currentMonth,
                        year: currentYear,
                    });
                    await ParentRankObj.save(ParentRankObj);
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    // Run this cron every night to calculate user rank in district
    calculateTeacherRank: async function () {
        try {
            let allDistricts = await District.find();
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            // if (mm == 1 && todaysDate == 1) { // month is January
            // 	mm = 12;
            // 	yyyy = yyyy - 1;
            // }
            // else if (mm > 1 && todaysDate == 1) {
            // 	mm = mm - 1;
            // }

            if (allDistricts.length > 0) {
                // await Teacherrank.deleteMany({
                // 	month: mm,
                // 	year: yyyy
                // });

                let getSessionData = await this.getSessionData(yyyy, mm, "");
                getSessionData.usertype = "govt teacher";

                // Save district wise data
                for (let i = 0; i < allDistricts.length; i++) {
                    getSessionData.district = allDistricts[i]._id;

                    let totalTeachers = await Topteachers.aggregate([
                        {
                            $match: getSessionData,
                        },
                        {
                            $group: {
                                _id: { user: "$user" },
                            },
                        },
                        {
                            $count: "totalCount",
                        },
                    ]);
                    if (totalTeachers.length > 0) {
                        totalCount = totalTeachers[0].totalCount;

                        dbTopTeachers = await Topteachers.aggregate([
                            {
                                $match: getSessionData,
                            },
                            {
                                $group: {
                                    _id: { user: "$user" },
                                    total: { $sum: "$total" },
                                    data: { $first: "$$ROOT" },
                                },
                            },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "_id.user",
                                    foreignField: "_id",
                                    as: "usersbase",
                                },
                            },
                            {
                                $unwind: "$usersbase",
                            },
                            {
                                $sort: {
                                    total: -1,
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    user: "$_id.user",
                                    grandTotal: "$total",
                                    district: allDistricts[i]._id,
                                    updatedDate: new Date(),
                                    rank: 1,
                                    month: "$data.month",
                                    year: "$data.year",
                                },
                            },
                        ]);
                        if (dbTopTeachers.length > 0) {
                            let grandTotal = 0;

                            for (let l = 0; l < dbTopTeachers.length; l++) {
                                grandTotal = dbTopTeachers[l].grandTotal;
                                userId = dbTopTeachers[l].user;
                                districtId = dbTopTeachers[l].district;
                                month = dbTopTeachers[l].month;
                                year = dbTopTeachers[l].year;
                                noOfUsers = dbTopTeachers.length;
                                rank = ((l + 1) / noOfUsers) * 100;

                                // let TeacherRankObj = new Teacherrank({
                                // 	user: userId,
                                // 	district: districtId,
                                // 	updatedDate: new Date(),
                                // 	rank: rank,
                                // 	newindex: (l + 1),
                                // 	grandTotal: grandTotal,
                                // 	month: month,
                                // 	year: year
                                // });
                                //await TeacherRankObj.save(TeacherRankObj);

                                await Teacherrank.updateOne(
                                    {
                                        user: userId,
                                        district: districtId,
                                        month: month,
                                        year: year,
                                    },
                                    {
                                        $set: {
                                            user: userId,
                                            district: districtId,
                                            updatedDate: new Date(),
                                            rank: rank,
                                            newindex: l + 1,
                                            grandTotal: grandTotal,
                                            month: month,
                                            year: year,
                                        },
                                    },
                                    { upsert: true }
                                );
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    // Run this cron every night to calculate user rank in district
    calculateParentRank: async function () {
        try {
            let allDistricts = await District.find();
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            if (allDistricts.length > 0) {
                // Delete all data from userranks collection
                // await Parentrank.deleteMany({
                // 	month: mm,
                // 	year: yyyy
                // });

                let getSessionData = await this.getSessionData(yyyy, mm, "");
                getSessionData.usertype = {
                    $in: ["parent", "govt administrator", "private educator"],
                };

                // Save district wise data
                for (let i = 0; i < allDistricts.length; i++) {
                    getSessionData.district = allDistricts[i]._id;

                    let totalParents = await Topteachers.aggregate([
                        {
                            $match: getSessionData,
                        },
                        {
                            $group: {
                                _id: { user: "$user" },
                            },
                        },
                        {
                            $count: "totalCount",
                        },
                    ]);
                    if (totalParents.length > 0) {
                        totalCount = totalParents[0].totalCount;

                        dbTopParents = await Topteachers.aggregate([
                            {
                                $match: getSessionData,
                            },
                            {
                                $group: {
                                    _id: { user: "$user" },
                                    total: { $sum: "$total" },
                                    data: { $first: "$$ROOT" },
                                },
                            },
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "_id.user",
                                    foreignField: "_id",
                                    as: "usersbase",
                                },
                            },
                            {
                                $unwind: "$usersbase",
                            },
                            {
                                $sort: {
                                    total: -1,
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    user: "$_id.user",
                                    grandTotal: "$total",
                                    district: allDistricts[i]._id,
                                    updatedDate: new Date(),
                                    rank: 1,
                                    month: "$data.month",
                                    year: "$data.year",
                                },
                            },
                        ]);
                        if (dbTopParents.length > 0) {
                            let grandTotal = 0;

                            for (let l = 0; l < dbTopParents.length; l++) {
                                grandTotal = dbTopParents[l].grandTotal;
                                userId = dbTopParents[l].user;
                                districtId = dbTopParents[l].district;
                                month = dbTopParents[l].month;
                                year = dbTopParents[l].year;
                                noOfUsers = dbTopParents.length;
                                rank = ((l + 1) / noOfUsers) * 100;

                                await Parentrank.updateOne(
                                    {
                                        user: userId,
                                        district: districtId,
                                        month: month,
                                        year: year,
                                    },
                                    {
                                        $set: {
                                            user: userId,
                                            district: districtId,
                                            updatedDate: new Date(),
                                            rank: rank,
                                            newindex: l + 1,
                                            grandTotal: grandTotal,
                                            month: month,
                                            year: year,
                                        },
                                    },
                                    { upsert: true }
                                );
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculatesssTeacherRank: async function () {
        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            await TeachersssRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        sssTotal: { $sum: "$sss" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        sssTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        sssTotal: -1,
                    },
                },
            ]);
            if (sparkleDataWithDistrict.length > 0) {
                let sssTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let sssRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            sssTotal = districtUsers[j].sssTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            sssRank = ((j + 1) / noOfUsers) * 100;

                            let TeachersssRankObj = new TeachersssRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                sssindex: j + 1,
                                sssTotal: sssTotal,
                                sssRank: sssRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeachersssRankObj.save(TeachersssRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculatesssParentRank: async function () {
        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await ParentsssRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        sssTotal: { $sum: "$sss" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": {
                            $in: ["parent", "govt administrator", "private educator"],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        sssTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        sssTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let sssTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let sssRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            sssTotal = districtUsers[j].sssTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            sssRank = ((j + 1) / noOfUsers) * 100;

                            let ParentsssRankObj = new ParentsssRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                sssindex: j + 1,
                                sssTotal: sssTotal,
                                sssRank: sssRank,
                                month: mm,
                                year: yyyy,
                            });
                            await ParentsssRankObj.save(ParentsssRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateBaithakLikesTeacherRank: async function () {
        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();
    
            let getSessionData = await this.getSessionData(yyyy, mm, "");
    
            await TeacherbaithaklikesRank.deleteMany({
                month: mm,
                year: yyyy,
            });
    
            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        baithaklikesTotal: { $sum: "$baithakLikes" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        baithaklikesTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        baithaklikesTotal: -1,
                    },
                },
            ]);
    
            if (sparkleDataWithDistrict.length > 0) {
                let baithaklikesTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let baithaklikesRank;
    
                let allDistricts = await District.find({}, { _id: 1 });
    
                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });
    
                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();
    
                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });
    
                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            baithaklikesTotal = districtUsers[j].baithaklikesTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            baithaklikesRank = ((j + 1) / noOfUsers) * 100;
    
                            let TeacherBaithakLikesRankObj = new TeacherbaithaklikesRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                baithaklikesindex: j + 1,
                                baithaklikesTotal: baithaklikesTotal,
                                baithaklikesRank: baithaklikesRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeacherBaithakLikesRankObj.save(TeacherBaithakLikesRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateBaithakLikesParentRank: async function () {
        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await ParentbaithaklikesRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        baithaklikesTotal: { $sum: "$baithakLikes" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": {
                            $in: ["parent", "govt administrator", "private educator"],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        baithaklikesTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        baithaklikesTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let baithaklikesTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let baithaklikesRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            baithaklikesTotal = districtUsers[j].baithaklikesTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            baithaklikesRank = ((j + 1) / noOfUsers) * 100;

                            let ParentBaithakLikesRankObj = new ParentbaithaklikesRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                baithaklikesindex: j + 1,
                                baithaklikesTotal: baithaklikesTotal,
                                baithaklikesRank: baithaklikesRank,
                                month: mm,
                                year: yyyy,
                            });
                            await ParentBaithakLikesRankObj.save(ParentBaithakLikesRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateCourseTeacherRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await TeachercourseRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        courseTotal: { $sum: "$course" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        courseTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        courseTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let courseTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let courseRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            courseTotal = districtUsers[j].courseTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            courseRank = ((j + 1) / noOfUsers) * 100;

                            let TeachercourseRankObj = new TeachercourseRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                courseindex: j + 1,
                                courseTotal: courseTotal,
                                courseRank: courseRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeachercourseRankObj.save(TeachercourseRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateCourseParentRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await ParentcourseRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        courseTotal: { $sum: "$course" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": {
                            $in: ["parent", "govt administrator", "private educator"],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        courseTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        courseTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let courseTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let courseRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            courseTotal = districtUsers[j].courseTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            courseRank = ((j + 1) / noOfUsers) * 100;

                            let ParentcourseRankObj = new ParentcourseRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                courseindex: j + 1,
                                courseTotal: courseTotal,
                                courseRank: courseRank,
                                month: mm,
                                year: yyyy,
                            });
                            await ParentcourseRankObj.save(ParentcourseRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateAssessmentTeacherRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await TeacherassessmentRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        assessmentTotal: { $sum: "$assessment" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        assessmentTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        assessmentTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let assessmentTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let assessmentRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            assessmentTotal = districtUsers[j].assessmentTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            assessmentRank = ((j + 1) / noOfUsers) * 100;

                            let TeacherassessmentRankObj = new TeacherassessmentRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                assessmentindex: j + 1,
                                assessmentTotal: assessmentTotal,
                                assessmentRank: assessmentRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeacherassessmentRankObj.save(TeacherassessmentRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateAssessmentParentRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await ParentassessmentRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        assessmentTotal: { $sum: "$assessment" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": {
                            $in: ["parent", "govt administrator", "private educator"],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        assessmentTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        assessmentTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let assessmentTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let assessmentRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            assessmentTotal = districtUsers[j].assessmentTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            assessmentRank = ((j + 1) / noOfUsers) * 100;

                            let ParentassessmentRankObj = new ParentassessmentRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                assessmentindex: j + 1,
                                assessmentTotal: assessmentTotal,
                                assessmentRank: assessmentRank,
                                month: mm,
                                year: yyyy,
                            });
                            await ParentassessmentRankObj.save(ParentassessmentRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateDigitalDiaryTeacherRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await TeacherdigitaldiaryRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        digitalDiaryTotal: { $sum: "$digitalDiary" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        digitalDiaryTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        digitalDiaryTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let digitalDiaryTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let digitalDiaryRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            digitalDiaryTotal = districtUsers[j].digitalDiaryTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            digitalDiaryRank = ((j + 1) / noOfUsers) * 100;

                            let TeacherdigitalDiaryRankObj = new TeacherdigitaldiaryRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                digitalDiaryindex: j + 1,
                                digitalDiaryTotal: digitalDiaryTotal,
                                digitalDiaryRank: digitalDiaryRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeacherdigitalDiaryRankObj.save(TeacherdigitalDiaryRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateBonusTeacherRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await TeacherbonusRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        bonusTotal: {
                            $sum: { $add: ["$training", "$sparkvisit", "$survey"] },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        bonusTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        bonusTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let bonusTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let bonusRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            bonusTotal = districtUsers[j].bonusTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            bonusRank = ((j + 1) / noOfUsers) * 100;

                            let TeacherbonusRankObj = new TeacherbonusRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                bonusindex: j + 1,
                                bonusTotal: bonusTotal,
                                bonusRank: bonusRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeacherbonusRankObj.save(TeacherbonusRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            throw e;
        }
    },
    calculateBonusParentRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await ParentbonusRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        bonusTotal: {
                            $sum: { $add: ["$training", "$sparkvisit", "$survey"] },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": {
                            $in: ["parent", "govt administrator", "private educator"],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        bonusTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        bonusTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let bonusTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let bonusRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            bonusTotal = districtUsers[j].bonusTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            bonusRank = ((j + 1) / noOfUsers) * 100;

                            let ParentbonusRankObj = new ParentbonusRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                bonusindex: j + 1,
                                bonusTotal: bonusTotal,
                                bonusRank: bonusRank,
                                month: mm,
                                year: yyyy,
                            });
                            await ParentbonusRankObj.save(ParentbonusRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    calculateSTVTeacherRank: async function () {

        try {
            let today = new Date();
            let mm = today.getMonth() + 1;
            let yyyy = today.getFullYear();

            await TeacherstvRank.deleteMany({
                month: mm,
                year: yyyy,
            });

            let getSessionData = await this.getSessionData(yyyy, mm, "");

            let sparkleDataWithDistrict = await Sparkle.aggregate([
                {
                    $match: getSessionData,
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        stvTotal: { $sum: "$stv" },
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id.user",
                        foreignField: "_id",
                        as: "districtData",
                    },
                },
                {
                    $unwind: "$districtData",
                },
                {
                    $match: {
                        "districtData.usertype": "govt teacher",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        user: "$_id.user",
                        stvTotal: 1,
                        district: "$districtData.district",
                    },
                },
                {
                    $sort: {
                        stvTotal: -1,
                    },
                },
            ]);

            if (sparkleDataWithDistrict.length > 0) {
                let stvTotal;
                let userId;
                let districtId;
                let noOfUsers;
                let stvRank;

                let allDistricts = await District.find({}, { _id: 1 });

                sparkleDataWithDistrict = sparkleDataWithDistrict.filter(function (
                    sparkle
                ) {
                    if (sparkle.district !== undefined) {
                        sparkle.district = sparkle.district.toString();
                        return sparkle;
                    }
                });

                for (i = 0; i < allDistricts.length; i++) {
                    let newdistrictId = allDistricts[i]._id.toString();

                    let districtUsers = _.where(sparkleDataWithDistrict, {
                        district: newdistrictId,
                    });

                    if (districtUsers.length > 0) {
                        for (let j = 0; j < districtUsers.length; j++) {
                            stvTotal = districtUsers[j].stvTotal;
                            userId = districtUsers[j].user;
                            districtId = districtUsers[j].district;
                            noOfUsers = districtUsers.length;
                            stvRank = ((j + 1) / noOfUsers) * 100;

                            let TeacherstvRankObj = new TeacherstvRank({
                                user: userId,
                                district: districtId,
                                updatedDate: new Date(),
                                stvindex: j + 1,
                                stvTotal: stvTotal,
                                stvRank: stvRank,
                                month: mm,
                                year: yyyy,
                            });
                            await TeacherstvRankObj.save(TeacherstvRankObj);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    getActiveUsers: async function (date) {
        try {
            let today = new Date(date);
            formatedDate = moment(date).format("DD-MM-YYYY").toString();
            //formatedDate = today.toISOString().split('T')[0].split('-').reverse().join('-');
            let userAttData = await Userattendance.distinct("user", {
                attendance_date: formatedDate,
            });
            //let userAttData = await User.distinct("_id", { phone_number: "9729518686" });
            return userAttData;
        } catch(e) {
            console.error(e);
            throw e;
        }
    },
    getMonthlyActiveTeachers: async function (year, month, state) {
      let monthlyusers = await this.getMonthlyActiveUsers(year, month);
      let query = {}
      query['_id'] = {}
      query['_id']["$in"] = monthlyusers
      query['state'] = state
      query['usertype'] = "govt teacher"
      let teachercount = await User.countDocuments(query)
      return ""
    },
    getMonthlyActiveUsers: async function (year, month) {
        try {
            querysearch = {};
            if (month < 10) {
                month = "0" + month;
            }
            yearmonth = "-" + month + "-" + year;
            querysearch["attendance_date"] = new RegExp(yearmonth + "$", "i");
    
            let userAttData = await Userattendance.distinct("user", querysearch);
            return userAttData;
        } catch(e) {
            console.error(e);
            throw e;
        }
    },
    getSessionData: async function (startYear, endMonth, userId) {
        try {
            let query = {};
            let queryCurrent = {};
            let queryNext = {};
            let queryCurrentYear = {};
            let queryNextYear = {};
            let sessionEndYear;
            let sessionStartYear;
            let startMonths = [];
            let endMonths = [];
            let today = new Date();
            let sessionStartMonth = config.session_start_month;
            let currentMonth = endMonth != "" ? today.getMonth() + 1 : endMonth;
            sessionEndYear = today.getFullYear();
            sessionStartYear = today.getFullYear() - 1;
    
            if (endMonth < sessionStartMonth) {
                // session_start_month = 6
                startYear = startYear - 1;
            }
    
            if (endMonth >= sessionStartMonth) {
                for (let j = sessionStartMonth; j <= endMonth; j++) {
                    endMonths.push(j);
                }
            } else {
                for (let j = sessionStartMonth; j <= 12; j++) {
                    endMonths.push(j);
                }
                for (let i = 1; i <= endMonth; i++) {
                    startMonths.push(i);
                }
            }
    
            if (currentMonth >= sessionStartMonth) {
                sessionEndYear = today.getFullYear() + 1;
                sessionStartYear = today.getFullYear();
            }
            if (startYear != "") {
                sessionStartYear = startYear;
                sessionEndYear = startYear + 1;
            }
    
            if (userId != "") {
                query["user"] = userId;
            }
    
            if (endMonth < sessionStartMonth) {
                query["$or"] = [];
                queryCurrent["$and"] = [];
                queryNext["$and"] = [];
    
                queryNextYear["year"] = sessionStartYear;
                queryNextYear["month"] = { $in: endMonths };
                queryNext["$and"].push(queryNextYear);
                query["$or"].push(queryNext);
    
                queryCurrentYear["year"] = sessionEndYear;
                queryCurrentYear["month"] = { $in: startMonths };
                queryCurrent["$and"].push(queryCurrentYear);
    
                query["$or"].push(queryCurrent);
            } else {
                query["year"] = sessionStartYear;
                query["month"] = { $in: endMonths };
            }
            return query;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    topTeachers: async function (todayDate, period) {
        try {
            let endTime = new Date();
            let startTime = new Date();
    
            if (todayDate != "") {
                endTime = new Date(todayDate);
                startTime = new Date(todayDate);
            }
    
            if (period == "month") {
                startTime.setDate(0);
                //today.setDate(1);
                endTime.setDate(endTime.getDate());
            } else {
                //day
                startTime.setDate(startTime.getDate() - 2);
                endTime.setDate(endTime.getDate() - 1);
            }
            const startOfDay = new Date(
                startTime.setUTCHours(18, 30, 0, 0)
            ).toISOString();
            const endOfDay = new Date(endTime.setUTCHours(18, 30, 0, 0)).toISOString();
    
            let msg = "start date 1 : " + startOfDay + " ; end date : " + endOfDay;
    
            let fromDateObject = new Date(startOfDay);
            let monthIndex = fromDateObject.getMonth();
            monthIndex = monthIndex + 1;
    
            let fullYear = fromDateObject.getFullYear();
    
            let activeUsers = [];
            if (period == "month") {
                activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
            } else {
                activeUsers = await this.getActiveUsers(startOfDay);
            }
    
            let userSparkles = await Sparkle.aggregate([
                {
                    $match: {
                        year: parseInt(fullYear),
                        month: parseInt(monthIndex),
                        user: {
                            $in: activeUsers,
                        },
                    },
                },
                // {
                // 	$match: query
                // },
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "usersbase",
                    },
                },
                { $unwind: "$usersbase" },
                {
                    $project: {
                        _id: 0,
                        user: 1,
                        total: 1,
                        year: 1,
                        month: 1,
                        "usersbase.state": 1,
                        "usersbase.district": 1,
                        "usersbase.block": 1,
                        "usersbase.diseCode": 1,
                        "usersbase.fullName": 1,
                        "usersbase.usertype": 1,
                        "usersbase.image": 1,
                    },
                },
            ]);
    
            //Insert each user
            for (const userSparkle of userSparkles) {
                let userId = userSparkle.user;
                let total = userSparkle.total;
                let year = userSparkle.year;
                let month = userSparkle.month;
                let state = userSparkle.usersbase.state;
                let district = userSparkle.usersbase.district;
                let block = userSparkle.usersbase.block;
                let diseCode = userSparkle.usersbase.diseCode;
                let fullName = userSparkle.usersbase.fullName;
                let usertype = userSparkle.usersbase.usertype;
                let image = userSparkle.usersbase.image;
                let ytdTotal = 0;
    
                let getSessionData = await this.getSessionData(year, month, userId);
    
                dbTopTeachers = await Topteachers.aggregate([
                    {
                        $match: getSessionData,
                    },
                    {
                        $group: {
                            _id: { user: "$user" },
                            total: { $sum: "$total" },
                        },
                    },
                ]);
    
                if (dbTopTeachers.length > 0) {
                    ytdTotal = dbTopTeachers[0].total;
                }
    
                //To check if user is already there
                let topTeacherData = await Topteachers.find({
                    user: new objectId(userId),
                    year: year,
                    month: month,
                });
    
                if (topTeacherData && topTeacherData.length) {
                    //Update Sparkle points
                    topTeacherData[0]["ytd_total"] =
                        ytdTotal - topTeacherData[0].total + total;
                    topTeacherData[0]["total"] = total;
                    topTeacherData[0]["updatedDate"] = new Date();
                    let topTeacherObj = new Topteachers(topTeacherData[0]);
                    await topTeacherObj.save();
                } else {
                    let topTeacher = new Topteachers({
                        user: new objectId(userId),
                        total: total,
                        year: year,
                        month: month,
                        fullName: fullName,
                        usertype: usertype,
                        state: state,
                        district: district,
                        block: block,
                        diseCode: diseCode,
                        image: image,
                        ytd_total: ytdTotal + total,
                    });
                    await topTeacher.save();
                }
            }
    
            await this.calculateTeacherRank();
            await this.calculateParentRank();
    
            await this.calculatesssTeacherRank();
            await this.calculatesssParentRank();
    
            await this.calculateBaithakLikesTeacherRank();
            await this.calculateBaithakLikesParentRank();
    
            await this.calculateCourseTeacherRank();
            await this.calculateCourseParentRank();
    
            await this.calculateAssessmentTeacherRank();
            await this.calculateAssessmentParentRank();
    
            await this.calculateDigitalDiaryTeacherRank();
    
            await this.calculateBonusTeacherRank();
            await this.calculateBonusParentRank();
    
            await this.calculateSTVTeacherRank();
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    validateTopTeachers: async function (month, year) {
        let teachers = await Topteachers.distinct("user");

        let topTeachers = [];
        for (j = 0; j < teachers.length; j++) {
            let topTeacher = {};
            topTeacher.id = teachers[j];
            topTeacher.total = 0;
            topTeacher.ytd_total = 0;
            let users = await Topteachers.find({ user: teachers[j] }).sort({
                year: 1,
                month: 1,
            });
            for (k = 0; k < users.length; k++) {
                topTeacher.total = users[k].total + topTeacher.total;
                topTeacher.ytd_total = users[k].ytd_total;
            }
            if (topTeacher.total != topTeacher.ytd_total) {
                topTeachers.push(topTeacher);
                if (j == 5) {
                    return;
                }
            }
        }
    },
    topSSSBadges: async function () {

        //To get last month and year
        let today = new Date();
        today.setMonth(today.getMonth() - 1);

        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();

        let userAttendanceStates = await Userattendance.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$createdDate" }, mm] },
                            { $eq: [{ $year: "$createdDate" }, yyyy] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    sssHours: { $sum: "$sss_hours" },
                },
            },
            { $sort: { sssHours: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.user",
                    foreignField: "_id",
                    as: "usersbase",
                },
            },
            { $unwind: "$usersbase" },
            {
                $group: {
                    _id: { state: "$usersbase.state" },
                    maxSSSHours: { $max: "$sssHours" },
                    data: { $first: "$$ROOT" },
                },
            },
            {
                $project: {
                    uid: "$data.usersbase._id",
                    sid: "$_id.state",
                    maxSSSHours: 1,
                    _id: 0,
                },
            },
        ]);

        //Insert a badge for each user
        for (const userAttendanceState of userAttendanceStates) {
            let userId = userAttendanceState.uid;
            let maxSSSHours = userAttendanceState.maxSSSHours;

            let cday = new Date();
            let cmm = cday.getMonth() + 1;
            let yyyy = cday.getFullYear();

            //To check if badge is already inserted for this month
            let silverBadgesCnt = await Userbadge.countDocuments({
                user: new objectId(userId),
                badge: "silver",
                type: "topsss",
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$createdDate" }, cmm] },
                        { $eq: [{ $year: "$createdDate" }, yyyy] },
                    ],
                },
            });

            //if badge is not inserted, insert
            if (!silverBadgesCnt && maxSSSHours) {
                let today = new Date();
                let expiryDate = new Date(
                    today.setDate(
                        today.getDate() + parseInt(config.badge_available_for_days)
                    )
                );
                let silverBadge = new Userbadge({
                    user: new objectId(userId),
                    badge: "silver",
                    type: "topsss",
                    expiryDate: expiryDate,
                });
                await silverBadge.save();
            }
        }
    },
    topBaithakBadges: async function () {

        //To get last month and year
        let today = new Date();
        today.setMonth(today.getMonth() - 1);

        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();

        let userAttendanceStates = await Userattendance.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$createdDate" }, mm] },
                            { $eq: [{ $year: "$createdDate" }, yyyy] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    socialHours: { $sum: "$social_hours" },
                },
            },
            { $sort: { socialHours: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.user",
                    foreignField: "_id",
                    as: "usersbase",
                },
            },
            { $unwind: "$usersbase" },
            {
                $group: {
                    _id: { state: "$usersbase.state" },
                    maxBaithakHours: { $max: "$socialHours" },
                    data: { $first: "$$ROOT" },
                },
            },
            {
                $project: {
                    uid: "$data.usersbase._id",
                    sid: "$_id.state",
                    maxBaithakHours: 1,
                    _id: 0,
                },
            },
        ]);

        //Insert a badge for each user
        for (const userAttendanceState of userAttendanceStates) {
            let userId = userAttendanceState.uid;
            let maxBaithakHours = userAttendanceState.maxBaithakHours;

            let cday = new Date();
            let cmm = cday.getMonth() + 1;
            let yyyy = cday.getFullYear();

            //To check if badge is already inserted for this month
            let brownBadgesCnt = await Userbadge.countDocuments({
                user: new objectId(userId),
                badge: "bronze",
                type: "topbaithak",
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$createdDate" }, cmm] },
                        { $eq: [{ $year: "$createdDate" }, yyyy] },
                    ],
                },
            });

            //if badge is not inserted, insert
            if (!brownBadgesCnt && maxBaithakHours) {
                let today = new Date();
                let expiryDate = new Date(
                    today.setDate(
                        today.getDate() + parseInt(config.badge_available_for_days)
                    )
                );
                let brownBadge = new Userbadge({
                    user: new objectId(userId),
                    badge: "bronze",
                    type: "topbaithak",
                    expiryDate: expiryDate,
                });
                await brownBadge.save();
            }
        }
    },
    topOverallBadges: async function () {

        //To get last month and year
        let today = new Date();
        today.setMonth(today.getMonth() - 1);

        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();

        let userAttendanceStates = await Userattendance.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $month: "$createdDate" }, mm] },
                            { $eq: [{ $year: "$createdDate" }, yyyy] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    overAllHours: { $sum: { $add: ["$sss_hours", "$social_hours"] } },
                },
            },
            { $sort: { overAllHours: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.user",
                    foreignField: "_id",
                    as: "usersbase",
                },
            },
            { $unwind: "$usersbase" },
            {
                $group: {
                    _id: { state: "$usersbase.state" },
                    maxOverallHours: { $max: "$overAllHours" },
                    data: { $first: "$$ROOT" },
                },
            },
            {
                $project: {
                    uid: "$data.usersbase._id",
                    sid: "$_id.state",
                    maxOverallHours: 1,
                    _id: 0,
                },
            },
        ]);

        //Insert a badge for each user
        for (const userAttendanceState of userAttendanceStates) {
            let userId = userAttendanceState.uid;
            let maxOverallHours = userAttendanceState.maxOverallHours;

            let cday = new Date();
            let cmm = cday.getMonth() + 1;
            let yyyy = cday.getFullYear();

            //To check if badge is already inserted for this month
            let goldBadgesCnt = await Userbadge.countDocuments({
                user: new objectId(userId),
                badge: "gold",
                type: "topoverall",
                $expr: {
                    $and: [
                        { $eq: [{ $month: "$createdDate" }, cmm] },
                        { $eq: [{ $year: "$createdDate" }, yyyy] },
                    ],
                },
            });

            //if badge is not inserted, insert
            if (!goldBadgesCnt && maxOverallHours) {
                let today = new Date();
                let expiryDate = new Date(
                    today.setDate(
                        today.getDate() + parseInt(config.badge_available_for_days)
                    )
                );
                let goldBadge = new Userbadge({
                    user: new objectId(userId),
                    badge: "gold",
                    type: "topoverall",
                    expiryDate: expiryDate,
                });
                await goldBadge.save();
            }
        }
    },
    dataArchive: async function () {

        let checkingDate = new Date();
        checkingDate.setMonth(checkingDate.getMonth() - 3);

        //This is for notifications collection archiving
        query["createdDate"] = { $lte: checkingDate };

        notifications = await Notification.find(query);

        notificationsCopied = await Notification.aggregate([
            { $match: { createdDate: { $lte: checkingDate } } },
            { $out: "notifications_bkp" },
        ]);

        //await Notification.deleteMany(query);

        //This is for streams related collections archiving
        queryStreams["publishDate"] = { $lte: checkingDate };
        queryStreams["is_sampark_didi_post"] = false;
        queryStreams["is_podcast_post"] = false;

        const dbStreams = await Stream.find(queryStreams);
        let arrTextIds = [];
        let arrImageIds = [];
        let arrVideoIds = [];

        //Loop through streams
        if (dbStreams && dbStreams.length) {
            for (let index = 0; index < dbStreams.length; index++) {
                const element = dbStreams[index];
                let dbItemId = element.item_id;
                if (element.item_type == "text") arrTextIds.push(dbItemId);
                else if (element.item_type == "image") arrImageIds.push(dbItemId);
                else if (element.item_type == "video") arrVideoIds.push(dbItemId);
            }

            textstreamsCopied = await Textstream.aggregate([
                { $match: { _id: { $in: arrTextIds } } },
                { $out: "textstreams_bkp" },
            ]);
            //await Textstream.deleteMany({_id: { $in: arrTextIds } });

            textlikesCopied = await Textlike.aggregate([
                { $match: { text: { $in: arrTextIds } } },
                { $out: "textlikes_bkp" },
            ]);
            //await Textlike.deleteMany({_id: { $in: arrTextIds } });

            textcommentsCopied = await Textcomment.aggregate([
                { $match: { text: { $in: arrTextIds } } },
                { $out: "textcomments_bkp" },
            ]);
            //await Textcomment.deleteMany({_id: { $in: arrTextIds } });

            imagestreamsCopied = await Imagestream.aggregate([
                { $match: { _id: { $in: arrImageIds } } },
                { $out: "imagestreams_bkp" },
            ]);
            //await Imagestream.deleteMany({_id: { $in: arrImageIds } });

            imagelikesCopied = await Imagelike.aggregate([
                { $match: { image: { $in: arrImageIds } } },
                { $out: "imagelikes_bkp" },
            ]);
            //await Imagelike.deleteMany({_id: { $in: arrImageIds } });

            imagecommentsCopied = await Imagecomment.aggregate([
                { $match: { image: { $in: arrImageIds } } },
                { $out: "imagecomments_bkp" },
            ]);
            //await Imagecomment.deleteMany({_id: { $in: arrImageIds } });

            videostreamsCopied = await Videostream.aggregate([
                { $match: { _id: { $in: arrVideoIds } } },
                { $out: "videostreams_bkp" },
            ]);
            //await Videostream.deleteMany({_id: { $in: arrVideoIds } });

            videolikesCopied = await Videolike.aggregate([
                { $match: { video: { $in: arrVideoIds } } },
                { $out: "videolikes_bkp" },
            ]);
            //await Videolike.deleteMany({_id: { $in: arrVideoIds } });

            videocommentsCopied = await Videocomment.aggregate([
                { $match: { video: { $in: arrVideoIds } } },
                { $out: "videocomments_bkp" },
            ]);
            //await Videocomment.deleteMany({_id: { $in: arrVideoIds } });
        }

        streamsCopied = await Stream.aggregate([
            {
                $match: {
                    publishDate: { $lte: checkingDate },
                    is_sampark_didi_post: false,
                    is_podcast_post: false,
                },
            },
            { $out: "streams_bkp" },
        ]);
        //await Stream.deleteMany(queryStreams);

        //This is for assessments related collections archiving
        queryAssessments["isActive"] = false;

        const dbAssessments = await Assessment.find(queryAssessments);
        let arrAssessIds = [];

        //Loop through assessments
        if (dbAssessments && dbAssessments.length) {
            for (let index = 0; index < dbAssessments.length; index++) {
                const element = dbAssessments[index];
                let dbAssessId = element._id;
                arrAssessIds.push(dbAssessId);
            }

            assessQuestionsCopied = await AssessmentQuestion.aggregate([
                { $match: { assessment: { $in: arrAssessIds } } },
                { $out: "assessmentquestions_bkp" },
            ]);
            //await AssessmentQuestion.deleteMany({assessment: { $in: arrAssessIds } });

            assessProgressesCopied = await AssessmentStudentProgress.aggregate([
                { $match: { assessment: { $in: arrAssessIds } } },
                { $out: "assessmentstudentprogresses_bkp" },
            ]);
            //await AssessmentStudentProgress.deleteMany({assessment: { $in: arrAssessIds } });
        }

        assessmentsCopied = await Assessment.aggregate([
            { $match: { isActive: false } },
            { $out: "assessments_bkp" },
        ]);
        //await Assessment.deleteMany(queryAssessments);
    },
    scheduleDeactivateUserVideos: async function () {
        let dateBefore30Days = new Date();
        let currentDate = new Date(); // Current date of Scheduler
        dateBefore30Days.setDate(
            dateBefore30Days.getDate() - config.video_deactivation_time_in_days
        );

        let streamQuery = {};
        streamQuery["item_type"] = "video";
        streamQuery["is_active"] = true;
        streamQuery["is_sampark_didi_post"] = false;
        streamQuery["publishDate"] = {};
        streamQuery["publishDate"]["$lt"] = dateBefore30Days;
        let streams = await Stream.find(streamQuery, { item_id: 1 });
        let streamIdArray = [];
        for (const curStream of streams) {
            streamIdArray.push(curStream["id"]);
            let youtube_code = await Videostream.findById(curStream.item_id, {
                youtube_code: 1,
            });
            // await this.deleteOnYouTube(youtube_code.youtube_code).then((response) => {
            //   const videoDeactivation = new VideoDeactivationHistory({ stream_id: curStream['id'], youtube_code: youtube_code.youtube_code, scheduler_datetime: currentDate, message: response.status });
            //   videoDeactivation.save();
            // }).catch((error) => {
            //   const videoDeactivation = new VideoDeactivationHistory({ stream_id: curStream['id'], youtube_code: youtube_code.youtube_code, scheduler_datetime: currentDate, message: error.response.status });
            //   videoDeactivation.save();
            // })
        }
        // if (streamIdArray.length > -1)
        //   await Stream.updateMany({ "_id": { "$in": streamIdArray } }, { "$set": { "is_active": false } });
    },
    deleteOnYouTube: async function (youtube_code) {
        let deferred = q.defer();
        try {
            let clientSecret = fs.readFileSync(config.client_secret_file);
            let auth = await authorize(JSON.parse(clientSecret));
            let uploadResult = await deleteVideoOnYouTube(auth, youtube_code);
            deferred.resolve(uploadResult);
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    },
    //To update db stream object according to action
    update_post_action: function (stream, action, actionBy) {
        var updatedAt = new Date();
        updateParam = {};

        //updateParam['is_active'] = false;

        if (action == "delete") {
            updateParam["is_deleted"] = true;
            updateParam["updatedDate"] = updatedAt;
        } else if (action == "hidden") {
            updateParam["is_hidden"] = true;
            updateParam["hidden_by"] = actionBy;
            updateParam["updatedDate"] = updatedAt;
        } else if (action == "reportabuse") {
            var existingArr = stream.reportabused_by;
            if (existingArr.length) {
                existingArr.push(actionBy);
                updateParam["reportabused_by"] = existingArr;
            } else {
                abuseArr = [];
                abuseArr.push(actionBy);
                updateParam["reportabused_by"] = abuseArr;
            }

            updateParam["is_report_abused"] = true;
            updateParam["updatedDate"] = updatedAt;
        } else {
            throw "Posted action not found.";
        }

        Object.assign(stream, updateParam);

        // save stream
        stream.save();
    },

    badge_allocation: async function (user, badge) {
        if (badge == "full-attendance") {
            var today = new Date();
            var lastweekstart = new Date();
            var attendance_dates = [];
            for (i = 0; i <= 6; i++) {
                var dd = lastweekstart.getDate();
                var mm = lastweekstart.getMonth() + 1;
                var yyyy = lastweekstart.getFullYear();
                if (dd < 10) {
                    dd = "0" + dd;
                }

                if (mm < 10) {
                    mm = "0" + mm;
                }
                attendance_date = dd + "-" + mm + "-" + yyyy;

                attendance_dates.push(attendance_date);
                lastweekstart = new Date(
                    lastweekstart.setDate(lastweekstart.getDate() - 1)
                );
            }
            userid = require("mongodb").ObjectID(user);
            var query_att = {};
            query_att["user"] = require("mongodb").ObjectID(user);
            query_att["attendance_date"] = {};
            query_att["attendance_date"]["$in"] = attendance_dates;
            user_attendances = await Userattendance.find(query_att);
            if (user_attendances.length == 7) {
                check_user_badge = await Userbadge({ user: user, badge: badge });
                expiry_date = new Date(
                    today.setDate(
                        today.getDate() + parseInt(config.badge_available_for_days)
                    )
                );
                //        expiry_date.setHours(23,59,59,999);
                if (check_user_badge.length == 1) {
                    userBadgeUpdate = {};
                    userBadgeUpdate["expiryDate"] = expiry_date;
                    Object.assign(check_user_badge, userBadgeUpdate);
                    check_user_badge.save();
                } else {
                    user_badge = new Userbadge({
                        user: user,
                        badge: badge,
                        expiryDate: expiry_date,
                    });
                    user_badge.save();
                }
            }
        }
    },

    update_user_points: function (user, points, video, duration) {
        User.find({ _id: user })
            .select("-hash")
            .then((res) => {
                if (res.length == 1) {
                    check_user = res[0];

                    userParam = {};
                    var update_status = false;
                    if (points > 0) {
                        userParam["total_points"] = check_user.total_points + points;
                        if (userParam["total_points"] >= 2000) {
                            userParam["badge"] = 1;
                        }
                        if (userParam["total_points"] >= 5000) {
                            userParam["badge"] = 2;
                        }
                        if (userParam["total_points"] >= 7500) {
                            userParam["badge"] = 3;
                        }
                        if (userParam["total_points"] >= 10000) {
                            var remaining_points = userParam["total_points"] - 7500;
                            var badge = 3 + parseInt(remaining_points / 2500);
                            userParam["badge"] = badge;
                        }
                        update_status = true;
                    }

                    if (video && video.module == "sss" && duration) {
                        userParam["sss_hours"] = check_user.sss_hours + duration;
                        update_status = true;

                        var today = new Date();
                        var dd = today.getDate();

                        var mm = today.getMonth() + 1;
                        var yyyy = today.getFullYear();
                        if (dd < 10) {
                            dd = "0" + dd;
                        }

                        if (mm < 10) {
                            mm = "0" + mm;
                        }
                        today = dd + "-" + mm + "-" + yyyy;
                        Userattendance.find({ user: check_user.id, attendance_date: today })
                            .select("-hash")
                            .then((res1) => {
                                if (res1.length == 1) {
                                    checkattendance = res1[0];
                                    userAParam = {};
                                    userAParam["sss_hours"] =
                                        checkattendance.sss_hours + duration;
                                    Object.assign(checkattendance, userAParam);
                                    checkattendance.save();
                                }
                            });
                    }
                    // copy userParam properties to user
                    if (update_status == true) {
                        Object.assign(check_user, userParam);

                        // save video
                        check_user.save();
                    }
                }
            });
    },

    uploadOnYouTube: async function (videoFile, fileName, description) {
        let deferred = q.defer();

        try {
            let clientSecret = fs.readFileSync(config.client_secret_file);
            let auth = await authorize(JSON.parse(clientSecret));
            let uploadResult = await uploadVideoOnYouTube(
                auth,
                videoFile,
                fileName,
                description
            );

            deferred.resolve(uploadResult);
        } catch (error) {
            deferred.reject();
        }

        return deferred.promise;

        // fs.readFile("client_secret.json", function processClientSecrets(err, content) {
        //   if (err) {
        //     return;
        //   }
        //   // Authorize a client with the loaded credentials, then call the YouTube API.
        //   authorize(JSON.parse(content), uploadVideoOnYouTube, videoFile, fileName, description);
        // });
    },
    /*
      This function is to save reward point against student & calculate rewards gift
      */
    savePointsAndCalculateReward: async function (
        studentId,
        userId,
        newPoints,
        module
    ) {
        let deferred = q.defer();
        try {
            let userObj = {};
            let studentObj = {};
            if (module == "assessment") {
                studentObj = await Student.findById(studentId);
                if (studentObj) {
                    userObj = await User.find({ phone_number: studentObj.parentMobile });
                    if (userObj.length > 0) userObj = userObj[0];
                }
            } else if (module == "eLearning") {
                userObj = await User.findById(userId);
            }

            if (userObj && Object.keys(userObj).length > 0) {
                let totalPointsEarned = userObj.totalPointsEarned;
                let nextRewardMileStone = userObj.nextRewardMileStone;

                totalPointsEarned =
                    Number.parseInt(totalPointsEarned) + Number.parseInt(newPoints);

                if (totalPointsEarned >= nextRewardMileStone) {
                    // Set new milestone below for this student
                    nextRewardMileStone = nextRewardMileStone + 100;
                    userObj.nextRewardMileStone = nextRewardMileStone;
                    userObj.totalPointsEarned = totalPointsEarned;
                    await userObj.save();

                    // Get existing rewards for the user to exlude while selecting new story
                    let existingRewards = await Reward.find({ user: userObj["id"] });
                    let existingVideoStries = [];

                    if (existingRewards.length > 0) {
                        existingRewards.forEach((item) => {
                            existingVideoStries.push(item.videoStory);
                        });
                    }

                    let availableRewardList = await Videostory.find({
                        _id: {
                            $nin: existingVideoStries,
                        },
                    });

                    // If new video story is available then share it back
                    if (availableRewardList.length > 0) {
                        const rewardData = new Reward({
                            user: userObj["id"],
                            rewardsEarnedAt: totalPointsEarned,
                            videoStory: availableRewardList[0]["_id"],
                            opened: false,
                            isActive: true,
                            createdDate: new Date(),
                            modifiedDate: new Date(),
                        });

                        await rewardData.save();
                        let userReward = availableRewardList[0];

                        deferred.resolve(userReward);
                    }

                    deferred.resolve({});
                } else {
                    userObj.totalPointsEarned = totalPointsEarned;
                    await userObj.save();
                    let userReward = {};
                    deferred.resolve(userReward);
                }
            } else {
                let userReward = {
                    points: false,
                };
                deferred.resolve(userReward);
            }
        } catch (error) {
            deferred.reject(error);
        }
        return deferred.promise;
    },

    calculateOldSparkles: async function () {
        //June 2021
        //let count7 = await Sparkle.countDocuments({ month: 6, year: 2021 });
        //await Sparkle.deleteMany({"month":6, "year":2021})
        //await this.calculateSparkles('2021-06-30','month');

        //July 2021
        //let count8 = await Sparkle.countDocuments({ month: 7, year: 2021 });
        //await Sparkle.deleteMany({"month":7, "year":2021})
        //await this.calculateSparkles('2021-07-31','month');

        //August 2021
        //let count9 = await Sparkle.countDocuments({ month: 8, year: 2021 });
        //await Sparkle.deleteMany({"month":8, "year":2021})
        //await this.calculateSparkles('2021-08-31','month');

        //September 2021
        //let count10 = await Sparkle.countDocuments({ month: 9, year: 2021 });
        //await Sparkle.deleteMany({"month":9, "year":2021})
        //await this.calculateSparkles('2021-09-30','month');

        //let count11 = await Sparkle.countDocuments({ month: 10, year: 2021 });
        //await Sparkle.deleteMany({ "month": 10, "year": 2021 })
        //await this.calculateSparkles('2021-10-02', ''); //this will work same as everyNightCalculateSparkle, considering the passed date as today
        //await this.calculateSparkles('2021-10-03', ''); //this will work same as everyNightCalculateSparkle, considering the passed date as today
        //await this.calculateSparkles('2021-10-04', ''); //this will work same as everyNightCalculateSparkle, considering the passed date as today
        //await this.calculateSparkles('2021-10-05', '');
        //await this.calculateSparkles('2021-10-06', '');
        //await this.calculateSparkles('2021-10-07', '');
        //await this.calculateSparkles('2021-10-08', '');
        //await this.calculateSparkles('2021-10-09', '');
        //await this.calculateSparkles('2021-10-10', '');
        //await this.calculateSparkles('2021-10-11', '');
        //await this.calculateSparkles('2021-10-12', '');
        //await this.calculateSparkles('2021-10-13', '');
        await this.calculateSparkles("2022-03-02", "");
        await this.calculateSparkles("2022-03-03", "");
        await this.calculateSparkles("2022-03-04", "");
        await this.calculateSparkles("2022-03-05", "");
    },

    topTeachersOld: async function () {
        //June 2021
        //let count7 = await Topteachers.countDocuments({ month: 6, year: 2021 });
        //await Topteachers.deleteMany({"month":6, "year":2021})
        //await this.topTeachers('2021-06-30','month');

        //July 2021
        //let count8 = await Topteachers.countDocuments({ month: 7, year: 2021 });
        //await Topteachers.deleteMany({"month":7, "year":2021})
        //await this.topTeachers('2021-07-31','month');

        //August 2021
        //let count9 = await Topteachers.countDocuments({ month: 8, year: 2021 });
        //await Topteachers.deleteMany({"month":8, "year":2021})
        //await this.topTeachers('2021-08-31','month');

        //September 2021
        //let count10 = await Topteachers.countDocuments({ month: 9, year: 2021 });
        //await Topteachers.deleteMany({"month":9, "year":2021})
        //await this.topTeachers('2021-09-30','month');

        //let count11 = await Topteachers.countDocuments({ month: 10, year: 2021 });
        //await Topteachers.deleteMany({ "month": 10, "year": 2021 })
        //await this.topTeachers('2021-10-02', '');
        //await this.topTeachers('2021-10-03', '');
        //await this.topTeachers('2021-10-04', '');
        //await this.topTeachers('2021-10-05', '');
        //await this.topTeachers('2021-10-06', '');
        //await this.topTeachers('2021-10-07', '');
        //await this.topTeachers('2021-10-08', '');
        //await this.topTeachers('2021-10-09', '');
        //await this.topTeachers('2021-10-10', '');
        //await this.topTeachers('2021-10-11', '');
        //await this.topTeachers('2021-10-12', '');
        //await this.topTeachers('2021-10-13', '');
        //await this.topTeachers('2021-10-14', '');
        //await this.topTeachers('2021-10-15', '');
        //await this.topTeachers('2021-10-16', '');
        //await this.topTeachers('2021-10-17', '');
        //await this.topTeachers('2021-10-18', '');
        //await this.topTeachers("2021-10-19", "");
        //     let count11 = await Topteachers.countDocuments({ "month": 10, "year": 2021 })
        //     await Topteachers.deleteMany({ "month": 10, "year": 2021 })
        //     await this.topTeachers('2021-10-02', ''); //this will work same as everyNightCalculateSparkle, considering the passed$
        //     await this.topTeachers('2021-10-03', ''); //this will work same as everyNightCalculateSparkle, considering the passed$
        //     await this.topTeachers('2021-10-04', ''); //this will work same as everyNightCalculateSparkle, considering the passed$
        //     await this.topTeachers('2021-10-05', '');
        //     await this.topTeachers('2021-10-06', '');
        //     await this.topTeachers('2021-10-07', '');
        await this.topTeachers("2022-03-02", "");
        await this.topTeachers("2022-03-03", "");
        await this.topTeachers("2022-03-04", "");
        await this.topTeachers("2022-03-05", "");

    },

    // Below cron job functions will run every night starts
    calculateSparkles: async function (todayDate, period) {
        try {
            let endTime = new Date();
            let startTime = new Date();

            if (todayDate != "") {
                endTime = new Date(todayDate);
                startTime = new Date(todayDate);
            }

            if (period == "month") {
                startTime.setDate(0);
                //today.setDate(1);
                endTime.setDate(endTime.getDate());
            } else {
                //day
                startTime.setDate(startTime.getDate() - 1);
                endTime.setDate(endTime.getDate());
            }

            const startOfDay = new Date(startTime.setHours(00, 00, 0, 0)).toISOString();
            const endOfDay = new Date(endTime.setHours(00, 00, 0, 0)).toISOString();

            let msg = "start date 1 : " + startOfDay + " ; end date : " + endOfDay;

            //this.sendEmail('everyNightCalculateSparkle','started',msg,'')

            await this.everyNightCalculateSparkleForSSS(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForImageLikes(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForTextLikes(startOfDay, endOfDay,period);
            // await this.everyNightCalculateSparkleForVideoLikes(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForSSSVideoLikes(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForImageComments(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForTextComments(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForVideoComments(startOfDay, endOfDay, period);
            // await this.everyNightCalculateSparkleForSSSVideoComments(startOfDay, endOfDay, period);
            await this.everyNightCalculateSparkleForAssessments(startOfDay, endOfDay, period);
            await this.everyNightCalculateSparkleForElearning(startOfDay, endOfDay, period);
            await this.everyNightCalculateSparkleForDigitalDiary(startOfDay, endOfDay, period);
            await this.everyNightCalculateSparkleForPostOnBaithkFromSSS(startOfDay, endOfDay,period);
            //not required as stv points added at time of syncing
            //await this.everyNightCalculateSparkleForSTV(startOfDay, endOfDay, period);
            return "";
        } catch(e) {
            console.error(e);
            throw (e);
        }
        //this.sendEmail('everyNightCalculateSparkle','completed',msg,'')
    },

    everyNightCalculateSparkleForPostOnBaithkFromSSS: async function (fromDate, toDate, dtype) {
        // Find active users from user attendence collection for yesterday
        try {
            let toDateObject = new Date(toDate);
            let fromDateObject = new Date(fromDate);
            let monthIndex = fromDateObject.getMonth();
            monthIndex = monthIndex + 1;
            let fullYear = toDateObject.getFullYear();

            let activeUsers = [];
            if (dtype == "month") {
                activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
            } else {
                activeUsers = await this.getActiveUsers(fromDate);
            }
            
            // const baithakTextLikesSparkle
            const postFromSSSSparkles = await Textstream.aggregate([
                {
                    $match: {
                        createdDate: {
                            $gte: new Date(fromDate),
                            $lt: new Date(toDate),
                        },
                        resourceType: { 
                            $exists: true,
                            $ne: null
                        },
                        createdBy: {
                            $in: activeUsers,
                        },
                    },
                },
                {
                    $group: {
                        _id: { createdBy: "$createdBy" },
                        count: { $sum: 1 },
                    },
                },
            ]);

            for (let i = 0; i < postFromSSSSparkles.length; i++) {
                const newPostSparkle = parseInt(postFromSSSSparkles[i]["count"]) * config.sparkle_points_postFromSSS;

                if (newPostSparkle > 0) {
                    let userSparkleData = await Sparkle.find({
                        user: postFromSSSSparkles[i]["_id"]["createdBy"],
                        month: monthIndex,
                        year: fullYear,
                    });

                    if (userSparkleData && userSparkleData.length) {
                        //Update Sparkle points
                        userSparkleData[0]["postFromSSS"] = userSparkleData[0]["postFromSSS"]
                            ? parseInt(userSparkleData[0]["postFromSSS"]) + newPostSparkle
                            : newPostSparkle;
                        userSparkleData[0]["total"] = userSparkleData[0]["total"]
                            ? parseInt(userSparkleData[0]["total"]) + newPostSparkle
                            : newPostSparkle;
                        userSparkleData[0]["updatedDate"] = new Date(toDate);

                        const useSparkleObj = new Sparkle(userSparkleData[0]);

                        await useSparkleObj.save();
                    } else {
                        //Insert Sparkle points
                        const userSparkleObj = new Sparkle({
                            user: new objectId(postFromSSSSparkles[i]["_id"]["createdBy"]),
                            postFromSSS: newPostSparkle,
                            total: newPostSparkle,
                            updatedDate: new Date(toDate),
                            month: monthIndex,
                            year: fullYear,
                        });
                        await userSparkleObj.save();
                    }
                }
            }
        } catch (e) {
            throw e;
        }
    },

    everyNightCalculateSparkleForSSS: async function (fromDate, toDate, dtype) {
        try {
            let toDateObject = new Date(toDate);
            let fromDateObject = new Date(fromDate);
            let monthIndex = fromDateObject.getMonth();
    
            monthIndex = monthIndex + 1;
    
            let fullYear = toDateObject.getFullYear();
    
            let sssSparkleArray = await Userattendance.aggregate([
                {
                    $match: {
                        createdDate: {
                            $gte: new Date(fromDate),
                            $lt: new Date(toDate),
                        },
                    },
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        sssHours: { $sum: "$sss_hours" },
                    },
                },
            ]);
            //return "COUNTSCHECK";
            for (let i = 0; i < sssSparkleArray.length; i++) {
                let sssHours = sssSparkleArray[i]["sssHours"]
                    ? parseInt(sssSparkleArray[i]["sssHours"] / 60)
                    : 0;
                let sssSparkle = sssHours * config.sparkle_points_sss;
    
                if (sssSparkle > 0) {
                    let userSparkleData = await Sparkle.find({
                        user: sssSparkleArray[i]["_id"]["user"],
                        month: monthIndex,
                        year: fullYear,
                    });
    
                    if (userSparkleData && userSparkleData.length) {
                        //Update Sparkle points
                        userSparkleData[0]["sss"] = userSparkleData[0]["sss"]
                            ? parseInt(userSparkleData[0]["sss"]) + sssSparkle
                            : sssSparkle;
                        userSparkleData[0]["total"] = userSparkleData[0]["total"]
                            ? parseInt(userSparkleData[0]["total"]) + sssSparkle
                            : sssSparkle;
                        userSparkleData[0]["updatedDate"] = new Date(toDate);
                        let useSparkleObj = new Sparkle(userSparkleData[0]);
                        await useSparkleObj.save();
                    } else {
                        //Insert Sparkle points
                        let userSparkleObj = new Sparkle({
                            user: new objectId(sssSparkleArray[i]["_id"]["user"]),
                            sss: sssSparkle,
                            total: sssSparkle,
                            updatedDate: new Date(toDate),
                            month: monthIndex,
                            year: fullYear,
                        });
                        await userSparkleObj.save();
                    }
                }
            }
        } catch(e) {
            throw (e);
        }
    },
    everyNightCalculateSparkleForImageLikes: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForImageLikes Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";

        let baithakImageLikesSparkle = await Imagelike.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);
        //console.log("IMAGE LIKES------------------------------------------------------")
        //console.log(baithakImageLikesSparkle)
        for (let i = 0; i < baithakImageLikesSparkle.length; i++) {
            let imageLikesSparkle =
                parseInt(baithakImageLikesSparkle[i]["count"]) *
                config.sparkle_points_imagelike;
            if (
                baithakImageLikesSparkle[i]["_id"]["user"].toString() ==
                "5e14c815ce857d52dc6cc903"
            ) {
                console.log("USER IMAGE LIKES : ");
                console.log(baithakImageLikesSparkle[i]);
            }
            if (imageLikesSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakImageLikesSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakLikes"] = userSparkleData[0][
                        "baithakLikes"
                    ]
                        ? parseInt(userSparkleData[0]["baithakLikes"]) + imageLikesSparkle
                        : imageLikesSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + imageLikesSparkle
                        : imageLikesSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);

                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakImageLikesSparkle[i]["_id"]["user"]),
                        baithakLikes: imageLikesSparkle,
                        total: imageLikesSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForImageLikes done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForTextLikes: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday
        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForTextLikes Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";

        let baithakTextLikesSparkle = await Textlike.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);

        //console.log("TEXT LIKES------------------------------------------------------")
        //console.log(baithakTextLikesSparkle)
        for (let i = 0; i < baithakTextLikesSparkle.length; i++) {
            let textLikesSparkle =
                parseInt(baithakTextLikesSparkle[i]["count"]) *
                config.sparkle_points_textlike;
            if (
                baithakTextLikesSparkle[i]["_id"]["user"].toString() ==
                "5e14c815ce857d52dc6cc903"
            ) {
                console.log("USER TEXT LIKES : ");
                console.log(baithakTextLikesSparkle[i]);
            }
            if (textLikesSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakTextLikesSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakLikes"] = userSparkleData[0][
                        "baithakLikes"
                    ]
                        ? parseInt(userSparkleData[0]["baithakLikes"]) + textLikesSparkle
                        : textLikesSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + textLikesSparkle
                        : textLikesSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);

                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakTextLikesSparkle[i]["_id"]["user"]),
                        baithakLikes: textLikesSparkle,
                        total: textLikesSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForTextLikes done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForVideoLikes: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForVideoLikes Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";

        let baithakVideoLikesSparkle = await Videolike.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);
        //console.log("VIDEO LIKES------------------------------------------------------")
        //console.log(baithakVideoLikesSparkle)

        for (let i = 0; i < baithakVideoLikesSparkle.length; i++) {
            let videoLikesSparkle =
                parseInt(baithakVideoLikesSparkle[i]["count"]) *
                config.sparkle_points_videolike;
            if (
                baithakVideoLikesSparkle[i]["_id"]["user"].toString() ==
                "5e14c815ce857d52dc6cc903"
            ) {
                console.log("USER VIDEO LIKES : ");
                console.log(baithakVideoLikesSparkle[i]);
            }
            if (videoLikesSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakVideoLikesSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakLikes"] = userSparkleData[0][
                        "baithakLikes"
                    ]
                        ? parseInt(userSparkleData[0]["baithakLikes"]) + videoLikesSparkle
                        : videoLikesSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + videoLikesSparkle
                        : videoLikesSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);

                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakVideoLikesSparkle[i]["_id"]["user"]),
                        baithakLikes: videoLikesSparkle,
                        total: videoLikesSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForVideoLikes done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForSSSVideoLikes: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForSSSVideoLikes Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";
        let baithakSSSVideoLikesSparkle = await Sssvideolike.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);

        //console.log("SSSVIDEO LIKES------------------------------------------------------")
        //console.log(baithakSSSVideoLikesSparkle)
        for (let i = 0; i < baithakSSSVideoLikesSparkle.length; i++) {
            let sssvideoLikesSparkle =
                parseInt(baithakSSSVideoLikesSparkle[i]["count"]) *
                config.sparkle_points_sssvideolike;
            if (
                baithakSSSVideoLikesSparkle[i]["_id"]["user"].toString() ==
                "5e14c815ce857d52dc6cc903"
            ) {
                console.log("USER SSS VIDEO LIKES : ");
                console.log(baithakSSSVideoLikesSparkle[i]);
            }
            if (sssvideoLikesSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakSSSVideoLikesSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakLikes"] = userSparkleData[0][
                        "baithakLikes"
                    ]
                        ? parseInt(userSparkleData[0]["baithakLikes"]) +
                        sssvideoLikesSparkle
                        : sssvideoLikesSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + sssvideoLikesSparkle
                        : sssvideoLikesSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);
                    let useSparkleObj = new Sparkle(userSparkleData[0]);

                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakSSSVideoLikesSparkle[i]["_id"]["user"]),
                        baithakLikes: sssvideoLikesSparkle,
                        total: sssvideoLikesSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForSSSVideoLikes done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForTextComments: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForTextComments Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";
        let baithakTextCommentsSparkle = await Textcomment.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);

        for (let i = 0; i < baithakTextCommentsSparkle.length; i++) {
            let textCommentsSparkle =
                parseInt(baithakTextCommentsSparkle[i]["count"]) *
                config.sparkle_points_textcomment;

            if (textCommentsSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakTextCommentsSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakComments"] = userSparkleData[0][
                        "baithakComments"
                    ]
                        ? parseInt(userSparkleData[0]["baithakComments"]) +
                        textCommentsSparkle
                        : textCommentsSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + textCommentsSparkle
                        : textCommentsSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);
                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakTextCommentsSparkle[i]["_id"]["user"]),
                        baithakComments: textCommentsSparkle,
                        total: textCommentsSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForTextComments done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForImageComments: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForImageComments Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";
        let baithakImageCommentsSparkle = await Imagecomment.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);

        for (let i = 0; i < baithakImageCommentsSparkle.length; i++) {
            let imageCommentsSparkle =
                parseInt(baithakImageCommentsSparkle[i]["count"]) *
                config.sparkle_points_imagecomment;

            if (imageCommentsSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakImageCommentsSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakComments"] = userSparkleData[0][
                        "baithakComments"
                    ]
                        ? parseInt(userSparkleData[0]["baithakComments"]) +
                        imageCommentsSparkle
                        : imageCommentsSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + imageCommentsSparkle
                        : imageCommentsSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);
                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakImageCommentsSparkle[i]["_id"]["user"]),
                        baithakComments: imageCommentsSparkle,
                        total: imageCommentsSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForImageComments done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForVideoComments: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForVideoComments Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";
        let baithakVideoCommentsSparkle = await Videocomment.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);

        for (let i = 0; i < baithakVideoCommentsSparkle.length; i++) {
            let videoCommentsSparkle =
                parseInt(baithakVideoCommentsSparkle[i]["count"]) *
                config.sparkle_points_videocomment;
            if (videoCommentsSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakVideoCommentsSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakComments"] = userSparkleData[0][
                        "baithakComments"
                    ]
                        ? parseInt(userSparkleData[0]["baithakComments"]) +
                        videoCommentsSparkle
                        : videoCommentsSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + videoCommentsSparkle
                        : videoCommentsSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);
                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(baithakVideoCommentsSparkle[i]["_id"]["user"]),
                        baithakComments: videoCommentsSparkle,
                        total: videoCommentsSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForVideoComments done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForSSSVideoComments: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForSSSVideoComments Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";
        let baithakSSSVideoCommentsSparkle = await Sssvideocomment.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    user: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { user: "$user" },
                    count: { $sum: 1 },
                },
            },
        ]);

        for (let i = 0; i < baithakSSSVideoCommentsSparkle.length; i++) {
            let sssVideoCommentsSparkle =
                parseInt(baithakSSSVideoCommentsSparkle[i]["count"]) *
                config.sparkle_points_sssvideocomment;

            if (sssVideoCommentsSparkle > 0) {
                let userSparkleData = await Sparkle.find({
                    user: baithakSSSVideoCommentsSparkle[i]["_id"]["user"],
                    month: monthIndex,
                    year: fullYear,
                });

                if (userSparkleData && userSparkleData.length) {
                    //Update Sparkle points
                    userSparkleData[0]["baithakComments"] = userSparkleData[0][
                        "baithakComments"
                    ]
                        ? parseInt(userSparkleData[0]["baithakComments"]) +
                        sssVideoCommentsSparkle
                        : sssVideoCommentsSparkle;
                    userSparkleData[0]["total"] = userSparkleData[0]["total"]
                        ? parseInt(userSparkleData[0]["total"]) + sssVideoCommentsSparkle
                        : sssVideoCommentsSparkle;
                    userSparkleData[0]["updatedDate"] = new Date(toDate);

                    let useSparkleObj = new Sparkle(userSparkleData[0]);
                    await useSparkleObj.save();
                } else {
                    //Insert Sparkle points
                    let userSparkleObj = new Sparkle({
                        user: new objectId(
                            baithakSSSVideoCommentsSparkle[i]["_id"]["user"]
                        ),
                        baithakComments: sssVideoCommentsSparkle,
                        total: sssVideoCommentsSparkle,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForSSSVideoComments done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    everyNightCalculateSparkleForAssessments: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday
        try {
            let toDateObject = new Date(toDate);
            let fromDateObject = new Date(fromDate);
            let monthIndex = fromDateObject.getMonth();
            monthIndex = monthIndex + 1;
            let fullYear = toDateObject.getFullYear();
    
            let activeUsers = [];
            if (dtype == "month") {
                activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
            } else {
                activeUsers = await this.getActiveUsers(fromDate);
            }
            console.log(
                " everyNightCalculateSparkleForAssessments Records ",
                activeUsers.length
            );
            //return "COUNTSCHECK";
            let assessArray = await AssessmentStudentProgress.aggregate([
                {
                    $match: {
                        sourceType: "mobile",
                        createdDate: {
                            $gte: new Date(fromDate),
                            $lt: new Date(toDate),
                        },
                        createdBy: {
                            $in: activeUsers,
                        },
                    },
                },
                {
                    $group: {
                        _id: { createdBy: "$createdBy" },
                        count: { $sum: 1 },
                    },
                },
            ]);
    
            for (let i = 0; i < assessArray.length; i++) {
                let assessSparkle =
                    parseInt(assessArray[i]["count"]) * config.sparkle_points_assessment;
    
                if (assessSparkle > 0) {
                    let userSparkleData = await Sparkle.find({
                        user: assessArray[i]["_id"]["createdBy"],
                        month: monthIndex,
                        year: fullYear,
                    });
    
                    if (userSparkleData && userSparkleData.length) {
                        //Update Sparkle points
                        userSparkleData[0]["assessment"] = userSparkleData[0]["assessment"]
                            ? parseInt(userSparkleData[0]["assessment"]) + assessSparkle
                            : assessSparkle;
                        userSparkleData[0]["total"] = userSparkleData[0]["total"]
                            ? parseInt(userSparkleData[0]["total"]) + assessSparkle
                            : assessSparkle;
                        userSparkleData[0]["updatedDate"] = new Date(toDate);
    
                        let useSparkleObj = new Sparkle(userSparkleData[0]);
                        await useSparkleObj.save();
                    } else {
                        //Insert Sparkle points
                        let userSparkleObj = new Sparkle({
                            user: new objectId(assessArray[i]["_id"]["createdBy"]),
                            assessment: assessSparkle,
                            total: assessSparkle,
                            updatedDate: new Date(toDate),
                            month: monthIndex,
                            year: fullYear,
                        });
                        await userSparkleObj.save();
                    }
                }
            }
            console.log(
                "everyNightCalculateSparkleForAssessments done for period : ",
                fromDate,
                " TO ",
                toDate,
                " : AT : ",
                new Date().toISOString()
            );
        } catch(e) {
            console.error(e);
            throw e;
        } 
    },
    everyNightCalculateSparkleForElearning: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday
        try {
            let toDateObject = new Date(toDate);
            let fromDateObject = new Date(fromDate);
            let monthIndex = fromDateObject.getMonth();
            monthIndex = monthIndex + 1;
            let fullYear = toDateObject.getFullYear();
    
            let activeUsers = [];
            if (dtype == "month") {
                activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
            } else {
                activeUsers = await this.getActiveUsers(fromDate);
            }
            console.log(
                " everyNightCalculateSparkleForElearning Records ",
                activeUsers.length
            );
            //return "COUNTSCHECK";
            let elearningSparkleArray = await Enrollment.aggregate([
                {
                    $match: {
                        status: "completed",
                        completionDate: {
                            $gte: new Date(fromDate),
                            $lt: new Date(toDate),
                        },
                        user: {
                            $in: activeUsers,
                        },
                    },
                },
                {
                    $group: {
                        _id: { user: "$user" },
                        count: { $sum: 1 },
                    },
                },
            ]);
    
            for (let i = 0; i < elearningSparkleArray.length; i++) {
                let elearningSparkle =
                    parseInt(elearningSparkleArray[i]["count"]) *
                    config.sparkle_points_elearning;
    
                if (elearningSparkle > 0) {
                    let userSparkleData = await Sparkle.find({
                        user: elearningSparkleArray[i]["_id"]["user"],
                        month: monthIndex,
                        year: fullYear,
                    });
    
                    if (userSparkleData && userSparkleData.length) {
                        //Update Sparkle points
                        userSparkleData[0]["course"] = userSparkleData[0]["course"]
                            ? parseInt(userSparkleData[0]["course"]) + elearningSparkle
                            : elearningSparkle;
                        userSparkleData[0]["total"] = userSparkleData[0]["total"]
                            ? parseInt(userSparkleData[0]["total"]) + elearningSparkle
                            : elearningSparkle;
                        userSparkleData[0]["updatedDate"] = new Date(toDate);
    
                        let useSparkleObj = new Sparkle(userSparkleData[0]);
    
                        await useSparkleObj.save();
                    } else {
                        //Insert Sparkle points
                        let userSparkleObj = new Sparkle({
                            user: new objectId(elearningSparkleArray[i]["_id"]["user"]),
                            course: elearningSparkle,
                            total: elearningSparkle,
                            updatedDate: new Date(toDate),
                            month: monthIndex,
                            year: fullYear,
                        });
                        await userSparkleObj.save();
                    }
                }
            }
            console.log(
                "everyNightCalculateSparkleForElearning done for period : ",
                fromDate,
                " TO ",
                toDate,
                " : AT : ",
                new Date().toISOString()
            );
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    everyNightCalculateSparkleForDigitalDiary: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday
        try {
            // On Lesson Plan completion, 1 chapter 20 sparkles
            let toDateObject = new Date(toDate);
            let fromDateObject = new Date(fromDate);
            let monthIndex = fromDateObject.getMonth();
            monthIndex = monthIndex + 1;
            let fullYear = toDateObject.getFullYear();

            let activeUsers = [];
            if (dtype == "month") {
                activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
            } else {
                activeUsers = await this.getActiveUsers(fromDate);
            }
            console.log(
                " everyNightCalculateSparkleForDigitalDiary Records ",
                activeUsers.length
            );
            //return "COUNTSCHECK";
            let finalArr = [];
            let sparklePoints = config.sparkle_points_digitaldiaryplandone;

            let ddProgressData = await Progress.aggregate([
                {
                    $match: {
                        createdDate: {
                            $gte: new Date(fromDate),
                            $lt: new Date(toDate),
                        },
                        userId: {
                            $in: activeUsers,
                        },
                    },
                },
                {
                    $group: {
                        _id: { ddlesson: "$ddlesson" },
                        data: { $push: "$$ROOT" },
                    },
                },
            ]);

            if (ddProgressData.length > 0) {
                for (let j = 0; j < ddProgressData.length; j++) {
                    let newarr = {};
                    if (ddProgressData[j].data[0]) {
                        if (ddProgressData[j].data[0].isCompleted == true) {
                            newarr = ddProgressData[j].data[0].userId;
                            finalArr.push(newarr);
                        }
                    }
                }
            }

            //Insert Sparkle points
            if (finalArr.length > 0) {
                for (m = 0; m < finalArr.length; m++) {
                    let exData = await Sparkle.find({
                        user: finalArr[m],
                        month: monthIndex,
                        year: fullYear,
                    });
                    if (exData && exData.length) {
                        exData[0]["digitalDiary"] = exData[0]["digitalDiary"]
                            ? parseInt(exData[0]["digitalDiary"]) + sparklePoints
                            : sparklePoints;
                        exData[0]["total"] = exData[0]["total"]
                            ? parseInt(exData[0]["total"]) + sparklePoints
                            : sparklePoints;
                        exData[0]["updatedDate"] = new Date(toDate);
                        let useSparkleObj = new Sparkle(exData[0]);
                        await useSparkleObj.save();
                    } else {
                        let userSparkleObj = new Sparkle({
                            user: new objectId(finalArr[m]),
                            digitalDiary: sparklePoints,
                            total: sparklePoints,
                            updatedDate: new Date(toDate),
                            month: monthIndex,
                            year: fullYear,
                        });
                        await userSparkleObj.save();
                    }
                }
            }
            console.log(
                "everyNightCalculateSparkleForDigitalDiary done for period : ",
                fromDate,
                " TO ",
                toDate,
                " : AT : ",
                new Date().toISOString()
            );
        } catch (e) {
            console.error(e);
            throw e;
        }
        
    },
    everyNightCalculateSparkleForSTV: async function (
        fromDate,
        toDate,
        dtype
    ) {
        // Find active users from user attendence collection for yesterday

        // On Lesson Plan completion, 1 chapter 20 sparkles
        let toDateObject = new Date(toDate);
        let fromDateObject = new Date(fromDate);
        let monthIndex = fromDateObject.getMonth();
        monthIndex = monthIndex + 1;
        let fullYear = toDateObject.getFullYear();

        let activeUsers = [];
        if (dtype == "month") {
            activeUsers = await this.getMonthlyActiveUsers(fullYear, monthIndex);
        } else {
            activeUsers = await this.getActiveUsers(fromDate);
        }
        console.log(
            " everyNightCalculateSparkleForSTV Records ",
            activeUsers.length
        );
        //return "COUNTSCHECK";
        let finalArr = [];
        let sparklePoints = config.sparkle_points_stv;

        let ddProgressData = await Progress.aggregate([
            {
                $match: {
                    createdDate: {
                        $gte: new Date(fromDate),
                        $lt: new Date(toDate),
                    },
                    userId: {
                        $in: activeUsers,
                    },
                },
            },
            {
                $group: {
                    _id: { ddlesson: "$ddlesson" },
                    data: { $push: "$$ROOT" },
                },
            },
        ]);

        if (ddProgressData.length > 0) {
            for (let j = 0; j < ddProgressData.length; j++) {
                let newarr = {};
                if (ddProgressData[j].data[0]) {
                    if (ddProgressData[j].data[0].isCompleted == true) {
                        newarr = ddProgressData[j].data[0].userId;
                        finalArr.push(newarr);
                    }
                }
            }
        }

        //Insert Sparkle points
        if (finalArr.length > 0) {
            for (m = 0; m < finalArr.length; m++) {
                let exData = await Sparkle.find({
                    user: finalArr[m],
                    month: monthIndex,
                    year: fullYear,
                });
                if (exData && exData.length) {
                    exData[0]["sparkle_points_stv"] = exData[0]["sparkle_points_stv"]
                        ? parseInt(exData[0]["sparkle_points_stv"]) + sparklePoints
                        : sparklePoints;
                    exData[0]["total"] = exData[0]["total"]
                        ? parseInt(exData[0]["total"]) + sparklePoints
                        : sparklePoints;
                    exData[0]["updatedDate"] = new Date(toDate);
                    let useSparkleObj = new Sparkle(exData[0]);
                    await useSparkleObj.save();
                } else {
                    let userSparkleObj = new Sparkle({
                        user: new objectId(finalArr[m]),
                        sparkle_points_stv: sparklePoints,
                        total: sparklePoints,
                        updatedDate: new Date(toDate),
                        month: monthIndex,
                        year: fullYear,
                    });
                    await userSparkleObj.save();
                }
            }
        }
        console.log(
            "everyNightCalculateSparkleForSTV done for period : ",
            fromDate,
            " TO ",
            toDate,
            " : AT : ",
            new Date().toISOString()
        );
    },
    // Below cron job functions will run every night ends
    // deleteAndCopyDataToBackupCollections function will delete records from given collections before
    // given date, copy that data to backup collection
    deleteAndCopyDataToBackupCollections: async function (date) {

        const collectionsArray = ["Notification", "Caricature"];

        if (collectionsArray.length > 0) {
            for (let i = 0; i < collectionsArray.length; i++) {

                let collectionName = collectionsArray[i];
                let collectionBackupName = (collectionName + "s_backup").toLocaleLowerCase();

                let records = await db[collectionName].countDocuments();
                console.log(`Number of records in ` + collectionName + ` ` + records);

                let recordsWillDelete = await db[collectionName].find({ createdDate: { $lte: new Date(date) } }).countDocuments();
                console.log(`From ` + collectionName + `, ` + recordsWillDelete + ` will be deleted!`);

                if (recordsWillDelete > 0) {
                    await db[collectionName].aggregate([{ $match: { createdDate: { $lte: new Date(date) } } }, { $out: collectionBackupName }]);

                    await db[collectionName].deleteMany({ createdDate: { $lte: new Date(date) } }); // will delete matching records
                }

                console.log(`Records removed from ` + collectionName + ` copied to ` + collectionBackupName);
            }
        }
    },

    getDDLessonForSubjectAndDepartment(ddlessonsArray, subjectId, departmentId) {
        try {
            const ddlessonObject = _.filter(ddlessonsArray, (lessonObj) => {
                return _.isEqual(lessonObj.subject, subjectId) && _.isEqual(lessonObj.department, departmentId);
            });
            return ddlessonObject;
        } catch(e) {
            console.error(e);
            throw e;
        }
    },

    getDDSubjectId(smartShalaSubjectId, subjectMasters) {
        try {
            const ddSubjectIdArray = _.find(subjectMasters, (subjectObject) => {
                return subjectObject.related_subjects.includes(smartShalaSubjectId);
            });
            return ddSubjectIdArray;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    getDDDepartmentId(smartShalaDepartmentId, departmentMasters) {
        try {
            const ddDepartmentIdArray = _.find(departmentMasters, (departmentObject) => {
                return departmentObject.related_departments.includes(smartShalaDepartmentId);
            });
            return ddDepartmentIdArray;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    checkBetween(date1, date2, date3) {
        return (date1.isSameOrAfter(date2) && date1.isSameOrBefore(date3));
    },

    getDDTopics(ddTopicArray, ddLessonId, tomorrow) {
        try {
            const dateToCompare = moment(tomorrow, "DD-MM-YYYY");
            const ddTopics = _.filter(ddTopicArray, (ddTopic) => {
                if (ddTopic.startDate != null && ddTopic.noOfDays != null) {
                    const startDate = moment(ddTopic.startDate, "DD-MM-YYYY");
                    const endDate = moment(ddTopic.startDate, "DD-MM-YYYY").add(ddTopic.noOfDays, 'days');
                    return (this.checkBetween(dateToCompare, startDate, endDate) && _.isEqual(ddTopic.ddlesson, ddLessonId));
                }
            });
            return ddTopics;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    getDDTopicsForWeek(ddTopicArray, ddLessonId, weekFrom, weekTo) {
        try {
            const from = moment(weekFrom, "DD-MM-YYYY");
            const to = moment(weekTo, "DD-MM-YYYY");
            const ddTopics = _.filter(ddTopicArray, (ddTopic) => {
                if (ddTopic.startDate != null && ddTopic.noOfDays != null) {
                    for (const i = 0; i < ddTopic.noOfDays; i++) {
                        const startDate = moment(ddTopic.startDate, "DD-MM-YYYY").add(i, 'days');
                        return (this.checkBetween(startDate, from, to) && _.isEqual(ddTopic.ddlesson, ddLessonId));
                    }
                }
            });
            return ddTopics;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    notifyTeachersForNextWeekTasks: async function (phoneNumber) {
        // const govtTeachers = await User.find({"usertype":"govt teacher", "classes":{$exists: true, $not: {$size: 0}}, "subjects":{$exists: true,$not: {$size: 0}}, "is_active":true, "is_blocked" : false});
        // const govtTeachers = await User.find({ phone_number: "8552898046" });

        try {
            let govtTeachers;
            if (phoneNumber)
                govtTeachers = await User.find({ phone_number: phoneNumber });
            else {
                govtTeachers = await User.find({"usertype":"govt teacher", "classes":{$exists: true, $not: {$size: 0}}, "subjects":{$exists: true,$not: {$size: 0}}, "is_active":true, "is_blocked" : false});
            }
            const ddlessonsArray = await Ddlesson.find({"isActive" : true, "lesson":{$exists: true}});
            const subjectMasters = await Subjectmaster.find({ module: "dd", "related_subjects": {$exists:true} }).select('id name related_subjects');
            const departmentMasters = await Departmentmaster.find({ module: "dd", "related_departments": {$exists:true} }).select('id name related_departments');
            const ddTopicArray = await Ddtopic.find({"isActive" : true, "startDate": {$exists:true}, "noOfDays": {$exists:true}});
            const teacherMap = [];
    
            const today = new Date();
            const weekFrom = new Date();
            weekFrom.setHours(-18, -30, 0, 0); 
            weekFrom.setDate(today.getDate() + 1);
    
            const weekTo = new Date();
            weekTo.setHours(28, 89, 59, 999);
            weekTo.setDate(today.getDate() + 7)
    
            for (const teacher of govtTeachers) {
                const departmentsFromTeacher = teacher['classes'];
                const subjectsFromTeacher = teacher['subjects'];
                
                for (const smartShalaSubjectId of subjectsFromTeacher) {
                    const ddSubjectId = this.getDDSubjectId(smartShalaSubjectId, subjectMasters);
                    if (ddSubjectId) {
                        for (const smartShalaDepartmentId of departmentsFromTeacher) {
                            const ddDepartmentId = this.getDDDepartmentId(smartShalaDepartmentId, departmentMasters)
                            
                            if (ddDepartmentId) {
                                const ddlessonArray = this.getDDLessonForSubjectAndDepartment(ddlessonsArray, ddSubjectId['_id'], ddDepartmentId['_id']);
                                if(ddlessonArray && ddlessonArray[0]) {
                                    for (const ddLessonData of ddlessonArray) {
                                        const topics = this.getDDTopicsForWeek(ddTopicArray, ddLessonData['_id'], weekFrom, weekTo);
                                        
                                        if(topics.length > 0) {                                        
                                            teacherMap.push({
                                                user: teacher['_id'],
                                                fcmToken: teacher['fcm_token'],
                                                lessonId: ddLessonData['lesson'].toString(),
                                                ddLessonId: ddLessonData['_id'].toString(),
                                                lessonName: ddLessonData['name'],
                                                fromDate: weekFrom,
                                                toDate: weekTo,
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if(teacherMap) {
                const title = 'Iss hafte key pathyakram key sujhav';
                this.notifyTeahers(teacherMap, title, false);
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    notifyTeachersForNextDayTasks: async function (phoneNumber) {
        try {
            let govtTeachers;
            if (phoneNumber)
                govtTeachers = await User.find({ phone_number: phoneNumber });
            else {
                govtTeachers = await User.find({"usertype":"govt teacher", "classes":{$exists: true, $not: {$size: 0}}, "subjects":{$exists: true,$not: {$size: 0}}, "is_active":true, "is_blocked" : false});
            }
            
            // const govtTeachers = await User.find({ phone_number: "8552898046" });
            const subjectMasters = await Subjectmaster.find({ module: "dd", "related_subjects": {$exists:true} }).select('id name related_subjects');
            const departmentMasters = await Departmentmaster.find({ module: "dd", "related_departments": {$exists:true} }).select('id name related_departments');
            
            const ddlessonsArray = await Ddlesson.find({"isActive" : true, "lesson":{$exists: true}});
            const ddTopicArray = await Ddtopic.find({"isActive" : true, "startDate": {$exists:true}, "noOfDays": {$exists:true}});
        
            const teacherMap = [];
            const today = new Date();

            const tomorrowFrom = new Date();
            tomorrowFrom.setHours(-18, -30, 0, 0);
            tomorrowFrom.setDate(today.getDate() + 1);

            const tomorrowTo = new Date();  
            tomorrowTo.setHours(28, 89, 59, 999);
            tomorrowTo.setDate(today.getDate() + 1);

            for (const teacher of govtTeachers) {
                const departmentsFromTeacher = teacher['classes'];
                const subjectsFromTeacher = teacher['subjects'];
                
                for (const smartShalaSubjectId of subjectsFromTeacher) {
                    const ddSubjectId = this.getDDSubjectId(smartShalaSubjectId, subjectMasters);
                    
                    if (ddSubjectId) {
                        for (const smartShalaDepartmentId of departmentsFromTeacher) {
                            const ddDepartmentId = this.getDDDepartmentId(smartShalaDepartmentId, departmentMasters)
                            
                            if (ddDepartmentId) {
                                const ddlessonArray = this.getDDLessonForSubjectAndDepartment(ddlessonsArray, ddSubjectId['_id'], ddDepartmentId['_id']);
                                if(ddlessonArray && ddlessonArray[0]) {
                                    for (const ddLessonData of ddlessonArray) {
                                        const topics = this.getDDTopics(ddTopicArray, ddLessonData['_id'], tomorrowFrom);
                                        
                                        if(topics.length > 0) {
                                            teacherMap.push({
                                                user: teacher['_id'],
                                                fcmToken: teacher['fcm_token'],
                                                lessonId: ddLessonData['lesson'].toString(),
                                                ddLessonId: ddLessonData['_id'].toString(),
                                                lessonName: ddLessonData['name'],
                                                fromDate: tomorrowFrom,
                                                toDate: tomorrowTo,
                                                tomorrowDay: tomorrowFrom.toLocaleDateString(undefined, { weekday: 'long' })
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if(teacherMap) {
                const title = 'Kal key pathyakram key sujhav';
                this.notifyTeahers(teacherMap, title, true);
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    notifyTeahers: async function (teacherMap, title, daily) {
        try {
            for (const teacher of teacherMap) {
                const body = daily ? (teacher['tomorrowDay'] +": "+teacher['lessonName']) : teacher['lessonName'];
                const payload = {
                    notification: {
                        title: title,
                        body: body,
                    },
                    data: {
                        lessonId: teacher['lessonId'],
                        ddLessonId: teacher['ddLessonId'],
                        fromDate: teacher['fromDate'].toISOString(),
                        toDate: teacher['toDate'].toISOString(),
                        dayName: daily ? (teacher['tomorrowDay'] +": "+teacher['lessonName']) : teacher['lessonName'],
                        dailyOrWeekly: daily ? 'daily' : 'weekly',
                    },
                };
                const options = {
                    priority: "high",
                    timeToLive: 60 * 60 * 24,
                };

                await this.sendPushNotification(teacher['fcmToken'], payload, options);
    
                const ddNotification = new Notification({
                    user: teacher['user'],
                    title: title + " - "+ body,
                    message: 'ddlesson',
                    payloadData: payload.data,
                    creator: teacher['user'],
                });
                await ddNotification.save();

            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    
    sendPushNotification: async function (fcm_token, payload, option) {
        try {
            firebaseAdmin
                .messaging()
                .sendToDevice(fcm_token, payload, option)
                .then(function (response) {
                    console.log("Successfully sent message:", response);
                })
                .catch(function (error) {
                    throw error;
                });
        } catch (error) {
            throw error;
        }
    },

    // Code to update the user's total resources based on creation date
    // Code changes made by Devendra
    everyNightCalculateTotalResourcesForUser: async function () {
        try {
            const currDate = moment(new Date()).format('YYYY-MM-DD').toString();
            console.log("Current Date: ", currDate);
            const audioTextBook = await Audiotextbookplayed.find({ createdDate: { $gte: new Date(currDate) } });
            const sssVideoPlayed = await Sssvideoplayed.find({ createdDate: { $gte: new Date(currDate) } });
            const documentViewed = await Documentviewed.find({ createdDate: { $gte: new Date(currDate) } });
            for (const audio of audioTextBook) {
                if (audio.user != null && audio.user != "") {
                    const users = await User.find({ "_id": audio.user });
                    if (users) {
                        const totalResources = users[0].totalResources ? parseInt(users[0].totalResources) + 1 : 1;
                        console.log("Total Resource Audio TextBook: ", totalResources);
                        await User.updateOne({ "_id": audio.user }, { "$set": { "totalResources": totalResources } })
                    }
                }
            }
            for (const sssVideo of sssVideoPlayed) {
                if (sssVideo.user != null && sssVideo.user != "") {
                    const users = await User.find({ "_id": sssVideo.user });
                    if (users) {
                        const totalResources = users[0].totalResources ? parseInt(users[0].totalResources) + 1 : 1;
                        console.log("Total Resource SSS Video Played: ", totalResources);
                        await User.updateOne({ "_id": sssVideo.user }, { "$set": { "totalResources": totalResources } })
                    }
                }
            }
            for (const document of documentViewed) {
                if (document.user != null && document.user != "") {
                    const users = await User.find({ "_id": document.user });
                    if (users) {
                        const totalResources = users[0].totalResources ? parseInt(users[0].totalResources) + 1 : 1;
                        console.log("Total Resource Document Viewed: ", totalResources);
                        await User.updateOne({ "_id": document.user }, { "$set": { "totalResources": totalResources } })
                    }
                }
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
    let deferred = q.defer();

    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    try {
        let tokenFile = fs.readFileSync(TOKEN_PATH);
        oauth2Client.credentials = JSON.parse(tokenFile);
        deferred.resolve(oauth2Client);
        //callback(oauth2Client, videoFile, fileName, description);
    } catch (error) {
        // getNewToken(oauth2Client, callback, videoFile, fileName, description);
        getNewToken(oauth2Client);
        deferred.resolve(oauth2Client);
    } //end of try...catch block

    return deferred.promise;

    // fs.readFile(TOKEN_PATH, function (err, token) {
    //   if (err) {
    //     getNewToken(oauth2Client, callback, videoFile, fileName, description);
    //   } else {
    //     oauth2Client.credentials = JSON.parse(token);
    //     callback(oauth2Client, videoFile, fileName, description);
    //   }
    // });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
// async function getNewToken(oauth2Client, callback, videoFile, fileName, description) {
async function getNewToken(oauth2Client) {
    var deferred = q.defer();

    try {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });

        console.log("Authorize this app by visiting this url: ", authUrl);

        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("Enter the code from that page here: ", function (code) {
            rl.close();

            let token = oauth2Client.getToken(code);

            oauth2Client.credentials = token;
            storeToken(token);
            deferred.resolve(oauth2Client);
        }); //end of question
    } catch (error) {
        console.log("GET_NEW_TOKEN_FUNCTION_FAILED, error: " + error);
        deferred.reject(error);
    } //end of try...catch block

    return deferred.promise;
} //end of 'getNewToken' function

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    let deferred = q.defer();

    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != "EEXIST") {
            deferred.reject(err);
            throw err;
        }
    }

    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log("Token stored to " + TOKEN_PATH);
        deferred.resolve();
    });

    return deferred.promise;
} //end of 'storeToken' function

async function uploadVideoOnYouTube(auth, videoFile, fileName, description) {
    let deferred = q.defer();

    var service = google.youtube("v3");
    //const fileSize = fs.statSync("sample.mp4").size;
    const fileSize = videoFile.size;

    //fs.writeFileSync(fileName, videoFile.data);

    let s3 = new AWS.S3({
        accessKeyId: IAM_USER_KEY,
        secretAccessKey: IAM_USER_SECRET,
        Bucket: BUCKET_NAME,
    });
    var s3data = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        //Key: 'uservideos/ViziTrans demo-20190521 0732-1.mp4'
    };
    let fileStream = await s3.getObject(s3data).createReadStream();

    await service.videos.insert(
        {
            part: "id,snippet,status,contentDetails",
            auth: auth,
            notifySubscribers: false,
            requestBody: {
                snippet: {
                    channelTitle: config.youtube_channel,
                    title: videoFile.name,
                    description: description,
                },
                status: {
                    privacyStatus: "unlisted",
                },
            },
            media: {
                //(videoFile),
                body: fileStream,
                mimeType: "video/mp4",
            },
        },
        {
            // Use the `onUploadProgress` event from Axios to track the
            // number of bytes uploaded to this point.
            onUploadProgress: (evt) => {
                const progress = (evt.bytesRead / fileSize) * 100;
                readline.clearLine(process.stdout, 0);
                readline.cursorTo(process.stdout, 0, null);
                process.stdout.write(`${Math.round(progress)}% complete`);

                // //For resolving promise when progress is 100%
                // if (progress == 100) {

                //   deferred.resolve(res.data);
                // } //end of if condition checking progress is 100 or not
            },
        },
        (err, data) => {
            console.log(err);
            console.log("\n\n");
            if (err) deferred.reject(err);
            else deferred.resolve(data);
        }
    );

    return deferred.promise;
} //end of 'uploadVideoOnYouTube' function

async function deleteVideoOnYouTube(auth, youtube_code) {
    let deferred = q.defer();
    try {
        var service = google.youtube("v3");
        //delete the existing video
        const deleteVideoResponse = await service.videos.delete({
            auth: auth,
            id: youtube_code,
            // onBehalfOfContentOwner: 'placeholder-value',
        });
        deferred.resolve(deleteVideoResponse);
    } catch (e) {
        deferred.reject(e);
    }
    return deferred.promise;
}

function __l(data) {
    return console.log(data);
}
