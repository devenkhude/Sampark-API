const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var currentYear = new Date().getFullYear();
var currentMonth = new Date().getMonth() + 1;
var typeArr = ['MT','HT','PT'];

const schema = new Schema({

    parentMobile : { type: Number},
    srnNo : { type: String, default: "" },
    childName : { type: String, default: "" },
    parentName : { type: String, default: "" },
    diseCode : { type: String, default: "" },
    department : { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    modifiedDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', schema);
