const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    email: { type: String },
    path: {type: String},
    sent_on_email: { type: Boolean, default: false },
    updatedDate: { type: Date },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Usercertificate', schema);
