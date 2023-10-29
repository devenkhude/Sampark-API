const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    year: { type: Number },
    month: { type: Number },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Teachersparkle', schema);
