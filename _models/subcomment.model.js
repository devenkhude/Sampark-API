const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Textcomment' }, { type: mongoose.Schema.Types.ObjectId, ref: 'Imagecomment' }, { type: mongoose.Schema.Types.ObjectId, ref: 'Sssvideocomment' }, { type: mongoose.Schema.Types.ObjectId, ref: 'Audiocomment' }],
    device_id: { type: String },
    comment: { type: String },
    caricatures : { type: Array },
    item_type: { type: String },
    is_active: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Subcomment', schema);
