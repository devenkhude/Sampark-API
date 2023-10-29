const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    image: { type: mongoose.Schema.Types.ObjectId, ref: 'Scertimagestream' },
    device_id: { type: String },
    comment: { type: String }, 
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Scertimagecomment', schema);
