const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    video_code: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    name: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    thumbnail: { type: String },
    height: { type: Number, default: 0},
    width: { type: Number, default: 0},
    duration_min: { type: Number, default: 0},
    duration_sec: { type: Number, default: 0},
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    is_active: { type: Boolean, default: true }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Videostory', schema);
