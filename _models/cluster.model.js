const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: { type: String, required: true },
    code: { type: String },
    sf_cluster_id: { type: Number },
    state_id: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    district_id: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    block_id: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    is_active: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cluster', schema);
