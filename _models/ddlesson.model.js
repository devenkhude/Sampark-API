const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    isActive: { type: Boolean, default: true },
    description: { type: String },
    sortOrder: { type: Number },
    noOfTopics: { type: Number },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ddlesson', schema);
