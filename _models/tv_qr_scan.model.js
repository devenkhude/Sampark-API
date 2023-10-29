const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  device_id: { type: String, default: '', trim: true },
  state_id: { type: String, default: 'not got', trim: true },
  state_name: { type: String, default: 'not got', trim: true },
  district_id: { type: String, default: 'not got', trim: true },
  district_name: { type: String, default: 'not got', trim: true },
  block_id: { type: String, default: 'not got', trim: true },
  block_name: { type: String, default: 'not got', trim: true },
  school_id: { type: String, default: 'not got', trim: true },
  school_name: { type: String, default: 'not got', trim: true },
  cluster_id: { type: String, default: 'not got', trim: true },
  cluster_name: { type: String, default: 'not got', trim: true },
  code: { type: String, default: '', trim: true },
  syncMethod : { type: String, default: '', trim: true },
  syncDate : { type: String, default: '', trim: true },
  deviceDateTime: { type: Date, default: Date.now },
  createdDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, default: Date.now },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('tv_qr_scan', schema);
