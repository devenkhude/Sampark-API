const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    title: { type: String },
    path: { type: String },
    description: { type: String },
    is_active: { type: Boolean },
    expiry: { type: Date },
    applicableFor: { type: String } // teacher, parent, both
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Badge', schema);
