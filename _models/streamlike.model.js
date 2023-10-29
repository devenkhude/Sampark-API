const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    is_liked: { type: Boolean },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Streamlike', schema);
