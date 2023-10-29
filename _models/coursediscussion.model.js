const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    createdDate: { type: Date, default: Date.now },
    status: { type: String, default: 'active'  }, // active-inactive
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Coursediscussion', schema);
