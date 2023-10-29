const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdDate: { type: Date, default: Date.now },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Feedbacklike', schema);
