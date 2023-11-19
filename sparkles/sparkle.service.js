const config = require("../config.json");
const db = require("../_helpers/db");
const cronmethods = require("../_helpers/cronmethods");
const User = db.User;
const School = db.School;
const Block = db.Block;
const Sparkle = db.Usersparkle;
const Qrcode = db.Qrcode;
const Topteachers = db.Topteacher;
const Teacherranks = db.Teacherrank;
const Parentranks = db.Parentrank;
const District = db.District;
const State = db.State;
const TeachersssRank = db.Teachersssrank;
const ParentsssRank = db.Parentsssrank;
const TeacherStvRank = db.Teacherstvrank;
const TeacherbaithaklikesRank = db.Teacherbaithaklikesrank;
const ParentbaithaklikesRank = db.Parentbaithaklikesrank;
const TeachercourseRank = db.Teachercourserank;
const ParentcourseRank = db.Parentcourserank;
const TeacherassessmentRank = db.Teacherassessmentrank;
const ParentassessmentRank = db.Parentassessmentrank;
const TeacherdigitaldiaryRank = db.Teacherdigitaldiaryrank;
const ParentdigitaldiaryRank = db.Parentdigitaldiaryrank;
const TeacherbonusRank = db.Teacherbonusrank;
const ParentbonusRank = db.Parentbonusrank;

const objectId = require("mongoose").Types.ObjectId;
const _ = require("underscore");

module.exports = {
  awardSparkle,
  topTeachers,
  topSchools,
  topBlocks,
  trainingCompletionSparkleUpdate,
  getMySparkles,
  getMySchoolSparkles,
  getDistrictWiseTeachersDataToShareinExcel,
  getDistrictName,
  topTeachersByState,
  topSchoolsByState,
  topDistrictsByState,
  topBlocksByState,
};

// This API will called when Spark user will visit any school
// and all teachers of this school will receive 100 Sparkle points
// This API will be called from Spark Activity Application
// No integrattion in Sampark Baithak Application
async function awardSparkle(userParam) {
  let diseCode = userParam.diseCode;
  let toDateObject = new Date();
  let monthIndex = toDateObject.getMonth();
  let fullYear = toDateObject.getFullYear();

  const teachers = await User.find(
    { diseCode: diseCode, usertype: "govt teacher" },
    { _id: 1 }
  ); // find all teachers based on disecode
  var finalTotal = config.sparkle_points_awardsparkle;

  if (teachers && teachers.length) {
    for (let i = 0; i < teachers.length; i++) {
      // get data from user sparkle table
      let userSparkleData = await Sparkle.find({
        user: teachers[i]["_id"],
        month: monthIndex,
        year: fullYear,
      });
      if (userSparkleData && userSparkleData.length) {
        userSparkleData[0]["sparkvisit"] = userSparkleData[0]["sparkvisit"]
          ? parseInt(userSparkleData[0]["sparkvisit"]) + finalTotal
          : finalTotal;
        userSparkleData[0]["total"] = userSparkleData[0]["total"]
          ? parseInt(userSparkleData[0]["total"]) + finalTotal
          : finalTotal;
        userSparkleData[0]["updatedDate"] = toDateObject;
        let useSparkleObj = new Sparkle(userSparkleData[0]);
        await useSparkleObj.save();
      } else {
        // insert new entry for user sparke
        let userSparkleObj = new Sparkle({
          user: new objectId(teachers[i]["_id"]),
          sparkvisit: finalTotal,
          total: finalTotal,
          updatedDate: new Date(),
          month: monthIndex,
          year: fullYear,
        });
        await userSparkleObj.save();
      }
    }
  }
  return { success: true };
}

async function getDistrictName(districtId) {
  let districts = await District.find({ _id: districtId }, { name: 1 });
  if (districts.length > 0) {
    return districts[0].name;
  }
}

//This is to get top 10% teachers or parents in the given district
async function topTeachers(userParam) {
  let defer = require("q").defer();
  try {
    let userdistrict = new objectId(userParam.district);
    let userType = userParam.userType;
    let endMonth = parseInt(userParam.endMonth);
    let sortOrder = userParam.sortOrder;
    const startYear = parseInt(userParam.startYear);
    let query = {};
    let queryCurrent = {};
    let queryNext = {};
    let queryCurrentYear = {};
    let queryNextYear = {};
    let sessionEndYear = startYear; //2022
    let sessionStartYear = startYear - 1; //2021

    query["$or"] = [];
    queryCurrent["$and"] = [];
    queryNext["$and"] = [];

    let today = new Date();
    if (endMonth == 0) {
      endMonth = config.session_start_month - 1;
    }
    let currentMonth = endMonth == "" ? today.getMonth() : endMonth;

    // sessionEndYear = startYear;
    // sessionStartYear = startYear - 1;

    const session_start_month = config.session_start_month; //6
    let startMonth = [];
    let endMonths = [];

    for (let i = 1; i < session_start_month; i++) {
      startMonth.push(i);
    }
    for (let j = session_start_month; j <= 12; j++) {
      endMonths.push(j);
    }
    if (currentMonth >= session_start_month) {
      sessionEndYear = startYear + 1;
      sessionStartYear = startYear;
    } else if (currentMonth < session_start_month) {
      sessionEndYear = startYear;
      sessionStartYear = startYear - 1;
    }
    //if (startYear != '') {
    //	sessionEndYear = startYear + 1;
    //	sessionStartYear = startYear;
    //console.log("sessionStartYear 4 : ",sessionStartYear)
    //}
    query["district"] = userdistrict;
    query["usertype"] = userType;

    queryCurrentYear["year"] = sessionEndYear;
    queryCurrentYear["month"] = { $in: startMonth };
    queryCurrent["$and"].push(queryCurrentYear);
    queryNextYear["year"] = sessionStartYear;
    queryNextYear["month"] = { $in: endMonths };
    queryNext["$and"].push(queryNextYear);

    query["$or"].push(queryCurrent);
    query["$or"].push(queryNext);

    //To get total count of top teachers in the district
    let cntTopTeachers = await Topteachers.countDocuments(query);

    if (cntTopTeachers > 0) {
      let limitNumber =
        cntTopTeachers > 10
          ? parseInt((cntTopTeachers * 10) / 100)
          : cntTopTeachers;

      //To get all block names in this district
      const dbBlocks = await Block.find({
        district_id: userdistrict,
        is_active: true,
      }).select("id name");

      var dbTopTeachers;

      let sortOrderVal = { total: -1 };

      dbTopTeachers = await Topteachers.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: { user: "$user" },
            total: { $sum: "$total" },
            fullName: { $first: "$fullName" },
            image: { $first: "$image" },
            year: { $first: "$year" },
            block: { $first: "$block" },
          },
        },
        { $sort: sortOrderVal },
        {
          $limit: limitNumber,
        },
        {
          $project: {
            _id: 0,
            user: "$_id",
            fullName: "$fullName",
            image: "$image",
            total: "$total",
            year: "$year",
            block: "$block",
          },
        },
      ]).collation({ locale: "en" });

      let userDistrict = await this.getDistrictName(userdistrict);

      teachers = [];

      if (sortOrder == "ascending") {
        dbTopTeachers = _.sortBy(dbTopTeachers, (item) =>
          item.fullName.toLowerCase()
        );
      } else if (sortOrder == "descending") {
        dbTopTeachers = _.sortBy(dbTopTeachers, (item) =>
          item.fullName.toLowerCase()
        ).reverse();
      }

      if (dbTopTeachers && dbTopTeachers.length) {
        for (var i = 0; i < dbTopTeachers.length; i++) {
          teacher = {};
          let blockId = "";
          teacher.id = dbTopTeachers[i]["user"]["user"];
          teacher.fullName = dbTopTeachers[i]["fullName"];
          teacher.image =
            dbTopTeachers[i]["image"] != "" && dbTopTeachers[i]["image"] != null
              ? config.repositoryHost + dbTopTeachers[i]["image"]
              : config.user_image;
          teacher.total = dbTopTeachers[i]["total"];
          teacher.year = dbTopTeachers[i]["year"];

          teacher.districtId = userdistrict;
          teacher.district = userDistrict;

          if (dbTopTeachers[i].block != null) {
            blockId = dbTopTeachers[i]["block"]
              ? dbTopTeachers[i]["block"].toString()
              : dbTopTeachers[i]["block"];
            teacher.block = blockId;
          } else {
            teacher.block = "";
          }
          //To get block name
          let blockName = _.where(dbBlocks, { id: blockId });
          teacher.blockName = blockName[0] ? blockName[0]["name"] : "";
          teachers.push(teacher);
        }
      }
      defer.resolve(teachers);
    } else {
      defer.resolve("No data found for this district");
    }
  } catch (e) {
    console.log("TOP TEACHERS ERROR : ", userParam);
    defer.resolve("Something Went Wrong. Try Again");
  }
  return defer.promise;
}

//This is to get top 20% schools in the given district
async function topSchools(userParam) {
  let defer = require("q").defer();
  try {
    let records;
    let schools = [];
    let userdistrict = new objectId(userParam.district);
    let startYear = parseInt(userParam.startYear);
    let endMonth = parseInt(userParam.endMonth);
    let sortOrder =
      userParam.sortOrder != undefined ? userParam.sortOrder : "ascending";
    let query = {};
    let queryCurrent = {};
    let queryNext = {};
    let queryCurrentYear = {};
    let queryNextYear = {};
    let sessionEndYear;
    let sessionStartYear;

    query["$or"] = [];
    queryCurrent["$and"] = [];
    queryNext["$and"] = [];

    let today = new Date();
    if (endMonth == 0) {
      endMonth = config.session_start_month - 1;
    }
    let currentMonth = endMonth == "" ? today.getMonth() : endMonth;

    sessionEndYear = today.getFullYear();
    sessionStartYear = today.getFullYear() - 1;

    let session_start_month = config.session_start_month;
    let startMonth = [];
    let endMonths = [];

    for (let i = 1; i < session_start_month; i++) {
      startMonth.push(i);
    }
    for (let j = session_start_month; j <= 12; j++) {
      endMonths.push(j);
    }
    if (currentMonth >= session_start_month) {
      sessionEndYear = today.getFullYear() + 1;
      sessionStartYear = today.getFullYear();
    } else if (currentMonth < session_start_month) {
      sessionEndYear = today.getFullYear();
      sessionStartYear = today.getFullYear() - 1;
    }

    query["district"] = userdistrict;

    queryCurrentYear["year"] = sessionEndYear;
    queryCurrentYear["month"] = { $in: startMonth };
    queryCurrent["$and"].push(queryCurrentYear);

    queryNextYear["year"] = sessionStartYear;
    queryNextYear["month"] = { $in: endMonths };
    queryNext["$and"].push(queryNextYear);

    query["$or"].push(queryCurrent);
    query["$or"].push(queryNext);

    //To get all school names in this district
    const dbSchools = await School.find({
      district: userdistrict,
      isActive: true,
    }).select("diseCode schoolName");

    let dbTopSchools = await Topteachers.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: { diseCode: "$diseCode" },
          avgTotal: { $avg: "$total" },
        },
      },
      { $sort: { avgTotal: -1 } },
    ]);

    if (dbTopSchools && dbTopSchools.length) {
      let limitNumber =
        dbTopSchools.length > 20
          ? parseInt((dbTopSchools.length * 20) / 100)
          : dbTopSchools.length;

      for (var i = 0; i < dbTopSchools.length; i++) {
        school = {};

        school.avgTotal = dbTopSchools[i]["avgTotal"];

        //To get school name
        let schoolName = _.where(dbSchools, {
          diseCode: dbTopSchools[i]["_id"]["diseCode"],
        });

        school.diseCode = dbTopSchools[i]["_id"]["diseCode"];
        school.schoolName = schoolName[0] ? schoolName[0]["schoolName"] : "";

        schools.push(school);

        if (i == limitNumber) break;
      }
    }

    if (sortOrder == "ascending") {
      records = _.sortBy(schools, (item) => item.schoolName.toLowerCase());
    } else if (sortOrder == "descending") {
      records = _.sortBy(schools, (item) =>
        item.schoolName.toLowerCase()
      ).reverse();
    }

    defer.resolve(records);
  } catch (e) {
    console.log("TOP SCHOOLS ERROR : ", userParam);
    defer.resolve("Something Went Wrong. Try Again");
  }
  return defer.promise;
}

//This is to get top 20% blocks in the given state
async function topBlocks(userParam) {
  const userstate = new objectId(userParam.state);
  const today = new Date();
  const sortOrder = userParam.sortOrder || "ascending";

  const endMonth = parseInt(userParam.endMonth) || config.session_start_month - 1;

  const currentMonth = endMonth === 0 ? today.getMonth() : endMonth;
  const sessionEndYear =
    currentMonth >= config.session_start_month
      ? today.getFullYear() + 1
      : today.getFullYear();
  const sessionStartYear =
    currentMonth < config.session_start_month
      ? today.getFullYear() - 1
      : today.getFullYear();

  const startMonth = Array.from({ length: config.session_start_month - 1 }, (_, i) => i + 1);
  const endMonths = Array.from({ length: 12 - config.session_start_month + 1 }, (_, i) => config.session_start_month + i);

  const query = {
    $or: [
      {
        $and: [
          { year: sessionEndYear },
          { month: { $in: startMonth } },
          { state: userstate },
        ],
      },
      {
        $and: [
          { year: sessionStartYear },
          { month: { $in: endMonths } },
          { state: userstate },
        ],
      },
    ],
  };

  // To get all block names in this state
  const dbBlocks = await Block.find({
    state_id: userstate,
    is_active: true,
  }).select("id name");

  const dbTopBlocks = await Topteachers.aggregate([
    { $match: query },
    {
      $group: {
        _id: { block: "$block" },
        avgTotal: { $avg: "$total" },
      },
    },
    { $sort: { avgTotal: -1 } },
    { $limit: 20 },
  ]);

  const blocks = dbTopBlocks.map((dbTopBlock) => {
    const blockId = dbTopBlock._id.block ? dbTopBlock._id.block.toString() : dbTopBlock._id.block;

    // To get block name
    const blockName = _.findWhere(dbBlocks, { id: blockId });

    return {
      id: blockId,
      avgTotal: dbTopBlock.avgTotal,
      blockName: blockName ? blockName.name : "",
    };
  });

  const records = _.sortBy(blocks, (item) => item.blockName.toLowerCase());
  return sortOrder === "descending" ? records.reverse() : records;
}


// On successful completion of training teacher gets QR codes which contain sparkle points.
//on scanning QR code the sparkle points will be added to teachers account
// This API will be called from Baithak application
async function trainingCompletionSparkleUpdate(userParam) {
  let user = userParam.user;
  let qrCode = userParam.qrCode;
  let toDateObject = new Date();
  let monthIndex = toDateObject.getMonth();
  let fullYear = toDateObject.getFullYear();
  var msg, status;

  // check if teacher has already scanned given QR code
  const teachers = await Qrcode.countDocuments({ qrCode: qrCode, user: user });

  if (teachers == 0) {
    const points = config.sparkle_points_trainingcomplete;

    let qrCodeObj = new Qrcode({
      user: user,
      qrCode: qrCode,
      createdDate: new Date(),
    });
    await qrCodeObj.save();

    // update user sparkle table for this teacher

    // get data from user sparkle table
    let userSparkleData = await Sparkle.find({
      user: user,
      month: monthIndex,
      year: fullYear,
    });

    if (userSparkleData && userSparkleData.length) {
      userSparkleData[0]["training"] = userSparkleData[0]["training"]
        ? parseInt(userSparkleData[0]["training"]) + points
        : points;
      userSparkleData[0]["total"] = userSparkleData[0]["total"]
        ? parseInt(userSparkleData[0]["total"]) + points
        : points;
      userSparkleData[0]["updatedDate"] = toDateObject;
      let useSparkleObj = new Sparkle(userSparkleData[0]);
      await useSparkleObj.save();
    } else {
      // insert new entry for user sparke
      let userSparkleObj = new Sparkle({
        user: user,
        training: points,
        total: points,
        updatedDate: new Date(),
        month: monthIndex,
        year: fullYear,
      });
      await userSparkleObj.save();
    }

    msg = "successfully scanned.";
    status = true;
  } else {
    msg = "This teacher has already scanned, can not scan again.";
    status = false;
  }

  return {
    status: status,
    message: msg,
  };
}

//Sparkle detail for a user
async function getMySparkles(userParam) {
  let defer = require("q").defer();
  let mySparkles = [];
  let mySparkle = {};
  try {
    const user = new objectId(userParam.user);
    const userType = userParam.userType;
    const district =
      userParam.district != "" ? new objectId(userParam.district) : "";
    let topPercentage = "";
    let nextAchievement = {};
    let collectionName;

    if (userType == "govt teacher") {
      collectionName = Teacherranks;
    } else {
      collectionName = Parentranks;
    }

    let today = new Date();
    let mm = today.getMonth();
    let currentMonth = mm + 1;
    let currentYear = today.getFullYear();

    let TeacherranksData = await collectionName.find(
      { user: user, month: currentMonth, year: currentYear },
      { rank: 1, grandTotal: 1 }
    );

    if (TeacherranksData.length > 0) {
      let rank = TeacherranksData[0].rank;
      let grandTotal = TeacherranksData[0].grandTotal;
      if (rank <= 10) {
        topPercentage = "10%";
        nextAchievement = {
          sparkles: "",
          nextCrown: "You already have Gold Crown",
        };
      } else if (rank > 10 && rank <= 20) {
        topPercentage = "20%";
        nextAchievement = {
          sparkles: await getSparkleDifference(
            10,
            district,
            grandTotal,
            userType
          ),
          nextCrown: "Gold",
        };
      } else if (rank > 20 && rank <= 30) {
        topPercentage = "30%";
        nextAchievement = {
          sparkles: await getSparkleDifference(
            20,
            district,
            grandTotal,
            userType
          ),
          nextCrown: "Silver",
        };
      } else if (rank > 30 && rank <= 50) {
        topPercentage = "50%";
        nextAchievement = {
          sparkles: await getSparkleDifference(
            30,
            district,
            grandTotal,
            userType
          ),
          nextCrown: "Bronze",
        };
      } else {
        topPercentage = "No Rank";
        nextAchievement = {
          sparkles: await getSparkleDifference(
            50,
            district,
            grandTotal,
            userType
          ),
          nextCrown: "Dotted",
        };
      }
    }
    mySparkle["topInDistrict"] = topPercentage;
    mySparkle["nextAchievement"] = {};
    mySparkle["nextAchievement"] = nextAchievement;

    const getSessionData = await cronmethods.getSessionData(
      currentYear,
      currentMonth,
      user
    );

    let userSparkleData = await Sparkle.aggregate([
      {
        //	$match: {
        //		user: user,
        //	},
        $match: getSessionData, //24 March 2023 - Commented this till Sandeep confirms to enable again
      },
      {
        $group: {
          _id: { user: "$user" },
          grandTotal: { $sum: "$total" },
          sssTotal: { $sum: "$sss" },
          baithakLikesTotal: { $sum: "$baithakLikes" },
          baithakCommentsTotal: { $sum: "$baithakComments" },
          courseTotal: { $sum: "$course" },
          assessmentTotal: { $sum: "$assessment" },
          digitalDiaryTotal: { $sum: "$digitalDiary" },
          trainingTotal: { $sum: "$training" },
          sparkvisitTotal: { $sum: "$sparkvisit" },
          surveyTotal: { $sum: "$survey" },
          postFromSSS: { $sum: "$postFromSSS" },
          stv: { $sum: "$stv" },
        },
      },
      {
        $project: {
          _id: 0,
          user: user,
          grandTotal: "$grandTotal",
          sssTotal: "$sssTotal",
          baithakTotal: {
            $add: [
              "$baithakLikesTotal",
              "$baithakCommentsTotal",
              "$postFromSSS",
            ],
          },
          courseTotal: "$courseTotal",
          assessmentTotal: "$assessmentTotal",
          digitalDiaryTotal: "$digitalDiaryTotal",
          bonusSpakleTotal: {
            $add: ["$trainingTotal", "$sparkvisitTotal", "$surveyTotal"],
          },
          stv: "$stv",
        },
      },
    ]);

    console.log("getSessionData - - - -  -", JSON.stringify(getSessionData));
    console.log("userSparkleData - - - - -", userSparkleData);
    if (userSparkleData && userSparkleData.length > 0) {
      mySparkle["grandTotal"] = userSparkleData[0].grandTotal;
      mySparkle["sss"] = {};
      mySparkle["baithak"] = {};
      mySparkle["courses"] = {};
      mySparkle["didiksawal"] = {};
      mySparkle["digitalDiary"] = {};
      mySparkle["bonusSparkle"] = {};
      mySparkle["stv"] = {};

      mySparkle["sss"]["topic"] =
        userSparkleData[0].sssTotal / config.sparkle_points_sss;
      mySparkle["sss"]["sparkles"] = userSparkleData[0].sssTotal;
      mySparkle["sss"]["top"] = await getModuleTopPercentage(
        user,
        "sss",
        userType
      );

      mySparkle["baithak"]["topic"] = userSparkleData[0].baithakTotal;
      mySparkle["baithak"]["sparkles"] = userSparkleData[0].baithakTotal;
      mySparkle["baithak"]["top"] = await getModuleTopPercentage(
        user,
        "baithak",
        userType
      );

      mySparkle["courses"]["topic"] =
        userSparkleData[0].courseTotal / config.sparkle_points_elearning;
      mySparkle["courses"]["sparkles"] = userSparkleData[0].courseTotal;
      mySparkle["courses"]["top"] = await getModuleTopPercentage(
        user,
        "courses",
        userType
      );

      mySparkle["didiksawal"]["topic"] =
        userSparkleData[0].assessmentTotal / config.sparkle_points_assessment;
      mySparkle["didiksawal"]["sparkles"] = userSparkleData[0].assessmentTotal;
      mySparkle["didiksawal"]["top"] = await getModuleTopPercentage(
        user,
        "assessment",
        userType
      );

      mySparkle["digitalDiary"]["topic"] =
        userSparkleData[0].digitalDiaryTotal /
        config.sparkle_points_digitaldiaryplandone;
      mySparkle["digitalDiary"]["sparkles"] =
        userSparkleData[0].digitalDiaryTotal;
      mySparkle["digitalDiary"]["top"] = await getModuleTopPercentage(
        user,
        "digitaldiary",
        userType
      );

      mySparkle["bonusSparkle"]["topic"] = userSparkleData[0].bonusSpakleTotal;
      mySparkle["bonusSparkle"]["sparkles"] =
        userSparkleData[0].bonusSpakleTotal;
      mySparkle["bonusSparkle"]["top"] = await getModuleTopPercentage(
        user,
        "bonus",
        userType
      );

      mySparkle["stv"]["topic"] =
        userSparkleData[0].stv / config.sparkle_points_stv;
      mySparkle["stv"]["sparkles"] = userSparkleData[0].stv;
      mySparkle["stv"]["top"] = await getModuleTopPercentage(
        user,
        "stv",
        userType
      );
    }

    mySparkles.push(mySparkle);

    defer.resolve(mySparkles);
  } catch (e) {
    console.log("GET MY SPARKLES ERROR : ", e);
    defer.resolve("Something Went Wrong. Try Again");
  }
  return defer.promise;
}

async function getModuleTopPercentage(userId, module, userType) {
  let moduleRank = 0;
  let defer = require("q").defer();

  try {
    let sssCollectionName;
    let baithakCollationName;
    let courseCollectionName;
    let stvCollectionName;

    if (userType == "govt teacher") {
      sssCollectionName = TeachersssRank;
      baithakCollationName = TeacherbaithaklikesRank;
      courseCollectionName = TeachercourseRank;
      assessmentCollectionName = TeacherassessmentRank;
      digitalDiaryCollectionName = TeacherdigitaldiaryRank;
      bonusCollectionName = TeacherbonusRank;
      stvCollectionName = TeacherStvRank;
    } else {
      sssCollectionName = ParentsssRank;
      baithakCollationName = ParentbaithaklikesRank;
      courseCollectionName = ParentcourseRank;
      assessmentCollectionName = ParentassessmentRank;
      digitalDiaryCollectionName = ParentdigitaldiaryRank;
      bonusCollectionName = ParentbonusRank;
    }
    if (module == "sss") {
      let sss = await sssCollectionName.find({ user: userId }, { sssRank: 1 });
      if (sss.length) {
        moduleRank = Math.round(sss[0].sssRank);
      }
    }
    if (module == "baithak") {
      let baithaklikes = await baithakCollationName.find(
        { user: userId },
        { baithaklikesRank: 1 }
      );
      if (
        baithaklikes.length &&
        baithaklikes[0].baithaklikesRank != undefined
      ) {
        moduleRank = Math.round(baithaklikes[0].baithaklikesRank);
      }
    }
    if (module == "courses") {
      let courses = await courseCollectionName.find(
        { user: userId },
        { courseRank: 1 }
      );
      if (courses.length && courses[0].courseRank != undefined) {
        moduleRank = Math.round(courses[0].courseRank);
      }
    }
    if (module == "assessment") {
      let assessments = await assessmentCollectionName.find(
        { user: userId },
        { assessmentRank: 1 }
      );
      if (assessments.length && assessments[0].assessmentRank != undefined) {
        moduleRank = Math.round(assessments[0].assessmentRank);
      }
    }
    if (module == "digitaldiary") {
      let digitaldiary = await digitalDiaryCollectionName.find(
        { user: userId },
        { digitalDiaryRank: 1 }
      );
      if (
        digitaldiary.length &&
        digitaldiary[0].digitalDiaryRank != undefined
      ) {
        moduleRank = Math.round(digitaldiary[0].digitalDiaryRank);
      }
    }
    if (module == "bonus") {
      let bonus = await bonusCollectionName.find(
        { user: userId },
        { bonusRank: 1 }
      );
      if (bonus.length && bonus[0].bonusRank != undefined) {
        moduleRank = Math.round(bonus[0].bonusRank);
      }
    }
    if (module == "stv" && userType == "govt teacher") {
      let stv = await stvCollectionName.find({ user: userId }, { stvRank: 1 });
      if (stv.length && stv[0].stvRank != undefined) {
        moduleRank = Math.round(stv[0].stvRank);
      }
    }
    defer.resolve(moduleRank);
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
}

async function getSparkleDifference(
  range,
  district,
  currentgrandTotal,
  userType
) {
  let defer = require("q").defer();
  let difference = 0;

  let today = new Date();
  let mm = today.getMonth();
  let currentMonth = mm + 1;
  let currentYear = today.getFullYear();

  try {
    if (userType == "govt teacher") {
      collectionName = Teacherranks;
    } else {
      collectionName = Parentranks;
    }
    let getAboveRange = await collectionName
      .find(
        {
          month: currentMonth,
          year: currentYear,
          district: district,
          rank: { $lt: range },
        },
        { grandTotal: 1 }
      )
      .sort({ grandTotal: -1 })
      .limit(1);

    if (getAboveRange.length > 0) {
      let getAboveRangeGrandTotal = getAboveRange[0].grandTotal;
      difference = getAboveRangeGrandTotal - currentgrandTotal;
      if (difference < 0) {
        difference = "-";
      }
    }
    defer.resolve(difference);
  } catch (e) {
    defer.reject(e);
  }
  return defer.promise;
}

async function getMySchoolSparkles(userParam) {
  const diseCode = userParam.diseCode;
  const mySchoolSparkles = [];

  const userProjection = {
    _id: 1,
  };

  const schoolUsers = await User.find({ diseCode }, userProjection);
  const finalArr = schoolUsers.map((user) => user._id);

  const schoolUsersSparkles = await Sparkle.find({ user: { $in: finalArr } });

  let totalSparkles = 0;
  let totalsssSparkles = 0;
  let baithakLikes = 0;
  let baithakComments = 0;
  let totalcourseSparkles = 0;
  let totaldidiksawalSparkles = 0;
  let totaldigitalDiarySparkles = 0;
  let training = 0;
  let sparkvisit = 0;
  let survey = 0;
  let totalStvSparkles = 0;

  for (const schoolUsersSparkle of schoolUsersSparkles) {
    totalSparkles += schoolUsersSparkle.total || 0;
    totalsssSparkles += schoolUsersSparkle.sss || 0;
    baithakLikes += schoolUsersSparkle.baithakLikes || 0;
    baithakComments += schoolUsersSparkle.baithakComments || 0;
    totalcourseSparkles += schoolUsersSparkle.course || 0;
    totaldidiksawalSparkles += schoolUsersSparkle.assessment || 0;
    totaldigitalDiarySparkles += schoolUsersSparkle.digitalDiary || 0;
    training += schoolUsersSparkle.training || 0;
    sparkvisit += schoolUsersSparkle.sparkvisit || 0;
    survey += schoolUsersSparkle.survey || 0;
    totalStvSparkles += schoolUsersSparkle.stv || 0;
  }

  const totalbaithakSparkles = baithakLikes + baithakComments;
  const totalbonusSparkles = training + sparkvisit + survey;

  const mySchoolSparkle = {
    grandTotal: totalSparkles,
    sss: {
      topic: totalsssSparkles / config.sparkle_points_sss,
      sparkles: totalsssSparkles,
    },
    baithak: {
      topic: totalbaithakSparkles,
      sparkles: totalbaithakSparkles,
    },
    courses: {
      topic: totalcourseSparkles / config.sparkle_points_elearning,
      sparkles: totalcourseSparkles,
    },
    didiksawal: {
      topic: totaldidiksawalSparkles / config.sparkle_points_assessment,
      sparkles: totaldidiksawalSparkles,
    },
    digitalDiary: {
      topic:
        totaldigitalDiarySparkles / config.sparkle_points_digitaldiaryplandone,
      sparkles: totaldigitalDiarySparkles,
    },
    bonusSparkle: {
      topic: totalbonusSparkles,
      sparkles: totalbonusSparkles,
    },
    stv: {
      topic: totalStvSparkles / config.sparkle_points_stv,
      sparkles: totalStvSparkles,
    },
  };

  mySchoolSparkles.push(mySchoolSparkle);
  return mySchoolSparkles;
}

async function getDistrictWiseTeachersDataToShareinExcel(userParam) {
  let finaluserRankData = [];
  let pageNumber = userParam.pageNumber;
  let NumberOfRecordsPerPage = userParam.NumberOfRecordsPerPage;
  let userType = userParam.userType;
  let startYear = userParam.startYear;
  let endMonth = userParam.endMonth;
  let newarr = [];

  const AllDistricts = await District.find({}, { _id: 1, name: 1 }).sort({
    name: 1,
  });

  if (AllDistricts && AllDistricts.length > 0) {
    for (let y = 0; y < AllDistricts.length; y++) {
      userParam.district = AllDistricts[y]._id;
      userParam.userType = userType;
      userParam.startYear = startYear;
      userParam.endMonth = endMonth;
      newarr = await this.topTeachers(userParam);

      userRankData = await customPagination(
        newarr,
        pageNumber,
        NumberOfRecordsPerPage
      );

      if (userRankData.total > 0) {
        userRankData = userRankData.data;
        for (let j = 0; j < userRankData.length; j++) {
          let temp = {};

          let userId = userRankData[j].id;
          let districtId = userRankData[j].districtId;
          let stateName;

          let districtData = await District.findOne(
            { _id: districtId },
            { state_id: 1, _id: 0 }
          );

          if (districtData) {
            stateData = await State.findOne(
              { _id: districtData.state_id },
              { name: 1, _id: 0 }
            );
            stateName = stateData.name;
          }

          temp["uderId"] = userId;
          temp["userFullName"] = userRankData[j].fullName;
          temp["districtName"] = userRankData[j].district;
          temp["stateName"] = stateName;
          temp["total"] = userRankData[j].total;
          temp["sss"] = 0;
          temp["baithakLikesComments"] = 0;
          temp["course"] = 0;
          temp["assessment"] = 0;
          temp["digitalDiary"] = 0;
          temp["bonus"] = 0;
          let baithakCommentsTotal = 0;

          let sssQuery = await TeachersssRank.findOne(
            { user: userId },
            { sssTotal: 1, _id: 0 }
          );
          if (sssQuery) {
            sssTotal = sssQuery.sssTotal;
            temp["sss"] = sssTotal;
          }

          let baithakLikesQuery = await TeacherbaithaklikesRank.findOne(
            { user: userId },
            { baithaklikesTotal: 1, _id: 0 }
          );

          let baithakCommentsQuery = await Sparkle.aggregate([
            {
              $match: {
                user: userId,
              },
            },
            {
              $group: {
                _id: null,
                baithakComments: { $sum: "$baithakComments" },
              },
            },
          ]);

          if (baithakCommentsQuery != "") {
            baithakCommentsTotal = baithakCommentsQuery[0].baithakComments;
            temp["baithakLikesComments"] = baithakCommentsTotal;
          }

          if (baithakLikesQuery) {
            baithakLikesTotal = baithakLikesQuery.baithaklikesTotal;
            temp["baithakLikesComments"] =
              baithakLikesTotal + baithakCommentsTotal;
          }

          let courseQuery = await TeachercourseRank.findOne(
            { user: userId },
            { courseTotal: 1, _id: 0 }
          );
          if (courseQuery) {
            courseTotal = courseQuery.courseTotal;
            temp["course"] = courseTotal;
          }

          let assessmentQuery = await TeacherassessmentRank.findOne(
            { user: userId },
            { assessmentTotal: 1, _id: 0 }
          );
          if (assessmentQuery) {
            assessmentTotal = assessmentQuery.assessmentTotal;
            temp["assessment"] = assessmentTotal;
          }

          let digitalDiaryQuery = await TeacherdigitaldiaryRank.findOne(
            { user: userId },
            { digitalDiaryTotal: 1, _id: 0 }
          );
          if (digitalDiaryQuery) {
            digitalDiaryTotal = digitalDiaryQuery.digitalDiaryTotal;
            temp["digitalDiary"] = digitalDiaryTotal;
          }

          let bonusQuery = await TeacherbonusRank.findOne(
            { user: userId },
            { bonusTotal: 1, _id: 0 }
          );
          if (bonusQuery) {
            bonusTotal = bonusQuery.bonusTotal;
            temp["bonus"] = bonusTotal;
          }

          finaluserRankData.push(temp);
        }
      }
    }
    return finaluserRankData;
  }
}

async function customPagination(items, current_page, per_page_items) {
  let page = current_page || 1,
    per_page = per_page_items || 10,
    offset = (page - 1) * per_page,
    paginatedItems = items.slice(offset).slice(0, per_page_items),
    total_pages = Math.ceil(items.length / per_page);

  return {
    page: page,
    per_page: per_page,
    pre_page: page - 1 ? page - 1 : null,
    next_page: total_pages > page ? page + 1 : null,
    total: items.length,
    total_pages: total_pages,
    data: paginatedItems,
  };
}

async function topTeachersByState(userParam) {
  let defer = require("q").defer();
  try {
    let userstate = new objectId(userParam.state);
    let userType = userParam.userType;
    let endMonth = parseInt(userParam.endMonth);
    let sortOrder = userParam.sortOrder;
    let query = {};
    let queryCurrent = {};
    let queryNext = {};
    let queryCurrentYear = {};
    let queryNextYear = {};
    let sessionEndYear;
    let sessionStartYear;

    query["$or"] = [];
    queryCurrent["$and"] = [];
    queryNext["$and"] = [];

    let today = new Date();
    if (endMonth == 0) {
      endMonth = config.session_start_month - 1;
    }
    let currentMonth = endMonth == "" ? today.getMonth() : endMonth;

    sessionEndYear = today.getFullYear();
    sessionStartYear = today.getFullYear() - 1;

    let session_start_month = config.session_start_month;
    let startMonth = [];
    let endMonths = [];

    for (let i = 1; i < session_start_month; i++) {
      startMonth.push(i);
    }
    for (let j = session_start_month; j <= 12; j++) {
      endMonths.push(j);
    }
    if (currentMonth >= session_start_month) {
      sessionEndYear = today.getFullYear() + 1;
      sessionStartYear = today.getFullYear();
    } else if (currentMonth < session_start_month) {
      sessionEndYear = today.getFullYear();
      sessionStartYear = today.getFullYear() - 1;
    }
    //if (startYear != '') {
    //	sessionEndYear = startYear + 1;
    //	sessionStartYear = startYear;
    //console.log("sessionStartYear 4 : ",sessionStartYear)
    //}
    query["state"] = userstate;
    query["usertype"] = userType;

    queryCurrentYear["year"] = sessionEndYear;
    queryCurrentYear["month"] = { $in: startMonth };
    queryCurrent["$and"].push(queryCurrentYear);
    queryNextYear["year"] = sessionStartYear;
    queryNextYear["month"] = { $in: endMonths };
    queryNext["$and"].push(queryNextYear);

    query["$or"].push(queryCurrent);
    query["$or"].push(queryNext);

    //To get total count of top teachers in the state
    let cntTopTeachers = await Topteachers.countDocuments(query);

    if (cntTopTeachers > 0) {
      let limitNumber =
        cntTopTeachers > 10
          ? parseInt((cntTopTeachers * 10) / 100)
          : cntTopTeachers;

      //To get all block names & district names in this state
      const dbBlocks = await Block.find({
        state_id: userstate,
        is_active: true,
      }).select("id name");
      const dbDistricts = await District.find({
        state_id: userstate,
        is_active: true,
      }).select("id name");

      var dbTopTeachers;

      let sortOrderVal = { total: -1 };

      dbTopTeachers = await Topteachers.aggregate([
        {
          $match: query,
        },
        {
          $group: {
            _id: { user: "$user" },
            total: { $sum: "$total" },
            fullName: { $first: "$fullName" },
            image: { $first: "$image" },
            year: { $first: "$year" },
            block: { $first: "$block" },
            district: { $first: "$district" },
          },
        },
        { $sort: sortOrderVal },
        {
          $limit: limitNumber,
        },
        {
          $project: {
            _id: 0,
            user: "$_id",
            fullName: "$fullName",
            image: "$image",
            total: "$total",
            year: "$year",
            block: "$block",
            district: "$district",
          },
        },
      ]).collation({ locale: "en" });

      teachers = [];

      if (sortOrder == "ascending") {
        dbTopTeachers = _.sortBy(dbTopTeachers, (item) =>
          item.fullName.toLowerCase()
        );
      } else if (sortOrder == "descending") {
        dbTopTeachers = _.sortBy(dbTopTeachers, (item) =>
          item.fullName.toLowerCase()
        ).reverse();
      }

      if (dbTopTeachers && dbTopTeachers.length) {
        for (var i = 0; i < dbTopTeachers.length; i++) {
          teacher = {};
          let blockId = "";
          teacher.id = dbTopTeachers[i]["user"]["user"];
          teacher.fullName = dbTopTeachers[i]["fullName"];
          teacher.image =
            dbTopTeachers[i]["image"] != "" && dbTopTeachers[i]["image"] != null
              ? config.repositoryHost + dbTopTeachers[i]["image"]
              : config.user_image;
          teacher.total = dbTopTeachers[i]["total"];
          teacher.year = dbTopTeachers[i]["year"];

          if (dbTopTeachers[i].district != null) {
            districtId = dbTopTeachers[i]["district"]
              ? dbTopTeachers[i]["district"].toString()
              : dbTopTeachers[i]["district"];
            teacher.district = districtId;
          } else {
            teacher.district = "";
          }

          if (dbTopTeachers[i].block != null) {
            blockId = dbTopTeachers[i]["block"]
              ? dbTopTeachers[i]["block"].toString()
              : dbTopTeachers[i]["block"];
            teacher.block = blockId;
          } else {
            teacher.block = "";
          }
          //To get district name
          let districtName = _.where(dbDistricts, { id: districtId });
          teacher.districtName = districtName[0] ? districtName[0]["name"] : "";
          //To get block name
          let blockName = _.where(dbBlocks, { id: blockId });
          teacher.blockName = blockName[0] ? blockName[0]["name"] : "";
          teachers.push(teacher);
        }
      }
      defer.resolve(teachers);
    } else {
      defer.resolve("No data found for this district");
    }
  } catch (e) {
    console.log(e);
    console.log("TOP TEACHERS ERROR : ", userParam);
    defer.resolve("Something Went Wrong. Try Again");
  }
  return defer.promise;
}

async function topSchoolsByState(userParam) {
  let defer = require("q").defer();
  try {
    let records;
    let schools = [];
    let userstate = new objectId(userParam.state);
    let startYear = parseInt(userParam.startYear);
    let endMonth = parseInt(userParam.endMonth);
    let sortOrder = userParam.sortOrder != undefined ? userParam.sortOrder : "";
    let query = {};
    let queryCurrent = {};
    let queryNext = {};
    let queryCurrentYear = {};
    let queryNextYear = {};
    let sessionEndYear;
    let sessionStartYear;

    query["$or"] = [];
    queryCurrent["$and"] = [];
    queryNext["$and"] = [];

    let today = new Date();
    if (endMonth == 0) {
      endMonth = config.session_start_month - 1;
    }
    let currentMonth = endMonth == "" ? today.getMonth() : endMonth;

    sessionEndYear = today.getFullYear();
    sessionStartYear = today.getFullYear() - 1;

    let session_start_month = config.session_start_month;
    let startMonth = [];
    let endMonths = [];

    for (let i = 1; i < session_start_month; i++) {
      startMonth.push(i);
    }
    for (let j = session_start_month; j <= 12; j++) {
      endMonths.push(j);
    }
    if (currentMonth >= session_start_month) {
      sessionEndYear = today.getFullYear() + 1;
      sessionStartYear = today.getFullYear();
    } else if (currentMonth < session_start_month) {
      sessionEndYear = today.getFullYear();
      sessionStartYear = today.getFullYear() - 1;
    }

    query["state"] = userstate;

    queryCurrentYear["year"] = sessionEndYear;
    queryCurrentYear["month"] = { $in: startMonth };
    queryCurrent["$and"].push(queryCurrentYear);

    queryNextYear["year"] = sessionStartYear;
    queryNextYear["month"] = { $in: endMonths };
    queryNext["$and"].push(queryNextYear);

    query["$or"].push(queryCurrent);
    query["$or"].push(queryNext);

    //To get all school names in this state
    const dbSchools = await School.find({
      state: userstate,
      isActive: true,
    }).select("diseCode schoolName");

    //To get all block names & district names in this state
    const dbBlocks = await Block.find({
      state_id: userstate,
      is_active: true,
    }).select("id name");
    const dbDistricts = await District.find({
      state_id: userstate,
      is_active: true,
    }).select("id name");

    let dbTopSchools = await Topteachers.aggregate([
      {
        $match: query,
      },
      {
        $group: {
          _id: { diseCode: "$diseCode" },
          avgTotal: { $avg: "$total" },
          block: { $first: "$block" },
          district: { $first: "$district" },
        },
      },
      { $sort: { avgTotal: -1 } },
      {
        $project: {
          _id: 0,
          school: "$_id",
          avgTotal: "$avgTotal",
          block: "$block",
          district: "$district",
        },
      },
    ]);

    if (dbTopSchools && dbTopSchools.length) {
      let limitNumber =
        dbTopSchools.length > 20
          ? parseInt((dbTopSchools.length * 20) / 100)
          : dbTopSchools.length;

      for (var i = 0; i < dbTopSchools.length; i++) {
        school = {};
        school.avgTotal = dbTopSchools[i]["avgTotal"];
        let blockName = "";
        let districtName = "";
        //To get school name
        let schoolName = _.where(dbSchools, {
          diseCode: dbTopSchools[i]["school"]["diseCode"],
        });

        if (dbTopSchools[i]["block"]) {
          blockName = _.where(dbBlocks, {
            id: dbTopSchools[i]["block"].toString(),
          });
        }
        if (dbTopSchools[i]["district"]) {
          districtName = _.where(dbDistricts, {
            id: dbTopSchools[i]["district"].toString(),
          });
        }
        school.diseCode = dbTopSchools[i]["school"]["diseCode"];
        school.schoolName = schoolName[0] ? schoolName[0]["schoolName"] : "";
        school.blockName = blockName[0] ? blockName[0]["name"] : "";
        school.districtName = districtName[0] ? districtName[0]["name"] : "";

        schools.push(school);

        //if (i == limitNumber) break;
      }
    }

    if (sortOrder == "ascending") {
      records = _.sortBy(schools, (item) => item.schoolName.toLowerCase());
    } else if (sortOrder == "descending") {
      records = _.sortBy(schools, (item) =>
        item.schoolName.toLowerCase()
      ).reverse();
    } else {
      records = schools;
    }
    defer.resolve(records);
  } catch (e) {
    console.log(e);
    console.log("TOP SCHOOLS ERROR : ", userParam);
    defer.resolve("Something Went Wrong. Try Again");
  }
  return defer.promise;
}

async function topBlocksByState(userParam) {
  let userstate = new objectId(userParam.state);
  let records;
  let startYear = parseInt(userParam.startYear);
  let endMonth = parseInt(userParam.endMonth);
  let sortOrder = userParam.sortOrder != undefined ? userParam.sortOrder : "";
  let query = {};
  let queryCurrent = {};
  let queryNext = {};
  let queryCurrentYear = {};
  let queryNextYear = {};
  let sessionEndYear;
  let sessionStartYear;

  query["$or"] = [];
  queryCurrent["$and"] = [];
  queryNext["$and"] = [];

  let today = new Date();
  if (endMonth == 0) {
    endMonth = config.session_start_month - 1;
  }
  let currentMonth = endMonth == "" ? today.getMonth() : endMonth;

  sessionEndYear = today.getFullYear();
  sessionStartYear = today.getFullYear() - 1;

  let session_start_month = config.session_start_month;
  let startMonth = [];
  let endMonths = [];

  for (let i = 1; i < session_start_month; i++) {
    startMonth.push(i);
  }
  for (let j = session_start_month; j <= 12; j++) {
    endMonths.push(j);
  }
  if (currentMonth >= session_start_month) {
    sessionEndYear = today.getFullYear() + 1;
    sessionStartYear = today.getFullYear();
  } else if (currentMonth < session_start_month) {
    sessionEndYear = today.getFullYear();
    sessionStartYear = today.getFullYear() - 1;
  }
  query["state"] = userstate;

  queryCurrentYear["year"] = sessionEndYear;
  queryCurrentYear["month"] = { $in: startMonth };
  queryCurrent["$and"].push(queryCurrentYear);

  queryNextYear["year"] = sessionStartYear;
  queryNextYear["month"] = { $in: endMonths };
  queryNext["$and"].push(queryNextYear);

  query["$or"].push(queryCurrent);
  query["$or"].push(queryNext);

  //To get all block names in this state
  const dbBlocks = await Block.find({
    state_id: userstate,
    is_active: true,
  }).select("id name");

  let dbTopBlocks = await Topteachers.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: { block: "$block" },
        avgTotal: { $avg: "$total" },
      },
    },
    { $sort: { avgTotal: -1 } },
  ]);

  blocks = [];
  if (dbTopBlocks && dbTopBlocks.length) {
    let limitNumber =
      dbTopBlocks.length > 20
        ? parseInt((dbTopBlocks.length * 20) / 100)
        : dbTopBlocks.length;
    for (var i = 0; i < dbTopBlocks.length; i++) {
      block = {};
      blockId = dbTopBlocks[i]["_id"]["block"]
        ? dbTopBlocks[i]["_id"]["block"].toString()
        : dbTopBlocks[i]["_id"]["block"];
      block.avgTotal = dbTopBlocks[i]["avgTotal"];

      //To get block name
      let blockName = _.where(dbBlocks, { id: blockId });
      block.id = blockId;
      block.blockName = blockName[0] ? blockName[0]["name"] : "";

      blocks.push(block);

      //if (i == limitNumber) break;
    }
  }

  if (sortOrder == "ascending") {
    records = _.sortBy(blocks, (item) => item.blockName.toLowerCase());
  } else if (sortOrder == "descending") {
    records = _.sortBy(blocks, (item) =>
      item.blockName.toLowerCase()
    ).reverse();
  } else {
    records = blocks;
  }
  return records;
}

async function topDistrictsByState(userParam) {
  let userstate = new objectId(userParam.state);
  let records;
  let startYear = parseInt(userParam.startYear);
  let endMonth = parseInt(userParam.endMonth);
  let sortOrder = userParam.sortOrder != undefined ? userParam.sortOrder : "";
  let query = {};
  let queryCurrent = {};
  let queryNext = {};
  let queryCurrentYear = {};
  let queryNextYear = {};
  let sessionEndYear;
  let sessionStartYear;

  query["$or"] = [];
  queryCurrent["$and"] = [];
  queryNext["$and"] = [];

  let today = new Date();
  if (endMonth == 0) {
    endMonth = config.session_start_month - 1;
  }
  let currentMonth = endMonth == "" ? today.getMonth() : endMonth;

  sessionEndYear = today.getFullYear();
  sessionStartYear = today.getFullYear() - 1;

  let session_start_month = config.session_start_month;
  let startMonth = [];
  let endMonths = [];

  for (let i = 1; i < session_start_month; i++) {
    startMonth.push(i);
  }
  for (let j = session_start_month; j <= 12; j++) {
    endMonths.push(j);
  }
  if (currentMonth >= session_start_month) {
    sessionEndYear = today.getFullYear() + 1;
    sessionStartYear = today.getFullYear();
  } else if (currentMonth < session_start_month) {
    sessionEndYear = today.getFullYear();
    sessionStartYear = today.getFullYear() - 1;
  }
  query["state"] = userstate;

  queryCurrentYear["year"] = sessionEndYear;
  queryCurrentYear["month"] = { $in: startMonth };
  queryCurrent["$and"].push(queryCurrentYear);

  queryNextYear["year"] = sessionStartYear;
  queryNextYear["month"] = { $in: endMonths };
  queryNext["$and"].push(queryNextYear);

  query["$or"].push(queryCurrent);
  query["$or"].push(queryNext);

  //To get all districts names in this state
  const dbDistricts = await District.find({
    state_id: userstate,
    is_active: true,
  }).select("id name");

  let dbTopDistricts = await Topteachers.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: { district: "$district" },
        avgTotal: { $avg: "$total" },
      },
    },
    { $sort: { avgTotal: -1 } },
  ]);

  districts = [];
  if (dbTopDistricts && dbTopDistricts.length) {
    let limitNumber =
      dbTopDistricts.length > 20
        ? parseInt((dbTopDistricts.length * 20) / 100)
        : dbTopDistricts.length;
    for (var i = 0; i < dbTopDistricts.length; i++) {
      district = {};
      districtId = dbTopDistricts[i]["_id"]["district"]
        ? dbTopDistricts[i]["_id"]["district"].toString()
        : dbTopDistricts[i]["_id"]["district"];
      district.avgTotal = dbTopDistricts[i]["avgTotal"];

      //To get block name
      let districtName = _.where(dbDistricts, { id: districtId });
      district.id = districtId;
      district.districtName = districtName[0] ? districtName[0]["name"] : "";

      districts.push(district);

      //if (i == limitNumber) break;
    }
  }

  if (sortOrder == "ascending") {
    records = _.sortBy(districts, (item) => item.districtName.toLowerCase());
  } else if (sortOrder == "descending") {
    records = _.sortBy(districts, (item) =>
      item.districtName.toLowerCase()
    ).reverse();
  } else {
    records = districts;
  }
  return records;
}
