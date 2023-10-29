const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var currentYear = new Date().getFullYear();
var currentMonth = new Date().getMonth() + 1;
var typeArr = ["MT", "HT", "PT"];

const schema = new Schema({
  states: { type: Array },
  districts: { type: Array },
  blocks: { type: Array },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Departmentmaster" },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subjectmaster" },
  chapterNumber: { type: Number, default: 1 },
  lesson: { type: String, default: "" },
  durationType: { type: String, default: "TimeBound" },
  duration: { type: Number, default: 40 },
  displayQuestionsCnt: { type: Number, default: 20 },
  type: { type: Array, default: typeArr },
  assessmentType: { type: String, default: "State" },
  isActive: { type: Boolean, default: true },
  year: { type: Number, default: currentYear },
  month: { type: Number, default: currentMonth },
  level: {
    type: Object,
    default: { Difficult: 30, Moderate: 20, Easy: 10 },
  },
  maxMarks: { type: Number },
  published: { type: Boolean, default: true },
  publishedDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: "" },
  endDate: { type: Date, default: "" },
  createdDate: { type: Date, default: Date.now },
  modifiedDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  suggestedVideos: { type: Array }
});

schema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Assessment", schema);
