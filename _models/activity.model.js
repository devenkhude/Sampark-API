const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    activity_code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    description: { type: String },
    url: { type: String },
    thumbnail: { type: String },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Activity', schema);
