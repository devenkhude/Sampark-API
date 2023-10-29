const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    coll: { type: String },
    method: { type: String },
    query: { type: String },
    doc: { type: String },
    logtype: { type: String },
    logdetail: { type: String },
    user: {type: String},
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Log', schema);
