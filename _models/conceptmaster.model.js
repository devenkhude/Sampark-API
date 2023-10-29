const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    module: { type: String, required: true, default: "sss" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    name: { type: String, required: true },
    is_default: {type: Boolean, default: false},
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Conceptmaster', schema);
