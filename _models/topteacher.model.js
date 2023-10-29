const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    total: { type: Number },
    year: { type: Number },
    month: { type: Number },
    fullName: { type: String, default: ""},            
    usertype: { type: String, default: ""},
    image: { type: String, default: ""},    
    state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    block: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    diseCode: { type: String, default: ""},    
    updatedDate: { type: Date, default: Date.now },
    ytd_total: { type: Number }
    
    //crown: { type: String },// g - gold, s - silver, b - bronze, d - dot
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Topteacher', schema);