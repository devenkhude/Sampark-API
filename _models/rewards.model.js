const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rewardsEarnedAt: { type: Number, default: 0 },
    videoStory: { type: mongoose.Schema.Types.ObjectId, ref: 'Videostory' },
    opened: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Rewards', schema);
