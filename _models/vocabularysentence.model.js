const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    sentence: { type: String, required: true },
    meaning: { type: String, required: true },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Vocabularysentence', schema);
