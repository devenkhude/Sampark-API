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
const uploadToS3 = commonmethods.uploadToS3;
const User = db.User;
const Scertstream = db.Scertstream;
const Scertstreamlike = db.Scertstreamlike;
const Imagelike = db.Imagelike;
const Videolike = db.Videolike;
const Textlike = db.Textlike;
const Scertimagelike = db.Scertimagelike;
const Scertvideolike = db.Scertvideolike;
const Scertpdflike = db.Scertpdflike;
const Scerttextlike = db.Scerttextlike;
const Videoscertstream = db.Videoscertstream;
const Audioscertstream = db.Audioscertstream;
const Imagescertstream = db.Imagescertstream;
const Textscertstream = db.Textscertstream;
const Pdfscertstream = db.Pdfscertstream;
const { promisify } = require("util");
const probe = promisify(require("probe-image-size"));
const path = require("path");
const isBase64 = require("is-base64");

module.exports = {
  getVideos, //for lesson
  getAll, //for admin
  getById,
  getAllScertstreams, //for app
  search, //for app
  create,
  update,
  activation,
  edit,
  delete: _delete,
};

async function getVideos() {
  try {

  } catch (error) {
    console.log("Error in: ", error, "getVideos");
  }
  const scertstreams = await Scertstream.find({ item_type: "video" })
    .sort({ publishDate: -1 })
    .populate({
      path: "item_id",
      model: Videoscertstream,
      populate: {
        path: "author",
        select: [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
        ],
      },
    });

  const scertstreamList = scertstreams
    .filter(({ item_type }) => item_type === "video")
    .map((scertstream) => {
      const { item_type, item_id, publishDate, createdDate } = scertstream;
      const scertstreamDetail = scertstream.item_id;

      if (!scertstreamDetail) {
        return null;
      }

      const {
        author,
        name,
        description,
        sort_order,
        is_shareable,
        youtube_code,
        thumbnail,
        likecount,
        commentcount,
      } = scertstreamDetail;

      const stream_type = item_type;
      const more_status = false;
      const sub_title = "";
      const isbase = isBase64(description);
      const publish_at = publishDate;
      const created_at = createdDate;

      const scert = {
        stream_type,
        more_status,
        sub_title,
        author: author
          ? titleize(`${author.firstName} ${author.lastName}`)
          : "Sampark Didi",
        location: getLocation(scertstream, scertstreamDetail, curUser),
        badge: author ? author.badge || 0 : 0,
        image: author
          ? author.image
            ? config.repositoryHost + author.image
            : config.user_image
          : config.didi_image,
        stream_id: item_id,
        id: scertstream.id,
        is_active: scertstream.is_active,
        is_shareable,
        name: name || description,
        sort_order,
        is_liked: "",
        likecount,
        viewcount: 0,
        publish_at,
        created_at,
        commentcount,
        video_code: youtube_code,
        thumbnail:
          thumbnail ||
          `https://img.youtube.com/vi/${youtube_code}/hqdefault.jpg`,
      };

      return scert;
    })
    .filter((scertstream) => scertstream !== null);

  return scertstreamList;
}

async function getAll(userid, pull, timestamp) {
  const scertstreams = await Scertstream.find().sort({ publishDate: -1 });
  const scertstreamList = [];

  const itemTypeToModel = {
    audio: Audioscertstream,
    video: Videoscertstream,
    image: Imagescertstream,
    text: Textscertstream,
    pdf: Pdfscertstream,
  };

  for (const scertstream of scertstreams) {
    const { item_type, item_id, publishDate, createdDate } = scertstream;
    const Model = itemTypeToModel[item_type];

    if (Model) {
      const scertstreamDetail = await Model.findById(item_id).populate(
        "author",
        ["firstName", "lastName", "is_verified", "image", "location", "badge"]
      );

      if (scertstreamDetail) {
        const author = scertstreamDetail.author;
        const isBase64Description = isBase64(scertstreamDetail.description);

        const scertstream = {
          stream_type: item_type,
          more_status: false,
          sub_title: "",
          author: author
            ? titleize(`${author.firstName} ${author.lastName}`)
            : "Sampark Didi",
          location: getLocation(scertstream, scertstreamDetail, curUser),
          badge: author ? author.badge || 0 : 0,
          image: author
            ? author.image
              ? config.repositoryHost + author.image
              : config.user_image
            : config.didi_image,
          stream_id: scertstreamDetail.id,
          id: scertstream.id,
          is_active: scertstream.is_active,
          is_shareable: scertstreamDetail.is_shareable,
          name: scertstreamDetail.name,
          isbase: isBase64Description,
          description: isBase64Description
            ? decodeURIComponent(
                Buffer.from(scertstreamDetail.description, "base64").toString()
              )
            : scertstreamDetail.description,
          sort_order: scertstreamDetail.sort_order,
          is_liked: "",
          likecount: scertstreamDetail.likecount,
          viewcount: 0,
          publish_at: publishDate,
          created_at: createdDate,
          commentcount: scertstreamDetail.commentcount,
        };

        if (item_type === "image") {
          scertstream.thumbnail =
            config.repositoryHost + scertstreamDetail.thumbnail;
        } else if (item_type === "pdf") {
          scertstream.thumbnail = config.repositoryHost + scertstreamDetail.pdf;
        } else if (item_type === "video") {
          scertstream.video_code = scertstreamDetail.youtube_code;
          scertstream.thumbnail =
            scertstreamDetail.thumbnail ||
            `https://img.youtube.com/vi/${scertstreamDetail.youtube_code}/hqdefault.jpg`;
        }

        scertstreamList.push(scertstream);
      }
    }
  }

  return scertstreamList;
}

async function search(
  searchstring,
  device_id,
  userid,
  social_hours,
  updatetime
) {
  const query = {
    states: userid
      ? (await User.findById(userid).populate("state")).state.id
      : null,
    publishDate: { $lte: new Date() },
    is_active: true,
  };

  const querysearch = {
    $or: [
      { fullName: new RegExp(searchstring, "i") },
      { description: new RegExp(searchstring, "i") },
      { name: new RegExp(searchstring, "i") },
    ],
  };

  const userids = await User.distinct("_id", {
    fullName: new RegExp(searchstring, "i"),
  });
  if (userids.length > 0) {
    querysearch.$or.push({ author: { $in: userids } });
  }

  const itemTypeToModel = {
    pdf: Scertpdflike,
    image: Scertimagelike,
    text: Scerttextlike,
    video: Scertvideolike,
  };

  for (const [itemType, Model] of Object.entries(itemTypeToModel)) {
    const searches = await Model.find(querysearch).populate("author", [
      "firstName",
      "lastName",
      "is_verified",
      "image",
      "location",
      "badge",
      "usertype",
    ]);

    if (searches.length > 0) {
      const streamType = itemType === "pdf" ? "image" : itemType;
      const streamIds = searches.map((search) => search.id);

      query.$or.push({ item_type: streamType, item_id: { $in: streamIds } });
    }
  }

  querysearch.publish_on_social_scertstream = true;

  let curUser = "";
  let curUserState = "";
  if (userid) {
    curUser = await User.findById(userid).populate("state", ["name"]);
    if (curUser) {
      curUser = curUser[0];
      if (social_hours !== "") {
        update_social_hours(curUser, social_hours);
      }
      curUserState = curUser.state;
    }
  }

  query.states = curUserState.id;

  const user_scertstreams = {};

  if (query.$or.length === 0) {
    user_scertstreams.scertstreams = [];
    user_scertstreams.max_records = config.max_no_of_streams_on_mobile_storage;
    return user_scertstreams;
  }

  const scertstreams = await Scertstream.find(query);

  const videolikes = await getLikes(userid, Scertvideolike, "video");
  const imagelikes = await getLikes(userid, Scertimagelike, "image");
  const textlikes = await getLikes(userid, Scerttextlike, "text");
  const pdflikes = await getLikes(userid, Scertpdflike, "pdf");

  const scertstreamList = await Promise.all(
    scertstreams.map(async (curstream) => {
      const scertstream = await getStreamDetail(
        curstream,
        curUser,
        videolikes,
        imagelikes,
        textlikes,
        pdflikes
      );
      return scertstream;
    })
  );

  user_scertstreams.scertstreams = scertstreamList;
  user_scertstreams.max_records =
    config.max_no_of_scertstreams_on_mobile_storage;
  return user_scertstreams;
}

async function getLikes(userid, Model, itemType) {
  if (userid) {
    const likes = await Model.distinct(itemType, { user: userid });
    return likes.map((item) => item.toString());
  }
  return [];
}

async function getStreamDetail(
  curScertStream,
  curUser,
  videolikes,
  imagelikes,
  textlikes,
  pdflikes
) {
  try {
    let scertstreamDetail;

    switch (curScertStream.item_type) {
      case "video":
        scertstreamDetail = await Videoscertstream.findById(
          curScertStream.item_id
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
        break;
      case "image":
        scertstreamDetail = await Imagescertstream.findById(
          curScertStream.item_id
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
        break;
      case "text":
        scertstreamDetail = await Textscertstream.findById(
          curScertStream.item_id
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
          "usertype",
        ]);
        break;
      case "pdf":
        scertstreamDetail = await Pdfscertstream.findById(
          curScertStream.item_id
        ).populate("author", [
          "firstName",
          "lastName",
          "is_verified",
          "image",
          "location",
          "badge",
        ]);
        break;
      default:
        break;
    }

    if (scertstreamDetail) {
      const scertstream = {
        module: "scert",
        is_liked: getIsLiked(
          curScertStream.item_type,
          curScertStream.item_id,
          videolikes,
          imagelikes,
          textlikes,
          pdflikes
        ),
        stream_type: curScertStream.item_type,
        priority: curScertStream.priority,
        more_status: false,
        sub_title: "",
        width: 0,
        height: 0,
      };

      if (scertstreamDetail?.author && scertstreamDetail?.author?.firstName) {
        scertstream.author = scertstreamDetail.author.lastName
          ? titleize(
              scertstreamDetail.author.firstName +
                " " +
                scertstreamDetail.author.lastName
            )
          : titleize(scertstreamDetail.author.firstName);
      } else {
        scertstream.author = "Sampark Didi";
      }

      scertstream.location = getLocation(
        curScertStream,
        scertstreamDetail,
        curUser
      );
      scertstream.badge =
        !scertstreamDetail.author.badge ||
        scertstreamDetail.author.badge === "" ||
        scertstreamDetail.author.badge === "null"
          ? 0
          : scertstreamDetail.author.badge;

      if (scertstream.author === "Sampark Didi") {
        scertstream.image = config.didi_image;
      } else if (scertstream.author === "Sampark Radio") {
        scertstream.image = config.radio_image;
      } else {
        scertstream.image =
          !scertstreamDetail.author.image ||
          scertstreamDetail.author.image === "" ||
          scertstreamDetail.author.image === "null"
            ? config.user_image
            : config.repositoryHost + scertstreamDetail.author.image;
      }

      scertstream.stream_id = scertstreamDetail.id;
      scertstream.id = curScertStream.id;
      scertstream.is_shareable = scertstreamDetail.is_shareable;
      scertstream.name = scertstreamDetail.name;
      scertstream.description = scertstreamDetail.description;
      scertstream.sort_order = scertstreamDetail.sort_order;
      scertstream.likecount = scertstreamDetail.likecount;
      scertstream.viewcount = curScertStream.viewcount;
      scertstream.created_at = curScertStream.publishDate;
      scertstream.publish_at = curScertStream.publishDate;
      scertstream.commentcount = scertstreamDetail.commentcount;

      if (curScertStream.item_type === "image") {
        if (scertstreamDetail.width > 0 && scertstreamDetail.height > 0) {
          scertstream.width = scertstreamDetail.width;
          scertstream.height = scertstreamDetail.height;
        } else {
          const dimensions = await getDimension(
            config.repositoryHost + scertstreamDetail.thumbnail
          );
          scertstream.width = dimensions.width;
          scertstream.height = dimensions.height;
        }
        scertstream.thumbnail =
          config.repositoryHost + scertstreamDetail.thumbnail;
      } else if (curScertStream.item_type === "pdf") {
        scertstream.thumbnail = config.repositoryHost + scertstreamDetail.pdf;
      } else if (curScertStream.item_type !== "text") {
        scertstream.video_code = scertstreamDetail.youtube_code;
        if (scertstreamDetail.width > 0 && scertstreamDetail.height > 0) {
          scertstream.width = scertstreamDetail.width;
          scertstream.height = scertstreamDetail.height;
          scertstream.thumbnail =
            config.repositoryHost + scertstreamDetail.thumbnail;
        } else {
          if (
            scertstreamDetail.thumbnail &&
            scertstreamDetail.thumbnail !== ""
          ) {
            const dimensions = await getDimension(
              config.repositoryHost + scertstreamDetail.thumbnail
            );
            scertstream.width = dimensions.width;
            scertstream.height = dimensions.height;
            scertstream.thumbnail =
              config.repositoryHost + scertstreamDetail.thumbnail;
          } else {
            scertstream.width = 0;
            scertstream.height = 0;
            scertstream.thumbnail =
              "https://img.youtube.com/vi/" +
              scertstreamDetail.youtube_code +
              "/hqdefault.jpg";
          }
        }
      }

      return scertstream;
    }
  } catch (e) {
    // handle error, log or rethrow if necessary
    console.error(e);
  }
  return null;
}

function getIsLiked(
  itemType,
  itemId,
  videolikes,
  imagelikes,
  textlikes,
  pdflikes
) {
  const likesMap = {
    video: videolikes,
    image: imagelikes,
    text: textlikes,
    pdf: pdflikes,
  };

  return likesMap[itemType] && likesMap[itemType].indexOf(itemId) > -1
    ? "true"
    : "";
}

async function getDimension(imagePath) {
  try {
    const dimensions = await probe(imagePath);
    return { width: dimensions.width, height: dimensions.height };
  } catch (err) {
    console.error(err);
    return { width: 0, height: 0 };
  }
}

async function getAllScertstreams(
  device_id,
  userid,
  pull,
  timestamp,
  social_hours,
  updatetime
) {
  const defer = require("q").defer();

  try {
    const query = { is_active: true };
    const query_updated = { is_active: true };
    const query_inactive = { is_active: false };

    let per_page = config.streams_per_page;
    if (timestamp === "") {
      per_page = config.streams_first_page;
    }

    if (updatetime !== "") {
      query_updated.updatedDate = { $gt: updatetime };
    }

    if (pull !== "" && pull !== "all") {
      query.publishDate = {};

      if (pull == "down") {
        query.publishDate.$gt = timestamp;
      } else if (pull == "up") {
        query.publishDate.$lt = timestamp;
      }
    }

    let curUserState = "";
    if (userid) {
      const curUser = await User.findById(userid).populate("state", ["name"]);

      if (curUser.length === 1) {
        const curUserInstance = curUser[0];

        if (social_hours !== "") {
          update_social_hours(curUserInstance, social_hours);
        }

        curUserState = curUserInstance.state;
      }
    } else {
      const user_scertstreams = {
        scertstreams: [],
        max_records: config.max_no_of_scertstreams_on_mobile_storage,
        inactivescertstreams: [],
        updatedscertstreams: [],
      };

      defer.resolve(user_scertstreams);
      return defer.promise;
    }

    query.states = curUserState.id;
    query_updated.states = curUserState.id;

    const inactiveScertstreamList = await Scertstream.distinct(
      "_id",
      query_inactive
    );
    const inactiveScertstreamIds = inactiveScertstreamList.map((item) =>
      item.toString()
    );

    let scertstreams = [];

    if (pull == "all") {
      scertstreams = await Scertstream.find(query).sort({ publishDate: -1 });
    } else {
      scertstreams = await Scertstream.find(query)
        .sort({ publishDate: -1 })
        .limit(per_page > 0 ? per_page : undefined);
    }

    const videolikes = userid
      ? (await Scertpdflike.distinct("pdf", { user: userid })).map((item) =>
          item.toString()
        )
      : [];
    const imagelikes = userid
      ? (await Scertvideolike.distinct("video", { user: userid })).map((item) =>
          item.toString()
        )
      : [];
    const textlikes = userid
      ? (await Scertimagelike.distinct("image", { user: userid })).map((item) =>
          item.toString()
        )
      : [];
    const pdflikes = userid
      ? (await Scerttextlike.distinct("text", { user: userid })).map((item) =>
          item.toString()
        )
      : [];

    const scertstreamList = [];
    const updatedScertstreamList = [];
    const newScertstreamList = [];

    for (const curScertStream of scertstreams) {
      newScertstreamList.push(curScertStream.id);

      const scertstream = await getStreamDetail(
        curScertStream,
        curUser,
        videolikes,
        imagelikes,
        textlikes,
        pdflikes
      );

      if (scertstream) {
        scertstreamList.push(scertstream);
      }
    }

    await Scertstream.updateMany(
      { _id: { $in: newScertstreamList } },
      { $inc: { viewcount: 1 } }
    );

    query_updated._id = { $nin: newScertstreamList };
    const updated_scertstreams = await Scertstream.find(query_updated);

    for (const curScertStream of updated_scertstreams) {
      const scertstream = await getStreamDetail(
        curScertStream,
        curUser,
        videolikes,
        imagelikes,
        textlikes,
        pdflikes
      );
      if (scertstream) {
        updatedScertstreamList.push(scertstream);
      }
    }

    const user_scertstreams = {
      scertstreams: scertstreamList,
      max_records: config.max_no_of_scertstreams_on_mobile_storage,
      inactivescertstreams: inactiveScertstreamIds,
      updatedscertstreams: updatedScertstreamList,
    };

    defer.resolve(user_scertstreams);
  } catch (e) {
    console.error(e);
    defer.reject(e);
  }

  return defer.promise;
}

function titleize(name) {
  return name
    .toLowerCase()
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(" ");
}

function getLocation(stream, streamDetail, curUser) {
  return streamDetail.author !== undefined
    ? streamDetail.author.location
        .toLowerCase()
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(" ")
    : "India";
}

async function getById(id, user) {
  const scertstream = await Scertstream.findById(id).select("-hash");
  scertstream.is_liked = "";

  const departmentname = scertstream.department;
  const subject = scertstream.subject;

  const query = {};
  const queryScertstream = {};

  if (departmentname) {
    query.department = departmentname;
  }
  if (subject) {
    query.subject = subject;
  }

  queryScertstream.scertstream = scertstream;

  query._id = { $nin: [id] };

  if (user) {
    const userlikes = await Scertstreamlike.findOne({
      user,
      scertstream: id,
    }).select("is_liked");

    if (userlikes) {
      scertstream.is_liked = userlikes.is_liked;
    }
  }

  scertstream.youtube_code = config.repositoryHost + scertstream.youtube_code;
  scertstream.thumbnail = config.repositoryHost + scertstream.thumbnail;
  scertstream.thumbnail = `https://img.youtube.com/vi/${scertstream.scertstream_code}/hqdefault.jpg`; // to be removed

  const scertstreamData = { scertstream };
  return scertstreamData;
}

async function create(req) {
  // validate
  scertstreamParam = req.body;
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  const scertstreamType = scertstreamParam.scertstream_type;
  if (scertstreamType == "video") {
    videoParam = {};
    videoParam.name = scertstreamParam.name;
    videoParam.author = scertstreamParam.author;
    videoParam.createdBy = current_user;
    videoParam.updatedBy = current_user;
    videoParam.description = scertstreamParam.description;
    videoParam.sort_order = scertstreamParam.sort_order;
    videoParam.youtube_code = scertstreamParam.youtube_code;
    videoParam.is_shareable = scertstreamParam.is_shareable;
    videoParam.thumbnail = "";
    scertstreamDetail = new Videoscertstream(videoParam);
  } else if (scertstreamType == "audio") {
    audioParam = {};
    audioParam.name = scertstreamParam.name;
    audioParam.author = scertstreamParam.author;
    audioParam.createdBy = current_user;
    audioParam.updatedBy = current_user;
    audioParam.description = scertstreamParam.description;
    audioParam.sort_order = scertstreamParam.sort_order;
    audioParam.youtube_code = scertstreamParam.youtube_code;
    audioParam.is_shareable = scertstreamParam.is_shareable;
    audioParam.thumbnail = "test";
    scertstreamDetail = new Audioscertstream(audioParam);
  } else if (scertstreamType == "image") {
    imageParam = {};
    imageParam.name = scertstreamParam.name;
    imageParam.author = scertstreamParam.author;
    imageParam.createdBy = current_user;
    imageParam.updatedBy = current_user;
    imageParam.description = scertstreamParam.description;
    imageParam.sort_order = scertstreamParam.sort_order;
    imageParam.is_shareable = scertstreamParam.is_shareable;
    imageParam.thumbnail = "test";
    scertstreamDetail = new Imagescertstream(imageParam);
  } else if (scertstreamType == "pdf") {
    pdfParam = {};
    pdfParam.name = scertstreamParam.name;
    pdfParam.author = scertstreamParam.author;
    pdfParam.createdBy = current_user;
    pdfParam.updatedBy = current_user;
    pdfParam.description = scertstreamParam.description;
    pdfParam.sort_order = scertstreamParam.sort_order;
    pdfParam.is_shareable = scertstreamParam.is_shareable;
    pdfParam.pdf = "test";
    scertstreamDetail = new Pdfscertstream(pdfParam);
  } else if (scertstreamType == "text") {
    textParam = {};
    textParam.name = scertstreamParam.name;
    textParam.author = scertstreamParam.author;
    textParam.createdBy = current_user;
    textParam.updatedBy = current_user;
    textParam.description = scertstreamParam.description;
    textParam.sort_order = scertstreamParam.sort_order;
    textParam.is_shareable = scertstreamParam.is_shareable;
    scertstreamDetail = new Textscertstream(textParam);
  }

  if (scertstreamParam.author != "") {
    update_user_points(scertstreamParam.author, 50, null, null);
  }
  try {
    if (await scertstreamDetail.save()) {
      if (scertstreamType == "pdf") {
        if (!req.files || Object.keys(req.files).length === 0) {
          throw "No File Uploaded";
        }

        let pdf = req.files.thumbnail;
        let filename = scertstreamDetail.id + path.extname(pdf.name);
        let uploadData = await uploadToS3(
          pdf,
          "scertstream_uploads/" + scertstreamType,
          filename
        );
        scertstreamDetail.pdf = uploadData.Key;
        scertstreamDetail.save();
      }
      if (scertstreamType == "image") {
        if (!req.files || Object.keys(req.files).length === 0) {
          throw "No File Uploaded";
        }

        let thumbnail = req.files.thumbnail;
        let filename = scertstreamDetail.id + path.extname(thumbnail.name);
        let uploadData = await uploadToS3(
          thumbnail,
          "scertstream_uploads/" + scertstreamType,
          filename
        );
        scertstreamDetail.pdf = uploadData.Key;
        //resize_image(filepath,filepath, scertstreamDetail)
        scertstreamDetail.save();
      }
      if (scertstreamType == "video") {
        if (req.files && Object.keys(req.files).length === 1) {
          // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
          let thumbnail = req.files.thumbnail;
          let filename = scertstreamDetail.id + path.extname(thumbnail.name);
          let uploadData = await uploadToS3(
            thumbnail,
            "scertstream_uploads/" + scertstreamType,
            filename
          );
          scertstreamDetail.thumbnail = uploadData.Key;
          //resize_image(filepath,filepath, scertstreamDetail)
          scertstreamDetail.save();
        }
      }
      scertstreamData = {};
      scertstreamData.item_type = scertstreamType;
      scertstreamData.publishDate = scertstreamParam.publishDate;
      scertstreamData.user_groups = scertstreamParam.user_groups.split(",");
      scertstreamData.states = scertstreamParam.states.split(",");
      scertstreamData.createdBy = current_user;
      scertstreamData.updatedBy = current_user;
      scertstreamData.item_id = scertstreamDetail.id;
      scertstreamData.priority = 1;
      const scertstream = new Scertstream(scertstreamData);
      await scertstream.save();
      if (scertstreamType == "video") {
        create_notification(
          scertstream,
          scertstreamDetail,
          "videoapproved",
          current_user
        );
      }
      return { success: true };
    }
  } catch (e) {
    throw e;
  }
}

async function edit(id) {
  scertstream = await Scertstream.findById(id).select("-hash");
  var scertstreamdetail = {};

  if (scertstream["item_type"] == "audio") {
    scertstreamDetail = await Audioscertstream.findById(scertstream["item_id"]);
    scertstreamdetail["fullurl"] =
      config.repositoryHost + scertstreamDetail["youtube_code"];
    scertstreamdetail["youtube_code"] = scertstreamDetail["youtube_code"];
  } else if (scertstream["item_type"] == "video") {
    scertstreamDetail = await Videoscertstream.findById(scertstream["item_id"]);
    scertstreamdetail["fullurl"] =
      config.repositoryHost + scertstreamDetail["youtube_code"];
    scertstreamdetail["youtube_code"] = scertstreamDetail["youtube_code"];
  } else if (scertstream["item_type"] == "image") {
    scertstreamDetail = await Imagescertstream.findById(scertstream["item_id"]);
    scertstreamdetail["youtube_code"] = "";
  } else if (scertstream["item_type"] == "text") {
    scertstreamDetail = await Textscertstream.findById(scertstream["item_id"]);
    scertstreamdetail["youtube_code"] = "";
  } else if (scertstream["item_type"] == "pdf") {
    scertstreamDetail = await Pdfscertstream.findById(scertstream["item_id"]);
    scertstream["detailed_view"] = true;
  }

  scertstreamdetail["stream_type"] = scertstream["item_type"];
  scertstreamdetail["id"] = scertstream["id"];
  scertstreamdetail["stream_id"] = scertstreamDetail["id"];
  scertstreamdetail["is_shareable"] = scertstreamDetail["is_shareable"];
  scertstreamdetail["is_active"] = scertstream.is_active;
  if (isBase64(scertstreamDetail.description)) {
    let buff = new Buffer(scertstreamDetail["description"], "base64");
    scertstreamdetail["description"] = decodeURIComponent(buff);
  } else {
    scertstreamdetail["description"] = scertstreamDetail["description"];
  }
  scertstreamdetail["name"] = scertstreamDetail["name"];
  scertstreamdetail["sort_order"] = scertstreamDetail["sort_order"];
  scertstreamdetail["author"] = scertstreamDetail["author"];
  if (scertstream["item_type"] == "pdf")
    scertstreamdetail["pdf"] = config.repositoryHost + scertstreamDetail["pdf"];
  else scertstreamdetail["pdf"] = "";

  if (scertstream["item_type"] == "text" || scertstream["item_type"] == "pdf")
    scertstreamdetail["thumbnail"] = "";
  else
    scertstreamdetail["thumbnail"] =
      config.repositoryHost + scertstreamDetail["thumbnail"];
  scertstreamdetail["is_liked"] = "";
  scertstreamdetail["user_groups"] = scertstream.user_groups;
  scertstreamdetail["states"] = scertstream.states;
  scertstreamdetail["likecount"] = scertstreamDetail["likecount"];
  scertstreamdetail["viewcount"] = 0;
  scertstreamdetail["created_at"] = scertstream["createdDate"];
  scertstreamdetail["publish_at"] = scertstream["publishDate"];
  scertstreamdetail["commentcount"] = scertstreamDetail["commentcount"];
  return scertstreamdetail;
}

async function update(id, req) {
  const scertstream = await Scertstream.findById(id);
  var current_user = get_current_user(req);
  var updatedAt = new Date();
  scertstreamParam = req.body;
  var scertstreamdetail = {};

  if (!scertstream) {
    throw "Scertstream does not exists";
  }
  if (scertstream["item_type"] == "audio") {
    scertstreamDetail = await Audioscertstream.findById(scertstream["item_id"]);
    Object.assign(scertstreamDetail, scertstreamParam);
  } else if (scertstream["item_type"] == "video") {
    scertstreamDetail = await Videoscertstream.findById(scertstream["item_id"]);
    Object.assign(scertstreamDetail, scertstreamParam);
  } else if (scertstream["item_type"] == "image") {
    scertstreamDetail = await Imagescertstream.findById(scertstream["item_id"]);
    Object.assign(scertstreamDetail, scertstreamParam);
  } else if (scertstream["item_type"] == "text") {
    scertstreamDetail = await Textscertstream.findById(scertstream["item_id"]);
    Object.assign(scertstreamDetail, scertstreamParam);
  } else if (scertstream["item_type"] == "pdf") {
    scertstreamDetail = await Pdfscertstream.findById(scertstream["item_id"]);
    Object.assign(scertstreamDetail, scertstreamParam);
  } else {
    throw "Scertstream does not exists";
  }

  scertstreamDetail.updatedBy = current_user;
  scertstreamDetail.updatedDate = updatedAt;
  scertstreamDetail.publishDate = scertstreamParam.publishDate;
  if (await scertstreamDetail.save()) {
    scertstream_param = {};
    scertstream_param["user_groups"] = scertstreamParam.user_groups.split(",");
    scertstream_param["states"] = scertstreamParam.states.split(",");
    scertstream_param["is_active"] = scertstreamParam.is_active;
    scertstream_param["updatedBy"] = current_user;
    scertstream_param["updatedDate"] = updatedAt;
    Object.assign(scertstream, scertstream_param);
    await scertstream.save();

    if (req.files && Object.keys(req.files).length === 1) {
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      if (scertstream["item_type"] == "pdf") {
        let pdf = req.files.thumbnail;
        let filename =
          pdf.name + "_" + scertstreamDetail.id + path.extname(pdf.name);
        let uploadData = await uploadToS3(
          pdf,
          "scertstream_uploads/" + scertstream["item_type"],
          filename
        );
        scertstreamDetail.pdf = uploadData.Key;
        scertstreamDetail.save();
      } else {
        let thumbnail = req.files.thumbnail;
        let filename =
          thumbnail.name +
          "_" +
          scertstreamDetail.id +
          path.extname(thumbnail.name);
        let uploadData = await uploadToS3(
          thumbnail,
          "scertstream_uploads/" + scertstream["item_type"],
          filename
        );
        scertstreamDetail.thumbnail = uploadData.Key;
        //resize_image(filepath,filepath, scertstreamDetail)
        scertstreamDetail.save();
      }
    }
    return { success: true };
  }
}

async function _delete(id) {
  await Scertstream.findByIdAndRemove(id);
  return { success: true };
}

async function activation(id, req) {
  const scertstream = await Scertstream.findById(id);
  scertstreamParam = req.body;
  var scertstreamdetail = {};

  if (!scertstream) {
    throw "Scertstream does not exists";
  }
  var current_user = get_current_user(req);
  scertstream_param = {};
  var updatedAt = new Date();
  scertstream_param["updatedBy"] = current_user;
  scertstream_param["updatedDate"] = updatedAt;
  scertstream_param["is_active"] = scertstream.is_active ? false : true;
  Object.assign(scertstream, scertstream_param);
  await scertstream.save();
  return { success: true };
}
