const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sss: { type: Number },
    baithakLikes: { type: Number },
    baithakComments: { type: Number },
    postFromSSS: { type: Number },
    course: { type: Number },
    assessment: { type: Number },
    digitalDiary: { type: Number },
    training: { type: Number },
    sparkvisit: { type: Number },
    survey: { type: Number },
    stv: { type: Number },
    total: { type: Number },
    updatedDate: { type: Date, default: Date.now },
    month: { type: Number },
    year: { type: Number }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Usersparkle', schema);
