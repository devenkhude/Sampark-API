const config = require("../config.json");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../_helpers/db");
const commonmethods = require("../_helpers/commonmethods");
const badge_allocation = commonmethods.badge_allocation;
const uploadToS3 = commonmethods.uploadToS3;
const getPinDetails = commonmethods.getPinDetails;
const User = db.User;
const State = db.State;
const Userdevice = db.Userdevice;
const District = db.District;
const Userbadge = db.Userbadge;
const Userattendance = db.Userattendance;
const Departmentmaster = db.Departmentmaster;
const School = db.School;
const Student = db.Student;
const Sparkle = db.Usersparkle;
const Topteachers = db.Topteacher;
var objectId = require("mongoose").Types.ObjectId;

module.exports = {
  login,
  authenticate,
  profilepicupload,
  getAll,
  getById,
  getDetail,
  getAuthors,
  create,
  verify,
  update,
  resend_otp,
  verify_login,
  update_usertype,
  update_fcmtoken,
  last_active_time,
  changePassword,
  getBadgesCount,
  avasar,
  delete: _delete,
};

async function last_active_time(
  userid,
  device_id,
  action_performed,
  apk_version,
  fcm_token
) {
  if (device_id != "") {
    if (userid == "") {
      check_user_device = await Userdevice.findOne({ device_id: device_id });
    } else {
      check_user_device = await Userdevice.findOne({
        device_id: device_id,
        user: userid,
      });
    }
    if (check_user_device != null && check_user_device.device_id == device_id) {
      var deviceParam = {};
      deviceParam.last_active_on = Date.now();
      deviceParam.action_performed = action_performed;
      deviceParam.apk_version = apk_version;
      Object.assign(check_user_device, deviceParam);
      check_user_device.save();
    } else {
      user_device = new Userdevice({
        device_id: device_id,
        apk_version: apk_version,
        action_performed: action_performed,
      });
      if (userid != "") {
        user_device.user = userid;
      }
      user_device.save();
    }
    if (userid !== "") {
      var today = new Date();
      var dd = today.getDate();

      var mm = today.getMonth() + 1;
      var yyyy = today.getFullYear();
      if (dd < 10) {
        dd = "0" + dd;
      }

      if (mm < 10) {
        mm = "0" + mm;
      }
      today = dd + "-" + mm + "-" + yyyy;

      if (
        fcm_token != "" &&
        fcm_token != "undefined" &&
        fcm_token !== undefined
      ) {
        await User.updateOne(
          { _id: userid },
          { $set: { fcm_token: fcm_token } }
        );
      }
      checkattendance = await Userattendance.find({
        user: userid,
        attendance_date: today,
      });
      if (checkattendance.length == 0) {
        markattendance = new Userattendance({
          user: userid,
          attendance_date: today,
        });
        if (await markattendance.save()) {
          badge_allocation(userid, "full-attendance");
        }
      }
    }
  }
}

async function getStateDistrict(user) {
  statename = "My State";
  stateshortname = "USNA";
  districtname = "My District";
  districtname = "My District";
  baithakUpload = false;
  ncertname = "NCERT";
  helpline_no = "";
  certificateAvailable = true;
  if (user.state) {
    userstate = await State.findById(user.state);
    statename = userstate && userstate.name ? userstate.name : "My State";
    stateshortname =
      userstate && userstate.name ? userstate.short_name : "USNA";
    statename = statename
      .toLowerCase()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ");

    if (userstate.is_active) {
      ncertname = statename;
    } else {
      ncertname = "NCERT";
    }
  }
  if (user.district) {
    userdistrict = await District.findById(user.district);
    districtname =
      userdistrict && userdistrict.name ? userdistrict.name : "My District";
    districtname = districtname
      .toLowerCase()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ");
  }
  if (
    user.usertype == "spark" ||
    user.usertype == "parent" ||
    user.usertype == "govt teacher"
  ) {
    baithakUpload = true;
  }
  //if (user.usertype == "spark" || user.usertype == "private educator" || user.usertype == "parent" || user.usertype == "govt teacher") {
  //  certificateAvailable = true
  //}

  if (Boolean(user.district)) {
    var district = user.district;
  } else {
    var district = "";
  }

  if (Boolean(user.block)) {
    var block = user.block;
  } else {
    var block = "";
  }
  covid_helpline_nos = Object.keys(config.covid_helpline_nos);
  helpline_no =
    user.state && config.covid_helpline_nos[user.state.toString()]
      ? config.covid_helpline_nos[user.state.toString()]
      : "";
  return [
    statename,
    districtname,
    baithakUpload,
    certificateAvailable,
    ncertname,
    district,
    block,
    helpline_no,
  ];
}

//API updated by Devendra K
async function getDetail(id) {
  try {
    if (id) {
      const user = await User.findById(id).select("-hash");
      if (user) {
        const { _id, hash, ...userWithoutHash } = user.toObject();
        const token = jwt.sign({ sub: user.id }, config.secret);
        const stateDistrict = await getStateDistrict(user);
        const statename = stateDistrict[0];
        const districtname = stateDistrict[1];
        const baithakupload = stateDistrict[2];
        const certificateavailable = stateDistrict[3];
        const ncertname = stateDistrict[4];
        const profile_pic =
          user.image != "" && user.image != null
            ? config.repositoryHost + user.image
            : config.user_image;
        return {
          id,
          ...userWithoutHash,
          token,
          profile_pic,
          statename,
          districtname,
          baithakupload,
          certificateavailable,
          ncertname,
        };
      } else {
        throw "No User Found";
      }
    }
  } catch (e) {
    console.log("Get Detail: ", e);
    next(e);
  }
}

async function authenticate({ phone_number, password }) {
  const user = await User.findOne({ phone_number });
  if (user && bcrypt.compareSync(password, user.hash)) {
    const { _id, hash, ...userWithoutHash } = user.toObject();
    const id = _id;
    const token = jwt.sign({ sub: user.id }, config.secret);
    stateDistrict = await getStateDistrict(user);
    statename = stateDistrict[0];
    districtname = stateDistrict[1];
    baithakupload = stateDistrict[2];
    certificateavailable = stateDistrict[3];
    ncertname = stateDistrict[4];
    return {
      id,
      ...userWithoutHash,
      token,
      statename,
      districtname,
      baithakupload,
      certificateavailable,
      ncertname,
    };
  }
}

async function profilepicupload(req) {
  if (!req.files || Object.keys(req.files).length === 0) {
    throw "No files were uploaded.";
  }
  //return req.files.path;
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let profileNewPic = req.files.uploaded_media;

  const user = await User.findOne({ phone_number: req.body.phone });

  let uploadFolder = "userpics";
  let uploadData = await uploadToS3(profileNewPic, uploadFolder);
  userParam = {};
  userParam["image"] = uploadData.Key;

  userParam["updatedDate"] = new Date();
  // copy userParam properties to user
  Object.assign(user, userParam);

  // save video
  user.save();

  const user1 = await User.findOne({ phone_number: req.body.phone });
  const { _id, hash, ...userWithoutHash } = user1.toObject();
  const id = _id;
  stateDistrict = await getStateDistrict(user1);
  statename = stateDistrict[0];
  districtname = stateDistrict[1];
  baithakupload = stateDistrict[2];
  certificateavailable = stateDistrict[3];
  ncertname = stateDistrict[4];
  return {
    id,
    ...userWithoutHash,
    statename,
    districtname,
    baithakupload,
    certificateavailable,
    ncertname,
  };
}

async function getAll() {
  return await User.find().select("-hash");
}

async function getAuthors(author) {
  if (author) {
    if (author === "sampark") {
      temp_sampark_didi_ids = Object.keys(config.sampark_didi_ids);
      return await User.find({ _id: { $in: temp_sampark_didi_ids } }).select(
        "fullName phone_number"
      );
    } else {
      return await User.find({ _id: author }).select("fullName phone_number");
    }
  } else {
    return await User.find().select("-hash");
  }
}

async function getById(id) {
  return await User.findOne({ _id: id, is_active: true }).select("-hash");
}

async function changePassword(userParam) {
  let defer = require("q").defer();

  try {
    const checkuser = await User.findOne({
      phone_number: userParam.phone_number,
    });
    if (checkuser) {
      // hash password
      let password = userParam.password;
      let userHash = bcrypt.hashSync(password, 10);
      await User.updateOne(
        { phone_number: userParam.phone_number },
        { $set: { hash: userHash } }
      );
      defer.resolve("Updated ");
    }
  } catch (e) {
    console.log(e);
    defer.reject(e);
  }
  return defer.promise;
}

async function create(userParam) {
  let defer = require("q").defer();

  try {
    let classes = userParam["classes"];
    let subjects = userParam["subjects"];
    let userclasses = [];
    let usersubjects = [];
    for (var i = 0; i < classes.length; i++) {
      userclasses.push(classes[i]["id"]);
    }
    for (var i = 0; i < subjects.length; i++) {
      usersubjects.push(subjects[i]["id"]);
    }

    // validate
    const checkuser = await User.findOne({
      phone_number: userParam.phone_number,
      is_new: false,
    });
    if (checkuser) {
      defer.reject(
        'Phone Number "' + userParam.phone_number + '" is already registered'
      );
    } else {
      if (userParam.schoolCode) {
        userParam.diseCode = userParam.schoolCode;
      }
      let user_state = "";
      if (userParam.state && userParam.state !== "") {
        user_state = await State.findById(userParam.state);
        if (!user_state.is_active) {
          delete userParam.block;
          delete userParam.district;
          delete userParam.cluster;
        }
        if (userParam.diseCode && userParam.diseCode !== "") {
          if (!userParam.diseCode.startsWith(user_state.code)) {
            defer.reject("Dise Code does not belongs to " + user_state.name);
          }
        }
      }
      let userdistrictname = "";

      if (userParam.block == "blocked") {
        delete userParam.block;
      }
      if (userParam.district == "blocked") {
        delete userParam.district;
      }
      if (userParam.cluster == "blocked") {
        delete userParam.cluster;
      }
      if (userParam.district && userParam.district !== "") {
        let user_district = await District.findById(userParam.district);
        userdistrictname = user_district ? user_district.name : "";
      }
      const user1 = await User.find({
        phone_number: userParam.phone_number,
        is_new: true,
      });

      const user = user1[0];
      let userUParam = userParam;
      //const user = new User(userParam);

      let pin_response_body = await getPinDetails(
        userParam.pincode,
        user_state.name
      );
      let pin_json = JSON.parse(pin_response_body);
      let pin_details = {};
      if (pin_json[0]["Status"] == "Success") {
        pin_details = pin_json[0]["PostOffice"][0];
      } else if (pin_json[0]["Status"] == "error") {
        pin_details = pin_json[0]["PostOffice"][0];
      } else {
        if (pin_json[0]["Message"] == "No records found") {
          defer.reject("Pincode does not exists.");
        } else {
          defer.reject("Unable to verify pincode. Try again later");
        }
      }

      if (
        !userUParam.state ||
        userUParam.state == "" ||
        userUParam.state == "null"
      ) {
        userUParam.state = pin_details.State;
      } else {
        if (user_state.name.toLowerCase() != pin_details.State.toLowerCase()) {
          defer.reject("Pincode does not belong to the selected state.");
        }
      }

      if (userdistrictname == "") {
        userUParam.location = pin_details.District + ", " + pin_details.State;

        let districtdetail = await District.find({
          name: pin_details.District,
        });
        if (districtdetail && districtdetail.length == 1) {
          let district_id = districtdetail[0]["_id"];
          userParam.district = district_id;
          userParam.district_mapped = true;
        } else {
          userParam.district_mapped = false;
        }
      } else {
        userParam.district_mapped = true;
        userUParam.location = userdistrictname + ", " + pin_details.State;
      }
      if (userParam.lastName)
        userUParam.fullName =
          userParam.firstName.trim() + " " + userParam.lastName.trim();
      else userUParam.fullName = userParam.firstName.trim();

      // hash password
      userParam.password = "tempPassword54321";
      if (userParam.password) {
        userUParam.hash = bcrypt.hashSync(userParam.password, 10);
      }

      if (user) {
        // Changes done by Devendra with 3 fields updated
        if (
          userParam.hasOwnProperty("diseCode") &&
          userParam.diseCode.trim() != ""
        ) {
          const school = await School.findOne({ diseCode: userParam.diseCode });
          if (school) {
            const schoolId = school._id;
            const schoolName = school.schoolName;
            user.schoolId = schoolId;
            user.schoolName = schoolName;
            user.totalResources = 0;
          }
        }
        userUParam.otp = createotp(4, userParam.phone_number, user.otp);
        userUParam.total_points = 100;
        userUParam.is_new = true;
        userUParam.classes = userclasses;
        userUParam.subjects = usersubjects;
        userUParam.registrationDate = new Date();
        userUParam.updatedDate = new Date();
        Object.assign(user, userUParam);
        //var message = "Your one time password for Sampark Smart Shala is "+user.otp+". Verify to sign in!";
        //sendsms(message,userParam.phone_number);
        // save user
        await user.save();
        const user2 = await User.findOne({
          phone_number: userParam.phone_number,
        });
        if (user2) {
          const { _id, hash, ...userWithoutHash } = user2.toObject();
          const id = _id;
          const token = jwt.sign({ sub: user2.id }, config.secret);
          const profile_pic =
            user2.hasOwnProperty("image") &&
            user2.image != "" &&
            user2.image != null
              ? config.repositoryHost + user2.image
              : config.user_image;
          const is_usertype_exists = user2.usertype == "" ? false : true;
          const is_registered =
            user2.firstName == "" || user2.pincode == "" ? false : true;
          stateDistrict = await getStateDistrict(user2);
          statename = stateDistrict[0];
          districtname = stateDistrict[1];
          baithakupload = stateDistrict[2];
          certificateavailable = stateDistrict[3];
          ncertname = stateDistrict[4];
          defer.resolve({
            id,
            ...userWithoutHash,
            token,
            profile_pic,
            is_usertype_exists,
            is_registered,
            statename,
            districtname,
            baithakupload,
            certificateavailable,
            ncertname,
          });
        }
      } else {
        defer.reject(e);
      }
    }
  } catch (e) {
    console.log(e);
    defer.reject(e);
  }
  return defer.promise;
}

function sendsms(sms, mobile) {
  if (
    config.environment == "PRODUCTION" &&
    config.vip_numbers.indexOf(mobile) === -1
  ) {
    sms = encodeURI(sms);
    // let url = "https://japi.instaalerts.zone/httpapi/QueryStringReceiver?ver=1.0&encrpt=0&key=EWDpbVV7VlPZCj6yGEWtVw==&send=SAMPRK&dest=" + mobile + "&text=" + sms + "&type=UC"
    let url =
      "https://japi.instaalerts.zone/httpapi/QueryStringReceiver?ver=1.0&encrpt=0&key=EWDpbVV7VlPZCj6yGEWtVw==&send=SMPRKF&dest=" +
      mobile +
      "&text=" +
      sms;

    const request = require("request");
    request(url, function (error, response, body) {
      if (response.statusCode == 200) return true;
      else return false;
    });
  } else {
    return true;
  }
}

function createotp(length, mobile, current_otp) {
  if (config.environment == "PRODUCTION") {
    if (config.vip_numbers.indexOf(mobile) !== -1) {
      otpindex = config.vip_numbers.indexOf(mobile);
      return config.vip_otp[otpindex];
    } else {
      if (current_otp == "----" || current_otp == "") {
        var result = "";
        var characters = "0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
          result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
          );
        }

        return result;
      } else {
        return current_otp;
      }
    }
  } else {
    return "1111";
  }
}

async function resend_otp(userParam) {
  const user = await User.findById(userParam.id);

  if (!user.is_active) {
    throw "User has been blocked";
  }
  // validate
  if (!user) throw "User not found";
  if (user.phone_number !== userParam.phone_number) {
    throw "Invalid User";
  }
  if (user.is_verified) {
    //throw 'User already verified';
  }
  // copy userParam properties to user
  Object.assign(user, userParam);
  user.otp = createotp(4, userParam.phone_number, user.otp);
  var message =
    "Your one time password for Sampark Smart Shala is " +
    user.otp +
    ". Verify to sign in!";
  sendsms(message, userParam.phone_number);

  await user.save();
  return await User.findOne({ phone_number: userParam.phone_number }).select(
    "-hash"
  );
}

async function login(userParam) {
  let defer = require("q").defer();
  try {
    const user = await User.findOne({ phone_number: userParam.phone_number });

    if (user && !user.is_active) {
      defer.reject("User has been blocked");
    }
    // validate
    if (!user) {
      const newUser = new User(userParam);
      userParam.password = "tempPassword54321";
      if (userParam.password) {
        newUser.hash = bcrypt.hashSync(userParam.password, 10);
      }
      newUser.otp = createotp(4, userParam.phone_number, "");
      let message =
        "Your one time password for Sampark Smart Shala is " +
        newUser.otp +
        ". Verify to sign in!";
      sendsms(message, userParam.phone_number);
      // save user
      await newUser.save();
      //return await User.findOne({ phone_number: userParam.phone_number }).select('-hash');
    } else {
      // copy userParam properties to user
      Object.assign(user, userParam);
      if (
        user.phone_number == "1111111111" ||
        user.phone_number == "9810184062"
      ) {
        user.otp = "1111";
      } else {
        user.otp = createotp(4, userParam.phone_number, user.otp);
        let message =
          "Your one time password for Sampark Smart Shala is " +
          user.otp +
          ". Verify to sign in!"; //+" is your OTP for Smart Shala. This is usable once and please DO NOT share with anyone.";
        sendsms(message, userParam.phone_number);
      }
      await user.save();
      //return await User.findOne({ phone_number: userParam.phone_number }).select('-hash');
    }
    const user1 = await User.findOne({ phone_number: userParam.phone_number });
    if (user1) {
      let discode = "";
      if (user1.diseCode.length == 10) {
        discode = "0" + user1.diseCode;
      } else {
        discode = user1.diseCode;
      }
      const school = await School.find({ diseCode: discode });
      const { _id, hash, ...userWithoutHash } = user1.toObject();
      const id = _id;
      const token = jwt.sign({ sub: user1.id }, config.secret);
      const profile_pic =
        user1.hasOwnProperty("image") &&
        user1.image != "" &&
        user1.image != null
          ? config.repositoryHost + user1.image
          : config.user_image;
      const is_usertype_exists = user1.usertype == "" ? false : true;
      const is_registered =
        user1.firstName == "" || user1.pincode == "" ? false : true;
      stateDistrict = await getStateDistrict(user1);
      statename = stateDistrict[0];
      districtname = stateDistrict[1];
      baithakupload = stateDistrict[2];
      certificateavailable = stateDistrict[3];
      ncertname = stateDistrict[4];
      district = stateDistrict[5];
      block = stateDistrict[6];
      helpline_no = stateDistrict[7];
      defer.resolve({
        id,
        ...userWithoutHash,
        token,
        profile_pic,
        is_usertype_exists,
        is_registered,
        statename,
        districtname,
        schoolname: school && school.length ? school[0].schoolName : "",
        baithakupload,
        certificateavailable,
        ncertname,
        district,
        block,
        isOTPServiceWorking: config.isOTPServiceWorking,
        helpline_no,
      });
    } else {
      defer.reject("user not saved");
    }
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
}

async function verify(userParam) {
  let defer = require("q").defer();
  try {
    const user = await User.findById(userParam.id);

    // validate
    if (!user) {
      defer.reject("User not found");
    } else if (!user.is_active) {
      defer.reject("User has been blocked");
    } else if (user.phone_number !== userParam.phone_number) {
      defer.reject("Invalid User");
    } else if (user.is_verified) {
      defer.reject("User already verified");
    } else if (user.otp !== userParam.otp) {
      defer.reject("Invalid OTP");
    } else {
      // copy userParam properties to user
      Object.assign(user, userParam);
      if (userParam.usertype && userParam.usertype !== "") {
        user.usertype = userParam.usertype;
      }
      user.is_verified = true;
      user.otp = "----";
      await user.save();

      const user1 = await User.findOne({
        phone_number: userParam.phone_number,
      });
      if (user1) {
        const { _id, hash, ...userWithoutHash } = user1.toObject();
        const id = _id;
        const token = jwt.sign({ sub: user1.id }, config.secret);
        const profile_pic =
          user1.hasOwnProperty("image") &&
          user1.image != "" &&
          user1.image != null
            ? config.repositoryHost + user1.image
            : config.user_image;
        const is_usertype_exists = user1.usertype == "" ? false : true;
        const is_registered =
          user1.firstName == "" || user1.pincode == "" ? false : true;
        stateDistrict = await getStateDistrict(user1);
        statename = stateDistrict[0];
        districtname = stateDistrict[1];
        baithakupload = stateDistrict[2];
        certificateavailable = stateDistrict[3];
        ncertname = stateDistrict[4];
        defer.resolve({
          id,
          ...userWithoutHash,
          token,
          profile_pic,
          is_usertype_exists,
          is_registered,
          statename,
          districtname,
          baithakupload,
          certificateavailable,
          ncertname,
        });
      } else {
        defer.reject("");
      }
    }
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
}

async function update_usertype(userParam) {
  let defer = require("q").defer();

  try {
    const user = await User.findById(userParam.id);

    // validate
    if (!user) defer.reject("User not found");
    if (user.phone_number !== userParam.phone_number) {
      defer.reject("Invalid User");
    }
    // copy userParam properties to user
    Object.assign(user, userParam);
    await user.save();

    const user1 = await User.findOne({ phone_number: userParam.phone_number });
    if (user1) {
      const { _id, hash, ...userWithoutHash } = user1.toObject();
      const id = _id;
      const profile_pic =
        user1.image != "" && user1.image != null
          ? config.repositoryHost + user1.image
          : config.user_image;
      const token = jwt.sign({ sub: user1.id }, config.secret);
      const is_usertype_exists = user1.usertype == "" ? false : true;
      const is_registered =
        user1.firstName == "" || user1.pincode == "" ? false : true;
      stateDistrict = await getStateDistrict(user1);
      statename = stateDistrict[0];
      districtname = stateDistrict[1];
      baithakupload = stateDistrict[2];
      certificateavailable = stateDistrict[3];
      ncertname = stateDistrict[4];
      defer.resolve({
        id,
        ...userWithoutHash,
        token,
        profile_pic,
        is_usertype_exists,
        is_registered,
        statename,
        districtname,
        baithakupload,
        certificateavailable,
        ncertname,
      });
    }
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
}

async function verify_login(userParam) {
  const user = await User.findById(userParam.id);

  // validate
  if (!user) throw "User not found";

  if (!user.is_active) {
    throw "User has been blocked";
  }

  if (user.phone_number !== userParam.phone_number) {
    throw "Invalid User";
  }
  if (user.otp !== userParam.otp) {
    throw "Invalid OTP";
  }
  // copy userParam properties to user
  Object.assign(user, userParam);
  user.is_verified = true;
  user.otp = "----";
  await user.save();

  const user1 = await User.findOne({ phone_number: userParam.phone_number });
  if (user1) {
    let discode = "";
    if (user1.diseCode.length == 10) {
      discode = "0" + user1.diseCode;
    } else {
      discode = user1.diseCode;
    }
    const dbschool = await School.find({ diseCode: discode });
    const { _id, hash, ...userWithoutHash } = user1.toObject();
    const id = _id;
    const profile_pic =
      user1.image != "" && user1.image != null
        ? config.repositoryHost + user1.image
        : config.user_image;
    const token = jwt.sign({ sub: user1.id }, config.secret);
    const is_usertype_exists = user1.usertype == "" ? false : true;
    const is_registered =
      user1.firstName == "" || user1.pincode == "" ? false : true;

    stateDistrict = await getStateDistrict(user1);
    statename = stateDistrict[0];
    districtname = stateDistrict[1];
    baithakupload = stateDistrict[2];
    certificateavailable = stateDistrict[3];
    ncertname = stateDistrict[4];
    district = stateDistrict[5];
    block = stateDistrict[6];
    helpline_no = stateDistrict[7];
    return {
      id,
      ...userWithoutHash,
      token,
      profile_pic,
      is_usertype_exists,
      is_registered,
      statename,
      districtname,
      schoolname: dbschool && dbschool.length ? dbschool[0].schoolName : "",
      baithakupload,
      certificateavailable,
      ncertname,
      district,
      block,
      helpline_no,
    };
  }
}

async function update(id, userParam) {
  let defer = require("q").defer();
  try {
    const user = await User.findById(id);
    let classes = userParam["classes"];
    let subjects = userParam["subjects"];
    let userclasses = [];
    let usersubjects = [];
    for (var i = 0; i < classes.length; i++) {
      userclasses.push(classes[i]["id"]);
    }
    for (var i = 0; i < subjects.length; i++) {
      usersubjects.push(subjects[i]["id"]);
    }

    // validate
    if (!user) throw "User not found";
    if (
      user.phone_number !== userParam.phone_number &&
      (await User.findOne({ phone_number: userParam.phone_number }))
    ) {
      throw 'Username "' + userParam.phone_number + '" is already taken';
    }
    if (userParam.schoolCode) {
      userParam.diseCode = userParam.schoolCode;
      // changes made by Devendra
      const school = await School.findOne({ diseCode: userParam.diseCode });
      if (school) {
        const schoolId = school._id ? school._id : "";
        const schoolName =
          school.schoolName && school.schoolName !== ""
            ? school.schoolName
            : "";
        await User.updateOne(
          { _id: id },
          { $set: { schoolName: schoolName, schoolId: schoolId } }
        );
      }
      // user.schoolId = schoolId;
      // user.schoolName = schoolName;
    }
    if (userParam.block == "blocked") {
      delete userParam.block;
    }
    if (userParam.district == "blocked") {
      delete userParam.district;
    }
    if (userParam.cluster == "blocked") {
      delete userParam.cluster;
    }

    if (userParam.state && userParam.state !== "") {
      user_state = await State.findById(userParam.state);
      if (userParam.diseCode && userParam.diseCode !== "") {
        if (!userParam.diseCode.startsWith(user_state.code)) {
          throw "Dise Code does not belongs to " + user_state.name;
        }
      }
    }
    // hash password if it was entered
    if (userParam.password) {
      userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }
    let pin_response_body = await getPinDetails(
      userParam.pincode,
      user_state.name
    );

    let pin_json = JSON.parse(pin_response_body);
    if (pin_json[0]["Status"] == "Success") {
      var pin_details = pin_json[0]["PostOffice"][0];
    } else {
      if (pin_json[0]["Message"] == "No records found") {
        throw "Pincode does not exists.";
      } else {
        throw "Unable to verify pincode. Try again later";
      }
    }

    if (
      !userParam.state ||
      userParam.state == "" ||
      userParam.state == "null"
    ) {
      userParam.state = pin_details.State;
    } else {
      if (user_state.name.toLowerCase() != pin_details.State.toLowerCase()) {
        throw "Pincode does not belong to the selected state.";
      }
    }
    userdistrictname = "";
    if (userParam.lastName)
      userParam.fullName =
        userParam.firstName.trim() + " " + userParam.lastName.trim();
    else userParam.fullName = userParam.firstName.trim();

    if (userParam.district && userParam.district !== "") {
      user_district = await District.findById(userParam.district);
      userdistrictname = user_district ? user_district.name : "";
    }
    if (userdistrictname == "") {
      userParam.location = pin_details.District + ", " + pin_details.State;
    } else {
      userParam.location = userdistrictname + ", " + pin_details.State;
    }

    userParam.classes = userclasses;
    userParam.subjects = usersubjects;
    userParam.updatedDate = new Date();
    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
    const { _id, hash, ...userWithoutHash } = user.toObject();
    const profile_pic =
      user.image != "" && user.image != null
        ? config.repositoryHost + user.image
        : config.user_image;
    const token = jwt.sign({ sub: user.id }, config.secret);
    stateDistrict = await getStateDistrict(user);
    statename = stateDistrict[0];
    districtname = stateDistrict[1];
    baithakupload = stateDistrict[2];
    certificateavailable = stateDistrict[3];
    ncertname = stateDistrict[4];
    defer.resolve({
      id,
      ...userWithoutHash,
      token,
      profile_pic,
      statename,
      districtname,
      baithakupload,
      certificateavailable,
      ncertname,
    });
  } catch (e) {
    console.log(e);
    defer.reject(e);
  }
  return defer.promise;
}

async function update_fcmtoken(id, userParam) {
  fcm_token = userParam.fcmtoken;

  let showLandingPage = false;
  let showSparkleLandingPage = false;
  let sparklePoints = "";
  let topPercentage = "";
  let crown = "";
  try {
    const user = await User.findById(id);
    // validate
    if (!user) throw "User not found";

    if (user) {
      //Calculate showLandingPage && showSparkleLandingPage values
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      today = today.getTime();

      let registrationDate = new Date(user.registrationDate);
      registrationDate.setHours(0, 0, 0, 0);
      registrationDate = registrationDate.getTime();

      let lastLoginDate = new Date(user.lastLoginDate);
      lastLoginDate.setHours(0, 0, 0, 0);
      lastLoginDate = lastLoginDate.getTime();

      //return Math.round(Math.abs((today-registrationDate) / (24*3600*1000)));
      if (
        (today - registrationDate) / (24 * 3600 * 1000) <=
        config.landing_page_days
      ) {
        showLandingPage = true;
      } else if (today != lastLoginDate) {
        showSparkleLandingPage = true;

        //To get sparkle points of this user
        const sparkleUser = await Topteachers.findOne({ user: id });
        if (sparkleUser) {
          sparklePoints = sparkleUser.total;

          //Total number of users in this user's distrcit sorted by total
          let query = {};
          query["district"] = sparkleUser.district;
          query["usertype"] = sparkleUser.usertype;
          //query['year'] = '2021';
          let cntTopTeachers = await Topteachers.countDocuments(query);

          let limit10 =
            cntTopTeachers > 10
              ? parseInt((cntTopTeachers * 10) / 100)
              : cntTopTeachers;

          const top10Teachers = await Topteachers.find(query)
            .sort({ total: -1 })
            .limit(limit10);
          if (top10Teachers && top10Teachers.length) {
            for (var i = 0; i < top10Teachers.length; i++) {
              if (id.toString() == top10Teachers[i].user.toString()) {
                crown = "g";
                topPercentage = 10;
                break;
              }
            }
          }

          let limit20 =
            cntTopTeachers > 20
              ? parseInt((cntTopTeachers * 20) / 100)
              : cntTopTeachers;

          const top20Teachers = await Topteachers.find(query)
            .sort({ total: -1 })
            .skip(limit10)
            .limit(limit20);

          if (top20Teachers && top20Teachers.length) {
            for (var i = 0; i < top20Teachers.length; i++) {
              if (id.toString() == top20Teachers[i].user.toString()) {
                crown = "s";
                topPercentage = 20;
                break;
              }
            }
          }

          let limit30 =
            cntTopTeachers > 30
              ? parseInt((cntTopTeachers * 30) / 100)
              : cntTopTeachers;

          const top30Teachers = await Topteachers.find(query)
            .sort({ total: -1 })
            .skip(limit20)
            .limit(limit30);
          if (top30Teachers && top30Teachers.length) {
            for (var i = 0; i < top30Teachers.length; i++) {
              if (id.toString() == top30Teachers[i].user.toString()) {
                crown = "b";
                topPercentage = 30;
                break;
              }
            }
          }

          let limit50 =
            cntTopTeachers > 50
              ? parseInt((cntTopTeachers * 50) / 100)
              : cntTopTeachers;

          const top50Teachers = await Topteachers.find(query)
            .sort({ total: -1 })
            .skip(limit30)
            .limit(limit50);
          if (top50Teachers && top50Teachers.length) {
            for (var i = 0; i < top50Teachers.length; i++) {
              if (id.toString() == top50Teachers[i].user.toString()) {
                crown = "d";
                topPercentage = 50;
                break;
              }
            }
          }
        }
      }
    }

    userParam.fcm_token = fcm_token;
    userParam.lastLoginDate = new Date();

    userParam.fcm_token = fcm_token;
    // copy userParam properties to user
    userParam.updatedDate = new Date();
    Object.assign(user, userParam);

    await user.save();

    //helpline_no = (config.covid_helpline_nos[user.state.toString()]) ? config.covid_helpline_nos[user.state.toString()] : ""

    return {
      success: true,
      baithak_video_upload: config.baithak_video_upload,
      force_update: config.force_update,
      share_assessment: config.share_assessment,
      share_assessment_url: config.share_assessment_url,
      login_video_code: config.login_video_code,
      assessment_video_code: config.assessment_video_code,
      podcast_tab_title: config.podcast_tab_title,
      elearning_video_upload: config.elearning_video_upload,
      elearning_video_code: config.elearning_video_code,
      //"helpline_no": helpline_no,
      showLandingPage: showLandingPage,
      showSparkleLandingPage: showSparkleLandingPage,
      sparklePoints: sparklePoints,
      topPercentage: topPercentage,
      crownColor: crown,
    };
  } catch (e) {
    return {
      success: false,
      baithak_video_upload: config.baithak_video_upload,
      force_update: config.force_update,
      share_assessment: config.share_assessment,
      share_assessment_url: config.share_assessment_url,
      login_video_code: config.login_video_code,
      assessment_video_code: config.assessment_video_code,
      podcast_tab_title: config.podcast_tab_title,
      elearning_video_upload: config.elearning_video_upload,
      elearning_video_code: config.elearning_video_code,
      //"helpline_no": helpline_no,
      showLandingPage: showLandingPage,
      showSparkleLandingPage: showSparkleLandingPage,
      sparklePoints: sparklePoints,
      topPercentage: topPercentage,
      crownColor: crown,
    };
  }
}

async function _delete(id) {
  await User.findByIdAndRemove(id);
}

//API updated by Devendra K
async function getBadgesCount(userid) {
  try {
    if (!userid) {
      throw "Invalid Request";
    }

    const goldCountPromise = Userbadge.countDocuments({
      user: new objectId(userid),
      badge: "gold",
    });
    const silverCountPromise = Userbadge.countDocuments({
      user: new objectId(userid),
      badge: "silver",
    });
    const bronzeCountPromise = Userbadge.countDocuments({
      user: new objectId(userid),
      badge: "bronze",
    });

    const [goldBadgesCnt, silverBadgesCnt, bronzeBadgesCnt] = await Promise.all(
      [goldCountPromise, silverCountPromise, bronzeCountPromise]
    );

    return {
      goldBadgesCnt,
      silverBadgesCnt,
      bronzeBadgesCnt,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
}

//this will be used for auto login the avasar user
async function avasar(userParam) {
  let defer = require("q").defer();

  try {
    // validate
    if (!userParam.phone_number || userParam.phone_number == "") {
      userParam.phone_number = userParam.srnNo;
    }
    let parent = {};
    const checkuserphone = await User.findOne({
      phone_number: userParam.phone_number,
    });
    const checkstudent = await Student.findOne({ srnNo: userParam.srnNo });

    if (
      checkstudent &&
      checkuserphone &&
      checkstudent.parent == checkuserphone.id
    ) {
      parent = checkuserphone;
    } else if (
      checkstudent &&
      checkuserphone &&
      checkstudent.parent != checkuserphone.id
    ) {
      let updateStudent = {};
      updateStudent.parent = checkuserphone.id;
      updateStudent.updatedDate = new Date();
      Object.assign(checkstudent, updateStudent);
      await checkstudent.save();
      parent = checkuserphone;
    } else if (!checkstudent || !checkuserphone) {
      if (!checkuserphone) {
        let newUserParam = {};
        newUserParam.phone_number = userParam.phone_number;
        newUserParam.avasar_id = userParam.avasarId;
        newUserParam.firstName = userParam.parentFirstName;
        newUserParam.lastName = userParam.parentLastName;
        newUserParam.fullName =
          userParam.parentFirstName + " " + userParam.parentLastName;
        newUserParam.pincode = userParam.pincode;
        newUserParam.diseCode = userParam.diseCode;
        newUserParam.boardCode = userParam.boardCode;
        newUserParam.is_verified = true;
        newUserParam.is_new = false;
        newUserParam.usertype = "parent";
        newUserParam.registrationDate = new Date();
        newUserParam.updatedDate = new Date();
        state_code = userParam.diseCode.substr(0, 2);
        user_state = await State.findOne({ code: state_code });

        let pin_response_body = await getPinDetails(
          userParam.pincode,
          user_state.name
        );
        let pin_json = JSON.parse(pin_response_body);
        let pin_details = {};
        let district_name = "";
        if (pin_json[0]["Status"] == "Success") {
          pin_details = pin_json[0]["PostOffice"][0];
          district_name = pin_details.District + ", ";
        }

        if (user_state) {
          newUserParam.state = user_state.id;
          newUserParam.location = district_name + user_state.name;
        } else {
          if (pin_json[0]["Status"] == "Success") {
            pin_details = pin_json[0]["PostOffice"][0];
            var regEx = new RegExp(pin_details.State.toLowerCase(), "ig");
            user_pin_state = await State.find({ name: { $regex: regEx } });
            newUserParam.state = user_pin_state.id;
            newUserParam.location = district_name + user_pin_state.name;
          }
        }
        newUserParam.otp = "----";
        newUserParam.hash = bcrypt.hashSync("tempPassword54321", 10);

        let newUser = new User(newUserParam);
        await newUser.save();
        parent = newUser;
      } else {
        parent = checkuserphone;
      }
      if (!checkstudent) {
        deptName = "Class " + userParam.class;
        const departments = await Departmentmaster.find({
          module: "sa",
          name: deptName,
        }).select("id name");
        deptId = new objectId(departments[0].id);

        const student = new Student({
          parentMobile: parent.phone_number,
          srnNo: userParam.srnNo,
          childName: userParam.studentName,
          parentName: parent.fullName,
          diseCode: userParam.diseCode,
          department: deptId,
          createdDate: new Date(),
          modifiedDate: new Date(),
          createdBy: parent.id,
          modifiedBy: parent.id,
        });

        await student.save();
      } else {
        let updateStudent = {};
        updateStudent.parent = parent.id;
        updateStudent.updatedDate = new Date();
        Object.assign(checkstudent, updateStudent);
        await checkstudent.save();
      }
    }

    if (parent) {
      const { _id, hash, ...userWithoutHash } = parent.toObject();
      const id = _id;
      const token = jwt.sign({ sub: parent.id }, config.secret);
      const profile_pic =
        parent.hasOwnProperty("image") &&
        parent.image != "" &&
        parent.image != null
          ? config.repositoryHost + parent.image
          : config.user_image;
      const is_usertype_exists = parent.usertype == "" ? false : true;
      const is_registered =
        parent.firstName == "" || parent.pincode == "" ? false : true;
      stateDistrict = await getStateDistrict(parent);
      statename = stateDistrict[0];
      districtname = stateDistrict[1];
      baithakupload = stateDistrict[2];
      certificateavailable = stateDistrict[3];
      ncertname = stateDistrict[4];
      defer.resolve({
        id,
        ...userWithoutHash,
        token,
        profile_pic,
        is_usertype_exists,
        is_registered,
        statename,
        districtname,
        baithakupload,
        certificateavailable,
        ncertname,
      });
    }
  } catch (e) {
    console.log(e);
    defer.reject(e);
  }
  return defer.promise;
}
