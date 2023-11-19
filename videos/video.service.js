const config = require("../config.json");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const update_user_points = commonmethods.update_user_points;
const uploadToS3 = commonmethods.uploadToS3;
const get_current_user = commonmethods.get_current_user;
const User = db.User;
const Video = db.Video;
const Audiotextbook = db.Audiotextbook;
const Stream = db.Stream;
const Sssvideolike = db.Sssvideolike;
const Qrscan = db.Qrscan;
const Videocategory = db.Videocategory;
const Sssvideocomment = db.Sssvideocomment;
const Activity = db.Activity;
const Document = db.Document;
const Scertsolution = db.Scertsolution;

const path = require("path");
const Q = require("q");

module.exports = {
  getAll,
  getAllbyDepartmentSubject,
  getById,
  getByQRCode,
  create,
  update,
  edit,
  delete: _delete,
};

/**
 * To get all videos
 * @param module
 * @returns video list
 * */
async function getAll(module) {
  let query = {};
  if (module !== "") {
    query["module"] = module;
  }
  const videos = await Video.find(query)
    .populate("subject", "name")
    .populate("department", "name")
    .select(
      "id name thumbnail description subject department author url is_shareable sort_order video_code module likecount commentcount duration_min duration_sec"
    );

  for (const curVideo of videos) {
    curVideo["thumbnail"] = config.repositoryHost + curVideo["thumbnail"];
  }
  return videos;
}

/**
 * To check and return video duration
 * @param durationMin and @param durationSec
 * @returns video duration
 * */
async function getVideoDuration(durationMin, durationSec) {
  let duration = "";
  if (durationMin != "" && durationMin != null) {
    duration = durationMin + " Mins ";
  }
  if (durationSec != "" && durationSec != null) {
    duration = duration + durationSec + " Secs";
  }
  return duration;
}

/**
 * To parse and retrieve video sub title
 * @params moduleName, subjectName, departmentName & sortOrder
 * @returns video subtitle
 * */
async function getVideoSubtitle(
  moduleName,
  subjectName,
  departmentName,
  sortOrder
) {
  const searchMask = "class";
  const regEx = new RegExp(searchMask, "ig");
  const replaceMask = "";
  let videoSubTitle = "";

  if (moduleName == "ssh") {
    videoSubTitle =
      subjectName + " " + departmentName.replace(regEx, replaceMask);
  } else {
    let lesson_string = "Lesson";
    if (subjectName.toLowerCase() == "english") {
      lesson_string = "Video";
    }
    videoSubTitle =
      subjectName +
      " " +
      departmentName.replace(regEx, replaceMask) +
      " | " +
      lesson_string +
      " " +
      sortOrder;
  }
  return videoSubTitle;
}

/**
 * To check and return video url
 * @params moduleName & videoUrl
 * @returns video url
 * */
async function getVideoUrl(moduleName, videoUrl) {
  let url = "";
  try {
    if (videoUrl != "" && videoUrl != "null" && videoUrl != null) {
      url =
        config.repositoryHost + "samparkvideos/" + moduleName + "/" + videoUrl;
    }
  } catch (err) {}
  return url;
}

/**
 * To check and return video thumbnail
 * @params thumbnail, videoCode
 * @returns video thumbnail
 * */
async function getVideoThumbnail(thumbnail, videoCode) {
  let videoThumbnail =
    "https://img.youtube.com/vi/" + videoCode + "/hqdefault.jpg";
  try {
    if (thumbnail != "" && thumbnail != "null" && thumbnail != null) {
      videoThumbnail = config.repositoryHost + thumbnail;
    }
  } catch (err) {}
  return videoThumbnail;
}

/**
 * To get videos based on department, subject
 * @params department, subject and user
 * @returns video list
 * */
async function getAllbyDepartmentSubject(departmentname, subjectname, user) {
  const defer = Q.defer();

  try {
    const query = { is_active: true };
    const likequery = user ? { user: user } : {};
    const videolikes = user ? await Sssvideolike.distinct("video", likequery) : [];

    if (departmentname !== "") {
      query.department = departmentname;
    }
    if (subjectname !== "") {
      query.subject = subjectname;
    }

    const videos = await Video.find(query)
      .populate("subject", "name")
      .populate("department", "name")
      .select(
        "id name thumbnail description subject department author url is_shareable sort_order video_code module likecount commentcount social_content duration_min duration_sec"
      )
      .sort({ sort_order: 1 });

    const videoList = await Promise.all(
      videos.map(async (curVideo) => {
        const moduleName = curVideo.module;
        const subjectName = curVideo.subject.name;
        const departmentName = curVideo.department.name;
        const sortOrder = curVideo.sort_order;

        const video = {
          id: curVideo.id,
          is_shareable: curVideo.is_shareable,
          description: curVideo.description,
          social_content: curVideo.social_content,
          author: curVideo.author,
          name: curVideo.name,
          subject: curVideo.subject,
          department: curVideo.department,
          duration: await getVideoDuration(curVideo.duration_min, curVideo.duration_sec),
          sub_title: await getVideoSubtitle(moduleName, subjectName, departmentName, sortOrder),
          video_code: curVideo.video_code,
          sort_order: sortOrder,
          width: curVideo.width,
          height: curVideo.height,
          url: await getVideoUrl(moduleName, curVideo.url),
          thumbnail: await getVideoThumbnail(curVideo.thumbnail, curVideo.video_code),
          is_liked: videolikes.includes(curVideo.id) ? true : false,
          category: "",
          stream_type: "sssvideo",
          stream_id: curVideo.id,
          module: curVideo.module,
          viewcount: 0,
          likecount: curVideo.likecount,
          commentcount: curVideo.commentcount,
        };

        return video;
      })
    );

    defer.resolve(videoList);
  } catch (e) {
    defer.reject(e);
  }

  return defer.promise;
}

async function getById(id, user) {
  video1 = await Video.find({ _id: id })
    .populate("subject", "name")
    .populate("department", "name")
    .select("-hash");

  if (video1.length != 1) {
    return "";
  }
  video1 = video1[0];

  video = video1.toObject();
  id = video["_id"];
  video["id"] = video["_id"];
  video["is_liked"] = "";
  video["module"] = video["module"];
  var duration = "";
  if (video["duration_min"] != "" && video["duration_min"] != null) {
    duration = video["duration_min"] + " Mins ";
  }
  if (video["duration_sec"] != "" && video["duration_sec"] != null) {
    duration = duration + video["duration_sec"] + " Secs";
  }
  video["duration"] = duration;
  video["stream_type"] = "sssvideo";
  video["stream_id"] = video["_id"];
  var videoDocuments = {};
  videolikecount = await Sssvideolike.find({ video: id }).countDocuments();
  video["likecount"] = videolikecount;
  video["viewcount"] = 0;

  videocommentcount = await Sssvideocomment.find({
    video: id,
  }).countDocuments();
  video["commentcount"] = videocommentcount;

  var searchMask = "class";
  var regEx = new RegExp(searchMask, "ig");
  var replaceMask = "";

  if (video1["module"] == "ssh") {
    video["sub_title"] =
      video1["subject"]["name"] +
      " " +
      video1["department"]["name"].replace(regEx, replaceMask);
  } else {
    if (video1["subject"]["name"].toLowerCase() == "english") {
      var lesson_string = "Video";
    } else {
      var lesson_string = "Lesson";
    }
    video["sub_title"] =
      video1["subject"]["name"] +
      " " +
      video1["department"]["name"].replace(regEx, replaceMask) +
      " | " +
      lesson_string +
      " " +
      video1["sort_order"];
  }

  var departmentname = video["department"];
  var subject = video["subject"];
  var query = {};
  var queryDocuments = {};
  if (departmentname !== "") {
    query["department"] = departmentname;
  }
  if (subject !== "") {
    query["subject"] = subject;
  }
  if (
    (video.hasOwnProperty("activity") &&
      video["activity"].length == 1 &&
      video["activity"][0] != "") ||
    video["activity"].length > 1
  ) {
    queryActivities = {};
    queryActivities["_id"] = {};
    queryActivities["_id"]["$in"] = video["activity"];
    activities = await Activity.find(queryActivities);
    if (activities.length > 0) {
      for (var d = 0; d < activities.length; d++) {
        activities[d]["thumbnail"] =
          config.repositoryHost + activities[d]["thumbnail"];
      }
      videoDocuments["activities"] = activities;
    } else {
      video["activity"] = "";
    }
  } else {
    video["activity"] = "";
  }

  if (
    (video.hasOwnProperty("scert_solution") &&
      video["scert_solution"].length == 1 &&
      video["scert_solution"][0] != "") ||
    video["scert_solution"].length > 1
  ) {
    queryScert = {};
    queryScert["_id"] = {};
    queryScert["_id"]["$in"] = video["scert_solution"];
    scert_solutions = await Scertsolution.find(queryScert);

    if (scert_solutions.length > 0) {
      videoDocuments["scert_solution"] = {};
      videoDocuments["scert_solution"]["name"] = scert_solutions[0]["name"];
      videoDocuments["scert_solution"]["doc_url"] =
        config.repositoryHost + scert_solutions[0]["doc_url"];
    } else {
      video["scert_solution"] = "";
    }
  } else {
    video["scert_solution"] = "";
  }
  document_ids = [];
  queryDocuments["_id"] = {};
  if (video["worksheet"] != "") {
    document_ids.push(video["worksheet"]);
  }
  if (video.hasOwnProperty("lesson_plan") && video["lesson_plan"] != "") {
    document_ids.push(video["lesson_plan"]);
  } else {
    video["lesson_plan"] = "";
  }

  if (video.hasOwnProperty("assessment") && video["assessment"] != "") {
    document_ids.push(video["assessment"]);
  } else {
    video["assessment"] = "";
  }

  if (video.hasOwnProperty("sampark_video") && video["sampark_video"] != "") {
    samparkvideo = await Video.findById(video["sampark_video"]).select("-hash");
    if (
      samparkvideo["thumbnail"] != "" &&
      samparkvideo["thumbnail"] != "null"
    ) {
      samparkvideo["thumbnail"] =
        config.repositoryHost + samparkvideo["thumbnail"];
    } else {
      samparkvideo["thumbnail"] =
        "https://img.youtube.com/vi/" +
        samparkvideo["video_code"] +
        "/hqdefault.jpg";
    }
    videoDocuments["sampark_video"] = samparkvideo;
  } else {
    video["sampark_video"] = "";
  }

  if (document_ids.length > 0) {
    queryDocuments["_id"]["$in"] = document_ids;
    documents = await Document.find(queryDocuments);
    for (var d = 0; d < documents.length; d++) {
      videoDocuments[documents[d]["doc_type"]] = {};
      videoDocuments[documents[d]["doc_type"]]["name"] = documents[d]["name"];
      videoDocuments[documents[d]["doc_type"]]["doc_url"] =
        config.repositoryHost + documents[d]["doc_url"];
    }
    if (!videoDocuments.hasOwnProperty("lesson_plan")) {
      video["lesson_plan"] = "";
    }
    if (!videoDocuments.hasOwnProperty("assessment")) {
      video["assessment"] = "";
    }
    if (!videoDocuments.hasOwnProperty("worksheet")) {
      video["worksheet"] = "";
    }
    if (!videoDocuments.hasOwnProperty("scert_solution")) {
      video["scert_solution"] = "";
    }
    if (!videoDocuments.hasOwnProperty("sampark_video")) {
      video["sampark_video"] = "";
    }
    if (!videoDocuments.hasOwnProperty("activities")) {
      video["activity"] = "";
    }
  }
  query["_id"] = {};
  query["_id"]["$nin"] = [id];

  if (user !== "") {
    userlikes = await Sssvideolike.find({ user: user, video: id }).select(
      "video is_liked"
    );
    for (var i = 0; i < userlikes.length; i++) {
      video["is_liked"] = userlikes[i]["is_liked"];
    }
  }

  video["url"] = config.repositoryHost + video["url"];
  if (video["thumbnail"] != "" && video["thumbnail"] != "null") {
    video["thumbnail"] = config.repositoryHost + video["thumbnail"];
  } else {
    video["thumbnail"] =
      "https://img.youtube.com/vi/" + video["video_code"] + "/hqdefault.jpg";
  }
  query["sort_order"] = {};
  query["sort_order"]["$gte"] = video["sort_order"];
  videoWatchNext = await Video.find(query)
    .select("id name thumbnail video_code")
    .sort({ sort_order: 1 });

  for (var wi = 0; wi < videoWatchNext.length; wi++) {
    //videoWatchNext[wi].hasOwnProperty("thumbnail") &&
    if (
      videoWatchNext[wi]["thumbnail"] != "" &&
      videoWatchNext[wi]["thumbnail"] != "null"
    ) {
      videoWatchNext[wi]["thumbnail"] =
        config.repositoryHost + videoWatchNext[wi]["thumbnail"];
    } else {
      videoWatchNext[wi]["thumbnail"] =
        "https://img.youtube.com/vi/" +
        videoWatchNext[wi]["video_code"] +
        "/hqdefault.jpg";
    }
  }
  var videoData = {};
  videoData["video"] = video;
  videoData["documents"] = videoDocuments;
  videoData["watch_next"] = videoWatchNext;

  return videoData;
}

/**
 * To get video by QR code
 * @params qrcode & user
 * @returns video
 * */
async function getByQRCode(qrcode, user) {
  const defer = Q.defer();

  try {
    const video = await findVideoByQRCode(qrcode, "video");
    if (!video) {
      const audioTextbook = await findVideoByQRCode(qrcode, "audio_textbook");
      if (!audioTextbook) {
        defer.resolve(""); // No matching video or audio_textbook found
        return defer.promise;
      }
      const audioTextbookData = await processVideoData(
        audioTextbook,
        user,
        "sssvideo"
      );
      defer.resolve(audioTextbookData);
    } else {
      const videoData = await processVideoData(video, user, "sssvideo");
      defer.resolve(videoData);
    }
  } catch (err) {
    defer.reject(err);
  }

  return defer.promise;
}

async function findVideoByQRCode(qrcode, source) {
  return source === "video"
    ? await Video.findOne({ qrcode: qrcode })
        .populate("subject", "name")
        .populate("department", "name")
        .select("-hash")
    : await Audiotextbook.findOne({ qrcode: qrcode })
        .populate("subject", "name")
        .populate("department", "name")
        .select("-hash");
}

async function processVideoData(video1, user, source) {
  const video = video1.toObject();
  const id = video["_id"];

  if (user) {
    update_user_points(user, 10, null, null);
    const qrscan = new Qrscan({
      [source === "video" ? "video" : "audio_textbook"]: id,
      user: user,
    });
    qrscan.save();
  }

  video["id"] = id;
  video["is_liked"] = "";
  video["duration"] = await getVideoDuration(
    video["duration_min"],
    video["duration_sec"]
  );
  video["stream_type"] = "sssvideo";
  video["stream_id"] = id;

  const videolikecount = await Sssvideolike.find({
    video: id,
  }).countDocuments();
  video["likecount"] = videolikecount;
  video["viewcount"] = 0;

  const videocommentcount = await Sssvideocomment.find({
    video: id,
  }).countDocuments();
  video["commentcount"] = videocommentcount;
  const moduleName = video1["module"];
  const subjectName = video1["subject"]["name"];
  const departmentName = video1["department"]["name"];
  const sortOrder = video1["sort_order"];
  video["sub_title"] = await getVideoSubtitle(
    moduleName,
    subjectName,
    departmentName,
    sortOrder
  );
  video["url"] = await getVideoUrl(video["module"], video["url"]);
  video["thumbnail"] = await getVideoThumbnail(
    video["thumbnail"],
    video["video_code"]
  );

  if (user !== "") {
    const userlikes = await Sssvideolike.find({ user: user, video: id }).select(
      "video is_liked"
    );
    for (const userlike of userlikes) {
      video["is_liked"] = userlike["is_liked"];
    }
  }

  const videoData = {};
  videoData["video"] = video;
  return videoData;
}

async function create(req) {
  // validate
  let videoParam = req.body;
  let current_user = get_current_user(req);
  if (await Video.findOne({ video_code: videoParam.video_code })) {
    //throw 'Video Youtube Code "' + videoParam.video_code + '" is already taken';
  }

  videoParam.createdBy = current_user;
  videoParam.updatedBy = current_user;
  sampark_didi_ids = Object.keys(config.sampark_didi_ids);
  videoParam.author = sampark_didi_ids[0];
  videoParam.states = videoParam.states.split(",");
  videoParam.user_groups = videoParam.user_groups.split(",");
  videoParam.activity = videoParam.activity.split(",");
  if (videoParam.scert_solution) {
    videoParam.scert_solution = videoParam.scert_solution.split(",");
  }
  const video = new Video(videoParam);

  // save video
  if (await video.save()) {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    let thumbnail = req.files.thumbnail;
    let filename = video.id + path.extname(thumbnail.name);
    let uploadData = await uploadToS3(thumbnail, "videothumbnails", filename);
    video.thumbnail = uploadData.Key;
    await video.save();
    //resize_image(filepath,filepath,video)

    if (video.category != "") {
      var videoCParam = {};
      videoCParam["video"] = video.id;
      videoCParam["category"] = videoParam.category;
      const videocategory = new Videocategory(videoCParam);
      await videocategory.save();
    }
  }

  if (video.publish_on_social_stream) {
    streamData = {};
    streamData.item_type = "sssvideo";
    streamData.item_id = streamDetail.id;
    streamData.priority = 0;
    streamData.states = videoParam.states;
    streamData.is_sampark_didi_post = true;
    streamData.location = "India";
    const stream = new Stream(streamData);
    await stream.save();
  }
  return { success: true };
}

async function edit(id) {
  video = await Video.find({ _id: id }).select("-hash");

  if (video.length != 1) {
    return "";
  }
  video = video[0];

  var videodetail = {};
  videodetail["category"] = "";
  videoCategories = await Videocategory.find({ video: video.id }).select(
    "category"
  );
  for (var i = 0; i < videoCategories.length; i++) {
    //videoids.push(videoCategories[i]["category"]);
    videodetail["category"] = videoCategories[i]["category"];
  }

  videodetail["is_shareable"] = video.is_shareable;
  var duration = "";
  if (video.duration_min != "" && video.duration_min != null) {
    duration = video.duration_min + " Mins ";
  }
  if (video.duration_sec != "" && video.duration_sec != null) {
    duration = duration + video.duration_sec + " Secs";
  }
  videodetail["duration"] = duration;
  videodetail["name"] = video.name;
  videodetail["duration_min"] = video.duration_min;
  videodetail["duration_sec"] = video.duration_sec;
  videodetail["video_code"] = video.video_code;
  videodetail["url"] = video.url;
  videodetail["author"] = video.author;
  videodetail["competency_level"] = video.competency_level;
  videodetail["sort_order"] = video.sort_order;
  videodetail["thumbnail"] = config.repositoryHost + video.thumbnail;
  videodetail["description"] = video.description;
  videodetail["social_content"] = video.social_content;
  videodetail["concept"] = video.concept;
  videodetail["department"] = video.department;
  videodetail["subject"] = video.subject;
  videodetail["worksheet"] = video.worksheet;
  videodetail["assessment"] = video.assessment;
  videodetail["lesson_plan"] = video.lesson_plan;
  videodetail["activity"] = video.activity;
  videodetail["scert_solution"] = video.scert_solution;
  videodetail["sampark_video"] = video.sampark_video;
  videodetail["states"] = video.states;
  videodetail["user_groups"] = video.user_groups;
  videodetail["createdDate"] = video.createdDate;
  videodetail["publish_on_social_stream"] = video.publish_on_social_stream;
  videodetail["id"] = video.id;
  videodetail["module"] = video.module;
  videodetail["qrcode"] = video.qrcode;
  return videodetail;
}

async function update(id, req) {
  videoParam = req.body;
  const video = await Video.findById(id);
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  // validate
  if (!video) throw "Video not found";
  if (
    video.video_code !== videoParam.video_code &&
    (await Video.findOne({ video_code: videoParam.video_code }))
  ) {
    //throw 'Video "' + videoParam.video_code + '" is already taken';
  }

  videoParam.updatedDate = updatedAt;
  videoParam.updatedBy = current_user;
  sampark_didi_ids = Object.keys(config.sampark_didi_ids);
  videoParam.author = sampark_didi_ids[0];
  videoParam.states = videoParam.states.split(",");
  videoParam.user_groups = videoParam.user_groups.split(",");
  videoParam.activity = videoParam.activity.split(",");
  if (videoParam.scert_solution) {
    videoParam.scert_solution = videoParam.scert_solution.split(",");
  }
  // copy videoParam properties to video
  Object.assign(video, videoParam);

  if (await video.save()) {
    if (req.files && Object.keys(req.files).length === 1) {
      let thumbnail = req.files.thumbnail;
      let filename =
        thumbnail.name + "_" + video.id + path.extname(thumbnail.name);
      let uploadData = await uploadToS3(thumbnail, "videothumbnails", filename);
      video.thumbnail = uploadData.Key;
      await video.save();
      //resize_image(filepath,filepath,video)
    }

    await Videocategory.deleteMany({ video: video.id });
    if (video.category != "") {
      var videoCParam = {};
      videoCParam["video"] = video.id;
      videoCParam["category"] = videoParam.category;
      const videocategory = new Videocategory(videoCParam);
      await videocategory.save();
    }
  }

  if (video.publish_on_social_stream) {
    if (!(await Stream.findOne({ item_type: "sssvideo", item_id: video.id }))) {
      streamData = {};
      streamData.item_type = "sssvideo";
      streamData.item_id = video.id;
      streamData.priority = 0;
      streamData.states = videoParam.states;
      streamData.location = "India";
      streamData.is_sampark_didi_post = true;
      const stream = new Stream(streamData);
      await stream.save();
    } else {
      var updatedAt = new Date();
      var updatedBy = current_user;
      await Stream.updateMany(
        { item_type: "sssvideo", item_id: video.id },
        {
          $set: {
            is_active: true,
            updatedBy: updatedBy,
            updatedDate: updatedAt,
            publishDate: updatedAt,
            states: videoParam.states,
            location: "India",
            is_sampark_didi_post: true,
          },
        }
      );
    }
  } else {
    var updatedAt = new Date();
    var updatedBy = current_user;
    await Stream.updateMany(
      { item_type: "sssvideo", item_id: video.id },
      {
        $set: {
          is_active: false,
          updatedBy: updatedBy,
          updatedDate: updatedAt,
          states: videoParam.states,
          location: "India",
          is_sampark_didi_post: true,
        },
      }
    );
  }
  return { success: true };
}

async function _delete(id) {
  await Video.findByIdAndRemove(id);
  await Stream.deleteMany({ item_type: "sssvideo", item_id: id });
  return { success: true };
}
