const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Coursemodule' },
    viewedItemType: { type: String },
    viewedItem: { type: String },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Moduleprogress', schema);
