const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const update_user_points = commonmethods.update_user_points;
const uploadToS3 = commonmethods.uploadToS3;
const resize_image = commonmethods.resize_image;
const get_current_user = commonmethods.get_current_user;
const User = db.User;
const Audio = db.Audio;
const Stream = db.Stream;
const Sssaudiolike = db.Sssaudiolike;
const Qrscan = db.Qrscan;
const Sssaudiocomment = db.Sssaudiocomment;
const Activity = db.Activity;
const Document = db.Document;
const Scertsolution = db.Scertsolution;
const b = "https://sss.samparksmartshala.org/sss/";

var { promisify } = require('util');
var url = require('url');
var http = require('http');
var https = require('https');
var path = require('path');

module.exports = {
    getAll,
    getAllbyDepartmentSubject,
    getById,
    getByQRCode,
    create,
    update,
    edit,
    delete: _delete
};

async function getAll(module) {
    var query = {};
    if (module !== "") {
      query['module'] = module;
    }
    var audio_thumbnails = [];
    audios = await Audio.find(query);
    audios = await Audio.find(query).populate('subject','name').populate('department','name').select('id name thumbnail description subject department author url is_shareable sort_order audio_code module likecount commentcount duration_min duration_sec');

    for(var i = 0; i < audios.length;i++){
      audios[i]["thumbnail"] = config.repositoryHost+audios[i]["thumbnail"];
    }
    return audios;
}

async function getAllbyDepartmentSubject(departmentname, subjectname, user) {
    var query = {};
    var sizeOf = promisify(require('image-size'));
    var queryCat = {};
    var audioids = [];
    if (departmentname !== "") {
      query['department'] = departmentname;
    }
    if (subjectname !== "") {
      query['subject'] = subjectname;
    }
        
    //{"name":{$in:[1,2,3]}}
    //{"id":{"$in":["5d984b5f7d88841ce066910f"]}}

    var audiolikes = {};
    if (user !== "") {
      userlikes = await Sssaudiolike.find({user: user}).select('audio is_liked');
      for(var i = 0; i < userlikes.length; i++){
        audiolikes[userlikes[i]["audio"]] = userlikes[i]["is_liked"];
      }
    }
    var curUser = "";
    if (user !== "") {
      curUser = await User.find({"_id":user});
      if (curUser.length == 1) {
        curUser = curUser[0];
        curUserGroup = curUser.usertype;
        curUserState = curUser.state;
        //query["user_groups"] = curUserGroup;
        //query["states"] = curUserState;
      }
    }
        
    //limit(6).
    //audios = await Audio.find(query).populate('subject','name').populate('department','name').select('-hash');
    audios = await Audio.find(query).populate('subject','name').populate('department','name').select('id name thumbnail description subject department author url is_shareable sort_order audio_code module likecount commentcount social_content duration_min duration_sec').sort({sort_order: 1});
    audioList = [];
    
    var fs = require('fs');
    for(var i = 0; i < audios.length;i++){
      
      audio = {};
      
      audio['id'] = audios[i]['id'];
      audio['is_shareable'] = audios[i]['is_shareable'];
      audio['description'] = audios[i]['description'];
      audio['social_content'] = audios[i]['social_content'];
      audio['author'] = audios[i]['author'];
      audio['name'] = audios[i]['name'];
      audio['subject'] = audios[i]['subject'];
      audio['department'] = audios[i]['department'];
      audio['duration_min'] = audios[i]['duration_min'];
      audio['duration_sec'] = audios[i]['duration_sec'];
      
      var searchMask = "class";
      var regEx = new RegExp(searchMask, "ig");
      var replaceMask = "";

      if (audios[i]['module'] == "ssh") {
        audio['sub_title'] = audios[i]['subject']['name']+" "+audios[i]['department']['name'].replace(regEx, replaceMask);
      } else {
        if (audios[i]['subject']['name'].toLowerCase() == "english") {
          var lesson_string = "Audio";
        } else {
          var lesson_string = "Lesson";
        }
        audio['sub_title'] = audios[i]['subject']['name']+" "+audios[i]['department']['name'].replace(regEx, replaceMask)+" | "+lesson_string+" "+audios[i]['sort_order'];
      }
      audio['audio_code'] = audios[i]['audio_code'];      
      audio['sort_order'] = audios[i]['sort_order']; 
      try {
        if (audios[i]["url"] != "" && audios[i]["url"] != "null" && audios[i]["url"] != null && fs.existsSync(config.uploadPath+"samparkaudios/"+audios[i]["module"]+"/"+audios[i]["url"])) {
          audio["url"] = config.repositoryHost+"samparkaudios/"+audios[i]["module"]+"/"+audios[i]["url"];
        } else {
          audio["url"] = "";
        }
      } catch(err) {
        audio["url"] = "";
      }    
      audio["width"] = "";
      audio["height"] = "";  
      try {
        if (audios[i]["thumbnail"] != "" && audios[i]["thumbnail"] != "null" && audios[i]["thumbnail"] != null && fs.existsSync(config.uploadPath+audios[i]["thumbnail"])) {
          await sizeOf(config.uploadPath+audios[i]["thumbnail"])
          .then(dimensions => { 
            audio["width"] = dimensions.width;
            audio["height"] = dimensions.height; 
          })
          .catch(err => console.error(err));
          audio["thumbnail"] = config.repositoryHost+audios[i]["thumbnail"];
        } else {
          audio["thumbnail"] = "https://img.youtube.com/vi/"+audios[i]["audio_code"]+"/hqdefault.jpg";
        }
        
      } catch(err) {
        audio["thumbnail"] = "https://img.youtube.com/vi/"+audios[i]["audio_code"]+"/hqdefault.jpg";
      }  
            
      if(audiolikes.hasOwnProperty(audios[i]["id"])){
        audio["is_liked"] = (audiolikes[audios[i]["id"]]) ? audiolikes[audios[i]["id"]] : "";
      } else {
        audio["is_liked"] = "";
      }
      
      audio["stream_type"] = "sssaudio";
      audio["stream_id"] =  audios[i]["id"];
      audio["module"] =  audios[i]["module"];
      audio["viewcount"] =  0;
      audio["likecount"] =  audios[i]["likecount"];
      audio["commentcount"] =  audios[i]["commentcount"];
      audioList.push(audio);
    }
    return audioList;
    //return await Audio.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function getById(id, user) {
    audio1 = await Audio.find({"_id": id}).populate('subject','name').populate('department','name').select('-hash');
    
    if (audio1.length != 1) {
      return "";
    }
    audio1 = audio1[0];

    audio = audio1.toObject();
    id = audio["_id"];
    audio["id"] = audio["_id"];
    audio["is_liked"] = "";
    audio["module"] = audio["module"];
    audio["stream_type"] = "sssaudio";
    audio["stream_id"] =  audio["_id"];
    var audioDocuments = {};
    audiolikecount = await Sssaudiolike.find({audio: id}).countDocuments();
    audio["likecount"] = audiolikecount;
    audio["viewcount"] = 0;
    
    audiocommentcount = await Sssaudiocomment.find({audio: id}).countDocuments();
    audio["commentcount"] = audiocommentcount;
    
    var searchMask = "class";
    var regEx = new RegExp(searchMask, "ig");
    var replaceMask = "";

    if (audio1['module'] == "ssh") {
      audio['sub_title'] = audio1['subject']['name']+" "+audio1['department']['name'].replace(regEx, replaceMask);
    } else {
      if (audio1['subject']['name'].toLowerCase() == "english") {
        var lesson_string = "Audio";
      } else {
        var lesson_string = "Lesson";
      }
      audio['sub_title'] = audio1['subject']['name']+" "+audio1['department']['name'].replace(regEx, replaceMask)+" | "+lesson_string+" "+audio1['sort_order'];
    }
      
    var departmentname = audio["department"];
    var subject = audio["subject"];
    var query = {};
    var queryCat = {};
    var queryDocuments = {};
    var queryAudio = {};
    if (departmentname !== "") {
      query['department'] = departmentname;
    }
    if (subject !== "") {
      query['subject'] = subject;
    }
    if (audio.hasOwnProperty("activity") && (audio["activity"].length == 1 && audio["activity"][0] != "") || audio["activity"].length > 1) {
      queryActivities = {};
      queryActivities["_id"] = {};
      queryActivities["_id"]["$in"] = audio["activity"];
      activities = await Activity.find(queryActivities);
      if (activities.length > 0) {
        for (var d=0; d < activities.length; d++) {
          activities[d]['thumbnail'] = config.repositoryHost+activities[d]['thumbnail'];
        }      
        audioDocuments['activities'] = activities;
      } else {
        audio["activity"] = "";
      }
    } else {
      audio["activity"] = "";
    }
    
    if (audio.hasOwnProperty("scert_solution") && (audio["scert_solution"].length == 1 && audio["scert_solution"][0] != "") || audio["scert_solution"].length > 1) {
      queryScert = {};
      queryScert["_id"] = {};
      queryScert["_id"]["$in"] = audio["scert_solution"];
      scert_solutions = await Scertsolution.find(queryScert);
      
      if (scert_solutions.length > 0) {
        audioDocuments['scert_solution'] = {};
        audioDocuments['scert_solution']['name'] = scert_solutions[0]['name'];
        audioDocuments['scert_solution']['doc_url'] = config.repositoryHost+scert_solutions[0]['doc_url'];
      } else {
        audio["scert_solution"] = "";
      }
    } else {
      audio["scert_solution"] = "";
    }
    document_ids = [];
    queryDocuments["_id"] = {};
    if (audio["worksheet"] != "") {
      document_ids.push(audio["worksheet"]);
    }
    if(audio.hasOwnProperty("lesson_plan") && audio["lesson_plan"] != "") {
      document_ids.push(audio["lesson_plan"]);
    } else {
      audio["lesson_plan"] = "";
    }

    if(audio.hasOwnProperty("assessment") && audio["assessment"] != "") {
      document_ids.push(audio["assessment"]);
    } else {
      audio["assessment"] = "";
    }
    
    if(audio.hasOwnProperty("sampark_audio") && audio["sampark_audio"] != "") {
      samparkaudio = await Audio.findById(audio["sampark_audio"]).select('-hash');
      if (samparkaudio["thumbnail"] != "" && samparkaudio["thumbnail"] != "null") {
        samparkaudio["thumbnail"] = config.repositoryHost+samparkaudio["thumbnail"];
      } else {
        samparkaudio["thumbnail"] = "https://img.youtube.com/vi/"+samparkaudio["audio_code"]+"/hqdefault.jpg";
      }
      audioDocuments['sampark_audio'] = samparkaudio;
    } else {
      audio["sampark_audio"] = "";
    }

    if (document_ids.length > 0) {
      queryDocuments["_id"]["$in"] = document_ids;
      documents = await Document.find(queryDocuments);
      for (var d=0; d < documents.length; d++) {
        audioDocuments[documents[d]['doc_type']] = {};
        audioDocuments[documents[d]['doc_type']]['name'] = documents[d]['name'];
        audioDocuments[documents[d]['doc_type']]['doc_url'] = config.repositoryHost+documents[d]['doc_url'];
      }
      if (!audioDocuments.hasOwnProperty("lesson_plan")) {
        audio["lesson_plan"] = "";
      }
      if (!audioDocuments.hasOwnProperty("assessment")) {
        audio["assessment"] = "";
      }
      if (!audioDocuments.hasOwnProperty("worksheet")) {
        audio["worksheet"] = "";
      }
      if (!audioDocuments.hasOwnProperty("scert_solution")) {
        audio["scert_solution"] = "";
      }
      if (!audioDocuments.hasOwnProperty("sampark_audio")) {
        audio["sampark_audio"] = "";
      }
      if (!audioDocuments.hasOwnProperty("activities")) {
        audio["activity"] = "";
      }
    }
    query["_id"] = {};
    query["_id"]["$nin"] = [id];
        
    if (user !== "") {
      userlikes = await Sssaudiolike.find({user: user, audio: id}).select('audio is_liked');
      for(var i = 0; i < userlikes.length;i++){
        audio["is_liked"] = userlikes[i]["is_liked"];
      }
    }

    audio["url"] = config.repositoryHost+audio["url"];
    if (audio["thumbnail"] != "" && audio["thumbnail"] != "null") {
      audio["thumbnail"] = config.repositoryHost+audio["thumbnail"]; //.replace(config.uploadPath, config.repositoryHost);
    } else {
      audio["thumbnail"] = "https://img.youtube.com/vi/"+audio["audio_code"]+"/hqdefault.jpg";
    }
    query["sort_order"] = {};
    query["sort_order"]["$gte"] = audio["sort_order"];
    audioWatchNext = await Audio.find(query).select('id name thumbnail audio_code').sort({sort_order: 1});

    for (var wi=0; wi < audioWatchNext.length; wi++) {
//audioWatchNext[wi].hasOwnProperty("thumbnail") && 
      if (audioWatchNext[wi]["thumbnail"] != "" && audioWatchNext[wi]["thumbnail"] != "null") {
        audioWatchNext[wi]["thumbnail"] = config.repositoryHost+audioWatchNext[wi]["thumbnail"]; //.replace(config.uploadPath, config.repositoryHost);
      } else {
        audioWatchNext[wi]["thumbnail"] = "https://img.youtube.com/vi/"+audioWatchNext[wi]["audio_code"]+"/hqdefault.jpg";
      }
    }    
    var audioData = {};
    audioData["audio"] = audio;
    audioData["documents"] = audioDocuments;
    audioData["watch_next"] = audioWatchNext;
    
    return audioData;
}

async function getByQRCode(qrcode, user) {
    audio1 = await Audio.find({qrcode: qrcode}).populate('subject','name').populate('department','name').select('-hash');
    if (audio1.length != 1) {
      return "";
    }
    audio1 = audio1[0];
    audio = audio1.toObject();
    
    var id = audio["_id"];
    
    if (user != "") {
      update_user_points(user, 10, null, null);
      qrscan = new Qrscan({audio: id, user: user});
      qrscan.save()
    }
    
    audio["id"] = audio["_id"];
    audio["is_liked"] = "";
    audio["module"] = audio["module"];
    audio["stream_type"] = "sssaudio";
    audio["stream_id"] =  audio["_id"];
    var audioDocuments = {};
    audiolikecount = await Sssaudiolike.find({audio: id}).countDocuments();
    audio["likecount"] = audiolikecount;
    audio["viewcount"] = 0;
    
    audiocommentcount = await Sssaudiocomment.find({audio: id}).countDocuments();
    audio["commentcount"] = audiocommentcount;
    
    var searchMask = "class";
    var regEx = new RegExp(searchMask, "ig");
    var replaceMask = "";

    if (audio1['module'] == "ssh") {
      audio['sub_title'] = audio1['subject']['name']+" "+audio1['department']['name'].replace(regEx, replaceMask);
    } else {
      if (audio1['subject']['name'].toLowerCase() == "english") {
        var lesson_string = "Audio";
      } else {
        var lesson_string = "Lesson";
      }
      audio['sub_title'] = audio1['subject']['name']+" "+audio1['department']['name'].replace(regEx, replaceMask)+" | "+lesson_string+" "+audio1['sort_order'];
    }
      
    var departmentname = audio["department"];
    var subject = audio["subject"];
    var query = {};
    var queryCat = {};
    var queryDocuments = {};
    var queryAudio = {};
    if (departmentname !== "") {
      query['department'] = departmentname;
    }
    if (subject !== "") {
      query['subject'] = subject;
    }
    if (audio.hasOwnProperty("activity") && (audio["activity"].length == 1 && audio["activity"][0] != "") || audio["activity"].length > 1) {
      queryActivities = {};
      queryActivities["_id"] = {};
      queryActivities["_id"]["$in"] = audio["activity"];
      activities = await Activity.find(queryActivities);
      if (activities.length > 0) {
        for (var d=0; d < activities.length; d++) {
          activities[d]['thumbnail'] = config.repositoryHost+activities[d]['thumbnail'];
        }      
        audioDocuments['activities'] = activities;
      } else {
        audio["activity"] = "";
      }
    } else {
      audio["activity"] = "";
    }
    
    if (audio.hasOwnProperty("scert_solution") && (audio["scert_solution"].length == 1 && audio["scert_solution"][0] != "") || audio["scert_solution"].length > 1) {
      queryScert = {};
      queryScert["_id"] = {};
      queryScert["_id"]["$in"] = audio["scert_solution"];
      scert_solutions = await Scertsolution.find(queryScert);
      
      if (scert_solutions.length > 0) {
        audioDocuments['scert_solution'] = {};
        audioDocuments['scert_solution']['name'] = scert_solutions[0]['name'];
        audioDocuments['scert_solution']['doc_url'] = config.repositoryHost+scert_solutions[0]['doc_url'];
      } else {
        audio["scert_solution"] = "";
      }
    } else {
      audio["scert_solution"] = "";
    }
    document_ids = [];
    queryDocuments["_id"] = {};
    if (audio["worksheet"] != "") {
      document_ids.push(audio["worksheet"]);
    }
    if(audio.hasOwnProperty("lesson_plan") && audio["lesson_plan"] != "") {
      document_ids.push(audio["lesson_plan"]);
    } else {
      audio["lesson_plan"] = "";
    }

    if(audio.hasOwnProperty("assessment") && audio["assessment"] != "") {
      document_ids.push(audio["assessment"]);
    } else {
      audio["assessment"] = "";
    }
    
    if(audio.hasOwnProperty("sampark_audio") && audio["sampark_audio"] != "") {
      samparkaudio = await Audio.findById(audio["sampark_audio"]).select('-hash');
      if (samparkaudio["thumbnail"] != "" && samparkaudio["thumbnail"] != "null") {
        samparkaudio["thumbnail"] = config.repositoryHost+samparkaudio["thumbnail"];
      } else {
        samparkaudio["thumbnail"] = "https://img.youtube.com/vi/"+samparkaudio["audio_code"]+"/hqdefault.jpg";
      }
      audioDocuments['sampark_audio'] = samparkaudio;
    } else {
      audio["sampark_audio"] = "";
    }

    if (document_ids.length > 0) {
      queryDocuments["_id"]["$in"] = document_ids;
      documents = await Document.find(queryDocuments);
      for (var d=0; d < documents.length; d++) {
        audioDocuments[documents[d]['doc_type']] = {};
        audioDocuments[documents[d]['doc_type']]['name'] = documents[d]['name'];
        audioDocuments[documents[d]['doc_type']]['doc_url'] = config.repositoryHost+documents[d]['doc_url'];
      }
      if (!audioDocuments.hasOwnProperty("lesson_plan")) {
        audio["lesson_plan"] = "";
      }
      if (!audioDocuments.hasOwnProperty("assessment")) {
        audio["assessment"] = "";
      }
      if (!audioDocuments.hasOwnProperty("worksheet")) {
        audio["worksheet"] = "";
      }
      if (!audioDocuments.hasOwnProperty("scert_solution")) {
        audio["scert_solution"] = "";
      }
      if (!audioDocuments.hasOwnProperty("sampark_audio")) {
        audio["sampark_audio"] = "";
      }
      if (!audioDocuments.hasOwnProperty("activities")) {
        audio["activity"] = "";
      }
    }
    query["_id"] = {};
    query["_id"]["$nin"] = [id];
        
    if (user !== "") {
      userlikes = await Sssaudiolike.find({user: user, audio: id}).select('audio is_liked');
      for(var i = 0; i < userlikes.length;i++){
        audio["is_liked"] = userlikes[i]["is_liked"];
      }
    }

    audio["url"] = config.repositoryHost+"samparkaudios/"+audio["module"]+"/"+audio["url"];
    if (audio["thumbnail"] != "" && audio["thumbnail"] != "null") {
      audio["thumbnail"] = config.repositoryHost+audio["thumbnail"]; //.replace(config.uploadPath, config.repositoryHost);
    } else {
      audio["thumbnail"] = "https://img.youtube.com/vi/"+audio["audio_code"]+"/hqdefault.jpg";
    }
    query["sort_order"] = {};
    query["sort_order"]["$gte"] = audio["sort_order"];
    audioWatchNext = await Audio.find(query).select('id name thumbnail audio_code');

    for (var wi=0; wi < audioWatchNext.length; wi++) {
//audioWatchNext[wi].hasOwnProperty("thumbnail") && 
      if (audioWatchNext[wi]["thumbnail"] != "" && audioWatchNext[wi]["thumbnail"] != "null") {
        audioWatchNext[wi]["thumbnail"] = config.repositoryHost+audioWatchNext[wi]["thumbnail"]; //.replace(config.uploadPath, config.repositoryHost);
      } else {
        audioWatchNext[wi]["thumbnail"] = "https://img.youtube.com/vi/"+audioWatchNext[wi]["audio_code"]+"/hqdefault.jpg";
      }
    }    
    var audioData = {};
    audioData["audio"] = audio;
    audioData["documents"] = audioDocuments;
    audioData["watch_next"] = audioWatchNext;
    
    return audioData;
}

async function create(req) {
    // validate
    let audioParam = req.body
    let current_user = get_current_user(req);
    if (await Audio.findOne({ audio_code: audioParam.audio_code })) {
        //throw 'Audio Youtube Code "' + audioParam.audio_code + '" is already taken';
    }

    audioParam.createdBy = current_user;
    audioParam.updatedBy = current_user;
    audioParam.activity = audioParam.activity.split(",");
    if (audioParam.scert_solution) {
      audioParam.scert_solution = audioParam.scert_solution.split(",");
    }
    const audio = new Audio(audioParam);

    // save audio
    if (await audio.save()) {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      }

      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let thumbnail = req.files.thumbnail;     
      let filename = audio.id+path.extname(thumbnail.name);
      let uploadData = await uploadToS3(thumbnail, "audiothumbnails", filename);
      audio.thumbnail = uploadData.Key;
      //resize_image(filepath,filepath,audio)
      await audio.save();
    }
    
    return {success: true}
}

async function edit(id) {
    audio = await Audio.find({"_id": id}).select('-hash');
    
    if (audio.length != 1) {
      return "";
    }
    audio = audio[0];

    var audiodetail = {};    
      
    audiodetail["is_shareable"] = audio.is_shareable;
    audiodetail["name"] = audio.name;
    audiodetail["audio_code"] = audio.audio_code;
    audiodetail["duration_min"] = audio.duration_min;
    audiodetail["duration_sec"] = audio.duration_sec;
    audiodetail["url"] = audio.url;
    audiodetail["author"] = audio.author;
    audiodetail["competency_level"] = audio.competency_level;
    audiodetail["sort_order"] = audio.sort_order;
    audiodetail["thumbnail"] = config.repositoryHost+audio.thumbnail;
    audiodetail["description"] = audio.description;
    audiodetail["social_content"] = audio.social_content;
    audiodetail["concept"] = audio.concept;
    audiodetail["department"] = audio.department;
    audiodetail["subject"] = audio.subject;
    audiodetail["worksheet"] = audio.worksheet;
    audiodetail["assessment"] = audio.assessment;
    audiodetail["lesson_plan"] = audio.lesson_plan;
    audiodetail["activity"] = audio.activity;
    audiodetail["scert_solution"] = audio.scert_solution;
    audiodetail["sampark_audio"] = audio.sampark_audio;
    audiodetail["states"] = audio.states;
    audiodetail["user_groups"] = audio.user_groups;
    audiodetail["createdDate"] = audio.createdDate;
    audiodetail["publish_on_social_stream"] = audio.publish_on_social_stream;
    audiodetail["id"] = audio.id;
    audiodetail["module"] = audio.module;
    audiodetail["qrcode"] = audio.qrcode;
    return audiodetail;
}

async function update(id, req) {
    let audioParam = req.body
    const audio = await Audio.findById(id);
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    // validate
    if (!audio) throw 'Audio not found';
    if (audio.audio_code !== audioParam.audio_code && await Audio.findOne({ audio_code: audioParam.audio_code })) {
        //throw 'Audio "' + audioParam.audio_code + '" is already taken';
    }

    audioParam.updatedDate = updatedAt;
    audioParam.updatedBy = current_user;
    audioParam.activity = audioParam.activity.split(",");
    if (audioParam.scert_solution) {
      audioParam.scert_solution = audioParam.scert_solution.split(",");
    }
    // copy audioParam properties to audio
    Object.assign(audio, audioParam);
    console.log("Object Created")
    if (await audio.save()) {
      console.log("saved")
      if (req.files && Object.keys(req.files).length === 1) {
        console.log("image processing")
        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        let thumbnail = req.files.thumbnail;

        let filename = thumbnail.name+"_"+audio.id+path.extname(thumbnail.name);
        let uploadData = await uploadToS3(thumbnail, "audiothumbnails", filename);
        audio.thumbnail = uploadData.Key;
        await audio.save();
        console.log("final save")
        //resize_image(filepath,filepath,audio)      
      }
    }
    
    return {success: true}
}

async function _delete(id) {
    await Audio.findByIdAndRemove(id);
    await Stream.deleteMany({ item_type: "sssaudio", item_id: id});
    return {success: true}
}
