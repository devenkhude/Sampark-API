const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    videos: {type: Array},
    status: { type: String }, //completed / in-progress
    feedback: { type: String },
    points: { type: Number, default: 0},
    likes: { type: Number, default: 0},
    rating: { type: Number, default: 0},
    enrollDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    feedbackDate: { type: Date },
    updatedDate: { type: Date, default: Date.now }, 
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    feedback_status: { type: String, default: 'active'  }, // active-inactive
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Enrollment', schema);
