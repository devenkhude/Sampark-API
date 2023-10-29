const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId },
  subject_id: { type: String, default: '', trim: true },
  subject_name: { type: String, default: '', trim: true },
  class_id: { type: mongoose.Schema.Types.ObjectId },
  class_name: { type: String, default: '', trim: true },
  storie_id: { type: mongoose.Schema.Types.ObjectId },
  storie_name: { type: String, default: '', trim: true },
  points: { type: Number, default: 0 },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('tv_stories_progress', schema);
