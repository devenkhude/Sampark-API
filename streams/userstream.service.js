const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const update_user_points = commonmethods.update_user_points;
const resize_image = commonmethods.resize_image;
const get_current_user = commonmethods.get_current_user;
const update_social_hours = commonmethods.update_social_hours;
const create_notification = commonmethods.create_notification;
const User = db.User;
const Stream = db.Stream;
const Video = db.Video;
const Audio = db.Audio;
const Streamlike = db.Streamlike;
const Sssvideolike = db.Sssvideolike;
const Imagelike = db.Imagelike;
const Videolike = db.Videolike;
const Textlike = db.Textlike;
const Videostream = db.Videostream;
const Imagestream = db.Imagestream;
const Textstream = db.Textstream;
const Uservideo = db.Uservideo;
const { promisify } = require("util");
const url = require("url");
const http = require("http");
const https = require("https");
const path = require("path");
const isBase64 = require("is-base64");

module.exports = {
  getAllStreams, //for app
};

async function getLocation(stream, streamDetail, curUser) {
  const author =
    streamDetail.author !== undefined && streamDetail.author !== null
      ? streamDetail.author.id
      : "";
  const location = stream.location;
  const india_ids = Object.keys(config.india_user_ids);
  if (
    author !== "" &&
    author !== undefined &&
    author.id !== undefined &&
    india_ids.indexOf(author.id.toString()) !== -1
  ) {
    return "India";
  } else {
    return location
      .toLowerCase()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ");
  }
}

async function getAllStreams(
  device_id,
  userid,
  pull,
  timestamp,
  social_hours,
  updatetime,
  stream_for
) {
  var query = {};
  var query_updated = {};
  var query_inactive = {};
  if (timestamp === "") var per_page = config.streams_first_page;
  else var per_page = config.streams_per_page;

  query["is_active"] = true;
  query_updated["is_active"] = true;
  query_inactive["is_active"] = false;

  query["available_for_aapki_baithak"] = false;
  //query_inactive["available_for_aapki_baithak"] = true;
  query_updated["available_for_aapki_baithak"] = false;

  if (updatetime !== "") {
    query_updated["updatedDate"] = {};
    query_updated["updatedDate"]["$gt"] = updatetime;
  }
  if (pull !== "" && pull !== "all") {
    query["publishDate"] = {};
    if (pull == "down") {
      //per_page = 0; uncomment it after testing
      query["publishDate"]["$gt"] = timestamp;
    } else if (pull == "up") {
      query["publishDate"]["$lt"] = timestamp;
    }
  }
  //query["publishDate"] = {};
  //query["publishDate"]["$lte"] = new Date();
  //query_updated["publishDate"] = {};
  //query_updated["publishDate"]["$lte"] = new Date();

  var curUser = "";
  if (userid !== "") {
    curUser = await User.find({ _id: userid }).populate("state", ["name"]);
    if (curUser.length == 1) {
      curUser = curUser[0];

      if (social_hours != "") {
        update_social_hours(curUser, social_hours);
      }
      curUserGroup = curUser.usertype;
      curUserState = curUser.state;
      //        query["states"] = "others";
      //        query_updated["states"] = "others";
      for (i = 0; i < config.states.length; i++) {
        if (
          config.states[i].id == curUserState &&
          config.states[i].is_active == "true"
        ) {
          //query["states"] = curUserState; open it later
          //query_updated["states"] = curUserState; open it later
        }
      }
      if (curUser.usertype != "admin") {
        //query["user_groups"] = curUserGroup; open it later
        //query_updated["user_groups"] = curUserGroup; open it later
      }
    }
  }

  query["$or"] = [];
  if (stream_for == "mystate") {
    query["$or"].push({ states: curUserState.id });
    query["$or"].push({ states: curUserState.name });
  } else if (stream_for == "mydistrict") {
    curUserDistrict = curUser.district;
    if (curUserDistrict) {
      query["district"] = curUserDistrict;
    } else {
      query["states"] = "nostate";
    }
  } else if (stream_for == "samparkdidi") {
    var querytextimage = {};
    var queryvideo = {};
    var querysssvideo = {};
    sampark_didi_ids = Object.keys(config.sampark_didi_ids);

    querytextimage["author"] = {};
    querytextimage["author"]["$in"] = sampark_didi_ids;

    searches = await Textstream.find(querytextimage).select("id");
    textstreams = {};
    textstreamids = [];
    var querytextstreams = {};
    querytextstreams["item_type"] = "text";
    for (i = 0; i < searches.length; i++) {
      textstreams[searches[i].id] = searches[i];
      textstreamids.push(searches[i].id);
    }
    querytextstreams["item_id"] = {};
    querytextstreams["item_id"]["$in"] = textstreamids;
    query["$or"].push(querytextstreams);

    searches = await Imagestream.find(querytextimage).select("id");
    imagestreams = {};
    imagestreamids = [];
    var queryimagestreams = {};
    queryimagestreams["item_type"] = "image";
    for (i = 0; i < searches.length; i++) {
      imagestreams[searches[i].id] = searches[i];
      imagestreamids.push(searches[i].id);
    }
    queryimagestreams["item_id"] = {};
    queryimagestreams["item_id"]["$in"] = imagestreamids;
    query["$or"].push(queryimagestreams);

    queryvideo["author"] = {};
    queryvideo["author"]["$in"] = sampark_didi_ids;
    queryvideo["available_for_aapki_baithak"] = false;
    searches = await Videostream.find(queryvideo).select("id");
    videostreams = {};
    videostreamids = [];
    var queryvideostreams = {};
    queryvideostreams["item_type"] = "video";
    for (i = 0; i < searches.length; i++) {
      videostreams[searches[i].id] = searches[i];
      videostreamids.push(searches[i].id);
    }
    queryvideostreams["item_id"] = {};
    queryvideostreams["item_id"]["$in"] = videostreamids;
    query["$or"].push(queryvideostreams);

    querysssvideo["author"] = {};
    querysssvideo["author"]["$in"] = sampark_didi_ids;
    querysssvideo["publish_on_social_stream"] = true;
    searches = await Video.find(querysssvideo).select("id");
    sssvideostreams = {};
    sssvideostreamids = [];
    var querysssvideostreams = {};
    querysssvideostreams["item_type"] = "sssvideo";
    for (i = 0; i < searches.length; i++) {
      sssvideostreams[searches[i].id] = searches[i];
      sssvideostreamids.push(searches[i].id);
    }
    querysssvideostreams["item_id"] = {};
    querysssvideostreams["item_id"]["$in"] = sssvideostreamids;
    query["$or"].push(querysssvideostreams);
  }

  if (query["$or"].length == 0) {
    delete query["$or"];
  }

  if (updatetime !== "") {
    inactive_streams = await Stream.find(query_inactive);
  }
  if (pull == "all") {
    streams = await Stream.find(query).sort({ publishDate: -1 });
  } else {
    if (per_page > 0) {
      streams = await Stream.find(query)
        .sort({ publishDate: -1 })
        .limit(per_page);
    } else {
      streams = await Stream.find(query).sort({ publishDate: -1 });
    }
  }
  var sssvideolikes = {};
  var videolikes = {};
  var imagelikes = {};
  var textlikes = {};
  if (userid !== "") {
    usersssvideolikes = await Sssvideolike.find({ user: userid }).select(
      "video is_liked"
    );
    for (var i = 0; i < usersssvideolikes.length; i++) {
      sssvideolikes[usersssvideolikes[i]["video"]] =
        usersssvideolikes[i]["is_liked"];
    }
    uservideolikes = await Videolike.find({ user: userid }).select(
      "video is_liked"
    );
    for (var i = 0; i < uservideolikes.length; i++) {
      videolikes[uservideolikes[i]["video"]] = uservideolikes[i]["is_liked"];
    }
    userimagelikes = await Imagelike.find({ user: userid }).select(
      "image is_liked"
    );
    for (var i = 0; i < userimagelikes.length; i++) {
      imagelikes[userimagelikes[i]["image"]] = userimagelikes[i]["is_liked"];
    }
    usertextlikes = await Textlike.find({ user: userid }).select(
      "text is_liked"
    );
    for (var i = 0; i < usertextlikes.length; i++) {
      textlikes[usertextlikes[i]["text"]] = usertextlikes[i]["is_liked"];
    }
  } else {
    usersssvideolikes = await Sssvideolike.find({
      device_id: device_id,
    }).select("video is_liked");
    for (var i = 0; i < usersssvideolikes.length; i++) {
      sssvideolikes[usersssvideolikes[i]["video"]] =
        usersssvideolikes[i]["is_liked"];
    }
    uservideolikes = await Videolike.find({ device_id: device_id }).select(
      "video is_liked"
    );
    for (var i = 0; i < uservideolikes.length; i++) {
      videolikes[uservideolikes[i]["video"]] = uservideolikes[i]["is_liked"];
    }
    userimagelikes = await Imagelike.find({ device_id: device_id }).select(
      "image is_liked"
    );
    for (var i = 0; i < userimagelikes.length; i++) {
      imagelikes[userimagelikes[i]["image"]] = userimagelikes[i]["is_liked"];
    }
    usertextlikes = await Textlike.find({ device_id: device_id }).select(
      "text is_liked"
    );
    for (var i = 0; i < usertextlikes.length; i++) {
      textlikes[usertextlikes[i]["text"]] = usertextlikes[i]["is_liked"];
    }
  }
  streamList = [];
  inactiveStreamList = [];
  updatedStreamList = [];
  newStreamList = [];
  viewStreamList = [];
  var sizeOf = promisify(require("image-size"));

  if (updatetime !== "") {
    for (var i = 0; i < inactive_streams.length; i++) {
      inactiveStreamList.push(inactive_streams[i]["id"]);
    }
  }

  //for(var i = 0; i < streams.length;i++){
  for (const curstream of streams) {
    if (curstream["item_type"] == "image" || curstream["item_type"] == "text") {
      viewStreamList.push(curstream["id"]);
    }
    newStreamList.push(curstream["id"]);
    if (curstream["item_type"] == "sssvideo") {
      streamDetail = await Video.findById(curstream["item_id"])
        .populate("subject", "name")
        .populate("department", "name");
      if (streamDetail) {
        stream = {};
        stream["stream_type"] = curstream["item_type"];
        stream["priority"] = curstream["priority"];
        stream["states"] = curstream["states"];
        stream["more_status"] = false;
        stream["sub_title"] = "";
        stream["width"] = 0;
        stream["height"] = 0;

        stream["author"] = "Sampark Didi";
        stream["more_status"] = true;

        var searchMask = "class";
        var regEx = new RegExp(searchMask, "ig");
        var replaceMask = "";

        if (streamDetail["module"] == "ssh") {
          stream["sub_title"] =
            streamDetail["subject"]["name"] +
            " " +
            streamDetail["department"]["name"].replace(regEx, replaceMask);
        } else {
          if (streamDetail["subject"]["name"].toLowerCase() == "english") {
            var lesson_string = "Video";
          } else {
            var lesson_string = "Lesson";
          }
          stream["sub_title"] =
            streamDetail["subject"]["name"] +
            " " +
            streamDetail["department"]["name"].replace(regEx, replaceMask) +
            " | " +
            lesson_string +
            " " +
            streamDetail["sort_order"];
        }
        stream["module"] = streamDetail["module"];
        if (sssvideolikes.hasOwnProperty(curstream["item_id"])) {
          stream["is_liked"] = sssvideolikes[curstream["item_id"]]
            ? sssvideolikes[curstream["item_id"]]
            : "";
        } else {
          stream["is_liked"] = "";
        }

        if (streamDetail.author != "" && streamDetail.author != null) {
          if (streamDetail.author && streamDetail.author.firstName) {
            stream["author"] = streamDetail.author.lastName
              ? titleize(
                  streamDetail.author.firstName +
                    " " +
                    streamDetail.author.lastName
                )
              : titleize(streamDetail.author.firstName);
          } else {
            stream["author"] = "Sampark Didi";
          }

          stream["location"] = await getLocation(
            curstream,
            streamDetail,
            curUser
          );
          stream["badge"] =
            !streamDetail.author.badge ||
            streamDetail.author.badge == "" ||
            streamDetail.author.badge == "null"
              ? 0
              : streamDetail.author.badge;
          if (stream["author"] == "Sampark Didi") {
            stream["image"] = config.didi_image;
          } else {
            stream["image"] =
              !streamDetail.author.image ||
              streamDetail.author.image == "" ||
              streamDetail.author.image == "null"
                ? config.user_image
                : config.repositoryHost + streamDetail.author.image;
          }
        } else {
          stream["author"] = "Sampark Didi";
          stream["location"] = await getLocation(
            curstream,
            streamDetail,
            curUser
          );
          stream["badge"] = 0;
          stream["image"] = config.didi_image;
        }
        stream["stream_id"] = streamDetail.id;
        stream["id"] = curstream["id"];
        stream["is_shareable"] = streamDetail.is_shareable;
        stream["name"] = streamDetail.name;
        stream["description"] =
          streamDetail.social_content != ""
            ? streamDetail.social_content
            : streamDetail.description;
        stream["sort_order"] = streamDetail.sort_order;

        stream["likecount"] = streamDetail["likecount"];
        stream["viewcount"] = curstream["viewcount"];
        stream["created_at"] = curstream["publishDate"];
        stream["publish_at"] = curstream["publishDate"];
        stream["commentcount"] = streamDetail["commentcount"];

        stream["author"] = "Sampark Didi";
        stream["image"] = config.didi_image;
        stream["more_status"] = true;
        stream["video_code"] = streamDetail.video_code;
        if (streamDetail.width > 0 && streamDetail.height > 0) {
          stream["width"] = streamDetail.width;
          stream["height"] = streamDetail.height;
        } else {
          stream["width"] = 0;
          stream["height"] = 0;
          if (
            streamDetail.thumbnail != "" &&
            streamDetail.thumbnail != "null"
          ) {
            await sizeOf(config.uploadPath + streamDetail.thumbnail)
              .then((dimensions) => {
                stream["width"] = dimensions.width;
                stream["height"] = dimensions.height;
              })
              .catch((err) => console.error(err));
            stream["thumbnail"] =
              config.repositoryHost + streamDetail.thumbnail;
          } else {
            stream["thumbnail"] =
              "https://img.youtube.com/vi/" +
              streamDetail.video_code +
              "/hqdefault.jpg";
          }
        }
        streamList.push(stream);
      }
    } else {
      if (curstream["item_type"] == "video") {
        streamDetail = await Videostream.findById(
          curstream["item_id"]
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
      } else if (curstream["item_type"] == "image") {
        streamDetail = await Imagestream.findById(
          curstream["item_id"]
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
      } else if (curstream["item_type"] == "text") {
        streamDetail = await Textstream.findById(curstream["item_id"]).populate(
          "author",
          [
            "firstName",
            "lastName",
            "is_verified",
            "image",
            "location",
            "badge",
            "usertype",
          ]
        );
      } else if (curstream["item_type"] == "sssvideo") {
        streamDetail = await Video.findById(curstream["item_id"])
          .populate("subject", "name")
          .populate("department", "name");
      } else if (curstream["item_type"] == "sssaudio") {
        streamDetail = await Audio.findById(curstream["item_id"])
          .populate("subject", "name")
          .populate("department", "name");
      }
      if (streamDetail) {
        stream = {};
        if (curstream["item_type"] == "video") {
          if (videolikes.hasOwnProperty(curstream["item_id"])) {
            stream["is_liked"] = videolikes[curstream["item_id"]]
              ? videolikes[curstream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
          stream["module"] = "baithak";
        } else if (curstream["item_type"] == "image") {
          if (imagelikes.hasOwnProperty(curstream["item_id"])) {
            stream["is_liked"] = imagelikes[curstream["item_id"]]
              ? imagelikes[curstream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
          stream["module"] = "baithak";
        } else if (curstream["item_type"] == "text") {
          if (textlikes.hasOwnProperty(curstream["item_id"])) {
            stream["is_liked"] = textlikes[curstream["item_id"]]
              ? textlikes[curstream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
          stream["module"] = "baithak";
        } else if (curstream["item_type"] == "sssvideo") {
          stream["author"] = "Sampark Didi";
          stream["more_status"] = true;

          var searchMask = "class";
          var regEx = new RegExp(searchMask, "ig");
          var replaceMask = "";

          if (streamDetail["module"] == "ssh") {
            stream["sub_title"] =
              streamDetail["subject"]["name"] +
              " " +
              streamDetail["department"]["name"].replace(regEx, replaceMask);
          } else {
            if (streamDetail["subject"]["name"].toLowerCase() == "english") {
              var lesson_string = "Video";
            } else {
              var lesson_string = "Lesson";
            }
            stream["sub_title"] =
              streamDetail["subject"]["name"] +
              " " +
              streamDetail["department"]["name"].replace(regEx, replaceMask) +
              " | " +
              lesson_string +
              " " +
              streamDetail["sort_order"];
          }
          stream["module"] = streamDetail["module"];
          if (sssvideolikes.hasOwnProperty(curstream["item_id"])) {
            stream["is_liked"] = sssvideolikes[curstream["item_id"]]
              ? sssvideolikes[curstream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
        }
        stream["stream_type"] = curstream["item_type"];
        stream["priority"] = curstream["priority"];
        stream["states"] = curstream["states"];
        stream["more_status"] = false;
        stream["sub_title"] = "";
        stream["width"] = 0;
        stream["height"] = 0;

        if (streamDetail.author != "" && streamDetail.author != null) {
          if (streamDetail.author && streamDetail.author.firstName) {
            stream["author"] = streamDetail.author.lastName
              ? titleize(
                  streamDetail.author.firstName +
                    " " +
                    streamDetail.author.lastName
                )
              : titleize(streamDetail.author.firstName);
          } else {
            stream["author"] = "Sampark Didi";
          }

          stream["location"] = await getLocation(
            curstream,
            streamDetail,
            curUser
          );
          stream["badge"] =
            !streamDetail.author.badge ||
            streamDetail.author.badge == "" ||
            streamDetail.author.badge == "null"
              ? 0
              : streamDetail.author.badge;
          if (stream["author"] == "Sampark Didi") {
            stream["image"] = config.didi_image;
          } else {
            stream["image"] =
              !streamDetail.author.image ||
              streamDetail.author.image == "" ||
              streamDetail.author.image == "null"
                ? config.user_image
                : config.repositoryHost + streamDetail.author.image;
          }
        } else {
          stream["author"] = "Sampark Didi";
          stream["location"] = await getLocation(
            curstream,
            streamDetail,
            curUser
          );
          stream["badge"] = 0;
          stream["image"] = config.didi_image;
        }
        stream["stream_id"] = streamDetail.id;
        stream["id"] = curstream["id"];
        stream["is_shareable"] = streamDetail.is_shareable;
        stream["name"] = streamDetail.name;
        stream["description"] = streamDetail.description;
        stream["sort_order"] = streamDetail.sort_order;
        stream["likecount"] = streamDetail["likecount"];
        stream["viewcount"] = curstream["viewcount"];
        stream["created_at"] = curstream["publishDate"];
        stream["publish_at"] = curstream["publishDate"];
        stream["commentcount"] = streamDetail["commentcount"];

        if (curstream["item_type"] == "sssvideo") {
          stream["author"] = "Sampark Didi";
          stream["image"] = config.didi_image;
          stream["more_status"] = true;
          stream["video_code"] = streamDetail.video_code;
          if (streamDetail.width > 0 && streamDetail.height > 0) {
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
            stream["thumbnail"] =
              config.repositoryHost + streamDetail.thumbnail;
          } else {
            stream["width"] = 0;
            stream["height"] = 0;
            if (
              streamDetail.thumbnail != "" &&
              streamDetail.thumbnail != "null"
            ) {
              await sizeOf(config.uploadPath + streamDetail.thumbnail)
                .then((dimensions) => {
                  stream["width"] = dimensions.width;
                  stream["height"] = dimensions.height;
                })
                .catch((err) => console.error(err));
              stream["thumbnail"] =
                config.repositoryHost + streamDetail.thumbnail;
            } else {
              stream["thumbnail"] =
                "https://img.youtube.com/vi/" +
                streamDetail.video_code +
                "/hqdefault.jpg";
            }
          }
        } else if (curstream["item_type"] == "image") {
          if (streamDetail.width > 0 && streamDetail.height > 0) {
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
          } else {
            stream["width"] = 0;
            stream["height"] = 0;
            await sizeOf(config.uploadPath + streamDetail.thumbnail)
              .then((dimensions) => {
                stream["width"] = dimensions.width;
                stream["height"] = dimensions.height;
              })
              .catch((err) => console.error(err));
          }
          stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
        } else if (curstream["item_type"] != "text") {
          stream["video_code"] = streamDetail.youtube_code;
          if (streamDetail.width > 0 && streamDetail.height > 0) {
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
            stream["thumbnail"] =
              config.repositoryHost + streamDetail.thumbnail;
          } else {
            stream["width"] = 0;
            stream["height"] = 0;
            if (
              streamDetail.thumbnail != "" &&
              streamDetail.thumbnail != null
            ) {
              await sizeOf(config.uploadPath + streamDetail.thumbnail)
                .then((dimensions) => {
                  stream["width"] = dimensions.width;
                  stream["height"] = dimensions.height;
                })
                .catch((err) => console.error(err));
              stream["thumbnail"] =
                config.repositoryHost + streamDetail.thumbnail;
            } else {
              stream["thumbnail"] =
                "https://img.youtube.com/vi/" +
                streamDetail.youtube_code +
                "/hqdefault.jpg";
            }
          }
        }
        streamList.push(stream);
      }
    }
  }

  await Stream.updateMany(
    { _id: { $in: viewStreamList } },
    { $inc: { viewcount: 1 } }
  );

  if (updatetime !== "") {
    query_updated["_id"] = {};
    query_updated["_id"]["$nin"] = newStreamList;

    updated_streams = await Stream.find(query_updated);

    for (const curustream of updated_streams) {
      if (curustream["item_type"] == "video") {
        streamDetail = await Videostream.findById(
          curustream["item_id"]
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
      } else if (curustream["item_type"] == "image") {
        streamDetail = await Imagestream.findById(
          curustream["item_id"]
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
      } else if (curustream["item_type"] == "text") {
        streamDetail = await Textstream.findById(
          curustream["item_id"]
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
      } else if (curustream["item_type"] == "sssvideo") {
        streamDetail = await Video.findById(curustream["item_id"])
          .populate("subject", "name")
          .populate("department", "name");
      }

      if (streamDetail) {
        stream = {};
        stream["stream_type"] = curustream["item_type"];
        stream["priority"] = curustream["priority"];
        stream["more_status"] = false;
        stream["sub_title"] = "";
        stream["width"] = 0;
        stream["height"] = 0;

        if (curustream["item_type"] == "video") {
          if (videolikes.hasOwnProperty(curustream["item_id"])) {
            stream["is_liked"] = videolikes[curustream["item_id"]]
              ? videolikes[curustream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
          stream["module"] = "baithak";
        } else if (curustream["item_type"] == "image") {
          if (imagelikes.hasOwnProperty(curustream["item_id"])) {
            stream["is_liked"] = imagelikes[curustream["item_id"]]
              ? imagelikes[curustream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
          stream["module"] = "baithak";
        } else if (curustream["item_type"] == "text") {
          if (textlikes.hasOwnProperty(curustream["item_id"])) {
            stream["is_liked"] = textlikes[curustream["item_id"]]
              ? textlikes[curustream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
          stream["module"] = "baithak";
        } else if (curustream["item_type"] == "sssvideo") {
          stream["author"] = "Sampark Didi";
          stream["more_status"] = true;

          var searchMask = "class";
          var regEx = new RegExp(searchMask, "ig");
          var replaceMask = "";

          if (streamDetail["module"] == "ssh") {
            stream["sub_title"] =
              streamDetail["subject"]["name"] +
              " " +
              streamDetail["department"]["name"].replace(regEx, replaceMask);
          } else {
            if (streamDetail["subject"]["name"].toLowerCase() == "english") {
              var lesson_string = "Video";
            } else {
              var lesson_string = "Lesson";
            }
            stream["sub_title"] =
              streamDetail["subject"]["name"] +
              " " +
              streamDetail["department"]["name"].replace(regEx, replaceMask) +
              " | " +
              lesson_string +
              " " +
              streamDetail["sort_order"];
          }
          stream["module"] = streamDetail["module"];
          if (sssvideolikes.hasOwnProperty(curustream["item_id"])) {
            stream["is_liked"] = sssvideolikes[curustream["item_id"]]
              ? sssvideolikes[curustream["item_id"]]
              : "";
          } else {
            stream["is_liked"] = "";
          }
        }

        if (streamDetail.author != "" && streamDetail.author != null) {
          if (streamDetail.author && streamDetail.author.firstName) {
            stream["author"] = streamDetail.author.lastName
              ? titleize(
                  streamDetail.author.firstName +
                    " " +
                    streamDetail.author.lastName
                )
              : titleize(streamDetail.author.firstName);
          } else {
            stream["author"] = "Sampark Didi";
          }

          stream["location"] = await getLocation(
            curustream,
            streamDetail,
            curUser
          );
          stream["badge"] =
            !streamDetail.author.badge ||
            streamDetail.author.badge == "" ||
            streamDetail.author.badge == "null"
              ? 0
              : streamDetail.author.badge;
          if (stream["author"] == "Sampark Didi") {
            stream["image"] = config.didi_image;
          } else {
            stream["image"] =
              !streamDetail.author.image ||
              streamDetail.author.image == "" ||
              streamDetail.author.image == "null"
                ? config.user_image
                : config.repositoryHost + streamDetail.author.image;
          }
        } else {
          stream["author"] = "Sampark Didi";
          stream["location"] = await getLocation(
            curustream,
            streamDetail,
            curUser
          );
          stream["badge"] = 0;
          stream["image"] = config.didi_image;
        }
        stream["stream_id"] = streamDetail.id;
        stream["id"] = curustream["id"];
        stream["is_shareable"] = streamDetail.is_shareable;
        stream["name"] = streamDetail.name;
        stream["description"] = streamDetail.description;
        stream["sort_order"] = streamDetail.sort_order;

        stream["likecount"] = streamDetail["likecount"];
        stream["viewcount"] = curustream["viewcount"];
        stream["publish_at"] = curustream["publishDate"];
        stream["created_at"] = curustream["publishDate"];
        stream["commentcount"] = streamDetail["commentcount"];

        if (curustream["item_type"] == "sssvideo") {
          stream["author"] = "Sampark Didi";
          stream["image"] = config.didi_image;
          stream["more_status"] = true;
          stream["video_code"] = streamDetail.video_code;
          if (streamDetail.width > 0 && streamDetail.height > 0) {
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
            stream["thumbnail"] =
              config.repositoryHost + streamDetail.thumbnail;
          } else {
            if (
              streamDetail.thumbnail != "" &&
              streamDetail.thumbnail != "null"
            ) {
              stream["width"] = 0;
              stream["height"] = 0;
              await sizeOf(config.uploadPath + streamDetail.thumbnail)
                .then((dimensions) => {
                  stream["width"] = dimensions.width;
                  stream["height"] = dimensions.height;
                })
                .catch((err) => console.error(err));
              stream["thumbnail"] =
                config.repositoryHost + streamDetail.thumbnail;
            } else {
              stream["thumbnail"] =
                "https://img.youtube.com/vi/" +
                streamDetail.video_code +
                "/hqdefault.jpg";
            }
          }
        } else if (curustream["item_type"] == "image") {
          if (streamDetail.width > 0 && streamDetail.height > 0) {
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
          } else {
            stream["width"] = 0;
            stream["height"] = 0;
            await sizeOf(config.uploadPath + streamDetail.thumbnail)
              .then((dimensions) => {
                stream["width"] = dimensions.width;
                stream["height"] = dimensions.height;
              })
              .catch((err) => console.error(err));
          }
          stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
        } else if (curustream["item_type"] != "text") {
          stream["video_code"] = streamDetail.youtube_code;
          if (streamDetail.width > 0 && streamDetail.height > 0) {
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
            stream["thumbnail"] =
              config.repositoryHost + streamDetail.thumbnail;
          } else {
            stream["width"] = 0;
            stream["height"] = 0;
            if (
              streamDetail.thumbnail != "" &&
              streamDetail.thumbnail != null
            ) {
              await sizeOf(config.uploadPath + streamDetail.thumbnail)
                .then((dimensions) => {
                  stream["width"] = dimensions.width;
                  stream["height"] = dimensions.height;
                })
                .catch((err) => console.error(err));
              stream["thumbnail"] =
                config.repositoryHost + streamDetail.thumbnail;
            } else {
              stream["thumbnail"] =
                "https://img.youtube.com/vi/" +
                streamDetail.youtube_code +
                "/hqdefault.jpg";
            }
          }
        }

        updatedStreamList.push(stream);
      }
    }
  }
  user_streams = {};
  user_streams["streams"] = streamList;
  user_streams["max_records"] = config.max_no_of_streams_on_mobile_storage;
  user_streams["inactivestreams"] = inactiveStreamList;
  user_streams["updatedstreams"] = updatedStreamList;
  return user_streams;

  //return await Stream.find(query).populate('subject','name').populate('department','name').select('-hash');
}
