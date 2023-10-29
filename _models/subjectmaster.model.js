const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    module: { type: String, required: true, default: "sss" },
    name: { type: String, required: true },
    banner: { type: String },
    icon: { type: String },
    activeicon: { type: String },
    color1: { type: String },
    color2: { type: String },
    color3: { type: String },
    flnClassBg: { type: String },
    related_subjects: {type: Array},
    is_default: {type: Boolean, default: false},
    for_registration: {type: Boolean, default: false},
    registration_name: { type: String },
    sort_order: { type: Number, default: 0},
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Subjectmaster', schema);
