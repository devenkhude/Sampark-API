const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    audio: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio' },
    duration: { type: String },
    device_id: { type: String },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Audioplayed', schema);
