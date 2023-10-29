const config = require('../config.json');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const ObjectId = require('mongodb').ObjectId;
const get_current_user = commonmethods.get_current_user;
const User = db.User;
const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;
const State = db.State;
const Lesson = db.Lesson;
const Stream = db.Stream;
const Video = db.Video;
const Audiotextbook = db.Audiotextbook;
const Audio = db.Audio;
const Kit = db.Kit;
const Document = db.Document;
const Scertsolution = db.Scertsolution;
const Sssvideolike = db.Sssvideolike;
const Statecertificate = db.Statecertificate;
const Userdevice = db.Userdevice;
const Unlockedlesson = db.Unlockedlesson;
const Sssvideoviewed = db.Sssvideoviewed;
const Lessonprogress = db.Lessonprogress;
const Englishspeech = db.Englishspeech;
const Vocabularyword = db.Vocabularyword;
const Vocabularysentence = db.Vocabularysentence;
const Englishspeechviewed = db.Englishspeechviewed;
const Tv_user_progress = db.Tv_user_progress;
const Tv_lesson_progress = db.Tv_lesson_progress;
const Tv_assessment_progress = db.Tv_assessment_progress;
const Tv_stories_progress = db.Tv_stories_progress;
const District = db.District;
const Block = db.Block;
const Cluster = db.Cluster;
const School = db.School;
const Sparkle = db.Usersparkle;
const Tv_qr_scan = db.Tv_qr_scan;
// const AssessmentQuestion = db.Assessmentquestion;
// const Assessment = db.Assessment;

const b = 'https://sss.samparksmartshala.org/sss/';

var { promisify } = require('util');
var url = require('url');
var http = require('http');
var https = require('https');
var path = require('path');
var _ = require('underscore');
let TinyURL = require('tinyurl');
let q = require('q');
const { Console } = require('console');
var objectId = require("mongoose").Types.ObjectId;
var _ = require("underscore");

module.exports = {
  getAll,
  getAllbyDepartmentSubject,
  getById,
  getList,
  getLessons,
  create,
  update,
  edit,
  search,
  delete: _delete,
  postLessonsDetails,
  syncQRCode
};

async function getDimension(imagePath) {
  let probe = require('probe-image-size');
  let defer = require('q').defer();
  let inputimage = imagePath;
  try {
    await probe(inputimage)
      .then((dimensions) => {
        let dimension = {};
        dimension['width'] = dimensions.width;
        dimension['height'] = dimensions.height;
        defer.resolve(dimension);
      })
      .catch((err) => {
        console.error(err);
        let dimension = {};
        dimension['width'] = 0; //dimensions.width;
        dimension['height'] = 0; //dimensions.height;
        defer.resolve(dimension);
        //defer.reject(err)
      });
  } catch (err) {
    console.error(err);
    //    defer.reject(err)
    let dimension = {};
    dimension['width'] = 0; //dimensions.width;
    dimension['height'] = 0; //dimensions.height;
    defer.resolve(dimension);
  }
  return defer.promise;
}

async function postLessonsDetails(req) {
  try {
    console.log(req.body)
    const device_id = req.body.device_id; // taking device_id from body for now
    let data = req.body.data
    for (let d = 0; d < data.length; d++) {
      var class_id = req.body.data[d].id.trim();
      var class_name = req.body.data[d].name.trim();
      var subjects = req.body.data[d].subjects;
      if (!subjects || subjects.length === 0) return 'plese provide subjects' // if we did not get subjects
      else {
        subjects.map(async (item) => {
          let subject_id = item.id.trim();
          let subject_name = item.name.trim();
          let completed_lessons = item.completed ? item.completed : 0; // if we did not get completed_lesson
          let total_lesson = item.total ? item.total : 0; // if we did not get total_lesson
          const exist_user_progress = await Tv_user_progress.find({
            device_id,
            class_id,
            subject_id,
          });
          if (exist_user_progress.length === 0) {
            var user_progress = new Tv_user_progress({
              device_id,
              class_id,
              class_name,
              subject_id,
              subject_name,
              total_lesson,
              completed_lessons,
              user_dise_code,
            });
            await user_progress.save();
            if (item.lessons) {
              for (let i = 0; i < item.lessons.length; i++) {
                let lesson_id = item.lessons[i].id.trim();
                let lesson_name = item.lessons[i].name.trim();
                let progress = item.lessons[i].progress
                  ? item.lessons[i].progress
                  : 0;
                let resources = item.lessons[i].resources
                  ? item.lessons[i].resources
                  : 0;
                var lesson_progress = new Tv_lesson_progress({
                  device_id,
                  class_id,
                  class_name,
                  subject_id,
                  subject_name,
                  lesson_id,
                  lesson_name,
                  progress,
                  resources,
                });
                await lesson_progress.save();
              }
            }
            if (item.assessments) {
              for (let i = 0; i < item.assessments.length; i++) {
                let assessment_id = item.assessments[i].id.trim();
                let assessment_name = item.assessments[i].name.trim();
                let percentage = item.assessments[i].percentage
                  ? item.assessments[i].percentage
                  : 0;
                var assessment_progress = new Tv_assessment_progress({
                  device_id,
                  class_id,
                  class_name,
                  subject_id,
                  subject_name,
                  assessment_id,
                  assessment_name,
                  percentage,
                });
                await assessment_progress.save();
              }
            }
            if (item.stories) {
              for (let i = 0; i < item.stories.length; i++) {
                let storie_id = item.stories[i].id.trim();
                let storie_name = item.stories[i].name.trim();
                let points = item.stories[i].points ? item.stories[i].points : 0;
                var storie_progress = new Tv_stories_progress({
                  device_id,
                  class_id,
                  class_name,
                  subject_id,
                  subject_name,
                  storie_id,
                  storie_name,
                  points,
                });
                await storie_progress.save();
              }
            }
          } else {
            let user = exist_user_progress[0];
            if (
              user.total_lesson !== total_lesson ||
              user.completed_lessons !== completed_lessons
            ) {
              user.total_lesson = total_lesson;
              user.completed_lessons = completed_lessons;
              await user.save();
            }
            if (item.lessons) {
              for (let i = 0; i < item.lessons.length; i++) {
                let lesson = item.lessons[i];
                let lesson_id = item.lessons[i].id.trim();
                let lesson_name = item.lessons[i].name.trim();
                let progress = item.lessons[i].progress
                  ? item.lessons[i].progress
                  : 0;
                let resources = item.lessons[i].resources
                  ? item.lessons[i].resources
                  : 0;
                const exist_lesson_progress = await Tv_lesson_progress.find({
                  device_id,
                  class_id,
                  subject_id,
                  lesson_id,
                });
                if (exist_lesson_progress.length === 0) {
                  var lesson_progress = new Tv_lesson_progress({
                    device_id,
                    class_id,
                    class_name,
                    subject_id,
                    subject_name,
                    lesson_id,
                    lesson_name,
                    progress,
                    resources,
                  });
                  await lesson_progress.save();
                } else {
                  let exist_lesson = exist_lesson_progress[0];
                  if (
                    exist_lesson.progress !== progress ||
                    exist_lesson.resources !== resources
                  ) {
                    exist_lesson.progress = progress;
                    exist_lesson.resources = resources;
                    await exist_lesson.save();
                  }
                }
              }
            }
            if (item.assessments) {
              for (let i = 0; i < item.assessments.length; i++) {
                let assessment = item.assessments[i];
                let assessment_id = item.assessments[i].id.trim();
                let assessment_name = item.assessments[i].name.trim();
                let percentage = item.assessments[i].percentage
                  ? item.assessments[i].percentage
                  : 0;
                const exist_assessment_progress =
                  await Tv_assessment_progress.find({
                    device_id,
                    class_id,
                    subject_id,
                    assessment_id,
                  });
                if (exist_assessment_progress.length === 0) {
                  var assessment_progress = new Tv_assessment_progress({
                    device_id,
                    class_id,
                    class_name,
                    subject_id,
                    subject_name,
                    assessment_id,
                    assessment_name,
                    percentage,
                  });
                  await assessment_progress.save();
                } else {
                  let exist_assessment = exist_assessment_progress[0];
                  if (exist_assessment.percentage !== percentage) {
                    exist_assessment.percentage = percentage;
                    await exist_assessment.save();
                  }
                }
              }
            }
            if (item.stories) {
              for (let i = 0; i < item.stories.length; i++) {
                let storie = item.stories[i];
                let storie_id = item.stories[i].id.trim();
                let storie_name = item.stories[i].name.trim();
                let points = item.stories[i].points ? item.stories[i].points : 0;
                const exist_stories_progress = await Tv_stories_progress.find({
                  device_id,
                  class_id,
                  subject_id,
                  storie_id,
                });
              //   console.log({exist_stories_progress})
                if (exist_stories_progress.length === 0) {
                  var storie_progress = new Tv_stories_progress({
                    device_id,
                    class_id,
                    class_name,
                    subject_id,
                    subject_name,
                    storie_id,
                    storie_name,
                    points,
                  });
                  await storie_progress.save();
                } else {
                  let exist_storie = exist_stories_progress[0];
                  if (exist_storie.points !== points) {
                    exist_storie.points = points;
                    await exist_storie.save();
                  }
                }
              }
            }
          }
        });
      }
    }
    return "created successfuly"
  } catch (error) {
    console.log(error);
    return error
  }
}

async function getAll(req) {
  let draw = req.body.draw;
  let start = req.body.start;
  //sort_order = 'desc'
  let totallessons = await Lesson.find().count();
  let filteredlessons = totallessons;
  let lessons = {};
  let sort = {};
  let sort_column = req.body.order[0]['column'];
  let sort_order = req.body.order[0]['dir'];

  if (sort_column == 0) {
    sort['name'] = sort_order == 'asc' ? 1 : -1;
  } else if (sort_column == 2) {
    sort['subject.name'] = sort_order == 'asc' ? 1 : -1;
  } else if (sort_column == 3) {
    sort['department.name'] = sort_order == 'asc' ? 1 : -1;
  }

  if (req.body.search.value != '') {
    let searchstring = req.body.search.value;
    let query = {};
    let querysearch = {};
    let queryor = {};
    query['$or'] = [];

    querysearch['name'] = new RegExp(searchstring, 'i');
    queryor['name'] = new RegExp(searchstring, 'i');
    query['$or'].push(queryor);
    queryor = {};
    queryor['description'] = new RegExp(searchstring, 'i');
    query['$or'].push(queryor);
    let subjectsdata = await Subjectmaster.find(querysearch);
    let subjectids = [];
    for (const subject of subjectsdata) {
      subjectids.push(subject.id);
    }

    if (subjectids.length > 0) {
      let querysearchor = {};
      querysearchor['subject'] = {};
      querysearchor['subject']['$in'] = subjectids;
      query['$or'].push(querysearchor);
    }
    let departmentsdata = await Departmentmaster.find(querysearch);
    let departmentids = [];
    for (const department of departmentsdata) {
      departmentids.push(department.id);
    }
    querysearch['$or'] = [];
    if (departmentids.length > 0) {
      let querysearchor = {};
      querysearchor['department'] = {};
      querysearchor['department']['$in'] = departmentids;
      query['$or'].push(querysearchor);
    }
    let querysearchor = {};
    if ('sampark smart shala'.startsWith(searchstring.toLowerCase())) {
      querysearchor['section'] = 'sss';
      query['$or'].push(querysearchor);
    } else if ('govt text book'.startsWith(searchstring.toLowerCase())) {
      querysearchor['section'] = 'govt';
      query['$or'].push(querysearchor);
    }
    filteredlessons = await Lesson.find(query).count();

    if (sort_order == 'asc')
      lessons = await Lesson.find(query)
        .populate('subject', 'name')
        .populate('department', 'name')
        .sort(sort)
        .limit(req.body.length)
        .skip(start);
    else
      lessons = await Lesson.find(query)
        .populate('subject', 'name')
        .populate('department', 'name')
        .sort(sort)
        .limit(req.body.length)
        .skip(start);
  } else {
    if (sort_order == 'asc')
      lessons = await Lesson.find()
        .populate('subject', 'name')
        .populate('department', 'name')
        .sort(sort)
        .limit(req.body.length)
        .skip(start);
    else
      lessons = await Lesson.find()
        .populate('subject', 'name')
        .populate('department', 'name')
        .sort(sort)
        .limit(req.body.length)
        .skip(start);
  }

  let return_data = {};
  let lesson_listing = [];
  for (const lessondata of lessons) {
    let lesson = {};
    lesson['id'] = lessondata['_id'];
    lesson['name'] = lessondata['name'];
    lesson['section'] = lessondata['section'];
    lesson['subject'] = lessondata['subject']['name'];
    lesson['department'] = lessondata['department']['name'];
    lesson['states'] = lessondata['states'];
    lesson['lesson_no'] = lessondata['lesson_no'];
    lesson['is_active'] = lessondata['is_active'];
    lesson_listing.push(lesson);
  }
  return_data['data'] = lesson_listing;
  return_data['draw'] = draw;
  return_data['recordsFiltered'] = filteredlessons;
  return_data['recordsTotal'] = totallessons;
  return return_data;
}

async function search(searchstring, device_id, userid) {
  var query = {};
  var querysearch = {};
  var queryor = {};

  querysearch['fullName'] = new RegExp(searchstring, 'i');
  var usersdata = await User.find(querysearch);
  var userids = [];
  for (var i = 0; i < usersdata.length; i++) {
    userids.push(usersdata[i].id);
  }
  var querysearch = {};
  querysearch['module'] = 'sss';
  var querysearchor = {};
  querysearch['$or'] = [];
  if (userids.length > 0) {
    querysearchor['author'] = {};
    querysearchor['author']['$in'] = userids;
    querysearch['$or'].push(querysearchor);
  }

  querysearchor = {};
  querysearchor['description'] = new RegExp(searchstring, 'i');
  querysearch['$or'].push(querysearchor);
  querysearchor = {};
  querysearchor['name'] = new RegExp(searchstring, 'i');
  querysearch['$or'].push(querysearchor);

  var queryor = {};
  query['$or'] = [];
  sssvideowatched = [];
  sssvideolikes = [];
  sssvideoviews = [];
  videos = await Video.find(querysearch);

  if (videos.length > 0) {
    if (userid !== '') {
      userlikes = await Sssvideoviewed.find({ user: userid });
      for (var i = 0; i < userlikes.length; i++) {
        sssvideowatched[userlikes[i]['video']] = true;
      }

      userlikes = await Sssvideolike.find({ user: userid }).select(
        'video is_liked'
      );
      for (var i = 0; i < userlikes.length; i++) {
        sssvideolikes[userlikes[i]['video']] = userlikes[i]['is_liked'];
      }
    }
    var samparkvideos = [];

    for (var i = 0; i < videos.length; i++) {
      var samparkvideo = {};
      samparkvideo['name'] = videos[i]['name'];
      samparkvideo['description'] = videos[i]['description'];

      if (sssvideolikes.hasOwnProperty(videos[i]['id'])) {
        samparkvideo['is_liked'] = sssvideolikes[videos[i]['id']]
          ? sssvideolikes[videos[i]['id']]
          : '';
      } else {
        samparkvideo['is_liked'] = '';
      }

      samparkvideo['watched'] = '';
      if (sssvideowatched.hasOwnProperty(videos[i]['id'])) {
        samparkvideo['watched'] = true;
      }

      samparkvideo['is_shareable'] = true;
      samparkvideo['likecount'] = videos[i]['likecount'];
      samparkvideo['commentcount'] = videos[i]['commentcount'];
      samparkvideo['streamtype'] = 'sssvideo';

      samparkvideo['id'] = videos[i]['id'];
      samparkvideo['url'] =
        config.repositoryHost +
        'samparkvideos/' +
        videos[i]['module'] +
        '/' +
        videos[i]['url'];
      samparkvideo['video_code'] = videos[i]['video_code'];
      var duration = '';
      if (
        videos[i]['duration_min'] != '' &&
        videos[i]['duration_min'] != null
      ) {
        duration = videos[i]['duration_min'] + ' Mins ';
      }
      if (
        videos[i]['duration_sec'] != '' &&
        videos[i]['duration_sec'] != null
      ) {
        duration = duration + videos[i]['duration_sec'] + ' Secs';
      }
      samparkvideo['passing_duration'] = config.video_passing_percentage;
      samparkvideo['duration'] = duration;

      samparkvideo['views'] = videos[i]['viewcount'];
      if (videos[i]['thumbnail'] != '' && videos[i]['thumbnail'] != 'null') {
        samparkvideo['thumbnail'] =
          config.repositoryHost + videos[i]['thumbnail'];
      } else {
        samparkvideo['thumbnail'] =
          'https://img.youtube.com/vi/' +
          videos[i]['video_code'] +
          '/hqdefault.jpg';
      }
      samparkvideos.push(samparkvideo);
    }
  }

  user_streams = {};
  user_streams['streams'] = samparkvideos;
  user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
  return user_streams;
}

async function secondsToHms(d) {
  d = Number(d);
  var h = Math.floor(d / 3600);
  var m = Math.floor((d % 3600) / 60);

  var hDisplay = h > 0 ? h + (h == 1 ? ' घंटे ' : ' घंटे ') : '';
  //var mDisplay1 = m > 0 ? ", " : "";
  var mDisplay1 = '';
  var mDisplay = m > 0 ? m + (m == 1 ? ' मिनट ' : ' मिनट ') : '';
  return hDisplay + mDisplay1 + mDisplay;
}

/* Fetch List of lessons starts
 * userid = fetch lessons for logged in user
 * device_id = user's device_id for notification
 * apk_version = current installed application version
 */
// Add index on module column for subjectmasters collection
// Add index on device_id and user columns for Userdevice collection
// Add index on state & department columns for statecertificates collection
// Add index on is_verified, is_new and pincode in user collection
// Add index on subjects column for Departmentmaster collection
// Add index on subject, department, states, section, is_active for Lessons collection
// Add user column for Lessonprogress collection

async function getLessons(
  state_id,
  department_id,
  userid,
  device_id,
  apk_version
) {
  try {
    if (state_id == '') throw 'Please provide state';

    if (department_id == '') throw 'Please provide class';

    let subject_query = {};
    let querylesson = {};
    let subjects = [];
    let curUserState = '0';
    let curUserStateId = '0';
    let user_hours = {};
    let certificate_hours = {};
    subject_query['module'] = 'sss';

    querylesson['department'] = department_id;
    querylesson['states'] = state_id;
    querylesson['section'] = 'sss';
    querylesson['is_active'] = true;

    // Fetch id, name from Subjectmaster collection
    const subjectmasters = await Subjectmaster.find(subject_query).select(
      'id name'
    );

    console.log(subjectmasters);
    // fetch lessons from lessons collection and select only required fields
    var lessons = await Lesson.find(querylesson, {
      subject: 1,
      section: 1,
      name: 1,
      kits: 1,
      videos: 1,
      audios: 1,
      baithak_videos: 1,
      activities: 1,
      scert_solutions: 1,
      assessment: 1,
      worksheet: 1,
      progress_chart: 1,
      assessmentId: 1,
      boloId: 1,
      audiotextbooks: 1,
    }).sort({ lesson_no: 1 });
    let temp_lesson_no = 0;
    let department_total_progress = 0;
    let samparklessons = [];
    for (var k = 0; k < lessons.length; k++) {
      var lesson = {};
      temp_lesson_no = temp_lesson_no + 1;

      let subjectDetails = _.where(subjectmasters, {
        id: lessons[k]['subject'].toString(),
      });

      lesson['subject'] = subjectDetails[0]['_id'];
      lesson['subjectName'] = subjectDetails[0].name;
      lesson['class'] = department_id;
      lesson['className'] = 'ddd'; //departmentmasters[j].name;
      lesson['isGovt'] = false;
      lesson['url'] = 'lessonThumbnail.png';
      lesson['stateId'] = state_id;

      lesson['id'] = lessons[k]['id'];
      lesson['name'] = lessons[k]['name'];
      lesson['progress'] = 0;

      if (userid !== '') {
        checkprogresslesson = await Lessonprogress.find(
          { lesson: lessons[k]['id'], user: userid },
          { progress: 1 }
        );
        if (checkprogresslesson.length == 1) {
          lesson['progress'] = checkprogresslesson[0]['progress'];
        }
      }
      lesson['resources'] = 0;
      lesson['audios'] = 0;
      lesson['sort_order'] = temp_lesson_no;

      if (
        lessons[k]['kits'] !== undefined &&
        lessons[k]['kits'] !== null &&
        (lessons[k]['kits'].length > 1 ||
          (lessons[k]['kits'].length == 1 && lessons[k]['kits'][0] !== ''))
      ) {
        lesson['resources'] = lesson['resources'] + lessons[k]['kits'].length;
      }
      if (
        lessons[k]['videos'] !== undefined &&
        lessons[k]['videos'] !== null &&
        (lessons[k]['videos'].length > 1 ||
          (lessons[k]['videos'].length == 1 && lessons[k]['videos'][0] !== ''))
      ) {
        lesson['resources'] = lesson['resources'] + lessons[k]['videos'].length;
        const firstVideo = await Video.findById(lessons[k]['videos'][0]);
        lesson['url'] = config.repositoryHost + firstVideo['thumbnail'];
      } else {
        if (
          lessons[k]['audiotextbooks'] !== undefined &&
          lessons[k]['audiotextbooks'] !== null &&
          (lessons[k]['audiotextbooks'].length > 1 ||
            (lessons[k]['audiotextbooks'].length == 1 &&
              lessons[k]['audiotextbooks'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['audiotextbooks'].length;
          const firstAudiotextbook = await Audiotextbook.findById(
            lessons[k]['audiotextbooks'][0]
          );
          lesson['url'] =
            config.repositoryHost + firstAudiotextbook['thumbnail'];
        }
      }
      if (
        lessons[k]['audios'] !== undefined &&
        lessons[k]['audios'] !== null &&
        (lessons[k]['audios'].length > 1 ||
          (lessons[k]['audios'].length == 1 && lessons[k]['audios'][0] !== ''))
      ) {
        lesson['resources'] = lesson['resources'] + lessons[k]['audios'].length;
        lesson['audios'] = lessons[k]['audios'].length;
        if (lessons[k]['section'] == 'sss') {
          audios_available = true;
        }
      }
      if (
        lessons[k]['baithak_videos'] !== undefined &&
        lessons[k]['baithak_videos'] !== null &&
        (lessons[k]['baithak_videos'].length > 1 ||
          (lessons[k]['baithak_videos'].length == 1 &&
            lessons[k]['baithak_videos'][0] !== ''))
      ) {
        lesson['resources'] =
          lesson['resources'] + lessons[k]['baithak_videos'].length;
      }
      if (
        lessons[k]['activities'] !== undefined &&
        lessons[k]['activities'] !== null &&
        (lessons[k]['activities'].length > 1 ||
          (lessons[k]['activities'].length == 1 &&
            lessons[k]['activities'][0] !== ''))
      ) {
        lesson['resources'] =
          lesson['resources'] + lessons[k]['activities'].length;
      }
      if (
        lessons[k]['scert_solutions'] !== undefined &&
        lessons[k]['scert_solutions'] !== null &&
        (lessons[k]['scert_solutions'].length > 1 ||
          (lessons[k]['scert_solutions'].length == 1 &&
            lessons[k]['scert_solutions'][0] !== ''))
      ) {
        scert_solutionid = lessons[k]['scert_solutions'];
        scert_solutions = await Scertsolution.find({
          _id: { $in: scert_solutionid },
        });
        if (scert_solutions.length > 0) {
          for (l = 0; l < scert_solutions.length; l++) {
            if (scert_solutions[l]['states'].indexOf(curUserState) !== -1) {
              var query_scert = {};
              query_scert['user'] = userid;
              query_scert['scertsolution'] = {};
              query_scert['scertsolution'] = scert_solutions[l]['_id'];
              lesson['resources'] = lesson['resources'] + 1;
            }
          }
        }
      }
      if (
        lessons[k]['assessment'] !== undefined &&
        lessons[k]['assessment'] !== null &&
        lessons[k]['assessment'] !== ''
      ) {
        lesson['resources'] = lesson['resources'] + 1;
      }
      if (
        lessons[k]['worksheet'] !== undefined &&
        lessons[k]['worksheet'] !== null &&
        lessons[k]['worksheet'] !== ''
      ) {
        lesson['resources'] = lesson['resources'] + 1;
      }
      if (
        lessons[k]['progress_chart'] !== undefined &&
        lessons[k]['progress_chart'] !== null &&
        lessons[k]['progress_chart'] !== ''
      ) {
        lesson['resources'] = lesson['resources'] + 1;
      }
      if (
        lessons[k]['assessmentId'] !== undefined &&
        lessons[k]['assessmentId'] !== null &&
        lessons[k]['assessmentId'] !== ''
      ) {
        lesson['resources'] = lesson['resources'] + 1;
      }
      if (
        lessons[k]['boloId'] !== undefined &&
        lessons[k]['boloId'] !== null &&
        lessons[k]['boloId'] !== ''
      ) {
        lesson['resources'] = lesson['resources'] + 1;
      }
      department_total_progress =
        department_total_progress + lesson['progress'];
      samparklessons.push(lesson);
    }

    return samparklessons;
  } catch (e) {
    console.log(e);
    return e;
  }
}
/* Fetch List of lessons ends */

/* Fetch List of lessons starts
 * userid = fetch lessons for logged in user
 * device_id = user's device_id for notification
 * apk_version = current installed application version
 */
// Add index on module column for subjectmasters collection
// Add index on device_id and user columns for Userdevice collection
// Add index on state & department columns for statecertificates collection
// Add index on is_verified, is_new and pincode in user collection
// Add index on subjects column for Departmentmaster collection
// Add index on subject, department, states, section, is_active for Lessons collection
// Add user column for Lessonprogress collection

async function getList(userid, device_id, apk_version) {
  var subject_query = {};
  var querylesson = {};
  var subjects = [];
  var curUserState = '0';
  var curUserStateId = '0';
  var user_hours = {};
  var certificate_hours = {};
  subject_query['module'] = 'sss';

  // Fetch id, name from Subjectmaster collection
  const subjectmasters = await Subjectmaster.find(subject_query, {
    id: 1,
    name: 1,
    banner: 1,
    color1: 1,
    color2: 1,
    color3: 1,
    flnClassBg: 1,
  });
  for (var i = 0; i < subjectmasters.length; i++) {
    user_hours[subjectmasters[i].id] = 0;
  }

  // If user logged in condition starts
  if (userid !== '') {
    curUser = await User.find({ _id: userid });
    // if logged in user found in database
    if (curUser.length == 1) {
      curUser = curUser[0];
      curUserState = curUser.state;
      checkstate = await State.findById(curUserState, { is_active: 1 });

      //return curUserStateId
      if (checkstate && checkstate['is_active']) {
        curUserStateId = curUserState['_id'];
      } else {
        curUserState = '0';
        curUserStateId = '0';
      }
    }

    // return user spent time to view sss videos
    const uservideoviewed = await Sssvideoviewed.find({
      user: userid,
    }).populate('video', 'subject duration_min duration_sec');
    for (const uservideoview of uservideoviewed) {
      if (
        uservideoview['video'] !== null &&
        uservideoview['video']['subject'] !== null
      )
        user_hours[uservideoview['video']['subject']] =
          uservideoview['video']['duration_min'] * 60 +
          uservideoview['video']['duration_sec'];
    }

    // if api_version is not passed in parameters,
    if (!apk_version) {
      let curUserDevice = await Userdevice.find(
        { user: userid },
        { apk_version: 1 }
      ).sort({ last_active_on: -1 });
      apk_version = curUserDevice[0] ? curUserDevice[0].apk_version : 4.9;
    }
  }
  // If user logged in condition ends

  // if apk_version is not passed, decide it based on device_id of the user
  if (!apk_version) {
    let curUserDevice = await Userdevice.find(
      { device_id: device_id },
      { apk_version: 1 }
    ).sort({ last_active_on: -1 });
    apk_version = curUserDevice[0] ? curUserDevice[0].apk_version : 4.9;
  }

  // If current user has state or not,, calculate certificate hours
  if (curUserStateId != '0') {
    const state_certificates = await Statecertificate.find(
      { state: curUserStateId, department: null },
      { subject: 1, total_duration: 1 }
    );
    for (const state_certificate of state_certificates) {
      certificate_hours[state_certificate.subject] =
        state_certificate.total_duration * 60 * 60 -
        user_hours[state_certificate.subject];
    }
  } else {
    for (var i = 0; i < subjectmasters.length; i++) {
      certificate_hours[subjectmasters[i].id] = 0;
    }
    const state_certificates = await Statecertificate.find(
      { department: null },
      { subject: 1, total_duration: 1 }
    );
    for (const state_certificate of state_certificates) {
      if (
        certificate_hours[state_certificate.subject] <
        state_certificate.total_duration
      )
        certificate_hours[state_certificate.subject] =
          state_certificate.total_duration * 60 * 60;
    }
  }

  // Find total registered users which are verified, not new and has pincode
  // const totalregisteredusers = await User.countDocuments({ is_verified: true, is_new: false, pincode: { "$ne": "" } });

  // Removed is_verified & pincode - Pratik N
  const totalregisteredusers = await User.countDocuments({ is_new: false });

  // Loop through subject master to create both sss lessons & govt lessons object
  for (var i = 0; i < subjectmasters.length; i++) {
    var subject = {};
    var sampark_classes = [];
    var govt_classes = [];
    var sampark_indexes = {};
    var temp_lesson_no = 0;

    subject['id'] = subjectmasters[i].id;
    subject['name'] = subjectmasters[i].name;
    subject['message1'] =
      parseInt(totalregisteredusers) * 1 + ' Teachers are watching this today';

    let color1 = subjectmasters[i].color1 != '' ? subjectmasters[i].color1 : '';
    let color2 = subjectmasters[i].color2 != '' ? subjectmasters[i].color2 : '';
    let color3 = subjectmasters[i].color2 != '' ? subjectmasters[i].color3 : '';
    let flnClassBg =
      subjectmasters[i].flnClassBg != '' ? subjectmasters[i].flnClassBg : '';

    subject['color1'] = color1;
    subject['color2'] = color2;
    subject['color3'] = color3;
    subject['flnClassBg'] = flnClassBg;

    if (certificate_hours.hasOwnProperty(subjectmasters[i].id)) {
      var hour_message = await secondsToHms(
        certificate_hours[subjectmasters[i].id]
      );
      subject['message2'] =
        'Sampark Smart Shala ' +
        subjectmasters[i].name +
        ' certified शिक्षक बनने  में ' +
        hour_message +
        'बचे हैं |';
    } else subject['message2'] = '';

    subject['icon'] =
      apk_version < 4.8
        ? subjectmasters[i].name.toLowerCase() + '.png'
        : config.assetHost + subjectmasters[i].name.toLowerCase() + '.png';
    //subject["icon_active"] = config.assetHost + "big-" + subjectmasters[i].name.toLowerCase() + ".png";
    subject['icon_active'] =
      config.assetHost + '' + subjectmasters[i].name.toLowerCase() + '.png';
    subject['banner'] = config.repositoryHost + '' + subjectmasters[i].banner;
    subject_query['subjects'] = subjectmasters[i].id;

    // Fetch departmentmasters name
    var departmentmasters = await Departmentmaster.find(subject_query, {
      name: 1,
      is_fln: 1,
      sort_order: 1,
    }).sort({ sort_order: 1 });

    //sampark classes and lessons
    for (var j = 0; j < departmentmasters.length; j++) {
      var department = {};
      var searchMask = ' ';
      var regEx = new RegExp(searchMask, 'ig');
      var replaceMask = '';
      var samparklessons = [];
      var audios_available = false;
      var department_total_progress = 0;
      temp_lesson_no = 0;

      department['id'] = departmentmasters[j]['id'];
      department['name'] = departmentmasters[j]['name'];
      sampark_indexes[departmentmasters[j]['id']] = j;

      department['icon'] =
        apk_version < 4.8
          ? departmentmasters[j].name
              .toLowerCase()
              .replace(regEx, replaceMask) +
            '-' +
            subjectmasters[i].name.toLowerCase() +
            '.png'
          : config.assetHost +
            departmentmasters[j].name
              .toLowerCase()
              .replace(regEx, replaceMask) +
            '-' +
            subjectmasters[i].name.toLowerCase() +
            '.png';
      department['icon_active'] =
        config.assetHost +
        'big-' +
        departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask) +
        '-' +
        subjectmasters[i].name.toLowerCase() +
        '.png';

      // added by Milap for is_fln flag
      if (departmentmasters[j]['is_fln'] == true) {
        department['is_fln'] = true;
      } else {
        department['is_fln'] = false;
      }
      department['sort_order'] = departmentmasters[j]['sort_order'];
      // added by Milap for is_fln flag

      querylesson['subject'] = subjectmasters[i].id;
      querylesson['department'] = departmentmasters[j].id;
      querylesson['states'] = curUserStateId.toString();
      querylesson['section'] = 'sss';
      querylesson['is_active'] = true;

      // fetch lessons from lessons collection and select only required fields
      var lessons = await Lesson.find(querylesson, {
        section: 1,
        name: 1,
        kits: 1,
        videos: 1,
        audios: 1,
        baithak_videos: 1,
        activities: 1,
        scert_solutions: 1,
        assessment: 1,
        worksheet: 1,
        progress_chart: 1,
        assessmentId: 1,
        boloId: 1,
        audiotextbooks: 1,
      }).sort({ lesson_no: 1 });

      for (var k = 0; k < lessons.length; k++) {
        var lesson = {};
        temp_lesson_no = temp_lesson_no + 1;

        lesson['subject'] = subjectmasters[i].id;
        lesson['subjectName'] = subjectmasters[i].name;
        lesson['class'] = departmentmasters[j].id;
        lesson['className'] = departmentmasters[j].name;
        lesson['isGovt'] = false;
        lesson['url'] = 'lessonThumbnail.png';
        lesson['stateId'] = curUserStateId.toString();

        lesson['id'] = lessons[k]['id'];
        lesson['name'] = lessons[k]['name'];
        lesson['progress'] = 0;

        if (userid !== '') {
          checkprogresslesson = await Lessonprogress.find(
            { lesson: lessons[k]['id'], user: userid },
            { progress: 1 }
          );
          if (checkprogresslesson.length == 1) {
            lesson['progress'] = checkprogresslesson[0]['progress'];
          }
        }
        lesson['resources'] = 0;
        lesson['audios'] = 0;
        lesson['sort_order'] = temp_lesson_no;

        if (
          lessons[k]['kits'] !== undefined &&
          lessons[k]['kits'] !== null &&
          (lessons[k]['kits'].length > 1 ||
            (lessons[k]['kits'].length == 1 && lessons[k]['kits'][0] !== ''))
        ) {
          lesson['resources'] = lesson['resources'] + lessons[k]['kits'].length;
        }
        if (
          lessons[k]['videos'] !== undefined &&
          lessons[k]['videos'] !== null &&
          (lessons[k]['videos'].length > 1 ||
            (lessons[k]['videos'].length == 1 &&
              lessons[k]['videos'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['videos'].length;
          const firstVideo = await Video.findById(lessons[k]['videos'][0]);
          lesson['url'] = config.repositoryHost + firstVideo['thumbnail'];
        } else {
          if (
            lessons[k]['audiotextbooks'] !== undefined &&
            lessons[k]['audiotextbooks'] !== null &&
            (lessons[k]['audiotextbooks'].length > 1 ||
              (lessons[k]['audiotextbooks'].length == 1 &&
                lessons[k]['audiotextbooks'][0] !== ''))
          ) {
            lesson['resources'] =
              lesson['resources'] + lessons[k]['audiotextbooks'].length;
            const firstAudiotextbook = await Audiotextbook.findById(
              lessons[k]['audiotextbooks'][0]
            );
            lesson['url'] =
              config.repositoryHost + firstAudiotextbook['thumbnail'];
          }
        }
        if (
          lessons[k]['audios'] !== undefined &&
          lessons[k]['audios'] !== null &&
          (lessons[k]['audios'].length > 1 ||
            (lessons[k]['audios'].length == 1 &&
              lessons[k]['audios'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['audios'].length;
          lesson['audios'] = lessons[k]['audios'].length;
          if (lessons[k]['section'] == 'sss') {
            audios_available = true;
          }
        }
        if (
          lessons[k]['baithak_videos'] !== undefined &&
          lessons[k]['baithak_videos'] !== null &&
          (lessons[k]['baithak_videos'].length > 1 ||
            (lessons[k]['baithak_videos'].length == 1 &&
              lessons[k]['baithak_videos'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['baithak_videos'].length;
        }
        if (
          lessons[k]['activities'] !== undefined &&
          lessons[k]['activities'] !== null &&
          (lessons[k]['activities'].length > 1 ||
            (lessons[k]['activities'].length == 1 &&
              lessons[k]['activities'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['activities'].length;
        }
        if (
          lessons[k]['scert_solutions'] !== undefined &&
          lessons[k]['scert_solutions'] !== null &&
          (lessons[k]['scert_solutions'].length > 1 ||
            (lessons[k]['scert_solutions'].length == 1 &&
              lessons[k]['scert_solutions'][0] !== ''))
        ) {
          scert_solutionid = lessons[k]['scert_solutions'];
          scert_solutions = await Scertsolution.find({
            _id: { $in: scert_solutionid },
          });
          if (scert_solutions.length > 0) {
            for (l = 0; l < scert_solutions.length; l++) {
              if (scert_solutions[l]['states'].indexOf(curUserState) !== -1) {
                var query_scert = {};
                query_scert['user'] = userid;
                query_scert['scertsolution'] = {};
                query_scert['scertsolution'] = scert_solutions[l]['_id'];
                lesson['resources'] = lesson['resources'] + 1;
              }
            }
          }
        }
        if (
          lessons[k]['assessment'] !== undefined &&
          lessons[k]['assessment'] !== null &&
          lessons[k]['assessment'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        if (
          lessons[k]['worksheet'] !== undefined &&
          lessons[k]['worksheet'] !== null &&
          lessons[k]['worksheet'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        if (
          lessons[k]['progress_chart'] !== undefined &&
          lessons[k]['progress_chart'] !== null &&
          lessons[k]['progress_chart'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        if (
          lessons[k]['assessmentId'] !== undefined &&
          lessons[k]['assessmentId'] !== null &&
          lessons[k]['assessmentId'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        if (
          lessons[k]['boloId'] !== undefined &&
          lessons[k]['boloId'] !== null &&
          lessons[k]['boloId'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        department_total_progress =
          department_total_progress + lesson['progress'];
        samparklessons.push(lesson);
      }

      department['lessons'] = samparklessons;
      department['progress'] = 0;
      department['department_total_progress'] = department_total_progress;
      department['lesson_count'] = samparklessons.length;
      department['audios_available'] = audios_available;

      if (samparklessons.length > 0) {
        sampark_classes.push(department);
        department['progress'] = parseInt(
          department_total_progress / samparklessons.length
        );
      }
    }

    //govt classes and lessons
    for (var j = 0; j < departmentmasters.length; j++) {
      var department = {};
      var searchMask = ' ';
      var regEx = new RegExp(searchMask, 'ig');
      var replaceMask = '';

      department['id'] = departmentmasters[j]['id'];
      department['sampark_index'] = sampark_indexes[departmentmasters[j]['id']];
      department['name'] = departmentmasters[j]['name'];
      department['icon'] =
        apk_version < 4.8
          ? departmentmasters[j].name
              .toLowerCase()
              .replace(regEx, replaceMask) +
            '-' +
            subjectmasters[i].name.toLowerCase() +
            '.png'
          : config.assetHost +
            departmentmasters[j].name
              .toLowerCase()
              .replace(regEx, replaceMask) +
            '-' +
            subjectmasters[i].name.toLowerCase() +
            '.png';
      department['icon_active'] =
        config.assetHost +
        'big-' +
        departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask) +
        '-' +
        subjectmasters[i].name.toLowerCase() +
        '.png';

      // added by Milap for is_fln flag
      if (departmentmasters[j]['is_fln'] == true) {
        department['is_fln'] = true;
      } else {
        department['is_fln'] = false;
      }
      department['sort_order'] = departmentmasters[j]['sort_order'];
      // added by Milap for is_fln flag

      querylesson['subject'] = subjectmasters[i].id;
      querylesson['department'] = departmentmasters[j].id;

      if (userid !== '') {
        querylesson['states'] = curUserStateId.toString();
      } else {
        querylesson['states'] = 'nostate';
      }
      querylesson['section'] = 'govt';
      querylesson['is_active'] = true;

      var lessons = await Lesson.find(querylesson, {
        lesson_no: 1,
        section: 1,
        name: 1,
        kits: 1,
        videos: 1,
        audios: 1,
        baithak_videos: 1,
        activities: 1,
        scert_solutions: 1,
        assessment: 1,
        worksheet: 1,
        progress_chart: 1,
        assessmentId: 1,
        boloId: 1,
      }).sort({ lesson_no: 1 });

      var govtlessons = [];
      var audios_available = false;

      temp_lesson_no = 0;
      department_total_progress = 0;

      for (var k = 0; k < lessons.length; k++) {
        var lesson = {};
        temp_lesson_no = temp_lesson_no + 1;

        lesson['subject'] = subjectmasters[i].id;
        lesson['subjectName'] = subjectmasters[i].name;
        lesson['class'] = departmentmasters[j].id;
        lesson['className'] = departmentmasters[j].name;
        lesson['isGovt'] = true;
        lesson['url'] = 'lessonThumbnail.png';
        lesson['stateId'] = curUserStateId.toString();

        lesson['id'] = lessons[k]['id'];
        lesson['name'] = lessons[k]['name'];
        lesson['progress'] = 0;
        if (userid !== '') {
          checkprogresslesson = await Lessonprogress.find({
            lesson: lessons[k]['id'],
            user: userid,
          });
          if (checkprogresslesson.length == 1) {
            lesson['progress'] = checkprogresslesson[0]['progress'];
          }
        }
        lesson['resources'] = 0;
        lesson['audios'] = 0;
        lesson['lesson_no'] = lessons[k]['lesson_no'];
        lesson['sort_order'] = temp_lesson_no;

        if (
          lessons[k]['kits'] !== undefined &&
          lessons[k]['kits'] !== null &&
          (lessons[k]['kits'].length > 1 ||
            (lessons[k]['kits'].length == 1 && lessons[k]['kits'][0] !== ''))
        ) {
          lesson['resources'] = lesson['resources'] + lessons[k]['kits'].length;
        }
        if (
          lessons[k]['videos'] !== undefined &&
          lessons[k]['videos'] !== null &&
          (lessons[k]['videos'].length > 1 ||
            (lessons[k]['videos'].length == 1 &&
              lessons[k]['videos'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['videos'].length;
          const firstVideo = await Video.findById(lessons[k]['videos'][0]);
          lesson['url'] = config.repositoryHost + firstVideo['thumbnail'];
        }
        if (
          lessons[k]['audios'] !== undefined &&
          lessons[k]['audios'] !== null &&
          (lessons[k]['audios'].length > 1 ||
            (lessons[k]['audios'].length == 1 &&
              lessons[k]['audios'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['audios'].length;
          lesson['audios'] = lessons[k]['audios'].length;
          if (lessons[k]['section'] !== 'sss') {
            audios_available = true;
          }
        }
        if (
          lessons[k]['baithak_videos'] !== undefined &&
          lessons[k]['baithak_videos'] !== null &&
          (lessons[k]['baithak_videos'].length > 1 ||
            (lessons[k]['baithak_videos'].length == 1 &&
              lessons[k]['baithak_videos'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['baithak_videos'].length;
        }
        if (
          lessons[k]['activities'] !== undefined &&
          lessons[k]['activities'] !== null &&
          (lessons[k]['activities'].length > 1 ||
            (lessons[k]['activities'].length == 1 &&
              lessons[k]['activities'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['activities'].length;
        }
        if (
          lessons[k]['scert_solutions'] !== undefined &&
          lessons[k]['scert_solutions'] !== null &&
          (lessons[k]['scert_solutions'].length > 1 ||
            (lessons[k]['scert_solutions'].length == 1 &&
              lessons[k]['scert_solutions'][0] !== ''))
        ) {
          lesson['resources'] =
            lesson['resources'] + lessons[k]['scert_solutions'].length;
        }
        if (
          lessons[k]['assessment'] !== undefined &&
          lessons[k]['assessment'] !== null &&
          lessons[k]['assessment'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        if (
          lessons[k]['worksheet'] !== undefined &&
          lessons[k]['worksheet'] !== null &&
          lessons[k]['worksheet'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        if (
          lessons[k]['progress_chart'] !== undefined &&
          lessons[k]['progress_chart'] !== null &&
          lessons[k]['progress_chart'] !== ''
        ) {
          lesson['resources'] = lesson['resources'] + 1;
        }
        department_total_progress =
          department_total_progress + lesson['progress'];
        govtlessons.push(lesson);
      }

      department['lessons'] = govtlessons;
      department['progress'] = 0;
      department['department_total_progress'] = 0;
      department['lesson_count'] = 0;
      department['audios_available'] = audios_available;

      if (govtlessons.length > 0) {
        department['department_total_progress'] = department_total_progress;
        department['lesson_count'] = govtlessons.length;
        department['progress'] = parseInt(
          department_total_progress / govtlessons.length
        );
        govt_classes.push(department);
      }
    }

    if (sampark_classes.length > 0)
      subject['sampark_classes'] = sampark_classes;
    else subject['sampark_classes'] = '';

    if (govt_classes.length > 0) subject['govt_classes'] = govt_classes;
    else subject['govt_classes'] = '';

    //Below condition to skip subject if no classess are available - Added by Pratik
    if (
      subject['sampark_classes'].length > 0 ||
      subject['govt_classes'].length > 0
    )
      subjects.push(subject);
  }
  return subjects;
}
/* Fetch List of lessons ends */

async function getAllbyDepartmentSubject(
  departmentname,
  subjectname,
  user,
  catgeory
) {
  var query = {};
  var queryCat = {};
  var lessonids = [];
  if (departmentname !== '') {
    query['department'] = departmentname;
  }
  if (subjectname !== '') {
    query['subject'] = subjectname;
  }
  query['is_active'] = true;

  //{"name":{$in:[1,2,3]}}
  //{"id":{"$in":["5d984b5f7d88841ce066910f"]}}

  var curUser = '';
  if (user !== '') {
    curUser = await User.find({ _id: user });
    if (curUser.length == 1) {
      curUser = curUser[0];
      curUserGroup = curUser.usertype;
      curUserState = curUser.state;
      //query["user_groups"] = curUserGroup;
      //query["states"] = curUserState;
    }
  }

  //limit(6).
  //lessons = await Lesson.find(query).populate('subject','name').populate('department','name').select('-hash');
  lessons = await Lesson.find(query)
    .populate('subject', 'name')
    .populate('department', 'name')
    .select(
      'id name thumbnail description subject department author url is_shareable sort_order lesson_code module likecount commentcount social_content'
    )
    .sort({ sort_order: 1 });
  lessonList = [];

  var fs = require('fs');
  for (var i = 0; i < lessons.length; i++) {
    lesson = {};

    lesson['id'] = lessons[i]['id'];
    lesson['is_shareable'] = lessons[i]['is_shareable'];
    lesson['description'] = lessons[i]['description'];
    lesson['social_content'] = lessons[i]['social_content'];
    lesson['author'] = lessons[i]['author'];
    lesson['name'] = lessons[i]['name'];
    lesson['subject'] = lessons[i]['subject'];
    lesson['department'] = lessons[i]['department'];

    var searchMask = 'class';
    var regEx = new RegExp(searchMask, 'ig');
    var replaceMask = '';

    if (lessons[i]['module'] == 'ssh') {
      lesson['sub_title'] =
        lessons[i]['subject']['name'] +
        ' ' +
        lessons[i]['department']['name'].replace(regEx, replaceMask);
    } else {
      if (lessons[i]['subject']['name'].toLowerCase() == 'english') {
        var lesson_string = 'Lesson';
      } else {
        var lesson_string = 'Lesson';
      }
      lesson['sub_title'] =
        lessons[i]['subject']['name'] +
        ' ' +
        lessons[i]['department']['name'].replace(regEx, replaceMask) +
        ' | ' +
        lesson_string +
        ' ' +
        lessons[i]['sort_order'];
    }
    lesson['lesson_code'] = lessons[i]['lesson_code'];
    lesson['sort_order'] = lessons[i]['sort_order'];
    try {
      if (
        lessons[i]['url'] != '' &&
        lessons[i]['url'] != 'null' &&
        lessons[i]['url'] != null &&
        fs.existsSync(
          config.uploadPath +
            'samparklessons/' +
            lessons[i]['module'] +
            '/' +
            lessons[i]['url']
        )
      ) {
        lesson['url'] =
          config.repositoryHost +
          'samparklessons/' +
          lessons[i]['module'] +
          '/' +
          lessons[i]['url'];
      } else {
        lesson['url'] = '';
      }
    } catch (err) {
      lesson['url'] = '';
    }
    lesson['width'] = '';
    lesson['height'] = '';
    try {
      if (
        lessons[i]['thumbnail'] != '' &&
        lessons[i]['thumbnail'] != 'null' &&
        lessons[i]['thumbnail'] != null &&
        fs.existsSync(config.uploadPath + lessons[i]['thumbnail'])
      ) {
        let dimensions = await getDimension(
          config.repositoryHost + lessons[i]['thumbnail']
        );
        lesson['width'] = dimensions['width'];
        lesson['height'] = dimensions['height'];
        lesson['thumbnail'] = config.repositoryHost + lessons[i]['thumbnail'];
      } else {
        lesson['thumbnail'] =
          'https://img.youtube.com/vi/' +
          lessons[i]['lesson_code'] +
          '/hqdefault.jpg';
      }
    } catch (err) {
      lesson['thumbnail'] =
        'https://img.youtube.com/vi/' +
        lessons[i]['lesson_code'] +
        '/hqdefault.jpg';
    }

    lesson['stream_type'] = 'ssslesson';
    lesson['stream_id'] = lessons[i]['id'];
    lesson['module'] = lessons[i]['module'];
    lesson['viewcount'] = 0;
    lesson['likecount'] = lessons[i]['likecount'];
    lesson['commentcount'] = lessons[i]['commentcount'];
    lessonList.push(lesson);
  }
  return lessonList;
  //return await Lesson.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function getLessonDetail(lesson) {
  try {
    let lessonDetails = {};
    lessonDetails['id'] = lesson['_id'];
    lessonDetails['stateId'] = lesson['states'];
    lessonDetails['classId'] = lesson['department'];
    lessonDetails['subjectId'] = lesson['subject'];

    lessonDetails['lesson_no'] = lesson['lesson_no']; //need to be change with actual sort order
    lessonDetails['name'] = lesson['name'];
    lessonDetails['launched'] = lesson['is_launched'];
    lessonDetails['are_resources_sequential'] =
      lesson['are_resources_sequential'];
    lessonDetails['is_active'] = lesson['is_active'];
    lessonDetails['description'] = lesson['description']
      ? lesson['description'].replace(/\n$/, '')
      : '';
    lessonDetails['associated_with'] = lesson['section'];
    lessonDetails['progress'] = lesson['progress'];

    lessonDetails['videos'] = '';
    lessonDetails['audios'] = '';
    lessonDetails['audiotextbooks'] = '';
    lessonDetails['kits'] = '';
    lessonDetails['resources'] = [];
    lessonDetails['lesson_concepts'] = '';
    lessonDetails['govt_textbook'] = '';
    lessonDetails['sampark_textbook'] = '';
    if (lesson['message_title'] == '' || lesson['message_description'] == '') {
      lessonDetails['message'] = '';
    } else {
      lessonDetails['message'] = {};
      lessonDetails['message']['title'] = lesson['message_title'];
      lessonDetails['message']['description'] = lesson['message_description'];
    }
    if (lesson['videos'].length > 0 && lesson['videos'][0] != '') {
      lessonDetails['resources_locked'] = true;
    } else {
      lessonDetails['resources_locked'] = false;
    }

    lessonDetails['vocabularyword_watched'] = false;
    lessonDetails['vocabularysentence_watched'] = false;
    lesson_vocabulary = lesson['vocabularyword']
      ? lesson['vocabularyword']
      : '';
    lesson_sentence = lesson['vocabularysentence']
      ? lesson['vocabularysentence']
      : '';
    lessonDetails['vocabularyword_id'] = lesson_vocabulary;
    lessonDetails['vocabularysentence_id'] = lesson_sentence;
    let vocabularywords = {};
    if (lesson_vocabulary != '') {
      const englishvocabulary = await Englishspeech.findOne({
        _id: lesson_vocabulary,
      });
      if (englishvocabulary['content'].length > 0) {
        const englishvocabularycontent = await Vocabularyword.where({
          _id: { $in: englishvocabulary['content'] },
        });
        for (let i = 0; i < englishvocabularycontent.length; i++) {
          vocabularywords[englishvocabularycontent[i]['word']] =
            englishvocabularycontent[i]['meaning'];
        }
      }
    }
    lessonDetails['vocabularywords'] = vocabularywords;

    let vocabularysentences = {};
    if (lesson_sentence != '') {
      const englishsentence = await Englishspeech.findOne({
        _id: lesson_sentence,
      });
      if (englishsentence['content'].length > 0) {
        const englishsentencecontent = await Vocabularysentence.where({
          _id: { $in: englishsentence['content'] },
        });
        for (let i = 0; i < englishsentencecontent.length; i++) {
          vocabularysentences[englishsentencecontent[i]['sentence']] =
            englishsentencecontent[i]['meaning'];
        }
      }
    }
    lessonDetails['vocabularysentences'] = vocabularysentences;

    let curUserStateId = '';
    let curUser = '';
    let sssvideolikes = [];
    let videolikes = [];
    let audiolikes = [];
    let sssvideowatched = [];
    let videowatched = [];
    let audiowatched = [];
    let kitwatched = [];
    let sssAssessmentWatched = [];
    let boloWatched = [];
    let documentwatched = [];
    let scertsolutionwatched = [];
    let new_progress = 0;
    let total_resources = 0;
    let total_resources_watched = 0;
    let curUserState = '0';
    if (userid) {
      curUser = await User.findOne({ _id: userid }); //.populate('state',['name']);
      if (curUser) {
        isUnlockedlesson = await Unlockedlesson.find({
          lesson: lesson['_id'],
          user: curUser.id,
        }).select('-hash');
        if (isUnlockedlesson.length > 0) {
          lessonDetails['resources_locked'] = false;
        }
        curUserGroup = curUser.usertype;
        curUserState = curUser.state;
        const checkstate = await State.findById(curUserState);

        if (checkstate && checkstate['is_active']) {
          curUserStateId = curUserState['_id'];
        } else {
          curUserState = '0';
          curUserStateId = '0';
        }
      }
    }

    vocabularyWatched = await Englishspeechviewed.distinct('englishspeechId', {
      user: userid,
    });

    vocabularyWatched = vocabularyWatched.map((item) => {
      return item.toString();
    });
    if (
      lesson_vocabulary != '' &&
      vocabularyWatched.indexOf(lesson_vocabulary.toString()) > -1
    ) {
      lessonDetails['vocabularyword_watched'] = true;
    }
    if (
      lesson_sentence != '' &&
      vocabularyWatched.indexOf(lesson_sentence.toString()) > -1
    ) {
      lessonDetails['vocabularysentence_watched'] = true;
    }
    var sssvideoviews = [];
    var videoviews = [];
    var audioviews = [];
    if (lesson['is_launched']) {
      if (lesson['videos'].length > 0 && lesson['videos'][0] != '') {
        const videos = await Video.find({ _id: { $in: lesson['videos'] } });
        if (videos.length > 0) {
          let samparkvideos1 = {};
          total_resources = total_resources + videos.length;
          for (const curVideo of videos) {
            let samparkvideo = {};
            samparkvideo['name'] = curVideo['name'];
            samparkvideo['description'] = curVideo['description'];
            samparkvideo['is_shareable'] = true;
            samparkvideo['streamtype'] = 'sssvideo';

            samparkvideo['id'] = curVideo['id'];
            samparkvideo['url'] =
              config.repositoryHost +
              'samparkvideos/' +
              curVideo['module'] +
              '/' +
              curVideo['url'];
            samparkvideo['video_code'] = curVideo['video_code'];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo['video_code'];
            samparkvideo['short_video_code'] = await TinyURL.shorten(
              youtubeURL
            );
            let duration = '';
            if (
              curVideo['duration_min'] != '' &&
              curVideo['duration_min'] != null
            ) {
              duration = curVideo['duration_min'] + ' Mins ';
            }
            if (
              curVideo['duration_sec'] != '' &&
              curVideo['duration_sec'] != null
            ) {
              duration = duration + curVideo['duration_sec'] + ' Secs';
            }
            samparkvideo['passing_duration'] = config.video_passing_percentage;
            samparkvideo['duration'] = duration;

            if (
              curVideo['thumbnail'] != '' &&
              curVideo['thumbnail'] != 'null'
            ) {
              samparkvideo['thumbnail'] =
                config.repositoryHost + curVideo['thumbnail'];
            } else {
              samparkvideo['thumbnail'] =
                'https://img.youtube.com/vi/' +
                curVideo['video_code'] +
                '/hqdefault.jpg';
            }
            samparkvideos1[curVideo['id']] = samparkvideo;
          }

          let samparkvideos = [];
          for (const videoId of lesson['videos']) {
            samparkvideos.push(samparkvideos1[videoId]);
          }
          lessonDetails['videos'] = samparkvideos;
          //lessonDetails["videos"] = "";// Commented to remove videos as youtube channel is blocked
        }
      }

      if (lesson['audios'].length > 0 && lesson['audios'][0] != '') {
        const audios = await Audio.find({
          _id: { $in: lesson['audios'] },
        }).sort({ sort_order: 1 });

        if (audios.length > 0) {
          let samparkaudios1 = {};
          total_resources = total_resources + audios.length;
          for (const curAudio of audios) {
            let samparkaudio = {};
            samparkaudio['name'] = curAudio['name'];
            samparkaudio['description'] =
              curAudio['name'] + ' - ' + curAudio['description'];
            samparkaudio['audio_code'] = curAudio['audio_code'];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curAudio['audio_code'];
            let youtubeURL = config.video_player_link + curAudio['audio_code'];
            samparkaudio['short_audio_code'] = await TinyURL.shorten(
              youtubeURL
            );
            samparkaudio['video_code'] = curAudio['audio_code'];
            samparkaudio['id'] = curAudio['id'];
            samparkaudio['watched'] = false;
            samparkaudio['is_shareable'] = true;
            samparkaudio['streamtype'] = 'sssaudio';

            var duration = '';
            if (
              curAudio['duration_min'] != '' &&
              curAudio['duration_min'] != null
            ) {
              duration = curAudio['duration_min'] + ' Mins ';
            }
            if (
              curAudio['duration_sec'] != '' &&
              curAudio['duration_sec'] != null
            ) {
              duration = duration + curAudio['duration_sec'] + ' Secs';
            }
            samparkaudio['duration'] = duration;
            samparkaudio['passing_duration'] = config.video_passing_percentage;

            if (
              curAudio['thumbnail'] != '' &&
              curAudio['thumbnail'] != 'null'
            ) {
              samparkaudio['thumbnail'] =
                config.repositoryHost + curAudio['thumbnail'];
            } else {
              samparkaudio['thumbnail'] =
                'https://img.youtube.com/vi/' +
                curAudio['audio_code'] +
                '/hqdefault.jpg';
            }
            samparkaudios1[curAudio['id']] = samparkaudio;
          }
          let samparkaudios = [];
          for (const audioId of lesson['audios']) {
            samparkaudios.push(samparkaudios1[audioId]);
          }
          lessonDetails['audios'] = samparkaudios;
          //lessonDetails["audios"] = "";// Commented to remove videos as youtube channel is blocked
        }
      }

      if (lesson['kits'].length > 0 && lesson['kits'][0] != '') {
        const kits = await Kit.find({ _id: { $in: lesson['kits'] } });

        if (kits.length > 0) {
          let samparkkits = [];
          let index = -1;
          for (const curKit of kits) {
            let samparkkit = {};
            samparkkit['id'] = curKit['id'] ? curKit['id'] : '';
            samparkkit['index'] = index + 1;
            samparkkit['name'] = curKit['name'] ? curKit['name'] : '';
            samparkkit['pdfname'] = curKit['pdfname'] ? curKit['pdfname'] : '';
            samparkkit['pdf'] = curKit['pdf']
              ? config.repositoryHost + curKit['pdf']
              : '';
            if (samparkkit['pdf'] != '') {
              total_resources = total_resources + 1;
            }
            if (curKit['images'].length > 0) {
              samparkkit['images'] = [];
              samparkkit['kitimages'] = [];
              for (const curKitImage of curKit['images']) {
                if (curKitImage && curKitImage !== null) {
                  let kitimage = {};
                  kitimage['path'] = config.repositoryHost + curKitImage;
                  let dimensions = await getDimension(
                    config.repositoryHost + curKitImage
                  );
                  kitimage['width'] = dimensions['width'];
                  kitimage['height'] = dimensions['height'];
                  samparkkit['kitimages'].push(kitimage);
                  samparkkit['images'].push(
                    config.repositoryHost + curKitImage
                  );
                }
              }
            } else {
              samparkkit['images'] = '';
            }
            samparkkit['watched'] = false;
            if (kitwatched.indexOf(curKit['id']) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkkit['watched'] = true;
            }
            samparkkits.push(samparkkit);
          }
          lessonDetails['kits'] = samparkkits;
        }
      }
    } else {
      if (lesson['videos'].length > 0 && lesson['videos'][0] != '') {
        const videos = await Video.find({
          _id: { $in: lesson['videos'] },
        }).populate('concept');
        let concepts = [];
        let lesson_concepts = [];
        if (videos.length > 0) {
          let samparkvideos1 = {};
          let conceptkeys = {};
          let conceptkeyindex = 0;
          total_resources = total_resources + videos.length;

          for (const curVideo of videos) {
            if (!conceptkeys.hasOwnProperty(curVideo['concept']['id'])) {
              conceptkeys[curVideo['concept']['id']] = conceptkeyindex;
              concepts[conceptkeyindex] = {};
              concepts[conceptkeyindex]['name'] = curVideo['concept']['name'];
              concepts[conceptkeyindex]['videos'] = [];
              conceptkeyindex = conceptkeyindex + 1;
            }
            let currentindex = conceptkeys[curVideo['concept']['id']];

            let samparkvideo = {};
            samparkvideo['index'] = currentindex;
            samparkvideo['id'] = curVideo['id'];
            samparkvideo['url'] =
              config.repositoryHost +
              'samparkvideos/' +
              curVideo['module'] +
              '/' +
              curVideo['url'];
            samparkvideo['name'] = curVideo['name'];

            samparkvideo['is_shareable'] = true;
            samparkvideo['streamtype'] = 'sssvideo';

            samparkvideo['video_code'] = curVideo['video_code'];

            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo['video_code'];
            samparkvideo['short_video_code'] = await TinyURL.shorten(
              youtubeURL
            );

            let duration = '';
            if (
              curVideo['duration_min'] != '' &&
              curVideo['duration_min'] != null
            ) {
              duration = curVideo['duration_min'] + ' Mins ';
            }
            if (
              curVideo['duration_sec'] != '' &&
              curVideo['duration_sec'] != null
            ) {
              duration = duration + curVideo['duration_sec'] + ' Secs';
            }
            samparkvideo['duration'] = duration;
            samparkvideo['passing_duration'] = config.video_passing_percentage;
            samparkvideo['views'] = curVideo['viewcount'];
            if (
              curVideo['thumbnail'] != '' &&
              curVideo['thumbnail'] != 'null'
            ) {
              samparkvideo['thumbnail'] =
                config.repositoryHost + curVideo['thumbnail'];
            } else {
              samparkvideo['thumbnail'] =
                'https://img.youtube.com/vi/' +
                curVideo['video_code'] +
                '/hqdefault.jpg';
            }
            concepts[currentindex]['videos'].push(samparkvideo);
          }
          lessonDetails['lesson_concepts'] = concepts;
        }
      }
    }

    if (
      lesson['audiotextbooks'].length > 0 &&
      lesson['audiotextbooks'][0] != ''
    ) {
      const audiotextbooks = await Audiotextbook.find({
        _id: { $in: lesson['audiotextbooks'] },
      });
      if (audiotextbooks.length > 0) {
        let samparkaudiotextbooks1 = {};
        total_resources = total_resources + audiotextbooks.length;
        for (const curAudiotextbook of audiotextbooks) {
          let samparkaudiotextbook = {};
          samparkaudiotextbook['name'] = curAudiotextbook['name'];
          samparkaudiotextbook['description'] = curAudiotextbook['description'];
          samparkaudiotextbook['is_shareable'] = true;
          samparkaudiotextbook['streamtype'] = 'sssaudiotextbook';

          samparkaudiotextbook['id'] = curAudiotextbook['id'];
          samparkaudiotextbook['url'] =
            config.repositoryHost +
            'samparkaudiotextbooks/' +
            curAudiotextbook['module'] +
            '/' +
            curAudiotextbook['url'];
          samparkaudiotextbook['audiotextbook_code'] =
            curAudiotextbook['audiotextbook_code'];
          // youtubeURL = 'https://www.youtube.com/watch?v=' + curAudiotextbook['audiotextbook_code'];
          let youtubeURL =
            config.audiotextbook_player_link +
            curAudiotextbook['audiotextbook_code'];
          samparkaudiotextbook['short_audiotextbook_code'] =
            await TinyURL.shorten(youtubeURL);
          let duration = '';
          if (
            curAudiotextbook['duration_min'] != '' &&
            curAudiotextbook['duration_min'] != null
          ) {
            duration = curAudiotextbook['duration_min'] + ' Mins ';
          }
          if (
            curAudiotextbook['duration_sec'] != '' &&
            curAudiotextbook['duration_sec'] != null
          ) {
            duration = duration + curAudiotextbook['duration_sec'] + ' Secs';
          }
          samparkaudiotextbook['passing_duration'] =
            config.audiotextbook_passing_percentage;
          samparkaudiotextbook['duration'] = duration;

          if (
            curAudiotextbook['thumbnail'] != '' &&
            curAudiotextbook['thumbnail'] != 'null'
          ) {
            samparkaudiotextbook['thumbnail'] =
              config.repositoryHost + curAudiotextbook['thumbnail'];
          } else {
            samparkaudiotextbook['thumbnail'] =
              'https://img.youtube.com/vi/' +
              curAudiotextbook['audiotextbook_code'] +
              '/hqdefault.jpg';
          }
          samparkaudiotextbooks1[curAudiotextbook['id']] = samparkaudiotextbook;
        }

        let samparkaudiotextbooks = [];
        for (const audiotextbookId of lesson['audiotextbooks']) {
          samparkaudiotextbooks.push(samparkaudiotextbooks1[audiotextbookId]);
        }
        lessonDetails['audiotextbooks'] = samparkaudiotextbooks;
        //lessonDetails["audiotextbooks"] = "";// Commented to remove audiotextbooks as youtube channel is blocked
      }
    }

    if (lesson['section'] == 'sss') {
      let govt_textbooks = lesson['govt_textbook_mapping']
        ? JSON.parse(lesson['govt_textbook_mapping'])
        : {};
      lessonDetails['govt_textbook'] =
        curUserStateId != '' && govt_textbooks.hasOwnProperty(curUserStateId)
          ? govt_textbooks[curUserStateId]
          : govt_textbooks['0'];

      if (lessonDetails['govt_textbook'] == null) {
        lessonDetails['govt_textbook'] = '';
      }
    } else {
      let govt_textbooks = JSON.parse(lesson['govt_textbook_mapping']);
      lessonDetails['sampark_textbook'] =
        curUserStateId != '' && govt_textbooks.hasOwnProperty(curUserStateId)
          ? govt_textbooks[curUserStateId]
          : govt_textbooks['0'];

      if (lessonDetails['sampark_textbook'] == null) {
        lessonDetails['sampark_textbook'] = '';
      }
    }

    let queryDocument = {};
    let queryDocumentIds = [];
    if (lesson['worksheet'] != '') {
      queryDocumentIds.push(lesson['worksheet']);
    }
    if (lesson['assessment'] != '') {
      queryDocumentIds.push(lesson['assessment']);
    }
    if (lesson['progress_chart'] != '') {
      queryDocumentIds.push(lesson['progress_chart']);
    }
    let documents = await Document.find({ _id: { $in: queryDocumentIds } });
    let resourses_seq = {};

    let i = 0;
    for (const curDocument of documents) {
      let resource = {};
      total_resources = total_resources + 1;
      resourses_seq[curDocument['doc_type']] = i;
      i = i + 1;
      resource['type'] = curDocument['doc_type'];
      resource['id'] = curDocument['id'];
      resource['watched'] = '';
      resource['name'] = config.doc_types[curDocument['doc_type']];
      resource['url'] = config.repositoryHost + curDocument['doc_url'];
      urlPath = config.repositoryHost + curDocument['doc_url'];
      resource['short_url'] = await TinyURL.shorten(urlPath);

      lessonDetails['resources'].push(resource);
    }

    if (lesson['assessmentId'] != null && lesson['assessmentId'] != undefined) {
      let resource = {};
      resource['type'] = 'sssassessment';
      resource['assessmentId'] = lesson['assessmentId'];
      resource['watched'] = '';
      resource['name'] = 'Practice Quiz';
      resourses_seq['sssassessment'] = Object.keys(resourses_seq).length;
      total_resources = total_resources + 1;

      lessonDetails['resources'].push(resource);
    }

    if (lesson['scert_solutions'] !== null) {
      if (
        lesson['scert_solutions'].length > 1 ||
        (lesson['scert_solutions'].length == 1 &&
          lesson['scert_solutions'][0] !== '')
      ) {
        let scert_solutionid = lesson['scert_solutions'];
        const scert_solutions = await Scertsolution.find({
          _id: { $in: scert_solutionid },
        }); //
        if (scert_solutions.length > 0) {
          for (const curScertSol of scert_solutions) {
            if (curScertSol['states'].indexOf(curUserState) !== -1) {
              let resource = {};
              resource['type'] = 'scertsolution';
              //resource['name'] = 'SCERT Solution';
              resource['name'] = 'Solved Workbook';
              resource['id'] = curScertSol['id'];
              resource['watched'] = '';
              resource['url'] = config.repositoryHost + curScertSol['doc_url'];
              lessonDetails['resources'].push(resource);
              resourses_seq['scertsolution'] =
                Object.keys(resourses_seq).length;
            }
          }
        }
      }
    }

    if (userid !== '') {
      lessonDetails['progress'] = new_progress;
      let lessonUpdatedData = {};
      const checkprogresslesson = await Lessonprogress.find({
        lesson: lesson['_id'],
        user: userid,
      });
      if (checkprogresslesson.length > 0) {
        lessonDetails['progress'] = checkprogresslesson[0]['progress'];
      }
    } else {
      lessonDetails['progress'] = 0;
    }

    let new_resources = [];
    if (resourses_seq.hasOwnProperty('worksheet'))
      new_resources.push(
        lessonDetails['resources'][resourses_seq['worksheet']]
      );
    if (resourses_seq.hasOwnProperty('assessment'))
      new_resources.push(
        lessonDetails['resources'][resourses_seq['assessment']]
      );
    if (resourses_seq.hasOwnProperty('sssassessment'))
      new_resources.push(
        lessonDetails['resources'][resourses_seq['sssassessment']]
      );
    if (resourses_seq.hasOwnProperty('scertsolution'))
      new_resources.push(
        lessonDetails['resources'][resourses_seq['scertsolution']]
      );
    if (resourses_seq.hasOwnProperty('progress_chart'))
      new_resources.push(
        lessonDetails['resources'][resourses_seq['progress_chart']]
      );

    // added by milap for preschool
    //    lessonDetails['resourcesseq'] = resourses_seq;
    lessonDetails['resources'] = new_resources;
    lessonDetails['total_resources_watched'] = total_resources_watched;
    lessonDetails['total_resources'] = total_resources;

    return lessonDetails;
  } catch (e) {
    console.log('LESSON : ');
    console.log(lesson);
    console.log(e);
  }
}

async function getById(id, userid, pageno, per_page) {
  let lessonDetails = [];

  if (id == 'detailedlist') {
    let querylesson = {};
    let curUserStateId = '0';
    if (userid !== '') {
      curUser = await User.find({ _id: userid });
      // if logged in user found in database
      if (curUser.length == 1) {
        curUser = curUser[0];
        curUserState = curUser.state;
        checkstate = await State.findById(curUserState, { is_active: 1 });

        //return curUserStateId
        if (checkstate && checkstate['is_active']) {
          curUserStateId = curUserState['_id'];
        } else {
          curUserState = '0';
          curUserStateId = '0';
        }
      }
    }
    querylesson['states'] = curUserStateId.toString();
    querylesson['section'] = 'sss';
    querylesson['is_active'] = true;
    let perpage = parseInt(per_page);
    start = (pageno - 1) * perpage;
    // fetch lessons from lessons collection and select only required fields
    const lessons = await Lesson.find(querylesson, {
      section: 1,
      name: 1,
      kits: 1,
      videos: 1,
      audios: 1,
      baithak_videos: 1,
      activities: 1,
      scert_solutions: 1,
      assessment: 1,
      worksheet: 1,
      progress_chart: 1,
      assessmentId: 1,
      boloId: 1,
      audiotextbooks: 1,
    })
      .sort({ lesson_no: 1 })
      .limit(perpage)
      .skip(start);
    for (var k = 0; k < lessons.length; k++) {
      let lessonDetail = await getLessonDetail(lessons[k]);
      lessonDetails.push(lessonDetail);
    }
  } else {
    const lesson = await Lesson.findOne({ _id: id }).select('-hash');
    if (!lesson) {
      return '';
    }

    let lessonDetail = await getLessonDetail(lesson);
    lessonDetails.push(lessonDetail);
  }

  return lessonDetails;
}

async function create(req) {
  // validate
  lessonParam = req.body;

  var current_user = get_current_user(req);

  lessonParam.createdBy = current_user;
  lessonParam.updatedBy = current_user;
  lessonParam.states = lessonParam.states.split(',');
  if (lessonParam.activities) {
    lessonParam.activities = lessonParam.activities.split(',');
  }
  if (lessonParam.videos) {
    lessonParam.videos = lessonParam.videos.split(',');
  }
  if (lessonParam.audios) {
    lessonParam.audios = lessonParam.audios.split(',');
  }
  if (lessonParam.baithak_videos) {
    lessonParam.baithak_videos = lessonParam.baithak_videos.split(',');
  }
  if (lessonParam.kits) {
    lessonParam.kits = lessonParam.kits.split(',');
  }
  if (lessonParam.scert_solutions) {
    lessonParam.scert_solutions = lessonParam.scert_solutions.split(',');
  }

  const lesson = new Lesson(lessonParam);

  // save lesson
  await lesson.save();
  return { success: true };
}

async function edit(id) {
  lesson = await Lesson.find({ _id: id }).select('-hash');

  if (lesson.length != 1) {
    return '';
  }
  lesson = lesson[0];

  var lessondetail = {};

  lessondetail['is_launched'] = lesson.is_launched;
  lessondetail['is_active'] = lesson.is_active;
  lessondetail['name'] = lesson.name;
  lessondetail['lesson_no'] = lesson.lesson_no;
  lessondetail['description'] = lesson.description;
  lessondetail['message_type'] = lesson.message_type ? lesson.message_type : '';
  lessondetail['message_title'] = lesson.message_title
    ? lesson.message_title
    : '';
  lessondetail['message_description'] = lesson.message_description
    ? lesson.message_description
    : '';
  lessondetail['department'] = lesson.department;
  lessondetail['subject'] = lesson.subject;
  lessondetail['worksheet'] = lesson.worksheet;
  lessondetail['assessment'] = lesson.assessment;
  lessondetail['lesson_plan'] = lesson.lesson_plan;
  lessondetail['progress_chart'] = lesson.progress_chart;
  lessondetail['activity'] = lesson.activities;
  lessondetail['scert_solution'] = lesson.scert_solutions;
  lessondetail['video'] = lesson.videos;
  lessondetail['audio'] = lesson.audios;
  lessondetail['baithak'] = lesson.baithak_videos;
  lessondetail['govt_textbook_mapping'] = lesson.govt_textbook_mapping;
  lessondetail['kit'] = lesson.kits;
  lessondetail['section'] = lesson.section;
  lessondetail['states'] = lesson.states;
  lessondetail['createdDate'] = lesson.createdDate;
  lessondetail['id'] = lesson.id;
  return lessondetail;
}

async function update(id, req) {
  lessonParam = req.body;
  const lesson = await Lesson.findById(id);
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  // validate
  if (!lesson) throw 'Lesson not found';
  if (
    lesson.lesson_code !== lessonParam.lesson_code &&
    (await Lesson.findOne({ lesson_code: lessonParam.lesson_code }))
  ) {
    //throw 'Lesson "' + lessonParam.lesson_code + '" is already taken';
  }

  lessonParam.updatedDate = updatedAt;
  lessonParam.updatedBy = current_user;
  lessonParam.states = lessonParam.states.split(',');
  if (lessonParam.activities) {
    lessonParam.activities = lessonParam.activities.split(',');
  }
  if (lessonParam.videos) {
    lessonParam.videos = lessonParam.videos.split(',');
  }
  if (lessonParam.audios) {
    lessonParam.audios = lessonParam.audios.split(',');
  }
  if (lessonParam.baithak_videos) {
    lessonParam.baithak_videos = lessonParam.baithak_videos.split(',');
  }
  if (lessonParam.kits) {
    lessonParam.kits = lessonParam.kits.split(',');
  }
  if (lessonParam.scert_solutions) {
    lessonParam.scert_solutions = lessonParam.scert_solutions.split(',');
  }
  // copy lessonParam properties to lesson
  Object.assign(lesson, lessonParam);
  await lesson.save();

  var unsetkeys = {};
  if (!lessonParam.worksheet) {
    unsetkeys['worksheet'] = 1;
  }
  if (!lessonParam.assessment) {
    unsetkeys['assessment'] = 1;
  }
  if (!lessonParam.progress_chart) {
    unsetkeys['progress_chart'] = 1;
  }
  if (Object.keys(unsetkeys).length > 0) {
    await Lesson.updateOne({ _id: lesson.id }, { $unset: unsetkeys });
  }

  return { success: true };
}

async function _delete(id) {
  await Lesson.findByIdAndRemove(id);
  await Stream.deleteMany({ item_type: 'ssslesson', item_id: id });
  return { success: true };
}

async function awardTVSparkle(school_id) {
	let toDateObject = new Date();
	let monthIndex = toDateObject.getMonth();
	let fullYear = toDateObject.getFullYear();
  const schoolData = await School.findOne({"_id": school_id})
  const diseCode = schoolData['diseCode']
	const teachers = await User.find({ "diseCode": diseCode, "usertype": "govt teacher" }, { '_id': 1 }); // find all teachers based on disecode
	let tv_sparkle_points = 20;
	if (teachers && teachers.length) {

		for (let i = 0; i < teachers.length; i++) {
			// get data from user sparkle table
			let userSparkleData = await Sparkle.find({
				user: teachers[i]['_id'],
				month: monthIndex,
				year: fullYear
			});

      if (userSparkleData && userSparkleData.length) {
				userSparkleData[0]["stv"] = userSparkleData[0]["stv"] ? (parseInt(userSparkleData[0]["stv"]) + tv_sparkle_points) : tv_sparkle_points;
				userSparkleData[0]["total"] = userSparkleData[0]["total"] ? (parseInt(userSparkleData[0]["total"]) + tv_sparkle_points) : tv_sparkle_points;
				userSparkleData[0]["updatedDate"] = toDateObject;
				let useSparkleObj = new Sparkle(userSparkleData[0]);
				await useSparkleObj.save();
			}
			else {
				// insert new entry for user sparke
				let userSparkleObj = new Sparkle({
					user: new objectId(teachers[i]["_id"]),
					stv: tv_sparkle_points,
					total: tv_sparkle_points,
					updatedDate: new Date(),
					month: monthIndex,
					year: fullYear
				});
				await userSparkleObj.save();
			}
		}
	}
	return { success: true }
}

async function syncQRCode(req) {
  let body =  req.body
  let current_user_id = get_current_user(req)
  let user_dise_code = "";
  if (current_user_id != "") {
    let current_user = await User.findOne({"_id":current_user_id})
    user_dise_code = current_user.diseCode
  }
  
  let finalData ={}
  var start = new Date();
  start.setHours(0,0,0,0);
  var end = new Date();
  end.setHours(23,59,59,999);
  console.log("QR CODE TV SYNCING : ",body)

  finalData['syncMethod'] = "qrcode"
  const saveClassandSubject = async (classCode , subjectList)=>{
      let  queryClass = {}
      queryClass['code'] = classCode
      queryClass['module'] = 'sss'
      const classData = await  Departmentmaster.findOne(queryClass)
      // if(!classData) throw `cannot find class code '${classCode}' `
      let subjectData = subjectList.split("-") 
      let querySubject  = {}
      querySubject['code'] = subjectData[0]
      querySubject['module'] = 'sss'
      const subject = await Subjectmaster.findOne(querySubject)
      // if(!subject) throw `cannot find subject code '${subjectData[0]}' `
      let queryexist = {}
      queryexist['created_on'] = {}
      queryexist['created_on']['$gte'] = start
      queryexist['created_on']['$lt'] = end
      queryexist['device_id'] = finalData['device_id']
      queryexist['class_id'] = ObjectId(classData['id'])
      // queryexist['class_name'] = classData['name']
      if(!subject){
          return
      }else {
        queryexist['subject_id'] = ObjectId(subject['id'])
        finalData['subject_id'] = subject['id']
        finalData['subject_name'] = subject['name']
      }
      // queryexist['subject_name'] = subject['name']
      finalData['class_id'] = ObjectId(classData['id'])
      
      finalData['class_name'] = classData['name']
      const existTvUserProgress  =  await Tv_user_progress.findOne(queryexist)
      if(existTvUserProgress){
        if(existTvUserProgress['total_lesson'] < subjectData[1] || existTvUserProgress['completed_lessons'] < subjectData[2] ||existTvUserProgress['total_resources'] < subjectData[3] ||existTvUserProgress['completed_resources'] < subjectData[4] ){
          existTvUserProgress['total_lesson']   = subjectData[1]
          existTvUserProgress['completed_lessons'] = subjectData[2]
          existTvUserProgress['total_resources']= subjectData[3]
          existTvUserProgress['completed_resources']= subjectData[4]
           await existTvUserProgress.save()
      }
     }else{
         finalData['total_lesson'] = subjectData[1]
         finalData['completed_lessons'] = subjectData[2]
         finalData['total_resources'] = subjectData[3]
         finalData['completed_resources'] = subjectData[4]
         finalData['user_dise_code'] = user_dise_code
         const tvUserProgress = new Tv_user_progress(finalData)
         await tvUserProgress.save()
      }
  }
  function isValidObjectId(id){
   
      if(ObjectId.isValid(id)){
          if((String)(new ObjectId(id)) === id) return true;       
          return false;
      }
      return false;
  }
  try {
      let jsonbody = JSON.parse(body.code);
      let code = jsonbody.a
      let lessonData =  code.split("#")
      let lessonData1 =  lessonData[0].split(";")
      let lessonData2 =  lessonData[1].split(";")
      let lessonData3 = [...lessonData1,...lessonData2]
      let timeStamp;
      let allClasses = false
      for (let item of lessonData3) {
        if(item === '') continue
          if(allClasses){
              let classData = item.split(":")
              let classCode = classData[0].split("-")
              let queryClass = {}
              queryClass['code'] = classCode[0]
              queryClass['module'] = 'sss'
              const ClassData = await  Departmentmaster.findOne(queryClass)
              if(!ClassData) continue
              let queryexist ={}
              queryexist['created_on'] = {}
              queryexist['created_on']['$gte'] = start
              queryexist['created_on']['$lt'] = end
              queryexist['device_id'] = finalData['device_id']
              queryexist['class_id'] = ObjectId(ClassData['id'])
              queryexist['subject_id'] = 'NA'
              
              const existTvUserProgressClass  =  await Tv_user_progress.findOne(queryexist)
              if(existTvUserProgressClass){
                if(existTvUserProgressClass['total_lesson'] < classCode[1] || existTvUserProgressClass['completed_lessons'] < classCode[2] ||existTvUserProgressClass['total_resources'] < classCode[3] ||existTvUserProgressClass['completed_resources'] < classCode[4] ){
                    existTvUserProgressClass['total_lesson']   = classCode[1]
                    existTvUserProgressClass['completed_lessons'] = classCode[2]
                    existTvUserProgressClass['total_resources']= classCode[3]
                    existTvUserProgressClass['completed_resources']= classCode[4]
                     await existTvUserProgressClass.save()
                }
               }else{
                finalData['total_lesson'] = classCode[1]
                finalData['completed_lessons'] = classCode[2]
                finalData['total_resources'] = classCode[3]
                finalData['completed_resources'] = classCode[4]
                delete finalData['subject_id']
                finalData['subject_name'] = 'NA'
                finalData['class_id'] = ObjectId(ClassData['id'])
                finalData['class_name'] = ClassData['name']
                finalData['user_dise_code'] = user_dise_code
                   const tvUserProgressClass = new Tv_user_progress(finalData)
                   await tvUserProgressClass.save()
                }
             
              let subjectList = classData.splice(1,classData.length)
              for (let subject of subjectList) {
                  await saveClassandSubject(classCode[0],subject)
              }
          }else if(item.slice(0,2) == "DI"){
              let deviceData =  item.split("-")
              // let queryUser = {}
              finalData['device_id'] =deviceData[1]
              // const user = await User.findOne(queryUser)
              // if(!user) throw "user not found"
              // finalData['device_id'] = user?.device_id
              // finalData['state_id']  = user["state"] ? user["state"] : ''
          }else if(item.slice(0,2) == "SI"){
              let schoolData =  item.split("-")
              let querySchool = {}
              const validObjectId =  isValidObjectId(schoolData[1])
              if (validObjectId){
                  querySchool['_id'] = schoolData[1]
              }else querySchool['diseCode'] = schoolData[1]
              const school = await School.findOne(querySchool)
              // if(!school) throw "school not found"
              finalData['school_id']  = school ? school["id"] :'not got' 
              finalData['school_name']  = school ? school["schoolName"]  : 'not got'
              if(school){
                  const cluster = await Cluster.findById(school["cluster"])
                  finalData['cluster_id']  = school ? school["cluster"] : 'not got'
                  finalData['cluster_name']  = cluster ? cluster["name"] : 'not got'
                  
                  const state = await State.findById(school["state"])
                  finalData['state_id']  = school["state"] ? school["state"] : 'not got'
                  finalData['state_name']  = state["name"] ? state["name"] : 'not got'
                  
                  const district = await District.findById(school["district"])
                  finalData['district_id']  = school["district"] ? school["district"] : 'not got'
                  finalData['district_name']  = district["name"] ? district["name"] : ''

                  const block = await Block.findById(school["block"])
                  finalData['block_id']  = school["block"] ? school["block"] : 'not got'
                  finalData['block_name']  = block["name"] ? block["name"] : 'not got'
              }
          }else if(item.slice(0,2) == "DT"){
              let time =  item.split("-")
              finalData['deviceDateTime'] = time[1]
          }else if(item.slice(0,2) == "SP"){
              let points =  item.split("-")
              finalData['sparkle_points'] = points[1]
          }else if(item.slice(0,3) == "PRG"){
              allClasses = true
              let hitData = JSON.parse(JSON.stringify(finalData));
              let syncdateObj = new Date();
              let syncmonth = syncdateObj.getUTCMonth() + 1; //months from 1-12
              let syncday = syncdateObj.getUTCDate();
              let syncyear = syncdateObj.getUTCFullYear();

              syncdate = syncday + "-" + syncmonth + "-" + syncyear;

              hitData['code'] = code
              hitData['syncDate'] = syncdate;
              delete hitData['sparkle_points']

              const countTvQRScan  =  await Tv_qr_scan.countDocuments({syncDate: syncdate, device_id: hitData['device_id'], school_id: hitData['school_id']})
              if(countTvQRScan == 0 && hitData['school_id'] != "" && hitData['school_id'] != "not got") {
                await awardTVSparkle(hitData['school_id'])
              }
              const tvQRScan = new Tv_qr_scan(hitData)
              await tvQRScan.save()
          }
      }
     return "Data Saved Successfully"
  } catch (error) {
      console.error(error);
     return error
  }
  
}
