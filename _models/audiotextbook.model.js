const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    states: {type: Array},
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    audiotextbook_code: { type: String, required: true },
    name: { type: String, required: true },
    module: { type: String, required: true, default: "sss" },
    description: { type: String },
    qrcode: { type: String },
    sort_order: { type: Number },
    url: { type: String },
    thumbnail: { type: String },
    height: { type: Number, default: 0},
    width: { type: Number, default: 0},
    commentcount: { type: Number, default: 0},
    likecount: { type: Number, default: 0},
    viewcount: { type: Number, default: 0},
    duration_min: { type: Number, default: 0},
    duration_sec: { type: Number, default: 0},
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Audiotextbook', schema);
