const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    livesession: { type: mongoose.Schema.Types.ObjectId, ref: 'Livesession' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptance: { type: String },
    isPresent: { type: Boolean },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now }, 
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Livesessionattendance', schema);
