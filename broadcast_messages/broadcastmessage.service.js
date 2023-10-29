//'use strict'
const config = require('../config.json');
const db = require('../_helpers/db');
const Broadcastmessage = db.Broadcastmessage;
const User = db.User;

module.exports = {
    create: create
};

async function create(reqbody) {
    // validate
  let defer = require('q').defer();
  try {
    let messageParam = reqbody;
    let updatedAt = new Date();
    
    let messageData = {};
    messageData.message = messageParam.message;
    messageData.publishDate = messageParam.publishDate;
    messageData.updatedDate = updatedAt;
    messageData.user_groups = messageParam.user_groups.split(",");
    messageData.states = messageParam.states.split(",");

    let broadcastMessage = new Broadcastmessage(messageData)
    if (await broadcastMessage.save()) {
      var admin = require("firebase-admin");
      fcmtitle = "Sample Broadcast Message";
      fcmmessage = "Video posted by you has been rejected";

      var serviceAccount = require("../sampark-2cb4e-firebase-adminsdk-bfxop-67d0adbf87.json");

      const userdetail = await User.findOne({"phone_number":"9899594992"})
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://sampark-2cb4e.firebaseio.com"
        });
      }
      var payload = {
        notification: {
          title: fcmtitle,
          body: fcmmessage
        },
        data: {
          user: userdetail.id,
          usertype: userdetail.usertype
        }
      };
      var options = {
        priority: "high",
        timeToLive: 60 * 60 *24
      };
      if (userdetail && userdetail.fcm_token) {
        admin.messaging().sendToDevice(userdetail.fcm_token,payload, options)
        .then(function(response) {
          console.log("Successfully sent message:", response);
        })
        .catch(function(error) {
          console.error("Error sending message:", error);
        });
      }
      defer.resolve("Send")        
    } else {
      console.log(e)
      defer.reject(e)
    }
  } catch (e) {
    console.log(e)
    defer.reject(e)
  }
  return defer.promise()
}

