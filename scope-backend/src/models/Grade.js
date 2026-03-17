const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  examType: { type: String, enum: ['unit_test', 'midterm', 'final', 'assignment'], required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String },
  remarks: { type: String },
  examDate: { type: Date, required: true },
}, { timestamps: true });

gradeSchema.virtual('percentage').get(function () {
  return ((this.marksObtained / this.totalMarks) * 100).toFixed(2);
});

module.exports = mongoose.model('Grade', gradeSchema);
