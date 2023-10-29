const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    item_type: { type: String, required: true },
    item_id: { type: String, required: true },
    user_groups: {type: Array},
    states: {type: Array},
    is_active: { type: Boolean, default: true },
    priority: { type: Number },
    viewcount: { type: Number, default: 0},
    publishDate: { type: Date, default: Date.now },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Scertstream', schema);
