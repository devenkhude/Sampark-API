const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    path: { type: String },
    is_active: { type: Boolean, default: false },
    message: { type: String },
    total_duration: { type: Number, default: 0},
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Certificate', schema);
