const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    courseTotal: { type: Number },
    courseRank: { type: Number },
    courseindex: { type: Number },
    updatedDate: { type: Date, default: Date.now },
    month: { type: Number },
    year: { type: Number }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Parentcourserank', schema);