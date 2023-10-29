const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    item_type: { type: String, required: true },
    item_id: { type: String, required: true },
    user_groups: { type: Array },
    states: { type: Array },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    location: { type: String },
    is_active: { type: Boolean, default: true },
    priority: { type: Number },
    viewcount: { type: Number, default: 0 },
    available_for_aapki_baithak: { type: Boolean, default: false },
    is_sampark_didi_post: { type: Boolean, default: false },
    publishDate: { type: Date, default: Date.now },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    is_deleted: { type: Boolean, default: false },
    is_hidden: { type: Boolean, default: false },
    is_report_abused: { type: Boolean, default: false },
    hidden_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportabused_by: { type: Array },
    is_podcast_post: { type: Boolean, default: false },    
    hashtags: { type: Array },
    diseCode: { type: String }, //Dise Code of the author
    pinCode: { type: String }, //Pin Code of the author
    postOn: { type: String, default:"Baithak" } //Baithak, Balbaithak or Both
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Stream', schema);
