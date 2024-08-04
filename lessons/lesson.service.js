const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const update_user_points = commonmethods.update_user_points;
const resize_image = commonmethods.resize_image;
const get_current_user = commonmethods.get_current_user;
const User = db.User;
const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;
const State = db.State;
const Lesson = db.Lesson;
const Stream = db.Stream;
const Video = db.Video;
const Audio = db.Audio;
const Kit = db.Kit;
const Ssslessoncomment = db.Ssslessoncomment;
const Activity = db.Activity;
const Document = db.Document;
const Videostream = db.Videostream;
const Scertsolution = db.Scertsolution;
const Sssvideolike = db.Sssvideolike;
const Videolike = db.Videolike;
const Audiolike = db.Audiolike;
const Audiotextbooklike = db.Audiotextbooklike;
const Audiotextbookviewed = db.Audiotextbookviewed;
const Statecertificate = db.Statecertificate;
const Userdevice = db.Userdevice;
const Unlockedlesson = db.Unlockedlesson;
const Sssvideoplayed = db.Sssvideoplayed;
const Videoplayed = db.Videoplayed;
const Audioplayed = db.Audioplayed;
const Documentviewed = db.Documentviewed;
const Kitviewed = db.Kitviewed;
const Scertsolutionviewed = db.Scertsolutionviewed;
const Videoviewed = db.Videoviewed;
const Sssvideoviewed = db.Sssvideoviewed;
const Audioviewed = db.Audioviewed;
const Lessonprogress = db.Lessonprogress;
const Sssassessmentviewed = db.Sssassessmentviewed;
const Boloviewed = db.Boloviewed;
const Audiotextbook = db.Audiotextbook;
const Englishspeech = db.Englishspeech;
const Vocabularyword = db.Vocabularyword;
const Vocabularysentence = db.Vocabularysentence;
const Vocabularywordviewed = db.Vocabularywordviewed;
const Vocabularysentenceviewed = db.Vocabularysentenceviewed;
const Englishspeechviewed = db.Englishspeechviewed;

const b = "https://sss.samparksmartshala.org/sss/";

const { promisify } = require("util");
const probe = require("probe-image-size");

const _ = require("underscore");
let TinyURL = require("tinyurl");
let q = require("q");

module.exports = {
  getAll,
  getAllbyDepartmentSubject,
  getById,
  getList,
  create,
  update,
  edit,
  search,
  vocabularyviewed,
  delete: _delete,
};

async function getDimension(imagePath) {
  try {
    const dimensions = await probe(imagePath);
    return { width: dimensions.width, height: dimensions.height };
  } catch (err) {
    console.log("Error in: ", err, "getDimension");
    return { width: 0, height: 0 };
  }
}

async function getAll(req) {
  try {
    const draw = req?.body?.draw;
    const start = req?.body?.start;
    const searchValue = req?.body?.search?.value || "";
  
    const sortOptions = {
      0: { field: "name", order: 1 },
      2: { field: "subject.name", order: 1 },
      3: { field: "department.name", order: 1 },
    };
  
    const sortColumn = req?.body?.order[0]?.column;
    const sortField = sortOptions[sortColumn]?.field || "name";
    const sortOrder = req?.body?.order[0]?.dir === "asc" ? 1 : -1;
  
    const query = {
      $or: [
        { name: new RegExp(searchValue, "i") },
        { description: new RegExp(searchValue, "i") },
      ],
    };
  
    if (searchValue.toLowerCase().startsWith("sampark smart shala")) {
      query.$or.push({ section: "sss" });
    } else if (searchValue.toLowerCase().startsWith("govt text book")) {
      query.$or.push({ section: "govt" });
    }

    console.log("Query: ", query, "getAllLessons");
  
    const subjectsData = await Subjectmaster.find({
      name: new RegExp(searchValue, "i"),
    });
    const subjectIds = subjectsData.map((subject) => subject.id);
  
    if (subjectIds.length > 0) {
      query.$or.push({ "subject.$in": subjectIds });
    }
  
    const departmentsData = await Departmentmaster.find({
      name: new RegExp(searchValue, "i"),
    });
    const departmentIds = departmentsData.map((department) => department.id);
  
    if (departmentIds.length > 0) {
      query.$or.push({ "department.$in": departmentIds });
    }
  
    const filteredLessons = await Lesson.find(query).count();
  
    const lessons = await Lesson.find(query)
      .populate("subject", "name")
      .populate("department", "name")
      .sort({ [sortField]: sortOrder })
      .limit(req.body.length)
      .skip(start);
  
    const lessonListing = lessons.map((lessondata) => ({
      id: lessondata["_id"],
      name: lessondata["name"],
      section: lessondata["section"],
      subject: lessondata["subject"]["name"],
      department: lessondata["department"]["name"],
      states: lessondata["states"],
      lesson_no: lessondata["lesson_no"],
      is_active: lessondata["is_active"],
    }));
  
    const returnData = {
      data: lessonListing,
      draw: draw,
      recordsFiltered: filteredLessons,
      recordsTotal: await Lesson.find().count(),
    };
    console.log("Data: ", returnData, "getAllLessons");
    return returnData;
  } catch(error) {
    console.log("Error in: ", error, "getAllLessons");
  }
}

// Helper functions
function getVideoDuration(video) {
  try {
    let duration = "";
    if (video?.duration_min !== "" && video?.duration_min !== null) {
      duration = video?.duration_min + " Mins ";
    }
    if (video?.duration_sec !== "" && video?.duration_sec !== null) {
      duration += video.duration_sec + " Secs";
    }
    return duration;
  } catch(error) {
    console.log("Error in: ", error, "getVideoDuration");
  }
}

function getVideoThumbnail(video) {
  try {
    if (video?.thumbnail !== "" && video?.thumbnail !== "null") {
      return config.repositoryHost + video.thumbnail;
    } else {
      return "https://img.youtube.com/vi/" + video?.video_code + "/hqdefault.jpg";
    }
  } catch(error) {
    console.log("Error in: ", error, "getVideoThumbnail");
  }
}

async function search(searchstring, device_id, userid) {
  try {
    const query = {
      $or: [
        { fullName: new RegExp(searchstring, "i") },
        { description: new RegExp(searchstring, "i") },
        { name: new RegExp(searchstring, "i") },
      ],
    };
  
    const usersData = await User.find({
      fullName: new RegExp(searchstring, "i"),
    });
    const userids = usersData.map((user) => user.id);
  
    const querySearch = {
      $or: [
        { author: { $in: userids } },
        { description: new RegExp(searchstring, "i") },
        { name: new RegExp(searchstring, "i") },
      ],
    };

    console.log("Query Search: ", querySearch, "searchLesson");
  
    const videos = await Video.find(querySearch);
  
    const sssVideoWatched = {};
    const sssVideoLikes = {};
  
    if (videos.length > 0 && userid !== "") {
      const userLikes = await Sssvideoviewed.find({ user: userid });
      userLikes.forEach((userLike) => {
        sssVideoWatched[userLike.video] = true;
      });
  
      const userLikesInfo = await Sssvideolike.find({ user: userid }).select(
        "video is_liked"
      );
      userLikesInfo.forEach((userLike) => {
        sssVideoLikes[userLike.video] = userLike.is_liked;
      });
    }
  
    const samparkVideos = videos.map((video) => {
      const samparkVideo = {
        name: video.name,
        description: video.description,
        is_liked: sssVideoLikes[video.id] ? sssVideoLikes[video.id] : "",
        watched: sssVideoWatched[video.id] ? true : "",
        is_shareable: true,
        likecount: video.likecount,
        commentcount: video.commentcount,
        streamtype: "sssvideo",
        id: video.id,
        url:
          config.repositoryHost +
          "samparkvideos/" +
          video.module +
          "/" +
          video.url,
        video_code: video.video_code,
        duration: getVideoDuration(video),
        views: video.viewcount,
        thumbnail: getVideoThumbnail(video),
      };
      console.log("Video: ", samparkVideo, "SearchLesson");
      return samparkVideo;
    });
  
    const userStreams = {
      streams: samparkVideos,
      max_records: config.max_no_of_streams_on_mobile_storage,
    };
    console.log("user stream: ", userStreams, "SearchLesson");
    return userStreams;
  } catch(error) {
    console.log("Error in: ", error, "searchLesson");
  }
}

async function secondsToHms(d) {
  try {
    const hours = Math.floor(d / 3600);
    const minutes = Math.floor((d % 3600) / 60);
  
    const hDisplay = hours > 0 ? `${hours} घंटे ` : "";
    const mDisplay1 = "";
    const mDisplay = minutes > 0 ? `${minutes} मिनट ` : "";
  
    return hDisplay + mDisplay1 + mDisplay;
  } catch(error) {
    console.log("Error in: ", error, "secondsToHms");
  }
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

async function getList(userid, device_id, apk_version) {
  var subject_query = {};
  var querylesson = {};
  var subjects = [];
  var curUserState = "0";
  var curUserStateId = "0";
  var user_hours = {};
  var certificate_hours = {};
  subject_query["module"] = "sss";

  // Fetch id, name from Subjectmaster collection
  const subjectmasters = await Subjectmaster.find(subject_query, {
    id: 1,
    name: 1,
    banner: 1,
    color1: 1,
    color2: 1,
    color3: 1,
    flnClassBg: 1,
  }).sort({ sort_order: 1 });
  for (var i = 0; i < subjectmasters.length; i++) {
    user_hours[subjectmasters[i].id] = 0;
  }

  // If user logged in condition starts
  if (userid !== "") {
    curUser = await User.find({ _id: userid });
    // if logged in user found in database
    if (curUser.length == 1) {
      curUser = curUser[0];
      curUserState = curUser.state;
      checkstate = await State.findById(curUserState, { is_active: 1 });

      //return curUserStateId
      if (checkstate && checkstate["is_active"]) {
        curUserStateId = curUserState["_id"];
      } else {
        curUserState = "0";
        curUserStateId = "0";
      }
    }

    // return user spent time to view sss videos
    const uservideoviewed = await Sssvideoviewed.find({
      user: userid,
    }).populate("video", "subject duration_min duration_sec");
    for (const uservideoview of uservideoviewed) {
      if (
        uservideoview["video"] !== null &&
        uservideoview["video"]["subject"] !== null
      )
        user_hours[uservideoview["video"]["subject"]] =
          uservideoview["video"]["duration_min"] * 60 +
          uservideoview["video"]["duration_sec"];
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
  if (curUserStateId != "0") {
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

  // Removed is_verified & pincode - Pratik N
  const totalregisteredusers = await User.countDocuments({ is_new: false });

  // Loop through subject master to create both sss lessons & govt lessons object
  for (var i = 0; i < subjectmasters.length; i++) {
    var subject = {};
    var sampark_classes = [];
    var govt_classes = [];
    var sampark_indexes = {};
    var temp_lesson_no = 0;

    subject["id"] = subjectmasters[i].id;
    subject["name"] = subjectmasters[i].name;
    subject["message1"] =
      parseInt(totalregisteredusers) * 1 + " Teachers are watching this today";

    let color1 = subjectmasters[i].color1 != "" ? subjectmasters[i].color1 : "";
    let color2 = subjectmasters[i].color2 != "" ? subjectmasters[i].color2 : "";
    let color3 = subjectmasters[i].color2 != "" ? subjectmasters[i].color3 : "";
    let flnClassBg =
      subjectmasters[i].flnClassBg != "" ? subjectmasters[i].flnClassBg : "";

    subject["color1"] = color1;
    subject["color2"] = color2;
    subject["color3"] = color3;
    subject["flnClassBg"] = flnClassBg;

    if (certificate_hours.hasOwnProperty(subjectmasters[i].id)) {
      var hour_message = await secondsToHms(
        certificate_hours[subjectmasters[i].id]
      );
      subject["message2"] =
        "Sampark Smart Shala " +
        subjectmasters[i].name +
        " certified शिक्षक बनने  में " +
        hour_message +
        "बचे हैं |";
    } else subject["message2"] = "";

    subject["icon"] =
      apk_version < 4.8
        ? subjectmasters[i].name.toLowerCase() + ".png"
        : config.assetHost + subjectmasters[i].name.toLowerCase() + ".png";
    //subject["icon_active"] = config.assetHost + "big-" + subjectmasters[i].name.toLowerCase() + ".png";
    subject["icon_active"] =
      config.assetHost + "" + subjectmasters[i].name.toLowerCase() + ".png";
    subject["banner"] = config.repositoryHost + "" + subjectmasters[i].banner;
    subject_query["subjects"] = subjectmasters[i].id;

    // Fetch departmentmasters name
    var departmentmasters = await Departmentmaster.find(subject_query, {
      name: 1,
      is_fln: 1,
      sort_order: 1,
    }).sort({ sort_order: 1 });

    //govt classes and lessons
    for (var j = 0; j < departmentmasters.length; j++) {
      var department = {};
      var searchMask = " ";
      var regEx = new RegExp(searchMask, "ig");
      var replaceMask = "";

      department["id"] = departmentmasters[j]["id"];
      department["sampark_index"] = sampark_indexes[departmentmasters[j]["id"]];
      department["name"] = departmentmasters[j]["name"];
      department["icon"] =
        apk_version < 4.8
          ? departmentmasters[j].name
              .toLowerCase()
              .replace(regEx, replaceMask) +
            "-" +
            subjectmasters[i].name.toLowerCase() +
            ".png"
          : config.assetHost +
            departmentmasters[j].name
              .toLowerCase()
              .replace(regEx, replaceMask) +
            "-" +
            subjectmasters[i].name.toLowerCase() +
            ".png";
      department["icon_active"] =
        config.assetHost +
        "big-" +
        departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask) +
        "-" +
        subjectmasters[i].name.toLowerCase() +
        ".png";

      // added by Milap for is_fln flag
      if (departmentmasters[j]["is_fln"] == true) {
        department["is_fln"] = true;
      } else {
        department["is_fln"] = false;
      }
      department["sort_order"] = departmentmasters[j]["sort_order"];
      // added by Milap for is_fln flag

      querylesson["subject"] = subjectmasters[i].id;
      querylesson["department"] = departmentmasters[j].id;

      if (userid !== "") {
        querylesson["states"] = curUserStateId.toString();
      } else {
        querylesson["states"] = "nostate";
      }
      querylesson["section"] = "govt";
      querylesson["is_active"] = true;

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
        vocabularysentence: 1,
        vocabularyword: 1,
        audiotextbooks: 1,
      }).sort({ lesson_no: 1 });

      var govtlessons = [];
      var audios_available = false;

      temp_lesson_no = 0;
      department_total_progress = 0;

      for (var k = 0; k < lessons.length; k++) {
        var lesson = {};
        temp_lesson_no = temp_lesson_no + 1;
        lesson["id"] = lessons[k]["id"];
        lesson["name"] = lessons[k]["name"];
        lesson["progress"] = 0;
        if (userid !== "") {
          checkprogresslesson = await Lessonprogress.find({
            lesson: lessons[k]["id"],
            user: userid,
          });
          if (checkprogresslesson.length == 1) {
            lesson["progress"] = checkprogresslesson[0]["progress"];
          }
        }
        lesson["resources"] = 0;
        lesson["audios"] = 0;
        lesson["lesson_no"] = lessons[k]["lesson_no"];
        lesson["sort_order"] = temp_lesson_no;

        if (
          lessons[k]["kits"] !== undefined &&
          lessons[k]["kits"] !== null &&
          (lessons[k]["kits"].length > 1 ||
            (lessons[k]["kits"].length == 1 && lessons[k]["kits"][0] !== ""))
        ) {
          lesson["resources"] = lesson["resources"] + lessons[k]["kits"].length;
        }
        if (
          lessons[k]["videos"] !== undefined &&
          lessons[k]["videos"] !== null &&
          (lessons[k]["videos"].length > 1 ||
            (lessons[k]["videos"].length == 1 &&
              lessons[k]["videos"][0] !== ""))
        ) {
          lesson["resources"] =
            lesson["resources"] + lessons[k]["videos"].length;
        }
        if (
          lessons[k]["audios"] !== undefined &&
          lessons[k]["audios"] !== null &&
          (lessons[k]["audios"].length > 1 ||
            (lessons[k]["audios"].length == 1 &&
              lessons[k]["audios"][0] !== ""))
        ) {
          lesson["resources"] =
            lesson["resources"] + lessons[k]["audios"].length;
          lesson["audios"] = lessons[k]["audios"].length;
          if (lessons[k]["section"] !== "sss") {
            audios_available = true;
          }
        }
        if (
          lessons[k]["baithak_videos"] !== undefined &&
          lessons[k]["baithak_videos"] !== null &&
          (lessons[k]["baithak_videos"].length > 1 ||
            (lessons[k]["baithak_videos"].length == 1 &&
              lessons[k]["baithak_videos"][0] !== ""))
        ) {
          lesson["resources"] =
            lesson["resources"] + lessons[k]["baithak_videos"].length;
        }
        if (
          lessons[k]["activities"] !== undefined &&
          lessons[k]["activities"] !== null &&
          (lessons[k]["activities"].length > 1 ||
            (lessons[k]["activities"].length == 1 &&
              lessons[k]["activities"][0] !== ""))
        ) {
          lesson["resources"] =
            lesson["resources"] + lessons[k]["activities"].length;
        }
        if (
          lessons[k]["scert_solutions"] !== undefined &&
          lessons[k]["scert_solutions"] !== null &&
          (lessons[k]["scert_solutions"].length > 1 ||
            (lessons[k]["scert_solutions"].length == 1 &&
              lessons[k]["scert_solutions"][0] !== ""))
        ) {
          lesson["resources"] =
            lesson["resources"] + lessons[k]["scert_solutions"].length;
        }
        if (
          lessons[k]["assessment"] !== undefined &&
          lessons[k]["assessment"] !== null &&
          lessons[k]["assessment"] !== ""
        ) {
          lesson["resources"] = lesson["resources"] + 1;
        }
        if (
          lessons[k]["worksheet"] !== undefined &&
          lessons[k]["worksheet"] !== null &&
          lessons[k]["worksheet"] !== ""
        ) {
          lesson["resources"] = lesson["resources"] + 1;
        }
        if (
          lessons[k]["progress_chart"] !== undefined &&
          lessons[k]["progress_chart"] !== null &&
          lessons[k]["progress_chart"] !== ""
        ) {
          lesson["resources"] = lesson["resources"] + 1;
        }
        if (
          lessons[k]["assessmentId"] !== undefined &&
          lessons[k]["assessmentId"] !== null &&
          lessons[k]["assessmentId"] !== ""
        ) {
          lesson["resources"] = lesson["resources"] + 1;
        }
        if (
          lessons[k]["vocabularysentence"] !== undefined &&
          lessons[k]["vocabularysentence"] !== null &&
          lessons[k]["vocabularysentence"] !== ""
        ) {
          lesson["resources"] = lesson["resources"] + 1;
        }
        if (
          lessons[k]["vocabularyword"] !== undefined &&
          lessons[k]["vocabularyword"] !== null &&
          lessons[k]["vocabularyword"] !== ""
        ) {
          lesson["resources"] = lesson["resources"] + 1;
        }
        if (
          lessons[k]["audiotextbooks"] !== undefined &&
          lessons[k]["audiotextbooks"] !== null &&
          (lessons[k]["audiotextbooks"].length > 1 ||
            (lessons[k]["audiotextbooks"].length == 1 &&
              lessons[k]["audiotextbooks"][0] !== ""))
        ) {
          lesson["resources"] =
            lesson["resources"] + lessons[k]["audiotextbooks"].length;
        }
        department_total_progress =
          department_total_progress + lesson["progress"];
        govtlessons.push(lesson);
      }

      department["lessons"] = govtlessons;
      department["progress"] = 0;
      department["department_total_progress"] = 0;
      department["lesson_count"] = 0;
      department["audios_available"] = audios_available;

      if (govtlessons.length > 0) {
        department["department_total_progress"] = department_total_progress;
        department["lesson_count"] = govtlessons.length;
        department["progress"] = parseInt(
          department_total_progress / govtlessons.length
        );
        govt_classes.push(department);
      }
    }

    //Send sampark classes only when state data is blank
    if (govt_classes.length == 0) {
      //sampark classes and lessons
      for (var j = 0; j < departmentmasters.length; j++) {
        var department = {};
        var searchMask = " ";
        var regEx = new RegExp(searchMask, "ig");
        var replaceMask = "";
        var samparklessons = [];
        var audios_available = false;
        var department_total_progress = 0;
        temp_lesson_no = 0;

        department["id"] = departmentmasters[j]["id"];
        department["name"] = departmentmasters[j]["name"];
        sampark_indexes[departmentmasters[j]["id"]] = j;

        department["icon"] =
          apk_version < 4.8
            ? departmentmasters[j].name
                .toLowerCase()
                .replace(regEx, replaceMask) +
              "-" +
              subjectmasters[i].name.toLowerCase() +
              ".png"
            : config.assetHost +
              departmentmasters[j].name
                .toLowerCase()
                .replace(regEx, replaceMask) +
              "-" +
              subjectmasters[i].name.toLowerCase() +
              ".png";
        department["icon_active"] =
          config.assetHost +
          "big-" +
          departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask) +
          "-" +
          subjectmasters[i].name.toLowerCase() +
          ".png";

        // added by Milap for is_fln flag
        if (departmentmasters[j]["is_fln"] == true) {
          department["is_fln"] = true;
        } else {
          department["is_fln"] = false;
        }
        department["sort_order"] = departmentmasters[j]["sort_order"];
        // added by Milap for is_fln flag

        querylesson["subject"] = subjectmasters[i].id;
        querylesson["department"] = departmentmasters[j].id;
        querylesson["states"] = curUserStateId.toString();
        querylesson["section"] = "sss";
        querylesson["is_active"] = true;

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
          vocabularysentence: 1,
          vocabularyword: 1,
          audiotextbooks: 1,
        }).sort({ lesson_no: 1 });

        for (var k = 0; k < lessons.length; k++) {
          var lesson = {};
          temp_lesson_no = temp_lesson_no + 1;
          lesson["id"] = lessons[k]["id"];
          lesson["name"] = lessons[k]["name"];
          lesson["progress"] = 0;

          if (userid !== "") {
            checkprogresslesson = await Lessonprogress.find(
              { lesson: lessons[k]["id"], user: userid },
              { progress: 1 }
            );
            if (checkprogresslesson.length == 1) {
              lesson["progress"] = checkprogresslesson[0]["progress"];
            }
          }
          lesson["resources"] = 0;
          lesson["audios"] = 0;
          lesson["sort_order"] = temp_lesson_no;

          if (
            lessons[k]["kits"] !== undefined &&
            lessons[k]["kits"] !== null &&
            (lessons[k]["kits"].length > 1 ||
              (lessons[k]["kits"].length == 1 && lessons[k]["kits"][0] !== ""))
          ) {
            lesson["resources"] =
              lesson["resources"] + lessons[k]["kits"].length;
          }
          if (
            lessons[k]["videos"] !== undefined &&
            lessons[k]["videos"] !== null &&
            (lessons[k]["videos"].length > 1 ||
              (lessons[k]["videos"].length == 1 &&
                lessons[k]["videos"][0] !== ""))
          ) {
            lesson["resources"] =
              lesson["resources"] + lessons[k]["videos"].length;
          }
          if (
            lessons[k]["audios"] !== undefined &&
            lessons[k]["audios"] !== null &&
            (lessons[k]["audios"].length > 1 ||
              (lessons[k]["audios"].length == 1 &&
                lessons[k]["audios"][0] !== ""))
          ) {
            lesson["resources"] =
              lesson["resources"] + lessons[k]["audios"].length;
            lesson["audios"] = lessons[k]["audios"].length;
            if (lessons[k]["section"] == "sss") {
              audios_available = true;
            }
          }
          if (
            lessons[k]["baithak_videos"] !== undefined &&
            lessons[k]["baithak_videos"] !== null &&
            (lessons[k]["baithak_videos"].length > 1 ||
              (lessons[k]["baithak_videos"].length == 1 &&
                lessons[k]["baithak_videos"][0] !== ""))
          ) {
            lesson["resources"] =
              lesson["resources"] + lessons[k]["baithak_videos"].length;
          }
          if (
            lessons[k]["activities"] !== undefined &&
            lessons[k]["activities"] !== null &&
            (lessons[k]["activities"].length > 1 ||
              (lessons[k]["activities"].length == 1 &&
                lessons[k]["activities"][0] !== ""))
          ) {
            lesson["resources"] =
              lesson["resources"] + lessons[k]["activities"].length;
          }
          if (
            lessons[k]["scert_solutions"] !== undefined &&
            lessons[k]["scert_solutions"] !== null &&
            (lessons[k]["scert_solutions"].length > 1 ||
              (lessons[k]["scert_solutions"].length == 1 &&
                lessons[k]["scert_solutions"][0] !== ""))
          ) {
            scert_solutionid = lessons[k]["scert_solutions"];
            scert_solutions = await Scertsolution.find({
              _id: { $in: scert_solutionid },
            });
            if (scert_solutions.length > 0) {
              for (l = 0; l < scert_solutions.length; l++) {
                if (scert_solutions[l]["states"].indexOf(curUserState) !== -1) {
                  var query_scert = {};
                  query_scert["user"] = userid;
                  query_scert["scertsolution"] = {};
                  query_scert["scertsolution"] = scert_solutions[l]["_id"];
                  lesson["resources"] = lesson["resources"] + 1;
                }
              }
            }
          }
          if (
            lessons[k]["assessment"] !== undefined &&
            lessons[k]["assessment"] !== null &&
            lessons[k]["assessment"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["worksheet"] !== undefined &&
            lessons[k]["worksheet"] !== null &&
            lessons[k]["worksheet"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["progress_chart"] !== undefined &&
            lessons[k]["progress_chart"] !== null &&
            lessons[k]["progress_chart"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["assessmentId"] !== undefined &&
            lessons[k]["assessmentId"] !== null &&
            lessons[k]["assessmentId"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["boloId"] !== undefined &&
            lessons[k]["boloId"] !== null &&
            lessons[k]["boloId"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["vocabularyword"] !== undefined &&
            lessons[k]["vocabularyword"] !== null &&
            lessons[k]["vocabularyword"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["vocabularysentence"] !== undefined &&
            lessons[k]["vocabularysentence"] !== null &&
            lessons[k]["vocabularysentence"] !== ""
          ) {
            lesson["resources"] = lesson["resources"] + 1;
          }
          if (
            lessons[k]["audiotextbooks"] !== undefined &&
            lessons[k]["audiotextbooks"] !== null &&
            (lessons[k]["audiotextbooks"].length > 1 ||
              (lessons[k]["audiotextbooks"].length == 1 &&
                lessons[k]["audiotextbooks"][0] !== ""))
          ) {
            lesson["resources"] =
              lesson["resources"] + lessons[k]["audiotextbooks"].length;
          }
          department_total_progress =
            department_total_progress + lesson["progress"];
          samparklessons.push(lesson);
        }

        department["lessons"] = samparklessons;
        department["progress"] = 0;
        department["department_total_progress"] = department_total_progress;
        department["lesson_count"] = samparklessons.length;
        department["audios_available"] = audios_available;

        if (samparklessons.length > 0) {
          sampark_classes.push(department);
          department["progress"] = parseInt(
            department_total_progress / samparklessons.length
          );
        }
      }
    }

    if (govt_classes.length > 0) subject["govt_classes"] = govt_classes;
    else subject["govt_classes"] = "";

    if (govt_classes.length == 0 && sampark_classes.length > 0)
      subject["sampark_classes"] = sampark_classes;
    else subject["sampark_classes"] = "";

    //Below condition to skip subject if no classess are available - Added by Pratik
    if (
      subject["sampark_classes"].length > 0 ||
      subject["govt_classes"].length > 0
    )
      subjects.push(subject);
  }
  return subjects;
}
/* Fetch List of lessons ends */

async function getUserDetails(userId) {
  try {
    if (!userId) {
      return null;
    }
    const curUser = await User.findById(userId);
    if (!curUser) {
      return null;
    }
    const { usertype, state } = curUser;
    return { usertype, state };
  } catch(error) {
    console.log("Error in: ", error, "getUserDetails");
  }
}

async function getLessonDetails(lesson) {
  try {
    const {
      id,
      is_shareable,
      description,
      social_content,
      author,
      name,
      subject,
      department,
      module,
      sort_order,
      lesson_code,
    } = lesson;
  
    const regEx = new RegExp("class", "ig");
  
    const sub_title =
      module === "ssh"
        ? `${subject.name} ${department.name.replace(regEx, "")}`
        : `${subject.name} ${department.name.replace(
            regEx,
            ""
          )} | Lesson ${sort_order}`;
  
    const url = await getLessonUrl(lesson);
    const dimensions = await getThumbnailDimensions(lesson);
  
    const thumbnail = dimensions
      ? `${config.repositoryHost}${lesson.thumbnail}`
      : `https://img.youtube.com/vi/${lesson.lesson_code}/hqdefault.jpg`;
  
    const lessonDetails = {
      id,
      is_shareable,
      description,
      social_content,
      author,
      name,
      subject,
      department,
      sub_title,
      lesson_code,
      sort_order,
      url,
      thumbnail,
      width: dimensions?.width || "",
      height: dimensions?.height || "",
      stream_type: "ssslesson",
      stream_id: id,
      module,
      viewcount: 0,
      likecount: lesson.likecount,
      commentcount: lesson.commentcount,
    };
    console.log("Lesson Details: ", lessonDetails, "getLessonDetails");
    return lessonDetails;
  } catch(error) {
    console.log("Error in: ", error, "getLessonDetails");
  }
}

async function getLessonUrl(lesson) {
  const { url, module } = lesson;

  try {
    if (
      url &&
      fs.existsSync(config.uploadPath + "samparklessons/" + module + "/" + url)
    ) {
      return `${config.repositoryHost}samparklessons/${module}/${url}`;
    }
  } catch (err) {
    console.log("Error in: ", err, "getLessonUrl");
  }

  return "";
}

async function getThumbnailDimensions(lesson) {
  const { thumbnail } = lesson;

  try {
    if (thumbnail && fs.existsSync(config.uploadPath + thumbnail)) {
      return await getDimension(config.repositoryHost + thumbnail);
    }
  } catch (err) {
    console.log("Error in: ", err, "getThumbnailDimensions");
  }

  return null;
}

async function getAllbyDepartmentSubject(
  departmentname,
  subjectname,
  user,
  catgeory
) {
  try {
    const query = {
      is_active: true,
    };
  
    if (departmentname !== "") {
      query.department = departmentname;
    }
  
    if (subjectname !== "") {
      query.subject = subjectname;
    }
  
    const curUser = await getUserDetails(user);
  
    const lessons = await Lesson.find(query)
      .populate("subject", "name")
      .populate("department", "name")
      .select(
        "id name thumbnail description subject department author url is_shareable sort_order lesson_code module likecount commentcount social_content"
      )
      .sort({ sort_order: 1 });
  
    const lessonList = await Promise.all(
      lessons.map(async (lesson) => {
        const lessonDetails = await getLessonDetails(lesson);
        return lessonDetails;
      })
    );
    console.log("Lesson List: ", lessonList, "getAllbyDepartmentSubject");
    return lessonList;
  } catch(error) {
    console.log("Error in: ", error, "getAllbyDepartmentSubject");
  }
}

async function getById(id, userid, device_id) {
  try {
    const lesson = await Lesson.findOne({ _id: id }).select("-hash");
    if (!lesson) {
      return "";
    }
    let lessonDetails = {};
    lessonDetails["id"] = lesson["_id"];
    lessonDetails["lesson_no"] = lesson["lesson_no"]; //need to be change with actual sort order
    lessonDetails["name"] = lesson["name"];
    lessonDetails["launched"] = lesson["is_launched"];
    lessonDetails["is_active"] = lesson["is_active"];
    lessonDetails["description"] = lesson["description"].replace(/\n$/, "");
    lessonDetails["associated_with"] = lesson["section"];
    lessonDetails["progress"] = lesson["progress"];
    lessonDetails["are_resources_sequential"] =
      lesson["are_resources_sequential"];
    lessonDetails["vocabularyword_watched"] = false;
    lessonDetails["vocabularysentence_watched"] = false;
    lesson_vocabulary = lesson["vocabularyword"]
      ? lesson["vocabularyword"]
      : "";
    lesson_sentence = lesson["vocabularysentence"]
      ? lesson["vocabularysentence"]
      : "";
    lessonDetails["vocabularyword"] = lesson_vocabulary;
    lessonDetails["vocabularysentence"] = lesson_sentence;

    lessonDetails["videos"] = "";
    lessonDetails["audios"] = "";
    lessonDetails["audiotextbooks"] = "";
    lessonDetails["kits"] = "";
    lessonDetails["resources"] = [];
    lessonDetails["lesson_concepts"] = "";
    lessonDetails["govt_textbook"] = "";
    lessonDetails["sampark_textbook"] = "";
    lessonDetails["experiments"] = "";
    lessonDetails["science_songs"] = "";
    lessonDetails["chapter_terminologies"] = "";
    if (lesson["message_title"] == "" || lesson["message_description"] == "") {
      lessonDetails["message"] = "";
    } else {
      lessonDetails["message"] = {};
      lessonDetails["message"]["title"] = lesson["message_title"];
      lessonDetails["message"]["description"] = lesson["message_description"];
    }
    if (lesson["videos"].length > 0 && lesson["videos"][0] != "") {
      lessonDetails["resources_locked"] = true;
    } else {
      lessonDetails["resources_locked"] = false;
    }
    let curUserStateId = "";
    let curUser = "";
    let sssvideolikes = [];
    let videolikes = [];
    let audiolikes = [];
    let audiotextbooklikes = [];
    let audiotextbookwatched = [];
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
    let curUserState = "0";
    if (userid) {
      let vocabularywordviewed = await Vocabularywordviewed.find({
        user: userid,
        lesson: lesson["_id"],
      });
      let vocabularysentenceviewed = await Vocabularysentenceviewed.find({
        user: userid,
        lesson: lesson["_id"],
      });

      let vocabularywords = [];
      if (lesson_vocabulary != "") {
        const englishvocabulary = await Englishspeech.findOne({
          _id: lesson_vocabulary,
        });
        if (englishvocabulary["content"].length > 0) {
          const englishvocabularycontent = await Vocabularyword.where({
            _id: { $in: englishvocabulary["content"] },
          });
          for (let i = 0; i < englishvocabularycontent.length; i++) {
            let viewedStatus = await vocabularywordviewed.find(
              (o) => o.vocabularyword == englishvocabularycontent[i]["id"]
            );
            let attempted = false;
            let marks = 0;
            if (viewedStatus) {
              marks = viewedStatus["marks"];
              attempted = true;
            }
            let vocabularywordTemp = {};
            vocabularywordTemp["id"] = englishvocabularycontent[i]["id"];
            vocabularywordTemp["word"] = englishvocabularycontent[i]["word"];
            vocabularywordTemp["meaning"] =
              englishvocabularycontent[i]["meaning"];
            vocabularywordTemp["attempted"] = attempted;
            vocabularywordTemp["marks"] = marks;
            vocabularywords.push(vocabularywordTemp);
          }
        }
      }
      lessonDetails["vocabularywords"] = vocabularywords;

      let vocabularysentences = [];
      if (lesson_sentence != "") {
        const englishsentence = await Englishspeech.findOne({
          _id: lesson_sentence,
        });
        if (englishsentence["content"].length > 0) {
          const englishsentencecontent = await Vocabularysentence.where({
            _id: { $in: englishsentence["content"] },
          });
          for (let i = 0; i < englishsentencecontent.length; i++) {
            let viewedStatus = await vocabularysentenceviewed.find(
              (o) => o.vocabularysentence == englishsentencecontent[i]["id"]
            );
            let attempted = false;
            let marks = 0;
            if (viewedStatus) {
              marks = viewedStatus["marks"];
              attempted = true;
            }
            let vocabularysentenceTemp = {};
            vocabularysentenceTemp["id"] = englishsentencecontent[i]["id"];
            vocabularysentenceTemp["sentence"] =
              englishsentencecontent[i]["sentence"];
            vocabularysentenceTemp["meaning"] =
              englishsentencecontent[i]["meaning"];
            vocabularysentenceTemp["attempted"] = attempted;
            vocabularysentenceTemp["marks"] = marks;
            vocabularysentences.push(vocabularysentenceTemp);
          }
        }
      }
      lessonDetails["vocabularysentences"] = vocabularysentences;

      curUser = await User.findOne({ _id: userid }); //.populate('state',['name']);
      if (curUser) {
        isUnlockedlesson = await Unlockedlesson.find({
          lesson: lesson["_id"],
          user: curUser.id,
        }).select("-hash");
        if (isUnlockedlesson.length > 0) {
          lessonDetails["resources_locked"] = false;
        }
        curUserGroup = curUser.usertype;
        curUserState = curUser.state;
        const checkstate = await State.findById(curUserState);

        if (checkstate && checkstate["is_active"]) {
          curUserStateId = curUserState["_id"];
        } else {
          curUserState = "0";
          curUserStateId = "0";
        }
      }

      sssvideolikes = await Sssvideolike.distinct("video", { user: userid });
      sssvideolikes = sssvideolikes.map(function (item) {
        return item.toString();
      });
      videolikes = await Videolike.distinct("video", { user: userid });
      videolikes = videolikes.map(function (item) {
        return item.toString();
      });
      audiolikes = await Audiolike.distinct("audio", { user: userid });
      audiolikes = audiolikes.map(function (item) {
        return item.toString();
      });
      audiotextbooklikes = await Audiotextbooklike.distinct("audiotextbook", {
        user: userid,
      });
      audiotextbooklikes = audiotextbooklikes.map(function (item) {
        return item.toString();
      });
      sssvideowatched = await Sssvideoviewed.distinct("video", {
        user: userid,
      });
      sssvideowatched = sssvideowatched.map(function (item) {
        return item.toString();
      });
      videowatched = await Videoviewed.distinct("video", { user: userid });
      videowatched = videowatched.map(function (item) {
        return item.toString();
      });
      audiowatched = await Audioviewed.distinct("audio", { user: userid });
      audiowatched = audiowatched.map(function (item) {
        return item.toString();
      });
      audiotextbookwatched = await Audiotextbookviewed.distinct(
        "audiotextbook",
        { user: userid }
      );
      audiotextbookwatched = audiotextbookwatched.map(function (item) {
        return item.toString();
      });
      documentwatched = await Documentviewed.distinct("document", {
        user: userid,
      });
      documentwatched = documentwatched.map(function (item) {
        return item.toString();
      });

      kitwatched = await Kitviewed.distinct("kit", { user: userid });
      kitwatched = kitwatched.map(function (item) {
        return item.toString();
      });

      scertsolutionwatched = await Scertsolutionviewed.distinct(
        "scertsolution",
        { user: userid }
      );
      scertsolutionwatched = scertsolutionwatched.map(function (item) {
        return item.toString();
      });

      sssAssessmentWatched = await Sssassessmentviewed.distinct("assessment", {
        user: userid,
      });
      sssAssessmentWatched = sssAssessmentWatched.map((item) => {
        return item.toString();
      });
      boloWatched = await Boloviewed.distinct("boloId", { user: userid });
      boloWatched = boloWatched.map((item) => {
        return item.toString();
      });
      vocabularyWatched = await Englishspeechviewed.distinct(
        "englishspeechId",
        { user: userid }
      );

      vocabularyWatched = vocabularyWatched.map((item) => {
        return item.toString();
      });
      if (
        lesson_vocabulary != "" &&
        vocabularyWatched.indexOf(lesson_vocabulary.toString()) > -1
      ) {
        lessonDetails["vocabularyword_watched"] = true;
      }
      if (
        lesson_sentence != "" &&
        vocabularyWatched.indexOf(lesson_sentence.toString()) > -1
      ) {
        lessonDetails["vocabularysentence_watched"] = true;
      }
    } else {
      let vocabularywords = [];
      if (lesson_vocabulary != "") {
        const englishvocabulary = await Englishspeech.findOne({
          _id: lesson_vocabulary,
        });
        if (englishvocabulary["content"].length > 0) {
          const englishvocabularycontent = await Vocabularyword.where({
            _id: { $in: englishvocabulary["content"] },
          });
          for (let i = 0; i < englishvocabularycontent.length; i++) {
            vocabularywordTemp = {};
            vocabularywordTemp["id"] = englishvocabularycontent[i]["id"];
            vocabularywordTemp["word"] = englishvocabularycontent[i]["word"];
            vocabularywordTemp["meaning"] =
              englishvocabularycontent[i]["meaning"];
            vocabularywordTemp["attempted"] = false;
            vocabularywordTemp["marks"] = 0;
            vocabularywords.push(vocabularywordTemp);
          }
        }
      }
      lessonDetails["vocabularywords"] = vocabularywords;

      let vocabularysentences = [];
      if (lesson_sentence != "") {
        const englishsentence = await Englishspeech.findOne({
          _id: lesson_sentence,
        });
        if (englishsentence["content"].length > 0) {
          const englishsentencecontent = await Vocabularysentence.where({
            _id: { $in: englishsentence["content"] },
          });
          for (let i = 0; i < englishsentencecontent.length; i++) {
            let vocabularysentenceTemp = {};
            vocabularysentenceTemp["id"] = englishsentencecontent[i]["id"];
            vocabularysentenceTemp["sentence"] =
              englishsentencecontent[i]["sentence"];
            vocabularysentenceTemp["meaning"] =
              englishsentencecontent[i]["meaning"];
            vocabularysentenceTemp["attempted"] = false;
            vocabularysentenceTemp["marks"] = 0;
            vocabularysentences.push(vocabularysentenceTemp);
          }
        }
      }
      lessonDetails["vocabularysentences"] = vocabularysentences;
    }

    const sssvideoviews = [];
    const videoviews = [];
    const audioviews = [];
    if (lesson["is_launched"]) {
      if (lesson["videos"].length > 0 && lesson["videos"][0] != "") {
        const videos = await Video.find({ _id: { $in: lesson["videos"] } });
        if (videos.length > 0) {
          let samparkvideos1 = {};
          total_resources = total_resources + videos.length;
          for (const curVideo of videos) {
            let samparkvideo = {};
            samparkvideo["name"] = curVideo["name"];
            samparkvideo["description"] = curVideo["description"];

            if (sssvideolikes.indexOf(curVideo["id"]) > -1) {
              samparkvideo["is_liked"] = true;
            } else {
              samparkvideo["is_liked"] = "";
            }

            samparkvideo["watched"] = "";
            if (sssvideowatched.indexOf(curVideo["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkvideo["watched"] = true;
            }

            samparkvideo["is_shareable"] = true;
            samparkvideo["likecount"] = curVideo["likecount"];
            samparkvideo["commentcount"] = curVideo["commentcount"];
            samparkvideo["streamtype"] = "sssvideo";

            samparkvideo["id"] = curVideo["id"];
            samparkvideo["url"] =
              config.repositoryHost +
              "samparkvideos/" +
              curVideo["module"] +
              "/" +
              curVideo["url"];
            samparkvideo["video_code"] = curVideo["video_code"];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo["video_code"];
            samparkvideo["short_video_code"] = await TinyURL.shorten(
              youtubeURL
            );
            let duration = "";
            if (
              curVideo["duration_min"] != "" &&
              curVideo["duration_min"] != null
            ) {
              duration = curVideo["duration_min"] + " Mins ";
            }
            if (
              curVideo["duration_sec"] != "" &&
              curVideo["duration_sec"] != null
            ) {
              duration = duration + curVideo["duration_sec"] + " Secs";
            }
            samparkvideo["passing_duration"] = config.video_passing_percentage;
            samparkvideo["duration"] = duration;

            samparkvideo["views"] = curVideo["viewcount"];
            if (
              curVideo["thumbnail"] != "" &&
              curVideo["thumbnail"] != "null"
            ) {
              samparkvideo["thumbnail"] =
                config.repositoryHost + curVideo["thumbnail"];
            } else {
              samparkvideo["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curVideo["video_code"] +
                "/hqdefault.jpg";
            }
            samparkvideos1[curVideo["id"]] = samparkvideo;
          }

          let samparkvideos = [];
          for (const videoId of lesson["videos"]) {
            samparkvideos.push(samparkvideos1[videoId]);
          }
          lessonDetails["videos"] = samparkvideos;
          //lessonDetails["videos"] = "";// Commented to remove videos as youtube channel is blocked
        }
      }
      if (lesson["experiments"].length > 0 && lesson["experiments"][0] != "") {
        const videos = await Video.find({
          _id: { $in: lesson["experiments"] },
        });
        if (videos.length > 0) {
          let samparkvideos1 = {};
          total_resources = total_resources + videos.length;
          for (const curVideo of videos) {
            let samparkvideo = {};
            samparkvideo["name"] = curVideo["name"];
            samparkvideo["description"] = curVideo["description"];

            if (sssvideolikes.indexOf(curVideo["id"]) > -1) {
              samparkvideo["is_liked"] = true;
            } else {
              samparkvideo["is_liked"] = "";
            }

            samparkvideo["watched"] = "";
            if (sssvideowatched.indexOf(curVideo["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkvideo["watched"] = true;
            }

            samparkvideo["is_shareable"] = true;
            samparkvideo["likecount"] = curVideo["likecount"];
            samparkvideo["commentcount"] = curVideo["commentcount"];
            samparkvideo["streamtype"] = "sssvideo";

            samparkvideo["id"] = curVideo["id"];
            samparkvideo["url"] =
              config.repositoryHost +
              "samparkvideos/" +
              curVideo["module"] +
              "/" +
              curVideo["url"];
            samparkvideo["video_code"] = curVideo["video_code"];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo["video_code"];
            samparkvideo["short_video_code"] = await TinyURL.shorten(
              youtubeURL
            );
            let duration = "";
            if (
              curVideo["duration_min"] != "" &&
              curVideo["duration_min"] != null
            ) {
              duration = curVideo["duration_min"] + " Mins ";
            }
            if (
              curVideo["duration_sec"] != "" &&
              curVideo["duration_sec"] != null
            ) {
              duration = duration + curVideo["duration_sec"] + " Secs";
            }
            samparkvideo["passing_duration"] = config.video_passing_percentage;
            samparkvideo["duration"] = duration;

            samparkvideo["views"] = curVideo["viewcount"];
            if (
              curVideo["thumbnail"] != "" &&
              curVideo["thumbnail"] != "null"
            ) {
              samparkvideo["thumbnail"] =
                config.repositoryHost + curVideo["thumbnail"];
            } else {
              samparkvideo["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curVideo["video_code"] +
                "/hqdefault.jpg";
            }
            samparkvideos1[curVideo["id"]] = samparkvideo;
          }

          let samparkvideos = [];
          for (const videoId of lesson["experiments"]) {
            samparkvideos.push(samparkvideos1[videoId]);
          }
          lessonDetails["experiments"] = samparkvideos;
        }
      }

      if (
        lesson["science_songs"].length > 0 &&
        lesson["science_songs"][0] != ""
      ) {
        const videos = await Video.find({
          _id: { $in: lesson["science_songs"] },
        });
        if (videos.length > 0) {
          let samparkvideos1 = {};
          total_resources = total_resources + videos.length;
          for (const curVideo of videos) {
            let samparkvideo = {};
            samparkvideo["name"] = curVideo["name"];
            samparkvideo["description"] = curVideo["description"];

            if (sssvideolikes.indexOf(curVideo["id"]) > -1) {
              samparkvideo["is_liked"] = true;
            } else {
              samparkvideo["is_liked"] = "";
            }

            samparkvideo["watched"] = "";
            if (sssvideowatched.indexOf(curVideo["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkvideo["watched"] = true;
            }

            samparkvideo["is_shareable"] = true;
            samparkvideo["likecount"] = curVideo["likecount"];
            samparkvideo["commentcount"] = curVideo["commentcount"];
            samparkvideo["streamtype"] = "sssvideo";

            samparkvideo["id"] = curVideo["id"];
            samparkvideo["url"] =
              config.repositoryHost +
              "samparkvideos/" +
              curVideo["module"] +
              "/" +
              curVideo["url"];
            samparkvideo["video_code"] = curVideo["video_code"];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo["video_code"];
            samparkvideo["short_video_code"] = await TinyURL.shorten(
              youtubeURL
            );
            let duration = "";
            if (
              curVideo["duration_min"] != "" &&
              curVideo["duration_min"] != null
            ) {
              duration = curVideo["duration_min"] + " Mins ";
            }
            if (
              curVideo["duration_sec"] != "" &&
              curVideo["duration_sec"] != null
            ) {
              duration = duration + curVideo["duration_sec"] + " Secs";
            }
            samparkvideo["passing_duration"] = config.video_passing_percentage;
            samparkvideo["duration"] = duration;

            samparkvideo["views"] = curVideo["viewcount"];
            if (
              curVideo["thumbnail"] != "" &&
              curVideo["thumbnail"] != "null"
            ) {
              samparkvideo["thumbnail"] =
                config.repositoryHost + curVideo["thumbnail"];
            } else {
              samparkvideo["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curVideo["video_code"] +
                "/hqdefault.jpg";
            }
            samparkvideos1[curVideo["id"]] = samparkvideo;
          }

          let samparkvideos = [];
          for (const videoId of lesson["science_songs"]) {
            samparkvideos.push(samparkvideos1[videoId]);
          }
          lessonDetails["science_songs"] = samparkvideos;
        }
      }

      if (
        lesson["chapter_terminologies"].length > 0 &&
        lesson["chapter_terminologies"][0] != ""
      ) {
        const videos = await Video.find({
          _id: { $in: lesson["chapter_terminologies"] },
        });
        if (videos.length > 0) {
          let samparkvideos1 = {};
          total_resources = total_resources + videos.length;
          for (const curVideo of videos) {
            let samparkvideo = {};
            samparkvideo["name"] = curVideo["name"];
            samparkvideo["description"] = curVideo["description"];

            if (sssvideolikes.indexOf(curVideo["id"]) > -1) {
              samparkvideo["is_liked"] = true;
            } else {
              samparkvideo["is_liked"] = "";
            }

            samparkvideo["watched"] = "";
            if (sssvideowatched.indexOf(curVideo["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkvideo["watched"] = true;
            }

            samparkvideo["is_shareable"] = true;
            samparkvideo["likecount"] = curVideo["likecount"];
            samparkvideo["commentcount"] = curVideo["commentcount"];
            samparkvideo["streamtype"] = "sssvideo";

            samparkvideo["id"] = curVideo["id"];
            samparkvideo["url"] =
              config.repositoryHost +
              "samparkvideos/" +
              curVideo["module"] +
              "/" +
              curVideo["url"];
            samparkvideo["video_code"] = curVideo["video_code"];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo["video_code"];
            samparkvideo["short_video_code"] = await TinyURL.shorten(
              youtubeURL
            );
            let duration = "";
            if (
              curVideo["duration_min"] != "" &&
              curVideo["duration_min"] != null
            ) {
              duration = curVideo["duration_min"] + " Mins ";
            }
            if (
              curVideo["duration_sec"] != "" &&
              curVideo["duration_sec"] != null
            ) {
              duration = duration + curVideo["duration_sec"] + " Secs";
            }
            samparkvideo["passing_duration"] = config.video_passing_percentage;
            samparkvideo["duration"] = duration;

            samparkvideo["views"] = curVideo["viewcount"];
            if (
              curVideo["thumbnail"] != "" &&
              curVideo["thumbnail"] != "null"
            ) {
              samparkvideo["thumbnail"] =
                config.repositoryHost + curVideo["thumbnail"];
            } else {
              samparkvideo["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curVideo["video_code"] +
                "/hqdefault.jpg";
            }
            samparkvideos1[curVideo["id"]] = samparkvideo;
          }

          let samparkvideos = [];
          for (const videoId of lesson["chapter_terminologies"]) {
            samparkvideos.push(samparkvideos1[videoId]);
          }
          lessonDetails["chapter_terminologies"] = samparkvideos;
        }
      }

      if (
        lesson["audiotextbooks"].length > 0 &&
        lesson["audiotextbooks"][0] != ""
      ) {
        const audiotextbooks = await Audiotextbook.find({
          _id: { $in: lesson["audiotextbooks"] },
        });
        if (audiotextbooks.length > 0) {
          let samparkaudiotextbooks1 = {};
          total_resources = total_resources + audiotextbooks.length;
          for (const curVideo of audiotextbooks) {
            let samparkvideo = {};
            samparkvideo["name"] = curVideo["name"];
            samparkvideo["description"] = curVideo["description"];

            if (audiotextbooklikes.indexOf(curVideo["id"]) > -1) {
              samparkvideo["is_liked"] = true;
            } else {
              samparkvideo["is_liked"] = "";
            }

            samparkvideo["watched"] = "";
            if (audiotextbookwatched.indexOf(curVideo["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkvideo["watched"] = true;
            }

            samparkvideo["is_shareable"] = true;
            samparkvideo["likecount"] = curVideo["likecount"];
            samparkvideo["commentcount"] = curVideo["commentcount"];
            samparkvideo["streamtype"] = "audiotextbook";

            samparkvideo["id"] = curVideo["id"];
            samparkvideo["url"] =
              config.repositoryHost +
              "samparkaudios/" +
              curVideo["module"] +
              "/" +
              curVideo["url"];
            samparkvideo["video_code"] = curVideo["audiotextbook_code"];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['audiotextbook_code'];
            let youtubeURL =
              config.video_player_link + curVideo["audiotextbook_code"];
            samparkvideo["short_video_code"] = await TinyURL.shorten(
              youtubeURL
            );
            let duration = "";
            if (
              curVideo["duration_min"] != "" &&
              curVideo["duration_min"] != null
            ) {
              duration = curVideo["duration_min"] + " Mins ";
            }
            if (
              curVideo["duration_sec"] != "" &&
              curVideo["duration_sec"] != null
            ) {
              duration = duration + curVideo["duration_sec"] + " Secs";
            }
            samparkvideo["passing_duration"] = config.video_passing_percentage;
            samparkvideo["duration"] = duration;

            samparkvideo["views"] = curVideo["viewcount"];
            if (
              curVideo["thumbnail"] != "" &&
              curVideo["thumbnail"] != "null"
            ) {
              samparkvideo["thumbnail"] =
                config.repositoryHost + curVideo["thumbnail"];
            } else {
              samparkvideo["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curVideo["audiotextbook_code"] +
                "/hqdefault.jpg";
            }
            samparkaudiotextbooks1[curVideo["id"]] = samparkvideo;
          }

          let samparkaudiotextbooks = [];
          for (const videoId of lesson["audiotextbooks"]) {
            samparkaudiotextbooks.push(samparkaudiotextbooks1[videoId]);
          }
          lessonDetails["audiotextbooks"] = samparkaudiotextbooks;
          //lessonDetails["videos"] = "";// Commented to remove videos as youtube channel is blocked
        }
      }

      if (lesson["audios"].length > 0 && lesson["audios"][0] != "") {
        const audios = await Audio.find({
          _id: { $in: lesson["audios"] },
        }).sort({ sort_order: 1 });

        if (audios.length > 0) {
          let samparkaudios1 = {};
          total_resources = total_resources + audios.length;
          for (const curAudio of audios) {
            let samparkaudio = {};
            samparkaudio["name"] = curAudio["name"];
            samparkaudio["description"] =
              curAudio["name"] + " - " + curAudio["description"];
            samparkaudio["audio_code"] = curAudio["audio_code"];
            // youtubeURL = 'https://www.youtube.com/watch?v=' + curAudio['audio_code'];
            let youtubeURL = config.video_player_link + curAudio["audio_code"];
            samparkaudio["short_audio_code"] = await TinyURL.shorten(
              youtubeURL
            );
            samparkaudio["video_code"] = curAudio["audio_code"];
            samparkaudio["id"] = curAudio["id"];
            samparkaudio["watched"] = false;
            samparkaudio["is_shareable"] = true;
            samparkaudio["likecount"] = curAudio["likecount"];
            samparkaudio["commentcount"] = curAudio["commentcount"];
            samparkaudio["streamtype"] = "sssaudio";

            if (audiolikes.indexOf(curAudio["id"]) > -1) {
              samparkaudio["is_liked"] = true;
            } else {
              samparkaudio["is_liked"] = "";
            }

            samparkaudio["watched"] = "";
            if (audiowatched.indexOf(curAudio["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkaudio["watched"] = true;
            }
            var duration = "";
            if (
              curAudio["duration_min"] != "" &&
              curAudio["duration_min"] != null
            ) {
              duration = curAudio["duration_min"] + " Mins ";
            }
            if (
              curAudio["duration_sec"] != "" &&
              curAudio["duration_sec"] != null
            ) {
              duration = duration + curAudio["duration_sec"] + " Secs";
            }
            samparkaudio["duration"] = duration;
            samparkaudio["passing_duration"] = config.video_passing_percentage;
            samparkaudio["views"] = curAudio["viewcount"];

            if (
              curAudio["thumbnail"] != "" &&
              curAudio["thumbnail"] != "null"
            ) {
              samparkaudio["thumbnail"] =
                config.repositoryHost + curAudio["thumbnail"];
            } else {
              samparkaudio["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curAudio["audio_code"] +
                "/hqdefault.jpg";
            }
            samparkaudios1[curAudio["id"]] = samparkaudio;
          }
          let samparkaudios = [];
          for (const audioId of lesson["audios"]) {
            samparkaudios.push(samparkaudios1[audioId]);
          }
          lessonDetails["audios"] = samparkaudios;
          //lessonDetails["audios"] = "";// Commented to remove videos as youtube channel is blocked
        }
      }

      if (lesson["kits"].length > 0 && lesson["kits"][0] != "") {
        const kits = await Kit.find({ _id: { $in: lesson["kits"] } });

        if (kits.length > 0) {
          let samparkkits = [];
          for (const curKit of kits) {
            let samparkkit = {};
            samparkkit["id"] = curKit["id"] ? curKit["id"] : "";
            samparkkit["name"] = curKit["name"] ? curKit["name"] : "";
            samparkkit["pdfname"] = curKit["pdfname"] ? curKit["pdfname"] : "";
            samparkkit["pdf"] = curKit["pdf"]
              ? config.repositoryHost + curKit["pdf"]
              : "";
            if (samparkkit["pdf"] != "") {
              total_resources = total_resources + 1;
            }
            if (curKit["images"].length > 0) {
              samparkkit["images"] = [];
              samparkkit["kitimages"] = [];
              for (const curKitImage of curKit["images"]) {
                if (curKitImage && curKitImage !== null) {
                  let kitimage = {};
                  kitimage["path"] = config.repositoryHost + curKitImage;
                  let dimensions = await getDimension(
                    config.repositoryHost + curKitImage
                  );
                  kitimage["width"] = dimensions["width"];
                  kitimage["height"] = dimensions["height"];
                  samparkkit["kitimages"].push(kitimage);
                  samparkkit["images"].push(
                    config.repositoryHost + curKitImage
                  );
                }
              }
            } else {
              samparkkit["images"] = "";
            }
            samparkkit["watched"] = false;
            if (kitwatched.indexOf(curKit["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkkit["watched"] = true;
            }
            samparkkits.push(samparkkit);
          }
          lessonDetails["kits"] = samparkkits;
        }
      }
    } else {
      if (lesson["videos"].length > 0 && lesson["videos"][0] != "") {
        const videos = await Video.find({
          _id: { $in: lesson["videos"] },
        }).populate("concept");
        let concepts = [];
        let lesson_concepts = [];
        if (videos.length > 0) {
          let samparkvideos1 = {};
          let conceptkeys = {};
          let conceptkeyindex = 0;
          total_resources = total_resources + videos.length;

          for (const curVideo of videos) {
            if (!conceptkeys.hasOwnProperty(curVideo["concept"]["id"])) {
              conceptkeys[curVideo["concept"]["id"]] = conceptkeyindex;
              concepts[conceptkeyindex] = {};
              concepts[conceptkeyindex]["name"] = curVideo["concept"]["name"];
              concepts[conceptkeyindex]["videos"] = [];
              conceptkeyindex = conceptkeyindex + 1;
            }
            let currentindex = conceptkeys[curVideo["concept"]["id"]];

            let samparkvideo = {};
            samparkvideo["index"] = currentindex;
            samparkvideo["id"] = curVideo["id"];
            samparkvideo["url"] =
              config.repositoryHost +
              "samparkvideos/" +
              curVideo["module"] +
              "/" +
              curVideo["url"];
            samparkvideo["name"] = curVideo["name"];

            if (sssvideolikes.indexOf(curVideo["id"]) > -1) {
              samparkvideo["is_liked"] = true;
            } else {
              samparkvideo["is_liked"] = "";
            }

            samparkvideo["watched"] = "";
            if (sssvideowatched.indexOf(curVideo["id"]) > -1) {
              total_resources_watched = total_resources_watched + 1;
              samparkvideo["watched"] = true;
            }
            samparkvideo["is_shareable"] = true;
            samparkvideo["likecount"] = curVideo["likecount"];
            samparkvideo["commentcount"] = curVideo["commentcount"];
            samparkvideo["streamtype"] = "sssvideo";

            samparkvideo["video_code"] = curVideo["video_code"];

            // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
            let youtubeURL = config.video_player_link + curVideo["video_code"];
            samparkvideo["short_video_code"] = await TinyURL.shorten(
              youtubeURL
            );

            let duration = "";
            if (
              curVideo["duration_min"] != "" &&
              curVideo["duration_min"] != null
            ) {
              duration = curVideo["duration_min"] + " Mins ";
            }
            if (
              curVideo["duration_sec"] != "" &&
              curVideo["duration_sec"] != null
            ) {
              duration = duration + curVideo["duration_sec"] + " Secs";
            }
            samparkvideo["duration"] = duration;
            samparkvideo["passing_duration"] = config.video_passing_percentage;
            samparkvideo["views"] = curVideo["viewcount"];
            if (
              curVideo["thumbnail"] != "" &&
              curVideo["thumbnail"] != "null"
            ) {
              samparkvideo["thumbnail"] =
                config.repositoryHost + curVideo["thumbnail"];
            } else {
              samparkvideo["thumbnail"] =
                "https://img.youtube.com/vi/" +
                curVideo["video_code"] +
                "/hqdefault.jpg";
            }
            concepts[currentindex]["videos"].push(samparkvideo);
          }
          lessonDetails["lesson_concepts"] = concepts;
        }
      }
    }

    if (lesson["section"] == "sss") {
      let govt_textbooks = JSON.parse(lesson["govt_textbook_mapping"]);
      lessonDetails["govt_textbook"] =
        curUserStateId != "" && govt_textbooks.hasOwnProperty(curUserStateId)
          ? govt_textbooks[curUserStateId]
          : govt_textbooks["0"];

      if (lessonDetails["govt_textbook"] == null) {
        lessonDetails["govt_textbook"] = "";
      }
    } else {
      let govt_textbooks = JSON.parse(lesson["govt_textbook_mapping"]);
      lessonDetails["sampark_textbook"] =
        curUserStateId != "" && govt_textbooks.hasOwnProperty(curUserStateId)
          ? govt_textbooks[curUserStateId]
          : govt_textbooks["0"];

      if (lessonDetails["sampark_textbook"] == null) {
        lessonDetails["sampark_textbook"] = "";
      }
    }

    let queryDocument = {};
    let queryDocumentIds = [];
    if (lesson["worksheet"] != "") {
      queryDocumentIds.push(lesson["worksheet"]);
    }
    if (lesson["assessment"] != "") {
      queryDocumentIds.push(lesson["assessment"]);
    }
    if (lesson["progress_chart"] != "") {
      queryDocumentIds.push(lesson["progress_chart"]);
    }
    if (lesson["lesson_plan"] != "") {
      queryDocumentIds.push(lesson["lesson_plan"]);
    }
    if (lesson["project_works"] != "") {
      console.log("Inside project works - - - - - -");
      queryDocumentIds.push(lesson["project_works"]);
    }
    let documents = await Document.find({ _id: { $in: queryDocumentIds } });
    let resourses_seq = {};

    let i = 0;
    for (const curDocument of documents) {
      let resource = {};
      total_resources = total_resources + 1;
      resourses_seq[curDocument["doc_type"]] = i;
      i = i + 1;
      resource["type"] = curDocument["doc_type"];
      resource["id"] = curDocument["id"];
      resource["watched"] = "";
      if (documentwatched.indexOf(curDocument["id"]) > -1) {
        total_resources_watched = total_resources_watched + 1;
        resource["watched"] = true;
      }
      resource["name"] = config.doc_types[curDocument["doc_type"]];
      resource["url"] = config.repositoryHost + curDocument["doc_url"];
      urlPath = config.repositoryHost + curDocument["doc_url"];
      resource["short_url"] = await TinyURL.shorten(urlPath);

      lessonDetails["resources"].push(resource);
    }

    if (lesson["assessmentId"] != null && lesson["assessmentId"] != undefined) {
      let resource = {};
      resource["type"] = "sssassessment";
      resource["assessmentId"] = lesson["assessmentId"];
      resource["watched"] = "";
      resource["name"] = "Practice Quiz";
      resourses_seq["sssassessment"] = Object.keys(resourses_seq).length;
      total_resources = total_resources + 1;

      if (sssAssessmentWatched.indexOf(lesson["assessmentId"] + "") > -1) {
        resource["watched"] = true;
        total_resources_watched = total_resources_watched + 1;
      }
      lessonDetails["resources"].push(resource);
    }

    if (lesson["boloId"] != null && lesson["boloId"] != undefined) {
      let resource = {};
      resource["type"] = "bolo";
      resource["boloId"] = lesson["boloId"];
      resource["watched"] = "";
      resource["name"] = "Read Along";
      resourses_seq["bolo"] = Object.keys(resourses_seq).length;
      if (lesson["boloId"] != "") total_resources = total_resources + 1;
      if (boloWatched.indexOf(lesson["boloId"]) > -1) {
        resource["watched"] = true;
        total_resources_watched = total_resources_watched + 1;
      }
      lessonDetails["resources"].push(resource);
    }

    if (lesson["scert_solutions"] !== null) {
      if (
        lesson["scert_solutions"].length > 1 ||
        (lesson["scert_solutions"].length == 1 &&
          lesson["scert_solutions"][0] !== "")
      ) {
        let scert_solutionid = lesson["scert_solutions"];
        const scert_solutions = await Scertsolution.find({
          _id: { $in: scert_solutionid },
        }); //
        if (scert_solutions.length > 0) {
          for (const curScertSol of scert_solutions) {
            if (curScertSol["states"].indexOf(curUserState) !== -1) {
              let resource = {};
              resource["type"] = "scertsolution";
              //resource['name'] = 'SCERT Solution';
              resource["name"] = "Solved Workbook";
              resource["id"] = curScertSol["id"];
              resource["watched"] = "";
              if (scertsolutionwatched.indexOf(curScertSol["id"]) > -1) {
                resource["watched"] = true;
                total_resources_watched = total_resources_watched + 1;
              }
              resource["url"] = config.repositoryHost + curScertSol["doc_url"];
              lessonDetails["resources"].push(resource);
              resourses_seq["scertsolution"] =
                Object.keys(resourses_seq).length;
            }
          }
        }
      }
    }

    if (
      lesson["baithak_videos"].length > 0 &&
      lesson["baithak_videos"][0] != ""
    ) {
      const bvideos = await Videostream.find({
        _id: { $in: lesson["baithak_videos"] },
      });
      let baithak_watched = true;
      if (bvideos.length > 0) {
        let baithakvideos = [];
        total_resources = total_resources + bvideos.length;
        for (const curBVideo of bvideos) {
          let samparkvideo = {};
          samparkvideo["id"] = curBVideo["id"];

          if (videolikes.indexOf(curBVideo["id"]) > -1) {
            samparkvideo["is_liked"] = videolikes[curBVideo["id"]]
              ? videolikes[curBVideo["id"]]
              : "";
          } else {
            samparkvideo["is_liked"] = "";
          }
          samparkvideo["watched"] = "";
          if (videowatched.indexOf(curBVideo["id"]) > -1) {
            samparkvideo["watched"] = true;
            total_resources_watched = total_resources_watched + 1;
          }
          if (samparkvideo["watched"] == "") {
            baithak_watched = "";
          }
          samparkvideo["is_shareable"] = true;
          samparkvideo["likecount"] = curBVideo["likecount"];
          samparkvideo["commentcount"] = curBVideo["commentcount"];
          samparkvideo["streamtype"] = "video";

          var duration = "";
          if (
            curBVideo["duration_min"] != "" &&
            curBVideo["duration_min"] != null
          ) {
            duration = curBVideo["duration_min"] + " Mins ";
          }
          if (
            curBVideo["duration_sec"] != "" &&
            curBVideo["duration_sec"] != null
          ) {
            duration = duration + curBVideo["duration_sec"] + " Secs";
          }
          samparkvideo["passing_duration"] = config.video_passing_percentage;
          samparkvideo["duration"] = duration;
          samparkvideo["views"] = curBVideo["viewcount"];

          samparkvideo["url"] =
            config.repositoryHost +
            "samparkvideos/" +
            curBVideo["module"] +
            "/" +
            curBVideo["url"];
          samparkvideo["name"] = curBVideo["name"]
            ? curBVideo["name"]
            : curBVideo["description"];
          samparkvideo["video_code"] = curBVideo["youtube_code"];
          // youtubeURL = 'https://www.youtube.com/watch?v=' + curBVideo['youtube_code'];
          let youtubeURL = config.video_player_link + curBVideo["youtube_code"];
          samparkvideo["short_video_code"] = await TinyURL.shorten(youtubeURL);
          if (
            curBVideo["thumbnail"] != "" &&
            curBVideo["thumbnail"] != "null"
          ) {
            samparkvideo["thumbnail"] =
              config.repositoryHost + curBVideo["thumbnail"];
          } else {
            samparkvideo["thumbnail"] =
              "https://img.youtube.com/vi/" +
              curBVideo["video_code"] +
              "/hqdefault.jpg";
          }
          baithakvideos.push(samparkvideo);
        }
        var resource = {};
        resource["type"] = "baithak";
        resource["watched"] = baithak_watched;
        resource["name"] = "Aapki Baithak";
        resource["videos"] = baithakvideos;
        lessonDetails["resources"].push(resource);
        resourses_seq["baithak"] = Object.keys(resourses_seq).length;
      }
    }

    if (userid !== "") {
      lessonDetails["progress"] = new_progress;
      let lessonUpdatedData = {};
      const checkprogresslesson = await Lessonprogress.find({
        lesson: lesson["_id"],
        user: userid,
      });
      if (checkprogresslesson.length > 0) {
        lessonDetails["progress"] = checkprogresslesson[0]["progress"];
      }
    } else {
      lessonDetails["progress"] = 0;
    }

    // added by milap for preschool
    if (lesson["pschoolUrl"] != null && lesson["pschoolUrl"] != undefined) {
      let resource = {};
      resource["type"] = "pschoolUrl";
      resource["pschoolUrl"] = lesson["pschoolUrl"];
      resource["watched"] = "";
      resource["name"] = "pschoolUrl";
      resourses_seq["pschoolUrl"] = Object.keys(resourses_seq).length;
      lessonDetails["resources"].push(resource);
    }
    // added by milap for preschool

    let new_resources = [];
    if (resourses_seq.hasOwnProperty("baithak"))
      new_resources.push(lessonDetails["resources"][resourses_seq["baithak"]]);
    if (resourses_seq.hasOwnProperty("worksheet"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["worksheet"]]
      );
    if (resourses_seq.hasOwnProperty("lesson_plan"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["lesson_plan"]]
      );
    if (resourses_seq.hasOwnProperty("assessment"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["assessment"]]
      );
    if (resourses_seq.hasOwnProperty("sssassessment"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["sssassessment"]]
      );
    if (resourses_seq.hasOwnProperty("progress_chart"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["progress_chart"]]
      );
    if (resourses_seq.hasOwnProperty("project_work"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["project_work"]]
      );
    if (resourses_seq.hasOwnProperty("bolo"))
      new_resources.push(lessonDetails["resources"][resourses_seq["bolo"]]);
    if (resourses_seq.hasOwnProperty("scertsolution"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["scertsolution"]]
      );
    // added by milap for preschool
    if (resourses_seq.hasOwnProperty("pschoolUrl"))
      new_resources.push(
        lessonDetails["resources"][resourses_seq["pschoolUrl"]]
      );
    // added by milap for preschool
    //    lessonDetails['resourcesseq'] = resourses_seq;
    lessonDetails["resources"] = new_resources;
    lessonDetails["total_resources_watched"] = total_resources_watched;
    lessonDetails["total_resources"] = total_resources;
    return lessonDetails;
  } catch (e) {
    console.log("Error in: ", e, "getLessonById");
  }
}

async function create(req) {
  // validate
  lessonParam = req.body;

  var current_user = get_current_user(req);

  lessonParam.createdBy = current_user;
  lessonParam.updatedBy = current_user;
  lessonParam.states = lessonParam.states.split(",");
  if (lessonParam.activities) {
    lessonParam.activities = lessonParam.activities.split(",");
  }
  if (lessonParam.videos) {
    lessonParam.videos = lessonParam.videos.split(",");
  }
  if (lessonParam.audios) {
    lessonParam.audios = lessonParam.audios.split(",");
  }
  if (lessonParam.baithak_videos) {
    lessonParam.baithak_videos = lessonParam.baithak_videos.split(",");
  }
  if (lessonParam.kits) {
    lessonParam.kits = lessonParam.kits.split(",");
  }
  if (lessonParam.scert_solutions) {
    lessonParam.scert_solutions = lessonParam.scert_solutions.split(",");
  }

  const lesson = new Lesson(lessonParam);

  // save lesson
  await lesson.save();
  return { success: true };
}

async function edit(id) {
  lesson = await Lesson.find({ _id: id }).select("-hash");

  if (lesson.length != 1) {
    return "";
  }
  lesson = lesson[0];

  var lessondetail = {};

  lessondetail["is_launched"] = lesson.is_launched;
  lessondetail["is_active"] = lesson.is_active;
  lessondetail["name"] = lesson.name;
  lessondetail["lesson_no"] = lesson.lesson_no;
  lessondetail["description"] = lesson.description;
  lessondetail["message_type"] = lesson.message_type ? lesson.message_type : "";
  lessondetail["message_title"] = lesson.message_title
    ? lesson.message_title
    : "";
  lessondetail["message_description"] = lesson.message_description
    ? lesson.message_description
    : "";
  lessondetail["department"] = lesson.department;
  lessondetail["subject"] = lesson.subject;
  lessondetail["worksheet"] = lesson.worksheet;
  lessondetail["assessment"] = lesson.assessment;
  lessondetail["lesson_plan"] = lesson.lesson_plan;
  lessondetail["progress_chart"] = lesson.progress_chart;
  lessondetail["activity"] = lesson.activities;
  lessondetail["scert_solution"] = lesson.scert_solutions;
  lessondetail["video"] = lesson.videos;
  lessondetail["audio"] = lesson.audios;
  lessondetail["baithak"] = lesson.baithak_videos;
  lessondetail["govt_textbook_mapping"] = lesson.govt_textbook_mapping;
  lessondetail["kit"] = lesson.kits;
  lessondetail["section"] = lesson.section;
  lessondetail["states"] = lesson.states;
  lessondetail["createdDate"] = lesson.createdDate;
  lessondetail["id"] = lesson.id;
  return lessondetail;
}

async function update(id, req) {
  lessonParam = req.body;
  const lesson = await Lesson.findById(id);
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  // validate
  if (!lesson) throw "Lesson not found";
  if (
    lesson.lesson_code !== lessonParam.lesson_code &&
    (await Lesson.findOne({ lesson_code: lessonParam.lesson_code }))
  ) {
    //throw 'Lesson "' + lessonParam.lesson_code + '" is already taken';
  }

  lessonParam.updatedDate = updatedAt;
  lessonParam.updatedBy = current_user;
  lessonParam.states = lessonParam.states.split(",");
  if (lessonParam.activities) {
    lessonParam.activities = lessonParam.activities.split(",");
  }
  if (lessonParam.videos) {
    lessonParam.videos = lessonParam.videos.split(",");
  }
  if (lessonParam.audios) {
    lessonParam.audios = lessonParam.audios.split(",");
  }
  if (lessonParam.baithak_videos) {
    lessonParam.baithak_videos = lessonParam.baithak_videos.split(",");
  }
  if (lessonParam.kits) {
    lessonParam.kits = lessonParam.kits.split(",");
  }
  if (lessonParam.scert_solutions) {
    lessonParam.scert_solutions = lessonParam.scert_solutions.split(",");
  }
  // copy lessonParam properties to lesson
  Object.assign(lesson, lessonParam);
  await lesson.save();

  var unsetkeys = {};
  if (!lessonParam.worksheet) {
    unsetkeys["worksheet"] = 1;
  }
  if (!lessonParam.assessment) {
    unsetkeys["assessment"] = 1;
  }
  if (!lessonParam.progress_chart) {
    unsetkeys["progress_chart"] = 1;
  }
  if (Object.keys(unsetkeys).length > 0) {
    await Lesson.updateOne({ _id: lesson.id }, { $unset: unsetkeys });
  }

  return { success: true };
}

async function vocabularyviewed(req) {
  lessonParam = req.body;
  let vocabularytype = lessonParam.vocabularytype;
  let vocabularyid = lessonParam.vocabularyid;
  let marksArray = lessonParam.marksArray;
  let lessonid = lessonParam.lessonid;
  let current_user = lessonParam.user;
  const lesson = await Lesson.findById(lessonid);
  let updatedAt = new Date();
  // validate
  if (!lesson) throw "Lesson not found";
  if (
    lesson.lesson_code !== lessonParam.lesson_code &&
    (await Lesson.findOne({ lesson_code: lessonParam.lesson_code }))
  ) {
    //throw 'Lesson "' + lessonParam.lesson_code + '" is already taken';
  }

  if (vocabularytype == "word") {
    for (var i = 0; i < marksArray.length; i++) {
      const vocabularywordviewedParam = {};
      vocabularywordviewedParam.user = current_user;
      vocabularywordviewedParam.lesson = lesson;
      vocabularywordviewedParam.vocabularyword = marksArray[i]["id"];
      vocabularywordviewedParam.marks = marksArray[i]["marks"];
      const vocabularywordviewed = new Vocabularywordviewed(
        vocabularywordviewedParam
      );
      await vocabularywordviewed.save();
    }
  } else {
    for (var i = 0; i < marksArray.length; i++) {
      const vocabularysentenceviewedParam = {};
      vocabularysentenceviewedParam.user = current_user;
      vocabularysentenceviewedParam.lesson = lesson;
      vocabularysentenceviewedParam.vocabularyword = marksArray[i]["id"];
      vocabularysentenceviewedParam.marks = marksArray[i]["marks"];
      const vocabularysentenceviewed = new Vocabularysentenceviewed(
        vocabularysentenceviewedParam
      );
      await vocabularysentenceviewed.save();
    }
  }

  return { success: true };
}

async function _delete(id) {
  await Lesson.findByIdAndRemove(id);
  await Stream.deleteMany({ item_type: "ssslesson", item_id: id });
  return { success: true };
}
