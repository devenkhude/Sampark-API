//'use strict'
const config = require('../config.json');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const update_user_points = commonmethods.update_user_points;
const titleize = commonmethods.titleize;
const resize_image = commonmethods.resize_image;
const get_current_user = commonmethods.get_current_user;
const update_social_hours = commonmethods.update_social_hours;
const create_notification = commonmethods.create_notification;
const uploadToS3 = commonmethods.uploadToS3;
const uploadOnYouTube = commonmethods.uploadOnYouTube;
const User = db.User;
const Stream = db.Stream;
const Streambackup = db.Streambackup;
const Video = db.Video;
const Customlog = db.Customlog;
const Querylog = db.Querylog;
const Streamlike = db.Streamlike;
const Sssvideolike = db.Sssvideolike;
const Imagelike = db.Imagelike;
const Videolike = db.Videolike;
const Textlike = db.Textlike;
const Videostream = db.Videostream;
const Videostreambackup = db.Videostreambackup;
const Imagestream = db.Imagestream;
const Imagestreambackup = db.Imagestreambackup;
const Textstream = db.Textstream;
const Textstreambackup = db.Textstreambackup;
const Uservideo = db.Uservideo;
var objectId = require("mongoose").Types.ObjectId;
var { promisify } = require('util');
var q = require('q');
var path = require('path')
var isBase64 = require('is-base64');
var moment = require('moment');
let _ = require('underscore');
let TinyURL = require('tinyurl');
//db.streams.createIndex( { "is_active": 1, "available_for_aapki_baithak": 1, "item_type": 1, "item_id": 1, "district": 1, "states": 1, "name":1, "description":1 } )
//module.exports = {
//    getAapkiBaithakVideos, //for lesson baithak
//    getAll, //for admin
//    getById, 
//    getAllStreams, //for app
//    search, //for app
//    create,
//    rejectuserupload,
//    update,
//    activation,
//    edit,
//    delete: _delete
//};
module.exports = {
    getAapkiBaithakVideos: getAapkiBaithakVideos, //for lesson baithak
    getAll: getAll, //for admin
    getById: getById,
    getAllStreams: getAllStreams, //for app
    //getAllStreamsNew: getAllStreamsNew,
    search: search, //for app
    create: create,
    rejectuserupload: rejectuserupload,
    update: update,
    activation: activation,
    edit: edit,
    _delete: _delete,
    getAllStateStreams: getAllStateStreams,
    getMyStateStreams: getMyStateStreams,
    getMyDistrictStreams: getMyDistrictStreams,
    getSamparkDidiStreams: getSamparkDidiStreams,
    uploadVideoOnYouTube: uploadVideoOnYouTube,
    getPodcastStreams: getPodcastStreams,
    getUsersStreams: getUsersStreams,
    getUsersStreamsFromBackup: getUsersStreamsFromBackup,
    getBalBaithakStreams: getBalBaithakStreams,
    getmyClassroomVideos: getmyClassroomVideos
};
async function uploadVideoOnYouTube() {
    await uploadOnYouTube();
}
async function getAapkiBaithakVideos() {
    let streams = await Stream.find({ item_type: 'video', available_for_aapki_baithak: true }).sort({ publishDate: -1 });
    let desc = "";
    let streamList = [];
    for (const cstream of streams) {

        let stream = {};
        stream['stream_type'] = cstream['item_type'];
        stream['more_status'] = false;
        stream['sub_title'] = "";

        let streamDetail = await Videostream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);
        if (streamDetail) {
            if (streamDetail.author != "" && streamDetail.author != null) {
                stream['author'] = titleize(streamDetail.author.fullName);
                stream['location'] = streamDetail.author.location;
                stream['badge'] = 0;
                stream['image'] = (streamDetail.author.image != "" && streamDetail.author.image != null) ? config.repositoryHost + streamDetail.author.image : config.user_image;
            } else {
                stream['author'] = "Sampark Didi";
                stream['location'] = "";
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }
            stream['stream_id'] = streamDetail.id;
            stream['id'] = streamDetail.id;
            stream['is_active'] = cstream['is_active'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['available_for_aapki_baithak'] = streamDetail.available_for_aapki_baithak;
            stream['name'] = streamDetail.name;
            stream['isbase'] = isBase64(streamDetail.description);
            if (isBase64(streamDetail.description)) {
                let buff = new Buffer(streamDetail.description, 'base64');
                stream['description'] = decodeURIComponent(buff);
            } else {
                stream['description'] = streamDetail.description;
            }
            if (streamDetail.name === "") {
                stream['name'] = stream['description']
            }
            stream['sort_order'] = streamDetail.sort_order;

            stream["is_liked"] = "";
            stream["likecount"] = streamDetail['likecount'];
            stream["viewcount"] = cstream['viewcount'];
            stream["publish_at"] = cstream['publishDate'];
            stream["created_at"] = cstream['createdDate'];
            stream["commentcount"] = streamDetail['commentcount'];

            if (cstream['item_type'] === "video") {
                stream["video_code"] = streamDetail.youtube_code;
                if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null)
                    stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                else
                    stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
            }
            streamList.push(stream);
        }
    }

    return streamList;

    //return await Stream.find(query).populate('subject','name').populate('department','name').select('-hash');
}

//this was previously used for stream listing in admin - we can remove it later
async function getAllold(req) {
    //     columns: [ [Object], [Object], [Object], [Object], [Object] ],
    //     order: [ [Object] ],
    //     search: { value: '', regex: false } },

    let draw = req.body.draw
    let start = req.body.start
    //sort_order = req.body.order[0]['dir'];
    let sort_order = 'desc'
    let totalstreams = await Stream.find().count();
    let filteredstreams = totalstreams;
    let desc = "";
    let streams = "";
    let streamList = [];
    let query = {};
    if (req.body.search.value != "") {
        let searchstring = req.body.search.value;
        let query = {};
        let querysearch = {};
        let queryor = {};

        let querysearchor = {};
        querysearch["$or"] = [];
        querysearchor['fullName'] = new RegExp(searchstring, "i");
        querysearch["$or"].push(querysearchor);

        querysearchor = {};
        querysearchor['name'] = new RegExp(searchstring, "i");
        querysearch["$or"].push(querysearchor);

        querysearchor = {};
        querysearchor['description'] = new RegExp(searchstring, "i");
        querysearch["$or"].push(querysearchor);

        let usersdata = await User.find(querysearch);
        let userids = [];
        for (const userdata of usersdata) {
            userids.push(userdata.id)
        }
        if (userids.length > 0) {
            querysearchor = {};
            querysearchor['author'] = {};
            querysearchor['author']["$in"] = userids;
            querysearch["$or"].push(querysearchor);
        }

        //querysearchor = {};
        //querysearchor['description'] = new RegExp(searchstring,"i");
        //querysearch["$or"].push(querysearchor);
        //querysearchor = {};
        //querysearchor['name'] = new RegExp(searchstring,"i");
        //querysearch["$or"].push(querysearchor);
        queryor = {};
        query["$or"] = [];
        if (querysearch["$or"].length === 0) {
            delete querysearch["$or"]
        }
        let imagesearchresults = await Imagestream.find(querysearch).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let imagestreams = {};
        let imagestreamids = [];
        if (imagesearchresults.length > 0) {
            let queryimagestreams = {}
            queryimagestreams['item_type'] = "image";
            for (const imagesearchresult of imagesearchresults) {
                imagestreams[imagesearchresult.id] = imagesearchresult;
                imagestreamids.push(imagesearchresult.id);
            }
            queryimagestreams['item_id'] = {};
            queryimagestreams['item_id']["$in"] = imagestreamids;
            query["$or"].push(queryimagestreams);
        }

        let textsearchresults = await Textstream.find(querysearch).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let textstreams = {};
        let textstreamids = [];
        if (textsearchresults.length > 0) {
            let querytextstreams = {}
            querytextstreams['item_type'] = "text";
            for (const textsearchresult of textsearchresults) {
                textstreams[textsearchresult.id] = textsearchresult;
                textstreamids.push(textsearchresult.id);
            }
            querytextstreams['item_id'] = {};
            querytextstreams['item_id']["$in"] = textstreamids;
            query["$or"].push(querytextstreams);
        }

        let videosearchresults = await Videostream.find(querysearch).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let videostreams = {};
        let videostreamids = [];
        if (videosearchresults.length > 0) {
            let queryvideostreams = {}
            queryvideostreams['item_type'] = "video";
            for (const videosearchresult of videosearchresults) {
                videostreams[videosearchresult.id] = videosearchresult;
                videostreamids.push(videosearchresult.id);
            }
            queryvideostreams['item_id'] = {};
            queryvideostreams['item_id']["$in"] = videostreamids;
            query["$or"].push(queryvideostreams);
        }

        let sssvideosearchresults = await Video.find(querysearch);
        let sssvideostreams = {};
        let sssvideostreamids = [];
        if (sssvideosearchresults.length > 0) {
            let querysssstreams = {}
            querysssstreams['item_type'] = "sssvideo";
            for (const sssvideosearchresult of sssvideosearchresults) {
                sssvideostreams[sssvideosearchresult.id] = sssvideosearchresult;
                sssvideostreamids.push(sssvideosearchresult.id);
            }
            querysssstreams['item_id'] = {};
            querysssstreams['item_id']["$in"] = sssvideostreamids;
            query["$or"].push(querysssstreams);
        }

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        if (Object.keys(query).length > 0) {
            filteredstreams = await Stream.find(query).count();
            if (sort_order === "asc")
                streams = await Stream.find(query).sort({ publishDate: 1 }).limit(req.body.length).skip(start);
            else
                streams = await Stream.find(query).sort({ publishDate: -1 }).limit(req.body.length).skip(start);
        } else {
            filteredstreams = 0;
            streams = []
        }
    } else {
        if (sort_order === "asc")
            streams = await Stream.find().sort({ publishDate: 1 }).limit(req.body.length).skip(start);
        else
            streams = await Stream.find().sort({ publishDate: -1 }).limit(req.body.length).skip(start);
    }

    let searchMask = "class";
    let regEx = new RegExp(searchMask, "ig");
    let replaceMask = "";

    for (const cstream of streams) {

        let stream = {};
        stream['stream_type'] = cstream['item_type'];
        stream['more_status'] = false;
        stream['sub_title'] = "";
        let streamDetail = "";
        if (cstream['item_type'] === "video") {
            streamDetail = await Videostream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);

        } else if (cstream['item_type'] === "image") {
            streamDetail = await Imagestream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);

        } else if (cstream['item_type'] === "text") {
            streamDetail = await Textstream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);

        } else if (cstream['item_type'] === "sssvideo") {
            streamDetail = await Video.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']).populate('subject', 'name').populate('department', 'name');

        }

        if (streamDetail) {
            if (cstream['item_type'] === "sssvideo") {
                stream['author'] = "Sampark Didi";
                stream['more_status'] = false; //true;
            }

            if (streamDetail.author) {
                stream['author'] = (streamDetail.author.fullName) ? titleize(streamDetail.author.fullName) : '';
                stream['location'] = streamDetail.author.location;
                stream['badge'] = (streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;
                stream['image'] = (streamDetail.author.image != "" && streamDetail.author.image != null) ? config.repositoryHost + streamDetail.author.image : config.user_image;
            } else {
                stream['author'] = "Sampark Didi";
                stream['location'] = "";
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }
            stream['stream_id'] = streamDetail.id;
            stream['id'] = cstream['id'];
            stream['is_active'] = cstream['is_active'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['name'] = streamDetail.name;
            stream['isbase'] = isBase64(streamDetail.description);
            if (isBase64(streamDetail.description)) {
                let buff = new Buffer(streamDetail.description, 'base64');
                stream['description'] = decodeURIComponent(buff);
            } else {
                stream['description'] = streamDetail.description;
            }

            stream['sort_order'] = streamDetail.sort_order;

            stream["is_liked"] = "";
            stream["likecount"] = streamDetail['likecount'];
            stream["viewcount"] = cstream['viewcount'];
            stream["publish_at"] = cstream['publishDate'];
            stream["created_at"] = cstream['createdDate'];
            stream["commentcount"] = streamDetail['commentcount'];

            if (cstream['item_type'] === "sssvideo") {
                stream['author'] = "Sampark Didi";
                stream['image'] = config.didi_image;
                stream['more_status'] = false; //true;
                stream["video_code"] = streamDetail.video_code;
                if (streamDetail.thumbnail != "" && streamDetail.thumbnail != "null")
                    stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                else
                    stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.video_code + "/hqdefault.jpg";
            } else if (cstream['item_type'] === "image") {
                stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
            } else if (cstream['item_type'] === "video") {
                stream["video_code"] = streamDetail.youtube_code;
                if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null)
                    stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                else
                    stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
            }
            streamList.push(stream);
        }
    }

    let return_data = {};
    return_data['data'] = streamList;
    return_data['draw'] = draw;
    return_data['recordsFiltered'] = filteredstreams;
    return_data['recordsTotal'] = totalstreams;
    return return_data;

    //return await Stream.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function search(searchstring, device_id, userid, social_hours, updatetime) {
    let sizeOf = promisify(require('image-size'));
    let query = {};
    let querysearch = {};
    let queryor = {};

    querysearch['fullName'] = new RegExp(searchstring, "i");
    let usersdata = await User.find(querysearch);
    let userids = [];
    for (var i = 0; i < usersdata.length; i++) {
        userids.push(usersdata[i].id)
    }

    querysearch = {};
    let querysearchor = {};
    querysearch["$or"] = [];
    if (userids.length > 0) {
        querysearchor['author'] = {};
        querysearchor['author']["$in"] = userids;
        querysearch["$or"].push(querysearchor);
    }

    let likequery = {}
    if (userid) {
        likequery["user"] = userid;
    } else {
        likequery["device_id"] = device_id;
    }

    querysearchor = {};
    querysearchor['description'] = new RegExp(searchstring, "i");
    querysearch["$or"].push(querysearchor);
    querysearchor = {};
    querysearchor['name'] = new RegExp(searchstring, "i");
    querysearch["$or"].push(querysearchor);

    queryor = {};
    query["$or"] = [];
    searches = await Imagestream.find(querysearch).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
        imagestreams = {};
        imagestreamids = [];
        let queryimagestreams = {}
        queryimagestreams['item_type'] = "image";
        for (i = 0; i < searches.length; i++) {
            imagestreams[searches[i].id] = searches[i];
            imagestreamids.push(searches[i].id);
        }
        queryimagestreams['item_id'] = {};
        queryimagestreams['item_id']["$in"] = imagestreamids;
        query["$or"].push(queryimagestreams);
    }
    searches = await Textstream.find(querysearch).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
        textstreams = {};
        textstreamids = [];
        let querytextstreams = {}
        querytextstreams['item_type'] = "text";
        for (i = 0; i < searches.length; i++) {
            textstreams[searches[i].id] = searches[i];
            textstreamids.push(searches[i].id);
        }
        querytextstreams['item_id'] = {};
        querytextstreams['item_id']["$in"] = textstreamids;
        query["$or"].push(querytextstreams);
    }
    searches = await Videostream.find(querysearch).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
        videostreams = {};
        videostreamids = [];
        let queryvideostreams = {}
        queryvideostreams['item_type'] = "video";
        for (i = 0; i < searches.length; i++) {
            videostreams[searches[i].id] = searches[i];
            videostreamids.push(searches[i].id);
        }
        queryvideostreams['item_id'] = {};
        queryvideostreams['item_id']["$in"] = videostreamids;
        query["$or"].push(queryvideostreams);
    }
    querysearch["publish_on_social_stream"] = true;
    querysearch["available_for_aapki_baithak"] = false;
    searches = await Video.find(querysearch);
    if (searches.length > 0) {
        sssvideostreams = {};
        sssvideostreamids = [];
        let querysssstreams = {}
        querysssstreams['item_type'] = "sssvideo";
        for (i = 0; i < searches.length; i++) {
            sssvideostreams[searches[i].id] = searches[i];
            sssvideostreamids.push(searches[i].id);
        }
        querysssstreams['item_id'] = {};
        querysssstreams['item_id']["$in"] = sssvideostreamids;
        query["$or"].push(querysssstreams);
    }
    let curUser = "";
    if (userid !== "") {
        curUser = await User.find({ "_id": userid }).populate('state', ['name']);
        if (curUser.length === 1) {
            curUser = curUser[0];

            if (social_hours != "") {
                update_social_hours(curUser, social_hours);
            }
        }
    }
    query["publishDate"] = {};
    query["publishDate"]["$lte"] = new Date();
    query["is_active"] = true;
    query['is_deleted'] = false;
    query['is_hidden'] = false;

    let user_streams = {};
    if (query["$or"].length === 0) {
        user_streams['streams'] = [];
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        return user_streams;
    }
    streams = await Stream.find(query).sort({ publishDate: -1 });

    let sssvideolikes = {};
    let videolikes = {};
    let imagelikes = {};
    let textlikes = {};

    sssvideolikes = await Sssvideolike.distinct('video', likequery);
    videolikes = await Videolike.distinct('video', likequery)
    imagelikes = await Imagelike.distinct('image', likequery);
    textlikes = await Textlike.distinct('text', likequery);
    sssvideolikes = sssvideolikes.map(function (item) {
        return item.toString();
    });
    videolikes = videolikes.map(function (item) {
        return item.toString();
    });
    imagelikes = imagelikes.map(function (item) {
        return item.toString();
    });
    textlikes = textlikes.map(function (item) {
        return item.toString();
    });
    let streamList = [];

    for (const curstream of streams) {
        if (curstream['item_type'] === "sssvideo") {
            let stream = await getSSSVideoStreamDetail(curstream, curUser, sssvideolikes);
            if (stream)
                streamList.push(stream);
        } else {
            let stream = await getStreamDetail(curstream, curUser, videolikes, imagelikes, textlikes);
            if (stream)
                streamList.push(stream);
        }
    }

    user_streams['streams'] = streamList;
    user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
    return user_streams;
}

async function getLocation(stream, streamDetail, curUser) {
    let defer = require('q').defer()
    try {
        let author = (streamDetail.author) ? streamDetail.author.id : "";
        let location = stream.location;
        let india_ids = Object.keys(config.india_user_ids);
        if (author !== "" && author !== undefined && author.id !== undefined && india_ids.indexOf(author.id.toString()) !== -1) {
            defer.resolve("India")
        } else if(location != undefined) {
            const loc = location.toLowerCase()
                .split(' ')
                .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' ');
            defer.resolve(loc)
        }
    } catch (err) {
        defer.reject(err)
    }
    return defer.promise
}

async function getUserDetails(userid, social_hours) {
    let defer = q.defer()
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

async function getStreamDetail(curstream, curUser, videolikes, imagelikes, textlikes) {
    let defer = require('q').defer();
    try {

        let streamDetail = "";
        if (curstream['item_type'] === "video") {

            streamDetail = await Videostream.findById(curstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        } else if (curstream['item_type'] === "image") {

            streamDetail = await Imagestream.findById(curstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        } else if (curstream['item_type'] === "text") {

            streamDetail = await Textstream.findById(curstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        }

        if (streamDetail) {
            let stream = {};

            stream["is_liked"] = "";
            stream['module'] = "baithak"
            if (curstream['item_type'] === "video") {

                if (videolikes.indexOf(curstream["item_id"]) > -1) {
                    stream["is_liked"] = "true";
                }
            } else if (curstream['item_type'] === "image") {
                if (imagelikes.indexOf(curstream["item_id"]) > -1) {
                    stream["is_liked"] = "true";
                }
            } else if (curstream['item_type'] === "text") {
                if (textlikes.indexOf(curstream["item_id"]) > -1) {
                    stream["is_liked"] = "true";
                }
            }

            stream['stream_type'] = curstream['item_type'];
            stream['priority'] = curstream['priority'];
            stream['states'] = curstream['states'];
            stream['more_status'] = false;
            stream['sub_title'] = "";
            stream["width"] = 0;
            stream["height"] = 0;

            if (streamDetail.author != "" && streamDetail.author != null) {
                if (streamDetail.author && streamDetail.author.fullName) {
                    stream['author'] = titleize(streamDetail.author.fullName);
                    stream['author_id'] = streamDetail.author.id;
                } else {
                    stream['author'] = "Sampark Didi";
                }

                stream['location'] = await getLocation(curstream, streamDetail, curUser);
                stream['badge'] = (!streamDetail.author.badge || streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;
                if (stream['author'] === "Sampark Didi")
                    stream['image'] = config.didi_image;
                else if (stream['author'] === "Sampark Radio")
                    stream['image'] = config.radio_image;
                else
                    stream['image'] = (!streamDetail.author.image || streamDetail.author.image === "" || streamDetail.author.image === "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;

            } else {
                stream['author'] = "Sampark Didi";
                stream['location'] = await getLocation(curstream, streamDetail, curUser);
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }
            stream['stream_id'] = streamDetail.id;
            stream['id'] = curstream['id'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['name'] = streamDetail.name;
            stream['description'] = streamDetail.description;
            stream['sort_order'] = streamDetail.sort_order;
            stream["likecount"] = streamDetail['likecount'];
            stream["viewcount"] = curstream['viewcount'];
            stream["created_at"] = curstream['publishDate'];
            stream["publish_at"] = curstream['publishDate'];
            stream["commentcount"] = streamDetail['commentcount'];
            if (curstream['item_type'] !== "text") {
                stream["width"] = streamDetail.width;
                stream["height"] = streamDetail.height;
            }
            if (curstream['item_type'] === "image") {
                stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
            } else if (curstream['item_type'] !== "text") {
                stream["video_code"] = streamDetail.youtube_code;
                if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null) {
                    stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                } else {
                    stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
                }
            }

            defer.resolve(stream)
        } else { //end of if condition checking for the presence of 'streamDetail'
            defer.reject("")
        }
    } catch (e) {
        console.log(e)
        defer.reject("")
    }
    return defer.promise
}

//Below function is to calculate expiry days for user added videos
function calculateExpiryDays(publishedDate) {
    const date1 = new Date(publishedDate);
    const date2 = new Date();
    const diffTime = Math.abs(date2 - date1);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let expiryDays = config.video_deactivation_time_in_days - diffDays;
    return expiryDays;
}
async function getStreamDetailOther(streamsArray, curUser, videolikes, imagelikes, textlikes) {
    let defer = require('q').defer();
    try {

        let streamListToSendBack = [];

        let videoItemIdArray = [];
        let imageItemIdArray = [];
        let textItemIdArray = [];

        _.each(streamsArray, function (stream) {
            if (stream['item_type'] === 'video')
                videoItemIdArray.push(stream['item_id']);

            if (stream['item_type'] === 'image')
                imageItemIdArray.push(stream['item_id']);

            if (stream['item_type'] === 'text')
                textItemIdArray.push(stream['item_id']);
        })


        let videoStreamDetailsArray = await Videostream.find({ "_id": { "$in": videoItemIdArray } }).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let imageStreamDetailsArray = await Imagestream.find({ "_id": { "$in": imageItemIdArray } }).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let textStreamDetailsArray = await Textstream.find({ "_id": { "$in": textItemIdArray } }).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);

        let vidImgTxtTotalStreamDetails = videoStreamDetailsArray.concat(imageStreamDetailsArray);
        vidImgTxtTotalStreamDetails = vidImgTxtTotalStreamDetails.concat(textStreamDetailsArray);


        for (const streamDetail of vidImgTxtTotalStreamDetails) {
            let stream = {};
            let receivedStreamObj = _.where(streamsArray, { 'item_id': streamDetail['id'] })

            stream["is_liked"] = "";
            stream['module'] = "baithak"
            if (receivedStreamObj[0]['item_type'] === "video") {
                if (videolikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                    stream["is_liked"] = "true";

                //Calculate expiry days for video post & share it back
                if (receivedStreamObj[0]['is_sampark_didi_post'] == false)
                    stream["daysToExpiry"] = calculateExpiryDays(receivedStreamObj[0]['publishDate']);

            } else if (receivedStreamObj[0]['item_type'] === "image") {
                if (imagelikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                    stream["is_liked"] = "true";
            } else if (receivedStreamObj[0]['item_type'] === "text") {
                if (textlikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                    stream["is_liked"] = "true";

                if(streamDetail.reasonToShare != "" && streamDetail.resourceType != "" && streamDetail.resourceLink != "" && 
                    streamDetail.reasonToShare != undefined && streamDetail.resourceType != undefined && streamDetail.resourceLink != undefined) {
                    stream["reasonToShare"] = streamDetail.reasonToShare;
                    stream["resourceType"] = streamDetail.resourceType;
                    stream["resourceLink"] = streamDetail.resourceLink;
                    if(streamDetail.resourceType.toLowerCase() === "video") {
                        stream["resourceLink"] = streamDetail.resourceLink;
                        stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.resourceLink + "/hqdefault.jpg";
                    }
                    else
                        stream["resourceLink"] = streamDetail.resourceLink;
                }
            }

            stream['stream_type'] = receivedStreamObj[0]['item_type'];
            stream['priority'] = receivedStreamObj[0]['priority'];
            stream['states'] = receivedStreamObj[0]['states'];
            stream['hashtags'] = receivedStreamObj[0]['hashtags'];
            stream['more_status'] = false;
            stream['sub_title'] = "";
            stream["width"] = 0;
            stream["height"] = 0;

            if (streamDetail.author != "" && streamDetail.author != null) {
                if (streamDetail.author && streamDetail.author.fullName) {
                    stream['author'] = titleize(streamDetail.author.fullName);
                    stream['author_id'] = streamDetail.author.id;
                } else {
                    stream['author'] = "Sampark Didi";
                    stream['author_id'] = null;
                }

                stream['location'] = await getLocation(receivedStreamObj[0], streamDetail, curUser);
                stream['badge'] = (!streamDetail.author.badge || streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;
                if (stream['author'] === "Sampark Didi")
                    stream['image'] = config.didi_image;
                else if (stream['author'] === "Sampark Radio")
                    stream['image'] = config.radio_image;
                else
                    stream['image'] = (!streamDetail.author.image || streamDetail.author.image === "" || streamDetail.author.image === "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;

            } else {
                stream['author'] = "Sampark Didi";
                stream['location'] = await getLocation(receivedStreamObj[0], streamDetail, curUser);
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }

            stream['district'] = receivedStreamObj[0]['district'];
            if (receivedStreamObj[0]['block'] !== undefined && receivedStreamObj[0]['block'] !== null)
                stream['block'] = receivedStreamObj[0]['block'];

            if (receivedStreamObj[0]['cluster'] !== undefined && receivedStreamObj[0]['cluster'] !== null)
                stream['cluster'] = receivedStreamObj[0]['cluster'];

            if (receivedStreamObj[0]['diseCode'] !== undefined && receivedStreamObj[0]['diseCode'] !== null)
                stream['diseCode'] = receivedStreamObj[0]['diseCode'];

            if (receivedStreamObj[0]['pincode'] !== undefined && receivedStreamObj[0]['pincode'] !== null)
                stream['pincode'] = receivedStreamObj[0]['pincode'];

            stream['stream_id'] = streamDetail.id;
            stream['id'] = receivedStreamObj[0]['id'];
            stream['is_report_abused'] = receivedStreamObj[0]['is_report_abused'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['name'] = streamDetail.name;
            stream['description'] = streamDetail.description;
            stream['sort_order'] = streamDetail.sort_order;
            stream["likecount"] = 0; // Initializing like count to 0
            stream["likecount"] = streamDetail['likecount'];
            stream["commentcount"] = 0; // Initializing comment count to 0
            stream["commentcount"] = streamDetail['commentcount'];
            stream["viewcount"] = 0; // Initializing comment count to 0

            stream["pschoolUrl"] = streamDetail['pschoolUrl'];
            //Get view count from videostream collection as viewcount for user videos are storing in videostreams
            if (receivedStreamObj[0]['item_type'] === "video")
                stream["viewcount"] = streamDetail['viewcount']
            else
                stream["viewcount"] = receivedStreamObj[0]['viewcount'];

            stream["viewcount"] = parseInt(stream["viewcount"]) + getAdditionalViewCount(stream["likecount"], stream["commentcount"]);

            stream["created_at"] = receivedStreamObj[0]['publishDate'];
            stream["publish_at"] = receivedStreamObj[0]['publishDate'];
            stream["postOn"] = receivedStreamObj[0]['postOn'];

            if (receivedStreamObj[0]['item_type'] !== "text") {
                stream["width"] = streamDetail.width;
                stream["height"] = streamDetail.height;
            }
            if (receivedStreamObj[0]['item_type'] === "image") {
                stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                if (streamDetail['thumbnails'] != undefined && streamDetail['thumbnails'] != '' && streamDetail['thumbnails'] != null && streamDetail['thumbnails'].length > 0) {
                    stream["thumbnails"] = getThumbnailsArray(streamDetail['thumbnails']);
                    stream["thumbnails_dimensions"] = streamDetail['thumbnails_dimensions'];
                }
                else {
                    stream["thumbnails"] = [];
                    stream["thumbnails"].push(config.repositoryHost + streamDetail.thumbnail);
                }
                if (streamDetail['pdfurl'] != undefined && streamDetail['pdfurl'] != '' && streamDetail['pdfurl'] != null)
                    stream["pdfurl"] = config.repositoryHost + streamDetail['pdfurl'];
                else
                    stream["pdfurl"] = "";
            } else if (receivedStreamObj[0]['item_type'] === "text") {
                if (streamDetail['linkurl'] != undefined && streamDetail['linkurl'] != '' && streamDetail['linkurl'] != null)
                    stream["linkurl"] = streamDetail['linkurl'];
                else
                    stream["linkurl"] = "";
            }
            else if (receivedStreamObj[0]['item_type'] !== "text") {
                stream["video_code"] = streamDetail.youtube_code;
                //let youtubeURL = 'https://www.youtube.com/watch?v=' + streamDetail.youtube_code;
                let youtubeURL = config.video_player_link + streamDetail.youtube_code;
                stream['short_video_code'] = await TinyURL.shorten(youtubeURL);
                if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null) {
                    stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                } else {
                    stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
                }
            }

            streamListToSendBack.push(stream);
        }
        defer.resolve(streamListToSendBack)
    } catch (e) {
        console.log(e)
        defer.reject("")
    }
    return defer.promise
}

async function getStreamDetailOtherFromBackup(streamsArray, curUser, videolikes, imagelikes, textlikes) {
    let defer = require('q').defer();
    try {

        let streamListToSendBack = [];

        let videoItemIdArray = [];
        let imageItemIdArray = [];
        let textItemIdArray = [];

        _.each(streamsArray, function (stream) {
            if (stream['item_type'] === 'video')
                videoItemIdArray.push(stream['item_id']);

            if (stream['item_type'] === 'image')
                imageItemIdArray.push(stream['item_id']);

            if (stream['item_type'] === 'text')
                textItemIdArray.push(stream['item_id']);
        })


        let videoStreamDetailsArray = await Videostreambackup.find({ "_id": { "$in": videoItemIdArray } }).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let imageStreamDetailsArray = await Imagestreambackup.find({ "_id": { "$in": imageItemIdArray } }).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        let textStreamDetailsArray = await Textstreambackup.find({ "_id": { "$in": textItemIdArray } }).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype']);

        let vidImgTxtTotalStreamDetails = videoStreamDetailsArray.concat(imageStreamDetailsArray);
        vidImgTxtTotalStreamDetails = vidImgTxtTotalStreamDetails.concat(textStreamDetailsArray);


        for (const streamDetail of vidImgTxtTotalStreamDetails) {
            let stream = {};
            let receivedStreamObj = _.where(streamsArray, { 'item_id': streamDetail['id'] })

            stream["is_liked"] = "";
            stream['module'] = "baithak"
            if (receivedStreamObj[0]['item_type'] === "video") {
                if (videolikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                    stream["is_liked"] = "true";

                //Calculate expiry days for video post & share it back
                if (receivedStreamObj[0]['is_sampark_didi_post'] == false)
                    stream["daysToExpiry"] = calculateExpiryDays(receivedStreamObj[0]['publishDate']);

            } else if (receivedStreamObj[0]['item_type'] === "image") {
                if (imagelikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                    stream["is_liked"] = "true";
            } else if (receivedStreamObj[0]['item_type'] === "text") {
                if (textlikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                    stream["is_liked"] = "true";
            }

            stream['stream_type'] = receivedStreamObj[0]['item_type'];
            stream['priority'] = receivedStreamObj[0]['priority'];
            stream['states'] = receivedStreamObj[0]['states'];
            stream['hashtags'] = receivedStreamObj[0]['hashtags'];
            stream['more_status'] = false;
            stream['sub_title'] = "";
            stream["width"] = 0;
            stream["height"] = 0;

            if (streamDetail.author != "" && streamDetail.author != null) {
                if (streamDetail.author && streamDetail.author.fullName) {
                    stream['author'] = titleize(streamDetail.author.fullName);
                    stream['author_id'] = streamDetail.author.id;
                } else {
                    stream['author'] = "Sampark Didi";
                    stream['author_id'] = null;
                }

                stream['location'] = await getLocation(receivedStreamObj[0], streamDetail, curUser);
                stream['badge'] = (!streamDetail.author.badge || streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;
                if (stream['author'] === "Sampark Didi")
                    stream['image'] = config.didi_image;
                else if (stream['author'] === "Sampark Radio")
                    stream['image'] = config.radio_image;
                else
                    stream['image'] = (!streamDetail.author.image || streamDetail.author.image === "" || streamDetail.author.image === "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;

            } else {
                stream['author'] = "Sampark Didi";
                stream['location'] = await getLocation(receivedStreamObj[0], streamDetail, curUser);
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }

            stream['district'] = receivedStreamObj[0]['district'];
            if (receivedStreamObj[0]['block'] !== undefined && receivedStreamObj[0]['block'] !== null)
                stream['block'] = receivedStreamObj[0]['block'];

            if (receivedStreamObj[0]['cluster'] !== undefined && receivedStreamObj[0]['cluster'] !== null)
                stream['cluster'] = receivedStreamObj[0]['cluster'];

            if (receivedStreamObj[0]['diseCode'] !== undefined && receivedStreamObj[0]['diseCode'] !== null)
                stream['diseCode'] = receivedStreamObj[0]['diseCode'];

            if (receivedStreamObj[0]['pincode'] !== undefined && receivedStreamObj[0]['pincode'] !== null)
                stream['pincode'] = receivedStreamObj[0]['pincode'];

            stream['stream_id'] = streamDetail.id;
            stream['id'] = receivedStreamObj[0]['id'];
            stream['is_report_abused'] = receivedStreamObj[0]['is_report_abused'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['name'] = streamDetail.name;
            stream['description'] = streamDetail.description;
            stream['sort_order'] = streamDetail.sort_order;
            stream["likecount"] = 0; // Initializing like count to 0
            stream["likecount"] = streamDetail['likecount'];
            stream["commentcount"] = 0; // Initializing comment count to 0
            stream["commentcount"] = streamDetail['commentcount'];
            stream["viewcount"] = 0; // Initializing comment count to 0

            stream["pschoolUrl"] = streamDetail['pschoolUrl'];
            //Get view count from videostream collection as viewcount for user videos are storing in videostreams
            if (receivedStreamObj[0]['item_type'] === "video")
                stream["viewcount"] = streamDetail['viewcount']
            else
                stream["viewcount"] = receivedStreamObj[0]['viewcount'];

            stream["viewcount"] = parseInt(stream["viewcount"]) + getAdditionalViewCount(stream["likecount"], stream["commentcount"]);

            stream["created_at"] = receivedStreamObj[0]['publishDate'];
            stream["publish_at"] = receivedStreamObj[0]['publishDate'];
            stream["postOn"] = receivedStreamObj[0]['postOn'];

            if (receivedStreamObj[0]['item_type'] !== "text") {
                stream["width"] = streamDetail.width;
                stream["height"] = streamDetail.height;
            }
            if (receivedStreamObj[0]['item_type'] === "image") {
                stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                if (streamDetail['thumbnails'] != undefined && streamDetail['thumbnails'] != '' && streamDetail['thumbnails'] != null && streamDetail['thumbnails'].length > 0) {
                    stream["thumbnails"] = getThumbnailsArray(streamDetail['thumbnails']);
                    stream["thumbnails_dimensions"] = streamDetail['thumbnails_dimensions'];
                }
                else {
                    stream["thumbnails"] = [];
                    stream["thumbnails"].push(config.repositoryHost + streamDetail.thumbnail);
                }
                if (streamDetail['pdfurl'] != undefined && streamDetail['pdfurl'] != '' && streamDetail['pdfurl'] != null)
                    stream["pdfurl"] = config.repositoryHost + streamDetail['pdfurl'];
                else
                    stream["pdfurl"] = "";
            } else if (receivedStreamObj[0]['item_type'] === "text") {
                if (streamDetail['linkurl'] != undefined && streamDetail['linkurl'] != '' && streamDetail['linkurl'] != null)
                    stream["linkurl"] = streamDetail['linkurl'];
                else
                    stream["linkurl"] = "";
            }
            else if (receivedStreamObj[0]['item_type'] !== "text") {
                stream["video_code"] = streamDetail.youtube_code;
                //let youtubeURL = 'https://www.youtube.com/watch?v=' + streamDetail.youtube_code;
                let youtubeURL = config.video_player_link + streamDetail.youtube_code;
                stream['short_video_code'] = await TinyURL.shorten(youtubeURL);
                if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null) {
                    stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                } else {
                    stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
                }
            }

            streamListToSendBack.push(stream);
        }
        defer.resolve(streamListToSendBack)
    } catch (e) {
        console.log(e)
        defer.reject("")
    }
    return defer.promise
}

function getAdditionalViewCount(likeCount, commentCount) {
    let likeViewCount = parseInt(likeCount) * config.view_count_multiple_for_like;
    let commentViewCount = parseInt(commentCount) * config.view_count_multiple_for_comment;

    return likeViewCount + commentViewCount;
}

function getThumbnailsArray(thumbnailArray) {
    let thumbnails = [];
    for (const thumbnail of thumbnailArray) {
        thumbnails.push(config.repositoryHost + thumbnail);
    }
    return thumbnails;
}

async function getSSSVideoStreamDetailForAll(streamsArray, curUser, sssvideolikes) {
    let defer = require('q').defer();
    try {

        let itemIdArray = [];
        let streamListToSendBack = [];
        _.each(streamsArray, function (stream) {
            itemIdArray.push(stream['item_id']);
        })

        let streamDetailsArray = await Video.find({ "_id": { "$in": itemIdArray } }).populate('subject', 'name').populate('department', 'name');
        //let streamDetail = await Video.findById(streamsArray[0]['item_id']).populate('subject', 'name').populate('department', 'name');
        for (const streamDetail of streamDetailsArray) {
            //if (streamDetail) {
            let receivedStreamObj = _.where(streamsArray, { 'item_id': streamDetail['id'] })
            let stream = {};
            stream['stream_type'] = receivedStreamObj[0]['item_type'];
            stream['priority'] = receivedStreamObj[0]['priority'];
            stream['states'] = receivedStreamObj[0]['states'];
            //['more_status'] = false;
            stream['sub_title'] = "";
            stream["width"] = 0;
            stream["height"] = 0;

            if (receivedStreamObj[0]['is_podcast_post'] == true)
                stream['author'] = "Sampark Radio";
            else
                stream['author'] = "Sampark Didi";
            stream['more_status'] = true;

            let searchMask = "class";
            let regEx = new RegExp(searchMask, "ig");
            let replaceMask = "";

            if (streamDetail['module'] === "ssh") {

                stream['sub_title'] = streamDetail['subject']['name'] + " " + streamDetail['department']['name'].replace(regEx, replaceMask);
            } else {
                let lesson_string = "";
                if (streamDetail['subject']['name'].toLowerCase() === "english") {
                    lesson_string = "Video";
                } else {
                    lesson_string = "Lesson";
                }

                stream['sub_title'] = streamDetail['subject']['name'] + " " + streamDetail['department']['name'].replace(regEx, replaceMask) + " | " + lesson_string + " " + streamDetail['sort_order'];
            }

            stream['module'] = streamDetail['module'];

            //stream["is_liked"] = (sssvideolikes[receivedStreamObj[0]["item_id"]]) ? "true" : "";
            stream["is_liked"] = "";
            if (sssvideolikes.indexOf(receivedStreamObj[0]["item_id"]) > -1)
                stream["is_liked"] = "true";

            if (streamDetail.author != "" && streamDetail.author != null) {

                if (streamDetail.author && streamDetail.author.fullName) {
                    stream['author'] = titleize(streamDetail.author.fullName);
                    stream['author_id'] = streamDetail.author.id;
                }
                else if (receivedStreamObj[0]['is_podcast_post'] == true) {
                    stream['author'] = "Sampark Radio";
                    stream['author_id'] = null;
                }
                else {
                    stream['author'] = "Sampark Didi";
                    stream['author_id'] = null;
                }
                stream['location'] = await getLocation(receivedStreamObj[0], streamDetail, curUser);
                stream['badge'] = (!streamDetail.author.badge || streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;

                if (stream['author'] === "Sampark Didi")
                    stream['image'] = config.didi_image;
                else if (stream['author'] === "Sampark Radio")
                    stream['image'] = config.radio_image;
                else
                    stream['image'] = (!streamDetail.author.image || streamDetail.author.image === "" || streamDetail.author.image === "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;

            } else {

                stream['author'] = "Sampark Didi";
                stream['location'] = await getLocation(receivedStreamObj[0], streamDetail, curUser);
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }
            stream['district'] = receivedStreamObj[0]['district'];
            stream['stream_id'] = streamDetail.id;
            stream['id'] = receivedStreamObj[0]['id'];
            stream['is_report_abused'] = receivedStreamObj[0]['is_report_abused'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['name'] = streamDetail.name;
            stream['description'] = (streamDetail.social_content) ? streamDetail.social_content : streamDetail.description;
            stream['sort_order'] = streamDetail.sort_order;

            stream["likecount"] = 0; // Initializing like count to 0
            stream["commentcount"] = 0; // Initializing comment count to 0
            stream["viewcount"] = 0; // Initializing view count to 0
            stream["likecount"] = streamDetail['likecount'];
            stream["commentcount"] = streamDetail['commentcount'];
            stream["viewcount"] = streamDetail['viewcount'];
            stream["created_at"] = receivedStreamObj[0]['publishDate'];
            stream["publish_at"] = receivedStreamObj[0]['publishDate'];
            stream["postOn"] = receivedStreamObj[0]['postOn'];

            stream["viewcount"] = parseInt(stream["viewcount"]) + getAdditionalViewCount(stream["likecount"], stream["commentcount"]);

            // stream['author'] = "Sampark Didi";
            // stream['image'] = config.didi_image;
            stream['more_status'] = true;
            stream["video_code"] = streamDetail.video_code;
            //let youtubeURL = 'https://www.youtube.com/watch?v=' + streamDetail.video_code;
            let youtubeURL = config.video_player_link + streamDetail.video_code;
            stream['short_video_code'] = await TinyURL.shorten(youtubeURL);

            stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;
            streamListToSendBack.push(stream);
        }
        defer.resolve(streamListToSendBack)
    } catch (e) {
        console.log(e)
        defer.reject("")
    }
    return defer.promise
}

async function getSSSVideoStreamDetail(curstream, curUser, sssvideolikes) {
    let defer = require('q').defer();
    try {
        let streamDetail = await Video.findById(curstream['item_id']).populate('subject', 'name').populate('department', 'name');

        if (streamDetail) {

            let stream = {};
            stream['stream_type'] = curstream['item_type'];
            stream['priority'] = curstream['priority'];
            stream['states'] = curstream['states'];
            stream['more_status'] = false;
            stream['sub_title'] = "";
            stream["width"] = 0;
            stream["height"] = 0;
            stream['author'] = "Sampark Didi";
            stream['more_status'] = true;

            let searchMask = "class";
            let regEx = new RegExp(searchMask, "ig");
            let replaceMask = "";

            if (streamDetail['module'] === "ssh") {

                stream['sub_title'] = streamDetail['subject']['name'] + " " + streamDetail['department']['name'].replace(regEx, replaceMask);
            } else {
                let lesson_string = "";
                if (streamDetail['subject']['name'].toLowerCase() === "english") {
                    lesson_string = "Video";
                } else {
                    lesson_string = "Lesson";
                }

                stream['sub_title'] = streamDetail['subject']['name'] + " " + streamDetail['department']['name'].replace(regEx, replaceMask) + " | " + lesson_string + " " + streamDetail['sort_order'];
            }

            stream['module'] = streamDetail['module'];

            stream["is_liked"] = (sssvideolikes[curstream["item_id"]]) ? "true" : "";

            if (streamDetail.author != "" && streamDetail.author != null) {

                if (streamDetail.author && streamDetail.author.fullName) {
                    stream['author'] = titleize(streamDetail.author.fullName);
                } else {
                    stream['author'] = "Sampark Didi";
                }

                stream['location'] = await getLocation(curstream, streamDetail, curUser);
                stream['badge'] = (!streamDetail.author.badge || streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;

                if (stream['author'] === "Sampark Didi")
                    stream['image'] = config.didi_image;
                else if (stream['author'] === "Sampark Radio")
                    stream['image'] = config.radio_image;
                else
                    stream['image'] = (!streamDetail.author.image || streamDetail.author.image === "" || streamDetail.author.image === "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;

            } else {

                stream['author'] = "Sampark Didi";
                stream['location'] = await getLocation(curstream, streamDetail, curUser);
                stream['badge'] = 0;
                stream['image'] = config.didi_image;
            }

            stream['stream_id'] = streamDetail.id;
            stream['id'] = curstream['id'];
            stream['is_shareable'] = streamDetail.is_shareable;
            stream['name'] = streamDetail.name;
            stream['description'] = (streamDetail.social_content) ? streamDetail.social_content : streamDetail.description;
            stream['sort_order'] = streamDetail.sort_order;

            stream["likecount"] = streamDetail['likecount'];
            stream["viewcount"] = streamDetail['viewcount'];
            stream["created_at"] = curstream['publishDate'];
            stream["publish_at"] = curstream['publishDate'];
            stream["commentcount"] = streamDetail['commentcount'];

            stream['author'] = "Sampark Didi";
            stream['image'] = config.didi_image;
            stream['more_status'] = true;
            stream["video_code"] = streamDetail.video_code;

            stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
            stream["width"] = streamDetail.width;
            stream["height"] = streamDetail.height;

            defer.resolve(stream)
        } else { //end of if condition checking for the presence of 'streamDetail'
            defer.reject("")
        }
    } catch (e) {
        console.log(e)
        defer.reject("")
    }
    return defer.promise
}

function prepareGetSDDataQuery() {
    let finalSDQuery = {} //  Final query object initialization
    let queryForSD = {} // Query to fetch SD posts

    queryForSD['is_active'] = true;
    queryForSD['is_deleted'] = false;
    queryForSD['is_hidden'] = false;
    queryForSD["publishDate"] = {};

    const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date().toISOString();
    //const endOfDay = new Date(new Date().setUTCHours(23, 59, 59, 999)).toISOString();

    queryForSD["publishDate"]["$gt"] = startOfDay;
    queryForSD["publishDate"]["$lt"] = endOfDay;

    //queryForSD["is_sampark_didi_post"] = true;
    queryForSD["item_type"] = "sssvideo";

    finalSDQuery["$and"] = []
    for (const [key, value] of Object.entries(queryForSD)) {
        let q = {};
        q[key] = value
        finalSDQuery["$and"].push(q);
    }

    return finalSDQuery;
}

// device_id - Device id of logged in user for push notification
// userid - Logged in user id
// pull - up/down (up - fetch the older post | down - fetch the latest post)
// timestamp - time duration for fetch data
// social_hours - social hours calculation
// updatetime - This will come when user do refresh. It will be blank on first call.
// stream_for - mydistrict
// getMyDistrictStreams function returns District Streams for user
// getMyDistrictStreams starts
async function getAllStateStreams(device_id, userid, pull, timestamp, social_hours, updatetime, apkversion) {

    let defer = require('q').defer();

    try {

        let query = {}; // main query


        let streams = []; // Stream object initialization

        //let final_query_update = {} // Final updated query object initialization
        let final_query = {} //  Final query object initialization

        let reverse_array = 0; // Initialize reverse_array value to 0
        let deleteMobileLocalData = 0; // Initialize deleteMobileLocalData value to 0
        let sssvideolikes = {}; // Initialize sssvideolikes object
        let videolikes = {}; // Initialize videolikes object
        let imagelikes = {}; // Initialize imagelikes object
        let textlikes = {}; // Initialize textlikes object
        let likequery = {} // Initialize likequery object
        let streamList = []; // Initialize streamList array
        let inactiveStreamList = []; // Initialize inactiveStreamList array
        let updatedStreamList = []; // Initialize updatedStreamList array
        let newStreamList = []; // Initialize newStreamList array
        let viewStreamList = []; // Initialize viewStreamList array
        let viewVideoList = []; // Initialize viewVideoList array
        let viewSSSVideoList = []; // Initialize viewSSSVideoList array
        let user_streams = {}; // Initialize user_streams object

        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

        // Pass few static where conditions as below for main, updated & inactive query
        query['is_active'] = true;
        query['is_deleted'] = false;
        query['is_hidden'] = false;

        query["available_for_aapki_baithak"] = false;
        query["is_podcast_post"] = false;
        query["publishDate"] = {};
        query["postOn"] = { $in: ["Baithak", "Both"] };


        if (pull === "down") {
            // fetch records greater than timestamp
            query["publishDate"]["$gt"] = timestamp;
        } else if (pull === "up") {
            // fetch records greater than timestamp
            query["publishDate"]["$lt"] = timestamp;
        }

        query["publishDate"]["$lte"] = new Date();


        /* Below logic will get user details from database and update social hours if available.*/
        query["$or"] = [];

        // fetch user details based on userid and social_hours
        let curUser = await getUserDetails(userid, social_hours);
        if (curUser.length > 0) {
            curUser = curUser[0];
            if (social_hours) {
                // Update social_hours for user if available
                await update_social_hours(curUser, social_hours);
            }
        }

        let querystate2 = {}
        let querystate1 = {}
        querystate1["is_sampark_didi_post"] = false;

        let poststate = (curUser && curUser.state) ? curUser && curUser.state.toString() : "nostate";
        querystate2["$and"] = []
        querystate2["$and"].push({ "is_sampark_didi_post": true })
        querystate2["$and"].push({ "states": poststate })
        query["$or"].push(querystate1)
        query["$or"].push(querystate2)

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        final_query["$and"] = [];

        for (const [key, value] of Object.entries(query)) {
            let q = {};
            q[key] = value
            final_query["$and"].push(q);
        }

        if (per_page > 0) {
            if (pull === "down") {

                totalstreamcount = await Stream.countDocuments(final_query);

                if (totalstreamcount > per_page) {
                    deleteMobileLocalData = 1;
                    per_page = config.streams_first_page;
                }

                if (apkversion < 4.8) {
                    reverse_array = 1;
                    streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                }
                else
                    streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
            }
            else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
        } else {
            //streams = await Stream.find(final_query);
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        }

        //code for finding likes of each type of stream
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        // fetch sssvideolikes
        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });

        // fetch videolikes
        videolikes = await Videolike.distinct('video', likequery)
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });

        // fetch imagelikes
        imagelikes = await Imagelike.distinct('image', likequery);
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });

        // fetch textlikes
        textlikes = await Textlike.distinct('text', likequery);
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });

        _.each(streams, function (curstream) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text")
                viewStreamList.push(curstream['id']);
            else if (curstream['item_type'] === "video")
                viewVideoList.push(curstream['item_id']);
            else if (curstream['item_type'] === "sssvideo")
                viewSSSVideoList.push(curstream['item_id']);
            newStreamList.push(curstream['id']);
        })

        if (pull == "down") {
            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            // let finalSDStreams = [];
            // if (sdStreams != []) {
            //   _.each(sdStreams, function (curstream) {
            //     let streamObject = _.where(streams, { "id": curstream['id'] });
            //     if (streamObject.length < 1)
            //       finalSDStreams.push(curstream);
            //   })
            // }

            if (sdStreams.length > 0) {
                mergeByProperty(streams, sdStreams, 'id');
            }
        }

        let sssVideoStreams = _.where(streams, { 'item_type': 'sssvideo' });
        let sssStreamList = await getSSSVideoStreamDetailForAll(sssVideoStreams, curUser, sssvideolikes);
        let otherStreamList = await getStreamDetailOther(streams, curUser, videolikes, imagelikes, textlikes);
        streamList = sssStreamList.concat(otherStreamList);

        streamList = _.sortBy(streamList, 'publish_at');
        if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8))
            streamList = streamList.reverse();

        let currentISTDate = new Date();
        //code to update view count of streams
        await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 }, "updatedDate": currentISTDate.toISOString() });
        await Videostream.updateMany({ "_id": { "$in": viewVideoList } }, { $inc: { viewcount: 1 } });
        await Video.updateMany({ "_id": { "$in": viewSSSVideoList } }, { $inc: { viewcount: 1 } });

        if (deleteMobileLocalData === 0 && updatetime) {

            let query_inactive = {}; // query for inactive records
            let query_updated = {}; // query for updated records
            let inactiveQuery = {};

            inactiveQuery["$or"] = [];
            let isActiveFlag = {};
            let isDeletedFlag = {};
            let isHiddenFlag = {};
            isActiveFlag["is_active"] = false;
            isDeletedFlag["is_deleted"] = true;
            isHiddenFlag["is_hidden"] = true;
            inactiveQuery["$or"].push(isActiveFlag);
            inactiveQuery["$or"].push(isDeletedFlag);
            inactiveQuery["$or"].push(isHiddenFlag);


            inactiveStreamList = await Stream.distinct('_id', inactiveQuery);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });

            query_updated["is_active"] = true;
            query_updated["is_deleted"] = false;
            query_updated["is_hidden"] = false;
            query_updated["available_for_aapki_baithak"] = false;
            query_updated["is_podcast_post"] = false;

            //query_updated["$or"] = [];
            //query_updated["$or"].push(querystate2);

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;

            query_updated["publishDate"] = {};

            query_updated["publishDate"]["$lte"] = new Date();

            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;

            let updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage)).sort({ publishDate: -1 });

            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            let finalSDStreams = [];
            if (sdStreams != []) {
                _.each(sdStreams, function (curstream) {
                    let streamObject = _.where(streams, { "id": curstream['id'] });
                    if (streamObject.length < 1)
                        finalSDStreams.push(curstream);
                })
            }

            if (finalSDStreams.length > 0) {
                mergeByProperty(updated_streams, finalSDStreams, 'id');
            }

            let updatedSssVideoStreams = _.where(updated_streams, { 'item_type': 'sssvideo' });
            let updatedSssStreamList = await getSSSVideoStreamDetailForAll(updatedSssVideoStreams, curUser, sssvideolikes);
            let updatedOtherStreamList = await getStreamDetailOther(updated_streams, curUser, videolikes, imagelikes, textlikes);
            updatedStreamList = updatedSssStreamList.concat(updatedOtherStreamList);

            updatedStreamList = _.sortBy(updatedStreamList, 'publish_at');
            updatedStreamList = updatedStreamList.reverse();
        }

        if (pull == "up") {
            let startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
            streamList = _.reject(streamList, function (num) {
                return (num.priority == 0 && new Date(num.created_at).getTime() > startOfDay.getTime());
            });
        }

        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}


async function getUsersStreams(userid) {

    let defer = require('q').defer();
    newfinal = {};
    let allFinal;

    try {
        let finalStream = [];
        //Fetch item_id array from textstream, imagestream & videostream colection for the given user_id
        if (userid != "" && userid != undefined && userid != null) {

            let videoItemIdArray = await Videostream.find({ "author": new objectId(userid) }, { _id: 1 }).sort({ createdDate: -1 }).limit(50);
            let imageItemIdArray = await Imagestream.find({ "author": new objectId(userid) }, { _id: 1 }).sort({ createdDate: -1 }).limit(50);

            // Removing below text stream as not required on mobile
            let textItemIdArray = await Textstream.find({ "author": new objectId(userid) }, { _id: 1 }).sort({ createdDate: -1 }).limit(50);

            let itemIdObjectArray2 = videoItemIdArray.concat(imageItemIdArray);
            itemIdObjectArray = itemIdObjectArray2.concat(textItemIdArray);

            //Fetch the streams matching item_id array
            let itemIdArray = [];
            if (itemIdObjectArray.length > 0) {
                for (const itemObj of itemIdObjectArray) {
                    itemIdArray.push(itemObj["_id"]);
                }
                let streams = await Stream.find({ "item_id": { "$in": itemIdArray }, "is_active": true }).sort({ publishDate: -1 });
                if (streams.length > 0) {
                    let curUser = await getUserDetails(userid, "");
                    finalStream = await getStreamDetailOther(streams, curUser, [], [], []);
                }
            }
        }
        allFinal = _.sortBy(finalStream, function (o) {
            return o.publish_at;
        });
        newfinal['streams'] = allFinal.reverse();
        defer.resolve(newfinal);
    } catch (e) {
        console.log(e);
        defer.reject(e)
    }
    return defer.promise
}

async function getUsersStreamsFromBackup(userid) {

    let defer = require('q').defer();
    newfinal = {};
    let allFinal;

    try {
        let finalStream = [];
        //Fetch item_id array from textstream, imagestream & videostream colection for the given user_id
        if (userid != "" && userid != undefined && userid != null) {

            let videoItemIdArray = await Videostreambackup.find({ "author": new objectId(userid) }, { _id: 1 }).sort({ createdDate: -1 }).limit(50);
            let imageItemIdArray = await Imagestreambackup.find({ "author": new objectId(userid) }, { _id: 1 }).sort({ createdDate: -1 }).limit(50);

            // Removing below text stream as not required on mobile
            let textItemIdArray = await Textstreambackup.find({ "author": new objectId(userid) }, { _id: 1 }).sort({ createdDate: -1 }).limit(50);

            let itemIdObjectArray2 = videoItemIdArray.concat(imageItemIdArray);
            itemIdObjectArray = itemIdObjectArray2.concat(textItemIdArray);

            //Fetch the streams matching item_id array
            let itemIdArray = [];
            if (itemIdObjectArray.length > 0) {
                for (const itemObj of itemIdObjectArray) {
                    itemIdArray.push(itemObj["_id"]);
                }
                let streams = await Streambackup.find({ "item_id": { "$in": itemIdArray }, "is_active": true }).sort({ publishDate: -1 });

                if (streams.length > 0) {
                    let curUser = await getUserDetails(userid, "");
                    finalStream = await getStreamDetailOtherFromBackup(streams, curUser, [], [], []);
                }
            }
        }
        allFinal = _.sortBy(finalStream, function (o) {
            return o.publish_at;
        });
        newfinal['streams'] = allFinal.reverse();
        defer.resolve(newfinal);
    } catch (e) {
        console.log(e);
        defer.reject(e)
    }
    return defer.promise
}

function mergeByProperty(arr1, arr2, prop) {
    _.each(arr2, function (arr2obj) {
        var arr1obj = _.find(arr1, function (arr1obj) {
            return arr1obj[prop] === arr2obj[prop];
        });

        //If the object already exist extend it with the new values from arr2, otherwise just add the new object to arr1
        arr1obj ? _.extend(arr1obj, arr2obj) : arr1.push(arr2obj);
    });
}

// device_id - Device id of logged in user for push notification
// userid - Logged in user id
// pull - up/down (up - fetch the older post | down - fetch the latest post)
// timestamp - time duration for fetch data
// social_hours - social hours calculation
// updatetime - This will come when user do refresh. It will be blank on first call.
// stream_for - mydistrict
// getMyDistrictStreams function returns District Streams for user
// getMyDistrictStreams starts
async function getMyDistrictStreams(device_id, userid, pull, timestamp, social_hours, updatetime, apkversion) {

    let defer = require('q').defer();

    try {

        let query = {}; // main query


        let streams = []; // Stream object initialization
        //let final_query_update = {} // Final updated query object initialization
        let final_query = {} //  Final query object initialization
        let reverse_array = 0; // Initialize reverse_array value to 0
        let deleteMobileLocalData = 0; // Initialize deleteMobileLocalData value to 0
        let sssvideolikes = {}; // Initialize sssvideolikes object
        let videolikes = {}; // Initialize videolikes object
        let imagelikes = {}; // Initialize imagelikes object
        let textlikes = {}; // Initialize textlikes object
        let likequery = {} // Initialize likequery object
        let streamList = []; // Initialize streamList array
        let inactiveStreamList = []; // Initialize inactiveStreamList array
        let updatedStreamList = []; // Initialize updatedStreamList array
        let newStreamList = []; // Initialize newStreamList array
        let viewStreamList = []; // Initialize viewStreamList array
        let user_streams = {}; // Initialize user_streams object

        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

        // Pass few static where conditions as below for main, updated & inactive query
        query['is_active'] = true;
        query['is_deleted'] = false;
        query['is_hidden'] = false;

        query["available_for_aapki_baithak"] = false;
        query["publishDate"] = {};


        if (pull === "down") {
            // fetch records greater than timestamp
            query["publishDate"]["$gt"] = timestamp;
        } else if (pull === "up") {
            // fetch records greater than timestamp
            query["publishDate"]["$lt"] = timestamp;
        }

        query["publishDate"]["$lte"] = new Date();


        /* Below logic will get user details from database and update social hours if available.*/
        query["$or"] = [];

        // fetch user details based on userid and social_hours
        let curUser = await getUserDetails(userid, social_hours);
        if (curUser.length > 0) {
            curUser = curUser[0];
            if (social_hours) {
                // Update social_hours for user if available
                await update_social_hours(curUser, social_hours);
            }
        }
        let query_updated = {}; // query for updated records
        // If user logged in and user has district
        if (curUser && curUser.district) {
            let querydistrict1 = {}
            let querydistrict2 = {}
            querydistrict1["district"] = curUser.district;
            //querydistrict2["is_sampark_didi_post"] = true; // commented by gagan - as discussed with sandeep, only state specific posts will appear
            query["$or"] = [];
            query["$or"].push(querydistrict1);
            query["$or"].push(querydistrict2);
            query_updated["$or"] = [];
            query_updated["$or"].push(querydistrict1);
            query_updated["$or"].push(querydistrict2);
        }
        // If current user has not state associated
        else {
            query["state"] = "nostate";
            //query["is_sampark_didi_post"] = true;  // commented by gagan - as discussed with sandeep, only state specific posts will appear
            query_updated["state"] = "nostate";
            //query_updated["is_sampark_didi_post"] = true;  // commented by gagan - as discussed with sandeep, only state specific posts will appear
        }

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        final_query["$and"] = []

        for (const [key, value] of Object.entries(query)) {
            let q = {};
            q[key] = value
            final_query["$and"].push(q)
        }

        if (per_page > 0) {
            if (pull === "down") {
                totalstreamcount = await Stream.countDocuments(final_query);

                if (totalstreamcount > per_page) {
                    deleteMobileLocalData = 1;
                    per_page = config.streams_first_page;
                }

                if (apkversion < 4.8) {
                    reverse_array = 1;
                    streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                }
                else
                    streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
            }
            else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
        } else {
            //streams = await Stream.find(final_query);
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        }

        //code for finding likes of each type of stream
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        // fetch sssvideolikes
        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });

        // fetch videolikes
        videolikes = await Videolike.distinct('video', likequery)
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });

        // fetch imagelikes
        imagelikes = await Imagelike.distinct('image', likequery);
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });

        // fetch textlikes
        textlikes = await Textlike.distinct('text', likequery);
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });

        _.each(streams, function (curstream) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text") {
                viewStreamList.push(curstream['id']);
            }
            newStreamList.push(curstream['id']);
        })


        if (pull == "down") {
            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            // let finalSDStreams = [];
            // if (sdStreams != []) {
            //   _.each(sdStreams, function (curstream) {
            //     let streamObject = _.where(streams, { "id": curstream['id'] });
            //     if (streamObject.length < 1)
            //       finalSDStreams.push(curstream);
            //   })
            // }

            if (sdStreams.length > 0) {
                mergeByProperty(streams, sdStreams, 'id');
            }
        }

        let sssVideoStreams = _.where(streams, { 'item_type': 'sssvideo' });
        let sssStreamList = await getSSSVideoStreamDetailForAll(sssVideoStreams, curUser, sssvideolikes);
        let otherStreamList = await getStreamDetailOther(streams, curUser, videolikes, imagelikes, textlikes);
        streamList = sssStreamList.concat(otherStreamList);
        streamList = _.sortBy(streamList, 'publish_at');
        if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8))
            streamList = streamList.reverse();

        //code to update view count of streams
        //Commented below view count increase here as it is was handled in all state api
        //await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 } })

        if (deleteMobileLocalData === 0 && updatetime) {

            let query_inactive = {}; // query for inactive records
            let inactiveQuery = {};

            inactiveQuery["$or"] = [];
            let isActiveFlag = {};
            let isDeletedFlag = {};
            let isHiddenFlag = {};
            isActiveFlag["is_active"] = false;
            isDeletedFlag["is_deleted"] = true;
            isHiddenFlag["is_hidden"] = true;
            inactiveQuery["$or"].push(isActiveFlag);
            inactiveQuery["$or"].push(isDeletedFlag);
            inactiveQuery["$or"].push(isHiddenFlag);


            // query_inactive["is_active"] = false;
            // query_inactive["is_deleted"] = true;
            // query_inactive["is_hidden"] = true;

            inactiveStreamList = await Stream.distinct('_id', inactiveQuery);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });

            query_updated["is_active"] = true;
            query_updated["is_deleted"] = false;
            query_updated["is_hidden"] = false;
            query_updated["available_for_aapki_baithak"] = false;
            query_updated["publishDate"] = {};

            query_updated["publishDate"]["$lte"] = new Date();

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;


            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;

            const updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage)).sort({ publishDate: -1 });

            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            let finalSDStreams = [];
            if (sdStreams != []) {
                _.each(sdStreams, function (curstream) {
                    let streamObject = _.where(streams, { "id": curstream['id'] });
                    if (streamObject.length < 1)
                        finalSDStreams.push(curstream);
                })
            }

            if (finalSDStreams.length > 0) {
                mergeByProperty(updated_streams, finalSDStreams, 'id');
            }

            let updatedSssVideoStreams = _.where(updated_streams, { 'item_type': 'sssvideo' });
            let updatedSssStreamList = await getSSSVideoStreamDetailForAll(updatedSssVideoStreams, curUser, sssvideolikes);
            let updatedOtherStreamList = await getStreamDetailOther(updated_streams, curUser, videolikes, imagelikes, textlikes);
            updatedStreamList = updatedSssStreamList.concat(updatedOtherStreamList);

            updatedStreamList = _.sortBy(updatedStreamList, 'publish_at');
            updatedStreamList = updatedStreamList.reverse();
        }

        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}
// getMyDistrictStreams ends

// device_id - Device id of logged in user for push notification
// userid - Logged in user id
// pull - up/down (up - fetch the older post | down - fetch the latest post)
// timestamp - time duration for fetch data
// social_hours - social hours calculation
// updatetime - This will come when user do refresh. It will be blank on first call.
// stream_for - mydistrict
// getMyDistrictStreams function returns District Streams for user
// getSamparkDidiStreams starts
async function getSamparkDidiStreams(device_id, userid, pull, timestamp, social_hours, updatetime, apkversion) {

    let defer = require('q').defer();

    try {

        let query = {}; // main query
        let streams = []; // Stream object initialization
        let final_query = {} //  Final query object initialization
        let reverse_array = 0; // Initialize reverse_array value to 0
        let deleteMobileLocalData = 0; // Initialize deleteMobileLocalData value to 0
        let sssvideolikes = {}; // Initialize sssvideolikes object
        let videolikes = {}; // Initialize videolikes object
        let imagelikes = {}; // Initialize imagelikes object
        let textlikes = {}; // Initialize textlikes object
        let likequery = {} // Initialize likequery object
        let streamList = []; // Initialize streamList array
        let inactiveStreamList = []; // Initialize inactiveStreamList array
        let updatedStreamList = []; // Initialize updatedStreamList array
        let newStreamList = []; // Initialize newStreamList array
        let viewStreamList = []; // Initialize viewStreamList array
        let viewVideoList = []; // Initialize viewVideoList array
        let viewSSSVideoList = []; // Initialize viewSSSVideoList array
        let user_streams = {}; // Initialize user_streams object


        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

        // Pass few static where conditions as below for main, updated & inactive query
        query['is_active'] = true;
        query['is_deleted'] = false;
        query['is_hidden'] = false;

        query["available_for_aapki_baithak"] = false;
        query["publishDate"] = {};

        if (pull === "down") {
            // fetch records greater than timestamp
            query["publishDate"]["$gt"] = timestamp;
        } else if (pull === "up") {
            // fetch records greater than timestamp
            query["publishDate"]["$lt"] = timestamp;
        }

        query["publishDate"]["$lte"] = new Date();

        /* Below logic will get user details from database and update social hours if available.*/
        query["$or"] = [];

        // fetch user details based on userid and social_hours
        let curUser = await getUserDetails(userid, social_hours);
        if (curUser.length > 0) {
            curUser = curUser[0];
            if (social_hours) {
                // Update social_hours for user if available
                await update_social_hours(curUser, social_hours);
            }
        }

        // fetch samparkdidi posts
        //query["is_sampark_didi_post"] = true;
        let poststate = (curUser && curUser.state) ? curUser && curUser.state.toString() : "nostate";

        query["$or"].push({ "is_sampark_didi_post": true, "states": poststate });
        query["$or"].push({ "is_podcast_post": true, "states": poststate });

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        final_query["$and"] = []

        for (const [key, value] of Object.entries(query)) {
            let q = {};
            q[key] = value
            final_query["$and"].push(q)
        }

        if (per_page > 0) {
            if (pull === "down") {
                totalstreamcount = await Stream.countDocuments(final_query);

                if (totalstreamcount > per_page) {
                    deleteMobileLocalData = 1;
                    per_page = config.streams_first_page;
                }

                if (apkversion < 4.8) {
                    reverse_array = 1;
                    streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                }
                else
                    streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
            }
            else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
        } else {
            //streams = await Stream.find(final_query);
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        }

        //code for finding likes of each type of stream
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        // fetch sssvideolikes
        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });

        // fetch videolikes
        videolikes = await Videolike.distinct('video', likequery)
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });

        // fetch imagelikes
        imagelikes = await Imagelike.distinct('image', likequery);
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });

        // fetch textlikes
        textlikes = await Textlike.distinct('text', likequery);
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });

        // _.each(streams, function (curstream) {
        //   if (curstream['item_type'] === "image" || curstream['item_type'] === "text") {
        //     viewStreamList.push(curstream['id']);
        //   }
        //   newStreamList.push(curstream['id']);
        // })

        _.each(streams, function (curstream) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text")
                viewStreamList.push(curstream['id']);
            else if (curstream['item_type'] === "video")
                viewVideoList.push(curstream['item_id']);
            else if (curstream['item_type'] === "sssvideo")
                viewSSSVideoList.push(curstream['item_id']);
            newStreamList.push(curstream['id']);
        })

        let sssVideoStreams = _.where(streams, { 'item_type': 'sssvideo' });
        let sssStreamList = await getSSSVideoStreamDetailForAll(sssVideoStreams, curUser, sssvideolikes);
        let otherStreamList = await getStreamDetailOther(streams, curUser, videolikes, imagelikes, textlikes);
        streamList = sssStreamList.concat(otherStreamList);

        streamList = _.sortBy(streamList, 'publish_at');
        if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8))
            streamList = streamList.reverse();

        let currentISTDate = new Date();
        //code to update view count of streams
        await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 }, "updatedDate": currentISTDate.toISOString() });
        await Videostream.updateMany({ "_id": { "$in": viewVideoList } }, { $inc: { viewcount: 1 } });
        await Video.updateMany({ "_id": { "$in": viewSSSVideoList } }, { $inc: { viewcount: 1 } });

        if (deleteMobileLocalData === 0 && updatetime) {

            let query_inactive = {}; // query for inactive records
            let query_updated = {}; // Initialize query_updated object
            let inactiveQuery = {};

            inactiveQuery["$or"] = [];
            let isActiveFlag = {};
            let isDeletedFlag = {};
            let isHiddenFlag = {};
            isActiveFlag["is_active"] = false;
            isDeletedFlag["is_deleted"] = true;
            isHiddenFlag["is_hidden"] = true;
            inactiveQuery["$or"].push(isActiveFlag);
            inactiveQuery["$or"].push(isDeletedFlag);
            inactiveQuery["$or"].push(isHiddenFlag);


            inactiveStreamList = await Stream.distinct('_id', inactiveQuery);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });

            query_updated["is_active"] = true;
            query_updated["is_deleted"] = false;
            query_updated["is_hidden"] = false;
            query_updated["available_for_aapki_baithak"] = false;
            query_updated["publishDate"] = {};
            query_updated["publishDate"]["$lte"] = new Date();

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;

            query_updated["$or"] = [];

            query_updated["$or"].push({ "is_sampark_didi_post": true });
            query_updated["$or"].push({ "is_podcast_post": true });

            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;


            const updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage)).sort({ publishDate: -1 });

            let updatedSssVideoStreams = _.where(updated_streams, { 'item_type': 'sssvideo' });
            let updatedSssStreamList = await getSSSVideoStreamDetailForAll(updatedSssVideoStreams, curUser, sssvideolikes);
            let updatedOtherStreamList = await getStreamDetailOther(updated_streams, curUser, videolikes, imagelikes, textlikes);
            updatedStreamList = updatedSssStreamList.concat(updatedOtherStreamList);

            // updatedStreamList = _.sortBy(updatedStreamList, 'publish_at');
            // updatedStreamList = updatedStreamList.reverse();
        }

        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}
// getSamparkDidiStreams ends

// device_id - Device id of logged in user for push notification
// userid - Logged in user id
// pull - up/down (up - fetch the older post | down - fetch the latest post)
// timestamp - time duration for fetch data
// social_hours - social hours calculation
// updatetime - This will come when user do refresh. It will be blank on first call.
// stream_for - mydistrict
// getMyDistrictStreams function returns District Streams for user
// getSamparkDidiStreams starts
async function getPodcastStreams(device_id, userid, pull, timestamp, social_hours, updatetime, apkversion) {

    let defer = require('q').defer();

    try {

        let query = {}; // main query
        let streams = []; // Stream object initialization
        let final_query = {} //  Final query object initialization
        let reverse_array = 0; // Initialize reverse_array value to 0
        let deleteMobileLocalData = 0; // Initialize deleteMobileLocalData value to 0
        let sssvideolikes = {}; // Initialize sssvideolikes object
        let videolikes = {}; // Initialize videolikes object
        let imagelikes = {}; // Initialize imagelikes object
        let textlikes = {}; // Initialize textlikes object
        let likequery = {} // Initialize likequery object
        let streamList = []; // Initialize streamList array
        let inactiveStreamList = []; // Initialize inactiveStreamList array
        let updatedStreamList = []; // Initialize updatedStreamList array
        let newStreamList = []; // Initialize newStreamList array
        let viewStreamList = []; // Initialize viewStreamList array
        let viewVideoList = []; // Initialize viewVideoList array
        let viewSSSVideoList = []; // Initialize viewSSSVideoList array
        let user_streams = {}; // Initialize user_streams object


        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

        // Pass few static where conditions as below for main, updated & inactive query
        query['is_active'] = true;
        query['is_deleted'] = false;
        query['is_hidden'] = false;
        query["is_podcast_post"] = true;

        query["available_for_aapki_baithak"] = false;
        query["publishDate"] = {};

        if (pull === "down") {
            // fetch records greater than timestamp
            query["publishDate"]["$gt"] = timestamp;
        } else if (pull === "up") {
            // fetch records greater than timestamp
            query["publishDate"]["$lt"] = timestamp;
        }

        query["publishDate"]["$lte"] = new Date();

        /* Below logic will get user details from database and update social hours if available.*/
        query["$or"] = [];

        // fetch user details based on userid and social_hours
        let curUser = await getUserDetails(userid, social_hours);
        if (curUser.length > 0) {
            curUser = curUser[0];
            if (social_hours) {
                // Update social_hours for user if available
                await update_social_hours(curUser, social_hours);
            }
        }

        query["states"] = (curUser && curUser.state) ? curUser && curUser.state.toString() : "nostate";

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        final_query["$and"] = []
        for (const [key, value] of Object.entries(query)) {
            let q = {};
            q[key] = value
            final_query["$and"].push(q)
        }

        if (per_page > 0) {
            if (pull === "down") {
                totalstreamcount = await Stream.countDocuments(final_query);

                if (totalstreamcount > per_page) {
                    deleteMobileLocalData = 1;
                    per_page = config.streams_first_page;
                }

                // if (apkversion < 4.8) {
                //   reverse_array = 1;
                //   streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                // }
                // else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
            }
            else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
        } else {
            //streams = await Stream.find(final_query);
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        }

        //code for finding likes of each type of stream
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        // fetch sssvideolikes
        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });

        // fetch videolikes
        videolikes = await Videolike.distinct('video', likequery)
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });

        // fetch imagelikes
        imagelikes = await Imagelike.distinct('image', likequery);
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });

        // fetch textlikes
        textlikes = await Textlike.distinct('text', likequery);
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });

        // _.each(streams, function (curstream) {
        //   if (curstream['item_type'] === "image" || curstream['item_type'] === "text") {
        //     viewStreamList.push(curstream['id']);
        //   }
        //   newStreamList.push(curstream['id']);
        // })

        _.each(streams, function (curstream) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text")
                viewStreamList.push(curstream['id']);
            else if (curstream['item_type'] === "video")
                viewVideoList.push(curstream['item_id']);
            else if (curstream['item_type'] === "sssvideo")
                viewSSSVideoList.push(curstream['item_id']);
            newStreamList.push(curstream['id']);
        })

        let sssVideoStreams = _.where(streams, { 'item_type': 'sssvideo' });
        let sssStreamList = await getSSSVideoStreamDetailForAll(sssVideoStreams, curUser, sssvideolikes);
        let otherStreamList = await getStreamDetailOther(streams, curUser, videolikes, imagelikes, textlikes);
        streamList = sssStreamList.concat(otherStreamList);
        //streamList = sssStreamList;

        streamList = _.sortBy(streamList, 'publish_at');
        if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8))
            streamList = streamList.reverse();

        let currentISTDate = new Date();
        //code to update view count of streams
        await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 }, "updatedDate": currentISTDate.toISOString() });
        await Videostream.updateMany({ "_id": { "$in": viewVideoList } }, { $inc: { viewcount: 1 } });
        await Video.updateMany({ "_id": { "$in": viewSSSVideoList } }, { $inc: { viewcount: 1 } });

        if (deleteMobileLocalData === 0 && updatetime) {

            let query_inactive = {}; // query for inactive records
            let query_updated = {}; // Initialize query_updated object
            let inactiveQuery = {};

            inactiveQuery["$or"] = [];
            let isActiveFlag = {};
            let isDeletedFlag = {};
            let isHiddenFlag = {};
            isActiveFlag["is_active"] = false;
            isDeletedFlag["is_deleted"] = true;
            isHiddenFlag["is_hidden"] = true;
            inactiveQuery["$or"].push(isActiveFlag);
            inactiveQuery["$or"].push(isDeletedFlag);
            inactiveQuery["$or"].push(isHiddenFlag);


            inactiveStreamList = await Stream.distinct('_id', inactiveQuery);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });

            query_updated["is_active"] = true;
            query_updated["is_deleted"] = false;
            query_updated["is_hidden"] = false;
            query_updated["available_for_aapki_baithak"] = false;
            query_updated["publishDate"] = {};
            query_updated["publishDate"]["$lte"] = new Date();

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;

            //query_updated["is_sampark_didi_post"] = true;
            query_updated["is_podcast_post"] = true;

            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;

            const updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage));

            let updatedSssVideoStreams = _.where(updated_streams, { 'item_type': 'sssvideo' });
            let updatedSssStreamList = await getSSSVideoStreamDetailForAll(updatedSssVideoStreams, curUser, sssvideolikes);
            let updatedOtherStreamList = await getStreamDetailOther(updated_streams, curUser, videolikes, imagelikes, textlikes);
            updatedStreamList = updatedSssStreamList.concat(updatedOtherStreamList);
            //updatedStreamList = updatedSssStreamList;

            // updatedStreamList = _.sortBy(updatedStreamList, 'publish_at');
            // updatedStreamList = updatedStreamList.reverse();
        }

        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}
// getPodcastStreams ends


// device_id - Device id of logged in user for push notification
// userid - Logged in user id
// pull - up/down (up - fetch the older post | down - fetch the latest post)
// timestamp - time duration for fetch data
// social_hours - social hours calculation
// updatetime - This will come when user do refresh. It will be blank on first call.
// stream_for - mydistrict
// getMyDistrictStreams function returns District Streams for user
// getMyDistrictStreams starts
async function getMyStateStreams(device_id, userid, pull, timestamp, social_hours, updatetime, apkversion) {

    let defer = require('q').defer();

    try {

        let query = {}; // main query


        let streams = []; // Stream object initialization
        //let final_query_update = {} // Final updated query object initialization
        let final_query = {} //  Final query object initialization
        let reverse_array = 0; // Initialize reverse_array value to 0
        let deleteMobileLocalData = 0; // Initialize deleteMobileLocalData value to 0
        let sssvideolikes = {}; // Initialize sssvideolikes object
        let videolikes = {}; // Initialize videolikes object
        let imagelikes = {}; // Initialize imagelikes object
        let textlikes = {}; // Initialize textlikes object
        let likequery = {} // Initialize likequery object
        let streamList = []; // Initialize streamList array
        let inactiveStreamList = []; // Initialize inactiveStreamList array
        let updatedStreamList = []; // Initialize updatedStreamList array
        let newStreamList = []; // Initialize newStreamList array
        let viewStreamList = []; // Initialize viewStreamList array
        let user_streams = {}; // Initialize user_streams object

        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

        // Pass few static where conditions as below for main, updated & inactive query
        query['is_active'] = true;
        query['is_deleted'] = false;
        query['is_hidden'] = false;

        query["available_for_aapki_baithak"] = false;
        query["is_podcast_post"] = false;
        query["publishDate"] = {};


        if (pull === "down") {
            // fetch records greater than timestamp
            query["publishDate"]["$gt"] = timestamp;
        } else if (pull === "up") {
            // fetch records greater than timestamp
            query["publishDate"]["$lt"] = timestamp;
        }

        query["publishDate"]["$lte"] = new Date();
        query["is_podcast_post"] = false;

        /* Below logic will get user details from database and update social hours if available.*/
        // fetch user details based on userid and social_hours
        let curUser = await getUserDetails(userid, social_hours);
        if (curUser.length > 0) {
            curUser = curUser[0];
            if (social_hours) {
                // Update social_hours for user if available
                await update_social_hours(curUser, social_hours);
            }
        }

        query["$or"] = [];

        // If user logged in and user has mystate
        let querystate1 = {};
        let querystate2 = {};

        // commented by gagan - as discussed with sandeep, only state specific posts will appear
        let poststate = (curUser && curUser.state) ? curUser && curUser.state.toString() : "nostate";
        querystate1["states"] = poststate;
        //querystate2["is_sampark_didi_post"] = true;  
        querystate2["$and"] = []
        querystate2["$and"].push({ "is_sampark_didi_post": true })
        querystate2["$and"].push(querystate1)
        query["$or"].push(querystate1);
        query["$or"].push(querystate2);

        let query_updated = {}; // query for updated records
        // Below if conditions to get bal baithak posts
        // query["$or"] = [];
        query_updated["$or"] = [];

        if (curUser && curUser.diseCode) {
            query["$or"].push({ "diseCode": curUser.diseCode });
            query_updated["$or"].push({ "diseCode": curUser.diseCode });
        }

        if (curUser && curUser.pincode) {
            query["$or"].push({ "pincode": curUser.pincode });
            query_updated["$or"].push({ "pinCode": curUser.pincode });
        }

        if (curUser && curUser.district) {
            query["$or"].push({ "district": curUser.district + "" });
            query_updated["$or"].push({ "district": curUser.district + "" });
        }

        if (curUser && curUser.cluster) {
            query["$or"].push({ "cluster": curUser.cluster + "" });
            query_updated["$or"].push({ "cluster": curUser.cluster + "" });
        }

        if (curUser && curUser.block) {
            query["$or"].push({ "block": curUser.block + "" });
            query_updated["$or"].push({ "block": curUser.block + "" });
        }

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        final_query["$and"] = []

        for (const [key, value] of Object.entries(query)) {
            let q = {};
            q[key] = value
            final_query["$and"].push(q)
        }

        if (per_page > 0) {
            if (pull === "down") {
                totalstreamcount = await Stream.countDocuments(final_query);

                if (totalstreamcount > per_page) {
                    deleteMobileLocalData = 1;
                    per_page = config.streams_first_page;
                }

                if (apkversion < 4.8) {
                    reverse_array = 1;
                    streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                }
                else
                    streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
            }
            else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
        } else {
            //streams = await Stream.find(final_query);
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        }

        //code for finding likes of each type of stream
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        // fetch sssvideolikes
        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });

        // fetch videolikes
        videolikes = await Videolike.distinct('video', likequery);
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });

        // fetch imagelikes
        imagelikes = await Imagelike.distinct('image', likequery);
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });

        // fetch textlikes
        textlikes = await Textlike.distinct('text', likequery);
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });


        _.each(streams, function (curstream) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text") {
                viewStreamList.push(curstream['id']);
            }
            newStreamList.push(curstream['id']);
        })

        if (pull == "down") {
            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            // let finalSDStreams = [];
            // if (sdStreams != []) {
            //   _.each(sdStreams, function (curstream) {
            //     let streamObject = _.where(streams, { "id": curstream['id'] });
            //     if (streamObject.length < 1)
            //       finalSDStreams.push(curstream);
            //   })
            // }

            if (sdStreams.length > 0) {
                mergeByProperty(streams, sdStreams, 'id');
            }
        }

        let sssVideoStreams = _.where(streams, { 'item_type': 'sssvideo' });
        let sssStreamList = await getSSSVideoStreamDetailForAll(sssVideoStreams, curUser, sssvideolikes);
        let otherStreamList = await getStreamDetailOther(streams, curUser, videolikes, imagelikes, textlikes);
        streamList = sssStreamList.concat(otherStreamList);

        streamList = _.sortBy(streamList, 'publish_at');
        if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8))
            streamList = streamList.reverse();

        //code to update view count of streams
        //Commented below view count increase here as it is was handled in all state api
        //await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 } })


        if (deleteMobileLocalData === 0 && updatetime) {

            let query_inactive = {}; // query for inactive records
            let inactiveQuery = {};

            inactiveQuery["$or"] = [];
            let isActiveFlag = {};
            let isDeletedFlag = {};
            let isHiddenFlag = {};
            isActiveFlag["is_active"] = false;
            isDeletedFlag["is_deleted"] = true;
            isHiddenFlag["is_hidden"] = true;
            inactiveQuery["$or"].push(isActiveFlag);
            inactiveQuery["$or"].push(isDeletedFlag);
            inactiveQuery["$or"].push(isHiddenFlag);


            // query_inactive["is_active"] = false;
            // query_inactive["is_deleted"] = true;
            // query_inactive["is_hidden"] = true;

            inactiveStreamList = await Stream.distinct('_id', inactiveQuery);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });

            // let query_updated = {}; // query for updated records

            query_updated["is_active"] = true;
            query_updated["is_deleted"] = false;
            query_updated["is_hidden"] = false;
            query_updated["available_for_aapki_baithak"] = false;
            query_updated["is_podcast_post"] = false;
            query_updated["publishDate"] = {};

            query_updated["publishDate"]["$lte"] = new Date();

            //query_updated["$or"] = [];
            query_updated["$or"].push(querystate1);
            query_updated["$or"].push(querystate2);

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;


            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;

            const updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage)).sort({ publishDate: -1 });

            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            let finalSDStreams = [];
            if (sdStreams != []) {
                _.each(sdStreams, function (curstream) {
                    let streamObject = _.where(streams, { "id": curstream['id'] });
                    if (streamObject.length < 1)
                        finalSDStreams.push(curstream);
                })
            }

            if (finalSDStreams.length > 0) {
                mergeByProperty(updated_streams, finalSDStreams, 'id');
            }

            let updatedSssVideoStreams = _.where(updated_streams, { 'item_type': 'sssvideo' });
            let updatedSssStreamList = await getSSSVideoStreamDetailForAll(updatedSssVideoStreams, curUser, sssvideolikes);
            let updatedOtherStreamList = await getStreamDetailOther(updated_streams, curUser, videolikes, imagelikes, textlikes);
            updatedStreamList = updatedSssStreamList.concat(updatedOtherStreamList);

            updatedStreamList = _.sortBy(updatedStreamList, 'publish_at');
            updatedStreamList = updatedStreamList.reverse();
        }
        // district post should come after sd post for current date 
        _.each(updatedStreamList, (stream) => {

            if (stream['district'] && curUser.district && stream['district'] == curUser.district) {
                stream['priority'] = 0.5;
            }
            if (stream['block'] && curUser.block && stream['block'] == curUser.block) {
                stream['priority'] = 0.4;
            }
            if (stream['cluster'] && curUser.cluster && stream['cluster'] == curUser.cluster) {
                stream['priority'] = 0.3;
            }
            if (stream['pincode'] && curUser.pincode && stream['pincode'] == curUser.pincode) {
                stream['priority'] = 0.2;
            }
            if (stream['diseCode'] && curUser.diseCode && stream['diseCode'] == curUser.diseCode) {
                stream['priority'] = 0.1;
            }
        });
        _.each(streamList, (stream) => {
            if (stream['district'] && curUser.district && stream['district'] == curUser.district) {
                stream['priority'] = 0.5;
            }
            if (stream['block'] && curUser.block && stream['block'] == curUser.block) {
                stream['priority'] = 0.4;
            }
            if (stream['cluster'] && curUser.cluster && stream['cluster'] == curUser.cluster) {
                stream['priority'] = 0.3;
            }
            if (stream['pincode'] && curUser.pincode && stream['pincode'] == curUser.pincode) {
                stream['priority'] = 0.2;
            }
            if (stream['diseCode'] && curUser.diseCode && stream['diseCode'] == curUser.diseCode) {
                stream['priority'] = 0.1;
            }
        });

        //
        // if (pull == "up") {
        //   let startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
        //   streamList = _.reject(streamList, (num) => {
        //     return (num["stream_type"] == "sssvideo" && new Date(num["publish_at"]).getTime() > startOfDay.getTime());
        //   });
        // }

        if (pull == "up") {
            let startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
            streamList = _.reject(streamList, function (num) {
                return (num.priority == 0 && new Date(num.created_at).getTime() > startOfDay.getTime());
            });
        }

        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        console.log(e)
        defer.reject(e)
    }
    return defer.promise
}
// getMyStateStreams ends



// device_id - 
// userid - 
// pull - up/down
//        up - fetch the older post
//        down - fetch the latest post
// timestamp - 
// social_hours - 
// updatetime - This will come when user do refresh. It will be blank on first call.
// stream_for - mystate/mydistrict/sampark_didi_post
// reqquery - 
async function getAllStreams(device_id, userid, pull, timestamp, social_hours, updatetime, stream_for, apkversion) {
    //Query objects
    let defer = require('q').defer();

    try {
        let query = {};
        let query_updated = {};
        let query_inactive = {};

        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page;

        query["is_active"] = true;
        query_updated["is_active"] = true;
        query_inactive["is_active"] = false;
        query["available_for_aapki_baithak"] = false;
        query_updated["available_for_aapki_baithak"] = false;
        //query_inactive["available_for_aapki_baithak"] = true;

        if (updatetime) {

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;
        } //end of if condition checking for the presence of updatetime

        query["publishDate"] = {};
        query_updated["publishDate"] = {};
        if (pull && pull !== "all") {

            if (pull === "down") {

                //per_page = 0; uncomment it after testing
                query["publishDate"]["$gt"] = timestamp;
            } else if (pull === "up") {

                query["publishDate"]["$lt"] = timestamp;
            } //end of inner if...else condition checking for 'up' or 'down'
        } //end of if condition checking if the request is not for 'all'

        query["publishDate"]["$lte"] = new Date();
        query_updated["publishDate"]["$lte"] = new Date();

        /**
         * Below logic will get user details from database and update social hours if available.
         */
        let curUser = await getUserDetails(userid, social_hours);

        query["$or"] = [];

        if (curUser.length > 0) {

            curUser = curUser[0];

            if (social_hours) {

                await update_social_hours(curUser, social_hours);
            } //end of if condition checking if the social hours are available or not

        } //end of if condition checking for user record availability

        if (stream_for === "mystate") {

            let querystate1 = {}
            let querystate2 = {}
            querystate1["states"] = (curUser && curUser.state) ? curUser && curUser.state.toString() : "nostate"
            //querystate2["is_sampark_didi_post"] = true; // commented by gagan - as discussed with sandeep, only state specific posts will appear
            query["$or"] = [];
            query["$or"].push(querystate1);
            query["$or"].push(querystate2);

            query_updated["$or"] = [];
            query_updated["$or"].push(querystate1);
            query_updated["$or"].push(querystate2);

        } else if (stream_for === "mydistrict") {

            if (curUser && curUser.district) {
                let querydistrict1 = {}
                let querydistrict2 = {}
                querydistrict1["district"] = curUser.district;
                //querydistrict2["is_sampark_didi_post"] = true; // commented by gagan - as discussed with sandeep, only state specific posts will appear
                query["$or"] = [];
                query["$or"].push(querydistrict1);
                query["$or"].push(querydistrict2);

                query_updated["$or"] = [];
                query_updated["$or"].push(querydistrict1);
                query_updated["$or"].push(querydistrict2);
            } else {
                query["state"] = "nostate";
                //query["is_sampark_didi_post"] = true; // commented by gagan - as discussed with sandeep, only state specific posts will appear
                query_updated["state"] = "nostate";
                query_updated["is_sampark_didi_post"] = true;
            } //end of if...else condition checking for the presence of district

        } else if (stream_for === "samparkdidi") {
            query["is_sampark_didi_post"] = true;
            query_updated["is_sampark_didi_post"] = true;
        } //end of 'samparkdidi'

        if (query["$or"].length === 0) {
            delete query["$or"];
        } //end of if condition checking if or conditions are 0

        let streams = [];

        let final_query_update = {}
        if (updatetime) {
            final_query_update["$and"] = []
            for (const [key, value] of Object.entries(query_updated)) {

                let q = {};
                q[key] = value
                final_query_update["$and"].push(q)
            }
        }

        let final_query = {}
        final_query["$and"] = []

        for (const [key, value] of Object.entries(query)) {

            let q = {};
            q[key] = value
            final_query["$and"].push(q)
        }
        let reverse_array = 0;
        let deleteMobileLocalData = 0;
        if (pull === "all") {
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        } else {
            if (per_page > 0) {
                if (pull === "down") {
                    totalstreamcount = await Stream.countDocuments(final_query);
                    if (apkversion >= 4.8) {
                        if (totalstreamcount > per_page) {
                            deleteMobileLocalData = 1;
                            per_page = config.streams_first_page;
                        }
                        streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
                    } else {
                        reverse_array = 1;
                        //send only x records in pull down (ie new records), in the ascending order
                        // streams = await Stream.find(final_query).sort({publishDate: 1}).limit(per_page);
                        if (totalstreamcount > per_page) {
                            deleteMobileLocalData = 1;
                            per_page = config.streams_first_page;
                        }
                        streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                    }
                } else {
                    //send only x records in pull down (ie old records), in the descending order
                    streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
                }
            } else {
                streams = await Stream.find(final_query).sort({ publishDate: -1 });
            }
        }

        //code for finding likes of each type of stream
        let sssvideolikes = {};
        let videolikes = {};
        let imagelikes = {};
        let textlikes = {};

        let likequery = {}
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        videolikes = await Videolike.distinct('video', likequery)
        imagelikes = await Imagelike.distinct('image', likequery);
        textlikes = await Textlike.distinct('text', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });
        let streamList = [];
        let inactiveStreamList = [];
        let updatedStreamList = [];
        let newStreamList = [];
        let viewStreamList = [];

        for (const curstream of streams) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text") {

                viewStreamList.push(curstream['id']);
            }

            newStreamList.push(curstream['id']);

            if (curstream['item_type'] === "sssvideo") {
                let stream = await getSSSVideoStreamDetail(curstream, curUser, sssvideolikes);
                if (stream)
                    streamList.push(stream);
            } else {
                //see here Milap
                let stream = await getStreamDetail(curstream, curUser, videolikes, imagelikes, textlikes);
                if (stream)
                    streamList.push(stream);
            }
        }

        //code to update view count of streams
        await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 } })

        if (deleteMobileLocalData === 0 && updatetime) {
            inactiveStreamList = await Stream.distinct('_id', query_inactive);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });
            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;

            const updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage));

            for (const curstream of updated_streams) {

                if (curstream['item_type'] === "sssvideo") {
                    let stream = await getSSSVideoStreamDetail(curstream, curUser, sssvideolikes);
                    if (stream)
                        updatedStreamList.push(stream);
                } else {
                    let stream = await getStreamDetail(curstream, curUser, videolikes, imagelikes, textlikes);
                    if (stream)
                        updatedStreamList.push(stream);
                }
            }
        }
        let user_streams = {};
        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }
        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        console.log(e)
        defer.reject(e)
    }
    return defer.promise
}

async function getById(id, user) {

    const stream = await Stream.findById(id).select('-hash');
    stream["is_liked"] = "";

    let departmentname = stream["department"];
    let subject = stream["subject"];
    let query = {};
    let queryCat = {};
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

    let streamData = {};
    streamData["stream"] = stream;
    return streamData;
}

async function create(req) {
    // validate
    let streamParam = req.body
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    const streamType = streamParam.stream_type

    let streamDetail = "";
    if (streamType === "video") {
        let videoParam = {};
        videoParam.name = streamParam.name;
        videoParam.author = streamParam.author;
        videoParam.createdBy = current_user;
        videoParam.updatedBy = current_user;
        videoParam.description = streamParam.description;
        videoParam.sort_order = streamParam.sort_order;
        videoParam.youtube_code = streamParam.youtube_code;
        videoParam.is_shareable = streamParam.is_shareable;
        videoParam.duration_min = streamParam.duration_min;
        videoParam.duration_sec = streamParam.duration_sec;
        videoParam.available_for_aapki_baithak = streamParam.available_for_aapki_baithak;
        videoParam.thumbnail = "";
        streamDetail = new Videostream(videoParam);
    } else if (streamType === "image") {
        let imageParam = {};
        imageParam.name = streamParam.name;
        imageParam.author = streamParam.author;
        imageParam.createdBy = current_user;
        imageParam.updatedBy = current_user;
        imageParam.description = streamParam.description;
        imageParam.sort_order = streamParam.sort_order;
        imageParam.is_shareable = streamParam.is_shareable;
        imageParam.thumbnail = "test";
        streamDetail = new Imagestream(imageParam);
    } else if (streamType === "text") {
        let textParam = {};
        textParam.name = streamParam.name;
        textParam.author = streamParam.author;
        textParam.createdBy = current_user;
        textParam.updatedBy = current_user;
        textParam.description = streamParam.description;
        textParam.sort_order = streamParam.sort_order;
        textParam.is_shareable = streamParam.is_shareable;
        streamDetail = new Textstream(textParam);
    }

    let curAuthor = "";
    let curAuthorDistrict = "";
    let curAuthorLocation = "";

    if (streamParam.author != "") {
        curAuthor = await User.find({ "_id": streamParam.author });
        if (curAuthor.length === 1) {
            curAuthor = curAuthor[0];
            curAuthorDistrict = curAuthor.district;
            curAuthorLocation = curAuthor.location;
            let india_ids = Object.keys(config.india_user_ids);
            if (india_ids.indexOf(curAuthor.id.toString()) !== -1) {
                curAuthorLocation = "India"
            }
        }
    }

    let streamData = {};
    if (curAuthorDistrict !== "")
        streamData.district = curAuthorDistrict;
    if (curAuthorLocation !== "")
        streamData.location = curAuthorLocation;

    if (streamParam.author != "") {
        update_user_points(streamParam.author, 50, null, null);
    }
    let fs = require('fs');
    try {
        if (await streamDetail.save()) {
            if (streamType === "image") {
                if (!req.files || Object.keys(req.files).length === 0) {
                    throw "No File Uploaded"
                }

                let thumbnail = req.files.thumbnail;
                let uploadData = await uploadToS3(thumbnail, "stream_uploads/" + streamType);
                streamDetail.thumbnail = uploadData.Key;
                //resize_image(filepath,filepath, streamDetail)
                //streamDetail.width = dimensions.width;
                //streamDetail.height = dimensions.height;
                streamDetail.save();
            }
            if (streamType === "video") {
                if (req.files && Object.keys(req.files).length === 1) {
                    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
                    let thumbnail = req.files.thumbnail;
                    let uploadData = await uploadToS3(thumbnail, "stream_uploads/" + streamType);

                    streamDetail.thumbnail = uploadData.Key;
                    //resize_image(filepath,filepath, streamDetail)
                    //streamDetail.width = dimensions.width;
                    //streamDetail.height = dimensions.height;
                    streamDetail.save();
                }

                streamData.available_for_aapki_baithak = streamParam.available_for_aapki_baithak;
            } else {
                streamData.available_for_aapki_baithak = false;
            }
            streamData.item_type = streamType;
            streamData.publishDate = streamParam.publishDate;
            streamData.user_groups = streamParam.user_groups.split(",");
            streamData.states = streamParam.states.split(",");
            streamData.createdBy = current_user;
            streamData.updatedBy = current_user;
            streamData.item_id = streamDetail.id;
            let sampark_didi_ids = Object.keys(config.sampark_didi_ids);
            if (sampark_didi_ids.indexOf(curAuthor.id.toString()) >= 0) {
                streamData.priority = 0;
                streamData.is_sampark_didi_post = true
            } else {
                streamData.priority = 1;
                streamData.is_sampark_didi_post = false
            }
            streamData.priority = 1;
            const stream = new Stream(streamData);
            await stream.save();
            if (streamType === "video") {
                if (streamParam.userupload != "") {
                    let uservideo = await Uservideo.findById(streamParam.userupload)
                    let uservideoparam = {};
                    uservideoparam['status'] = 'approved';
                    Object.assign(uservideo, uservideoparam);
                    uservideo.save();
                }
                create_notification(stream, streamDetail, 'videoapproved', current_user);
            }
            return { success: true }
        }
    } catch (e) {
        throw e;
    }
}

async function rejectuserupload(req) {
    // validate
    let vid = req.params.id
    let streamParam = req.body
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    let uservideo = await Uservideo.findById(vid)
    uservideoparam = {};
    uservideoparam['status'] = 'rejected';
    Object.assign(uservideo, uservideoparam);
    uservideo.save();
    create_notification(uservideo, uservideo, 'videorejected', current_user);
    return { success: true }
}

async function edit(id) {
    let stream = await Stream.findById(id).select('-hash');
    let streamdetail = {};
    let streamDetail = "";

    if (stream['item_type'] === "video") {
        streamDetail = await Videostream.findById(stream['item_id']);
        streamdetail["fullurl"] = config.repositoryHost + streamDetail['youtube_code'];
        streamdetail["youtube_code"] = streamDetail['youtube_code'];
        streamdetail["duration_min"] = streamDetail['duration_min'];
        streamdetail["duration_sec"] = streamDetail['duration_sec'];
        streamdetail['available_for_aapki_baithak'] = streamDetail['available_for_aapki_baithak'];
    } else if (stream['item_type'] === "image") {
        streamDetail = await Imagestream.findById(stream['item_id']);
        streamdetail["youtube_code"] = "";
    } else if (stream['item_type'] === "text") {
        streamDetail = await Textstream.findById(stream['item_id']);
        streamdetail["youtube_code"] = "";
    } else if (stream['item_type'] === "sssvideo") {
        streamDetail = await Video.findById(stream['item_id']);
        stream["detailed_view"] = true;
    }

    streamdetail['stream_type'] = stream['item_type'];
    streamdetail['id'] = stream['id'];
    streamdetail['stream_id'] = streamDetail['id'];
    streamdetail['is_shareable'] = streamDetail['is_shareable'];
    streamdetail['is_active'] = stream.is_active;
    if (isBase64(streamDetail.description)) {
        let buff = new Buffer(streamDetail['description'], 'base64');
        streamdetail['description'] = decodeURIComponent(buff);
    } else {
        streamdetail['description'] = streamDetail['description'];
    }
    streamdetail['name'] = streamDetail['name'];
    streamdetail['sort_order'] = streamDetail['sort_order'];
    streamdetail['author'] = streamDetail['author'];
    if (stream['item_type'] === "text")
        streamdetail["thumbnail"] = "";
    else
        streamdetail["thumbnail"] = config.repositoryHost + streamDetail['thumbnail'];
    streamdetail["is_liked"] = "";
    streamdetail["user_groups"] = stream.user_groups;
    streamdetail["states"] = stream.states;
    streamdetail["message_title"] = streamDetail['message_title'];
    streamdetail["message_type"] = streamDetail['message_type'];
    streamdetail["message_description"] = streamDetail['message_description'];
    streamdetail["likecount"] = streamDetail['likecount'];
    streamdetail["viewcount"] = 0;
    streamdetail["created_at"] = stream['createdDate'];
    streamdetail["publish_at"] = stream['publishDate'];
    streamdetail["commentcount"] = streamDetail['commentcount'];
    return streamdetail;
}

async function update(id, req) {
    const stream = await Stream.findById(id);
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    let streamParam = req.body;
    let streamdetail = {};

    if (!stream) {
        throw 'Stream does not exists';
    }

    let oldauthor = "";
    let streamDetail = "";
    if (stream['item_type'] === "video") {
        streamDetail = await Videostream.findById(stream['item_id']);
        oldauthor = streamDetail.author
        Object.assign(streamDetail, streamParam);
    } else if (stream['item_type'] === "image") {
        streamDetail = await Imagestream.findById(stream['item_id']);
        oldauthor = streamDetail.author
        Object.assign(streamDetail, streamParam);
    } else if (stream['item_type'] === "text") {
        streamDetail = await Textstream.findById(stream['item_id']);
        oldauthor = streamDetail.author
        Object.assign(streamDetail, streamParam);
    } else {
        throw 'Stream does not exists';
    }

    streamDetail.updatedBy = current_user;
    streamDetail.updatedDate = updatedAt;
    streamDetail.publishDate = streamParam.publishDate;
    if (await streamDetail.save()) {
        let stream_param = {};
        stream_param['user_groups'] = streamParam.user_groups.split(",");
        stream_param['states'] = streamParam.states.split(",");
        stream_param['is_active'] = streamParam.is_active;
        stream_param['updatedBy'] = current_user;
        stream_param['updatedDate'] = updatedAt;
        stream_param['publishDate'] = streamParam.publishDate;
        let curAuthor = "";
        let curAuthorDistrict = "";
        let curAuthorLocation = "";
        if (oldauthor != streamDetail.author) {
            if (streamDetail.author != "") {
                curAuthor = await User.find({ "_id": streamDetail.author });
                if (curAuthor.length === 1) {
                    curAuthor = curAuthor[0];
                    curAuthorDistrict = curAuthor.district;
                    curAuthorLocation = curAuthor.location;
                    let india_ids = Object.keys(config.india_user_ids);
                    if (india_ids.indexOf(curAuthor.id.toString()) !== -1) {
                        curAuthorLocation = "India"
                    }
                }
            }
            if (curAuthorDistrict !== "")
                stream_param['district'] = curAuthorDistrict;
            if (curAuthorLocation !== "")
                stream_param['location'] = curAuthorLocation;

            let sampark_didi_ids = Object.keys(config.sampark_didi_ids);
            if (sampark_didi_ids.indexOf(curAuthor.id.toString()) >= 0) {
                stream_param['priority'] = 0;
                stream_param['is_sampark_didi_post'] = true
            } else {
                stream_param['priority'] = 1;
                stream_param['is_sampark_didi_post'] = false
            }
            stream_param['priority'] = 1;
        }
        if (stream['item_type'] === "video") {
            stream_param['available_for_aapki_baithak'] = streamParam.available_for_aapki_baithak;
        } else {
            stream_param['available_for_aapki_baithak'] = false;
        }
        Object.assign(stream, stream_param);
        await stream.save();

        if (req.files && Object.keys(req.files).length === 1) {
            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            let thumbnail = req.files.thumbnail;
            let uploadData = await uploadToS3(thumbnail, "stream_uploads/" + stream['item_type']);

            streamDetail.thumbnail = uploadData.Key;
            //resize_image(filepath,filepath, streamDetail)                   
            streamDetail.save();
        }
        return { success: true }
    }
}

async function _delete(id) {
    await Stream.findByIdAndRemove(id);
    return { success: true }
}

async function activation(id, req) {
    const stream = await Stream.findById(id);
    let streamParam = req.body;
    let streamdetail = {};

    if (!stream) {
        throw 'Stream does not exists';
    }
    let current_user = get_current_user(req);
    let stream_param = {};
    let updatedAt = new Date();
    stream_param['updatedBy'] = current_user;
    stream_param['updatedDate'] = updatedAt;
    stream_param['is_active'] = (stream.is_active) ? false : true;
    Object.assign(stream, stream_param);
    await stream.save();
    return { success: true }
}

async function getAll(req) {
    let requestParam = req.body;
    let sort = {};
    let query = {};

    let totalstreams = await Stream.find(query).count();
    let filteredstreams = totalstreams;
    let sort_column = (requestParam.sortby) ? requestParam.sortby : 0;
    let sort_order = (requestParam.sortorder && requestParam.sortorder === "1") ? 'asc' : "desc";

    sort["publishDate"] = (sort_order == "asc") ? 1 : -1

    if (sort_column == 1) {
        sort["description"] = (sort_order == "asc") ? 1 : -1
    }

    let columns = [];
    let column = {};
    column.name = "post";
    column.search = requestParam['post'];
    columns.push(column)

    column = {};
    column.name = "streamtype";
    column.search = requestParam['streamtype'];
    columns.push(column)

    column = {};
    column.name = "state";
    column.search = requestParam['state'];
    columns.push(column)

    column = {};
    column.name = "author";
    column.search = requestParam['author'];
    columns.push(column)

    column = {};
    column.name = "creationdate";
    column.search = requestParam['creationdate'];
    columns.push(column)

    column = {};
    column.name = "active";
    column.search = requestParam['active'];
    columns.push(column)

    query["$and"] = [];
    let querysearchand = {};
    let queryinner = {};
    queryinner["$and"] = [];
    let queryinnercheck = 0;

    for (const column of columns) {
        querysearchand = {};
        if (column.name == "post" && column.search) {
            let querypost = {};
            querypost['description'] = new RegExp(column.search, "i");
            queryinner["$and"].push(querypost)
        }
        if (column.name == "streamtype" && column.search && column.search.toLowerCase() != "all") {
            querysearchand['item_type'] = column.search;
            query["$and"].push(querysearchand)
        }
        if (column.name == "state" && column.search && column.search !== "1") {
            querysearchand['states'] = column.search;
            query["$and"].push(querysearchand)
        }
        if (column.name == "author" && column.search) {
            let queryauthoror = {};
            let queryauthor = {};
            queryauthor["$or"] = [];
            queryauthoror['fullName'] = new RegExp(column.search, "i");
            queryauthor["$or"].push(queryauthoror);

            queryauthoror = {};
            queryauthoror['firstName'] = new RegExp(column.search, "i");
            queryauthor["$or"].push(queryauthoror);

            queryauthoror = {};
            queryauthoror['lastName'] = new RegExp(column.search, "i");
            queryauthor["$or"].push(queryauthoror);
            let userids = await User.distinct('_id', queryauthor);

            if (userids.length > 0) {
                let queryinnerauthor = {}
                queryinnerauthor['author'] = {};
                queryinnerauthor['author']["$in"] = userids;
                queryinner["$and"].push(queryinnerauthor)
            } else {
                queryinnercheck = 1;
            }
        }
        if (column.name == "active" && column.search && column.search.toLowerCase() != "all") {
            querysearchand['is_active'] = column.search;
            query["$and"].push(querysearchand)
        }
        if (column.name == "creationdate" && column.search) {

            let searchdaterange = column.search.split("~");
            let searchfromdate = searchdaterange[0].trim();
            let searchtodate = searchdaterange[1].trim();
            let momentObjFrom = moment(searchfromdate, 'MM-DD-YYYY');
            let momentObjTo = moment(searchtodate, 'MM-DD-YYYY');
            querysearchand['createdDate'] = {};
            querysearchand['createdDate']['$gte'] = momentObjFrom.startOf('day').toISOString();
            querysearchand['createdDate']['$lte'] = momentObjTo.endOf('day').toISOString();
            query["$and"].push(querysearchand)
        }
    }

    if (Object.keys(queryinner["$and"]).length > 0 && queryinnercheck == 0) {
        let queryinnerstreams = {}
        queryinnerstreams["$or"] = []
        let imagestreamids = await Imagestream.distinct('_id', queryinner);
        if (imagestreamids.length > 0) {
            let queryimagestreams = {}
            queryimagestreams['item_type'] = "image";
            queryimagestreams['item_id'] = {};
            queryimagestreams['item_id']["$in"] = imagestreamids;
            queryinnerstreams["$or"].push(queryimagestreams);
        }
        let textstreamids = await Textstream.distinct('_id', queryinner);
        if (textstreamids.length > 0) {
            let querytextstreams = {}
            querytextstreams['item_type'] = "text";
            querytextstreams['item_id'] = {};
            querytextstreams['item_id']["$in"] = textstreamids;
            queryinnerstreams["$or"].push(querytextstreams);
        }
        let videostreamids = await Videostream.distinct('_id', queryinner);
        if (videostreamids.length > 0) {
            let queryvideostreams = {}
            queryvideostreams['item_type'] = "video";
            queryvideostreams['item_id'] = {};
            queryvideostreams['item_id']["$in"] = videostreamids;
            queryinnerstreams["$or"].push(queryvideostreams);
        }

        let sssvideostreamids = await Video.distinct('_id', queryinner);
        if (sssvideostreamids.length > 0) {
            let querysssstreams = {}
            querysssstreams['item_type'] = "sssvideo";
            querysssstreams['item_id'] = {};
            querysssstreams['item_id']["$in"] = sssvideostreamids;
            queryinnerstreams["$or"].push(querysssstreams);
        }
        if (queryinnerstreams["$or"].length > 0) {
            query["$and"].push(queryinnerstreams)
        } else {
            queryinnercheck = 1
        }
    }

    if (queryinnercheck === 1) {
        query["$and"].push({ "states": "nostate" })
    }
    if (query["$and"].length === 0) {
        delete query["$and"];
    } else {
        filteredstreams = await Stream.find(query).count();
    }
    let perPage = 100;
    let pageNo = 0;
    let start = 0;
    let end = 0;

    let queryselect = {};
    queryselect['fullName'] = 1;
    queryselect['phone_number'] = 1;
    queryselect['location'] = 1;
    queryselect['pincode'] = 1;
    queryselect['diseCode'] = 1;
    queryselect['registrationDate'] = 1;
    queryselect['otp'] = 1;
    queryselect['usertype'] = 1;
    let users = {};
    if (requestParam.page === "all") {
        pageNo = "all";
        queryselect['_id'] = 0;
        streams = await Stream.find(query).populate('district', 'name');
    } else {
        pageNo = (requestParam.page) ? requestParam.page : 1;
        start = (pageNo - 1) * perPage;
        end = start + perPage;
        if (sort_order == "asc")
            streams = await Stream.find(query).populate('district', 'name').sort(sort).limit(perPage).skip(start);
        else
            streams = await Stream.find(query).populate('district', 'name').sort(sort).limit(perPage).skip(start);
    }
    let streamList = [];

    for (const cstream of streams) {

        let stream = {};
        stream['stream_type'] = cstream['item_type'];
        let streamDetail = "";
        if (cstream['item_type'] === "video") {
            streamDetail = await Videostream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);

        } else if (cstream['item_type'] === "image") {
            streamDetail = await Imagestream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);

        } else if (cstream['item_type'] === "text") {
            streamDetail = await Textstream.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']);

        } else if (cstream['item_type'] === "sssvideo") {
            streamDetail = await Video.findById(cstream['item_id']).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge']).populate('subject', 'name').populate('department', 'name');

        }

        if (streamDetail) {
            if (cstream['district'] && cstream['district']['name']) {
                stream['district'] = cstream['district']['name'];
            }
            if (cstream['item_type'] === "sssvideo") {
                stream['author'] = "Sampark Didi";
            }

            if (streamDetail.author) {
                stream['author'] = (streamDetail.author.fullName) ? titleize(streamDetail.author.fullName) : '';
                stream['location'] = streamDetail.author.location;
            } else {
                stream['author'] = "Sampark Didi";
                stream['location'] = "";
            }
            if (pageNo !== "all") {
                stream['stream_id'] = streamDetail.id;
                stream['id'] = cstream['id'];
                stream['isbase'] = isBase64(streamDetail.description);
                stream['is_active'] = cstream['is_active'];
            } else {
                stream['is_active'] = (cstream['is_active']) ? "yes" : "no";
            }
            stream['name'] = streamDetail.name;
            if (isBase64(streamDetail.description)) {
                let buff = new Buffer(streamDetail.description, 'base64');
                stream['description'] = decodeURIComponent(buff);
            } else {
                stream['description'] = streamDetail.description;
            }

            //  stream["likecount"] = streamDetail['likecount'];
            //  stream["viewcount"] = cstream['viewcount'];
            stream["publish_at"] = cstream['publishDate'];
            stream["created_at"] = cstream['createdDate'];
            //  stream["commentcount"] = streamDetail['commentcount'];

            streamList.push(stream);
        }
    }

    let return_data = {};
    return_data['data'] = streamList;
    return_data['pageNo'] = pageNo;
    return_data['recordsFiltered'] = filteredstreams;
    return_data['recordsTotal'] = totalstreams;
    return_data['start'] = parseInt(start) + 1;
    return_data['end'] = (streamList.length < perPage) ? (parseInt(start) + streamList.length) : end;
    if (filteredstreams % perPage === 0)
        return_data['totalPages'] = parseInt(filteredstreams / perPage);
    else
        return_data['totalPages'] = parseInt(filteredstreams / perPage) + 1;
    if (pageNo === 1) {
        return_data['prevPage'] = 0;
    } else {
        return_data['prevPage'] = parseInt(pageNo) - 1;
    }
    if (parseInt(pageNo) === return_data['totalPages']) {
        return_data['nextPage'] = 0;
    } else {
        return_data['nextPage'] = parseInt(pageNo) + 1;
    }
    return return_data;
}

/*
  This API is used to display bal baithak posts
*/
async function getBalBaithakStreams(req) {

    let apkversion = (!req.query.apk_version) ? 1 : req.query.apk_version;
    let device_id = (!req.query.device_id) ? "" : req.query.device_id;
    let userid = (!req.query.user || req.query.user === "undefined") ? "" : req.query.user;
    let pull = (!req.query.pull) ? "" : req.query.pull;
    let timestamp = (!req.query.timestamp) ? "" : req.query.timestamp;
    let updatetime = (!req.query.updatetime) ? "" : req.query.updatetime;
    let social_hours = (!req.query.social_hours) ? "" : req.query.social_hours;

    let defer = require('q').defer();

    try {

        let query = {}; // main query

        let streams = []; // Stream object initialization
        //let final_query_update = {} // Final updated query object initialization
        let final_query = {} //  Final query object initialization
        let reverse_array = 0; // Initialize reverse_array value to 0
        let deleteMobileLocalData = 0; // Initialize deleteMobileLocalData value to 0
        let sssvideolikes = {}; // Initialize sssvideolikes object
        let videolikes = {}; // Initialize videolikes object
        let imagelikes = {}; // Initialize imagelikes object
        let textlikes = {}; // Initialize textlikes object
        let likequery = {} // Initialize likequery object
        let streamList = []; // Initialize streamList array
        let inactiveStreamList = []; // Initialize inactiveStreamList array
        let updatedStreamList = []; // Initialize updatedStreamList array
        let newStreamList = []; // Initialize newStreamList array
        let viewStreamList = []; // Initialize viewStreamList array
        let user_streams = {}; // Initialize user_streams object

        let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

        // Pass few static where conditions as below for main, updated & inactive query
        query['is_active'] = true;
        query['is_deleted'] = false;
        query['is_hidden'] = false;

        query["available_for_aapki_baithak"] = false;
        query["publishDate"] = {};

        if (pull === "down") {
            // fetch records greater than timestamp
            query["publishDate"]["$gt"] = timestamp;
        } else if (pull === "up") {
            // fetch records greater than timestamp
            query["publishDate"]["$lt"] = timestamp;
        }

        query["publishDate"]["$lte"] = new Date();
        query["postOn"] = { $in: ["Balbaithak", "Both"] };

        // fetch user details based on userid and social_hours
        let curUser = await getUserDetails(userid, social_hours);
        if (curUser.length > 0) {
            curUser = curUser[0];
            if (social_hours) {
                // Update social_hours for user if available
                await update_social_hours(curUser, social_hours);
            }
        }

        let query_updated = {}; // query for updated records    

        query["$or"] = [];
        query_updated["$or"] = [];

        if (curUser && curUser.diseCode) {
            /*let querybaithak = {};
            querybaithak["$and"] = [];
            querybaithak["$and"].push({ "diseCode": curUser.diseCode });
            querybaithak["$and"].push({ "postOn": { $in: ["Balbaithak", "Both"] } });
      
            query["$or"].push(querybaithak);
            query_updated["$or"].push(querybaithak);*/

            query["$or"].push({ "diseCode": curUser.diseCode });
            query_updated["$or"].push({ "diseCode": curUser.diseCode });
        }

        if (curUser && curUser.pincode) {
            query["$or"].push({ "pincode": curUser.pincode });
            query_updated["$or"].push({ "pinCode": curUser.pincode });
        }

        if (curUser && curUser.district) {
            query["$or"].push({ "district": curUser.district });
            query_updated["$or"].push({ "district": curUser.district });
        }

        if (curUser && curUser.cluster) {
            query["$or"].push({ "cluster": curUser.cluster });
            query_updated["$or"].push({ "cluster": curUser.cluster });
        }

        if (curUser && curUser.block) {
            query["$or"].push({ "block": curUser.block });
            query_updated["$or"].push({ "block": curUser.block });
        }

        query["$or"].push({ "is_sampark_didi_post": true });
        query["$or"].push({ "is_podcast_post": true });

        query_updated["$or"].push({ "is_sampark_didi_post": true });
        query_updated["$or"].push({ "is_podcast_post": true });

        if (query["$or"].length === 0) {
            delete query["$or"];
        }

        final_query["$and"] = []

        for (const [key, value] of Object.entries(query)) {
            let q = {};
            q[key] = value
            final_query["$and"].push(q)
        }

        if (per_page > 0) {
            if (pull === "down") {
                totalstreamcount = await Stream.countDocuments(final_query);

                if (totalstreamcount > per_page) {
                    deleteMobileLocalData = 1;
                    per_page = config.streams_first_page;
                }

                if (apkversion < 4.8) {
                    reverse_array = 1;
                    streams = await Stream.find(final_query).sort({ publishDate: 1 }).limit(per_page);
                }
                else
                    streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
            } else
                streams = await Stream.find(final_query).sort({ publishDate: -1 }).limit(per_page);
        } else {
            streams = await Stream.find(final_query).sort({ publishDate: -1 });
        }

        //code for finding likes of each type of stream
        if (userid) {
            likequery["user"] = userid;
        } else {
            likequery["device_id"] = device_id;
        }

        // fetch sssvideolikes
        sssvideolikes = await Sssvideolike.distinct('video', likequery);
        sssvideolikes = sssvideolikes.map(function (item) {
            return item.toString();
        });

        // fetch videolikes
        videolikes = await Videolike.distinct('video', likequery)
        videolikes = videolikes.map(function (item) {
            return item.toString();
        });

        // fetch imagelikes
        imagelikes = await Imagelike.distinct('image', likequery);
        imagelikes = imagelikes.map(function (item) {
            return item.toString();
        });

        // fetch textlikes
        textlikes = await Textlike.distinct('text', likequery);
        textlikes = textlikes.map(function (item) {
            return item.toString();
        });

        _.each(streams, function (curstream) {
            if (curstream['item_type'] === "image" || curstream['item_type'] === "text") {
                viewStreamList.push(curstream['id']);
            }
            newStreamList.push(curstream['id']);
        })

        if (pull == "down") {
            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            if (sdStreams.length > 0) {
                mergeByProperty(streams, sdStreams, 'id');
            }
        }

        let sssVideoStreams = _.where(streams, { 'item_type': 'sssvideo' });
        let sssStreamList = await getSSSVideoStreamDetailForAll(sssVideoStreams, curUser, sssvideolikes);
        let otherStreamList = await getStreamDetailOther(streams, curUser, videolikes, imagelikes, textlikes);
        streamList = sssStreamList.concat(otherStreamList);
        streamList = _.sortBy(streamList, 'publish_at');
        if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8))
            streamList = streamList.reverse();

        //code to update view count of streams
        //Commented below view count increase here as it is was handled in all state api
        //await Stream.updateMany({ "_id": { "$in": viewStreamList } }, { $inc: { viewcount: 1 } })

        if (deleteMobileLocalData === 0 && updatetime) {

            let inactiveQuery = {};

            inactiveQuery["$or"] = [];
            let isActiveFlag = {};
            let isDeletedFlag = {};
            let isHiddenFlag = {};
            isActiveFlag["is_active"] = false;
            isDeletedFlag["is_deleted"] = true;
            isHiddenFlag["is_hidden"] = true;
            inactiveQuery["$or"].push(isActiveFlag);
            inactiveQuery["$or"].push(isDeletedFlag);
            inactiveQuery["$or"].push(isHiddenFlag);

            inactiveStreamList = await Stream.distinct('_id', inactiveQuery);
            inactiveStreamList = inactiveStreamList.map(function (item) {
                return item.toString();
            });

            query_updated["is_active"] = true;
            query_updated["is_deleted"] = false;
            query_updated["is_hidden"] = false;
            query_updated["available_for_aapki_baithak"] = false;
            query_updated["publishDate"] = {};

            query_updated["publishDate"]["$lte"] = new Date();

            query_updated["updatedDate"] = {};
            query_updated["updatedDate"]["$gt"] = updatetime;

            query_updated["postOn"] = { $in: ["Balbaithak", "Both"] };

            query_updated["_id"] = {};
            query_updated["_id"]["$nin"] = newStreamList;

            const updated_streams = await Stream.find(query_updated).limit(parseInt(config.max_no_of_streams_on_mobile_storage)).sort({ publishDate: -1 });

            let sdStreams = [];
            let sdFinalQuery = prepareGetSDDataQuery();
            sdStreams = await Stream.find(sdFinalQuery).sort({ publishDate: -1 });

            let finalSDStreams = [];
            if (sdStreams != []) {
                _.each(sdStreams, function (curstream) {
                    let streamObject = _.where(streams, { "id": curstream['id'] });
                    if (streamObject.length < 1)
                        finalSDStreams.push(curstream);
                })
            }

            if (finalSDStreams.length > 0) {
                mergeByProperty(updated_streams, finalSDStreams, 'id');
            }

            let updatedSssVideoStreams = _.where(updated_streams, { 'item_type': 'sssvideo' });
            let updatedSssStreamList = await getSSSVideoStreamDetailForAll(updatedSssVideoStreams, curUser, sssvideolikes);
            let updatedOtherStreamList = await getStreamDetailOther(updated_streams, curUser, videolikes, imagelikes, textlikes);
            updatedStreamList = updatedSssStreamList.concat(updatedOtherStreamList);

            updatedStreamList = _.sortBy(updatedStreamList, 'publish_at');
            updatedStreamList = updatedStreamList.reverse();
        }

        // disecode matching post should come, after that cluster and then block and then district post should come for current date 
        _.each(updatedStreamList, (stream) => {
            if (stream['district'] && curUser.district && stream['district'] == curUser.district) {
                stream['priority'] = 0.5;
            }
            if (stream['block'] && curUser.block && stream['block'] == curUser.block) {
                stream['priority'] = 0.4;
            }
            if (stream['cluster'] && curUser.cluster && stream['cluster'] == curUser.cluster) {
                stream['priority'] = 0.3;
            }
            if (stream['pincode'] && curUser.pincode && stream['pincode'] == curUser.pincode) {
                stream['priority'] = 0.2;
            }
            if (stream['diseCode'] && curUser.diseCode && stream['diseCode'] == curUser.diseCode) {
                stream['priority'] = 0.1;
            }
        });

        _.each(streamList, (stream) => {
            if (stream['district'] && curUser.district && stream['district'] == curUser.district) {
                stream['priority'] = 0.5;
            }
            if (stream['block'] && curUser.block && stream['block'] == curUser.block) {
                stream['priority'] = 0.4;
            }
            if (stream['cluster'] && curUser.cluster && stream['cluster'] == curUser.cluster) {
                stream['priority'] = 0.3;
            }
            if (stream['pincode'] && curUser.pincode && stream['pincode'] == curUser.pincode) {
                stream['priority'] = 0.2;
            }
            if (stream['diseCode'] && curUser.diseCode && stream['diseCode'] == curUser.diseCode) {
                stream['priority'] = 0.1;
            }
        });

        if (reverse_array === 1) {
            user_streams['streams'] = streamList.reverse();
        } else {
            user_streams['streams'] = streamList;
        }

        user_streams['max_records'] = config.max_no_of_streams_on_mobile_storage;
        user_streams['inactivestreams'] = inactiveStreamList;
        user_streams['updatedstreams'] = updatedStreamList;
        user_streams['delete_mobile_local_data'] = deleteMobileLocalData;

        defer.resolve(user_streams);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}

// This function is added by Milap for showing videos on MyClassroom screen
async function getmyClassroomVideos(userid, pull, timestamp, updatetime, apkversion) {

    let defer = require('q').defer();

    let per_page = (!timestamp) ? config.streams_first_page : config.streams_per_page; // Calculate number of records to be returned

    try {
        var videoQuery = {};
        let videoStreamDetails = "";
        let finalVideoStream = [];
        let newfinal = {};
        let newStreamList = [];
        let reverse_array = 0;

        const teacher = await User.findOne({ "_id": userid, "usertype": "govt teacher" }, { "diseCode": 1 }); // find disecode

        if (teacher) {
            const diseCode = teacher.diseCode;
            let allTeachers = await User.find({ "diseCode": diseCode, "usertype": "govt teacher" }, { "_id": 1 }); // find all teachers for this disecode

            if (allTeachers) {
                videoQuery["author"] = {};
                videoQuery["createdDate"] = {};
                videoQuery["author"]["$in"] = allTeachers;
                videoQuery["available_for_aapki_baithak"] = false;
                if (pull === "down") {
                    // fetch records greater than timestamp
                    videoQuery["createdDate"]["$gt"] = timestamp;
                } else if (pull === "up") {
                    // fetch records greater than timestamp
                    videoQuery["createdDate"]["$lt"] = timestamp;
                }
                videoQuery["createdDate"]["$lte"] = new Date();

                if (per_page > 0) {
                    if (pull === "down") {

                        totalstreamcount = await Videostream.countDocuments(videoQuery);

                        if (totalstreamcount > per_page) {
                            per_page = config.streams_first_page;
                        }

                        if (apkversion < 4.8) {
                            reverse_array = 1;
                            videoStreamDetails = await Videostream.find(videoQuery).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'diseCode']).sort({ createdDate: 1 }).limit(per_page);
                        }
                        else
                            videoStreamDetails = await Videostream.find(videoQuery).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'diseCode']).sort({ createdDate: -1 }).limit(per_page);
                    }
                    else {
                        videoStreamDetails = await Videostream.find(videoQuery).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'diseCode']).sort({ createdDate: -1 }).limit(per_page);
                    }
                } else {
                    videoStreamDetails = await Videostream.find(videoQuery).populate('author', ['fullName', 'is_verified', 'image', 'location', 'badge', 'usertype', 'diseCode']).sort({ createdDate: -1 });
                }

                videoStreamDetails = _.sortBy(videoStreamDetails, 'publish_at');

                _.each(videoStreamDetails, function (curstream) {
                    newStreamList.push(curstream['id']);
                });

                if (pull === "" || pull === "up" || (pull === "down" && apkversion >= 4.8)) {
                    videoStreamDetails = videoStreamDetails.reverse();
                }

                if (pull == "up") {
                    let startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));
                    videoStreamDetails = _.reject(videoStreamDetails, function (num) {
                        return (num.priority == 0 && new Date(num.created_at).getTime() > startOfDay.getTime());
                    });
                }

                if (videoStreamDetails) {
                    var checkLiked = "";

                    for (const streamDetail of videoStreamDetails) {
                        let stream = {};
                        checkLiked = await Videolike.find({ video: streamDetail._id, user: userid });

                        //code to update view count of streams               
                        await Videostream.updateOne({ "_id": streamDetail._id }, { $inc: { viewcount: 1 } });

                        if (checkLiked.length > 0) {
                            stream["is_liked"] = true;
                        }
                        else {
                            stream["is_liked"] = false;
                        }

                        stream['module'] = "baithak";
                        stream['stream_type'] = "video";
                        stream['more_status'] = false;
                        stream['sub_title'] = "";
                        stream["width"] = 0;
                        stream["height"] = 0;

                        if (streamDetail.author != "" && streamDetail.author != null) {
                            if (streamDetail.author && streamDetail.author.fullName) {
                                stream['author'] = titleize(streamDetail.author.fullName);
                                stream['location'] = streamDetail.author.location;
                                stream['author_id'] = streamDetail.author.id;
                            }
                            stream['badge'] = (!streamDetail.author.badge || streamDetail.author.badge === "" || streamDetail.author.badge === "null") ? 0 : streamDetail.author.badge;
                            stream['image'] = (!streamDetail.author.image || streamDetail.author.image === "" || streamDetail.author.image === "null") ? config.user_image : config.repositoryHost + streamDetail.author.image;
                        }
                        stream['stream_id'] = streamDetail.id;
                        stream['id'] = streamDetail.id;
                        stream['is_shareable'] = streamDetail.is_shareable;
                        stream['name'] = streamDetail.name;
                        stream['description'] = streamDetail.description;
                        stream['sort_order'] = streamDetail.sort_order;
                        stream["likecount"] = streamDetail.likecount;
                        stream["viewcount"] = streamDetail.viewcount;
                        stream["created_at"] = streamDetail.createdDate;
                        stream["publish_at"] = streamDetail.createdDate;
                        stream["commentcount"] = streamDetail.commentcount;
                        stream["video_code"] = streamDetail.youtube_code;
                        stream["diseCode"] = streamDetail.author.diseCode;

                        if (streamDetail.thumbnail != "" && streamDetail.thumbnail != null) {
                            stream["thumbnail"] = config.repositoryHost + streamDetail.thumbnail;
                        } else {
                            stream["thumbnail"] = "https://img.youtube.com/vi/" + streamDetail.youtube_code + "/hqdefault.jpg";
                        }
                        finalVideoStream.push(stream);
                    }

                    if (reverse_array === 1) {
                        newfinal['streams'] = finalVideoStream.reverse();
                    } else {
                        newfinal['streams'] = finalVideoStream;
                    }
                    newfinal['msg'] = "Data successfully found";
                }
            }
        }
        else {
            newfinal['streams'] = finalVideoStream;
            newfinal['msg'] = "No Classroom videos found";
        }
        defer.resolve(newfinal);
    } catch (e) {
        defer.reject(e)
    }
    return defer.promise
}
