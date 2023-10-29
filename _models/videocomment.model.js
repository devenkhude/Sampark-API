const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Videostream' },
    device_id: { type: String },
    comment: { type: String }, 
    caricatures: { type: Array },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Videocomment', schema);
