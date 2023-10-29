const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    audio: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio' },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });
//schema.index({ user: 1, audio: 1 },{unique: 1});
module.exports = mongoose.model('Audioviewed', schema);
