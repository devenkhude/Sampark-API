const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Videocategory', schema);
