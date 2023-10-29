const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  assessmentStudentProgress: { type: mongoose.Schema.Types.ObjectId, ref: "Assessmentstudentprogress" },
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
  question: { type: mongoose.Schema.Types.ObjectId, ref: "Assessmentquestion" },
  selectedAnswer: { type: Object },
  correctAnswer: { type: Object },
  type: { type: String, default: "" },
  createdDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

schema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Assessmentstudentanswer", schema);
