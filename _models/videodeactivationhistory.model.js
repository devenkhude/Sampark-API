const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    stream_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    youtube_code: { type: String, required: true },
    scheduler_datetime: { type: Date, default: Date.now },
    deactivation_datetime: { type: Date, default: Date.now },
    message: { type: String, required: true },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('VideoDeactivationHistory', schema);
