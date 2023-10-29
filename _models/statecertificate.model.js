const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    total_duration: { type: Number, default: 0},
    updatedDate: { type: Date },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Statecertificate', schema);
