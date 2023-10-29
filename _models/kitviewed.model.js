const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kit: { type: mongoose.Schema.Types.ObjectId, ref: 'Kit' },
    device_id: { type: String },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });
//schema.index({ user: 1, kit: 1 },{unique: 1});
module.exports = mongoose.model('Kitviewed', schema);
