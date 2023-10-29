const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    progress: { type: Number },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });
//schema.index({ user: 1, lesson: 1 },{unique: 1});
module.exports = mongoose.model('Lessonprogress', schema);
