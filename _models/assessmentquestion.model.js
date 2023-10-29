const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
  oldassessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
  question: { type: String, default: "" },
  sentence: { type: String, default: "" },
  options: { type: Object },
  isAudioEnabled: { type: Object },
  correctAnswer: { type: Object },
  isActive: { type: Boolean, default: true },
  question_image: { type: String, default: "" },
  questionType: { type: String, default: "objective" },
  optionType: { type: String, default: "" },
  options_image: { type: Object },
  competency: { type: mongoose.Schema.Types.ObjectId, ref: "Competencymaster" },
  createdDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

schema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Assessmentquestion", schema);
