const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    module: { type: String, required: true, default: "sss" },
    name: { type: String, required: true },
    is_default: {type: Boolean, default: false},
    is_fln: {type: Boolean, default: false},
    sort_order: { type: Number, default: 0},
    subjects: {type: Array},
    related_departments: {type: Array},
    for_registration: {type: Boolean, default: false},
    registration_name: { type: String },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Departmentmaster', schema);
