const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Topschool', schema);
