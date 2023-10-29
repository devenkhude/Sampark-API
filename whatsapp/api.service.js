const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');

const Subjectmaster = db.Subjectmaster;
const Departmentmaster = db.Departmentmaster;
const Lesson = db.Lesson;
const Lessoncompetency = db.Lessoncompetency;
const State = db.State;
const Video = db.Video;
const Audiotextbook = db.Audiotextbook;
const Audio = db.Audio;
const Kit = db.Kit;
const Document = db.Document;
const Videostream = db.Videostream;
const Scertsolution = db.Scertsolution;
const Englishspeech = db.Englishspeech;
const Vocabularyword = db.Vocabularyword;
const Vocabularysentence = db.Vocabularysentence;
const District = db.District;
const Block = db.Block;
const Cluster = db.Cluster;
const School = db.School;
const AssessmentQuestion = db.Assessmentquestion;
const Assessment = db.Assessment;
const Videostory = db.Videostory;
const User = db.User;
const Designation = db.Designation;

const getPinDetails = commonmethods.getPinDetails;

const b = "https://sss.samparksmartshala.org/sss/";

let { promisify, callbackify } = require('util');
let url = require('url');
let http = require('http');
let https = require('https');
let path = require('path');
let _ = require('underscore');
let TinyURL = require('tinyurl');
let q = require('q');

module.exports = {
    getLessonDetailedList,
    getLessons,
    getStateMaster,
    getAssessmentsWithQuestions,
    getAssessments,
    getStories,
    checkRegisteredUser,
    register,
    getDepartmentSubjects,
    designations,
    getAllWithSubjects,
};


async function getAllWithSubjects() {
    let defer = require('q').defer();
    
    try {
      const subject_masters = await Subjectmaster.find({module:"sss"}).sort({sort_order: 1}).select('-hash');
      const department_masters = await Departmentmaster.find({module:"sss"}).sort({sort_order: 1}).select('-hash');
      
      let subjects = {};
      let final_data = {};
      final_data['sss'] = [];
    //   final_data['sst'] = [];
    //   final_data['ssh'] = [];
    //   final_data['sa'] = [];
    //   final_data['elearning'] = [];
    //   final_data['dd'] = [];
      for (const subject_master of subject_masters) {
        subjects[subject_master["id"]] = {};
        subjects[subject_master["id"]]['id'] = subject_master['id'];
        subjects[subject_master["id"]]['name'] = subject_master['name'];
        subjects[subject_master["id"]]['is_default'] = subject_master['is_default'];
        subjects[subject_master["id"]]['for_registration'] = (subject_master['for_registration']) ? subject_master['for_registration'] : false;
        subjects[subject_master["id"]]['registration_name'] = (subject_master['registration_name']) ? subject_master['registration_name'] : subject_master['name'];
      }  
      let default_subject = true;
      for (const departmentmaster of department_masters) {
        
        default_subject = true;
        let department_master = {};
        let department_subjects = departmentmaster['subjects'];
        let department_subject_details = [];
        for (const departmentsubject of department_subjects) {  
          const video_count = await Video.find({department: departmentmaster.id, subject: departmentsubject}).countDocuments();
          let curSubject = {};
          curSubject.name = subjects[departmentsubject].name;
          curSubject.for_registration = subjects[departmentsubject].for_registration;
          curSubject.registration_name = subjects[departmentsubject].registration_name;
          curSubject.id = subjects[departmentsubject].id;
          curSubject.is_default = default_subject;
          curSubject.videos = video_count;
          department_subject_details.push(curSubject)
          default_subject = false;
        }
        department_master['subjects'] = department_subject_details;
        department_master['name'] = departmentmaster.name;
        department_master['for_registration'] = (departmentmaster['for_registration']) ? departmentmaster['for_registration'] : false;
        department_master['registration_name'] = (departmentmaster['registration_name']) ? departmentmaster['registration_name'] : departmentmaster['name']
        if (final_data[departmentmaster['module']].length == 0) {
          department_master['is_default'] = true;
        } else {
          department_master['is_default'] = false;
        }
        department_master['id'] = departmentmaster.id;
        final_data[departmentmaster['module']].push(department_master);
      }   
      defer.resolve(final_data['sss'])
    } catch (err) {
      console.log("error",err);
      defer.reject(err)
    }
    return defer.promise;
}

async function getDepartmentSubjects(userParam){
    try{
        const departmentSubjectApi = [];
        
        const DepartmentmasterData = await Departmentmaster.find({ 'module' : "sss"}).sort({sort_order:1});
        const SubjectmasterData = await Subjectmaster.find({ 'module' : "sss"}).sort({sort_order:1});
        
        for(var i =0;i<DepartmentmasterData.length;i++){
            const SubjectmasterDataArray=[];
            for(var j=0;j<DepartmentmasterData[i].subjects.length;j++){
                let subjectDetails = _.where(SubjectmasterData, { id: DepartmentmasterData[i].subjects[j].toString() });
                if (subjectDetails && subjectDetails[0]) {
                SubjectmasterDataArray.push({"name":subjectDetails[0].name,
                                            "for_registration":subjectDetails[0].for_registration,
                                            "registration_name":subjectDetails[0].registration_name,
                                            "is_default":subjectDetails[0].is_default,
                                            "id":subjectDetails[0].id})
                }
            }   
            departmentSubjectApi.push({"subject":SubjectmasterDataArray,
                                       "name":DepartmentmasterData[i].name,
                                        "for_registration":DepartmentmasterData[i].for_registration,
                                        "registration_name":DepartmentmasterData[i].registration_name,
                                        "is_default":DepartmentmasterData[i].is_default,
                                        "id":DepartmentmasterData[i].id});
        }
        return departmentSubjectApi;
    }
    catch(e){
        console.log(e)
        return e;
    }
   
}

async function register(userParam) {
    let defer = require('q').defer();
  
    try {
        let classes = JSON.parse(userParam["classes"])
        let subjects = JSON.parse(userParam["subjects"])
        let userclasses = []
        let usersubjects = []
        for (var i = 0; i < classes.length; i++) {
            userclasses.push(classes[i])
        }
        for (var i = 0; i < subjects.length; i++) {
            usersubjects.push(subjects[i])
        }
        // validate
        const checkuser = await User.findOne({ phone_number: userParam.phone_number, is_new: false });
        if (checkuser) {
            const { _id, hash, ...userWithoutHash } = checkuser.toObject();
            const id = _id;
            const token = jwt.sign({ sub: checkuser.id }, config.secret);
            return {
                id,
                ...userWithoutHash,
                token,
            };
        } else {
            delete userParam.classes
            delete userParam.subjects
            if (userParam.schoolcode) {
                userParam.diseCode = userParam.schoolcode;
                delete userParam.schoolcode
            }
            let user_state = ""
            if (userParam.state && userParam.state !== "") {
                user_state = await State.findById(userParam.state);
                if (userParam.diseCode && userParam.diseCode !== "") {
                    if (!userParam.diseCode.startsWith(user_state.code)) {
                    defer.reject('Dise Code does not belongs to ' + user_state.name);
                    }
                }
            }

            let userUParam = userParam;
            let pin_response_body = await getPinDetails(userParam.pincode, user_state.name);
            let pin_json = JSON.parse(pin_response_body);
            let pin_details = {};
            if (pin_json[0]['Status'] == "Success") {
                pin_details = pin_json[0]['PostOffice'][0];
            } else {
                pin_details["error"] = "failed"
            }

            let userdistrictname = "";

            if (userdistrictname == "") {
                if (pin_details["error"] && pin_details["error"] == "failed") {
                    userParam.district_mapped = false
                } else {
                    userdistrictname = pin_details.District
                    let districtdetail = await District.find({"name":pin_details.District})    
                    if (districtdetail && districtdetail.length == 1) {
                        let district_id = districtdetail[0]["_id"]
                        userParam.district = district_id
                        userParam.district_mapped = true
                    } else {
                        userParam.district_mapped = false
                    }
                }
            } else {
              userParam.district_mapped = true
            }
            userUParam.location = userdistrictname + ", " + pin_details.State;

            let isNewUser = false;
            let user = await User.findOne({ phone_number: userParam.phone_number, is_new: true })
            if (!user) {
                user = new User(userParam);
                isNewUser = true
            }

            userNames = userParam.name.split(" ")
            userUParam.firstName = userNames[0]
            userNames.shift()
            userUParam.lastName = userNames.join(" ")
            userUParam.fullName = userParam.name
    
            // hash password
            userParam.password = 'tempPassword54321';
            if (userParam.password) {
                userUParam.hash = bcrypt.hashSync(userParam.password, 10);
            }
            
            if (isNewUser) {
                userUParam.total_points = 100;
                userUParam.is_new = false;
                userUParam.otp = '----';
                userUParam.classes = userclasses;
                userUParam.subjects = usersubjects;
                userUParam.registrationDate = new Date();
                userUParam.updatedDate = new Date();
                Object.assign(user, userUParam);
                await user.save()
            } else {
                userUParam.total_points = 100;
                userUParam.is_new = false;
                userUParam.classes = userclasses;
                userUParam.subjects = usersubjects;
                userUParam.registrationDate = new Date();
                userUParam.updatedDate = new Date();
                Object.assign(user, userUParam);
                await user.save();
            }
            const user2 = await User.findOne({ phone_number: userParam.phone_number },{fullName:1, diseCode:1, classes:1, subjects:1, phone_number:1, state:1, district:1, is_blocked:1, is_active:1, is_verified:1, usertype:1, location:1});

            if (user2) {
                const { _id, hash, ...userWithoutHash } = user2.toObject();
                const id = _id;
                const token = jwt.sign({ sub: user2.id }, config.secret);
                return {
                    id,
                    ...userWithoutHash,
                    token,
                };
            }
        }
    } catch (e) {
        console.log(e)
        defer.reject(e)
    }
    return defer.promise
}
  
async function checkRegisteredUser(params) {
    phone_number = params['phone_number']
    const user = await User.findOne({ phone_number: phone_number, is_new: false },{fullName:1, diseCode:1, classes:1, subjects:1, phone_number:1, state:1, district:1, is_blocked:1, is_active:1, is_verified:1, usertype:1, location:1});
    if (user) {
        const { _id, hash, ...userWithoutHash } = user.toObject();
        const id = _id;
        const token = jwt.sign({ sub: user.id }, config.secret);
        return {
            id,
            ...userWithoutHash,
            token,
        };
    }
}

async function designations() {
    const designationsDataArray = [];
    const designationsData = await Designation.find({});
    for(var i=0;i<designationsData.length;i++){
        designationsDataArray.push({"id":designationsData[i]._id,"name":designationsData[i].name, "level":designationsData[i].level})
    }
    return designationsDataArray;
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
                //defer.reject(err)
            });
    } catch (err) {
        console.error(err);
        //    defer.reject(err)
        let dimension = {};
        dimension["width"] = 0; //dimensions.width;
        dimension["height"] = 0; //dimensions.height;
        defer.resolve(dimension)
    }
    return defer.promise
}

async function getStateMaster(stateid, userid) {
  try {
    let stateData = {}
    const activeStates = await State.find({"is_active":true},{name:1, short_name:1, code:1, capital:1})
    //let stateids = activeStates.map(function (item) {
    //    return item["_id"];
    //});
    stateData['states'] = activeStates
    //stateData['districts'] = await District.find({"state_id":{"$in":stateids}, "is_active":true},{name:1 ,state_id:1})
    //stateData['blocks'] = await Block.find({"state_id":{"$in":stateids}, "is_active":true},{name:1 ,state_id:1,district_id:1})
    
    return stateData
  } catch (e) {
    console.log(e)
    return e
  }
}

/* Fetch List of lessons starts
 * apk_version = current installed application version
 */
// Add index on module column for subjectmasters collection
// Add index on state & department columns for statecertificates collection
// Add index on subjects column for Departmentmaster collection
// Add index on subject, department, states, section, is_active for Lessons collection

async function getLessons(state_id, department_id) {
    try {
        if (state_id == "")
            throw "Please provide state"
                
        let subject_query = {};
        let querylesson = {};
        subject_query['module'] = 'sss';

        if (department_id != "") {
            querylesson['department'] = department_id;
        }
        querylesson['states'] = state_id;
        querylesson["is_active"] = true;
        querylesson["$or"] = [];
        
        querylessonGovt = {}
        querylessonGovt["section"] = "govt";
        querylesson["$or"].push(querylessonGovt)
        let querylessonEF = await createQueryLessonEF()
        if (querylessonEF != "")
            querylesson["$or"].push(querylessonEF)
        // Fetch id, name from Subjectmaster collection
        const subjectmasters = await Subjectmaster.find(subject_query).select('id name');
        const departmentmasters = await Departmentmaster.find(subject_query).select('id name');

        console.log(querylesson)
        // fetch lessons from lessons collection and select only required fields
        let lessons = await Lesson.find(querylesson, { subject: 1, department:1, section: 1, name: 1, kits: 1, videos: 1, audios: 1, baithak_videos: 1, activities: 1, scert_solutions: 1, assessment: 1, worksheet: 1, progress_chart: 1, lesson_plan: 1, assessmentId: 1, audiotextbooks: 1, lessonImage: 1, lessoncompetencies: 1 }).sort({ lesson_no: 1 });
        let temp_lesson_no = 0
        let department_total_progress = 0
        let samparklessons = [];
        let lessonCompetencies = [];
        for (let k = 0; k < lessons.length; k++) {

            let lesson = {};
            temp_lesson_no = temp_lesson_no + 1;

            let subjectDetails = _.where(subjectmasters, { id: lessons[k]["subject"].toString() });
            let departmentDetails = _.where(departmentmasters, { id: lessons[k]["department"].toString() });

            lesson["subject"] = subjectDetails[0]["_id"];
            lesson["subjectName"] = subjectDetails[0].name;
            lesson["class"] =  departmentDetails[0]["_id"];
            lesson["className"] = departmentDetails[0].name;
            lesson["isGovt"] = false;
            if ((lessons[k]["lessoncompetencies"] !== undefined && lessons[k]["lessoncompetencies"] !== null) && ((lessons[k]["lessoncompetencies"].length > 1) || (lessons[k]["lessoncompetencies"].length == 1 && lessons[k]["lessoncompetencies"][0] !== ""))) {
                lesson["isCompetency"] = true
                lesson["lesson_competencies"] = lessons[k]["lessoncompetencies"]
                lessonCompetencies = lessonCompetencies.concat(lessons[k]["lessoncompetencies"]); 
            } else {
                lesson["isCompetency"] = false
                lesson["lesson_competencies"] = []
            }
            lesson["url"] = 'lessonThumbnail.png';
            lesson["lessonImage"] = lessons[k]["lessonImage"];
            lesson["stateId"] = state_id;
            
            lesson["id"] = lessons[k]["id"];
            lesson["name"] = lessons[k]["name"];
            lesson["progress"] = 0;

            lesson["resources"] = 0;
            lesson['audios'] = 0;
            lesson['sort_order'] = temp_lesson_no;

            if ((lessons[k]["kits"] !== undefined && lessons[k]["kits"] !== null) && ((lessons[k]["kits"].length > 1) || (lessons[k]["kits"].length == 1 && lessons[k]["kits"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["kits"].length;
            }
            if ((lessons[k]["videos"] !== undefined && lessons[k]["videos"] !== null) && ((lessons[k]["videos"].length > 1) || (lessons[k]["videos"].length == 1 && lessons[k]["videos"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["videos"].length;
                const firstVideo = await Video.findById(lessons[k]["videos"][0])
                lesson["url"] = config.repositoryHost+firstVideo["thumbnail"];
            } else {
            if ((lessons[k]["audiotextbooks"] !== undefined && lessons[k]["audiotextbooks"] !== null) && ((lessons[k]["audiotextbooks"].length > 1) || (lessons[k]["audiotextbooks"].length == 1 && lessons[k]["audiotextbooks"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["audiotextbooks"].length;
                const firstAudiotextbook = await Audiotextbook.findById(lessons[k]["audiotextbooks"][0])
                lesson["url"] = config.repositoryHost+firstAudiotextbook["thumbnail"];
            }
            }
            if ((lessons[k]["audios"] !== undefined && lessons[k]["audios"] !== null) && ((lessons[k]["audios"].length > 1) || (lessons[k]["audios"].length == 1 && lessons[k]["audios"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["audios"].length;
                lesson['audios'] = lessons[k]["audios"].length
                if (lessons[k]['section'] == "sss") {
                    audios_available = true;
                }
            }
            if ((lessons[k]["baithak_videos"] !== undefined && lessons[k]["baithak_videos"] !== null) && ((lessons[k]["baithak_videos"].length > 1) || (lessons[k]["baithak_videos"].length == 1 && lessons[k]["baithak_videos"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["baithak_videos"].length;
            }
            if ((lessons[k]["activities"] !== undefined && lessons[k]["activities"] !== null) && ((lessons[k]["activities"].length > 1) || (lessons[k]["activities"].length == 1 && lessons[k]["activities"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["activities"].length;
            }
            if (lessons[k]["assessment"] !== undefined && lessons[k]['assessment'] !== null && lessons[k]['assessment'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["worksheet"] !== undefined && lessons[k]['worksheet'] !== null && lessons[k]['worksheet'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["progress_chart"] !== undefined && lessons[k]['progress_chart'] !== null && lessons[k]['progress_chart'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["lesson_plan"] !== undefined && lessons[k]['lesson_plan'] !== null && lessons[k]['lesson_plan'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["assessmentId"] !== undefined && lessons[k]['assessmentId'] !== null && lessons[k]['assessmentId'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            department_total_progress = department_total_progress + lesson["progress"];
            samparklessons.push(lesson);
        }

        // fetches lessoncompetencies
        let querylessoncompetency = {};
        querylessoncompetency["_id"] = {}
        querylessoncompetency["_id"]["$in"] = lessonCompetencies
        lessons = await Lessoncompetency.find(querylessoncompetency, { subject: 1, department:1, section: 1, name: 1, kits: 1, videos: 1, audios: 1, baithak_videos: 1, activities: 1, scert_solutions: 1, assessment: 1, worksheet: 1, progress_chart: 1, lesson_plan: 1, assessmentId: 1, audiotextbooks: 1, lessonImage: 1 }).sort({ lesson_no: 1 });
        temp_lesson_no = 0
        department_total_progress = 0
        for (let k = 0; k < lessons.length; k++) {

            let lesson = {};
            temp_lesson_no = temp_lesson_no + 1;

            let subjectDetails = _.where(subjectmasters, { id: lessons[k]["subject"].toString() });
            let departmentDetails = _.where(departmentmasters, { id: lessons[k]["department"].toString() });

            lesson["subject"] = subjectDetails[0]["_id"];
            lesson["subjectName"] = subjectDetails[0].name;
            lesson["class"] = department_id;
            lesson["className"] = departmentDetails[0].name;
            lesson["isGovt"] = false;
            lesson["url"] = 'lessonThumbnail.png';
            lesson["lessonImage"] = lessons[k]["lessonImage"];
            lesson["stateId"] = state_id;
            lesson["isCompetency"] = false
            lesson["lesson_competencies"] = []
            
            lesson["id"] = lessons[k]["id"];
            lesson["name"] = lessons[k]["name"];
            lesson["progress"] = 0;

            lesson["resources"] = 0;
            lesson['audios'] = 0;
            lesson['sort_order'] = temp_lesson_no;

            if ((lessons[k]["kits"] !== undefined && lessons[k]["kits"] !== null) && ((lessons[k]["kits"].length > 1) || (lessons[k]["kits"].length == 1 && lessons[k]["kits"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["kits"].length;
            }
            if ((lessons[k]["videos"] !== undefined && lessons[k]["videos"] !== null) && ((lessons[k]["videos"].length > 1) || (lessons[k]["videos"].length == 1 && lessons[k]["videos"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["videos"].length;
                const firstVideo = await Video.findById(lessons[k]["videos"][0])
                lesson["url"] = config.repositoryHost+firstVideo["thumbnail"];
            } else {
            if ((lessons[k]["audiotextbooks"] !== undefined && lessons[k]["audiotextbooks"] !== null) && ((lessons[k]["audiotextbooks"].length > 1) || (lessons[k]["audiotextbooks"].length == 1 && lessons[k]["audiotextbooks"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["audiotextbooks"].length;
                const firstAudiotextbook = await Audiotextbook.findById(lessons[k]["audiotextbooks"][0])
                lesson["url"] = config.repositoryHost+firstAudiotextbook["thumbnail"];
            }
            }
            if ((lessons[k]["audios"] !== undefined && lessons[k]["audios"] !== null) && ((lessons[k]["audios"].length > 1) || (lessons[k]["audios"].length == 1 && lessons[k]["audios"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["audios"].length;
                lesson['audios'] = lessons[k]["audios"].length
                if (lessons[k]['section'] == "sss") {
                    audios_available = true;
                }
            }
            if ((lessons[k]["baithak_videos"] !== undefined && lessons[k]["baithak_videos"] !== null) && ((lessons[k]["baithak_videos"].length > 1) || (lessons[k]["baithak_videos"].length == 1 && lessons[k]["baithak_videos"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["baithak_videos"].length;
            }
            if ((lessons[k]["activities"] !== undefined && lessons[k]["activities"] !== null) && ((lessons[k]["activities"].length > 1) || (lessons[k]["activities"].length == 1 && lessons[k]["activities"][0] !== ""))) {
                lesson["resources"] = lesson["resources"] + lessons[k]["activities"].length;
            }
            if (lessons[k]["assessment"] !== undefined && lessons[k]['assessment'] !== null && lessons[k]['assessment'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["worksheet"] !== undefined && lessons[k]['worksheet'] !== null && lessons[k]['worksheet'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["progress_chart"] !== undefined && lessons[k]['progress_chart'] !== null && lessons[k]['progress_chart'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["lesson_plan"] !== undefined && lessons[k]['lesson_plan'] !== null && lessons[k]['lesson_plan'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            if (lessons[k]["assessmentId"] !== undefined && lessons[k]['assessmentId'] !== null && lessons[k]['assessmentId'] !== "") {
                lesson["resources"] = lesson["resources"] + 1
            }
            department_total_progress = department_total_progress + lesson["progress"];
            samparklessons.push(lesson);
        }
        return samparklessons
    } catch (e) {
        console.log(e)
        return e
    }
}
/* Fetch List of lessons ends */

async function getLessonDetail(lesson, lessonType) {
    try {
        let lessonDetails = {};
        lessonDetails["id"] = lesson["_id"];
        lessonDetails["lesson_no"] = lesson['lesson_no']; //need to be change with actual sort order
        lessonDetails["name"] = lesson["name"];
        lessonDetails["launched"] = lesson["is_launched"];
        lessonDetails["is_active"] = lesson["is_active"];
        lessonDetails["description"] = lesson["description"].replace(/\n$/, "");
        lessonDetails["associated_with"] = lesson["section"];
        lessonDetails["progress"] = lesson["progress"];
        lessonDetails["are_resources_sequential"] = lesson["are_resources_sequential"];
        lessonDetails["vocabularyword_watched"] = false;
        lessonDetails["vocabularysentence_watched"] = false;
        lesson_vocabulary = (lesson["vocabularyword"]) ? lesson["vocabularyword"] : ""
        lesson_sentence = (lesson["vocabularysentence"]) ? lesson["vocabularysentence"] : ""
        lessonDetails["lessonImage"] = (lesson["lessonImage"]) ? config.repositoryHost + lesson["lessonImage"] : ""
        lessonDetails["vocabularyword"] = lesson_vocabulary;
        lessonDetails["vocabularysentence"] = lesson_sentence;
        
        lessonDetails["videos"] = "";
        lessonDetails["audios"] = "";
        lessonDetails["audiotextbooks"] = "";
        lessonDetails["kits"] = "";
        lessonDetails["resources"] = [];
        lessonDetails["lesson_concepts"] = "";
        lessonDetails["govt_textbook"] = "";
        lessonDetails["sampark_textbook"] = "";
        if (lesson['message_title'] == "" || lesson['message_description'] == "") {
            lessonDetails["message"] = "";
        } else {
            lessonDetails["message"] = {};
            lessonDetails["message"]["title"] = lesson['message_title'];
            lessonDetails["message"]["description"] = lesson['message_description'];
        }
        if (lesson["videos"].length > 0 && lesson["videos"][0] != "") {
            lessonDetails["resources_locked"] = true;
        } else {
            lessonDetails["resources_locked"] = false;
        }
        let curUserStateId = "";
        let sssvideolikes = [];
        let videolikes = [];
        let audiolikes = [];
        let audiotextbooklikes = [];
        let audiotextbookwatched = [];
        let sssvideowatched = [];
        let videowatched = [];
        let audiowatched = [];
        let kitwatched = [];
        let sssAssessmentWatched = [];
        let documentwatched = [];
        let scertsolutionwatched = [];
        let total_resources = 0;
        let total_resources_watched = 0;
        let curUserState = '0';

        let vocabularywords = [];
        if (lesson_vocabulary != "") {
            const englishvocabulary = await Englishspeech.findOne({"_id":lesson_vocabulary})
            if (englishvocabulary['content'].length > 0) {
                const englishvocabularycontent = await Vocabularyword.where({"_id":{"$in":englishvocabulary['content']}})
                for(let i=0; i<englishvocabularycontent.length;i++) {
                vocabularywordTemp = {}
                vocabularywordTemp['id'] = englishvocabularycontent[i]['id']
                vocabularywordTemp['word'] = englishvocabularycontent[i]['word']
                vocabularywordTemp['meaning'] = englishvocabularycontent[i]['meaning']
                vocabularywordTemp['attempted'] = false
                vocabularywordTemp['marks'] = 0
                vocabularywords.push(vocabularywordTemp)
                }
            }
        }
        lessonDetails["vocabularywords"] = vocabularywords
        
        let vocabularysentences = [];
        if (lesson_sentence != "") {
            const englishsentence = await Englishspeech.findOne({"_id":lesson_sentence})
            if (englishsentence['content'].length > 0) {
                const englishsentencecontent = await Vocabularysentence.where({"_id":{"$in":englishsentence['content']}})
                for(let i=0; i<englishsentencecontent.length;i++) {
                let vocabularysentenceTemp = {}
                vocabularysentenceTemp['id'] = englishsentencecontent[i]['id']
                vocabularysentenceTemp['sentence'] = englishsentencecontent[i]['sentence']
                vocabularysentenceTemp['meaning'] = englishsentencecontent[i]['meaning']
                vocabularysentenceTemp['attempted'] = false
                vocabularysentenceTemp['marks'] = 0
                vocabularysentences.push(vocabularysentenceTemp)
                }
            }
        }
        lessonDetails["vocabularysentences"] = vocabularysentences

        if (lesson["videos"].length > 0 && lesson["videos"][0] != "") {
            const videos = await Video.find({ "_id": { "$in": lesson['videos'] } })
            if (videos.length > 0) {
                let samparkvideos1 = {};
                total_resources = total_resources + videos.length;
                for (const curVideo of videos) {
                    let samparkvideo = {};
                    samparkvideo['name'] = curVideo['name'];
                    samparkvideo['description'] = curVideo['description'];

                    if (sssvideolikes.indexOf(curVideo["id"]) > -1) {
                        samparkvideo["is_liked"] = true
                    } else {
                        samparkvideo["is_liked"] = "";
                    }

                    samparkvideo["watched"] = "";
                    if (sssvideowatched.indexOf(curVideo["id"]) > -1) {
                        total_resources_watched = total_resources_watched + 1;
                        samparkvideo["watched"] = true;
                    }

                    samparkvideo['is_shareable'] = true;
                    samparkvideo['likecount'] = curVideo['likecount'];
                    samparkvideo['commentcount'] = curVideo['commentcount'];
                    samparkvideo['streamtype'] = 'sssvideo';

                    samparkvideo['id'] = curVideo['id'];
                    samparkvideo['url'] = config.repositoryHost + "samparkvideos/" + curVideo["module"] + "/" + curVideo["url"];
                    samparkvideo['video_code'] = curVideo['video_code'];
                    // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['video_code'];
                    let youtubeURL = config.video_player_link + curVideo['video_code'];
                    samparkvideo['short_video_code'] = await TinyURL.shorten(youtubeURL);
                    let duration = "";
                    if (curVideo['duration_min'] != "" && curVideo['duration_min'] != null) {
                        duration = curVideo['duration_min'] + " Mins ";
                    }
                    if (curVideo['duration_sec'] != "" && curVideo['duration_sec'] != null) {
                        duration = duration + curVideo['duration_sec'] + " Secs";
                    }
                    samparkvideo['passing_duration'] = config.video_passing_percentage;
                    samparkvideo['duration'] = duration;

                    samparkvideo['views'] = curVideo['viewcount'];
                    if (curVideo["thumbnail"] != "" && curVideo["thumbnail"] != "null") {
                        samparkvideo["thumbnail"] = config.repositoryHost + curVideo["thumbnail"];
                    } else {
                        samparkvideo["thumbnail"] = "https://img.youtube.com/vi/" + curVideo["video_code"] + "/hqdefault.jpg";
                    }
                    samparkvideos1[curVideo["id"]] = samparkvideo
                }

                let samparkvideos = [];
                for (const videoId of lesson['videos']) {
                    samparkvideos.push(samparkvideos1[videoId])
                }
                lessonDetails["videos"] = samparkvideos;
                //lessonDetails["videos"] = "";// Commented to remove videos as youtube channel is blocked
            }
        }

        if (lesson["audiotextbooks"].length > 0 && lesson["audiotextbooks"][0] != "") {
            const audiotextbooks = await Audiotextbook.find({ "_id": { "$in": lesson['audiotextbooks'] } })
            if (audiotextbooks.length > 0) {
                let samparkaudiotextbooks1 = {};
                total_resources = total_resources + audiotextbooks.length;
                for (const curVideo of audiotextbooks) {
                    let samparkvideo = {};
                    samparkvideo['name'] = curVideo['name'];
                    samparkvideo['description'] = curVideo['description'];

                    if (audiotextbooklikes.indexOf(curVideo["id"]) > -1) {
                        samparkvideo["is_liked"] = true
                    } else {
                        samparkvideo["is_liked"] = "";
                    }

                    samparkvideo["watched"] = "";
                    if (audiotextbookwatched.indexOf(curVideo["id"]) > -1) {
                        total_resources_watched = total_resources_watched + 1;
                        samparkvideo["watched"] = true;
                    }

                    samparkvideo['is_shareable'] = true;
                    samparkvideo['likecount'] = curVideo['likecount'];
                    samparkvideo['commentcount'] = curVideo['commentcount'];
                    samparkvideo['streamtype'] = 'audiotextbook';

                    samparkvideo['id'] = curVideo['id'];
                    samparkvideo['url'] = config.repositoryHost + "samparkaudios/" + curVideo["module"] + "/" + curVideo["url"];
                    samparkvideo['video_code'] = curVideo['audiotextbook_code'];
                    // youtubeURL = 'https://www.youtube.com/watch?v=' + curVideo['audiotextbook_code'];
                    let youtubeURL = config.video_player_link + curVideo['audiotextbook_code'];
                    samparkvideo['short_video_code'] = await TinyURL.shorten(youtubeURL);
                    let duration = "";
                    if (curVideo['duration_min'] != "" && curVideo['duration_min'] != null) {
                        duration = curVideo['duration_min'] + " Mins ";
                    }
                    if (curVideo['duration_sec'] != "" && curVideo['duration_sec'] != null) {
                        duration = duration + curVideo['duration_sec'] + " Secs";
                    }
                    samparkvideo['passing_duration'] = config.video_passing_percentage;
                    samparkvideo['duration'] = duration;

                    samparkvideo['views'] = curVideo['viewcount'];
                    if (curVideo["thumbnail"] != "" && curVideo["thumbnail"] != "null") {
                        samparkvideo["thumbnail"] = config.repositoryHost + curVideo["thumbnail"];
                    } else {
                        samparkvideo["thumbnail"] = "https://img.youtube.com/vi/" + curVideo["audiotextbook_code"] + "/hqdefault.jpg";
                    }
                    samparkaudiotextbooks1[curVideo["id"]] = samparkvideo
                }

                let samparkaudiotextbooks = [];
                for (const videoId of lesson['audiotextbooks']) {
                    samparkaudiotextbooks.push(samparkaudiotextbooks1[videoId])
                }
                lessonDetails["audiotextbooks"] = samparkaudiotextbooks;
                //lessonDetails["videos"] = "";// Commented to remove videos as youtube channel is blocked
            }
        }

        if (lesson["audios"].length > 0 && lesson["audios"][0] != "") {
            const audios = await Audio.find({ "_id": { "$in": lesson['audios'] } }).sort({ "sort_order": 1 })

            if (audios.length > 0) {
                let samparkaudios1 = {};
                total_resources = total_resources + audios.length;
                for (const curAudio of audios) {
                    let samparkaudio = {};
                    samparkaudio['name'] = curAudio['name'];
                    samparkaudio['description'] = curAudio['name'] + " - " + curAudio['description'];
                    samparkaudio['audio_code'] = curAudio['audio_code'];
                    // youtubeURL = 'https://www.youtube.com/watch?v=' + curAudio['audio_code'];
                    let youtubeURL = config.video_player_link + curAudio['audio_code'];
                    samparkaudio['short_audio_code'] = await TinyURL.shorten(youtubeURL);
                    samparkaudio['video_code'] = curAudio['audio_code'];
                    samparkaudio['id'] = curAudio['id'];
                    samparkaudio['watched'] = false;
                    samparkaudio['is_shareable'] = true;
                    samparkaudio['likecount'] = curAudio['likecount'];
                    samparkaudio['commentcount'] = curAudio['commentcount'];
                    samparkaudio['streamtype'] = 'sssaudio';

                    if (audiolikes.indexOf(curAudio["id"]) > -1) {
                        samparkaudio["is_liked"] = true;
                    } else {
                        samparkaudio["is_liked"] = "";
                    }

                    samparkaudio["watched"] = "";
                    if (audiowatched.indexOf(curAudio["id"]) > -1) {
                        total_resources_watched = total_resources_watched + 1;
                        samparkaudio["watched"] = true;
                    }
                    let duration = "";
                    if (curAudio['duration_min'] != "" && curAudio['duration_min'] != null) {
                        duration = curAudio['duration_min'] + " Mins ";
                    }
                    if (curAudio['duration_sec'] != "" && curAudio['duration_sec'] != null) {
                        duration = duration + curAudio['duration_sec'] + " Secs";
                    }
                    samparkaudio['duration'] = duration;
                    samparkaudio['passing_duration'] = config.video_passing_percentage;
                    samparkaudio['views'] = curAudio['viewcount'];

                    if (curAudio["thumbnail"] != "" && curAudio["thumbnail"] != "null") {
                        samparkaudio["thumbnail"] = config.repositoryHost + curAudio["thumbnail"];
                    } else {
                        samparkaudio["thumbnail"] = "https://img.youtube.com/vi/" + curAudio["audio_code"] + "/hqdefault.jpg";
                    }
                    samparkaudios1[curAudio["id"]] = samparkaudio
                }
                let samparkaudios = [];
                for (const audioId of lesson['audios']) {
                    samparkaudios.push(samparkaudios1[audioId])
                }
                lessonDetails["audios"] = samparkaudios;
                //lessonDetails["audios"] = "";// Commented to remove videos as youtube channel is blocked
            }
        }

        if (lesson["kits"].length > 0 && lesson["kits"][0] != "") {
            const kits = await Kit.find({ "_id": { "$in": lesson['kits'] } })

            if (kits.length > 0) {
                let samparkkits = [];
                for (const curKit of kits) {
                    let samparkkit = {};
                    samparkkit['id'] = (curKit['id']) ? curKit['id'] : "";
                    samparkkit['name'] = (curKit['name']) ? curKit['name'] : "";
                    samparkkit['pdfname'] = (curKit['pdfname']) ? curKit['pdfname'] : "";
                    samparkkit['pdf'] = (curKit['pdf']) ? config.repositoryHost + curKit['pdf'] : "";
                    if (samparkkit['pdf'] != "") {
                        total_resources = total_resources + 1;
                    }
                    if (curKit['images'].length > 0) {
                        samparkkit['images'] = [];
                        samparkkit['kitimages'] = [];
                        for (const curKitImage of curKit['images']) {
                            if (curKitImage && curKitImage !== null) {
                                let kitimage = {};
                                kitimage['path'] = config.repositoryHost + curKitImage;
                                let dimensions = await getDimension(config.repositoryHost + curKitImage)
                                kitimage["width"] = dimensions['width'];
                                kitimage["height"] = dimensions['height'];
                                samparkkit['kitimages'].push(kitimage)
                                samparkkit['images'].push(config.repositoryHost + curKitImage)
                            }
                        }
                    } else {
                        samparkkit['images'] = "";
                    }
                    samparkkit["watched"] = false;
                    if (kitwatched.indexOf(curKit["id"]) > -1) {
                        total_resources_watched = total_resources_watched + 1;
                        samparkkit["watched"] = true;
                    }
                    samparkkits.push(samparkkit)
                }
                lessonDetails["kits"] = samparkkits;
            }
        }
        
        if (lessonType == "lesson") {
            if (lesson["section"] == "sss") {
                let govt_textbooks = JSON.parse(lesson["govt_textbook_mapping"]);
                lessonDetails["govt_textbook"] = (curUserStateId != "" && govt_textbooks.hasOwnProperty(curUserStateId)) ? govt_textbooks[curUserStateId] : govt_textbooks["0"];
    
                if (lessonDetails["govt_textbook"] == null) {
                    lessonDetails["govt_textbook"] = "";
                }
            } else {
                let govt_textbooks = JSON.parse(lesson["govt_textbook_mapping"]);
                lessonDetails["sampark_textbook"] = (curUserStateId != "" && govt_textbooks.hasOwnProperty(curUserStateId)) ? govt_textbooks[curUserStateId] : govt_textbooks["0"];
    
                if (lessonDetails["sampark_textbook"] == null) {
                    lessonDetails["sampark_textbook"] = "";
                }
            }
        } else {
            lessonDetails["sampark_textbook"] = "";
            lessonDetails["govt_textbook"] = "";
        }

        let queryDocumentIds = [];
        if (lesson["worksheet"] != "") {
            queryDocumentIds.push(lesson["worksheet"])
        }
        if (lesson["assessment"] != "") {
            queryDocumentIds.push(lesson["assessment"])
        }
        if (lesson["progress_chart"] != "") {
            queryDocumentIds.push(lesson["progress_chart"])
        }
        if (lesson["lesson_plan"] != "") {
            queryDocumentIds.push(lesson["lesson_plan"])
        }
        let documents = await Document.find({ "_id": { "$in": queryDocumentIds } })
        let resourses_seq = {};

        let i = 0;
        for (const curDocument of documents) {
            let resource = {};
            total_resources = total_resources + 1;
            resourses_seq[curDocument['doc_type']] = i;
            i = i + 1;
            resource['type'] = curDocument['doc_type'];
            resource['id'] = curDocument['id'];
            resource["watched"] = "";
            if (documentwatched.indexOf(curDocument["id"]) > -1) {
                total_resources_watched = total_resources_watched + 1;
                resource["watched"] = true;
            }
            resource['name'] = config.doc_types[curDocument['doc_type']];
            resource['url'] = config.repositoryHost + curDocument['doc_url'];
            urlPath = config.repositoryHost + curDocument['doc_url'];
            resource['short_url'] = await TinyURL.shorten(urlPath);

            lessonDetails["resources"].push(resource);
        }

        if (lesson["assessmentId"] != null && lesson["assessmentId"] != undefined) {
            let resource = {};
            resource['type'] = "sssassessment";
            resource['assessmentId'] = lesson["assessmentId"];
            resource["watched"] = "";
            resource['name'] = "Practice Quiz";
            resourses_seq["sssassessment"] = Object.keys(resourses_seq).length;
            total_resources = total_resources + 1;

            if (sssAssessmentWatched.indexOf(lesson["assessmentId"] + "") > -1) {
                resource["watched"] = true;
                total_resources_watched = total_resources_watched + 1
            }
            lessonDetails["resources"].push(resource);
        }

        if (lesson["scert_solutions"] !== null) {
            if (lesson["scert_solutions"].length > 1 || (lesson["scert_solutions"].length == 1 && lesson["scert_solutions"][0] !== "")) {
                let scert_solutionid = lesson['scert_solutions']
                const scert_solutions = await Scertsolution.find({ "_id": { "$in": scert_solutionid } }) //
                if (scert_solutions.length > 0) {
                    for (const curScertSol of scert_solutions) {
                        if (curScertSol["states"].indexOf(curUserState) !== -1) {
                            let resource = {};
                            resource['type'] = 'scertsolution';
                            //resource['name'] = 'SCERT Solution';
                            resource['name'] = 'Solved Workbook';
                            resource['id'] = curScertSol['id'];
                            resource["watched"] = "";
                            if (scertsolutionwatched.indexOf(curScertSol["id"]) > -1) {
                                resource["watched"] = true;
                                total_resources_watched = total_resources_watched + 1
                            }
                            resource['url'] = config.repositoryHost + curScertSol['doc_url'];
                            lessonDetails["resources"].push(resource);
                            resourses_seq["scertsolution"] = Object.keys(resourses_seq).length;
                        }
                    }
                }
            }
        }

        if (lesson["baithak_videos"].length > 0 && lesson["baithak_videos"][0] != "") {
            const bvideos = await Videostream.find({ "_id": { "$in": lesson['baithak_videos'] } })
            let baithak_watched = true;
            if (bvideos.length > 0) {
                let baithakvideos = [];
                total_resources = total_resources + bvideos.length;
                for (const curBVideo of bvideos) {
                    let samparkvideo = {};
                    samparkvideo['id'] = curBVideo['id'];

                    if (videolikes.indexOf(curBVideo["id"]) > -1) {
                        samparkvideo["is_liked"] = (videolikes[curBVideo["id"]]) ? videolikes[curBVideo["id"]] : "";
                    } else {
                        samparkvideo["is_liked"] = "";
                    }
                    samparkvideo["watched"] = "";
                    if (videowatched.indexOf(curBVideo["id"]) > -1) {
                        samparkvideo["watched"] = true;
                        total_resources_watched = total_resources_watched + 1;
                    }
                    if (samparkvideo["watched"] == "") {
                        baithak_watched = "";
                    }
                    samparkvideo['is_shareable'] = true;
                    samparkvideo['likecount'] = curBVideo['likecount'];
                    samparkvideo['commentcount'] = curBVideo['commentcount'];
                    samparkvideo['streamtype'] = 'video';

                    let duration = "";
                    if (curBVideo['duration_min'] != "" && curBVideo['duration_min'] != null) {
                        duration = curBVideo['duration_min'] + " Mins ";
                    }
                    if (curBVideo['duration_sec'] != "" && curBVideo['duration_sec'] != null) {
                        duration = duration + curBVideo['duration_sec'] + " Secs";
                    }
                    samparkvideo['passing_duration'] = config.video_passing_percentage;
                    samparkvideo['duration'] = duration;
                    samparkvideo['views'] = curBVideo['viewcount'];

                    samparkvideo['url'] = config.repositoryHost + "samparkvideos/" + curBVideo["module"] + "/" + curBVideo['url'];
                    samparkvideo['name'] = (curBVideo['name']) ? curBVideo['name'] : curBVideo['description'];
                    samparkvideo['video_code'] = curBVideo['youtube_code'];
                    // youtubeURL = 'https://www.youtube.com/watch?v=' + curBVideo['youtube_code'];
                    let youtubeURL = config.video_player_link + curBVideo['youtube_code'];
                    samparkvideo['short_video_code'] = await TinyURL.shorten(youtubeURL);
                    if (curBVideo["thumbnail"] != "" && curBVideo["thumbnail"] != "null") {
                        samparkvideo["thumbnail"] = config.repositoryHost + curBVideo["thumbnail"];
                    } else {
                        samparkvideo["thumbnail"] = "https://img.youtube.com/vi/" + curBVideo["video_code"] + "/hqdefault.jpg";
                    }
                    baithakvideos.push(samparkvideo)
                }
                let resource = {};
                resource['type'] = 'baithak';
                resource['watched'] = baithak_watched;
                resource['name'] = 'Aapki Baithak';
                resource['videos'] = baithakvideos;
                lessonDetails["resources"].push(resource);
                resourses_seq["baithak"] = Object.keys(resourses_seq).length;
            }
        }
        
        lessonDetails["progress"] = 0;

        let new_resources = [];
        if (resourses_seq.hasOwnProperty('baithak'))
            new_resources.push(lessonDetails["resources"][resourses_seq['baithak']])
        if (resourses_seq.hasOwnProperty('worksheet'))
            new_resources.push(lessonDetails["resources"][resourses_seq['worksheet']])
        if (resourses_seq.hasOwnProperty('lesson_plan'))
            new_resources.push(lessonDetails["resources"][resourses_seq['lesson_plan']])
        if (resourses_seq.hasOwnProperty('assessment'))
            new_resources.push(lessonDetails["resources"][resourses_seq['assessment']])
        if (resourses_seq.hasOwnProperty('sssassessment'))
            new_resources.push(lessonDetails["resources"][resourses_seq['sssassessment']])
        if (resourses_seq.hasOwnProperty('progress_chart'))
            new_resources.push(lessonDetails["resources"][resourses_seq['progress_chart']])
        if (resourses_seq.hasOwnProperty('scertsolution'))
            new_resources.push(lessonDetails["resources"][resourses_seq['scertsolution']])
        //    lessonDetails['resourcesseq'] = resourses_seq;
        lessonDetails['resources'] = new_resources;
        lessonDetails['total_resources_watched'] = total_resources_watched;
        lessonDetails['total_resources'] = total_resources;
        return lessonDetails
    } catch(e) {
        console.log(e)
    }
}

async function getLessonDetailedList(state_id, department_id, pageno, per_page) {
    let lessonDetails = [];
    
    if (state_id == "")
        throw "Please provide state"
    
    let querylesson = {};    
    if (department_id != "")
        querylesson['department'] = department_id;

    querylesson['states'] = state_id;
    querylesson["is_active"] = true;
    querylesson["$or"] = [];
    
    querylessonGovt = {}
    querylessonGovt["section"] = "govt";
    querylesson["$or"].push(querylessonGovt)
    let querylessonEF = await createQueryLessonEF()
    if (querylessonEF != "")
        querylesson["$or"].push(querylessonEF)

    let perpage = parseInt(per_page);
    start = (pageno - 1) * perpage
    // fetch lessons from lessons collection and select only required fields
    let lessons = await Lesson.find(querylesson).sort({ lesson_no: 1 }).limit(perpage).skip(start);
    let lessonCompetencies = [];
    console.log("Lessons : ",lessons.length)	
    for (let k = 0; k < lessons.length; k++) {
        if ((lessons[k]["lessoncompetencies"] !== undefined && lessons[k]["lessoncompetencies"] !== null) && ((lessons[k]["lessoncompetencies"].length > 1) || (lessons[k]["lessoncompetencies"].length == 1 && lessons[k]["lessoncompetencies"][0] !== ""))) {
            lessonCompetencies = lessonCompetencies.concat(lessons[k]["lessoncompetencies"]); 
        }
        let lessonDetail = await getLessonDetail(lessons[k], "lesson");
        lessonDetails.push(lessonDetail)
    }
    let querylessoncompetency = {};
    querylessoncompetency["_id"] = {}
    querylessoncompetency["_id"]["$in"] = lessonCompetencies
    lessons = await Lessoncompetency.find(querylessoncompetency).sort({ lesson_no: 1 }).limit(perpage).skip(start);
    for (let k = 0; k < lessons.length; k++) {
        let lessonDetail = await getLessonDetail(lessons[k], "lessoncompetency");
        console.log("Lesson	Competencies No : ",k)
        lessonDetails.push(lessonDetail)
    }
    return lessonDetails    
}

async function getAssessments(state_id) {

	let query = {};
	let querylesson = {};
	let queryAssessment = {};
	let finalArray = [];

    if (state_id == "")
        throw "Please provide state"
    
    querylesson['states'] = state_id;
    querylesson["is_active"] = true;
    querylesson["$or"] = [];
    
    querylessonGovt = {}
    querylessonGovt["section"] = "govt";
    querylesson["$or"].push(querylessonGovt)
    let querylessonEF = await createQueryLessonEF()
    if (querylessonEF != "")
        querylesson["$or"].push(querylessonEF)

  // fetch lessons from lessons collection and select only required fields
	let lessonAssessmentIds = await Lesson.distinct('assessmentId', querylesson);
    
    let arrState = ['all'];
    arrState.push(state_id);
    queryAssessment['states'] = { '$in': arrState };
    queryAssessment["assessmentType"] = { '$in': ["SSS", "Self", "State"] };
	let assessmentIds = await Assessment.distinct('_id', queryAssessment);
    let finalAssessmentIds = assessmentIds.concat(lessonAssessmentIds)
    finalAssessmentIds = finalAssessmentIds.filter(function(elem, pos) {
        return finalAssessmentIds.indexOf(elem) == pos;
    })
  
	//To get active assessments based on class id
	//query['isActive'] = true;
    query['assessment'] = { '$in': finalAssessmentIds };
    query['questionType'] = "objective";
	let assessmentQuestions = await AssessmentQuestion.find(query);
  
	let queryAssess = {};

	//To get active assessments based on class id
	queryAssess['isActive'] = true;
    queryAssess['_id'] = { '$in': finalAssessmentIds };
	const Assessments = await Assessment.find(queryAssess);

	//To get all claases for this sa module
	const Subjects = await Subjectmaster.find().select('id name');
	const Departments = await Departmentmaster.find().select('id name');
	//To do groupby on department of assessments received
	let questionsGroupByAssessment = _.groupBy(assessmentQuestions, 'assessment');
    console.log(Subjects)
	//Loop through objects
	for (let assessId in questionsGroupByAssessment) {
		let questionList = {};

		//Assigning required class info to a final object
		questionList['id'] = assessId;
		//To get assessment details
		let assessmentName = _.where(Assessments, { id: assessId });

        if (assessmentName && assessmentName.length == 1) {
            questionList['name'] = assessmentName[0]['lesson'];
            let subjectId = assessmentName[0]['subject'];
            let departmentId = assessmentName[0]['department'];
            
            //To get subject name
            let subjectName = await Subjects.find(o => o._id.toString() == subjectId.toString());
            let departmentName = await Departments.find(o => o._id.toString() == departmentId.toString());
            
            questionList['subjectId'] = subjectId;
            questionList['subjectName'] = "NA";
            if (subjectName) {
                //Assigning required class info to a final object
                questionList['subjectName'] = subjectName['name'];
            }
            questionList['departmentId'] = departmentId;
            questionList['departmentName'] = "NA";
            if (departmentName) {
                //Assigning required class info to a final object
                questionList['departmentName'] = departmentName['name'];
            }
            //Assign final object to an array
            finalArray.push(questionList);
        }
	}

	//return final array
	return finalArray;
}

async function getAssessmentsWithQuestions(state_id) {
	let query = {};
	let querylesson = {};
	let queryAssessment = {};
	let finalArray = [];

    if (state_id == "")
        throw "Please provide state"
    
    querylesson['states'] = state_id;
    querylesson["is_active"] = true;
    querylesson["$or"] = [];
    
    querylessonGovt = {}
    querylessonGovt["section"] = "govt";
    querylesson["$or"].push(querylessonGovt)
    let querylessonEF = await createQueryLessonEF()
    if (querylessonEF != "")
        querylesson["$or"].push(querylessonEF)

  // fetch lessons from lessons collection and select only required fields
	let lessonAssessmentIds = await Lesson.distinct('assessmentId', querylesson);

    let arrState = ['all'];
    arrState.push(state_id);
    queryAssessment['states'] = { '$in': arrState };
    queryAssessment["assessmentType"] = { '$in': ["SSS", "Self", "State"] };
	let assessmentIds = await Assessment.distinct('_id', queryAssessment);
    let finalAssessmentIds = assessmentIds.concat(lessonAssessmentIds)
    finalAssessmentIds = finalAssessmentIds.filter(function(elem, pos) {
        return finalAssessmentIds.indexOf(elem) == pos;
    })
  
	//To get active assessments based on class id
	//query['isActive'] = true;
    query['assessment'] = { '$in': finalAssessmentIds };
    query['questionType'] = "objective";
	let assessmentQuestions = await AssessmentQuestion.find(query);
  
	let queryAssess = {};

	//To get active assessments based on class id
	queryAssess['isActive'] = true;
    queryAssess['_id'] = { '$in': finalAssessmentIds };
	const Assessments = await Assessment.find(queryAssess);

	//To get all claases for this sa module
	const Subjects = await Subjectmaster.find().select('id name');
	const Departments = await Departmentmaster.find().select('id name');
	//To do groupby on department of assessments received
	let questionsGroupByAssessment = _.groupBy(assessmentQuestions, 'assessment');

	//Loop through objects
	for (let assessId in questionsGroupByAssessment) {
		let questionList = {};

		//Assigning required class info to a final object
		questionList['id'] = assessId;
		//To get assessment details
		let assessmentName = _.where(Assessments, { id: assessId });

        if (assessmentName && assessmentName.length == 1) {
            questionList['name'] = assessmentName[0]['lesson'];
            questionList['level'] = assessmentName[0]['level'];
            let subjectId = assessmentName[0]['subject'];
            let departmentId = assessmentName[0]['department'];

            //To get subject name
            let subjectName = await Subjects.find(o => o._id.toString() == subjectId.toString());
            let departmentName = await Departments.find(o => o._id.toString() == departmentId.toString());
            
            questionList['subjectId'] = subjectId;
            questionList['subjectName'] = "NA";
            if (subjectName) {
                //Assigning required class info to a final object
                questionList['subjectName'] = subjectName['name'];
            }
            questionList['departmentId'] = departmentId;
            questionList['departmentName'] = "NA";
            if (departmentName) {
                //Assigning required class info to a final object
                questionList['departmentName'] = departmentName['name'];
            }
            let level = assessmentName[0]['level'];
            questionList['timeLimit'] = assessmentName[0]['duration'];

            /*if (assessType === 'PT') {
                questionList['displayQuestionsCnt'] = 10;
            } else {*/
            requiredCnt = questionsGroupByAssessment[assessId].length >= 21 ? 21 : questionsGroupByAssessment[assessId].length;
            questionList['displayQuestionsCnt'] = requiredCnt - 1;
            //}

            questionList['instructions'] = [];

            let instruction1 = 'You will get total ' + assessmentName[0]['duration'] + ' minutes to finish the test;' +
                ' if you finish in ' + level['Difficult'] + ' minutes (Difficult), you will get 3 stars, in ' + level['Moderate'] +
                ' mins (Moderate) you  will get 2 stars and above ' + level['Easy'] + ' mins you will get 1 star';

            let instruction2 = "For each assessment you will get 3 lifelines from Sampark Didi to help you in the " +
                "test, if you don’t use the lifelines you will get 1 star";

            questionList['instructions'].push(instruction1);
            questionList['instructions'].push(instruction2);

            //Array of questions
            let questionArr = [];

            for (let assessIndex in questionsGroupByAssessment[assessId]) {
                let questionInnerObj = questionsGroupByAssessment[assessId][assessIndex];

                //Each question as an object
                let questionObj = {};

                questionObj['id'] = questionInnerObj['id'];
                questionObj['question'] = questionInnerObj['question'];
                questionObj['options'] = questionInnerObj['options'];
                questionObj['question_image'] = questionInnerObj['question_image'] ? config.repositoryHost + questionInnerObj['question_image'] : '';

                if (!_.isEmpty(questionInnerObj['options_image'])) {
                questionInnerObj['options_image']['a'] ? questionInnerObj['options_image']['a'] = config.repositoryHost + questionInnerObj['options_image']['a'] : '';
                questionInnerObj['options_image']['b'] ? questionInnerObj['options_image']['b'] = config.repositoryHost + questionInnerObj['options_image']['b'] : '';
                questionInnerObj['options_image']['c'] ? questionInnerObj['options_image']['c'] = config.repositoryHost + questionInnerObj['options_image']['c'] : '';
                questionInnerObj['options_image']['d'] ? questionInnerObj['options_image']['d'] = config.repositoryHost + questionInnerObj['options_image']['d'] : '';
                questionObj['options_image'] = questionInnerObj['options_image'];
                } else {
                questionObj['options_image'] = {};
                }

                questionObj['correctAnswer'] = questionInnerObj['correctAnswer'];

                //Push each object to an array
                questionArr.push(questionObj);

                //Push all assessments to final object
                questionList['questions'] = questionArr;
            }

            //Assign final object to an array
            finalArray.push(questionList);
        }
	}

	//return final array
	return finalArray;
}

async function getStories(stateid) {
    try {
        let stories = []

        videostories = await Videostory.find({"is_active":true})
        for (let k = 0; k < videostories.length; k++) {
            let story = {}
            story['name'] = videostories[k]['name']
            story['id'] = videostories[k]['id']
            story['url'] = videostories[k]['url']
            story['watched'] = false
            story['passing_duration'] = config.video_passing_percentage
            let duration = "";
            if (videostories[k]['duration_min'] != "" && videostories[k]['duration_min'] != null) {
            duration = videostories[k]['duration_min']+" Mins ";
            }
            if (videostories[k]['duration_sec'] != "" && videostories[k]['duration_sec'] != null) {
            duration = duration + videostories[k]['duration_sec']+" Secs";
            }
            story['duration'] = duration
            story['points'] = videostories[k]['points'] ? videostories[k]['points'] : 100

            stories.push(story)
        }
        return stories
    } catch (e) {
        console.log(e)
        return e
    }
  }
  
async function createQueryLessonEF() {
    let querylessonEF = {}
    querylessonEF["section"] = "sss";
    querylessonEF["$or"] = [];
    sssConditions = config.english_foundation_id
    console.log(querylessonEF)
    console.log(sssConditions)
    for (let k = 0; k < sssConditions.length; k++) {
        let subCon = sssConditions[k]['subject']
        let deptCon = sssConditions[k]['department']
        
        let cond = {}
        if (subCon !== "") {
            cond["subject"] = subCon
        }
        if (deptCon !== "") {
            cond["department"] = deptCon
        }
        
        if (Object.values(cond).length > 0)
            querylessonEF["$or"].push(cond)
    }
    return (querylessonEF["$or"].length > 0) ? querylessonEF : ""
}