const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    livesession: { type: mongoose.Schema.Types.ObjectId, ref: 'Livesession' },
    message: { type: String },
    createdDate: { type: Date, default: Date.now },
    topic: { type: String },
    title: { type: String },
    isSent: { type: Boolean, default: true },
    payloadData: { type: Object, default: null}
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Notification', schema);
