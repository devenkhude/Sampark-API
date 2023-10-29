const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  device_id: { type: mongoose.Schema.Types.ObjectId },
  subject_id: { type: String, default: '', trim: true },
  subject_name: { type: String, default: '', trim: true },
  class_id: { type: mongoose.Schema.Types.ObjectId },
  class_name: { type: String, default: '', trim: true },
  assessment_id: { type: mongoose.Schema.Types.ObjectId },
  assessment_name: { type: String, default: '', trim: true },
  percentage: { type: Number, default: 0 },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('tv_assessment_progress', schema);
