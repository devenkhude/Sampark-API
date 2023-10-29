const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    streamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    shared_on: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PostShare', schema);