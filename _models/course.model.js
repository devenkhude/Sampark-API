const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Departmentmaster' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjectmaster' },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    height: { type: Number, default: 0},
    width: { type: Number, default: 0},
    introductoryTitle: { type: String },
    introductoryDescription: { type: String },
    introductoryDuration: { type: String},
    introductoryImage: { type: String},
    introductoryVideo: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    introductoryAudio: { type: mongoose.Schema.Types.ObjectId, ref: 'Audio' },
    liveSessionExists: { type: Boolean, default: true },
    introductoryImageHeight: { type: Number, default: 0},
    introductoryImageWidth: { type: Number, default: 0},
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    publishedDate: { type: Date },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    rating: { type: Number, default: 0},
    noOfModules: { type: Number, default: 0},
    totalDuration: { type: String},
    certificationGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Certification' },
    createdDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedDate: { type: Date, default: Date.now }, 
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   
    applicable_for: { type: String },
    isNameInHindi: { type: Boolean, default: false },
    isPreInductionCourse: { type: Boolean, default: false },
    englishTitle: { type: String },
    sortOrder: { type: Number, default: 0},
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Course', schema);
