const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    sort_order: { type: Number },
    commentcount: { type: Number, default: 0},
    likecount: { type: Number, default: 0},
    is_shareable: { type: Boolean, default: false },
    linkurl: { type: String, default: "" },
    pschoolUrl: { type: String, default: "" },
    reasonToShare: { type: String, default: "" },//This is for post sharing from SSS - option chose by user while posting
    resourceType:  { type: String, default: "" },//This is for post sharing from SSS - type of resource like Image, PDF, YouTube Video etc
    resourceLink: { type: String, default: "" },//This is for post sharing from SSS - link of resource shared by user
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Textstream', schema);
