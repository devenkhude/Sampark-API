const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    states: {type: Array},
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    englishspeech_type: { type: String, required: true },
    content: {type: Array},
    name: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Englishspeech', schema);
