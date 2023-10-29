const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    concept: { type: mongoose.Schema.Types.ObjectId, ref: 'Conceptmaster' },
    name: { type: String, required: true },
    pdfname: { type: String },
    pdf: { type: String },
    images: { type: Array },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Kit', schema);
