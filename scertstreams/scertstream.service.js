const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
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
var { promisify } = require('util');
var url = require('url');
var http = require('http');
var https = require('https');
var path = require('path')
var isBase64 = require('is-base64');

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
    delete: _delete
};

async function getVideos() {
        
    scertstreams = await Scertstream.find({item_type: 'video'}).sort({publishDate: -1});
    var desc = "";
    scertstreamList = [];
    for(var i = 0; i < scertstreams.length;i++){
      
      scertstream = {};
      scertstream['stream_type'] = scertstreams[i]['item_type'];    
      scertstream['more_status'] = false;    
      scertstream['sub_title'] = "";    
      
      if (scertstreams[i]['item_type'] == "video") {
        scertstreamDetail = await Videoscertstream.findById(scertstreams[i]['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);
      }
      
      if (scertstreamDetail) {
        if (scertstreamDetail.author != "" && scertstreamDetail.author != null) {
          scertstream['author'] = titleize(scertstreamDetail.author.firstName+" "+scertstreamDetail.author.lastName);
          scertstream['location'] = getLocation(scertstreams[i], scertstreamDetail, curUser);
          scertstream['badge'] = (scertstreamDetail.author.badge == "" || scertstreamDetail.author.badge == "null") ? 0 : scertstreamDetail.author.badge;
          scertstream['image'] = (scertstreamDetail.author.image != ""  && scertstreamDetail.author.image != null ) ? config.repositoryHost+scertstreamDetail.author.image : config.user_image;
        } else {
          scertstream['author'] = "Sampark Didi";
          scertstream['location'] = "";
          scertstream['badge'] = 0;
          scertstream['image'] = config.didi_image;
        }
        scertstream['stream_id'] = scertstreamDetail.id;
        scertstream['id'] = scertstreams[i]['id'];
        scertstream['is_active'] = scertstreams[i]['is_active'];
        scertstream['is_shareable'] = scertstreamDetail.is_shareable;
        scertstream['name'] = scertstreamDetail.name;  
        scertstream['isbase'] = isBase64(scertstreamDetail.description);
        if (isBase64(scertstreamDetail.description)) {
          let buff = new Buffer(scertstreamDetail.description, 'base64');
          scertstream['description'] = decodeURIComponent(buff);
        } else {
          scertstream['description'] = scertstreamDetail.description; 
        }
        if (scertstreamDetail.name == "") {
          scertstream['name'] = scertstream['description']
        }
        scertstream['sort_order'] = scertstreamDetail.sort_order;
          
        scertstream["is_liked"] = "";
        scertstream["likecount"] = scertstreamDetail['likecount'];
        scertstream["viewcount"] = 0;
        scertstream["publish_at"] = scertstreams[i]['publishDate'];
        scertstream["created_at"] = scertstreams[i]['createdDate'];
        scertstream["commentcount"] = scertstreamDetail['commentcount'];
        
        if (scertstreams[i]['item_type'] == "video") {
          scertstream["video_code"] = scertstreamDetail.youtube_code;
          if (scertstreamDetail.thumbnail != "" && scertstreamDetail.thumbnail != null)
            scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.thumbnail;
          else
            scertstream["thumbnail"] = "https://img.youtube.com/vi/"+scertstreamDetail.youtube_code+"/hqdefault.jpg";
        }
        scertstreamList.push(scertstream);
      }
    }
    
    return scertstreamList;
    
    //return await Scertstream.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function getAll(userid,pull,timestamp) {
        
    scertstreams = await Scertstream.find().sort({publishDate: -1});
    var desc = "";
    scertstreamList = [];
    for(var i = 0; i < scertstreams.length;i++){
      
      scertstream = {};
      scertstream['stream_type'] = scertstreams[i]['item_type'];    
      scertstream['more_status'] = false;    
      scertstream['sub_title'] = "";    
      
      if (scertstreams[i]['item_type'] == "audio") {
        scertstreamDetail = await Audioscertstream.findById(scertstreams[i]['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);

      } else if (scertstreams[i]['item_type'] == "video") {
        scertstreamDetail = await Videoscertstream.findById(scertstreams[i]['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);

      } else if (scertstreams[i]['item_type'] == "image") {
        scertstreamDetail = await Imagescertstream.findById(scertstreams[i]['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);
        
      } else if (scertstreams[i]['item_type'] == "text") {
        scertstreamDetail = await Textscertstream.findById(scertstreams[i]['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);
        
      } else if (scertstreams[i]['item_type'] == "pdf") {
        scertstreamDetail = await Pdfscertstream.findById(scertstreams[i]['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);
        
      }
      
      if (scertstreamDetail) {        
        if (scertstreamDetail.author != "" && scertstreamDetail.author != null) {
          scertstream['author'] = titleize(scertstreamDetail.author.firstName+" "+scertstreamDetail.author.lastName);
          scertstream['location'] = getLocation(scertstreams[i], scertstreamDetail, curUser);
          scertstream['badge'] = (scertstreamDetail.author.badge == "" || scertstreamDetail.author.badge == "null") ? 0 : scertstreamDetail.author.badge;
          scertstream['image'] = (scertstreamDetail.author.image != ""  && scertstreamDetail.author.image != null ) ? config.repositoryHost+scertstreamDetail.author.image : config.user_image;
        } else {
          scertstream['author'] = "Sampark Didi";
          scertstream['location'] = "";
          scertstream['badge'] = 0;
          scertstream['image'] = config.didi_image;
        }
        scertstream['stream_id'] = scertstreamDetail.id;
        scertstream['id'] = scertstreams[i]['id'];
        scertstream['is_active'] = scertstreams[i]['is_active'];
        scertstream['is_shareable'] = scertstreamDetail.is_shareable;
        scertstream['name'] = scertstreamDetail.name;  
        scertstream['isbase'] = isBase64(scertstreamDetail.description);
        if (isBase64(scertstreamDetail.description)) {
          let buff = new Buffer(scertstreamDetail.description, 'base64');
          scertstream['description'] = decodeURIComponent(buff);
        } else {
          scertstream['description'] = scertstreamDetail.description; 
        }
   
        scertstream['sort_order'] = scertstreamDetail.sort_order;
          
        scertstream["is_liked"] = "";
        scertstream["likecount"] = scertstreamDetail['likecount'];
        scertstream["viewcount"] = 0;
        scertstream["publish_at"] = scertstreams[i]['publishDate'];
        scertstream["created_at"] = scertstreams[i]['createdDate'];
        scertstream["commentcount"] = scertstreamDetail['commentcount'];
        
        if (scertstreams[i]['item_type'] == "image") {
          scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.thumbnail;
        } else if (scertstreams[i]['item_type'] == "pdf") {
          scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.pdf;
        } else if (scertstreams[i]['item_type'] == "video") {
          scertstream["video_code"] = scertstreamDetail.youtube_code;
          if (scertstreamDetail.thumbnail != "" && scertstreamDetail.thumbnail != null)
            scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.thumbnail;
          else
            scertstream["thumbnail"] = "https://img.youtube.com/vi/"+scertstreamDetail.youtube_code+"/hqdefault.jpg";
        }
        scertstreamList.push(scertstream);
      }
    }
    
    return scertstreamList;
    
    //return await Scertstream.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function search(searchstring,device_id,userid,social_hours,updatetime) {
    let query = {};
    let querysearch = {};
    let queryor = {};
    
    querysearch['fullName'] = new RegExp(searchstring,"i");
    let userids = await User.distinct('_id',querysearch);
    //let userids = [];
//    for(var i = 0; i < usersdata.length; i++){
    
//      userids.push(usersdata[i].id)
//    }
    let querysearchor = {};
    querysearch["$or"] = [];
    if (userids.length > 0) {
      querysearchor['author'] = {};
      querysearchor['author']["$in"] = userids;
      querysearch["$or"].push(querysearchor);
    }
    
    querysearchor = {};
    querysearchor['description'] = new RegExp(searchstring,"i");
    querysearch["$or"].push(querysearchor);
    querysearchor = {};
    querysearchor['name'] = new RegExp(searchstring,"i");
    querysearch["$or"].push(querysearchor);

    queryor = {};
    query["$or"] = [];
    let searches = await Pdfscertstream.find(querysearch).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
      let pdfscertstreams = {};
      let pdfscertstreamids = [];
      let querypdfscertstreams = {}
      querypdfscertstreams['item_type'] = "image";
      for(i=0; i<searches.length; i++) {
        pdfscertstreams[searches[i].id] = searches[i];
        pdfscertstreamids.push(searches[i].id);
      }
      querypdfscertstreams['item_id'] = {};
      querypdfscertstreams['item_id']["$in"] = pdfscertstreamids;
      query["$or"].push(querypdfscertstreams);
    }
    searches = await Imagescertstream.find(querysearch).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
      let imagescertstreams = {};
      let imagescertstreamids = [];
      let queryimagescertstreams = {}
      queryimagescertstreams['item_type'] = "image";
      for(i=0; i<searches.length; i++) {
        imagescertstreams[searches[i].id] = searches[i];
        imagescertstreamids.push(searches[i].id);
      }
      queryimagescertstreams['item_id'] = {};
      queryimagescertstreams['item_id']["$in"] = imagescertstreamids;
      query["$or"].push(queryimagescertstreams);
    }
    searches = await Textscertstream.find(querysearch).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
      let textscertstreams = {};
      let textscertstreamids = [];
      let querytextscertstreams = {}
      querytextscertstreams['item_type'] = "text";
      for(i=0; i<searches.length; i++) {
        textscertstreams[searches[i].id] = searches[i];
        textscertstreamids.push(searches[i].id);
      }
      querytextscertstreams['item_id'] = {};
      querytextscertstreams['item_id']["$in"] = textscertstreamids;
      query["$or"].push(querytextscertstreams);
    }
    searches = await Videoscertstream.find(querysearch).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
    if (searches.length > 0) {
      let videoscertstreams = {};
      let videoscertstreamids = [];
      let queryvideoscertstreams = {}
      queryvideoscertstreams['item_type'] = "video";
      for(i=0; i<searches.length; i++) {
        videoscertstreams[searches[i].id] = searches[i];
        videoscertstreamids.push(searches[i].id);
      }
      queryvideoscertstreams['item_id'] = {};
      queryvideoscertstreams['item_id']["$in"] = videoscertstreamids;
      query["$or"].push(queryvideoscertstreams);
    }
    querysearch["publish_on_social_scertstream"] = true;
    
    let curUser = "";
    let curUserGroup = "";
    let curUserState = "";
    if (userid) {
      curUser = await User.find({"_id":userid}).populate('state',['name']);
      if (curUser.length == 1) {
        curUser = curUser[0];
        
        if (social_hours != "") {
          update_social_hours(curUser, social_hours);
        }
        curUserGroup = curUser.usertype;
        curUserState = curUser.state;
      }
    }
    query["states"] = curUserState.id;
    query["publishDate"] = {};
    query["publishDate"]["$lte"] = new Date();
    query["is_active"] = true;

    let user_scertstreams = {};
    if (query["$or"].length === 0)
    {
      user_scertstreams['scertstreams'] = [];
      user_scertstreams['max_records'] = config.max_no_of_streams_on_mobile_storage;
      return user_scertstreams;
    }
    
    const scertstreams = await Scertstream.find(query);
    
    let videolikes = [];
    let imagelikes = [];
    let textlikes = [];
    let pdflikes = [];

    if (userid) {
      pdflikes = await Scertpdflike.distinct('pdf',{user: userid});
      pdflikes = pdflikes.map(function(item) {
        return item.toString();
      });
      
      videolikes = await Scertvideolike.distinct('video',{user: userid});
      videolikes = videolikes.map(function(item) {
        return item.toString();
      });
      
      imagelikes = await Scertimagelike.distinct('image',{user: userid});
      imagelikes = imagelikes.map(function(item) {
        return item.toString();
      });
      
      textlikes = await Scerttextlike.distinct('text',{user: userid});
      textlikes = textlikes.map(function(item) {
        return item.toString();
      });
    }
    let scertstreamList = [];
          
    for (const curstream of scertstreams) {
      let scertstream = getStreamDetail(curstream, curUser, videolikes, imagelikes, textlikes, pdflikes)
      if (scertstream) 
        scertstreamList.push(scertstream);
    }
       
    user_scertstreams = {};
    user_scertstreams['scertstreams'] = scertstreamList;
    user_scertstreams['max_records'] = config.max_no_of_scertstreams_on_mobile_storage;
    return user_scertstreams;
}

async function getStreamDetail(curScertStream, curUser, videolikes, imagelikes, textlikes, pdflikes) {
  let defer = require('q').defer();
  
  try {
    
      let scertstreamDetail = "";
      if (curScertStream['item_type'] == "video") {
        scertstreamDetail = await Videoscertstream.findById(curScertStream['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);

      } else if (curScertStream['item_type'] == "image") {
        scertstreamDetail = await Imagescertstream.findById(curScertStream['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);
        
      } else if (curScertStream['item_type'] == "text") {
        scertstreamDetail = await Textscertstream.findById(curScertStream['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge', 'usertype']);        
      } else if (curScertStream['item_type'] == "pdf") {
        scertstreamDetail = await Pdfscertstream.findById(curScertStream['item_id']).populate('author',['firstName','lastName', 'is_verified', 'image', 'location', 'badge']);
      }

      if (scertstreamDetail) {
        let scertstream = {};
        scertstream['module'] = "scert"
        if (curScertStream['item_type'] == "video") {
          if(videolikes.indexOf(curScertStream["item_id"]) > -1){
            scertstream["is_liked"] = "true";
          } else {
            scertstream["is_liked"] = "";
          }

        } else if (curScertStream['item_type'] == "image") {
          if(imagelikes.indexOf(curScertStream["item_id"]) > -1){
            scertstream["is_liked"] = "true";
          } else {
            scertstream["is_liked"] = "";
          }
          
        } else if (curScertStream['item_type'] == "text") {
          if(textlikes.indexOf(curScertStream["item_id"]) > -1){
            scertstream["is_liked"] = "true";
          } else {
            scertstream["is_liked"] = "";
          }

        } else if (curScertStream['item_type'] == "pdf") {
          if(pdflikes.indexOf(curScertStream["item_id"]) > -1){
            scertstream["is_liked"] = "true"
          } else {
            scertstream["is_liked"] = "";
          }
          
        }
        
        scertstream['stream_type'] = curScertStream['item_type'];    
        scertstream['priority'] = curScertStream['priority'];    
        scertstream['more_status'] = false;    
        scertstream['sub_title'] = "";  
        scertstream["width"] = 0;
        scertstream["height"] = 0;   
        
        if (scertstreamDetail.author != "" && scertstreamDetail.author != null) {
          if (scertstreamDetail.author && scertstreamDetail.author.firstName) {

            scertstream['author'] = (scertstreamDetail.author.lastName) ? titleize(scertstreamDetail.author.firstName+" "+scertstreamDetail.author.lastName) : titleize(scertstreamDetail.author.firstName);

          } else {
            scertstream['author'] = "Sampark Didi";
          }
          
          scertstream['location'] = getLocation(curScertStream, scertstreamDetail, curUser);
          scertstream['badge'] = (!scertstreamDetail.author.badge || scertstreamDetail.author.badge == "" || scertstreamDetail.author.badge == "null") ? 0 : scertstreamDetail.author.badge;
          if (scertstream['author'] == "Sampark Didi")
            scertstream['image'] = config.didi_image;
          else if (scertstream['author'] == "Sampark Radio")
            scertstream['image'] = config.radio_image;
          else
            scertstream['image'] = (!scertstreamDetail.author.image || scertstreamDetail.author.image == ""  || scertstreamDetail.author.image == "null" ) ? config.user_image : config.repositoryHost+scertstreamDetail.author.image;
          
        } else {
          scertstream['author'] = "Sampark Didi";
          scertstream['location'] = getLocation(curScertStream, scertstreamDetail, curUser);
          scertstream['badge'] = 0;
          scertstream['image'] = config.didi_image;
        }
        scertstream['stream_id'] = scertstreamDetail.id;
        scertstream['id'] = curScertStream['id'];
        scertstream['is_shareable'] = scertstreamDetail.is_shareable;
        scertstream['name'] = scertstreamDetail.name;  
        scertstream['description'] = scertstreamDetail.description;  
        scertstream['sort_order'] = scertstreamDetail.sort_order;
          
        scertstream["likecount"] = scertstreamDetail['likecount'];
        scertstream["viewcount"] = curScertStream['viewcount'];
        scertstream["created_at"] = curScertStream['publishDate'];
        scertstream["publish_at"] = curScertStream['publishDate'];
        scertstream["commentcount"] = scertstreamDetail['commentcount'];
        
        if (curScertStream['item_type'] == "image") {
          if (scertstreamDetail.width > 0 && scertstreamDetail.height > 0) {
            scertstream["width"] = scertstreamDetail.width;
            scertstream["height"] = scertstreamDetail.height;
          } else {
            let dimensions = await getDimension(config.repositoryHost+scertstreamDetail.thumbnail)
            scertstream["width"] = dimensions['width'];
            scertstream["height"] = dimensions['height']; 
          }
          scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.thumbnail;
        } else if (curScertStream['item_type'] == "pdf") {
          scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.pdf;
        } else if (curScertStream['item_type'] != "text") {
          scertstream["video_code"] = scertstreamDetail.youtube_code;
          if (scertstreamDetail.width > 0 && scertstreamDetail.height > 0) {
            scertstream["width"] = scertstreamDetail.width;
            scertstream["height"] = scertstreamDetail.height;
            scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.thumbnail;
          } else {
            if (scertstreamDetail.thumbnail != "" && scertstreamDetail.thumbnail != null) {
              let dimensions = await getDimension(config.repositoryHost+scertstreamDetail.thumbnail)
              scertstream["width"] = dimensions['width'];
              scertstream["height"] = dimensions['height']; 
              scertstream["thumbnail"] = config.repositoryHost+scertstreamDetail.thumbnail;
            } else {
              scertstream["width"] = 0;
              scertstream["height"] = 0; 
              scertstream["thumbnail"] = "https://img.youtube.com/vi/"+scertstreamDetail.youtube_code+"/hqdefault.jpg";
            }
          }
        }
        defer.resolve(scertstream)
      } else {
        defer.resolve("")
      }
  } catch (e) {
    defer.resolve("")
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

async function getAllScertstreams(device_id,userid,pull,timestamp,social_hours,updatetime) {
  let defer = require('q').defer();
  
  try {
    let query = {};
    let query_updated = {};
    let query_inactive = {};
    let per_page = config.streams_per_page;
    if (timestamp === "")
      per_page = config.streams_first_page;

    query["is_active"] = true;
    query_updated["is_active"] = true;
    query_inactive["is_active"] = false;
    
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
      
    let curUser = "";
    let curUserGroup = "";
    let curUserState = "";
    if (userid) {
      curUser = await User.find({"_id":userid}).populate('state',['name']);
      if (curUser.length == 1) {
        curUser = curUser[0];
        
        if (social_hours != "") {
          update_social_hours(curUser, social_hours);
        }
        curUserGroup = curUser.usertype;
        curUserState = curUser.state;
      }
    } else {
      user_scertstreams = {};
      user_scertstreams['scertstreams'] = [];
      user_scertstreams['max_records'] = config.max_no_of_scertstreams_on_mobile_storage;
      user_scertstreams['inactivescertstreams'] = [];
      user_scertstreams['updatedscertstreams'] = [];
      return user_scertstreams;
    }
    query["states"] = curUserState.id;
    query_updated["states"] = curUserState.id;

    let scertstreams = "";
    let inactiveScertstreamList = await Scertstream.distinct('_id',query_inactive);
    inactiveScertstreamList = inactiveScertstreamList.map(function(item) {
      return item.toString();
    });
    if (pull == "all") {
      scertstreams = await Scertstream.find(query).sort({publishDate: -1});
    } else {
      if (per_page > 0) {
        scertstreams = await Scertstream.find(query).sort({publishDate: -1}).limit(per_page);
      } else {
        scertstreams = await Scertstream.find(query).sort({publishDate: -1});
      }
    }
    let videolikes = [];
    let imagelikes = [];
    let textlikes = [];
    let pdflikes = [];

    if (userid) {
      pdflikes = await Scertpdflike.distinct('pdf',{user: userid});
      pdflikes = pdflikes.map(function(item) {
        return item.toString();
      });
      
      videolikes = await Scertvideolike.distinct('video',{user: userid});
      videolikes = videolikes.map(function(item) {
        return item.toString();
      });
      
      imagelikes = await Scertimagelike.distinct('image',{user: userid});
      imagelikes = imagelikes.map(function(item) {
        return item.toString();
      });
      
      textlikes = await Scerttextlike.distinct('text',{user: userid});
      textlikes = textlikes.map(function(item) {
        return item.toString();
      });
    }
    scertstreamList = [];
    updatedScertstreamList = [];
    newScertstreamList = [];

    var sizeOf = promisify(require('image-size'));
    
    for(const curScertStream of scertstreams) {
      newScertstreamList.push(curScertStream['id']);
      
      let scertstream = await getStreamDetail(curScertStream, curUser, videolikes, imagelikes, textlikes, pdflikes);

//      if (scertstream)
        scertstreamList.push(scertstream);
    }

    await Scertstream.updateMany({"_id":{"$in":newScertstreamList}},{ $inc: { viewcount: 1}})
    
    query_updated["_id"] = {};
    query_updated["_id"]["$nin"] = newScertstreamList;
    const updated_scertstreams = await Scertstream.find(query_updated);
    
    for (const curScertStream of updated_scertstreams) {
      let scertstream = await getStreamDetail(curScertStream, curUser, videolikes, imagelikes, textlikes, pdflikes);
      if (scertstream)
        updatedScertstreamList.push(scertstream);
    }
    
    user_scertstreams = {};
    user_scertstreams['scertstreams'] = scertstreamList;
    user_scertstreams['max_records'] = config.max_no_of_scertstreams_on_mobile_storage;
    user_scertstreams['inactivescertstreams'] = inactiveScertstreamList;
    user_scertstreams['updatedscertstreams'] = updatedScertstreamList;
    
    defer.resolve(user_scertstreams);
  } catch (e) {
    console.log(e)
    defer.reject(e)
  }
  return defer.promise
}

function titleize(name) {
  return name.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
}

function getLocation(stream, streamDetail, curUser) {  
  return (streamDetail.author !== undefined) ? streamDetail.author.location.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ') : "India";
  
  author = streamDetail.author.id;
  location = stream.location;
  return location;
  india_ids = Object.keys(config.india_user_ids);
  if (author !== "" && author !== undefined && author.id !== undefined && india_ids.indexOf(author.id.toString()) !== -1) {
    return "India";
  } else {
    return location;
  }
  
  if (!usertype || (usertype && usertype == "admin")) {
    if (curUser == "") {
      return location || "India";
    } else {
      if (curUser && curUser.state && curUser.state != "" && curUser.state != "null") {
        for(var i=0; i < config.states.length; i++){
          if (config.states[i]["name"].toLowerCase() == curUser.state.name.toLowerCase()) {
            return config.states[i]["capital"]+", "+config.states[i]["name"];
          }
        }
      }
      return "India" //need a logic to send capital and state of current user
    }
  } else {
    return location;
  }
}

async function getById(id, user) {
    
    scertstream = await Scertstream.findById(id).select('-hash');
    scertstream["is_liked"] = "";
    
    var departmentname = scertstream["department"];
    var subject = scertstream["subject"];
    var query = {};
    var queryCat = {};
    var queryScertstream = {};
    if (departmentname !== "") {
      query['department'] = departmentname;
    }
    if (subject !== "") {
      query['subject'] = subject;
    }
    
    queryScertstream['scertstream'] = scertstream;
    
    query["_id"] = {};
    query["_id"]["$nin"] = [id];
    
    if (user !== "") {
      userlikes = await Scertstreamlike.find({user: user, scertstream: id}).select('scertstream is_liked');
      for(var i = 0; i < userlikes.length;i++){
        scertstream["is_liked"] = userlikes[i]["is_liked"];
      }
    }
    scertstream["youtube_code"] = config.repositoryHost+scertstream["youtube_code"];
    scertstream["thumbnail"] = config.repositoryHost+scertstream["thumbnail"];
    scertstream["thumbnail"] = "https://img.youtube.com/vi/"+scertstream["scertstream_code"]+"/hqdefault.jpg"; //to be remove
    
    var scertstreamData = {};
    scertstreamData["scertstream"] = scertstream;
    return scertstreamData;
}

async function create(req) {
    // validate
    scertstreamParam = req.body
    var current_user = get_current_user(req);
    var updatedAt = new Date();
    const scertstreamType = scertstreamParam.scertstream_type
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
            throw "No File Uploaded"
          }

          let pdf = req.files.thumbnail;
          let filename = scertstreamDetail.id+path.extname(pdf.name);
          let uploadData = await uploadToS3(pdf, "scertstream_uploads/"+scertstreamType, filename);
          scertstreamDetail.pdf = uploadData.Key;
          scertstreamDetail.save();
        }
        if (scertstreamType == "image") {
          if (!req.files || Object.keys(req.files).length === 0) {
            throw "No File Uploaded"
          }

          let thumbnail = req.files.thumbnail;
          let filename = scertstreamDetail.id+path.extname(thumbnail.name);
          let uploadData = await uploadToS3(thumbnail, "scertstream_uploads/"+scertstreamType, filename);
          scertstreamDetail.pdf = uploadData.Key;
          //resize_image(filepath,filepath, scertstreamDetail)
          scertstreamDetail.save();
        }
        if (scertstreamType == "video") {
          if (req.files && Object.keys(req.files).length === 1) {
            // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
            let thumbnail = req.files.thumbnail;
            let filename = scertstreamDetail.id+path.extname(thumbnail.name);
            let uploadData = await uploadToS3(thumbnail, "scertstream_uploads/"+scertstreamType, filename);
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
          create_notification(scertstream, scertstreamDetail, 'videoapproved', current_user);
        }
        return {success: true}
      }
    } catch (e) {
      throw e;
    }
}

async function edit(id) {
    scertstream = await Scertstream.findById(id).select('-hash');
    var scertstreamdetail = {};    
    
    if (scertstream['item_type'] == "audio") {
      scertstreamDetail = await Audioscertstream.findById(scertstream['item_id']);
      scertstreamdetail["fullurl"] = config.repositoryHost+scertstreamDetail['youtube_code'];
      scertstreamdetail["youtube_code"] = scertstreamDetail['youtube_code'];
    } else if (scertstream['item_type'] == "video") {
      scertstreamDetail = await Videoscertstream.findById(scertstream['item_id']);
      scertstreamdetail["fullurl"] = config.repositoryHost+scertstreamDetail['youtube_code'];
      scertstreamdetail["youtube_code"] = scertstreamDetail['youtube_code'];
    } else if (scertstream['item_type'] == "image") {
      scertstreamDetail = await Imagescertstream.findById(scertstream['item_id']);
      scertstreamdetail["youtube_code"] = "";
    } else if (scertstream['item_type'] == "text") {
      scertstreamDetail = await Textscertstream.findById(scertstream['item_id']);
      scertstreamdetail["youtube_code"] = "";
    } else if (scertstream['item_type'] == "pdf") {
      scertstreamDetail = await Pdfscertstream.findById(scertstream['item_id']);
      scertstream["detailed_view"] = true;
    }
    
    scertstreamdetail['stream_type'] = scertstream['item_type'];    
    scertstreamdetail['id'] = scertstream['id'];
    scertstreamdetail['stream_id'] = scertstreamDetail['id'];
    scertstreamdetail['is_shareable'] = scertstreamDetail['is_shareable'];
    scertstreamdetail['is_active'] = scertstream.is_active;
    if (isBase64(scertstreamDetail.description)) {
      let buff = new Buffer(scertstreamDetail['description'], 'base64');
      scertstreamdetail['description'] = decodeURIComponent(buff);
    } else {
      scertstreamdetail['description'] = scertstreamDetail['description']; 
    }
    scertstreamdetail['name'] = scertstreamDetail['name'];  
    scertstreamdetail['sort_order'] = scertstreamDetail['sort_order'];      
    scertstreamdetail['author'] = scertstreamDetail['author'];
    if (scertstream['item_type'] == "pdf")
      scertstreamdetail["pdf"] = config.repositoryHost+scertstreamDetail['pdf'];
    else
      scertstreamdetail["pdf"] = "";
      
    if (scertstream['item_type'] == "text" || scertstream['item_type'] == "pdf")
      scertstreamdetail["thumbnail"] = "";
    else
      scertstreamdetail["thumbnail"] = config.repositoryHost+scertstreamDetail['thumbnail'];
    scertstreamdetail["is_liked"] = "";
    scertstreamdetail["user_groups"] = scertstream.user_groups;
    scertstreamdetail["states"] = scertstream.states;
    scertstreamdetail["likecount"] = scertstreamDetail['likecount'];
    scertstreamdetail["viewcount"] = 0;
    scertstreamdetail["created_at"] = scertstream['createdDate'];
    scertstreamdetail["publish_at"] = scertstream['publishDate'];
    scertstreamdetail["commentcount"] = scertstreamDetail['commentcount'];
    return scertstreamdetail;
}

async function update(id, req) {
    const scertstream = await Scertstream.findById(id);
    var current_user = get_current_user(req);
    var updatedAt = new Date();
    scertstreamParam = req.body;
    var scertstreamdetail = {};    
    
    if (!scertstream) {
        throw 'Scertstream does not exists';
    }
    if (scertstream['item_type'] == "audio") {
      scertstreamDetail = await Audioscertstream.findById(scertstream['item_id']);
      Object.assign(scertstreamDetail, scertstreamParam);
    } else if (scertstream['item_type'] == "video") {
      scertstreamDetail = await Videoscertstream.findById(scertstream['item_id']);
      Object.assign(scertstreamDetail, scertstreamParam);
    } else if (scertstream['item_type'] == "image") {
      scertstreamDetail = await Imagescertstream.findById(scertstream['item_id']);
      Object.assign(scertstreamDetail, scertstreamParam);
    } else if (scertstream['item_type'] == "text") {
      scertstreamDetail = await Textscertstream.findById(scertstream['item_id']);
      Object.assign(scertstreamDetail, scertstreamParam);
    } else if (scertstream['item_type'] == "pdf") {
      scertstreamDetail = await Pdfscertstream.findById(scertstream['item_id']);
      Object.assign(scertstreamDetail, scertstreamParam);
    } else {
      throw 'Scertstream does not exists';
    }
    
    scertstreamDetail.updatedBy = current_user;
    scertstreamDetail.updatedDate = updatedAt;
    scertstreamDetail.publishDate = scertstreamParam.publishDate;
    if (await scertstreamDetail.save()) {
      
      scertstream_param = {};
      scertstream_param['user_groups'] = scertstreamParam.user_groups.split(",");
      scertstream_param['states'] = scertstreamParam.states.split(",");
      scertstream_param['is_active'] = scertstreamParam.is_active;
      scertstream_param['updatedBy'] = current_user;
      scertstream_param['updatedDate'] = updatedAt;
      Object.assign(scertstream, scertstream_param);
      await scertstream.save();

      if (req.files && Object.keys(req.files).length === 1) {
        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        if (scertstream['item_type'] == "pdf") {
          let pdf = req.files.thumbnail;
          let filename = pdf.name+"_"+scertstreamDetail.id+path.extname(pdf.name);
          let uploadData = await uploadToS3(pdf, "scertstream_uploads/"+scertstream['item_type'],filename);
          scertstreamDetail.pdf = uploadData.Key;
          scertstreamDetail.save();
        } else {
          let thumbnail = req.files.thumbnail;
          let filename = thumbnail.name+"_"+scertstreamDetail.id+path.extname(thumbnail.name);
          let uploadData = await uploadToS3(thumbnail, "scertstream_uploads/"+scertstream['item_type'],filename);
          scertstreamDetail.thumbnail = uploadData.Key;
          //resize_image(filepath,filepath, scertstreamDetail)                   
          scertstreamDetail.save();
        }
      }
      return {success: true} 
    }
}

async function _delete(id) {
  await Scertstream.findByIdAndRemove(id);
  return {success: true}
}

async function activation(id, req) {
    const scertstream = await Scertstream.findById(id);
    scertstreamParam = req.body;
    var scertstreamdetail = {};
    
    if (!scertstream) {
        throw 'Scertstream does not exists';
    }
    var current_user = get_current_user(req);
    scertstream_param = {};
    var updatedAt = new Date();
    scertstream_param['updatedBy'] = current_user;
    scertstream_param['updatedDate'] = updatedAt;
    scertstream_param['is_active'] = (scertstream.is_active) ? false : true;
    Object.assign(scertstream, scertstream_param);
    await scertstream.save();
    return {success: true}
}
