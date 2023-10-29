const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    startDate: { type: Date, default: Date.now },
    duration: { type: String },
    message: { type: String },
    bannerText: { type: String },
    url: { type: String },
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },    
    updatedDate: { type: Date, default: Date.now }, 
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Livesession', schema);
