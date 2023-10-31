const config = require('../config.json');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || config.connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
  poolSize: 25,
});

const db = mongoose.connection;

// Event listeners to handle connection events
db.on('connected', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Function to gracefully close the connection
const gracefulShutdown = (msg, callback) => {
  db.close(() => {
    console.log(`Mongoose disconnected through ${msg}`);
    callback();
  });
};

// Listen for process termination or restart events
process.on('SIGINT', () => {
  gracefulShutdown('app termination', () => {
    process.exit(0);
  });
});

// Reuseable connection object
// module.exports = db;

module.exports = {
  User: require('../_models/user.model'),
  Userimage: require('../_models/userimage.model'),
  Uservideo: require('../_models/uservideo.model'),
  Userscertvideo: require('../_models/userscertvideo.model'),
  Useraudio: require('../_models/useraudio.model'),
  Imagecomment: require('../_models/imagecomment.model'),
  Videocomment: require('../_models/videocomment.model'),
  Textcomment: require('../_models/textcomment.model'),
  Sssvideocomment: require('../_models/sssvideocomment.model'),
  Category: require('../_models/category.model'),
  Stream: require('../_models/stream.model'),
  Streambackup: require('../_models/streambackup.model'),
  Videostream: require('../_models/videostream.model'),
  Videostreambackup: require('../_models/videostreambackup.model'),
  Textstream: require('../_models/textstream.model'),
  Textstreambackup: require('../_models/textstreambackup.model'),
  Imagestream: require('../_models/imagestream.model'),
  Imagestreambackup: require('../_models/imagestreambackup.model'),
  Scertstream: require('../_models/scertstream.model'),
  Videoscertstream: require('../_models/videoscertstream.model'),
  Textscertstream: require('../_models/textscertstream.model'),
  Imagescertstream: require('../_models/imagescertstream.model'),
  Pdfscertstream: require('../_models/pdfscertstream.model'),
  Video: require('../_models/video.model'),
  Audio: require('../_models/audio.model'),
  Streamlike: require('../_models/streamlike.model'),
  Scertstreamlike: require('../_models/scertstreamlike.model'),
  Videocategory: require('../_models/videocategory.model'),
  Subjectmaster: require('../_models/subjectmaster.model'),
  Departmentmaster: require('../_models/departmentmaster.model'),
  Conceptmaster: require('../_models/conceptmaster.model'),
  Document: require('../_models/document.model'),
  Scertsolution: require('../_models/scertsolution.model'),
  Activity: require('../_models/activity.model'),
  Imagelike: require('../_models/imagelike.model'),
  Videolike: require('../_models/videolike.model'),
  Textlike: require('../_models/textlike.model'),
  Sssvideolike: require('../_models/sssvideolike.model'),
  Audiolike: require('../_models/audiolike.model'),
  Audioplayed: require('../_models/audioplayed.model'),
  Videoplayed: require('../_models/videoplayed.model'),
  Sssvideoplayed: require('../_models/sssvideoplayed.model'),
  Userdevice: require('../_models/userdevice.model'),
  Qrscan: require('../_models/qrscan.model'),
  Notification: require('../_models/notification.model'),
  Certificate: require('../_models/certificate.model'),
  Badge: require('../_models/badge.model'),
  State: require('../_models/state.model'),
  District: require('../_models/district.model'),
  Block: require('../_models/block.model'),
  Cluster: require('../_models/cluster.model'),
  Designation: require('../_models/designation.model'),
  Lesson: require('../_models/lesson.model'),
  Kit: require('../_models/kit.model'),
  Scertimagecomment: require('../_models/scertimagecomment.model'),
  Scertvideocomment: require('../_models/scertvideocomment.model'),
  Scerttextcomment: require('../_models/scerttextcomment.model'),
  Scertpdfcomment: require('../_models/scertpdfcomment.model'),
  Scertimagelike: require('../_models/scertimagelike.model'),
  Scertvideolike: require('../_models/scertvideolike.model'),
  Scerttextlike: require('../_models/scerttextlike.model'),
  Scertpdflike: require('../_models/scertpdflike.model'),
  Scertsolutionviewed: require('../_models/scertsolutionviewed.model'),
  Kitviewed: require('../_models/kitviewed.model'),
  Documentviewed: require('../_models/documentviewed.model'),
  Unlockedlesson: require('../_models/unlockedlesson.model'),
  Sssvideoviewed: require('../_models/sssvideoviewed.model'),
  Videoviewed: require('../_models/videoviewed.model'),
  Audioviewed: require('../_models/audioviewed.model'),
  Lessonprogress: require('../_models/lessonprogress.model'),
  Userattendance: require('../_models/userattendance.model'),
  Userbadge: require('../_models/userbadge.model'),
  Usercertificate: require('../_models/usercertificate.model'),
  Statecertificate: require('../_models/statecertificate.model'),
  Customlog: require('../_models/log.model'),
  Querylog: require('../_models/querylog.model'),
  Broadcastmessage: require('../_models/broadcastmessage.model'),
  Assessment: require('../_models/assessment.model'),
  Assessmentquestion: require('../_models/assessmentquestion.model'),
  Assessmentstudentprogress: require('../_models/assessmentstudentprogress.model'),
  Assessmentstudentanswer: require('../_models/assessmentstudentanswer.model'),
  Student: require('../_models/student.model'),
  Competencymaster: require('../_models/competencymaster.model'),
  School: require('../_models/school.model'),
  Subcomment: require('../_models/subcomment.model'),
  Userfollower: require('../_models/userfollower.model'),
  Course: require('../_models/course.model'),
  Coursemodule: require('../_models/coursemodule.model'),
  Coursediscussion: require('../_models/coursediscussion.model'),
  Courseprogress: require('../_models/courseprogress.model'),
  Moduleprogress: require('../_models/moduleprogress.model'),
  Enrollment: require('../_models/enrollment.model'),
  Livesession: require('../_models/livesession.model'),
  Livesessionattendance: require('../_models/livesessionattendance.model'),
  Feedbacklike: require('../_models/feedbacklike.model'),
  Certification: require('../_models/certification.model'),
  VideoDeactivationHistory: require('../_models/videodeactivationhistory.model'),
  Hashtag: require('../_models/hashtag.model'),
  Caricature: require('../_models/caricature.model'),
  Schooldummy: require('../_models/schooldummy.model'),
  PostShare: require('../_models/postshare.model'),
  Reward: require('../_models/rewards.model'),
  Videostory: require('../_models/videostory.model'),
  Sssassessmentviewed: require('../_models/sssassessmentviewed.model'),
  Boloviewed: require('../_models/boloviewed.model'),
  Usersparkle: require('../_models/usersparkle.model'),
  Topteacher: require('../_models/topteacher.model'),
  Topschool: require('../_models/topschool.model'),
  Topblock: require('../_models/topblock.model'),
  Ddlesson: require('../_models/ddlesson.model'),
  Ddtopic: require('../_models/ddtopic.model'),
  Ddprogress: require('../_models/ddprogress.model'),
  Qrcode: require('../_models/qrcode.model'),
  Teacherrank: require('../_models/teacherrank.model'),
  Parentrank: require('../_models/parentrank.model'),
  Teachersssrank: require('../_models/teachersssrank.model'),
  Parentsssrank: require('../_models/parentsssrank.model'),
  Teacherbaithaklikesrank: require('../_models/teacherbaithaklikesrank.model'),
  Parentbaithaklikesrank: require('../_models/parentbaithaklikesrank.model'),
  Teachercourserank: require('../_models/teachercourserank.model'),
  Parentcourserank: require('../_models/parentcourserank.model'),
  Teacherassessmentrank: require('../_models/teacherassessmentrank.model'),
  Parentassessmentrank: require('../_models/parentassessmentrank.model'),
  Teacherdigitaldiaryrank: require('../_models/teacherdigitaldiaryrank.model'),
  Parentdigitaldiaryrank: require('../_models/parentdigitaldiaryrank.model'),
  Teacherbonusrank: require('../_models/teacherbonusrank.model'),
  Parentbonusrank: require('../_models/parentbonusrank.model'),
  Teachersparkle: require('../_models/teachersparkle.model'),
  Audiotextbook: require('../_models/audiotextbook.model'),
  Englishspeech: require('../_models/englishspeech.model'),
  Vocabularywordviewed: require('../_models/vocabularywordviewed.model'),
  Vocabularysentenceviewed: require('../_models/vocabularysentenceviewed.model'),
  Vocabularyword: require('../_models/vocabularyword.model'),
  Vocabularysentence: require('../_models/vocabularysentence.model'),
  Englishspeechviewed: require('../_models/englishspeechviewed.model'),
  Audiotextbookviewed: require('../_models/audiotextbookviewed.model'),
  Audiotextbookplayed: require('../_models/audiotextbookplayed.model'),
  Audiotextbooklike: require('../_models/audiotextbooklike.model'),
  Audiotextbookcomment: require('../_models/audiotextbookcomment.model'),
  Lessoncompetency: require('../_models/lessoncompetency.model'),
  Tv_user_progress:require("../_models/tv_user_progress.model"),
  Tv_lesson_progress:require("../_models/tv_lesson_progress.model"),
  Tv_assessment_progress:require("../_models/tv_assessment_progress.model"),
  Tv_stories_progress:require("../_models/tv_stories_progress.model"),
  Tv_qr_scan:require("../_models/tv_qr_scan.model"),  
  Teacherstvrank:require("../_models/teacherstvrank.model"),
};
