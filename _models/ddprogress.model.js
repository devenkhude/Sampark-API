const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    ddlesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Ddlesson' },
    ddtopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Ddtopic' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    setDate: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    updatedDate: { type: Date, default: Date.now },    
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Ddprogress', schema);
