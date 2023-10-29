const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const schema = new Schema({ 
    schoolName :  { type: String, default: "" },
    diseCode : { type: String, default: "" }, 
    state : { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    district : { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
    cluster : { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' },
    block : { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Schooldummy', schema);
