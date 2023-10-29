const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    concept: { type: mongoose.Schema.Types.ObjectId, ref: 'Conceptmaster' },
    video_code: { type: String, required: true },
    name: { type: String, required: true },
    module: { type: String, required: true, default: "sss" },
    author: { type: String, required: true },
    description: { type: String },
    social_content: { type: String },
    competency_level: { type: Number, default:0 },
    qrcode: { type: String },
    sort_order: { type: Number },
    is_liked: { type: String },
    url: { type: String },
    thumbnail: { type: String },
    height: { type: Number, default: 0},
    width: { type: Number, default: 0},
    publish_on_social_stream: { type: Boolean, default: false },
    is_shareable: { type: Boolean, default: false },
    states: {type: Array},
    user_groups: {type: Array},
    activity: {type: Array},
    scert_solution: {type: Array},
    worksheet: { type: String },
    sampark_video: { type: String },
    assessment: { type: String },
    lesson_plan: { type: String },
    commentcount: { type: Number, default: 0},
    likecount: { type: Number, default: 0},
    viewcount: { type: Number, default: 0},
    duration_min: { type: Number, default: 0},
    duration_sec: { type: Number, default: 0},
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    is_active: { type: Boolean, default: true },
    video_type: { type: String, required: true, default: "general" },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Video', schema);
