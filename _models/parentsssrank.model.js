const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    sssTotal: { type: Number },
    sssRank: { type: Number },
    sssindex: { type: Number },
    updatedDate: { type: Date, default: Date.now },
    month: { type: Number },
    year: { type: Number }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Parentsssrank', schema);