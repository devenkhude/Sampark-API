const config = require('../config.json');
const db = require('../_helpers/db');
var moment = require('moment');

const User = db.User;
const Videostream = db.Videostream;
const Sssvideolike = db.Sssvideolike;
const Videolike = db.Videolike;
const Audiolike = db.Audiolike;
const Sssvideoplayed = db.Sssvideoplayed;
const Videoplayed = db.Videoplayed;
const State = db.State;
const Departmentmaster = db.Departmentmaster;
const Subjectmaster = db.Subjectmaster;
const Documentviewed = db.Documentviewed;
const Scertsolutionviewed = db.Scertsolutionviewed;
const Sssvideoviewed = db.Sssvideoviewed;
const Textstream = db.Textstream;
const Imagestream = db.Imagestream;
const Textcomment = db.Textcomment;
const Imagecomment = db.Imagecomment;
const Videocomment = db.Videocomment;
const Sssvideocomment = db.Sssvideocomment;
const Scerttextcomment = db.Scerttextcomment;
const Scertimagecomment = db.Scertimagecomment;
const Scertvideocomment = db.Scertvideocomment;
const Scertpdfcomment = db.Scertpdfcomment;
const Textlike = db.Textlike;
const Stream = db.Stream;
const Imagelike = db.Imagelike;
const Scerttextlike = db.Scerttextlike;
const Scertimagelike = db.Scertimagelike;
const Scertvideolike = db.Scertvideolike;
const Scertpdflike = db.Scertpdflike;

module.exports = {
    video_played_users_count,
    users,
    sparks,
    teachers,
    unregisteredusers
};

async function video_played_users_count(req) {
  let requestParam = req.body;
  let query = {};
  let statename = requestParam.statename;
  let searchdaterange = requestParam.searchdaterange.split("~");
  let searchfromdate = searchdaterange[0].trim();
  let searchtodate = searchdaterange[1].trim();
  if (statename === "1") {
    statename = "";
  }
  query["$and"] = [];
  let querysearchand = {};

  querysearchand = {};
  if (searchfromdate) {
    let momentObj = moment(searchfromdate, 'MM-DD-YYYY');
    querysearchand['createdDate'] = {};
    querysearchand['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
    query["$and"].push(querysearchand)
  }
  if (searchtodate) {
    let momentObj = moment(searchtodate, 'MM-DD-YYYY');  
    querysearchand = {};      
    querysearchand['createdDate'] = {};
    querysearchand['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
    query["$and"].push(querysearchand)
  }
  
  if (query["$and"].length === 0) {
    delete query["$and"];
  }
  
  const departments = await Departmentmaster.find()
  const subjects = await Subjectmaster.find()
  const departmentIds = {};
  const subjectIds = {};
  for(const department of departments) {
    departmentIds[department.id.toString()] = department.name;
  }
  for(const subject of subjects) {
    subjectIds[subject.id.toString()] = subject.name;
  }
  const baithakvideos = await Stream.find({"item_type":"sssvideo"},{publishDate:1, item_id: 1})
  const videoplayeds = await Sssvideoplayed.find(query).populate('video','name department subject').populate('user','state');
  const baithakVideos = {};
  for (const baithakvideo of baithakvideos) {
    baithakVideos[baithakvideo.item_id.toString()] = baithakvideo.publishDate
  }
  let videoscount = {};
  let videoids = [];
  for (const videoPlayed of videoplayeds) {
    if (videoPlayed['video']) {
      let videoid = videoPlayed['video']['id'].toString();
      let userid =	'';
      let userstate = '';
      if (videoPlayed['user'] && videoPlayed['user']['id']) {
        userid = videoPlayed['user']['id'].toString();
        userstate = videoPlayed['user']['state'].toString();
      }
      let viewStatus = 1;
      if (statename) { 
        if (userstate) {
          if (statename === "0") {
            let activestates = await State.distinct('_id',{"is_active":true})
            activestates = activestates.map(function(item) {
              return item.toString();
            });
            if (activestates.indexOf(userstate) > -1) {
              viewStatus = 0;  
            }
          } else {
            viewStatus = (statename === userstate) ? 1 : 0;
          }
        } else {
          viewStatus = 0;
        }  
      }
      if (viewStatus === 1) {
        if(videoids.indexOf(videoid) !== -1) {
          videoscount[videoid]['played'] = videoscount[videoid]['played'] + 1
          if(videoscount[videoid]['users'].indexOf(userid) === -1){
            videoscount[videoid]['users'].push(userid);
            videoscount[videoid]['usercount'] = videoscount[videoid]['usercount'] + 1;
          }
        } else{
          videoids.push(videoid)
          videoscount[videoid] = {};
          videoscount[videoid]['name'] = videoPlayed['video']['name'];
          videoscount[videoid]['class'] = departmentIds[videoPlayed['video']['department'].toString()];
          videoscount[videoid]['subject'] = subjectIds[videoPlayed['video']['subject'].toString()];
          videoscount[videoid]['played'] = 1;
          videoscount[videoid]['baithak'] = (baithakVideos.hasOwnProperty(videoid)) ? baithakVideos[videoid] : 'N/A';
          videoscount[videoid]['usercount'] = 1;
          videoscount[videoid]['users'] = [];
          videoscount[videoid]['users'].push(userid);
        }
      }
    }
  }
  
  let video_data = [];
  for (const [key, value] of Object.entries(videoscount)) {
    let data = {};
    data['video_id'] = key;
    data['name'] = value['name'];
    data['class'] = value['class'];
    data['subject'] = value['subject'];
    data['played_count'] = value['played'];
    data['baithak'] = value['baithak'];
    data['user_count'] = value['usercount'];
    video_data.push(data)
  }

  return video_data;
}

async function users(req) {
    let requestParam = req.body;
    let sort = {};
    let query = {};
    query['is_new'] = false;

    let totalusers = await User.find(query).count();
    let filteredusers = totalusers;   
    let sort_column = (requestParam.sortby) ? requestParam.sortby : 6;
    let sort_order = (requestParam.sortorder && requestParam.sortorder === "1") ? 'asc' : "desc";
    
    if (sort_column == 0) {
      sort["fullName"] = (sort_order == "asc") ? 1 : -1
    } 
    else if (sort_column == 1) {
      sort["phone_number"] = (sort_order == "asc") ? 1 : -1
    } 
    else if (sort_column == 2) {
      sort["usertype"] = (sort_order == "asc") ? 1 : -1
    } 
    else if (sort_column == 3) {
      sort["location"] = (sort_order == "asc") ? 1 : -1
    } 
    else if (sort_column == 4) {
      sort["pincode"] = (sort_order == "asc") ? 1 : -1
    } 
    else if (sort_column == 5) {
      sort["diseCode"] = (sort_order == "asc") ? 1 : -1
    } 
    else if (sort_column == 6) {
      sort["registrationDate"] = (sort_order == "asc") ? 1 : -1
    } 
    
    let columns = [];
    let column = {};
    column.name = "name";
    column.search = requestParam['name'];
    columns.push(column)

    column = {};
    column.name = "phone";
    column.search = requestParam['phonenumber'];
    columns.push(column)

    column = {};
    column.name = "usertype";
    column.search = requestParam['usertype'];
    columns.push(column)

    column = {};
    column.name = "location";
    column.search = requestParam['location'];
    columns.push(column)

    column = {};
    column.name = "pincode";
    column.search = requestParam['pincode'];
    columns.push(column)

    column = {};
    column.name = "registration_date";
    column.search = requestParam['registerat'];
    columns.push(column)

    column = {};
    column.name = "dise_code";
    column.search = requestParam['disecode'];
    columns.push(column)
    
    query["$and"] = [];
    let querysearchand = {};

    for (const column of columns) {
      querysearchand = {};
      if (column.name == "name" && column.search) {
        querysearchand['fullName'] = new RegExp(column.search,"i");
        query["$and"].push(querysearchand)
      }
      if (column.name == "phone" && column.search) {
        querysearchand['phone_number'] = new RegExp(column.search,"i");
        query["$and"].push(querysearchand)
      }
      if (column.name == "usertype" && column.search) {
        querysearchand['usertype'] = new RegExp(column.search,"i");
        query["$and"].push(querysearchand)
      }
      if (column.name == "location" && column.search) {
        querysearchand['location'] = new RegExp(column.search,"i");
        query["$and"].push(querysearchand)
      }
      if (column.name == "pincode" && column.search) {
        querysearchand['pincode'] = new RegExp(column.search,"i");
        query["$and"].push(querysearchand)
      }
      if (column.name == "dise_code" && column.search) {
        querysearchand['diseCode'] = new RegExp(column.search,"i");
        query["$and"].push(querysearchand)
      }
      if (column.name == "registration_date" && column.search) {
        let momentObj = moment(column.search, 'MM-DD-YYYY');
        
        querysearchand['registrationDate'] = {};
        querysearchand['registrationDate']['$gte'] = momentObj.startOf('day').toISOString();
        querysearchand['registrationDate']['$lte'] = momentObj.endOf('day').toISOString();
        query["$and"].push(querysearchand)
      }
    }
    if (query["$and"].length === 0) {
      delete query["$and"];
    } else {
      filteredusers = await User.find(query).count();
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
      queryselect['state.name'] = 1;
      queryselect['district.name'] = 1;
      users = await User.find(query, queryselect).populate('state','name').populate('district','name');
    } else {
      pageNo = (requestParam.page) ? requestParam.page : 1;
      start = (pageNo-1) * perPage;
      end = start + perPage;
      if (sort_order == "asc")
        users = await User.find(query, queryselect).populate('state','name').populate('district','name').sort(sort).limit(perPage).skip(start);
      else
        users = await User.find(query, queryselect).populate('state','name').populate('district','name').sort(sort).limit(perPage).skip(start);
    }
    
    let return_data = {};
    return_data['data'] = users;
    return_data['pageNo'] = pageNo;
    return_data['recordsFiltered'] = filteredusers;
    return_data['recordsTotal'] = totalusers;
    return_data['start'] = parseInt(start) + 1;
    return_data['end'] = (users.length < perPage) ? (parseInt(start)+users.length) : end;
    if (filteredusers%perPage === 0)
      return_data['totalPages'] = parseInt(filteredusers/perPage);
    else
      return_data['totalPages'] = parseInt(filteredusers/perPage) + 1;
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

async function unregisteredusers(req) {
  let requestParam = req.body;
  let sort = {};
  let query = {};
  query['is_new'] = true;
  let totalusers = await User.find(query).count();
  let filteredusers = totalusers;   
  let sort_column = (requestParam.sortby) ? requestParam.sortby : 6;
  let sort_order = (requestParam.sortorder && requestParam.sortorder === "1") ? 'asc' : "desc";
  
  if (sort_column == 1) {
    sort["phone_number"] = (sort_order == "asc") ? 1 : -1
  } 
  else if (sort_column == 2) {
    sort["usertype"] = (sort_order == "asc") ? 1 : -1
  } 
  else if (sort_column == 6) {
    sort["createdDate"] = (sort_order == "asc") ? 1 : -1
  } 
  
  let columns = [];
  column = {};
  column.name = "phone";
  column.search = requestParam['phonenumber'];
  columns.push(column)

  column = {};
  column.name = "usertype";
  column.search = requestParam['usertype'];
  columns.push(column)

  column = {};
  column.name = "registration_date";
  column.search = requestParam['registerat'];
  columns.push(column)
  
  query["$and"] = [];
  let querysearchand = {};

  for (const column of columns) {
    querysearchand = {};
    if (column.name == "phone" && column.search) {
      querysearchand['phone_number'] = new RegExp(column.search,"i");
      query["$and"].push(querysearchand)
    }
    if (column.name == "usertype" && column.search) {
      querysearchand['usertype'] = new RegExp(column.search,"i");
      query["$and"].push(querysearchand)
    }
    if (column.name == "registration_date" && column.search) {
      let momentObj = moment(column.search, 'MM-DD-YYYY');
      
      querysearchand['createdDate'] = {};
      querysearchand['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
      querysearchand['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
      query["$and"].push(querysearchand)
    }
  }
  if (query["$and"].length === 0) {
    delete query["$and"];
  } else {
    filteredusers = await User.find(query).count();
  }
  let perPage = 100;
  let pageNo = 0;
  let start = 0;
  let end = 0;

  let queryselect = {};
  queryselect['phone_number'] = 1;
  queryselect['createdDate'] = 1;
  queryselect['otp'] = 1;
  queryselect['usertype'] = 1;
  let users = {};
  if (requestParam.page === "all") {
    pageNo = "all";
    queryselect['_id'] = 0;
    users = await User.find(query, queryselect);
  } else {
    pageNo = (requestParam.page) ? requestParam.page : 1;
    start = (pageNo-1) * perPage;
    end = start + perPage;
    if (sort_order == "asc")
      users = await User.find(query, queryselect).sort(sort).limit(perPage).skip(start);
    else
      users = await User.find(query, queryselect).sort(sort).limit(perPage).skip(start);
  }
  
  let return_data = {};
  return_data['data'] = users;
  return_data['pageNo'] = pageNo;
  return_data['recordsFiltered'] = filteredusers;
  return_data['recordsTotal'] = totalusers;
  return_data['start'] = parseInt(start) + 1;
  return_data['end'] = (users.length < perPage) ? (parseInt(start)+users.length) : end;
  if (filteredusers%perPage === 0)
    return_data['totalPages'] = parseInt(filteredusers/perPage);
  else
    return_data['totalPages'] = parseInt(filteredusers/perPage) + 1;
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

async function sparks(req) {
  let query = {};
  let querypost = {};
  if (req.query.month_date) {
    let monthdate = req.query.month_date.split("-");
    let year = monthdate[0];
    let month = monthdate[1];
    let startdate = year+"-"+month+"-01T00:00:00.000Z"
    let enddate = year+"-"+(parseInt(month)+1)+"-01T00:00:00.000Z"
    if (parseInt(month) == 12) {
      enddate = (parseInt(year)+1)+"-01-01T00:00:00.000Z"
    } else if (parseInt(month) < 9) {
      enddate = year+"-0"+(parseInt(month)+1)+"-01T00:00:00.000Z"
    }
    let query = {};
    query["createdDate"] = {};
    query["createdDate"]["$gte"] = startdate;
    query["createdDate"]["$lt"] = enddate;
    let querypost = {};
    querypost["createdDate"] = {};
    querypost["createdDate"]["$gte"] = startdate;
    querypost["createdDate"]["$lt"] = enddate;
  }
  teachers = await User.find({"usertype":"spark"}).select("fullName firstName lastName usertype phone_number location pincode empCode diseCode state district block cluster").populate("state","sf_state_id").populate("district","sf_district_id").populate("block","sf_block_id").populate("cluster","sf_cluster_id");
  var teacher_details = [];
  for (const teacher of teachers) {
    query["user"] = teacher.id;
    querypost["author"] = teacher.id;

    textstreamcount = await Textstream.find(querypost).count()
    imagestreamcount = await Imagestream.find(querypost).count()
    videostreamcount = await Videostream.find(querypost).count()
    
    textcommentcount = await Textcomment.find(query).count()
    imagecommentcount = await Imagecomment.find(query).count()
    videocommentcount = await Videocomment.find(query).count()
    sssvideocommentcount = await Sssvideocomment.find(query).count()
    scerttextcommentcount = await Scerttextcomment.find(query).count()
    scertimagecommentcount = await Scertimagecomment.find(query).count()
    scertvideocommentcount = await Scertvideocomment.find(query).count()
    scertpdfcommentcount = await Scertpdfcomment.find(query).count()
    
    textlikecount = await Imagelike.find(query).count()
    imagelikecount = await Videolike.find(query).count()
    videolikecount = await Textlike.find(query).count()
    sssvideolikecount = await Sssvideolike.find(query).count()
    audiolikecount = await Audiolike.find(query).count()
    scertimagelikecount = await Scertimagelike.find(query).count()
    scertvideolikecount = await Scertvideolike.find(query).count()
    scerttextlikecount = await Scerttextlike.find(query).count()
    scertpdflikecount = await Scertpdflike.find(query).count()
    
    videos_played = await Sssvideoplayed.find(query)
    video_played_duration = 0;
    for(const video_played of videos_played) {
      video_played_duration = video_played_duration + parseInt(video_played.duration)
    }
    video_viewed = await Sssvideoviewed.find(query).count()
    total_pdf_viewed = await Documentviewed.find(query).count()
    total_scert_viewed = await Scertsolutionviewed.find(query).count()
    var teacher_detail = {};
    teacher_detail["fullName"] = teacher.fullName;
    teacher_detail["phone_number"] = teacher.phone_number;
    teacher_detail["usertype"] = teacher.usertype;
    teacher_detail["pincode"] = teacher.pincode;
    teacher_detail["empCode"] = teacher.empCode;
    teacher_detail["diseCode"] = teacher.diseCode;
    teacher_detail["state_id"] = (teacher.state && teacher.state.sf_state_id) ? teacher.state.sf_state_id : 0;
    teacher_detail["district_id"] = (teacher.district && teacher.district.sf_district_id) ? teacher.district.sf_district_id : 0;
    teacher_detail["block_id"] = (teacher.block && teacher.block.sf_block_id) ? teacher.block.sf_block_id : 0;
    teacher_detail["cluster_id"] = (teacher.cluster && teacher.cluster.sf_cluster_id) ? teacher.cluster.sf_cluster_id : 0;
    
    teacher_detail["video_viewed"] = (video_played_duration/(60*60)).toFixed(2);
    
    teacher_detail["like_count"] = textlikecount+imagelikecount+videolikecount+sssvideolikecount+audiolikecount+scertimagelikecount+scertvideolikecount+scerttextlikecount+scertpdfcommentcount;
    teacher_detail["comment_count"] = textcommentcount+imagecommentcount+videocommentcount+sssvideocommentcount+scerttextcommentcount+scertimagecommentcount+scertvideocommentcount+scertpdfcommentcount;
    teacher_detail["post_count"] = textstreamcount+imagestreamcount+videostreamcount;
    
    teacher_detail["total_pdf_viewed"] = total_pdf_viewed;
    teacher_detail["total_scert_viewed"] = total_scert_viewed;
    teacher_detail["items_viewed"] = parseInt(video_viewed)+parseInt(total_scert_viewed)+parseInt(total_pdf_viewed);
    
    teacher_details.push(teacher_detail)
  }
  return teacher_details;
}

async function teachers(req) {
  if (!req.query.month_date) {
    var query = {};
    var querypost = {};
  } else {
    var sdate = '2020-03-01T00:00:00.000Z';
    var edate = '2020-04-01T00:00:00.000Z';
    monthdate = req.query.month_date.split("-");
    year = monthdate[0];
    month = monthdate[1];
    startdate = year+"-"+month+"-01T00:00:00.000Z"
    if (parseInt(month) == 12) {
      enddate = (parseInt(year)+1)+"-01-01T00:00:00.000Z"
    } else if (parseInt(month) < 9) {
      enddate = year+"-0"+(parseInt(month)+1)+"-01T00:00:00.000Z"
    } else {
      enddate = year+"-"+(parseInt(month)+1)+"-01T00:00:00.000Z"
    }
    var query = {};
    query["createdDate"] = {};
    query["createdDate"]["$gte"] = startdate;
    query["createdDate"]["$lt"] = enddate;
    var querypost = {};
    querypost["createdDate"] = {};
    querypost["createdDate"]["$gte"] = startdate;
    querypost["createdDate"]["$lt"] = enddate;
  }
  teachers = await User.find({"usertype":"govt teacher"}).select("fullName firstName lastName usertype phone_number location pincode empCode diseCode state district block cluster").populate("state","sf_state_id").populate("district","sf_district_id").populate("block","sf_block_id").populate("cluster","sf_cluster_id");
  var teacher_details = [];
  for (const teacher of teachers) {
    query["user"] = teacher.id;
    querypost["author"] = teacher.id;

    textstreamcount = await Textstream.find(querypost).count()
    imagestreamcount = await Imagestream.find(querypost).count()
    videostreamcount = await Videostream.find(querypost).count()
    
    textcommentcount = await Textcomment.find(query).count()
    imagecommentcount = await Imagecomment.find(query).count()
    videocommentcount = await Videocomment.find(query).count()
    sssvideocommentcount = await Sssvideocomment.find(query).count()
    scerttextcommentcount = await Scerttextcomment.find(query).count()
    scertimagecommentcount = await Scertimagecomment.find(query).count()
    scertvideocommentcount = await Scertvideocomment.find(query).count()
    scertpdfcommentcount = await Scertpdfcomment.find(query).count()
    
    textlikecount = await Imagelike.find(query).count()
    imagelikecount = await Videolike.find(query).count()
    videolikecount = await Textlike.find(query).count()
    sssvideolikecount = await Sssvideolike.find(query).count()
    audiolikecount = await Audiolike.find(query).count()
    scertimagelikecount = await Scertimagelike.find(query).count()
    scertvideolikecount = await Scertvideolike.find(query).count()
    scerttextlikecount = await Scerttextlike.find(query).count()
    scertpdflikecount = await Scertpdflike.find(query).count()
    
    videos_played = await Sssvideoplayed.find(query)
    video_played_duration = 0;
    for(const video_played of videos_played) {
      video_played_duration = video_played_duration + parseInt(video_played.duration)
    }
    video_viewed = await Sssvideoviewed.find(query).count()
    total_pdf_viewed = await Documentviewed.find(query).count()
    total_scert_viewed = await Scertsolutionviewed.find(query).count()
    var teacher_detail = {};
    teacher_detail["fullName"] = teacher.fullName;
    teacher_detail["phone_number"] = teacher.phone_number;
    teacher_detail["usertype"] = teacher.usertype;
    teacher_detail["pincode"] = teacher.pincode;
    teacher_detail["empCode"] = teacher.empCode;
    teacher_detail["diseCode"] = teacher.diseCode;
    teacher_detail["state_id"] = (teacher.state && teacher.state.sf_state_id) ? teacher.state.sf_state_id : 0;
    teacher_detail["district_id"] = (teacher.district && teacher.district.sf_district_id) ? teacher.district.sf_district_id : 0;
    teacher_detail["block_id"] = (teacher.block && teacher.block.sf_block_id) ? teacher.block.sf_block_id : 0;
    teacher_detail["cluster_id"] = (teacher.cluster && teacher.cluster.sf_cluster_id) ? teacher.cluster.sf_cluster_id : 0;
    
    teacher_detail["video_viewed"] = (video_played_duration/(60*60)).toFixed(2);
    
    teacher_detail["like_count"] = textlikecount+imagelikecount+videolikecount+sssvideolikecount+audiolikecount+scertimagelikecount+scertvideolikecount+scerttextlikecount+scertpdfcommentcount;
    teacher_detail["comment_count"] = textcommentcount+imagecommentcount+videocommentcount+sssvideocommentcount+scerttextcommentcount+scertimagecommentcount+scertvideocommentcount+scertpdfcommentcount;
    teacher_detail["post_count"] = textstreamcount+imagestreamcount+videostreamcount;
    
    teacher_detail["total_pdf_viewed"] = total_pdf_viewed;
    teacher_detail["total_scert_viewed"] = total_scert_viewed;
    teacher_detail["items_viewed"] = parseInt(video_viewed)+parseInt(total_scert_viewed)+parseInt(total_pdf_viewed);
    
    teacher_details.push(teacher_detail)
  }
  return teacher_details;
}

