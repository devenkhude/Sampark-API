const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    height: { type: Number, default: 0},
    width: { type: Number, default: 0},
    duration: { type: String },
    worksheets: {type: Array},
    videos: {type: Array},
    sortOrder: { type: Number, default: 0},
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now }, 
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Coursemodule', schema);
