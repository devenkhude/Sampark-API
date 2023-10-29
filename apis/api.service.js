const db = require('../_helpers/db');
const moment = require('moment');

const User = db.User;
const Imagelike = db.Imagelike;
const Textlike = db.Textlike;
const Videolike = db.Videolike;
const Sssvideolike = db.Sssvideolike;
const Imagecomment = db.Imagecomment;
const Textcomment = db.Textcomment;
const Videocomment = db.Videocomment;
const Sssvideocomment = db.Sssvideocomment;
const Imagestream = db.Imagestream;
const Textstream = db.Textstream;
const Videostream = db.Videostream;
const Videoplayed = db.Videoplayed;
const Sssvideoplayed = db.Sssvideoplayed;
const Documentviewed = db.Documentviewed;
const Scertsolutionviewed = db.Scertsolutionviewed;

module.exports = {
    users,
    userstats,
    userlikes,
    usercomments,
    userposts,
    uservideos,
    useritems,
};

async function users(req) {
    if (req.query.date) {
        let query = {};
        query["is_new"] = false;
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        query['registrationDate'] = {};
        query['registrationDate']['$gte'] = momentObj.startOf('day').toISOString();
        query['registrationDate']['$lte'] = momentObj.endOf('day').toISOString();

        const users = await User.find(query).select("is_new is_verified is_active registrationDate createdDate fullName firstName lastName usertype phone_number location pincode empCode diseCode state district block cluster").populate("state","sf_state_id").populate("district","sf_district_id").populate("block","sf_block_id").populate("cluster","sf_cluster_id");
        
        var user_details = [];
        for (const user of users) {
          var user_detail = {};
          user_detail["fullName"] = user.fullName;
          user_detail["phone_number"] = user.phone_number;
          user_detail["usertype"] = user.usertype;
          user_detail["pincode"] = user.pincode;
          user_detail["empCode"] = user.empCode;
          user_detail["diseCode"] = user.diseCode;
          user_detail["is_verified"] = user.is_verified;
          user_detail["is_new"] = user.is_new;
          user_detail["is_active"] = user.is_active;
          user_detail["created_at"] = user.createdDate;
          user_detail["registration_date"] = user.registrationDate;
          user_detail["state_id"] = (user.state && user.state.sf_state_id) ? user.state.sf_state_id : 0;
          user_detail["district_id"] = (user.district && user.district.sf_district_id) ? user.district.sf_district_id : 0;
          user_detail["block_id"] = (user.block && user.block.sf_block_id) ? user.block.sf_block_id : 0;
          user_detail["cluster_id"] = (user.cluster && user.cluster.sf_cluster_id) ? user.cluster.sf_cluster_id : 0;
          
          user_details.push(user_detail)
        }
        return user_details;
    } else {
        throw "Provide Date"
    }
}

async function userstats(req) {
    if (req.query.date) { //checking if date is provided or not
        let query = {};
        let queryPosts = {};
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        //creating condition for fetching records greater than the start of the provided date and less than the end of that date
        query['user'] = {};
        query['user']['$exists'] = true;
        query['createdDate'] = {};
        query['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        query['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
        
        queryPosts['author'] = {};
        queryPosts['author']['$exists'] = true;
        queryPosts['createdDate'] = {};
        queryPosts['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        queryPosts['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
        
        //fetching total like count on provided date - for each type of four streams
        const imagelikeCount = await Imagelike.countDocuments(query)
        const textlikeCount = await Textlike.countDocuments(query);
        const videolikeCount = await Videolike.countDocuments(query);
        const sssvideolikeCount = await Sssvideolike.countDocuments(query);

        //fetching total comment count on provided date - for each type of four streams
        const imagecommentCount = await Imagecomment.countDocuments(query)
        const textcommentCount = await Textcomment.countDocuments(query);
        const videocommentCount = await Videocomment.countDocuments(query);
        const sssvideocommentCount = await Sssvideocomment.countDocuments(query)

        //calculating total like count on provided date
        const totalLikes = imagelikeCount + textlikeCount + videolikeCount + sssvideolikeCount;
        //calculating total comment count on provided date
        const totalComments = imagecommentCount + textcommentCount + videocommentCount + sssvideocommentCount;

        //fetching image streams likes on provided date and related user phone number
        const imagelikes = await Imagelike.find(query).populate('user','phone_number usertype');
        //fetching text stream likes on provided date and related user phone number
        const textlikes = await Textlike.find(query).populate('user','phone_number usertype');
        //fetching video stream likes on provided date and related user phone number
        const videolikes = await Videolike.find(query).populate('user','phone_number usertype');
        //fetching smart shala video likes on provided date and related user phone number
        const sssvideolikes = await Sssvideolike.find(query).populate('user','phone_number usertype');

        //fetching image stream comments done on provided date and related user phone number
        const imagecomments = await Imagecomment.find(query).populate('user','phone_number usertype');
        //fetching text stream comments done on provided date and related user phone number
        const textcomments = await Textcomment.find(query).populate('user','phone_number usertype');
        //fetching video stream comments done on provided date and related user phone number
        const videocomments = await Videocomment.find(query).populate('user','phone_number usertype');
        //fetching smart shala video comments done on provided date and related user phone number
        const sssvideocomments = await Sssvideocomment.find(query).populate('user','phone_number usertype');
        
        //fetching image streams post created on provided date and related author phone number
        const imagestreams = await Imagestream.find(queryPosts).populate('author','phone_number usertype');
        //fetching text streams post created on provided date and related author phone number
        const textstreams = await Textstream.find(queryPosts).populate('author','phone_number usertype');
        //fetching video streams post created on provided date and related author phone number
        const videostreams = await Videostream.find(queryPosts).populate('author','phone_number usertype');
        
        //fetching video stream played on provided date and related user phone number
        const videoplayeds = await Videoplayed.find(query).populate('user','phone_number usertype');
        //fetching smart shala video played on provided date and related user phone number
        const sssvideoplayeds = await Sssvideoplayed.find(query).populate('user','phone_number usertype');
        
        //fetching document views on provided date and related user phone number
        const documentviews = await Documentviewed.find(query).populate('user','phone_number usertype');
        //fetching scert solution views on provided date and related user phone number
        const scertsolutionviews = await Scertsolutionviewed.find(query).populate('user','phone_number usertype');
        
        let userstats = {};
        for (const like of imagelikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = like['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['likes'] = userstats[phonenumber]['likes'] + 1;
            }
        }
        for (const like of textlikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = like['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['likes'] = userstats[phonenumber]['likes'] + 1;
            }
        }
        for (const like of videolikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = like['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['likes'] = userstats[phonenumber]['likes'] + 1;
            }
        }
        for (const like of sssvideolikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = like['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['likes'] = userstats[phonenumber]['likes'] + 1;
            }
        }

        for (const comment of imagecomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = comment['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['comments'] = userstats[phonenumber]['comments'] + 1;
            }
        }
        for (const comment of textcomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = comment['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['comments'] = userstats[phonenumber]['comments'] + 1;
            }
        }
        for (const comment of videocomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = comment['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['comments'] = userstats[phonenumber]['comments'] + 1;
            }
        }
        for (const comment of sssvideocomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = comment['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['comments'] = userstats[phonenumber]['comments'] + 1;
            }
        }
        
        for (const stream of imagestreams) {
            if (stream['author'] && stream['author']['phone_number']) {
                let phonenumber = stream['author']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = stream['author']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['posts'] = userstats[phonenumber]['posts'] + 1;
            }
        }
        for (const stream of textstreams) {
            if (stream['author'] && stream['author']['phone_number']) {
                let phonenumber = stream['author']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = stream['author']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['posts'] = userstats[phonenumber]['posts'] + 1;
            }
        }
        for (const stream of videostreams) {
            if (stream['author'] && stream['author']['phone_number']) {
                let phonenumber = stream['author']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = stream['author']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['posts'] = userstats[phonenumber]['posts'] + 1;
            }
        }
        
        for (const played of videoplayeds) {
            if (played['user'] && played['user']['phone_number']) {
                let phonenumber = played['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = played['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['videosplayed'] = userstats[phonenumber]['videosplayed'] + parseInt(played['duration']);
            }
        }
        for (const played of sssvideoplayeds) {
            if (played['user'] && played['user']['phone_number']) {
                let phonenumber = played['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = played['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['videosplayed'] = userstats[phonenumber]['videosplayed'] + parseInt(played['duration']);
            }
        }
        
        for (const document of documentviews) {
            if (document['user'] && document['user']['phone_number']) {
                let phonenumber = document['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = document['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['itemsviewed'] = userstats[phonenumber]['itemsviewed'] + 1;
            }
        }
        for (const document of scertsolutionviews) {
            if (document['user'] && document['user']['phone_number']) {
                let phonenumber = document['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = {};
                    userstats[phonenumber]['usertype'] = document['user']['usertype']
                    userstats[phonenumber]['likes'] = 0
                    userstats[phonenumber]['comments'] = 0
                    userstats[phonenumber]['posts'] = 0
                    userstats[phonenumber]['videosplayed'] = 0
                    userstats[phonenumber]['itemsviewed'] = 0
                }
                userstats[phonenumber]['itemsviewed'] = userstats[phonenumber]['itemsviewed'] + 1;
            }
        }
        
        let return_data = {}
        return_data['userstats'] = userstats;
        return_data['totallikes'] = totalLikes;
        return_data['totalcomments'] = totalComments;
        return return_data;
    } else {
        throw "Provide Date"
    }
}

async function userlikes(req) {
    if (req.query.date) { //checking if date is provided or not
        let query = {};
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        //creating condition for fetching records greater than the start of the provided date and less than the end of that date
        query['user'] = {};
        query['user']['$exists'] = true;
        query['createdDate'] = {};
        query['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        query['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
        
        //fetching image streams likes on provided date and related user phone number
        const imagelikes = await Imagelike.find(query).populate('user','phone_number usertype');
        //fetching text stream likes on provided date and related user phone number
        const textlikes = await Textlike.find(query).populate('user','phone_number usertype');
        //fetching video stream likes on provided date and related user phone number
        const videolikes = await Videolike.find(query).populate('user','phone_number usertype');
        //fetching smart shala video likes on provided date and related user phone number
        const sssvideolikes = await Sssvideolike.find(query).populate('user','phone_number usertype');

        let userstats = {};
        for (const like of imagelikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0;
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const like of textlikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const like of videolikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const like of sssvideolikes) {
            if (like['user'] && like['user']['phone_number']) {
                let phonenumber = like['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }

        let return_data = {}
        return_data['userstats'] = userstats;
        return return_data;
    } else {
        throw "Provide Date"
    }
}

async function usercomments(req) {
    if (req.query.date) { //checking if date is provided or not
        let query = {};
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        //creating condition for fetching records greater than the start of the provided date and less than the end of that date
        query['user'] = {};
        query['user']['$exists'] = true;
        query['createdDate'] = {};
        query['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        query['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
        
        //fetching image stream comments done on provided date and related user phone number
        const imagecomments = await Imagecomment.find(query).populate('user','phone_number usertype');
        //fetching text stream comments done on provided date and related user phone number
        const textcomments = await Textcomment.find(query).populate('user','phone_number usertype');
        //fetching video stream comments done on provided date and related user phone number
        const videocomments = await Videocomment.find(query).populate('user','phone_number usertype');
        //fetching smart shala video comments done on provided date and related user phone number
        const sssvideocomments = await Sssvideocomment.find(query).populate('user','phone_number usertype');
        
        let userstats = {};
        for (const comment of imagecomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const comment of textcomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const comment of videocomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const comment of sssvideocomments) {
            if (comment['user'] && comment['user']['phone_number']) {
                let phonenumber = comment['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        
        let return_data = {}
        return_data['userstats'] = userstats;
        return return_data;
    } else {
        throw "Provide Date"
    }
}

async function userposts(req) {
    if (req.query.date) { //checking if date is provided or not
        let queryPosts = {};
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        //creating condition for fetching records greater than the start of the provided date and less than the end of that date
        queryPosts['author'] = {};
        queryPosts['author']['$exists'] = true;
        queryPosts['createdDate'] = {};
        queryPosts['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        queryPosts['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
        
        //fetching image streams post created on provided date and related author phone number
        const imagestreams = await Imagestream.find(queryPosts).populate('author','phone_number usertype');
        //fetching text streams post created on provided date and related author phone number
        const textstreams = await Textstream.find(queryPosts).populate('author','phone_number usertype');
        //fetching video streams post created on provided date and related author phone number
        const videostreams = await Videostream.find(queryPosts).populate('author','phone_number usertype');
        
        let userstats = {};
        for (const stream of imagestreams) {
            if (stream['author'] && stream['author']['phone_number']) {
                let phonenumber = stream['author']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const stream of textstreams) {
            if (stream['author'] && stream['author']['phone_number']) {
                let phonenumber = stream['author']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const stream of videostreams) {
            if (stream['author'] && stream['author']['phone_number']) {
                let phonenumber = stream['author']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        
        let return_data = {}
        return_data['userstats'] = userstats;
        return return_data;
    } else {
        throw "Provide Date"
    }
}

async function uservideos(req) {
    if (req.query.date) { //checking if date is provided or not
        let query = {};
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        //creating condition for fetching records greater than the start of the provided date and less than the end of that date
        query['user'] = {};
        query['user']['$exists'] = true;
        query['createdDate'] = {};
        query['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        query['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
        
        //fetching video stream played on provided date and related user phone number
        const videoplayeds = await Videoplayed.find(query).populate('user','phone_number usertype');
        //fetching smart shala video played on provided date and related user phone number
        const sssvideoplayeds = await Sssvideoplayed.find(query).populate('user','phone_number usertype');
        
        let userstats = {};
        
        for (const played of videoplayeds) {
            if (played['user'] && played['user']['phone_number']) {
                let phonenumber = played['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + parseInt(played['duration']);
            }
        }
        for (const played of sssvideoplayeds) {
            if (played['user'] && played['user']['phone_number']) {
                let phonenumber = played['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + parseInt(played['duration']);
            }
        }
        
        let return_data = {}
        return_data['userstats'] = userstats;
        return return_data;
    } else {
        throw "Provide Date"
    }
}

async function useritems(req) {
    if (req.query.date) { //checking if date is provided or not
        let query = {};
        let monthdate = req.query.date; //.split("-");

        let dateObj = new Date(monthdate);
        let momentObj = moment(dateObj, 'YYYY-MM-DD');

        //creating condition for fetching records greater than the start of the provided date and less than the end of that date
        query['user'] = {};
        query['user']['$exists'] = true;
        query['createdDate'] = {};
        query['createdDate']['$gte'] = momentObj.startOf('day').toISOString();
        query['createdDate']['$lte'] = momentObj.endOf('day').toISOString();
                
        //fetching document views on provided date and related user phone number
        const documentviews = await Documentviewed.find(query).populate('user','phone_number usertype');
        //fetching scert solution views on provided date and related user phone number
        const scertsolutionviews = await Scertsolutionviewed.find(query).populate('user','phone_number usertype');
        
        let userstats = {};
        
        for (const document of documentviews) {
            if (document['user'] && document['user']['phone_number']) {
                let phonenumber = document['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        for (const document of scertsolutionviews) {
            if (document['user'] && document['user']['phone_number']) {
                let phonenumber = document['user']['phone_number'];
                if (!userstats.hasOwnProperty(phonenumber)) {
                    userstats[phonenumber] = 0
                }
                userstats[phonenumber] = userstats[phonenumber] + 1;
            }
        }
        
        let return_data = {}
        return_data['userstats'] = userstats;
        return return_data;
    } else {
        throw "Provide Date"
    }
}

