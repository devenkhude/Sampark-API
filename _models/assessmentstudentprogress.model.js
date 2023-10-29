const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Coursemodule" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
  state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Departmentmaster" },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subjectmaster" },
  correctQuestionCnt: { type: Number, default: 0 },
  totalQuestionCnt: { type: Number, default: 0 },
  entryType: { type: String, default: "" },
  completionDuration: { type: Number, default: 0 },
  countOfStar: { type: Number, default: 0 },
  type: { type: String, default: "" },
  sourceType : {type:String, default:"mobile"}, //mobile or web
  createdDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

schema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Assessmentstudentprogress", schema);
