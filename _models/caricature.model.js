const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    path : { type: String, required: true },    
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Caricature', schema);
