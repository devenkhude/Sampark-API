const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  qr_scan_id: { type: String, default: '', trim: true },
  device_id: { type: String, default: '', trim: true },
  user_dise_code: { type: String, default: 'not got', trim: true },
  state_id: { type: String, default: 'not got', trim: true },
  state_name: { type: String, default: 'not got', trim: true },
  district_id: { type: String, default: 'not got', trim: true },
  district_name: { type: String, default: 'not got', trim: true },
  block_id: { type: String, default: 'not got', trim: true },
  block_name: { type: String, default: 'not got', trim: true },
  school_id: { type: String, default: 'not got', trim: true },
  school_dise_code: { type: String, default: 'not got', trim: true },
  school_name: { type: String, default: 'not got', trim: true },
  cluster_id: { type: String, default: 'not got', trim: true },
  cluster_name: { type: String, default: 'not got', trim: true },
  class_id: { type: String , default: '', trim: true},
  class_name: { type: String, default: '', trim: true },
  subject_id: { type: String, default: 'NA', trim: true },
  subject_name: { type: String, default: 'NA', trim: true },
  total_lesson: { type: Number, default: 0 },
  completed_lessons: { type: Number, default: 0 },
  total_resources: { type: Number, default: 0 },
  completed_resources: { type: Number, default: 0 },
  sparkle_points: { type: Number, default: 0 },
  syncMethod : { type: String, default: '', trim: true },
  deviceDateTime: { type: Date, default: Date.now },
  createdDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, default: Date.now },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('tv_user_progress', schema);
