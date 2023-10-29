const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    pdf: { type: mongoose.Schema.Types.ObjectId, ref: 'Scertpdfstream' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    device_id: { type: String },
    is_liked: { type: Boolean },
    createdDate: { type: Date, default: Date.now }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Scertpdflike', schema);
