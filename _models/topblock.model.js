const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    diseCode: { type: String },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Topblock', schema);
