const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    phone_number: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: ""},
    fullName: { type: String, default: ""},    
    otp: { type: String, required: true },
    pincode: { type: String, default: ""},
    diseCode: { type: String, default: ""},
    boardCode: { type: String, default: ""},
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    cluster: { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' },
    designation: { type: mongoose.Schema.Types.ObjectId, ref: 'Designation' },
    empCode: { type: String, default: ""},
    usertype: { type: String, default: ""},
    admintype: { type: String, default: ""},
    language: { type: String, default: ""},
    usergroup: { type: String, default: "field"},
    image: { type: String, default: ""},
    badge: { type: String, default: "0"},
    location: { type: String, default: ""},
    device_id: { type: String, default: ""},
    total_points: { type: Number, default: 0 },
    sss_hours: { type: Number, default: 0 },
    social_hours: { type: Number, default: 0 },
    is_verified: { type: Boolean, default: false },
    is_new: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    scert_access: { type: Boolean, default: false },
    fcm_token: { type: String, default: "" },
    registrationDate: { type: Date },
    updatedDate: { type: Date },
    createdDate: { type: Date, default: Date.now },
    lastLoginDate: { type: Date, default: Date.now },
    noOfCompletedCourses: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    nextRewardMileStone: { type: Number, default: 100 },
    temporary_user: { type: Boolean, default: false },
    avasar_id: { type: String, default: ""},
    classes: { type: Array },
    subjects: { type: Array },
    is_blocked: { type: Boolean, default: false },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', schema);
