const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    device_id: { type: String },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });
//schema.index({ user: 1, document: 1 },{unique: 1});
module.exports = mongoose.model('Documentviewed', schema);
