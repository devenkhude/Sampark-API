const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const resize_image = commonmethods.resize_image;
const calculate_lesson_progress = commonmethods.calculate_lesson_progress;
const User = db.User;
const Stream = db.Stream;
const Video = db.Video;
const State = db.State;
const Audio = db.Audio;
const Lessonprogress = db.Lessonprogress;
const Videostream = db.Videostream;
const Imagestream = db.Imagestream;
const Textstream = db.Textstream;
const Uservideo = db.Uservideo;
const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;
const Videoplayed = db.Videoplayed;
const Audioplayed = db.Audioplayed;
const Sssvideoplayed = db.Sssvideoplayed;
const Sssvideoviewed = db.Sssvideoviewed;
const Audioviewed = db.Audioviewed;
const Videoviewed = db.Videoviewed;
const Documentviewed = db.Documentviewed;
const Kitviewed = db.Kitviewed;
const Scertsolutionviewed = db.Scertsolutionviewed;
const Certificate = db.Certificate;
const Statecertificate = db.Statecertificate;
const District = db.District;
const Lesson = db.Lesson;
var { promisify } = require('util');
var url = require('url');
var http = require('http');
var https = require('https');
var path = require('path')
var isBase64 = require('is-base64');

module.exports = {
    streamstates,
    streampriority,
    updateuserlocations,
    updatelessonprogress,
    updateuserprogress,
    currentlessonorder,
    updatedistrictstates,
    certificatehours,
    streamcontent,
    imagedimensions,
    videodurations,
    updateviewcounts,
    testfirebase,
    lessonnos,
    badges
};

async function testfirebase(req) {
if (req.query.type && req.query.type == "user") {
const users = await User.find({"is_new":false}).select('usertype')
return users
}
if (req.query.type && req.query.type == "post") {
const posts = await Stream.find({"is_active":true}).select('item_type item_id')
return posts
}

return "blank"  
    var admin = require("firebase-admin");
    if (req.query.phone) {
      const users = await User.find({"phone_number":req.query.phone});
      var user = users[0];
    } else {
      var id = "5e130bba1e6e9053ee824b12";
      var user = await User.findById(id);
    }
    var serviceAccount = require("../sampark-2cb4e-firebase-adminsdk-bfxop-67d0adbf87.json");
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://sampark-2cb4e.firebaseio.com"
      });
    }
    var payload = {
      notification: {
        title: "Account Deposit",
        body: "A deposit to your savings account has just cleared."
      },
      data: {
        user: user.id,
        usertype: user.usertype
      }
    };
    var options = {
      priority: "high",
      timeToLive: 60 * 60 *24
    };
    
    await admin.messaging().sendToDevice(user.fcm_token,payload, options)
    .then(function(response) {
      return {success: true, message: response, user_phone: user.phone_number, fcmtoken: user.fcm_token}
    })
    .catch(function(error) {
      return {success: false, error: error, user_phone: user.phone_number, fcmtoken: user.fcm_token}
    });
    return {success: true, user_phone: user.phone_number, fcmtoken: user.fcm_token}
}

async function updatelessonprogress() {

    users = await Lessonprogress.distinct('user')
    lesson_progresses = await Lessonprogress.distinct('lesson')
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    var wrong_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      lesson = await Lesson.findById(lesson_progress)
      if (lesson === null) {
        wrong_lessons.push(lesson_progress)
      }
    }
    if (wrong_lessons.length > 0) {
      await Lessonprogress.deleteMany({"lesson":{"$in":wrong_lessons}})
    }
    
    lesson_progresses = await Lessonprogress.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.lesson
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Lessonprogress.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Lessonprogress.index({"user":1, "lesson":1},{"unique":1})
    }
    //delete repeated lesson progress
            
    //delete repeated audio viewed
    lesson_progresses = await Audioviewed.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.audio
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Audioviewed.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Audioviewed.index({"user":1, "audio":1},{"unique":1})
    }
    //delete repeated audio viewed
    
    //delete repeated video viewed
    lesson_progresses = await Videoviewed.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.video
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Videoviewed.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Videoviewed.index({"user":1, "video":1},{"unique":1})
    }
    //delete repeated video viewed
    
    //delete repeated sss video viewed
    lesson_progresses = await Sssvideoviewed.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.video
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Sssvideoviewed.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Sssvideoviewed.index({"user":1, "video":1},{"unique":1})
    }
    //delete repeated sss video viewed
    
    //delete repeated document viewed
    lesson_progresses = await Documentviewed.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.document
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Documentviewed.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Documentviewed.index({"user":1, "document":1},{"unique":1})
    }
    //delete repeated document viewed
    
    //delete repeated kit viewed
    lesson_progresses = await Kitviewed.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.kit
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Kitviewed.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Kitviewed.index({"user":1, "kit":1},{"unique":1})
    }
    //delete repeated kit viewed
    
    //delete repeated scertsolution viewed
    lesson_progresses = await Scertsolutionviewed.find()
    var keep_user_lessons = {}
    var delete_user_lessons = [];
    for (const lesson_progress of lesson_progresses) {
      var key = lesson_progress.user+"_"+lesson_progress.scertsolution
      if (keep_user_lessons[key] !== undefined) { //key already exists
        delete_user_lessons.push(lesson_progress.id)
      } else {
        keep_user_lessons[key] = 1;
      }
    }
    if (delete_user_lessons.length > 0) {
      await Scertsolutionviewed.deleteMany({"_id":{"$in":delete_user_lessons}})
      //await Scertsolutionviewed.index({"user":1, "scertsolution":1},{"unique":1})
    }
    //delete repeated scertsolution viewed
        
    return {"success":true};
}

async function updateuserprogress(req) {
  
  if (req.query.user) {
    let user = req.query.user;
    let userlessons = [];
    if (req.query.lesson) {
      userlessons = [req.query.lesson]
    } else {
      userlessons = await Lessonprogress.distinct('lesson',{"user":user})
    }
    if (userlessons.length > 0) {
      lessons = await Lesson.find({"_id":{"$in":userlessons}});
      await calculate_lesson_progress(lessons,user)
      return {"message":"updated progress for "+userlessons.length+" lessons"}
    } else {
      return {"message":"no lesson for updating the progress"}
    }
  } else {
    return {"message":"user not provided"}
  }
}

async function currentlessonorder() {
  const states = await State.find({"is_active":true});
  const subjectmasters = await Subjectmaster.find({"module":"sss"});
  const stateids = {};
  for (const state of states) {
    stateids[state.id] = state.name;
  }
  
  var query = {};
  var querylesson = {};
  for (var i = 0; i < subjectmasters.length; i++) {    
    var subject = {};
    subject["id"] = subjectmasters[i].id;
    subject["name"] = subjectmasters[i].name;
     
    subject["icon"] = subjectmasters[i].name.toLowerCase()+".png";
    query['subjects'] = subjectmasters[i].id;
    var departmentmasters = await Departmentmaster.find(query).sort({name: 1})
    var sampark_classes = []
    var govt_classes = []
    var sampark_indexes = {};
    var temp_lesson_no = 0;
    
    //govt classes and lessons
    for (var j = 0; j < departmentmasters.length; j++) {
      var department = {}
      department["id"] = departmentmasters[j]["id"];
      department["sampark_index"] = sampark_indexes[departmentmasters[j]["id"]];
      department["name"] = departmentmasters[j]["name"];
    
      var searchMask = " ";  
      var regEx = new RegExp(searchMask, "ig");
      var replaceMask = "";
      
      department["icon"] = departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask)+"-"+subjectmasters[i].name.toLowerCase()+".png";
      
      querylesson['subject'] = subjectmasters[i].id;
      querylesson['department'] = departmentmasters[j].id;
      querylesson["section"] = "govt";
      querylesson["is_active"] = true;
      
      for (const state of states) {
        querylesson['states'] = state.id;
        var lessons = await Lesson.find(querylesson); //.sort({lesson_no: 1});
        for (const lesson of lessons) {
          var lessonstateids = lesson.states;
          const index = lessonstateids.indexOf(state.id);
          if (index > -1) {
            lessonstateids.splice(index, 1);
          }
          
          if (lessonstateids.length == 0) {
            
          } else {
            var lessonstates = lessonstateids.map(x => stateids[x]);
          }
        }
      }
    }
  }  
}

async function getPinDetails() {
  let defer = require('q').defer()
  try {
    const curl = new (require( 'curl-request' ))();
    var url = "https://api.postalpincode.in/pincode/201301"
    await curl
    .get(url)
    .then(({statusCode, body, headers}) => {
        console.log(statusCode)
        if (statusCode == 200) {
          defer.resolve(body)
        }
        else
          defer.reject("error")
    })
    .catch((e) => {
      defer.reject(e)
    });
  } catch (e) {
    defer.reject(e)
  }
  return defer.promise
}

async function updateuserlocations() {
    //code to add location and district for the existing baithak posts
        
    users = await User.find({"usertype":"spark","is_active":true});
    
    for (const streamuser of users) {
      india_ids = Object.keys(config.india_user_ids);
      if (india_ids.indexOf(streamuser.id.toString()) !== -1) {
        location = "India"
        await User.updateOne({"_id":streamuser.id},{"$set":{"location":location}})
      } else {
        if (streamuser.district !== undefined) {
          //districtdetail = await District.find({"_id":require('mongodb').ObjectID(streamuser.district)}).populate("state_id","name");
          districtdetail = await District.findById(streamuser.district).populate("state_id","name");
          location = (districtdetail.name+", "+districtdetail.state_id.name).toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
          await User.updateOne({"_id":streamuser.id},{"$set":{"location":location}})
        } else {
          try {
            let pin_response_body = await getPinDetails('201301');
            let pin_json = JSON.parse(pin_response_body); 
            if (pin_json[0]['Status'] == "Success") {
              var pin_details = pin_json[0]['PostOffice'][0];
              location = (pin_details['District']+", "+pin_details['State']).toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
            } else {
              if (pin_json[0]['Message'] == 'No records found') {
                //throw 'Pincode does not exists.';
              } else {
                //throw 'Unable to verify pincode. Try again later';
              }
            }
          } catch (e) {
            //console.log(e)
            //throw 'Unable to verify pincode. Try again later';
          }
        }
      }
    }

    return {success: true}
}

async function updatedistrictstates() {

    states = await State.find()
    
    for (const state of states) {
      newname = state.name.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      await State.updateOne({"_id":state.id},{"$set":{"name":newname}})
    }

    districts = await District.find()
    
    for (const district of districts) {
      newname = district.name.toLowerCase().split(' ').map((s) => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
      await District.updateOne({"_id":district.id},{"$set":{"name":newname}})
    }
    
    return {"success":true}
}

async function streamstates() {
        
    india_user_ids = Object.keys(config.india_user_ids);
    streams = await Textstream.find().populate('author');
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (india_user_ids.indexOf(stream.author.toString()) === -1) {
          if (stream.author.state !== undefined) {
            await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"states":[stream.author.state.toString()]}})
          } else {
            //console.log("text stream author state missing == "+stream.id+" : "+stream.author+" AUTHOR : "+stream.author.state)
          }
        }
      } else {
        //console.log("text stream author missing == "+stream.id+" : "+stream.author)
      }
    }
        
    streams = await Imagestream.find().populate('author');
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (india_user_ids.indexOf(stream.author.toString()) === -1) {
          if (stream.author.state !== undefined) {
            await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"states":[stream.author.state.toString()]}})
          } else {
            //console.log("image stream author state missing == "+stream.id+" : "+stream.author)
          }
        }
      } else {
        //console.log("image stream author missing == "+stream.id+" : "+stream.author)
      }
    }
    
    streams = await Videostream.find().populate('author');
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (india_user_ids.indexOf(stream.author.toString()) === -1) {
          if (stream.author.state !== undefined) {
            await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"states":[stream.author.state.toString()]}})
          } else {
            //console.log("video stream author state missing == "+stream.id+" : "+stream.author)
          }
        }
      } else {
        //console.log("video stream author missing == "+stream.id+" : "+stream.author)
      }
    }
    return {"success":true}
}

async function streampriority() {
        
    sampark_user_ids = Object.keys(config.sampark_didi_ids);
    streams = await Textstream.find();
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (sampark_user_ids.indexOf(stream.author.toString()) !== -1) {
          await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"priority":1}})
        } else {
          await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"priority":1}})
        }
      } else {
        //console.log("text stream == "+stream.id+" : "+stream.author)
      }
    }
        
    streams = await Imagestream.find();
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (sampark_user_ids.indexOf(stream.author.toString()) !== -1) {
          await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"priority":1}})
        } else {
          await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"priority":1}})
        }
      } else {
        //console.log("image stream == "+stream.id+" : "+stream.author)
      }
    }
    
    streams = await Videostream.find();
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (sampark_user_ids.indexOf(stream.author.toString()) !== -1) {
          await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"priority":1}})
        } else {
          await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"priority":1}})
        }
      } else {
        //console.log("video stream == "+stream.id+" : "+stream.author)
      }
    }
    
    streams = await Video.find();
    
    for (const stream of streams) {
      if (stream.author !== null && stream.author !== undefined) {
        if (sampark_user_ids.indexOf(stream.author.toString()) !== -1) {
          await Stream.updateOne({"item_id":stream.id,"item_type":"sssvideo"},{"$set":{"priority":0}})
        } else {
          await Stream.updateOne({"item_id":stream.id,"item_type":"sssvideo"},{"$set":{"priority":1}})
        }
      } else {
        //console.log("sss video == "+stream.id+" : "+stream.author)
      }
    }
    
    return {"success":true}
}

async function streamcontent() {
        
    streams = await Textstream.find();
    
    for (const stream of streams) {
      streamuser = await User.findById(stream.author)
      
      if (streamuser == null) {
        location = "India"
        await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"location":location}})
      }
      else {
        india_ids = Object.keys(config.india_user_ids);
        if (india_ids.indexOf(streamuser.id.toString()) !== -1) {
          location = "India"
          await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"location":location}})
        } else {
          if (streamuser.district !== undefined) {
            //districtdetail = await District.find({"_id":require('mongodb').ObjectID(streamuser.district)}).populate("state_id","name");
            districtdetail = await District.findById(streamuser.district).populate("state_id","name");
            location = districtdetail.name+", "+districtdetail.state_id.name;
            await User.updateOne({"_id":stream.author},{"$set":{"location":location}})
            await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"location":location,"district":districtdetail.id}})
          } else {
            try {
              let pin_response_body = await getPinDetails(userParam.pincode);
              let pin_json = JSON.parse(pin_response_body); 
              if (pin_json[0]['Status'] == "Success") {
                var pin_details = pin_json[0]['PostOffice'][0];
              } else {
                if (pin_json[0]['Message'] == 'No records found') {
                  //throw 'Pincode does not exists.';
                } else {
                  //throw 'Unable to verify pincode. Try again later';
                }
              }
            } catch (e) {
              //console.log(e)
              //throw 'Unable to verify pincode. Try again later';
            }
          }
        }
      }
    }
        
    streams = await Imagestream.find();
    
    for (const stream of streams) {
      streamuser = await User.findById(stream.author)
      
      if (streamuser == null) {
        location = "India"
        await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"location":location}})
      }
      else {
        india_ids = Object.keys(config.india_user_ids);
        if (india_ids.indexOf(streamuser.id.toString()) !== -1) {
          location = "India"
          await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"location":location}})
        } else {
          if (streamuser.district !== undefined) {
            //districtdetail = await District.find({"_id":require('mongodb').ObjectID(streamuser.district)}).populate("state_id","name");
            districtdetail = await District.findById(streamuser.district).populate("state_id","name");
            location = districtdetail.name+", "+districtdetail.state_id.name;
            await User.updateOne({"_id":stream.author},{"$set":{"location":location}})
            await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"location":location,"district":districtdetail.id}})
          } else {
            try {
              var url = "https://api.postalpincode.in/pincode/"+streamuser.pincode
              response = await request(url);
              var json = JSON.parse(response.body); 
              if (json[0]['Status'] == "Success") {
                var pin_details = json[0]['PostOffice'][0];
                //if (pin_details['District'] == "Bareilly") {
                //  pin_details['District'] = 'BAREILEY';
                //}
                //pin_details['District'] = pin_details['District'].toUpperCase();
                
                //statecheck = await State.find({"name":pin_details['State']});
                //if (statecheck.length == 1) {
                //  districtcheck = await District.find({"name":pin_details['District'],"state_id":statecheck[0].id});
                //}
                //if (districtcheck.length == 1) {
                  //await User.updateOne({"_id":stream.author,"state":districtcheck.state_id},{"$set":{"location":pin_details['District']+", "+pin_details['State'],"district":districtcheck[0].id,"state":districtcheck[0].state_id}})
                //  await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"location":pin_details['District']+", "+pin_details['State'],"district":districtcheck[0].id}})
                //} else {
                  //await User.updateOne({"_id":stream.author},{"$set":{"location":pin_details['District']+", "+pin_details['State']}})
                  await Stream.updateOne({"item_id":stream.id,"item_type":"image"},{"$set":{"location":pin_details['District']+", "+pin_details['State']}})
                //}
              } else {
                if (json[0]['Message'] == 'No records found') {
                  //console.log('Pincode does not exists.');
                } else {
                  //console.log('Unable to verify pincode. Try again later');
                }
              }
            } catch (e) {
              //console.log(e)
              //throw 'Unable to verify pincode. Try again later';
            }
          }
        }
      }
    }
    
    streams = await Videostream.find();
    
    for (const stream of streams) {
      streamuser = await User.findById(stream.author)
      if (streamuser == null) {
        location = "India"
        await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"location":location}})
      }
      else {
        india_ids = Object.keys(config.india_user_ids);
        if (india_ids.indexOf(streamuser.id.toString()) !== -1) {
          location = "India"
          await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"location":location}})
        } else {
          if (streamuser.district !== undefined) {
            //districtdetail = await District.find({"_id":require('mongodb').ObjectID(streamuser.district)}).populate("state_id","name");
            districtdetail = await District.findById(streamuser.district).populate("state_id","name");
            location = districtdetail.name+", "+districtdetail.state_id.name;
            await User.updateOne({"_id":stream.author},{"$set":{"location":location}})
            await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"location":location,"district":districtdetail.id}})
          } else {
            try {
              var url = "https://api.postalpincode.in/pincode/"+streamuser.pincode
              response = await request(url);
              var json = JSON.parse(response.body); 
              if (json[0]['Status'] == "Success") {
                var pin_details = json[0]['PostOffice'][0];
                //if (pin_details['District'] == "Bareilly") {
                //  pin_details['District'] = 'BAREILEY';
                //}
                //pin_details['District'] = pin_details['District'].toUpperCase();
                
                //statecheck = await State.find({"name":pin_details['State']});
                //if (statecheck.length == 1) {
                //  districtcheck = await District.find({"name":pin_details['District'],"state_id":statecheck[0].id});
                //}
                //if (districtcheck.length == 1) {
                  //await User.updateOne({"_id":stream.author,"state":districtcheck.state_id},{"$set":{"location":pin_details['District']+", "+pin_details['State'],"district":districtcheck[0].id,"state":districtcheck[0].state_id}})
                //  await Stream.updateOne({"item_id":stream.id,"item_type":"text"},{"$set":{"location":pin_details['District']+", "+pin_details['State'],"district":districtcheck[0].id}})
                //} else {
                  //await User.updateOne({"_id":stream.author},{"$set":{"location":pin_details['District']+", "+pin_details['State']}})
                  await Stream.updateOne({"item_id":stream.id,"item_type":"video"},{"$set":{"location":pin_details['District']+", "+pin_details['State']}})
                //}
              } else {
                if (json[0]['Message'] == 'No records found') {
                  //console.log('Pincode does not exists.');
                } else {
                  //console.log('Unable to verify pincode. Try again later');
                }
              }
            } catch (e) {
              //console.log(e)
              //throw 'Unable to verify pincode. Try again later';
            }
          }
        }
      }
    }
    
    return {"success":true}
    //code to add location and district for the existing baithak posts
    
    states = await State.find({"is_active":true})
    
    var stateids = {};
    for (const state of states) {
      stateids[state.name] = state.id;
    }
    var newstates = [];
    var streamstates = {};
    //console.log("9999999999999999999")

   // for (const stream of streams) {
 //     newstates.push(stream.states);
//    }
//return newstates;
    for (const stream of streams) {
      //console.log(stream.states.length)
      if (stream.states !== undefined) {
        var newstates = [];
        if (stream.states.length == 1 && stream.states[0] == "") {
          newstates = ["0"]
        } else if (stream.states.length == 0) {
          newstates = ["0"]
        } else if (stream.states.length > 0) {
          //console.log(stream.states)
          for (const state of stream.states) {
            if (state == "Chhattisgarh") {
              newstates.push(stateids["Chattisgarh"])
            } else if (state == "Other" || state == "Others") {
              newstates.push("0")
            } else {
              if (stateids.hasOwnProperty(state)) {
                newstates.push(stateids[state])
              } else {
                newstates.push(state)
              }
            }
          }
        }
      }
      if (newstates.indexOf("0") === -1)
        newstates.push("0")
      streamstates[stream.id] = newstates;
      await Stream.updateOne({"_id":stream.id},{"$set":{states: newstates}})
    }
    
    return streamstates;
    return {"success":true}
    textStreams = await Textstream.find();
  
    for(var i = 0; i < textStreams.length;i++){
      streamDetail = textStreams[i];
      streamParam = {};
      if (isBase64(streamDetail.description)) {
        let buff = new Buffer(streamDetail.description, 'base64');
        streamParam['description'] = decodeURIComponent(buff);
        Object.assign(streamDetail, streamParam);
        await streamDetail.save();
      }
    }
      
    imageStreams = await Imagestream.find();
  
    for(var i = 0; i < imageStreams.length;i++){
      streamDetail = imageStreams[i];
      streamParam = {};
      if (isBase64(streamDetail.description)) {
        let buff = new Buffer(streamDetail.description, 'base64');
        streamParam['description'] = decodeURIComponent(buff);
        Object.assign(streamDetail, streamParam);
        await streamDetail.save();
      }
    }
      
    userVideos = await Uservideo.find();
  
    for(var i = 0; i < userVideos.length;i++){
      streamDetail = userVideos[i];
      streamParam = {};
      if (isBase64(streamDetail.description)) {
        let buff = new Buffer(streamDetail.description, 'base64');
        streamParam['description'] = decodeURIComponent(buff);
        Object.assign(streamDetail, streamParam);
        await streamDetail.save();
      }
    }
    return {success: true}
}

async function updateviewcounts() {
    
    videos = await Video.find()
    
    for (const video of videos) {
      videoplayed = await Sssvideoplayed.find({"video":video.id})
      await Video.updateOne({"_id":video.id},{"$set":{"viewcount":videoplayed.length}})
      //console.log(video.id+" : "+videoplayed.length)
    }
    
    //console.log("BAITHAK VIDEOS")
    videos = await Videostream.find()
    
    for (const video of videos) {
      videoplayed = await Videoplayed.find({"video":video.id})
      await Videostream.updateOne({"_id":video.id},{"$set":{"viewcount":videoplayed.length}})
      //console.log(video.id+" : "+videoplayed.length)
    }
    
    //console.log("AUDIOS")
    videos = await Audio.find()
    
    for (const video of videos) {
      videoplayed = await Audioplayed.find({"audio":video.id})
      await Audio.updateOne({"_id":video.id},{"$set":{"viewcount":videoplayed.length}})
      //console.log(video.id+" : "+videoplayed.length)
    }
    
    return {success: true}
}


async function getDimension(streamDetail) {  
//  let sizeOf = promisify(require('image-size'));
  let probe = require('probe-image-size');
  let defer = require('q').defer()
  let inputimage = require('fs').createReadStream(config.uploadPath+streamDetail.thumbnail);
  try {    
    await probe(inputimage)
              .then(dimensions => { 
                let dimension = {};
                dimension["width"] = dimensions.width;
                dimension["height"] = dimensions.height;
                inputimage.close();
                defer.resolve(dimension)
              })
              .catch(err => {
                console.log('error')
                console.error(err);
                defer.reject(err+" : "+config.uploadPath+streamDetail.thumbnail)
              }); 
  } catch (err) {
    console.error(err);
    defer.reject(err+" : "+config.uploadPath+streamDetail.thumbnail)
  }
  return defer.promise
}

async function imagedimensions() {    
    let fs = require('fs');
    
    let query = {};
    query["$or"] = [];
    let query1 = {};
    query1["width"] = {};
    query1["width"]["$exists"] = false;
    let query2 = {};
    query2["width"] = {};
    query2["width"]["$lte"] = 0;
    query["$or"].push(query1)
    query["$or"].push(query2)
    
    const imageStreams = await Imagestream.find(query);
    
    for (const imageStream of imageStreams) {
      streamDetail = imageStream;
      if (streamDetail.width && streamDetail.width > 0) {
        continue;
      }
      streamParam = {};
      
      if (streamDetail.thumbnail && fs.existsSync(config.uploadPath+streamDetail.thumbnail)) {
        let dimensions = await getDimension(streamDetail)
        streamParam["width"] = dimensions.width;
        streamParam["height"] = dimensions.height;
        Object.assign(streamDetail, streamParam);
        await streamDetail.save(); 
      }
    }
    
    const videoStreams = await Videostream.find(query);
    
    for (const videoStream of videoStreams) {
      streamDetail = videoStream;
      if (streamDetail.width && streamDetail.width > 0) {
        continue;
      }
      streamParam = {};
      
      if (streamDetail.thumbnail && fs.existsSync(config.uploadPath+streamDetail.thumbnail)) {
        let dimensions = await getDimension(streamDetail)
        streamParam["width"] = dimensions.width;
        streamParam["height"] = dimensions.height;
        Object.assign(streamDetail, streamParam);
        await streamDetail.save(); 
      }
    }
    
    return "done"
}

async function videodurations() {
    
    videos = await Video.find();
    
    var i = 0;
    for (const video of videos) {
      //console.log('STARTED : '+i)
      i = i + 1;
      await fetchVideoInfo(video.video_code).then(function (videoInfo) {
        var videoParam = {};
        min_duration = (videoInfo['duration']/60);
        sec_duration = (videoInfo['duration']%60);
        videoParam['duration'] = parseInt(min_duration)+" Mins "+sec_duration+" Secs";
        
        Object.assign(video, videoParam);
        video.save(); 
        //console.log('ENDED : '+i)
      }).catch(err => console.log("video not exists"));
    }      
    return videos;
}

async function lessonnos() {
    var query = {};
    var querylesson = {};
    var subjects = [];
    query['module'] = 'sss';
    
    const subjectmasters = await Subjectmaster.find(query);
    var lessonslist = [];
    for (var i = 0; i < subjectmasters.length; i++) {
      var subject = {};
      subject["id"] = subjectmasters[i].id;
      subject["name"] = subjectmasters[i].name;
      subject["message1"] = "6000 Teachers are watching this right now";
      subject["message2"] = subjectmasters[i].name+" certified शिक्षक बनने  में 42 घंटे बचे हैं |";
      subject["icon"] = subjectmasters[i].name.toLowerCase()+".png";
      query['subjects'] = subjectmasters[i].id;
      var departmentmasters = await Departmentmaster.find(query).sort({name: 1})
      var sampark_classes = []
      var govt_classes = []
      
      //sampark classes and lessons
      for (var j = 0; j < departmentmasters.length; j++) {
        var department = {}
        department["id"] = departmentmasters[j]["id"];
        department["name"] = departmentmasters[j]["name"];
      
        var searchMask = " ";  
        var regEx = new RegExp(searchMask, "ig");
        var replaceMask = "";
        
        department["icon"] = departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask)+"-"+subjectmasters[i].name.toLowerCase()+".png";
        
        querylesson['subject'] = subjectmasters[i].id;
        querylesson['department'] = departmentmasters[j].id;
        var lessons = await Lesson.find(querylesson).sort({lesson_no: 1})
        var samparklessons = [];
        var audios_available = false;
        var lesson_no = 1;
        for (var k = 0; k < lessons.length; k++) {        
          if (lessons[k]['section'] == "sss") {
            lessonParam = {};
            lessonParam["lesson_no"] = lesson_no
            lesson = lessons[k];
        //    Object.assign(lesson, lessonParam);
            //await lesson.save()
            var newlesson = {}
            newlesson["_id"] = lessons[k]["_id"]
            newlesson["name"] = lessons[k]["name"]
            newlesson["display_order"] = lessons[k]["lesson_no"]
            newlesson["lesson_no"] = lesson_no
            newlesson["class"] = department["name"]
            newlesson["section"] = "sampark"
            newlesson["subject"] = subject["name"]
            lessonslist.push(newlesson)
            lesson_no = lesson_no + 1;
          }         
        }
      }
      
      //govt classes and lessons
      for (var j = 0; j < departmentmasters.length; j++) {
        var department = {}
        department["id"] = departmentmasters[j]["id"];
        department["name"] = departmentmasters[j]["name"];
      
        var searchMask = " ";  
        var regEx = new RegExp(searchMask, "ig");
        var replaceMask = "";
        
        department["icon"] = departmentmasters[j].name.toLowerCase().replace(regEx, replaceMask)+"-"+subjectmasters[i].name.toLowerCase()+".png";
        
        querylesson['subject'] = subjectmasters[i].id;
        querylesson['department'] = departmentmasters[j].id;
        var lessons = await Lesson.find(querylesson).sort({lesson_no: 1})
        var samparklessons = [];
        var audios_available = false;
        var lesson_no = 1;
        for (var k = 0; k < lessons.length; k++) {        
          if (lessons[k]['section'] !== "sss") {
            lessonParam = {};
            lessonParam["lesson_no"] = lesson_no
            lesson = lessons[k];
          //  Object.assign(lesson, lessonParam);
            var newlesson = {}
            newlesson["_id"] = lessons[k]["_id"]
            newlesson["name"] = lessons[k]["name"]
            newlesson["display_order"] = lessons[k]["lesson_no"]
            newlesson["lesson_no"] = lesson_no
            newlesson["class"] = department["name"]
            newlesson["section"] = "govt"
            newlesson["subject"] = subject["name"]
            lessonslist.push(newlesson)
            lesson_no = lesson_no + 1;
          }         
        }
      }
    }
    return lessonslist;
    //return {"success":true};
    //return await Lesson.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function badges() {
  
  //d = new Date(1583739082711); //9 march
  //d = new Date(1583460082000); //6 march
  d = new Date();
  d = new Date(d);
  //console.log("TODAY : "+d)
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  var monday = new Date(d.setDate(diff));
  
  
  //console.log("MONDAY : "+monday)
  lastweekend = new Date(monday.setDate(monday.getDate() - 1));
  lastweekend.setHours(23,59,59,999);
  
  lastweekstart = new Date(monday.setDate(monday.getDate() - 6));
  lastweekstart.setHours(0,0,0,0);
  
  //console.log("lastweekstart : "+lastweekstart)
  //console.log("lastweekend : "+lastweekend)
  
  var prevMonday = new Date(1583739082711);
  
  //console.log(prevMonday)
  newDay = prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
  var checkday = new Date(newDay);
  //console.log(checkday.getDay())
  prevMonday.setDate(prevMonday.getDate() - (prevMonday.getDay() + 6) % 7);
  //console.log(prevMonday)
  
  var date = new Date();
  //console.log("GET DATE");
  //console.log(date.getDate());
  //console.log("GET DAY");
  //console.log(date.getDay());
  //var date = new Date().setDate(date.getDate() - 3);
  var day = date.getDay();
  var prevMonday;
  //console.log(date.getDay())
  if(date.getDay() == 0){
      prevMonday = new Date().setDate(date.getDate() - 7);
  }
  else{
      prevMonday = new Date().setDate(date.getDate() - (6+day));
  }
  //weekend = new Date().setDate(date.getDate(prevMonday) + 7);
  return {"monday":prevMonday, "weekend":date.getDate()}
}

async function certificatehours() {
  var mastercertificates = await Certificate.find({is_active: true});
  var states = await State.find({is_active: true});
  var subjects = await Subjectmaster.find({"module":"sss"}); 
  
  for (const state of states) {
    var subject_progress = {};
    for (const subject of subjects) {
      subject_progress[subject.name] = {};
      subject_progress[subject.name]['lessons'] = 0;
      subject_progress[subject.name]['progress'] = 0;
      var lessonids = [];
      await Lesson.find({"subject":subject.id, "states": state.id}).then(lessons => {
        for (const lesson of lessons) {
          subject_progress[subject.name]['lessons'] = subject_progress[subject.name]['lessons'] + 1
          lessonids.push(require('mongodb').ObjectID(lesson.id))
        }
      })
    }

    for (const mastercertificate of mastercertificates) {
      if (mastercertificate['department'] && mastercertificate['subject'])
        clessons = await Lesson.find({states: state.id, department: mastercertificate['department'], subject: mastercertificate['subject'], "section":"sss"})
      else if (mastercertificate['department'])
        clessons = await Lesson.find({states: state.id, department: mastercertificate['department'], "section":"sss"})
      else if (mastercertificate['subject'])
        clessons = await Lesson.find({states: state.id, subject: mastercertificate['subject'], "section":"sss"})
      else
        continue;
    
      var certificate_video = [];
      for (const clesson of clessons) {
        certificate_video = certificate_video.concat(clesson.videos);
      }
      var duration = 0;
      var duration_watched = 0;
      var check_videos = [];
      for (const video of certificate_video) {
        if (video != "" && check_videos.indexOf(video.toString()) === -1) {
          check_videos.push(video.toString())
          var video_detail = await Video.findById(video).populate("department","name").populate("subject","name");
          duration = duration + (video_detail.duration_min*60+video_detail.duration_sec)
        }
      }
      var total_duration = parseInt(duration/(60*60));
      
      check_state_certificate = await Statecertificate.find({"state":state.id,"certificate":mastercertificate.id}).count()
      if (check_state_certificate == 0) {
        statecertificate = new Statecertificate({"subject":mastercertificate.subject, "department":mastercertificate.department, "state":state.id,"certificate":mastercertificate.id, "total_duration":total_duration});
        await statecertificate.save();
      } else {
        await Statecertificate.updateOne({"state":state.id, "certificate":mastercertificate.id},{"$set":{"subject":mastercertificate.subject, "department":mastercertificate.department, "total_duration":total_duration, "updatedDate":new Date()}})
      }
    }
  }

  return {"success":true}
}
