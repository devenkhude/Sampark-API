const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    audio_textbook: { type: mongoose.Schema.Types.ObjectId, ref: 'Audiotextbook' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Qrscan', schema);
