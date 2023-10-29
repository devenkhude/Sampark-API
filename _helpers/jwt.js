const expressJwt = require('express-jwt');
const config = require('../config.json');
const userService = require('../users/user.service');
var unless = require('express-unless');
expressJwt.unless = unless

module.exports = jwt;

function jwt() {
    const secret = config.secret;
    console.log("MAIN")
    return expressJwt({ secret, isRevoked }).unless({
        path: [
            // public routes that don't require authentication
            new RegExp('((\/)|(\/v8?\/))users/detail', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/applogin', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/authenticate', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/register', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/verify', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/verify_login', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/update_usertype', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/createotp', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/resend_otp', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/listall', 'i'),
            new RegExp('((\/)|(\/v8?\/))users/avasar', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/comments', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/like', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/resourceviewed', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/lessonunlocked', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/played', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/leadership', 'i'),
            new RegExp('((\/)|(\/v8?\/))useractions/sendcertificate', 'i'),
            new RegExp('((\/)|(\/v8?\/))categories', 'i'),
            new RegExp('((\/)|(\/v8?\/))videos', 'i'),
            new RegExp('((\/)|(\/v8?\/))audios', 'i'),
            new RegExp('((\/)|(\/v8?\/))departments', 'i'),
            new RegExp('((\/)|(\/v8?\/))departments/withsubjects', 'i'),
            new RegExp('((\/)|(\/v8?\/))subjects', 'i'),
            new RegExp('((\/)|(\/v8?\/))subjects/withdepartments', 'i'),
            new RegExp('((\/)|(\/v8?\/))concepts', 'i'),
            new RegExp('((\/)|(\/v8?\/))concepts/withdepartmentsubject', 'i'),
            new RegExp('((\/)|(\/v8?\/))streams', 'i'),
            new RegExp('((\/)|(\/v8?\/))userstreams', 'i'),
            new RegExp('((\/)|(\/v8?\/))scertstreams', 'i'),
            new RegExp('((\/)|(\/v8?\/))documents', 'i'),
            new RegExp('((\/)|(\/v8?\/))scert_solutions', 'i'),
            new RegExp('((\/)|(\/v8?\/))activities', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/updatedistrictstates', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/testfirebase', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/badges', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/updateuserprogress', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/currentlessonorder', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/streamstates', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/streampriority', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/updatelessonprogress', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/updateuserlocations', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/streamcontent', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/imagedimensions', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/videodurations', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/videostreamdurations', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/lessonnos', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/updateviewcounts', 'i'),
            new RegExp('((\/)|(\/v8?\/))crons/certificatehours', 'i'),
            new RegExp('((\/)|(\/v8?\/))notifications', 'i'),
            new RegExp('((\/)|(\/v8?\/))masters/statelist', 'i'),
            new RegExp('((\/)|(\/v8?\/))masters/districtlist', 'i'),
            new RegExp('((\/)|(\/v8?\/))masters/blocklist', 'i'),
            new RegExp('((\/)|(\/v8?\/))masters/clusterlist', 'i'),
            new RegExp('((\/)|(\/v8?\/))masters/designationlist', 'i'),
            new RegExp('((\/)|(\/v8?\/))lessons', 'i'),
            new RegExp('((\/)|(\/v8?\/))lessons/list', 'i'),
            new RegExp('((\/)|(\/v8?\/))tv/list', 'i'),
            new RegExp('((\/)|(\/v8?\/))tv/statedata', 'i'),
            new RegExp('((\/)|(\/v8?\/))tv/assessments', 'i'),
            new RegExp('((\/)|(\/v8?\/))tv/assessmentswithquestions', 'i'),
            new RegExp('((\/)|(\/v8?\/))tv/stories', 'i'),
            new RegExp('((\/)|(\/v8?\/))kits', 'i'),
            new RegExp('((\/)|(\/v8?\/))reports/users', 'i'),
            new RegExp('((\/)|(\/v8?\/))baithakposts/all', 'i'),
            new RegExp('((\/)|(\/v8?\/))baithakposts/forstate', 'i'),
            new RegExp('((\/)|(\/v8?\/))baithakposts/fordistrict', 'i'),
            new RegExp('((\/)|(\/v8?\/))baithakposts/forsamparkdidi', 'i'),
            new RegExp('((\/)|(\/v8?\/))baithakposts/search', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/users', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/userstats', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/userlikes', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/usercomments', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/userposts', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/uservideos', 'i'),
            new RegExp('((\/)|(\/v8?\/))apis/useritems', 'i'),
            new RegExp('((\/)|(\/v8?\/))webassessment/validateSRNumber', 'i'),
            new RegExp('((\/)|(\/v8?\/))webassessment/saveAssessmentResults', 'i'),
            new RegExp('((\/)|(\/v8?\/))webassessment/registerStudent', 'i'),
            new RegExp('((\/)|(\/v8?\/))webassessment/getAssessmentClass', 'i'),
            new RegExp('((\/)|(\/v8?\/))webassessment/getValidIdForDeepLink', 'i'),
            new RegExp('((\/)|(\/v8?\/))sparkles/awardSparkle', 'i'),
            new RegExp('((\/)|(\/v8?\/))videostories/all', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/register', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/designations', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/getDepartmentSubjects', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/getAllWithSubjects', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/statedata', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/checkregistereduser', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/lessondetaillist', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/lessonlist', 'i'),
            new RegExp('((\/)|(\/v8?\/))whatsapp/assessmentswithquestions', 'i'),            
            new RegExp('/users/fcmtoken/(?!delete)([a-z0-9]+)', 'i'),
            new RegExp('/reports/(?!delete)([a-z0-9]+)', 'i'),
            new RegExp('/audios/(?!delete)([a-z0-9]+)', 'i'),
            new RegExp('/videos/(?!delete)([a-z0-9]+)', 'i'),
            new RegExp('/streams/(?!delete)([a-z0-9]+)', 'i'),
            new RegExp('/lessons/(?!delete)([a-z0-9]+)', 'i'),
            new RegExp('/scertstreams/(?!delete)([a-z0-9]+)', 'i'),
            { url: '/', methods: ['GET']  }
        ],
        methods: ['GET']
    });
}

async function isRevoked(req, payload, done) {
    console.log(payload.sub)
    const user = await userService.getById(payload.sub);
    // revoke token if user no longer exists or is blocked
    if (!user || user.is_blocked) {
        return done(null, true);
    }

    done();
};
