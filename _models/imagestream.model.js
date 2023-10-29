const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    sort_order: { type: Number },
    height: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    commentcount: { type: Number, default: 0 },
    likecount: { type: Number, default: 0 },
    thumbnail: { type: String },
    thumbnails: { type: Array },
    thumbnails_dimensions: { type: Array },
    pdfurl: { type: String, default: "" },
    is_shareable: { type: Boolean, default: false },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Imagestream', schema);
