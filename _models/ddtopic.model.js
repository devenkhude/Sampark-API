const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    ddlesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Ddlesson' },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' }, //optional
    kits: {type: Array}, //optional
    videos: {type: Array}, //optional
    audiotextbooks: {type: Array}, //optional
    audios: {type: Array}, //optional
    baithak_videos: {type: Array}, //optional
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, //optional
    worksheet: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, //optional
    lesson_plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, //optional
    progress_chart: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' }, //optional
    noOfDays: { type: Number },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number },
    startDate: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ddtopic', schema);
