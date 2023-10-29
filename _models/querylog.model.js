const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: {type: String},
    query_string: {type: String},
    final_query: {type: String},
    query_response: {type: String},
    method: { type: String },
    doc: { type: String },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Querylog', schema);
