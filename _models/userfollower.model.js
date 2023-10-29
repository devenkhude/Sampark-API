const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    follower : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    following : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action : {type: String, default: 'F'},
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Userfollower', schema);
