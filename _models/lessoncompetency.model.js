const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    name: { type: String, required: true },
    lesson_no: { type: Number },
    description: { type: String },
    govt_textbook_mapping: { type: String },
    section: { type: String, required: true, default: "sss" },
    states: {type: Array},
    kits: {type: Array},
    videos: {type: Array},
    audiotextbooks: {type: Array},
    audios: {type: Array},
    baithak_videos: {type: Array},
    activities: {type: Array},
    scert_solutions: {type: Array},
    is_active: { type: Boolean, default: true },
    is_launched: { type: Boolean, default: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    worksheet: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    lesson_plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    progress_chart: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    message_type: { type: String },
    message_title: { type: String },
    message_description: { type: String },
    boloId: { type: String },
    suggestedVideos: {type: Array},
    pschoolUrl: { type: String, default: "" },
    are_resources_sequential: { type: Boolean, default: false },
    vocabularyword: { type: mongoose.Schema.Types.ObjectId, ref: 'Englishspeech' },
    vocabularysentence: { type: mongoose.Schema.Types.ObjectId, ref: 'Englishspeech' },
    lessonImage: { type: String, default: "" },
    lessonImageHeight: { type: Number, default: 0},
    lessonImageWidth: { type: Number, default: 0},
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   
    updatedDate: { type: Date, default: Date.now }, 
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Lessoncompetency', schema);
