const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user_groups: {type: Array},
    states: {type: Array},
    message: {type: String},
    publishDate: { type: Date, default: Date.now },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Broadcastmessage', schema);
