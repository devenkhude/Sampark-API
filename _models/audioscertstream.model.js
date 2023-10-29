const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    sort_order: { type: Number },
    commentcount: { type: Number, default: 0},
    likecount: { type: Number, default: 0},
    youtube_code: { type: String, required: true },
    thumbnail: { type: String, required: true },
    is_shareable: { type: Boolean, default: false },
    duration: { type: String},
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Audioscertstream', schema);
